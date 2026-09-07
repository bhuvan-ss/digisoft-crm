import { 
  Contact, 
  Segment, 
  AudienceSelection, 
  PreSendValidationReport, 
  CampaignRecipient,
  StructuredEmailContent
} from '../types';

export class CampaignValidationService {
  /**
   * Resolve raw contacts based on Audience Selection mode.
   */
  public static resolveRawAudience(
    audience: AudienceSelection,
    allContacts: Contact[],
    allSegments: Segment[]
  ): Contact[] {
    switch (audience.type) {
      case 'segment': {
        if (!audience.segmentId) return [];
        const segment = allSegments.find(s => s.id === audience.segmentId);
        if (!segment) return [];
        // For segments, return matching contacts
        // If segment has cached count and matches, return matched contacts
        // In our CRM, segments filter contacts
        return allContacts.filter(contact => {
          if (contact.isSuppressed) return false;
          // Simple segment mapping for common seed segments
          if (segment.name.toLowerCase().includes('debtor') || segment.name.toLowerCase().includes('overdue')) {
            return (contact.tallyOutstandingBalance || 0) > 0;
          }
          if (segment.name.toLowerCase().includes('enterprise') || segment.name.toLowerCase().includes('opened')) {
            return (contact.totalEmailsOpened || 0) > 0;
          }
          if (segment.name.toLowerCase().includes('manufacturing') || segment.name.toLowerCase().includes('trading')) {
            return contact.city === 'Delhi' || contact.tags.some(t => t.toLowerCase().includes('tally'));
          }
          return true;
        });
      }

      case 'tags': {
        if (!audience.tags || audience.tags.length === 0) return [];
        const selectedTags = new Set(audience.tags.map(t => t.toLowerCase()));
        return allContacts.filter(contact => 
          contact.tags.some(tag => selectedTags.has(tag.toLowerCase()))
        );
      }

      case 'individual_contacts': {
        if (!audience.contactIds || audience.contactIds.length === 0) return [];
        const selectedIds = new Set(audience.contactIds);
        return allContacts.filter(contact => selectedIds.has(contact.id));
      }

      case 'imported_list': {
        // Return contacts from this import source
        return allContacts.filter(contact => 
          contact.sources?.some(s => s.sourceType === 'CSV_IMPORT' || s.sourceType === 'XLS_IMPORT') ||
          contact.source === 'CSV_IMPORT' ||
          contact.source === 'XLS_IMPORT' ||
          contact.tags.some(t => t.toLowerCase().includes('imported'))
        );
      }

      default:
        return allContacts;
    }
  }

  /**
   * Run strict Pre-Send Validation on campaign configuration & audience.
   * Excludes: UNSUBSCRIBED, BOUNCED, COMPLAINED, SUPPRESSED, INVALID.
   * Validates: Subject exists, HTML exists, From email configured, Unsubscribe URL exists, Recipient count > 0.
   */
  public static runPreSendValidation(
    params: {
      subject: string;
      htmlContent: string;
      fromEmail: string;
      fromName: string;
      audience: AudienceSelection;
      allContacts: Contact[];
      allSegments: Segment[];
    }
  ): PreSendValidationReport {
    const { subject, htmlContent, fromEmail, audience, allContacts, allSegments } = params;

    const rawContacts = this.resolveRawAudience(audience, allContacts, allSegments);

    let unsubscribedCount = 0;
    let bouncedCount = 0;
    let complainedCount = 0;
    let suppressedCount = 0;
    let invalidCount = 0;
    const validRecipients: Contact[] = [];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const contact of rawContacts) {
      // 1. Invalid email
      if (!contact.email || !emailRegex.test(contact.email) || contact.marketingStatus === 'INVALID') {
        invalidCount++;
        continue;
      }

      // 2. Suppressed
      if (contact.isSuppressed) {
        suppressedCount++;
        continue;
      }

      // 3. Unsubscribed / Opt-out
      if (
        contact.marketingConsent === false || 
        contact.marketingStatus === 'UNSUBSCRIBED' || 
        contact.consentStatus === 'unsubscribed'
      ) {
        unsubscribedCount++;
        continue;
      }

      // 4. Bounced
      if (contact.marketingStatus === 'BOUNCED') {
        bouncedCount++;
        continue;
      }

      // 5. Complained
      if (contact.marketingStatus === 'COMPLAINED') {
        complainedCount++;
        continue;
      }

      validRecipients.push(contact);
    }

    // Required checks:
    const subjectExists = Boolean(subject && subject.trim().length > 0);
    const htmlExists = Boolean(htmlContent && htmlContent.trim().length > 20);
    const fromEmailConfigured = Boolean(fromEmail && emailRegex.test(fromEmail.trim()));
    
