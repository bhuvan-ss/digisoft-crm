import { 
  EmailPreference, 
  EmailPreferenceType, 
  SuppressionRecord, 
  Contact 
} from '../types';
import { INITIAL_CONTACTS } from './initialData';

export interface EmailPreferenceDefinition {
  type: EmailPreferenceType;
  label: string;
  description: string;
  badge: string;
  defaultSubscribed: boolean;
}

export const EMAIL_PREFERENCE_DEFINITIONS: EmailPreferenceDefinition[] = [
  {
    type: 'PRODUCT_UPDATES',
    label: 'Product Updates',
    description: 'Feature releases, software updates, Tally connector patches, and performance enhancements.',
    badge: 'Core Updates',
    defaultSubscribed: true
  },
  {
    type: 'PROMOTIONAL_OFFERS',
    label: 'Promotional Offers',
    description: 'Special discounts, multi-license upgrades, seasonal pricing, and exclusive subscriber perks.',
    badge: 'Promotions',
    defaultSubscribed: true
  },
  {
    type: 'NEWSLETTERS',
    label: 'Newsletters',
    description: 'Monthly ERP & GST digests, regulatory finance breakdowns, and enterprise engineering stories.',
    badge: 'Monthly',
    defaultSubscribed: true
  },
  {
    type: 'EVENT_INVITATIONS',
    label: 'Event Invitations',
    description: 'Invitations to virtual tech roundtables, CFO webinars, executive dinners, and annual summits.',
    badge: 'Events & Webinars',
    defaultSubscribed: true
  },
  {
    type: 'FESTIVAL_GREETINGS',
    label: 'Festival Greetings',
    description: 'Diwali, New Year, and cultural festival wishes along with statutory holiday support schedules.',
    badge: 'Occasional',
    defaultSubscribed: true
  },
  {
    type: 'EDUCATIONAL_CONTENT',
    label: 'Educational Content',
    description: 'Step-by-step TallyPrime workflows, accounting compliance whitepapers, and best-practice guides.',
    badge: 'Knowledge Hub',
    defaultSubscribed: true
  }
];

export const INITIAL_SUPPRESSION_LIST: SuppressionRecord[] = [
  {
    id: 'SUP-001',
    email_normalized: 'invalid.mailbox.deb@domain-unreachable.in',
    reason: 'HARD_BOUNCE',
    source: 'WEBHOOK_AMAZON_SES',
    suppressed_at: '2026-08-15T11:20:00Z',
    metadata: {
      diagnostic_code: '550 5.1.1 Recipient address rejected: User unknown in virtual mailbox table',
      bounce_type: 'Permanent',
      esp: 'amazon_ses',
      campaign_id: 'CMP-701'
    }
  },
  {
    id: 'SUP-002',
    email_normalized: 'complaint.filer@corporatemail.co',
    reason: 'SPAM_COMPLAINT',
    source: 'WEBHOOK_BREVO',
    suppressed_at: '2026-08-20T16:40:00Z',
    metadata: {
      complaint_feedback_type: 'abuse',
      feedback_id: 'fbl-brevo-9941a',
      esp: 'brevo',
      ip_address: '185.107.56.21'
    }
  },
  {
    id: 'SUP-003',
    email_normalized: 'unsub.user@fastlogistics.net',
    reason: 'UNSUBSCRIBED',
    source: 'ONE_CLICK_UNSUBSCRIBE',
    suppressed_at: '2026-08-25T09:12:00Z',
    metadata: {
      method: 'RFC_8058_ONE_CLICK',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
      ip_address: '49.207.199.30'
    }
  },
  {
    id: 'SUP-004',
    email_normalized: 'competitor.audit@rivalcorp.com',
    reason: 'MANUAL',
    source: 'MANUAL_ADMIN',
    suppressed_at: '2026-08-30T14:00:00Z',
    metadata: {
      admin_user: 'Lead Systems Architect',
      notes: 'Competitor legal entity - blocked from receiving promotional or financial campaign mailings per compliance policy.'
    }
  },
  {
    id: 'SUP-005',
    email_normalized: 'malformed-user-at-invalid',
    reason: 'INVALID_EMAIL',
    source: 'CSV_IMPORT',
    suppressed_at: '2026-09-01T08:00:00Z',
    metadata: {
      error: 'RFC 5322 syntax failure: missing @ and TLD',
      original_record: 'malformed-user-at-invalid, Sundry Debtor'
    }
  }
];

/**
 * Generate initial email preferences for seeded contacts
 */
export function generateInitialEmailPreferences(contacts: Contact[] = INITIAL_CONTACTS): EmailPreference[] {
  const preferences: EmailPreference[] = [];

  for (const contact of contacts) {
    const isGloballyUnsubscribed = 
      contact.marketingStatus === 'UNSUBSCRIBED' || 
      contact.consentStatus === 'unsubscribed' ||
      contact.isSuppressed;

    for (const def of EMAIL_PREFERENCE_DEFINITIONS) {
      preferences.push({
        id: `PREF-${contact.id}-${def.type}`,
        contact_id: contact.id,
        preference_type: def.type,
        is_subscribed: isGloballyUnsubscribed ? false : def.defaultSubscribed,
        updated_at: contact.updatedAt || new Date().toISOString()
      });
    }
  }

  return preferences;
}

export const INITIAL_EMAIL_PREFERENCES = generateInitialEmailPreferences();
