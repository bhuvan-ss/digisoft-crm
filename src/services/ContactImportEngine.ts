import { 
  Contact, 
  DuplicateHandlingOption, 
  ImportErrorItem, 
  ImportMappingItem, 
  ImportRecord, 
  ImportStatus, 
  ImportSummaryStats, 
  TransformationRule,
  SuppressionRecord
} from '../types';
import { SuppressionService } from './compliance/SuppressionService';

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ChunkProgressEvent {
  processed: number;
  successful: number;
  failed: number;
  duplicates: number;
  updated: number;
  currentChunk: number;
  totalChunks: number;
  percentage: number;
  throughputRowsPerSec: number;
  currentErrors: ImportErrorItem[];
  logMessage: string;
}

export interface AutoDetectedMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  transformationRule: TransformationRule;
}

/**
 * Standard alias dictionary for auto-column mapping
 */
const ALIAS_MAP: Record<string, string[]> = {
  full_name: ['name', 'full name', 'fullname', 'contact name', 'customer name', 'contact person', 'party name', 'lead name'],
  first_name: ['first name', 'firstname', 'fname', 'given name'],
  last_name: ['last name', 'lastname', 'lname', 'surname', 'family name'],
  email: ['email', 'email id', 'email address', 'mail', 'work email', 'primary email', 'e-mail', 'e_mail'],
  mobile: ['mobile', 'mobile no', 'mobile number', 'phone', 'phone no', 'phone number', 'contact no', 'cell', 'whatsapp no', 'cell phone'],
  company_name: ['company', 'company name', 'organization', 'org name', 'account name', 'firm name', 'party', 'ledger name', 'client'],
  gstin: ['gst no', 'gstin', 'gst number', 'tax id', 'gst', 'tin', 'vat no'],
  designation: ['designation', 'job title', 'title', 'role', 'position'],
  department: ['department', 'dept', 'division'],
  city: ['city', 'location', 'town', 'station'],
  state: ['state', 'province', 'region'],
  country: ['country', 'nation'],
  pincode: ['pincode', 'pin code', 'postal code', 'zip', 'zipcode'],
  outstanding_balance: ['balance', 'outstanding', 'outstanding balance', 'closing balance', 'due amount', 'ledger balance'],
  tags: ['tags', 'category', 'segment', 'group', 'tag', 'labels'],
};

/**
 * Auto-detect column mappings based on headers
 */
export function autoDetectColumnMappings(headers: string[]): Record<string, AutoDetectedMapping> {
  const result: Record<string, AutoDetectedMapping> = {};
  const assignedTargets = new Set<string>();

  headers.forEach((header) => {
    const norm = header.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    let bestTarget = '';
    let highestScore = 0;
    let suggestedRule: TransformationRule = 'trim';

    for (const [target, aliases] of Object.entries(ALIAS_MAP)) {
      if (assignedTargets.has(target) && target === 'email') continue;

      for (const alias of aliases) {
        if (norm === alias) {
          if (100 > highestScore) {
            highestScore = 100;
            bestTarget = target;
          }
        } else if (norm.includes(alias) || alias.includes(norm)) {
          if (80 > highestScore) {
            highestScore = 80;
            bestTarget = target;
          }
        }
      }
    }

    if (bestTarget && highestScore >= 70) {
      assignedTargets.add(bestTarget);
      if (bestTarget === 'email') suggestedRule = 'lowercase';
      else if (bestTarget === 'mobile') suggestedRule = 'e164_mobile';
      else if (bestTarget === 'gstin') suggestedRule = 'uppercase';
      else if (bestTarget === 'outstanding_balance') suggestedRule = 'decimal_sanitize';
      else if (bestTarget === 'full_name') suggestedRule = 'split_name';

      result[header] = {
        sourceColumn: header,
        targetField: bestTarget,
        confidence: highestScore,
        transformationRule: suggestedRule,
      };
    } else {
      result[header] = {
        sourceColumn: header,
        targetField: '',
        confidence: 0,
        transformationRule: 'trim',
      };
    }
  });

  return result;
}

