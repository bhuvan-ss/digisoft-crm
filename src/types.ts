export type ConsentStatus = 'double_opt_in' | 'single_opt_in' | 'unsubscribed' | 'bounced' | 'complained';

export type MarketingStatus = 
  | 'ACTIVE' 
  | 'UNSUBSCRIBED' 
  | 'BOUNCED' 
  | 'COMPLAINED' 
  | 'SUPPRESSED' 
  | 'INVALID' 
  | 'PENDING';

export type ContactSourceType = 
  | 'TALLY' 
  | 'CSV_IMPORT' 
  | 'XLS_IMPORT' 
  | 'MANUAL' 
  | 'WEBSITE' 
  | 'CRM_LEAD' 
  | 'API' 
  | 'REFERRAL';

export type LifecycleStage = 'lead' | 'mql' | 'opportunity' | 'customer' | 'churned';

export type ESPProviderType = 'amazon_ses' | 'brevo' | 'sendgrid';
export type ESPProvider = ESPProviderType;

export interface TagItem {
  id: string;
  name: string;
  slug?: string;
  color?: string;
  description?: string;
}

export interface ContactSource {
  id: string;
  contactId: string;
  sourceType: ContactSourceType;
  sourceReference?: string;
  externalId?: string;
  importedAt: string;
  metadata?: Record<string, any>;
}

