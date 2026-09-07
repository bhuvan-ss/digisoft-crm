import { Contact, Company, ContactSource, TagItem, MarketingStatus } from '../types';

/**
 * Normalizes email address for consistent indexing & deduplication.
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Normalizes phone/mobile number to E.164 international format standard.
 * Defaults to +91 for 10-digit Indian numbers if no country code provided.
 */
export function normalizeMobile(phone: string): string {
  if (!phone) return '';
  // Remove all spaces, brackets, hyphens, dots
  let cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, '');
  
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  } else if (!cleaned.startsWith('+')) {
    // If it's a 10 digit Indian number starting with 6, 7, 8, 9
    if (/^[6-9]\d{9}$/.test(cleaned)) {
      cleaned = '+91' + cleaned;
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = '+91' + cleaned.slice(1);
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = '+' + cleaned;
    }
  }
  return cleaned;
}

export interface DuplicateDetectionResult {
  hasDuplicate: boolean;
  priority: 1 | 2 | 3 | null;
  matchReason: string | null;
  existingContact: Contact | null;
  ruleDescription: string | null;
}

/**
 * Enterprise 3-Tier Priority Duplicate Detector
 * Priority 1: Normalized Email match
 * Priority 2: Normalized Mobile match
 * Priority 3: Company GSTIN match
 */
export function detectDuplicateContact(
  candidate: { email?: string; mobile?: string; companyId?: string; companyGstin?: string },
  contacts: Contact[],
  companies: Company[],
  excludeContactId?: string
): DuplicateDetectionResult {
  const normEmail = normalizeEmail(candidate.email || '');
  const normMobile = normalizeMobile(candidate.mobile || '');

  // Priority 1: Normalized email match
  if (normEmail) {
    const emailMatch = contacts.find(c => 
      c.id !== excludeContactId &&
      !c.deletedAt &&
      normalizeEmail(c.email) === normEmail
    );
    if (emailMatch) {
      return {
        hasDuplicate: true,
        priority: 1,
        matchReason: `Exact Normalized Email Match: "${normEmail}"`,
        existingContact: emailMatch,
        ruleDescription: 'Priority 1: Normalized email matches an existing active contact record.'
      };
    }
  }

  // Priority 2: Normalized mobile match
  if (normMobile) {
    const mobileMatch = contacts.find(c => 
      c.id !== excludeContactId &&
      !c.deletedAt &&
      normalizeMobile(c.mobile || c.phone || '') === normMobile
    );
    if (mobileMatch) {
      return {
        hasDuplicate: true,
        priority: 2,
        matchReason: `Normalized Mobile Match: "${normMobile}"`,
        existingContact: mobileMatch,
        ruleDescription: 'Priority 2: Normalized mobile number matches an existing active contact.'
      };
    }
  }

  // Priority 3: Company GSTIN match
  if (candidate.companyGstin || candidate.companyId) {
    let targetGstin = candidate.companyGstin?.trim().toUpperCase();
    if (!targetGstin && candidate.companyId) {
      const comp = companies.find(c => c.id === candidate.companyId);
      targetGstin = comp?.gstin?.trim().toUpperCase();
    }

    if (targetGstin) {
      // Check if another contact belongs to a company with the exact same GSTIN
      const matchingCompany = companies.find(c => c.gstin?.trim().toUpperCase() === targetGstin);
      if (matchingCompany) {
        const contactWithSameGstin = contacts.find(c => 
          c.id !== excludeContactId &&
          !c.deletedAt &&
          c.companyId === matchingCompany.id
        );
        if (contactWithSameGstin) {
          return {
            hasDuplicate: true,
            priority: 3,
            matchReason: `Company GSTIN Match: "${targetGstin}" (${matchingCompany.name})`,
            existingContact: contactWithSameGstin,
            ruleDescription: 'Priority 3: Associated with the same registered business GSTIN organization.'
          };
        }
      }
    }
  }

  return {
    hasDuplicate: false,
    priority: null,
    matchReason: null,
    existingContact: null,
    ruleDescription: null
  };
}

export const INITIAL_TAGS: TagItem[] = [
  { id: 'TAG-1', name: 'TallyPrime Customer', color: 'indigo', slug: 'tallyprime-customer', description: 'Active customer synced from TallyPrime debtor ledgers' },
  { id: 'TAG-2', name: 'Tally on Cloud', color: 'sky', slug: 'tally-on-cloud', description: 'Hosted Tally on AWS/Azure private cloud' },
  { id: 'TAG-3', name: 'Prospect', color: 'amber', slug: 'prospect', description: 'Pre-sales lead or inbound inquiry' },
  { id: 'TAG-4', name: 'Existing Customer', color: 'emerald', slug: 'existing-customer', description: 'Contracted customer with active license' },
  { id: 'TAG-5', name: 'Dealer', color: 'purple', slug: 'dealer', description: 'Authorized reseller or solution partner' },
  { id: 'TAG-6', name: 'High Value', color: 'rose', slug: 'high-value', description: 'Annual contract value > ₹5,00,000' },
  { id: 'TAG-7', name: 'Delhi NCR', color: 'teal', slug: 'delhi-ncr', description: 'Located in Delhi, Noida, or Gurugram territory' },
  { id: 'TAG-8', name: 'GST Customer', color: 'blue', slug: 'gst-customer', description: 'Verified 15-character GSTIN registered business' },
  { id: 'TAG-9', name: 'Decision Maker', color: 'violet', slug: 'decision-maker', description: 'Director, MD, CXO, or Procurement Head' },
  { id: 'TAG-10', name: 'Sundry Debtor', color: 'orange', slug: 'sundry-debtor', description: 'Ledger classified under Sundry Debtors in Tally' },
];