/**
 * Apply column transformation rules
 */
export function applyTransformation(value: any, rule: TransformationRule): any {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();

  switch (rule) {
    case 'lowercase':
      return str.toLowerCase();
    case 'uppercase':
      return str.toUpperCase();
    case 'e164_mobile':
      return normalizeIndianMobile(str);
    case 'decimal_sanitize': {
      const cleaned = str.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    case 'trim':
    default:
      return str;
  }
}

/**
 * Normalize Indian mobile numbers: removes spaces, country code +91 or 91, returns 10 digits or formatted
 */
export function normalizeIndianMobile(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('91') && digits.length === 12) {
    return `+91${digits.slice(2)}`;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return `+91${digits.slice(1)}`;
  }
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91${digits}`;
  }
  if (digits.length >= 7) {
    return `+${digits}`;
  }
  return digits;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
  sanitized: Record<string, any>;
}

/**
 * Contact data validation for incoming row
 */
export function validateContactRow(mapped: Record<string, any>, rowNumber: number): ValidationResult {
  const errors: Array<{ field: string; message: string }> = [];
  const sanitized = { ...mapped };

  // 1. Email validation
  const rawEmail = String(mapped.email || '').trim();
  if (rawEmail) {
    const cleanEmail = rawEmail.toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      errors.push({ field: 'email', message: `Invalid email syntax: "${rawEmail}"` });
    } else {
      sanitized.email = cleanEmail;
      sanitized.emailNormalized = cleanEmail;
    }
  } else {
    sanitized.email = '';
    sanitized.emailNormalized = '';
  }

  // 2. Mobile validation
  const rawMobile = String(mapped.mobile || '').trim();
  if (rawMobile) {
    const normalizedMobile = normalizeIndianMobile(rawMobile);
    const digitsOnly = normalizedMobile.replace(/\D/g, '');
    if (digitsOnly.length >= 10) {
      sanitized.mobile = normalizedMobile;
      sanitized.mobileNormalized = normalizedMobile;
      sanitized.phone = normalizedMobile;
    } else {
      errors.push({ field: 'mobile', message: `Invalid mobile number: "${rawMobile}" (Must be 10 digits)` });
    }
  } else {
    sanitized.mobile = '';
    sanitized.mobileNormalized = '';
  }

  // 3. Mandatory Requirement Check: At least one of Email or Mobile MUST exist!
  if (!sanitized.email && !sanitized.mobile) {
    errors.push({
      field: 'contact_identifier',
      message: `Row ${rowNumber} rejected: At least one of Email or Mobile number must be provided.`,
    });
  }

  // 4. GSTIN validation if provided
  const rawGstin = String(mapped.gstin || '').toUpperCase().trim();
  if (rawGstin) {
    if (!GSTIN_REGEX.test(rawGstin)) {
      errors.push({
        field: 'gstin',
        message: `Invalid GSTIN format: "${rawGstin}". Must be 15-character format (e.g. 29AAACA1234F1Z5).`,
      });
    } else {
      sanitized.gstin = rawGstin;
    }
  }

  // 5. Name handling
  let firstName = String(mapped.first_name || '').trim();
  let lastName = String(mapped.last_name || '').trim();
  const fullName = String(mapped.full_name || '').trim();

  if (!firstName && fullName) {
    const parts = fullName.split(' ');
    firstName = parts[0];
    lastName = parts.slice(1).join(' ');
  }

  sanitized.firstName = firstName || (mapped.company_name ? `Contact @ ${mapped.company_name}` : 'Contact');
  sanitized.lastName = lastName || '';
  sanitized.fullName = `${sanitized.firstName} ${sanitized.lastName}`.trim();

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
}

/**
 * High-performance streaming client import processor.
 * Processes large arrays in discrete chunks to avoid locking the UI thread.
 */
export class ContactImportProcessor {
  private isPaused = false;
  private isCancelled = false;

  public async processInChunks(
    rawRows: Record<string, any>[],
    mappings: Record<string, ImportMappingItem>,
    existingContacts: Contact[],
    importRecord: ImportRecord,
    chunkSize = 500,
    onProgress: (event: ChunkProgressEvent) => void,
    suppressionList: SuppressionRecord[] = []
  ): Promise<{
    importedContacts: Contact[];
    updatedContacts: Contact[];
    allErrors: ImportErrorItem[];
    summary: ImportSummaryStats;
  }> {
    this.isPaused = false;
    this.isCancelled = false;

    const totalRows = rawRows.length;
    const totalChunks = Math.ceil(totalRows / chunkSize);
    const startTime = Date.now();

    const importedContacts: Contact[] = [];
    const updatedContacts: Contact[] = [];
    const allErrors: ImportErrorItem[] = [];

    // Pre-build index maps for O(1) duplicate lookups
    const emailIndex = new Map<string, Contact>();
    const mobileIndex = new Map<string, Contact>();

    for (const c of existingContacts) {
      if (c.email) emailIndex.set(c.email.toLowerCase().trim(), c);
      if (c.emailNormalized) emailIndex.set(c.emailNormalized.toLowerCase().trim(), c);
      const cleanMobile = (c.mobileNormalized || c.mobile || c.phone || '').replace(/\D/g, '');
      if (cleanMobile) mobileIndex.set(cleanMobile.slice(-10), c);
    }

    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    let duplicateCount = 0;
    let updatedCount = 0;

    for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
      if (this.isCancelled) {
        break;
      }

      while (this.isPaused) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      const chunkStart = chunkIdx * chunkSize;
      const chunkEnd = Math.min(chunkStart + chunkSize, totalRows);
      const currentChunkRows = rawRows.slice(chunkStart, chunkEnd);
      const chunkErrors: ImportErrorItem[] = [];

      // Process chunk
      for (let i = 0; i < currentChunkRows.length; i++) {
        const rawRow = currentChunkRows[i];
        const rowNumber = chunkStart + i + 2; // header is row 1
        processedCount++;

        // 1. Apply column mappings
        const mappedRecord: Record<string, any> = {};
        for (const [colName, val] of Object.entries(rawRow)) {
          const mapping = mappings[colName];
          if (mapping && mapping.targetField) {
            mappedRecord[mapping.targetField] = applyTransformation(val, mapping.transformationRule);
          }
        }

        // 2. Validate Row Data
        const validation = validateContactRow(mappedRecord, rowNumber);
        if (!validation.isValid) {
          failedCount++;
          validation.errors.forEach((err) => {
            const errItem: ImportErrorItem = {
              id: `err-${importRecord.id}-${rowNumber}-${err.field}`,
              importId: importRecord.id,
              rowNumber,
              fieldName: err.field,
              errorMessage: err.message,
              rawData: rawRow,
              createdAt: new Date().toISOString(),
            };
            chunkErrors.push(errItem);
            allErrors.push(errItem);
          });
          continue;
        }

        const clean = validation.sanitized;

        // 3. Deduplication check
        const normEmail = clean.emailNormalized || '';
        const cleanDigits = (clean.mobileNormalized || '').replace(/\D/g, '').slice(-10);

        const existing = (normEmail && emailIndex.get(normEmail)) || (cleanDigits && mobileIndex.get(cleanDigits));

        if (existing) {
          duplicateCount++;
          const strategy = importRecord.duplicateHandling;

          if (strategy === 'SKIP') {
            // Skipped duplicate, no modification
            continue;
          }

          if (strategy === 'POTENTIAL_DUPLICATE') {
            // Create flagged duplicate
            const newContact = this.createNewContactRecord(clean, importRecord, rowNumber, true, existing.id, suppressionList);
            importedContacts.push(newContact);
            successCount++;
            continue;
          }

          // UPDATE or MERGE strategy
          const updated = this.safelyUpdateExisting(existing, clean, importRecord, strategy === 'MERGE', suppressionList);
          updatedContacts.push(updated);
          updatedCount++;

          // Update lookup cache
          if (normEmail) emailIndex.set(normEmail, updated);
          if (cleanDigits) mobileIndex.set(cleanDigits, updated);
        } else {
          // Brand new contact
          const newContact = this.createNewContactRecord(clean, importRecord, rowNumber, false, undefined, suppressionList);
          importedContacts.push(newContact);
          successCount++;

          // Add to index
          if (normEmail) emailIndex.set(normEmail, newContact);
          if (cleanDigits) mobileIndex.set(cleanDigits, newContact);
        }
      }

      // Calculate progress and throughput
      const elapsedSec = Math.max(0.1, (Date.now() - startTime) / 1000);
      const throughput = Math.round(processedCount / elapsedSec);
      const percentage = Math.min(100, Math.round((processedCount / totalRows) * 100));

      onProgress({
        processed: processedCount,
        successful: successCount,
        failed: failedCount,
        duplicates: duplicateCount,
        updated: updatedCount,
        currentChunk: chunkIdx + 1,
        totalChunks,
        percentage,
        throughputRowsPerSec: throughput,
        currentErrors: chunkErrors,
        logMessage: `Chunk ${chunkIdx + 1}/${totalChunks} processed (${chunkEnd - chunkStart} records, ${throughput} rows/sec)`,
      });

      // Yield thread to maintain 60 FPS responsiveness
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const durationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const finalThroughput = Math.round(processedCount / durationSeconds);

    const summary: ImportSummaryStats = {
      total: totalRows,
      processed: processedCount,
      successful: successCount,
      failed: failedCount,
      duplicate: duplicateCount,
      updated: updatedCount,
      durationSeconds,
      throughputRowsPerSec: finalThroughput,
      status: this.isCancelled ? 'CANCELLED' : 'COMPLETED',
      completedAt: new Date().toISOString(),
    };

    return {
      importedContacts,
      updatedContacts,
      allErrors,
      summary,
    };
  }

  /**
   * Safely enrich or merge into existing contact.
   * CRITICAL COMPLIANCE SAFEGUARD:
   * NEVER overwrite UNSUBSCRIBED, BOUNCED, COMPLAINED, or SUPPRESSED marketing statuses!
   */
  private safelyUpdateExisting(
    existing: Contact,
    incoming: Record<string, any>,
    importRecord: ImportRecord,
    isMerge = false,
    suppressionList: SuppressionRecord[] = []
  ): Contact {
    const targetEmail = (incoming.emailNormalized || incoming.email || existing.email || '').toLowerCase().trim();
    const isSuppressedInGlobalList = SuppressionService.isSuppressed(targetEmail, suppressionList);

    const protectedStatuses = ['UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED', 'SUPPRESSED'];
    const isProtected = protectedStatuses.includes(existing.marketingStatus?.toUpperCase() || '') || 
                        existing.isSuppressed || 
                        isSuppressedInGlobalList;

    const incomingTags = Array.isArray(incoming.tags) 
      ? incoming.tags 
      : (incoming.tags ? String(incoming.tags).split(',').map((t: string) => t.trim()) : []);

    const updatedTags = isMerge 
      ? Array.from(new Set([...(existing.tags || []), ...incomingTags, ...(importRecord.defaultTags || [])]))
      : (existing.tags?.length ? existing.tags : incomingTags);

    const updated: Contact = {
      ...existing,
      firstName: incoming.firstName && existing.firstName === 'Contact' ? incoming.firstName : existing.firstName,
      lastName: incoming.lastName || existing.lastName,
      fullName: incoming.fullName && existing.fullName === 'Contact' ? incoming.fullName : existing.fullName,
      companyName: existing.companyName === 'Independent Party' || !existing.companyName ? (incoming.company_name || existing.companyName) : existing.companyName,
      designation: existing.designation || incoming.designation || 'Business Contact',
      city: existing.city || incoming.city || 'India',
      tallyOutstandingBalance: (incoming.outstanding_balance as number) > 0 ? (incoming.outstanding_balance as number) : existing.tallyOutstandingBalance,
      tags: isSuppressedInGlobalList ? Array.from(new Set([...updatedTags, 'Suppression Override'])) : updatedTags,
      // COMPLIANCE CHECK: Suppression list has absolute priority over re-imports
      marketingStatus: isProtected 
        ? (existing.marketingStatus === 'UNSUBSCRIBED' || isSuppressedInGlobalList ? 'UNSUBSCRIBED' : existing.marketingStatus) 
        : (existing.marketingStatus || 'ACTIVE'),
      isSuppressed: isProtected ? true : existing.isSuppressed,
      marketingConsent: isProtected ? false : existing.marketingConsent,
      consentStatus: isProtected ? 'unsubscribed' : (importRecord.defaultConsentStatus || existing.consentStatus),
    };

    return updated;
  }

  /**
   * Construct brand new Contact object
   */
  private createNewContactRecord(
    data: Record<string, any>,
    importRecord: ImportRecord,
    rowNumber: number,
    isPotentialDuplicate = false,
    duplicateOfId?: string,
    suppressionList: SuppressionRecord[] = []
  ): Contact {
    const rawTags = Array.isArray(data.tags)
      ? data.tags
      : (data.tags ? String(data.tags).split(',').map((t: string) => t.trim()) : []);

    const targetEmail = (data.emailNormalized || data.email || '').toLowerCase().trim();
    const suppressionRecord = suppressionList.find(s => s.email_normalized === targetEmail);
    const isSuppressed = !!suppressionRecord;

    const mergedTags = Array.from(new Set([
      'Imported',
      ...(importRecord.defaultTags || []),
      ...rawTags,
      ...(isPotentialDuplicate ? ['Potential Duplicate'] : []),
      ...(isSuppressed ? ['Suppressed on Import'] : [])
    ]));

    return {
      id: `CNT-IMP-${Date.now()}-${rowNumber}`,
      firstName: data.firstName || 'Contact',
      lastName: data.lastName || '',
      fullName: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Contact',
      email: data.email || '',
      emailNormalized: data.emailNormalized || '',
      phone: data.mobile || '',
      mobile: data.mobile || '',
      mobileNormalized: data.mobileNormalized || '',
      companyName: data.company_name || 'Independent Party',
      designation: data.designation || 'Business Contact',
      city: data.city || 'India',
      source: 'CSV_IMPORT',
      sourceReference: isPotentialDuplicate 
        ? `Import #${importRecord.id} (Potential Duplicate of ${duplicateOfId})`
        : `Import #${importRecord.id} (${importRecord.originalFileName})`,
      marketingStatus: isSuppressed 
        ? (suppressionRecord.reason === 'UNSUBSCRIBED' ? 'UNSUBSCRIBED' : 'SUPPRESSED')
        : 'ACTIVE',
      marketingConsent: !isSuppressed,
      consentStatus: isSuppressed ? 'unsubscribed' : (importRecord.defaultConsentStatus || 'single_opt_in'),
      consentSource: importRecord.defaultConsentSource || 'Batch Import Engine',
      consentDate: new Date().toISOString(),
      consentIp: '127.0.0.1',
      lifecycleStage: importRecord.defaultLifecycleStage || 'lead',
      tallyOutstandingBalance: parseFloat(data.outstanding_balance) || 0,
      tallyOverdueDays: (parseFloat(data.outstanding_balance) || 0) > 0 ? 30 : 0,
      tags: mergedTags,
      totalEmailsSent: 0,
      totalEmailsOpened: 0,
      totalEmailsClicked: 0,
      unsubscribeToken: `unsub-${Math.random().toString(36).substring(2, 10)}`,
      isSuppressed: isSuppressed,
      createdAt: new Date().toISOString(),
    };
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public cancel(): void {
    this.isCancelled = true;
    this.isPaused = false;
  }
}
