import { 
  TallyConnection, 
  TallyStagingContact, 
  TallySyncLogEntry, 
  TallyFieldMappingItem 
} from '../types';

export const INITIAL_TALLY_CONNECTIONS: TallyConnection[] = [
  {
    id: 'TCONN-001',
    name: 'HQ Primary Tally Server (ODBC 64-bit)',
    companyId: 'COMP-101',
    connectionType: 'ODBC',
    host: '192.168.1.105',
    port: 9000,
    databaseName: 'TallyODBC64_9000',
    tallyCompanyName: 'DIGISOFT Technologies (P) Ltd (2025-2026)',
    status: 'ONLINE',
    lastSyncAt: '2026-09-04T06:30:00Z',
    lastSuccessfulSyncAt: '2026-09-04T06:30:00Z',
    nextScheduledSync: '2026-09-04T12:30:00Z',
    syncSchedule: 'EVERY_6_HOURS',
    customerGroups: ['Sundry Debtors', 'Customers', 'Dealers', 'Distributors'],
    excludedGroups: ['Cash', 'Bank Accounts', 'Expenses', 'Income', 'Duties & Taxes', 'Internal Ledgers'],
    deviceFingerprint: 'WIN-SRV-90812-4B29-F1A0',
    agentVersion: 'v2.4.2-win64',
    lastHeartbeatAt: '2026-09-04T10:32:00Z',
    apiTokenMasked: 'dgtly_agt_98f2************a19d',
    lastAlterId: 148290,
    totalLedgersCount: 428,
    createdBy: 'Bhuvan Gupta',
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: '2026-09-04T06:30:00Z'
  },
  {
    id: 'TCONN-002',
    name: 'Mumbai Regional Logistics Tally (XML / HTTP)',
    companyId: 'COMP-102',
    connectionType: 'XML_HTTP',
    host: '10.20.0.14',
    port: 9000,
    databaseName: undefined,
    tallyCompanyName: 'DIGISOFT Logistics & Trading Mumbai (2025-2026)',
    status: 'ONLINE',
    lastSyncAt: '2026-09-03T18:00:00Z',
    lastSuccessfulSyncAt: '2026-09-03T18:00:00Z',
    nextScheduledSync: '2026-09-04T18:00:00Z',
    syncSchedule: 'DAILY',
    customerGroups: ['Sundry Debtors', 'Dealers'],
    excludedGroups: ['Cash', 'Bank Accounts', 'Expenses', 'Income', 'Duties & Taxes'],
    deviceFingerprint: 'WIN-MUM-8841-A2B3-09DF',
    agentVersion: 'v2.4.1-win64',
    lastHeartbeatAt: '2026-09-04T10:30:15Z',
    apiTokenMasked: 'dgtly_agt_44b1************77bc',
    lastAlterId: 89402,
    totalLedgersCount: 164,
    createdBy: 'Pooja Verma',
    createdAt: '2026-02-15T11:30:00Z',
    updatedAt: '2026-09-03T18:00:00Z'
  },
  {
    id: 'TCONN-003',
    name: 'Ahmedabad Depot Accounting Tally (XML / HTTP)',
    companyId: 'COMP-103',
    connectionType: 'XML_HTTP',
    host: '10.30.0.22',
    port: 9000,
    databaseName: undefined,
    tallyCompanyName: 'DIGISOFT Distribution Depot Gujarat (2025-2026)',
    status: 'OFFLINE',
    lastSyncAt: '2026-09-02T12:00:00Z',
    lastSuccessfulSyncAt: '2026-09-02T12:00:00Z',
    nextScheduledSync: '2026-09-04T12:00:00Z',
    syncSchedule: 'EVERY_12_HOURS',
    customerGroups: ['Sundry Debtors', 'Retail Clients'],
    excludedGroups: ['Cash', 'Bank Accounts', 'Expenses', 'Income', 'Duties & Taxes', 'Internal Ledgers'],
    deviceFingerprint: 'WIN-AHM-3011-CC44-E821',
    agentVersion: 'v2.3.9-win64',
    lastHeartbeatAt: '2026-09-02T12:05:00Z',
    apiTokenMasked: 'dgtly_agt_77e3************99dd',
    lastAlterId: 45110,
    totalLedgersCount: 92,
    createdBy: 'Bhuvan Gupta',
    createdAt: '2026-03-01T14:00:00Z',
    updatedAt: '2026-09-02T12:05:00Z'
  }
];

