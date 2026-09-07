import { Contact, ContactSource } from '../types';
import { normalizeEmail, normalizeMobile } from '../utils/contactUtils';

export interface MergeResult {
  mergedContact: Contact;
  archivedContactId: string;
  auditMessage: string;
}

export interface MergeOptions {
  preferPrimaryFields?: boolean;
  overrideEmail?: string;
  overrideMobile?: string;
  mergeNotes?: string;
}

/**
 * ContactMergeService (Frontend mirror of Laravel ContactMergeService)
 * Consolidates two contact records into a unified master profile.
 */
export class ContactMergeService {
  /**
   * Merges secondary contact into primary contact.
   * - Consolidates tags without duplicates
   * - Consolidates source records (ContactSource[])
   * - Backfills empty attributes from secondary
   * - Aggregates communication stats (sent, opened, clicked)
   * - Preserves stricter compliance status or highest opt-in
   */
  public static merge(
    primary: Contact,
    secondary: Contact,
    options: MergeOptions = { preferPrimaryFields: true }
  ): MergeResult {
    // 1. Consolidate tags
    const combinedTags = Array.from(
      new Set([...(primary.tags || []), ...(secondary.tags || [])])
    );

    // 2. Consolidate sources
    const primarySources = primary.sources || [
      {
        id: `SRC-PRIM-${primary.id}`,
        contactId: primary.id,
        sourceType: primary.source || 'MANUAL',
        sourceReference: primary.sourceReference || 'Primary Contact Record',
        importedAt: primary.createdAt
      }
    ];

    const secondarySources = secondary.sources || [
      {
        id: `SRC-SEC-${secondary.id}`,
        contactId: primary.id,
        sourceType: secondary.source || 'MANUAL',
        sourceReference: secondary.sourceReference || `Merged from ${secondary.id}`,
        importedAt: secondary.createdAt
      }
    ];

    const combinedSources: ContactSource[] = [...primarySources];
    for (const secSrc of secondarySources) {
      const exists = combinedSources.some(
        s => s.sourceType === secSrc.sourceType && s.sourceReference === secSrc.sourceReference
      );
      if (!exists) {
        combinedSources.push({
          ...secSrc,
          id: `SRC-MERGED-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          contactId: primary.id
        });
      }
    }

    // 3. Resolve Consent & Marketing Status
    // If either is unsubscribed or suppressed, marketing status must honor opt-out unless explicitly overridden
    const isSuppressed = primary.isSuppressed || secondary.isSuppressed;
    const consentStatus = (primary.consentStatus === 'double_opt_in' || secondary.consentStatus === 'double_opt_in')
      ? 'double_opt_in'
      : (primary.consentStatus === 'unsubscribed' || secondary.consentStatus === 'unsubscribed')
        ? 'unsubscribed'
        : primary.consentStatus;

    const marketingStatus = isSuppressed || consentStatus === 'unsubscribed'
      ? 'UNSUBSCRIBED'
      : (primary.marketingStatus === 'ACTIVE' || secondary.marketingStatus === 'ACTIVE')
        ? 'ACTIVE'
        : primary.marketingStatus;

    // 4. Resolve Email and Mobile
    const resolvedEmail = options.overrideEmail || primary.email || secondary.email;
    const resolvedMobile = options.overrideMobile || primary.mobile || primary.phone || secondary.mobile || secondary.phone;

    // 5. Build merged record
    const mergedContact: Contact = {
      ...primary,
      companyId: primary.companyId || secondary.companyId,
      companyName: primary.companyName || secondary.companyName,
      firstName: primary.firstName || secondary.firstName,
      lastName: primary.lastName || secondary.lastName,
      fullName: (primary.fullName || `${primary.firstName || secondary.firstName} ${primary.lastName || secondary.lastName}`).trim(),
      designation: primary.designation || secondary.designation,
      department: primary.department || secondary.department,
      email: resolvedEmail,
      emailNormalized: normalizeEmail(resolvedEmail),
      phone: resolvedMobile,
      mobile: resolvedMobile,
      mobileNormalized: normalizeMobile(resolvedMobile),
      alternateMobile: primary.alternateMobile || secondary.alternateMobile || (secondary.phone !== primary.phone ? secondary.phone : undefined),
      addressLine1: primary.addressLine1 || secondary.addressLine1,
      addressLine2: primary.addressLine2 || secondary.addressLine2,
      city: primary.city || secondary.city,
      state: primary.state || secondary.state,
      country: primary.country || secondary.country,
      pincode: primary.pincode || secondary.pincode,
      industry: primary.industry || secondary.industry,
      tallyLedgerId: primary.tallyLedgerId || secondary.tallyLedgerId,
      tallyOutstandingBalance: Math.max(primary.tallyOutstandingBalance || 0, secondary.tallyOutstandingBalance || 0),
      tallyOverdueDays: Math.max(primary.tallyOverdueDays || 0, secondary.tallyOverdueDays || 0),
      totalEmailsSent: (primary.totalEmailsSent || 0) + (secondary.totalEmailsSent || 0),
      totalEmailsOpened: (primary.totalEmailsOpened || 0) + (secondary.totalEmailsOpened || 0),
      totalEmailsClicked: (primary.totalEmailsClicked || 0) + (secondary.totalEmailsClicked || 0),
      consentStatus,
      marketingStatus,
      marketingConsent: consentStatus !== 'unsubscribed' && !isSuppressed,
      isSuppressed,
      tags: combinedTags,
      sources: combinedSources,
      updatedAt: new Date().toISOString()
    };

    const auditMessage = `Merged contact ${secondary.id} (${secondary.fullName || secondary.email}) into master record ${primary.id} (${primary.fullName || primary.email}). Combined ${combinedTags.length} tags and ${combinedSources.length} source origins.`;

    return {
      mergedContact,
      archivedContactId: secondary.id,
      auditMessage
    };
  }

  /**
   * Scans an array of contacts for duplicate candidates
   */
  public static findDuplicatePairs(contacts: Contact[]): Array<{
    contactA: Contact;
    contactB: Contact;
    priority: number;
    matchReason: string;
    matchedField: string;
    matchedValue: string;
  }> {
    const pairs: Array<{
      contactA: Contact;
      contactB: Contact;
      priority: number;
      matchReason: string;
      matchedField: string;
      matchedValue: string;
    }> = [];

    const seenPairKeys = new Set<string>();

    for (let i = 0; i < contacts.length; i++) {
      const c1 = contacts[i];
      const c1EmailNorm = normalizeEmail(c1.email);
      const c1MobileNorm = normalizeMobile(c1.mobile || c1.phone);

      for (let j = i + 1; j < contacts.length; j++) {
        const c2 = contacts[j];
        const pairKey = [c1.id, c2.id].sort().join(':::');
        if (seenPairKeys.has(pairKey)) continue;

        const c2EmailNorm = normalizeEmail(c2.email);
        const c2MobileNorm = normalizeMobile(c2.mobile || c2.phone);

        // Priority 1: Email Match
        if (c1EmailNorm && c2EmailNorm && c1EmailNorm === c2EmailNorm) {
          seenPairKeys.add(pairKey);
          pairs.push({
            contactA: c1,
            contactB: c2,
            priority: 1,
            matchReason: 'Identical Normalized Email',
            matchedField: 'email',
            matchedValue: c1EmailNorm
          });
          continue;
        }

        // Priority 2: Mobile Match (E.164)
        if (c1MobileNorm && c2MobileNorm && c1MobileNorm === c2MobileNorm) {
          seenPairKeys.add(pairKey);
          pairs.push({
            contactA: c1,
            contactB: c2,
            priority: 2,
            matchReason: 'Identical E.164 Normalized Mobile',
            matchedField: 'mobile',
            matchedValue: c1MobileNorm
          });
          continue;
        }

        // Priority 3: Same Company + Same Last Name / Exact Designation
        if (
          c1.companyName &&
          c2.companyName &&
          c1.companyName.toLowerCase().trim() === c2.companyName.toLowerCase().trim() &&
          c1.lastName &&
          c2.lastName &&
          c1.lastName.toLowerCase().trim() === c2.lastName.toLowerCase().trim() &&
          c1.firstName.toLowerCase().trim() === c2.firstName.toLowerCase().trim()
        ) {
          seenPairKeys.add(pairKey);
          pairs.push({
            contactA: c1,
            contactB: c2,
            priority: 3,
            matchReason: 'Company and Full Name Match',
            matchedField: 'companyName & fullName',
            matchedValue: `${c1.companyName} (${c1.firstName} ${c1.lastName})`
          });
        }
      }
    }

    return pairs;
  }
}
