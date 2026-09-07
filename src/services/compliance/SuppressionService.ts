import { 
  SuppressionRecord, 
  SuppressionReason, 
  Contact, 
  AuditLog 
} from '../../types';

export interface SuppressionCheckResult {
  isSuppressed: boolean;
  record?: SuppressionRecord;
  reason?: SuppressionReason;
}

export class SuppressionService {
  /**
   * Normalizes an email address for uniform suppression checking.
   * Strips whitespace, lowercase, and handles subaddressing if appropriate.
   */
  public static normalizeEmail(email: string): string {
    if (!email) return '';
    return email.trim().toLowerCase();
  }

  /**
   * Quick check if an email is suppressed
   */
  public static isSuppressed(email: string, list: SuppressionRecord[]): boolean {
    const normalized = this.normalizeEmail(email);
    if (!normalized) return true; // Malformed is treated as suppressed
    return list.some(r => r.email_normalized === normalized);
  }

  /**
   * Detailed check returning the suppression record and reason
   */
  public static checkSuppression(email: string, list: SuppressionRecord[]): SuppressionCheckResult {
    const normalized = this.normalizeEmail(email);
    if (!normalized) {
      return { isSuppressed: true, reason: 'INVALID_EMAIL' };
    }
    const record = list.find(r => r.email_normalized === normalized);
    if (record) {
      return { isSuppressed: true, record, reason: record.reason };
    }
    return { isSuppressed: false };
  }

  /**
   * Adds an email to the global suppression list.
   * If already present, updates the reason/metadata without duplicate records.
   */
  public static suppressEmail(
    params: {
      email: string;
      reason: SuppressionReason;
      source: string;
      metadata?: Record<string, any>;
      suppressionList: SuppressionRecord[];
    }
  ): { updatedList: SuppressionRecord[]; record: SuppressionRecord; isNew: boolean } {
    const normalized = this.normalizeEmail(params.email);
    const existingIndex = params.suppressionList.findIndex(r => r.email_normalized === normalized);

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const existing = params.suppressionList[existingIndex];
      const updated: SuppressionRecord = {
        ...existing,
        reason: params.reason,
        source: params.source,
        suppressed_at: now,
        metadata: {
          ...existing.metadata,
          ...params.metadata,
          previous_reason: existing.reason,
          updated_at: now
        }
      };

      const updatedList = [...params.suppressionList];
      updatedList[existingIndex] = updated;
      return { updatedList, record: updated, isNew: false };
    }

    const newRecord: SuppressionRecord = {
      id: `SUP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email_normalized: normalized,
      reason: params.reason,
      source: params.source,
      suppressed_at: now,
      metadata: params.metadata || {}
    };

    return {
      updatedList: [newRecord, ...params.suppressionList],
      record: newRecord,
      isNew: true
    };
  }

  /**
   * Removes an email from the suppression list (compliance override by authorized admin).
   */
  public static unsuppressEmail(
    email: string,
    adminUser: string,
    reason: string,
    suppressionList: SuppressionRecord[]
  ): { updatedList: SuppressionRecord[]; removedRecord?: SuppressionRecord; success: boolean } {
    const normalized = this.normalizeEmail(email);
    const target = suppressionList.find(r => r.email_normalized === normalized);

    if (!target) {
      return { updatedList: suppressionList, success: false };
    }

    const updatedList = suppressionList.filter(r => r.email_normalized !== normalized);
    return {
      updatedList,
      removedRecord: target,
      success: true
    };
  }

  /**
   * Bulk scan a collection of emails and return a map of suppressed entries
   */
  public static bulkCheck(emails: string[], list: SuppressionRecord[]): Map<string, SuppressionRecord> {
    const suppressedMap = new Map<string, SuppressionRecord>();
    const lookup = new Map<string, SuppressionRecord>(list.map(r => [r.email_normalized, r]));

    for (const email of emails) {
      const norm = this.normalizeEmail(email);
      if (lookup.has(norm)) {
        suppressedMap.set(norm, lookup.get(norm)!);
      }
    }
    return suppressedMap;
  }

  /**
   * CRITICAL BUSINESS RULE:
   * "The suppression list must have higher priority than imports.
   * If an unsubscribed email is imported again: Do not reactivate automatically."
   *
   * Enforces that whenever contacts are imported (via Tally, CSV, API, or Form),
   * any email present in the suppression list remains strictly suppressed,
   * with marketingStatus: 'SUPPRESSED' or 'UNSUBSCRIBED', marketingConsent: false,
   * isSuppressed: true, and cannot be accidentally re-enabled.
   */
  public static sanitizeImportedContacts<T extends Partial<Contact>>(
    importedContacts: T[],
    suppressionList: SuppressionRecord[]
  ): {
    sanitizedContacts: T[];
    suppressedCount: number;
    suppressedEmails: string[];
  } {
    const lookup = new Map<string, SuppressionRecord>(
      suppressionList.map(r => [r.email_normalized, r])
    );

    let suppressedCount = 0;
    const suppressedEmails: string[] = [];

    const sanitizedContacts = importedContacts.map(contact => {
      if (!contact.email) return contact;
      const normalized = this.normalizeEmail(contact.email);
      const suppression = lookup.get(normalized);

      if (suppression) {
        suppressedCount++;
        suppressedEmails.push(contact.email);

        // Enforce absolute suppression: override any active flags in the import payload
        return {
          ...contact,
          isSuppressed: true,
          marketingConsent: false,
          marketingStatus: suppression.reason === 'UNSUBSCRIBED' 
            ? 'UNSUBSCRIBED' 
            : suppression.reason === 'HARD_BOUNCE'
            ? 'BOUNCED'
            : suppression.reason === 'SPAM_COMPLAINT'
            ? 'COMPLAINED'
            : 'SUPPRESSED',
          consentStatus: suppression.reason === 'UNSUBSCRIBED' ? 'unsubscribed' : contact.consentStatus || 'bounced',
          tags: Array.from(new Set([...(contact.tags || []), `Suppressed (${suppression.reason})`]))
        };
      }

      return contact;
    });

    return {
      sanitizedContacts,
      suppressedCount,
      suppressedEmails
    };
  }

  /**
   * Filter contacts into deliverable and suppressed groups
   */
  public static partitionContacts(
    contacts: Contact[],
    suppressionList: SuppressionRecord[]
  ): {
    deliverable: Contact[];
    suppressed: { contact: Contact; reason: SuppressionReason; record?: SuppressionRecord }[];
  } {
    const lookup = new Map<string, SuppressionRecord>(
      suppressionList.map(r => [r.email_normalized, r])
    );

    const deliverable: Contact[] = [];
    const suppressed: { contact: Contact; reason: SuppressionReason; record?: SuppressionRecord }[] = [];

    for (const contact of contacts) {
      const normalized = this.normalizeEmail(contact.email);
      const record = lookup.get(normalized);

      if (record) {
        suppressed.push({ contact, reason: record.reason, record });
      } else if (contact.isSuppressed) {
        suppressed.push({ contact, reason: 'MANUAL' });
      } else if (contact.marketingStatus === 'UNSUBSCRIBED' || contact.consentStatus === 'unsubscribed') {
        suppressed.push({ contact, reason: 'UNSUBSCRIBED' });
      } else if (contact.marketingStatus === 'BOUNCED') {
        suppressed.push({ contact, reason: 'HARD_BOUNCE' });
      } else if (contact.marketingStatus === 'COMPLAINED') {
        suppressed.push({ contact, reason: 'SPAM_COMPLAINT' });
      } else {
        deliverable.push(contact);
      }
    }

    return { deliverable, suppressed };
  }
}