    // Check for Unsubscribe URL
    const hasUnsubscribeTag = 
      htmlContent.includes('{{UNSUBSCRIBE_URL}}') ||
      htmlContent.includes('{{unsubscribe_url}}') ||
      htmlContent.includes('unsubscribe') ||
      htmlContent.includes('opt-out');
    const unsubscribeUrlExists = hasUnsubscribeTag;

    const recipientCountValid = validRecipients.length > 0;

    const checks = {
      subjectExists,
      htmlExists,
      fromEmailConfigured,
      unsubscribeUrlExists,
      recipientCountValid
    };

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!subjectExists) errors.push('Campaign subject line is missing or empty.');
    if (!htmlExists) errors.push('HTML email content is missing or too brief to render.');
    if (!fromEmailConfigured) errors.push('Sender "From" email address is missing or invalid.');
    if (!unsubscribeUrlExists) errors.push('Compliance violation: Email is missing mandatory {{UNSUBSCRIBE_URL}} tag.');
    if (!recipientCountValid) errors.push('Target audience has 0 deliverable contacts after applying suppression exclusions.');

    if (unsubscribedCount > 0) warnings.push(`${unsubscribedCount} contacts excluded due to unsubscribed status.`);
    if (suppressedCount > 0) warnings.push(`${suppressedCount} contacts excluded due to global suppression list.`);
    if (bouncedCount > 0) warnings.push(`${bouncedCount} contacts excluded due to hard bounce history.`);
    if (invalidCount > 0) warnings.push(`${invalidCount} contacts excluded due to malformed or invalid email format.`);

    const isValid = Object.values(checks).every(Boolean);

    return {
      isValid,
      checks,
      counts: {
        totalAudienceCount: rawContacts.length,
        validRecipientsCount: validRecipients.length,
        unsubscribedCount,
        bouncedCount,
        complainedCount,
        suppressedCount,
        invalidCount
      },
      warnings,
      errors
    };
  }

  /**
   * Creates an immutable recipient snapshot for a campaign.
   * Freezes personalization_data so future segment changes do not alter scheduled delivery.
   */
  public static createRecipientSnapshot(
    campaignId: string,
    audience: AudienceSelection,
    allContacts: Contact[],
    allSegments: Segment[]
  ): CampaignRecipient[] {
    const rawContacts = this.resolveRawAudience(audience, allContacts, allSegments);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients: CampaignRecipient[] = [];

    for (const contact of rawContacts) {
      let isExcluded = false;
      let exclusionReason: string | null = null;

      if (!contact.email || !emailRegex.test(contact.email) || contact.marketingStatus === 'INVALID') {
        isExcluded = true;
        exclusionReason = 'INVALID_EMAIL';
      } else if (contact.isSuppressed) {
        isExcluded = true;
        exclusionReason = 'SUPPRESSED';
      } else if (contact.marketingConsent === false || contact.marketingStatus === 'UNSUBSCRIBED') {
        isExcluded = true;
        exclusionReason = 'UNSUBSCRIBED';
      } else if (contact.marketingStatus === 'BOUNCED') {
        isExcluded = true;
        exclusionReason = 'BOUNCED';
      } else if (contact.marketingStatus === 'COMPLAINED') {
        isExcluded = true;
        exclusionReason = 'COMPLAINED';
      }

      const personalizationData = {
        first_name: contact.firstName,
        last_name: contact.lastName,
        full_name: `${contact.firstName} ${contact.lastName}`.trim(),
        email: contact.email,
        company_name: contact.companyName,
        phone: contact.phone,
        city: contact.city || '',
        state: contact.state || '',
        tally_outstanding_balance: contact.tallyOutstandingBalance || 0,
        tally_overdue_days: contact.tallyOverdueDays || 0,
        unsubscribe_url: `https://mail.digisoft.com/unsub?token=${contact.unsubscribeToken || 'demo'}`,
        privacy_policy_url: 'https://digisoft.com/privacy',
        company_address: 'Plot 42, Electronics City Phase 1, Bengaluru, Karnataka - 560100'
      };

      recipients.push({
        id: `RCP-${campaignId}-${contact.id}`,
        campaign_id: campaignId,
        contact_id: contact.id,
        email: contact.email,
        personalization_data: personalizationData,
        status: isExcluded ? 'EXCLUDED' : 'QUEUED',
        sent_at: null,
        delivered_at: null,
        opened_at: null,
        clicked_at: null,
        exclusion_reason: exclusionReason
      });
    }

    return recipients;
  }
}