export const INITIAL_TALLY_FIELD_MAPPINGS: TallyFieldMappingItem[] = [
  {
    id: 'MAP-01',
    tallyField: '$Name / <LEDGER NAME>',
    tallySample: 'Apex Infotech Solutions Pvt Ltd',
    crmTarget: 'companies.name / contacts.company_name',
    crmEntity: 'companies',
    transformationRule: 'Trim whitespace & match company identity',
    description: 'Maps the legal Tally ledger account name to the primary CRM Company entity.',
    isRequired: true
  },
  {
    id: 'MAP-02',
    tallyField: '$Email / <EMAIL>',
    tallySample: 'accounts@apexcorp.com',
    crmTarget: 'contacts.email',
    crmEntity: 'contacts',
    transformationRule: 'Lowercase & RFC 5322 validation',
    description: 'Primary customer communication identifier; used as Tier 2 deduplication anchor.',
    isRequired: true
  },
  {
    id: 'MAP-03',
    tallyField: '$LedgerMobile / <LEDGERMOBILE>',
    tallySample: '9820011223',
    crmTarget: 'contacts.mobile',
    crmEntity: 'contacts',
    transformationRule: 'Format to Indian E.164 (+91)',
    description: 'Normalized mobile phone number for WhatsApp and multi-channel marketing.',
    isRequired: false
  },
  {
    id: 'MAP-04',
    tallyField: '$PartyGSTIN / <PARTYGSTIN>',
    tallySample: '27AAACA1234A1Z5',
    crmTarget: 'companies.gstin',
    crmEntity: 'companies',
    transformationRule: 'Uppercase & 15-char GST regex verification',
    description: 'Indian Tax Identification Number; serves as Tier 1 absolute deduplication key.',
    isRequired: true
  },
  {
    id: 'MAP-05',
    tallyField: '$StateName / <STATENAME>',
    tallySample: 'Maharashtra',
    crmTarget: 'companies.state',
    crmEntity: 'companies',
    transformationRule: 'Standardize against official Indian state list',
    description: 'State jurisdiction for GST place of supply and geo-targeted campaigns.',
    isRequired: false
  },
  {
    id: 'MAP-06',
    tallyField: '$Address / <ADDRESS.LIST>',
    tallySample: 'Unit 402, Nesco IT Park, Goregaon East',
    crmTarget: 'companies.address_line_1',
    crmEntity: 'companies',
    transformationRule: 'Multiline collapse & clean special characters',
    description: 'Registered business address extracted from Tally multi-line address blocks.',
    isRequired: false
  },
  {
    id: 'MAP-07',
    tallyField: '$Parent / <PARENT>',
    tallySample: 'Sundry Debtors',
    crmTarget: 'contacts.tags & contacts.lifecycle_stage',
    crmEntity: 'contacts',
    transformationRule: 'Assign category tag ("Sundry Debtors", "Dealer", etc.)',
    description: 'Tally account classification group indicating commercial relationship.',
    isRequired: true
  },
  {
    id: 'MAP-08',
    tallyField: '$_LastVchDate / <LASTVOUCHERDATE>',
    tallySample: '2026-08-28',
    crmTarget: 'contacts.last_activity_date',
    crmEntity: 'contacts',
    transformationRule: 'Parse YYYYMMDD to ISO 8601 timestamp',
    description: 'Most recent invoice or payment voucher date for recency calculations.',
    isRequired: false
  }
];

