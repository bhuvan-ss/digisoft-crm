import * as XLSX from 'xlsx';
import { Contact, ConsentStatus, LifecycleStage } from '../types';

export interface ParsedFileData {
  headers: string[];
  rows: Record<string, any>[];
  fileName: string;
  totalRows: number;
}

export interface FieldMapping {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  designation: string;
  city: string;
  gstin: string;
  outstandingBalance: string;
  tags: string;
}

export type DeduplicationStrategy = 'skip' | 'overwrite' | 'merge';

export interface ImportResult {
  totalProcessed: number;
  imported: Contact[];
  updated: Contact[];
  skipped: number;
  errors: { row: number; reason: string }[];
}

/**
 * Parses CSV, XLS, XLSX File using XLSX library
 */
export async function parseUploadedFile(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to JSON array
        const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (rawRows.length === 0) {
          throw new Error("Uploaded file contains no rows or readable data.");
        }

        const headers = Object.keys(rawRows[0]);

        resolve({
          headers,
          rows: rawRows,
          fileName: file.name,
          totalRows: rawRows.length
        });
      } catch (err: any) {
        reject(new Error(err?.message || "Failed to parse file."));
      }
    };

    reader.onerror = () => reject(new Error("File read failure."));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Auto-detects field mapping from column names
 */
export function autoDetectMapping(headers: string[]): FieldMapping {
  const mapping: FieldMapping = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    designation: '',
    city: '',
    gstin: '',
    outstandingBalance: '',
    tags: ''
  };

  for (const h of headers) {
    const lower = h.toLowerCase().trim();
    if (!mapping.email && (lower.includes('email') || lower.includes('mail') || lower === 'e_mail')) {
      mapping.email = h;
    } else if (!mapping.firstName && (lower.includes('first') || lower === 'fname' || lower === 'contact person' || lower === 'name')) {
      mapping.firstName = h;
    } else if (!mapping.lastName && (lower.includes('last') || lower === 'lname' || lower === 'surname')) {
      mapping.lastName = h;
    } else if (!mapping.phone && (lower.includes('phone') || lower.includes('mobile') || lower.includes('tel') || lower.includes('contact no'))) {
      mapping.phone = h;
    } else if (!mapping.companyName && (lower.includes('company') || lower.includes('org') || lower.includes('business') || lower.includes('client') || lower.includes('party'))) {
      mapping.companyName = h;
    } else if (!mapping.designation && (lower.includes('designation') || lower.includes('title') || lower.includes('role'))) {
      mapping.designation = h;
    } else if (!mapping.city && (lower.includes('city') || lower.includes('location') || lower.includes('town'))) {
      mapping.city = h;
    } else if (!mapping.gstin && (lower.includes('gst') || lower.includes('tax') || lower.includes('vat'))) {
      mapping.gstin = h;
    } else if (!mapping.outstandingBalance && (lower.includes('balance') || lower.includes('amount') || lower.includes('due') || lower.includes('closing'))) {
      mapping.outstandingBalance = h;
    } else if (!mapping.tags && (lower.includes('tag') || lower.includes('group') || lower.includes('category'))) {
      mapping.tags = h;
    }
  }

  return mapping;
}

/**
 * Process rows with Deduplication and Normalization
 */