export interface Company {
  id: string;
  name: string;
  companyName?: string;
  legalName?: string;
  gstin?: string;
  pan?: string;
  website?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pincode?: string;
  industry: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PROSPECT';
  tallyLedgerName?: string;
  tallyLedgerGroup?: string;
  outstandingBalance: number;
  creditLimit: number;
  overdueDays: number;
  contactCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Contact {
  id: string;
  companyId?: string;
  companyName: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  designation: string;
  department?: string;
  email: string;
  emailNormalized?: string;
  phone: string;
  mobile?: string;
  mobileNormalized?: string;
  alternateMobile?: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  state?: string;
  country?: string;
  pincode?: string;
  industry?: string;
  source?: ContactSourceType;
  sourceReference?: string;
  emailVerifiedAt?: string;
  marketingStatus: MarketingStatus;
  marketingConsent: boolean;
  consentStatus: ConsentStatus;
  consentSource: string;
  consentDate: string;
  consentIp: string;
  lifecycleStage: LifecycleStage;
  tallyLedgerId?: string;
  tallyOutstandingBalance: number;
  tallyOverdueDays: number;
  totalEmailsSent: number;
  totalEmailsOpened: number;
  totalEmailsClicked: number;
  lastEmailSentAt?: string;
  lastEmailOpenedAt?: string;
  unsubscribeToken: string;
  isSuppressed: boolean;
  tags: string[];
  sources?: ContactSource[];
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export type SegmentType = 'STATIC' | 'DYNAMIC';
export type SegmentStatus = 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
export type RuleGroupLogicalOperator = 'AND' | 'OR';
export type RuleFieldCategory = 'contact' | 'company' | 'tally' | 'activity';

export type SegmentOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'starts_with' 
  | 'ends_with' 
  | 'in' 
  | 'not_in' 
  | 'greater_than' 
  | 'less_than' 
  | 'between' 
  | 'is_empty' 
  | 'is_not_empty';

export interface SegmentRuleCondition {
  id: string;
  type: 'condition';
  field: string;
  category: RuleFieldCategory;
  operator: SegmentOperator;
  value: any;
}

export interface SegmentRuleGroup {
  id: string;
  type: 'group';
  logicalOperator: RuleGroupLogicalOperator;
  children: (SegmentRuleCondition | SegmentRuleGroup)[];
}

export interface SegmentRule {
  id: string;
  field: string;
  operator: SegmentOperator | 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains' | 'in';
  value: any;
  category?: RuleFieldCategory;
}

export interface Segment {
  id: string;
  name: string;
  description: string;
  segmentType?: SegmentType;
  isDynamic?: boolean;
  status?: SegmentStatus;
  ruleTree?: SegmentRuleGroup;
  matchType: 'all' | 'any'; // AND vs OR
  rules: SegmentRule[] | any;
  totalContacts?: number;
  estimatedCount: number;
  cachedCount?: number;
  cachedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SegmentContact {
  id: string;
  segmentId: string;
  contactId: string;
  addedAt: string;
}

export interface StructuredEmailContent {
  subject: string;
  preheader: string;
  headline: string;
  introduction?: string;
  greeting?: string;
  bodyParagraphs?: string[];
  bulletPoints?: string[];
  benefits?: string[];
  ctaText: string;
  ctaUrlSuggestion: string;
  secondaryText?: string;
  footerNotes?: string;
  deliverabilityAdvice?: string;
}

export type EmailTemplateId = 
  | 'tally_payment_reminder'
  | 'product_announcement'
  | 'customer_winback'
  | 'monthly_newsletter'
  | 'b2b_promotional_offer';

export interface EmailTemplate {
  id: EmailTemplateId;
  name: string;
  category: 'Transactional / Finance' | 'Marketing' | 'Retention' | 'Newsletter';
  description: string;
  thumbnailColor: string;
  defaultContent: StructuredEmailContent;
  htmlGenerator: (content: StructuredEmailContent, previewData?: Partial<Contact>) => string;
}

// Phase 5: Professional Email Template Management System Types
export type EmailTemplateCategory = 
  | 'Corporate'
  | 'Promotional'
  | 'Newsletter'
  | 'Product Launch'
  | 'Festival'
  | 'Offer'
  | 'Informational'
  | 'Renewal Reminder';

export type EmailTemplateStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export interface EmailTemplateVersion {
  id: string;
  templateId: string;
  versionNumber: number;
  name: string;
  subjectDefault: string;
  preheaderDefault: string;
  htmlContent: string;
  plainTextContent: string;
  changeSummary: string;
  createdBy: string;
  createdAt: string;
}

export interface ManagedEmailTemplate {
  id: string;
  name: string;
  category: EmailTemplateCategory;
  description: string;
  subjectDefault: string;
  preheaderDefault: string;
  htmlContent: string;
  plainTextContent: string;
  thumbnail?: string;
  status: EmailTemplateStatus;
  version: number;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
  versions?: EmailTemplateVersion[];
}

export interface TemplateValidationError {
  field?: string;
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  suggestion?: string;
}

export interface TemplateValidationResult {
  isValid: boolean;
  score: number; // 0 - 100
  errors: TemplateValidationError[];
  warnings: TemplateValidationError[];
  detectedVariables: string[];
  missingRequiredVariables: string[];
  hasDangerousContent: boolean;
  hasUnsubscribeUrl: boolean;
  hasCompanyAddress: boolean;
  hasPreheader: boolean;
  isTableBased: boolean;
  sanitizedHtml?: string;
}

// Phase 7: Email Campaign Management Types
export type CampaignStatus = 
  | 'DRAFT'
  | 'REVIEW'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PROCESSING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'draft'
  | 'scheduled'
  | 'processing'
  | 'completed'
  | 'paused'
  | 'failed';

export type CampaignType = 
  | 'Promotional'
  | 'Informational'
  | 'Newsletter'
  | 'Festival Greeting'
  | 'Product Launch'
  | 'Renewal'
  | 'Upgrade'
  | 'Event Invitation';

export type AudienceType = 
  | 'segment'
  | 'tags'
  | 'individual_contacts'
  | 'imported_list';

export interface AudienceSelection {
  type: AudienceType;
  segmentId?: string;
  segmentName?: string;
  tags?: string[];
  contactIds?: string[];
  importId?: string;
  importFileName?: string;
}

export type CampaignRecipientStatus = 
  | 'PENDING'
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'OPENED'
  | 'CLICKED'
  | 'BOUNCED'
  | 'COMPLAINED'
  | 'UNSUBSCRIBED'
  | 'EXCLUDED'
  | 'FAILED';

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  contact_id: string;
  email: string;
  personalization_data: Record<string, any>;
  status: CampaignRecipientStatus;
  sent_at?: string | null;
  delivered_at?: string | null;
  opened_at?: string | null;
  clicked_at?: string | null;
  exclusion_reason?: string | null;
}

export interface PreSendValidationReport {
  isValid: boolean;
  checks: {
    subjectExists: boolean;
    htmlExists: boolean;
    fromEmailConfigured: boolean;
    unsubscribeUrlExists: boolean;
    recipientCountValid: boolean;
  };
  counts: {
    totalAudienceCount: number;
    validRecipientsCount: number;
    unsubscribedCount: number;
    bouncedCount: number;
    complainedCount: number;
    suppressedCount: number;
    invalidCount: number;
  };
  warnings: string[];
  errors: string[];
}

export interface CampaignActivityLogItem {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  previousStatus?: string;
  newStatus?: string;
}

export interface CampaignMetrics {
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedHardCount: number;
  bouncedSoftCount: number;
  unsubscribedCount: number;
  complainedCount: number;
}

export interface Campaign {
  id: string;
  name: string;
  campaign_type: CampaignType;
  subject: string;
  preheader: string;
  email_template_id: string;
  html_content: string;
  plain_text_content: string;
  from_name: string;
  from_email: string;
  reply_to: string;
  status: CampaignStatus;
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_by: string;
  approved_by?: string | null;
  created_at: string;
  updated_at: string;

  // Extended Execution Metadata
  audience?: AudienceSelection;
  esp_provider?: ESPProviderType;
  chunk_size?: number;
  rate_limit_per_second?: number;
  metrics: CampaignMetrics;
  recipients_snapshot?: CampaignRecipient[];
  pre_send_validation?: PreSendValidationReport;
  activity_log?: CampaignActivityLogItem[];
  structured_content?: StructuredEmailContent;

  // Backward compatibility alias properties
  objective?: string;
  senderName?: string;
  senderEmail?: string;
  replyToEmail?: string;
  segmentId?: string;
  segmentName?: string;
  templateId?: EmailTemplateId | string;
  espProvider?: ESPProviderType;
  chunkSize?: number;
  rateLimitPerSecond?: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
  structuredContent?: StructuredEmailContent;
}

export interface CampaignDispatchLog {
  id: string;
  campaignId: string;
  contactId: string;
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  status: 'queued' | 'delivered' | 'opened' | 'clicked' | 'bounced_soft' | 'bounced_hard' | 'unsubscribed';
  bounceReason?: string;
  dispatchedAt: string;
  openedAt?: string;
  clickedAt?: string;
  espMessageId?: string;
}

export interface TallySyncConfig {
  host: string;
  port: number;
  companyName: string;
  syncType: 'sundry_debtors' | 'sundry_creditors' | 'all_ledgers';
  autoSyncSchedule: 'manual' | 'hourly' | 'daily' | 'weekly';
  lastSyncedAt?: string;
  lastSyncStatus?: 'success' | 'failed' | 'in_progress';
  recordsSynced: number;
}

export interface TallySyncLog {
  id: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  recordsImported: number;
  recordsUpdated: number;
  discrepanciesCount: number;
  details: string;
  xmlPayloadSnippet: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  user?: string;
  userName?: string;
  role?: string;
  userRole?: string;
  action: string;
  module: 'Contacts' | 'TallyPrime' | 'Campaigns' | 'Segments' | 'ESP' | 'Consent' | string;
  details: string;
  ipAddress: string;
}

export interface ESPConfig {
  provider: ESPProviderType;
  name: string;
  status: 'active' | 'standby' | 'error';
  apiKeyMasked: string;
  sendingDomain: string;
  spfValid: boolean;
  dkimValid: boolean;
  dmarcValid: boolean;
  dailyQuota: number;
  sentToday: number;
  maxSendRatePerSec: number;
  reputationScore: number; // 0 - 100
}

// ==========================================
// PHASE 8: EMAIL DELIVERY ENGINE & ESP INTEGRATION
// ==========================================

export type ESPDriverType = 'amazon_ses' | 'brevo' | 'sendgrid';
export type ProviderConfigStatus = 'active' | 'standby' | 'disabled' | 'error';

export interface EmailProviderSettings {
  rate_limit_per_second: number;
  provider_max_rate: number;
  daily_quota: number;
  daily_sent: number;
  webhook_signing_secret_encrypted?: string;
  track_opens: boolean;
  track_clicks: boolean;
  sandbox_mode: boolean;
  safety_margin_percentage: number; // e.g., 20%
  burst_limit?: number;
  connection_verified_at?: string | null;
  sender_verified_at?: string | null;
  spf_verified?: boolean;
  dkim_verified?: boolean;
  dmarc_verified?: boolean;
}

export interface EmailProviderConfigRecord {
  id: string;
  provider: ESPDriverType;
  name: string;
  api_key_encrypted: string;
  secret_encrypted?: string;
  region?: string;
  from_email: string;
  from_name: string;
  reply_to: string;
  status: ProviderConfigStatus;
  is_default: boolean;
  settings: EmailProviderSettings;
  created_at: string;
  updated_at: string;
}

export interface EmailMessage {
  to: string;
  toName?: string;
  from: string;
  fromName: string;
  replyTo?: string;
  subject: string;
  html: string;
  plainText?: string;
  headers?: Record<string, string>;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
  campaignId?: string;
  contactId?: string;
}

export interface SendResult {
  success: boolean;
  messageId: string;
  provider: ESPDriverType;
  statusCode: number;
  error?: string;
  errorCode?: string;
  isRetryable: boolean;
  retryAfterMs?: number;
  latencyMs: number;
  timestamp: string;
}

export interface BatchSendResult {
  success: boolean;
  total: number;
  sent: number;
  failed: number;
  results: SendResult[];
  provider: ESPDriverType;
  durationMs: number;
}

export interface SendingLimits {
  providerMaxRatePerSec: number;
  configuredRatePerSec: number;
  dailyQuota: number;
  sentToday: number;
  remainingToday: number;
  safetyMarginPercent: number;
  burstAllowance: number;
}

export interface ProviderStatistics {
  reputationScore: number; // 0 - 100
  avgLatencyMs: number;
  deliveryRate: number; // percentage, e.g. 99.2
  bounceRate: number;   // percentage, e.g. 0.4
  complaintRate: number; // percentage, e.g. 0.02
  totalSentAllTime: number;
  activeWorkersCount: number;
}

export interface ValidationResult {
  valid: boolean;
  connectionSuccess: boolean;
  senderVerified: boolean;
  domainVerified: boolean;
  errorMessage?: string;
  details: {
    spf: boolean;
    dkim: boolean;
    dmarc: boolean;
    latencyMs: number;
    rawResponseSnippet?: string;
  };
}

export interface EmailProviderInterface {
  send(message: EmailMessage): Promise<SendResult>;
  sendBatch(messages: EmailMessage[]): Promise<BatchSendResult>;
  validateConfiguration(): Promise<ValidationResult>;
  getSendingLimits(): Promise<SendingLimits>;
  getStatistics(): Promise<ProviderStatistics>;
}

export interface QueueChunk {
  id: string;
  batchId: string;
  chunkIndex: number;
  totalChunks: number;
  recipientCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  attempt: number;
  maxAttempts: number;
  workerId?: string;
  error?: string;
  durationMs?: number;
  startedAt?: string;
  completedAt?: string;
}

export interface QueueBatch {
  id: string;
  campaignId: string;
  campaignName: string;
  provider: ESPDriverType;
  totalJobs: number;
  pendingJobs: number;
  failedJobs: number;
  processedJobs: number;
  progressPercentage: number;
  chunkSize: number;
  rateLimit: number;
  status: 'queued' | 'processing' | 'paused' | 'completed' | 'cancelled' | 'failed';
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  chunks: QueueChunk[];
}

export interface DeliveryLogEntry {
  id: string;
  campaignId: string;
  recipientEmail: string;
  contactId?: string;
  provider: ESPDriverType;
  status: CampaignRecipientStatus;
  espMessageId: string;
  httpCode: number;
  latencyMs: number;
  attempts: number;
  errorMessage?: string;
  timestamp: string;
}

export interface LiveDeliveryEngineStats {
  queued: number;
  sending: number;
  sent: number;
  delivered: number;
  failed: number;
  bounced: number;
  complained: number;
  unsubscribed: number;
  percentageComplete: number;
  currentSpeedPerSec: number;
  targetSpeedPerSec: number;
  activeBatchId?: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'aborted';
}

export interface VirtualTestEmail {
  id: string;
  to: string;
  from: string;
  subject: string;
  preheader: string;
  html: string;
  receivedAt: string;
  provider: string;
  spamScore: number;
}

// ==========================================
// PHASE 2: CONTACT IMPORT ENGINE TYPES
// ==========================================

export type ImportStatus = 
  | 'UPLOADED'
  | 'MAPPING'
  | 'READY'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type DuplicateHandlingOption = 
  | 'SKIP'
  | 'UPDATE'
  | 'POTENTIAL_DUPLICATE'
  | 'MERGE';

export type TransformationRule = 
  | 'trim'
  | 'lowercase'
  | 'uppercase'
  | 'e164_mobile'
  | 'split_name'
  | 'decimal_sanitize'
  | 'none';

export interface ImportRecord {
  id: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileType: 'csv' | 'xls' | 'xlsx';
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  duplicateRows: number;
  updatedRows: number;
  status: ImportStatus;
  duplicateHandling: DuplicateHandlingOption;
  defaultConsentStatus: ConsentStatus;
  defaultConsentSource: string;
  defaultTags: string[];
  defaultLifecycleStage: LifecycleStage;
  importedBy?: string;
  startedAt?: string;
  completedAt?: string;
  errorLog?: Array<{ chunk: number; error: string; time: string }>;
  summaryStats?: ImportSummaryStats;
  createdAt: string;
  updatedAt?: string;
}

export interface ImportMappingItem {
  id: string;
  importId: string;
  sourceColumn: string;
  targetField: string;
  transformationRule: TransformationRule;
  confidence?: number;
}

export interface ImportErrorItem {
  id: string;
  importId: string;
  rowNumber: number;
  fieldName: string;
  errorMessage: string;
  rawData: Record<string, any>;
  createdAt: string;
}

export interface ImportSummaryStats {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  duplicate: number;
  updated: number;
  durationSeconds: number;
  throughputRowsPerSec: number;
  topErrorReasons?: Record<string, number>;
  status: ImportStatus;
  completedAt?: string;
}

// ==========================================
// PHASE 3: TALLYPRIME CONTACT SYNCHRONIZATION
// ==========================================

export type TallyConnectionType = 'ODBC' | 'XML_HTTP';
export type TallyConnectionStatus = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'ERROR';
export type TallySyncSchedule = 'MANUAL' | 'EVERY_6_HOURS' | 'EVERY_12_HOURS' | 'DAILY';
export type TallySyncType = 'FULL' | 'INCREMENTAL' | 'MANUAL';
export type StagingProcessingStatus = 'PENDING' | 'VALIDATED' | 'PROCESSED' | 'FAILED' | 'DUPLICATE_SKIPPED';

export interface TallyConnection {
  id: string;
  name: string;
  companyId: string;
  connectionType: TallyConnectionType;
  host: string;
  port: number;
  databaseName?: string;
  tallyCompanyName: string;
  status: TallyConnectionStatus;
  lastSyncAt?: string;
  lastSuccessfulSyncAt?: string;
  nextScheduledSync?: string;
  syncSchedule: TallySyncSchedule;
  customerGroups: string[];
  excludedGroups: string[];
  deviceFingerprint?: string;
  agentVersion?: string;
  lastHeartbeatAt?: string;
  apiTokenMasked?: string;
  lastAlterId?: number;
  totalLedgersCount?: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TallyStagingContact {
  id: string;
  connectionId: string;
  connectionName?: string;
  externalId: string;
  ledgerName: string;
  parentGroup: string;
  email: string;
  mobile: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  lastTransactionDate?: string;
  rawData: Record<string, any>;
  syncedAt: string;
  processedAt?: string;
  processingStatus: StagingProcessingStatus;
  validationErrors?: string[];
  matchedContactId?: string;
  duplicateResolution?: string;
}

export interface TallySyncLogEntry {
  id: string;
  connectionId: string;
  connectionName?: string;
  syncType: TallySyncType;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  recordsFound: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  status: 'RUNNING' | 'SUCCESS' | 'WARNING' | 'FAILED';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface TallyFieldMappingItem {
  id: string;
  tallyField: string;
  tallySample: string;
  crmTarget: string;
  crmEntity: 'contacts' | 'companies';
  transformationRule: string;
  description: string;
  isRequired: boolean;
}

// ==========================================
// PHASE 9: EMAIL WEBHOOKS & CAMPAIGN ANALYTICS
// ==========================================

export type EmailEventType = 
  | 'SENT' 
  | 'DELIVERED' 
  | 'OPENED' 
  | 'CLICKED' 
  | 'BOUNCED' 
  | 'COMPLAINED' 
  | 'UNSUBSCRIBED';

export type BounceClassification = 'HARD' | 'SOFT';

export interface EmailEventMetadata {
  ip?: string;
  user_agent?: string;
  geo_city?: string;
  geo_country?: string;
  link_url?: string;
  link_id?: string;
  bounce_type?: BounceClassification;
  bounce_code?: string;
  bounce_reason?: string;
  diagnostic_code?: string;
  complaint_feedback_type?: 'abuse' | 'fraud' | 'virus' | 'not-spam' | 'other';
  complaint_feedback_id?: string;
  recipient_email?: string;
  sender_email?: string;
  subject?: string;
  attempt?: number;
  latency_ms?: number;
  signature_verified?: boolean;
  raw_payload?: Record<string, any>;
}

export interface EmailEvent {
  id: string;
  provider: ESPProviderType;
  provider_event_id: string;
  campaign_id: string;
  contact_id: string;
  campaign_recipient_id: string;
  event_type: EmailEventType;
  event_timestamp: string; // ISO 8601
  metadata: EmailEventMetadata;
  created_at: string;
}

export interface WebhookEndpointConfig {
  id: string;
  provider: ESPProviderType;
  providerName: string;
  endpointUrl: string;
  signingSecret: string;
  verificationToken: string;
  isActive: boolean;
  createdAt: string;
  lastEventReceivedAt?: string | null;
  totalEventsProcessed: number;
  duplicateEventsSkipped: number;
  rejectedSignaturesCount: number;
}

export interface WebhookIngestResult {
  success: boolean;
  status: 'PROCESSED' | 'IDEMPOTENT_DUPLICATE_SKIPPED' | 'SIGNATURE_REJECTED' | 'INVALID_PAYLOAD' | 'ERROR';
  message: string;
  provider: ESPProviderType;
  eventsProcessedCount: number;
  createdEventIds?: string[];
  contactStatusUpdated?: {
    contactId: string;
    previousStatus: string;
    newStatus: string;
    reason: string;
  }[];
  validationDetails?: {
    signatureValid: boolean;
    tokenValid: boolean;
    idempotencyKey?: string;
    timestampValid: boolean;
  };
}

export interface CampaignAnalyticsRates {
  deliveryRate: number;     // (delivered / sent) * 100
  openRate: number;         // (opened / delivered) * 100
  clickRate: number;        // (clicked / delivered) * 100 (CTR)
  ctor: number;             // Click-to-open rate (clicked / opened) * 100
  bounceRate: number;       // ((bouncedHard + bouncedSoft) / sent) * 100
  hardBounceRate: number;   // (bouncedHard / sent) * 100
  softBounceRate: number;   // (bouncedSoft / sent) * 100
  complaintRate: number;    // (complained / delivered) * 100
  unsubscribeRate: number;  // (unsubscribed / delivered) * 100
}

export interface CampaignDeliveryFunnelStep {
  stage: 'AUDIENCE' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED';
  label: string;
  count: number;
  percentageOfSent: number;
  dropOffCount: number;
  dropOffPercentage: number;
}

// ==========================================
// PHASE 10: UNSUBSCRIBE, SUPPRESSION & COMPLIANCE
// ==========================================

export type EmailPreferenceType = 
  | 'PRODUCT_UPDATES'
  | 'PROMOTIONAL_OFFERS'
  | 'NEWSLETTERS'
  | 'EVENT_INVITATIONS'
  | 'FESTIVAL_GREETINGS'
  | 'EDUCATIONAL_CONTENT';

export interface EmailPreference {
  id: string;
  contact_id: string;
  preference_type: EmailPreferenceType;
  is_subscribed: boolean;
  updated_at: string;
}

export type SuppressionReason = 
  | 'UNSUBSCRIBED'
  | 'HARD_BOUNCE'
  | 'SPAM_COMPLAINT'
  | 'MANUAL'
  | 'INVALID_EMAIL';

export interface SuppressionRecord {
  id: string;
  email_normalized: string;
  reason: SuppressionReason;
  source: string;
  suppressed_at: string;
  metadata: {
    contact_id?: string;
    campaign_id?: string;
    ip_address?: string;
    user_agent?: string;
    diagnostic_code?: string;
    admin_user?: string;
    notes?: string;
    [key: string]: any;
  };
}

export interface ComplianceCheckDetail {
  id: string;
  name: string;
  passed: boolean;
  severity: 'CRITICAL' | 'WARNING';
  description: string;
  remediation?: string;
  details?: string;
}

export interface CampaignComplianceReport {
  isCompliant: boolean;
  score: number; // 0 - 100
  checks: {
    unsubscribeLink: ComplianceCheckDetail;
    senderIdentity: ComplianceCheckDetail;
    companyAddress: ComplianceCheckDetail;
    privacyPolicy: ComplianceCheckDetail;
    suppressionChecked: ComplianceCheckDetail;
  };
  suppressionAudit: {
    totalAudience: number;
    deliverableCount: number;
    suppressedCount: number;
    suppressedEmailsFound: string[];
  };
  verifiedAt: string;
}

export interface SecureUnsubscribeTokenPayload {
  contactId: string;
  email: string;
  generatedAt: number;
  hash: string;
}