export const INITIAL_TALLY_STAGING_CONTACTS: TallyStagingContact[] = [
  {
    id: 'STG-9001',
    connectionId: 'TCONN-001',
    connectionName: 'HQ Primary Tally Server (ODBC 64-bit)',
    externalId: 'LEDGER-TL-8841',
    ledgerName: 'Apex Infotech Solutions Pvt Ltd',
    parentGroup: 'Sundry Debtors',
    email: 'accounts@apexcorp.com',
    mobile: '+919820011223',
    address: 'Unit 402, Nesco IT Park, Western Express Highway',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400063',
    gstin: '27AAACA1234A1Z5',
    lastTransactionDate: '2026-08-28',
    rawData: {
      closingBalance: 145200.0,
      overdueDays: 48,
      billCreditPeriod: 30,
      tallyAlterId: 148288
    },
    syncedAt: '2026-09-04T06:30:00Z',
    processedAt: '2026-09-04T06:30:02Z',
    processingStatus: 'PROCESSED',
    matchedContactId: 'CNT-801',
    duplicateResolution: 'Updated existing contact; closing balance synced'
  },
  {
    id: 'STG-9002',
    connectionId: 'TCONN-001',
    connectionName: 'HQ Primary Tally Server (ODBC 64-bit)',
    externalId: 'LEDGER-TL-8842',
    ledgerName: 'Kalyan Logistics & Trade',
    parentGroup: 'Dealers',
    email: 'dispatch@kalyanlogistics.in',
    mobile: '+919845012345',
    address: 'Plot 18, Peenya Industrial Area Phase 2',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560058',
    gstin: '29AAACK4422K1Z9',
    lastTransactionDate: '2026-08-15',
    rawData: {
      closingBalance: 0.0,
      overdueDays: 0,
      billCreditPeriod: 45,
      tallyAlterId: 148289
    },
    syncedAt: '2026-09-04T06:30:00Z',
    processedAt: '2026-09-04T06:30:02Z',
    processingStatus: 'PROCESSED',
    matchedContactId: 'CNT-802',
    duplicateResolution: 'Enriched company record with GSTIN'
  },
  {
    id: 'STG-9003',
    connectionId: 'TCONN-001',
    connectionName: 'HQ Primary Tally Server (ODBC 64-bit)',
    externalId: 'LEDGER-TL-8843',
    ledgerName: 'Shree Balaji Electronics & Appliances',
    parentGroup: 'Distributors',
    email: 'info@shreebalaji.biz',
    mobile: '+919811099887',
    address: 'Shop 14, Chandni Chowk Electronic Market',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110006',
    gstin: '07AAACS1122D1Z4',
    lastTransactionDate: '2026-08-20',
    rawData: {
      closingBalance: 84300.0,
      overdueDays: 22,
      billCreditPeriod: 30,
      tallyAlterId: 148290
    },
    syncedAt: '2026-09-04T06:30:00Z',
    processedAt: '2026-09-04T06:30:03Z',
    processingStatus: 'VALIDATED',
    matchedContactId: undefined,
    duplicateResolution: 'Ready to create new Master Contact'
  },
  {
    id: 'STG-9004',
    connectionId: 'TCONN-002',
    connectionName: 'Mumbai Regional Logistics Tally (XML / HTTP)',
    externalId: 'LEDGER-MUM-401',
    ledgerName: 'Surat Diamond Polishing Tools LLP',
    parentGroup: 'Sundry Debtors',
    email: 'accounts@suratdiamondtools.co.in',
    mobile: '+919825033445',
    address: 'Ring Road, Katargam GIDC',
    city: 'Surat',
    state: 'Gujarat',
    pincode: '395004',
    gstin: '24AAACS4455G1Z8',
    lastTransactionDate: '2026-08-30',
    rawData: {
      closingBalance: 212500.0,
      overdueDays: 35,
      billCreditPeriod: 30,
      tallyAlterId: 89401
    },
    syncedAt: '2026-09-03T18:00:00Z',
    processedAt: undefined,
    processingStatus: 'PENDING'
  },
  {
    id: 'STG-9005',
    connectionId: 'TCONN-002',
    connectionName: 'Mumbai Regional Logistics Tally (XML / HTTP)',
    externalId: 'LEDGER-MUM-402',
    ledgerName: 'Vardhman Cotton Mills & Fabrics',
    parentGroup: 'Sundry Debtors',
    email: 'billing@vardhmancotton.com',
    mobile: '+919814099882',
    address: 'Chandigarh Road, Focal Point',
    city: 'Ludhiana',
    state: 'Punjab',
    pincode: '141010',
    gstin: '03AAACV6677H1Z2',
    lastTransactionDate: '2026-08-25',
    rawData: {
      closingBalance: 512000.0,
      overdueDays: 72,
      billCreditPeriod: 30,
      tallyAlterId: 89402
    },
    syncedAt: '2026-09-03T18:00:00Z',
    processedAt: '2026-09-03T18:00:04Z',
    processingStatus: 'PROCESSED',
    matchedContactId: undefined,
    duplicateResolution: 'Created new Contact & Company entity'
  },
  {
    id: 'STG-9006',
    connectionId: 'TCONN-001',
    connectionName: 'HQ Primary Tally Server (ODBC 64-bit)',
    externalId: 'LEDGER-TL-8849',
    ledgerName: 'Sharma & Sons Traders (Old File)',
    parentGroup: 'Sundry Debtors',
    email: 'invalid-email-format',
    mobile: '98200',
    address: 'Gali 4, Naya Bazar',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110006',
    gstin: 'INVALIDGST',
    lastTransactionDate: '2025-11-10',
    rawData: {
      closingBalance: 12500.0,
      overdueDays: 290,
      tallyAlterId: 148291
    },
    syncedAt: '2026-09-04T06:30:00Z',
    processedAt: '2026-09-04T06:30:03Z',
    processingStatus: 'FAILED',
    validationErrors: [
      'Email failed RFC 5322 syntax validation ("invalid-email-format")',
      'Mobile number has fewer than 10 digits ("98200")',
      'GSTIN failed 15-character alphanumeric format check ("INVALIDGST")'
    ]
  }
];