export function processImportRows(
  rows: Record<string, any>[],
  mapping: FieldMapping,
  existingContacts: Contact[],
  strategy: DeduplicationStrategy,
  optInSource: string,
  optInStatus: ConsentStatus
): ImportResult {
  const result: ImportResult = {
    totalProcessed: rows.length,
    imported: [],
    updated: [],
    skipped: 0,
    errors: []
  };

  // Map of existing contacts by lowercase normalized email and phone
  const emailMap = new Map<string, Contact>();
  const phoneMap = new Map<string, Contact>();

  for (const contact of existingContacts) {
    if (contact.email) emailMap.set(contact.email.toLowerCase().trim(), contact);
    if (contact.phone) phoneMap.set(normalizePhone(contact.phone), contact);
  }

  rows.forEach((row, idx) => {
    const rawEmail = mapping.email ? String(row[mapping.email] || '').trim() : '';
    const rawPhone = mapping.phone ? String(row[mapping.phone] || '').trim() : '';

    if (!rawEmail && !rawPhone) {
      result.errors.push({ row: idx + 1, reason: "Missing required email and phone." });
      return;
    }

    const emailNorm = rawEmail.toLowerCase().trim();
    const phoneNorm = normalizePhone(rawPhone);

    // Validate email format if provided
    if (emailNorm && !isValidEmail(emailNorm)) {
      result.errors.push({ row: idx + 1, reason: `Invalid email format: "${emailNorm}"` });
      return;
    }

    const existing = emailMap.get(emailNorm) || (phoneNorm ? phoneMap.get(phoneNorm) : undefined);

    let rawFirstName = mapping.firstName ? String(row[mapping.firstName] || '').trim() : '';
    let rawLastName = mapping.lastName ? String(row[mapping.lastName] || '').trim() : '';

    // If only one full name field exists, split into first and last
    if (rawFirstName && !rawLastName && rawFirstName.includes(' ')) {
      const parts = rawFirstName.split(' ');
      rawFirstName = parts[0];
      rawLastName = parts.slice(1).join(' ');
    }

    const companyName = mapping.companyName ? String(row[mapping.companyName] || '').trim() : 'Independent Party';
    const designation = mapping.designation ? String(row[mapping.designation] || '').trim() : 'Business Contact';
    const city = mapping.city ? String(row[mapping.city] || '').trim() : 'India';
    const balanceNum = mapping.outstandingBalance ? parseFloat(String(row[mapping.outstandingBalance]).replace(/[^0-9.-]/g, '')) || 0 : 0;
    
    const tagsRaw = mapping.tags ? String(row[mapping.tags] || '') : '';
    const tagsList = tagsRaw ? tagsRaw.split(/[,;|]/).map(t => t.trim()).filter(Boolean) : ['Imported'];

    if (existing) {
      if (strategy === 'skip') {
        result.skipped++;
        return;
      } else if (strategy === 'overwrite') {
        const updatedContact: Contact = {
          ...existing,
          firstName: rawFirstName || existing.firstName,
          lastName: rawLastName || existing.lastName,
          phone: phoneNorm || existing.phone,
          companyName: companyName || existing.companyName,
          designation: designation || existing.designation,
          city: city || existing.city,
          tallyOutstandingBalance: balanceNum || existing.tallyOutstandingBalance,
          tags: Array.from(new Set([...existing.tags, ...tagsList]))
        };
        result.updated.push(updatedContact);
        emailMap.set(emailNorm, updatedContact);
      } else if (strategy === 'merge') {
        const mergedContact: Contact = {
          ...existing,
          firstName: existing.firstName || rawFirstName,
          lastName: existing.lastName || rawLastName,
          phone: existing.phone || phoneNorm,
          companyName: existing.companyName || companyName,
          designation: existing.designation || designation,
          city: existing.city || city,
          tallyOutstandingBalance: existing.tallyOutstandingBalance || balanceNum,
          tags: Array.from(new Set([...existing.tags, ...tagsList]))
        };
        result.updated.push(mergedContact);
        emailMap.set(emailNorm, mergedContact);
      }
    } else {
      const newContact: Contact = {
        id: `CNT-${Date.now()}-${idx}`,
        firstName: rawFirstName || 'Contact',
        lastName: rawLastName || '',
        fullName: `${rawFirstName || ''} ${rawLastName || ''}`.trim() || 'Contact',
        email: emailNorm,
        emailNormalized: emailNorm,
        phone: phoneNorm,
        mobile: phoneNorm,
        mobileNormalized: phoneNorm,
        companyName,
        designation,
        city,
        source: 'CSV_IMPORT',
        marketingStatus: 'ACTIVE',
        marketingConsent: true,
        tags: tagsList,
        consentStatus: optInStatus,
        consentSource: optInSource,
        consentDate: new Date().toISOString(),
        consentIp: '127.0.0.1',
        lifecycleStage: 'lead',
        tallyOutstandingBalance: balanceNum,
        tallyOverdueDays: balanceNum > 0 ? 30 : 0,
        totalEmailsSent: 0,
        totalEmailsOpened: 0,
        totalEmailsClicked: 0,
        unsubscribeToken: `unsub-${Math.random().toString(36).substring(2, 10)}`,
        isSuppressed: false,
        createdAt: new Date().toISOString()
      };
      result.imported.push(newContact);
      if (emailNorm) emailMap.set(emailNorm, newContact);
      if (phoneNorm) phoneMap.set(phoneNorm, newContact);
    }
  });

  return result;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9+]/g, '');
  if (digits.length === 10 && !digits.startsWith('+')) {
    return `+91${digits}`;
  }
  return digits;
}