export const INITIAL_TALLY_SYNC_RUN_LOGS: TallySyncLogEntry[] = [
  {
    id: 'SLOG-101',
    connectionId: 'TCONN-001',
    connectionName: 'HQ Primary Tally Server (ODBC 64-bit)',
    syncType: 'INCREMENTAL',
    startedAt: '2026-09-04T06:30:00Z',
    completedAt: '2026-09-04T06:30:04Z',
    durationMs: 4120,
    recordsFound: 28,
    recordsCreated: 4,
    recordsUpdated: 23,
    recordsFailed: 1,
    status: 'SUCCESS',
    metadata: {
      alterIdRange: '148262 - 148291',
      connector: 'ODBCConnector',
      agentIp: '192.168.1.105',
      httpMethod: 'POST /api/v1/tally/agent/push-staging'
    }
  },
  {
    id: 'SLOG-102',
    connectionId: 'TCONN-002',
    connectionName: 'Mumbai Regional Logistics Tally (XML / HTTP)',
    syncType: 'FULL',
    startedAt: '2026-09-03T18:00:00Z',
    completedAt: '2026-09-03T18:00:08Z',
    durationMs: 7850,
    recordsFound: 64,
    recordsCreated: 12,
    recordsUpdated: 52,
    recordsFailed: 0,
    status: 'SUCCESS',
    metadata: {
      connector: 'XMLConnector',
      agentIp: '10.20.0.14',
      xmlEnvelopeSizeKb: 142.6
    }
  },
  {
    id: 'SLOG-103',
    connectionId: 'TCONN-001',
    connectionName: 'HQ Primary Tally Server (ODBC 64-bit)',
    syncType: 'MANUAL',
    startedAt: '2026-09-03T11:15:00Z',
    completedAt: '2026-09-03T11:15:03Z',
    durationMs: 2940,
    recordsFound: 14,
    recordsCreated: 1,
    recordsUpdated: 13,
    recordsFailed: 0,
    status: 'SUCCESS',
    metadata: {
      triggeredBy: 'Bhuvan Gupta',
      reason: 'Ad-hoc invoice balance reconciliation before overdue campaign dispatch'
    }
  },
  {
    id: 'SLOG-104',
    connectionId: 'TCONN-003',
    connectionName: 'Ahmedabad Depot Accounting Tally (XML / HTTP)',
    syncType: 'INCREMENTAL',
    startedAt: '2026-09-02T12:00:00Z',
    completedAt: '2026-09-02T12:00:15Z',
    durationMs: 15200,
    recordsFound: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsFailed: 0,
    status: 'WARNING',
    errorMessage: 'Tally Gateway connection timeout after 15000ms. Local agent reported TallyPrime process not running on port 9000.',
    metadata: {
      attempt: 3,
      retryScheduled: 'In 30 minutes'
    }
  }
];

export const TALLY_GROUP_SUGGESTIONS = [
  'Sundry Debtors',
  'Customers',
  'Dealers',
  'Distributors',
  'Retail Clients',
  'Wholesale Debtors',
  'Branch Debtors',
  'Consignment Agents'
];

export const TALLY_EXCLUDED_GROUP_SUGGESTIONS = [
  'Cash',
  'Bank Accounts',
  'Expenses',
  'Income',
  'Duties & Taxes',
  'Internal Ledgers',
  'Loans & Advances',
  'Provisions',
  'Fixed Assets',
  'Capital Account'
];
