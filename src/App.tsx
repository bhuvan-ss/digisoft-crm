import React, { useState } from 'react';
import { Navbar, NavigationTab } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { ContactsHub } from './components/ContactsHub';
import { TallySyncCenter } from './components/TallySyncCenter';
import { ImportCenter } from './components/ImportCenter';
import { DynamicSegments } from './components/DynamicSegments';
import { CampaignStudio } from './components/CampaignStudio';
import { DeliverabilityCenter } from './components/DeliverabilityCenter';
import { AuditComplianceHub } from './components/AuditComplianceHub';
import { LaravelArchitectureViewer } from './components/LaravelArchitectureViewer';
import { EmailTemplates } from './components/EmailTemplates';
import { AiContentAssistant } from './components/AiContentAssistant';
import { VirtualTestInboxModal, TestEmailMessage } from './components/VirtualTestInboxModal';
import { CampaignAnalyticsDashboard } from './components/analytics/CampaignAnalyticsDashboard';

import { 
  INITIAL_COMPANIES, 
  INITIAL_CONTACTS, 
  INITIAL_SEGMENTS, 
  INITIAL_CAMPAIGNS, 
  INITIAL_ESP_CONFIGS, 
  INITIAL_TALLY_CONFIG, 
  INITIAL_TALLY_LOGS, 
  INITIAL_AUDIT_LOGS 
} from './data/initialData';
import { INITIAL_MANAGED_TEMPLATES } from './data/emailTemplatePresets';
import { INITIAL_EMAIL_PROVIDER_CONFIGS } from './data/providerConfigs';
import { INITIAL_EMAIL_EVENTS, INITIAL_WEBHOOK_CONFIGS } from './data/initialEvents';
import { INITIAL_EMAIL_PREFERENCES, INITIAL_SUPPRESSION_LIST } from './data/initialComplianceData';
import { WebhookEventProcessor } from './services/webhooks/WebhookEventProcessor';
import { SuppressionService } from './services/compliance/SuppressionService';
import { 
  Contact, 
  Company, 
  Segment, 
  Campaign, 
  CampaignStatus, 
  ESPConfig, 
  TallySyncConfig, 
  TallySyncLog, 
  AuditLog, 
  ConsentStatus, 
  ManagedEmailTemplate, 
  EmailProviderConfigRecord,
  EmailEvent,
  WebhookEndpointConfig,
  WebhookIngestResult,
  ESPProviderType,
  EmailPreference,
  SuppressionRecord
} from './types';
import { parseTallyXml, getSimulatedTallyXmlResponse } from './utils/tallyXml';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  
  // Core Entities State
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [segments, setSegments] = useState<Segment[]>(INITIAL_SEGMENTS);
  const [emailTemplates, setEmailTemplates] = useState<ManagedEmailTemplate[]>(INITIAL_MANAGED_TEMPLATES);
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [espConfigs, setEspConfigs] = useState<Record<string, ESPConfig>>(INITIAL_ESP_CONFIGS);
  const [providerConfigs, setProviderConfigs] = useState<EmailProviderConfigRecord[]>(INITIAL_EMAIL_PROVIDER_CONFIGS);
  const [emailEvents, setEmailEvents] = useState<EmailEvent[]>(INITIAL_EMAIL_EVENTS);
  const [webhookConfigs, setWebhookConfigs] = useState<WebhookEndpointConfig[]>(INITIAL_WEBHOOK_CONFIGS);
  const [selectedAnalyticsCampaignId, setSelectedAnalyticsCampaignId] = useState<string | null>(null);
  const [tallyConfig, setTallyConfig] = useState<TallySyncConfig>(INITIAL_TALLY_CONFIG);
  const [tallyLogs, setTallyLogs] = useState<TallySyncLog[]>(INITIAL_TALLY_LOGS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [emailPreferences, setEmailPreferences] = useState<EmailPreference[]>(INITIAL_EMAIL_PREFERENCES);
  const [suppressionList, setSuppressionList] = useState<SuppressionRecord[]>(INITIAL_SUPPRESSION_LIST);

  // Virtual Test Inbox State
  const [testInboxEmails, setTestInboxEmails] = useState<TestEmailMessage[]>([
    {
      id: 'msg-seed-1',
      to: 'bhuvangupta.1711@gmail.com',
      subject: 'Urgent: Account Ledger Reconciliation Required for Apex Infotech',
      html: '<div style="font-family:sans-serif;padding:24px;color:#1e293b;"><h3>Ledger Reconciliation Statement</h3><p>Dear Bhuvan Gupta,</p><p>Your outstanding balance of <strong>₹1,45,200</strong> is 48 days overdue.</p><p style="margin-top:20px;"><a href="#" style="background:#4f46e5;color:white;padding:10px 18px;text-decoration:none;border-radius:6px;">Reconcile Invoice</a></p></div>',
      campaignName: 'Q3 Debtor Overdue Reconciliation',
      sentAt: new Date(Date.now() - 3600000).toISOString(),
      isRead: true
    }
  ]);
  const [isTestInboxOpen, setIsTestInboxOpen] = useState(false);
  const [isTallySyncing, setIsTallySyncing] = useState(false);
  const [preselectedSegmentForCampaign, setPreselectedSegmentForCampaign] = useState<Segment | null>(null);

  // Quick Audit Logger Helper
  const addAuditLog = (action: string, module: string, details: string) => {
    const newLog: AuditLog = {
      id: `AUD-${Date.now()}`,
      userId: 'USR-ADMIN-1',
      userName: 'Lead Systems Architect',
      userRole: 'Super Admin',
      action,
      module,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: '10.0.4.12'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleUpdateContact = (updatedContact: Contact) => {
    setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
  };

  // 1. TallyPrime Sync Execution
  const handleTriggerTallySync = () => {
    setIsTallySyncing(true);
    setTimeout(() => {
      const xmlResponse = getSimulatedTallyXmlResponse();
      const parsedLedgers = parseTallyXml(xmlResponse);

      let importedCount = 0;
      let updatedCount = 0;

      setContacts(prev => {
        const contactMap = new Map<string, Contact>(prev.map(c => [c.email.toLowerCase(), c]));

        for (const ledger of parsedLedgers) {
          if (!ledger.email) continue;
          const key = ledger.email.toLowerCase();
          const existing = contactMap.get(key);
          const isSuppressed = SuppressionService.isSuppressed(key, suppressionList);

          if (existing) {
            existing.companyName = ledger.name;
            existing.tallyOutstandingBalance = ledger.closingBalance;
            existing.tallyOverdueDays = ledger.overdueDays;
            if (isSuppressed) {
              existing.isSuppressed = true;
              existing.marketingConsent = false;
              existing.marketingStatus = 'UNSUBSCRIBED';
            }
            contactMap.set(key, existing);
            updatedCount++;
          } else {
            const newContact: Contact = {
              id: `CNT-TALLY-${Date.now()}-${importedCount}`,
              firstName: ledger.contactPerson.split(' ')[0] || 'Accounts',
              lastName: ledger.contactPerson.split(' ').slice(1).join(' ') || 'Head',
              email: ledger.email,
              phone: ledger.phone,
              companyName: ledger.name,
              designation: 'Finance Head',
              city: ledger.city,
              source: 'TALLY',
              marketingStatus: isSuppressed ? 'UNSUBSCRIBED' : 'ACTIVE',
              marketingConsent: !isSuppressed,
              tags: isSuppressed ? ['TallyPrime Customer', 'Suppressed on Import'] : ['TallyPrime Customer', 'Sundry Debtor'],
              consentStatus: isSuppressed ? 'unsubscribed' : 'double_opt_in',
              consentSource: 'Tally Invoicing Ledger Sync',
              consentDate: new Date().toISOString(),
              consentIp: '127.0.0.1',
              lifecycleStage: 'customer',
              tallyOutstandingBalance: ledger.closingBalance,
              tallyOverdueDays: ledger.overdueDays,
              totalEmailsSent: 0,
              totalEmailsOpened: 0,
              totalEmailsClicked: 0,
              unsubscribeToken: `unsub-${Math.random().toString(36).substring(2, 10)}`,
              isSuppressed: isSuppressed,
              createdAt: new Date().toISOString()
            };
            contactMap.set(key, newContact);
            importedCount++;
          }
        }
        return Array.from(contactMap.values());
      });

      // Update Tally Config & Logs
      setTallyConfig(prev => ({
        ...prev,
        lastSyncTime: new Date().toISOString()
      }));

      const newSyncLog: TallySyncLog = {
        id: `TSL-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'success',
        recordsImported: importedCount,
        recordsUpdated: updatedCount,
        discrepanciesCount: 0,
        details: `Synchronized ${parsedLedgers.length} ledgers from TallyPrime Sundry Debtors.`,
        xmlPayloadSnippet: xmlResponse.substring(0, 300) + '...'
      };
      setTallyLogs(prev => [newSyncLog, ...prev]);

      addAuditLog('TallyPrime Manual Sync', 'Tally Connector', `Imported: ${importedCount}, Updated: ${updatedCount} sundry debtor accounts.`);
      setIsTallySyncing(false);
    }, 900);
  };

  // 2. Add Contact
  const handleAddContact = (contactData: Partial<Contact>) => {
    const newContact: Contact = {
      id: `CNT-${Date.now()}`,
      firstName: contactData.firstName || 'Contact',
      lastName: contactData.lastName || '',
      email: contactData.email || '',
      phone: contactData.phone || '',
      companyName: contactData.companyName || 'Independent',
      designation: contactData.designation || 'Business Contact',
      fullName: `${contactData.firstName || ''} ${contactData.lastName || ''}`.trim() || 'Business Contact',
      emailNormalized: (contactData.email || '').trim().toLowerCase(),
      mobile: contactData.mobile || contactData.phone || '',
      mobileNormalized: (contactData.mobile || contactData.phone || '').replace(/[\s\-\(\)]/g, ''),
      source: contactData.source || 'MANUAL',
      marketingStatus: contactData.marketingStatus || 'ACTIVE',
      marketingConsent: contactData.marketingConsent ?? true,
      city: contactData.city || 'India',
      tags: contactData.tags || ['Direct Lead'],
      consentStatus: contactData.consentStatus || 'double_opt_in',
      consentSource: contactData.consentSource || 'Manual CRM Entry',
      consentDate: new Date().toISOString(),
      consentIp: '127.0.0.1',
      lifecycleStage: 'lead',
      tallyOutstandingBalance: contactData.tallyOutstandingBalance || 0,
      tallyOverdueDays: (contactData.tallyOutstandingBalance || 0) > 0 ? 30 : 0,
      totalEmailsSent: 0,
      totalEmailsOpened: 0,
      totalEmailsClicked: 0,
      unsubscribeToken: `unsub-${Math.random().toString(36).substring(2, 10)}`,
      isSuppressed: false,
      createdAt: new Date().toISOString()
    };

    setContacts(prev => [newContact, ...prev]);
    addAuditLog('Create Contact', 'Contacts Module', `Created record for ${newContact.email} (${newContact.companyName}) with status ${newContact.consentStatus}.`);
  };

  // 3. Update Consent
  const handleUpdateConsent = (contactId: string, newStatus: ConsentStatus) => {
    setContacts(prev => prev.map(c => {
      if (c.id === contactId) {
        const isSuppressed = newStatus === 'unsubscribed' || newStatus === 'bounced' || newStatus === 'complained';
        return {
          ...c,
          consentStatus: newStatus,
          isSuppressed
        };
      }
      return c;
    }));

    addAuditLog('Consent Status Override', 'Audit & Compliance', `Updated contact ID ${contactId} consent status to ${newStatus}.`);
  };

  // 3b. Master Contact Merge
  const handleMergeContacts = (mergedContact: Contact, archivedContactId: string) => {
    setContacts(prev => {
      // Replace primary contact with mergedContact, and mark or remove secondary
      return prev
        .filter(c => c.id !== archivedContactId)
        .map(c => c.id === mergedContact.id ? mergedContact : c);
    });

    addAuditLog('Master Contact Merged', 'Deduplication Engine', `Merged secondary contact ${archivedContactId} into master profile ${mergedContact.id} (${mergedContact.fullName || mergedContact.email}).`);
  };

  // 3c. Add Company
  const handleAddCompany = (newCompany: Company) => {
    setCompanies(prev => [newCompany, ...prev]);
    addAuditLog('Create Company', 'Company Directory', `Registered company entity ${newCompany.name} (GSTIN: ${newCompany.gstin || 'N/A'}).`);
  };

  // 4. File Import Complete
  const handleImportComplete = (newContacts: Contact[], updatedContacts: Contact[]) => {
    setContacts(prev => {
      const updatedMap = new Map(updatedContacts.map(c => [c.id, c]));
      const untouched = prev.filter(c => !updatedMap.has(c.id));
      return [...newContacts, ...updatedContacts, ...untouched];
    });

    addAuditLog('Spreadsheet Import', 'Import & Deduplication', `Batch imported ${newContacts.length} new records and updated ${updatedContacts.length} existing records.`);
  };

  // 5. Dynamic Segment Save (Create or Update)
  const handleSaveSegment = (segmentData: Partial<Segment>) => {
    if (segmentData.id && segments.some(s => s.id === segmentData.id)) {
      // Update existing segment
      setSegments(prev => prev.map(s => {
        if (s.id === segmentData.id) {
          return {
            ...s,
            ...segmentData,
            updatedAt: new Date().toISOString()
          } as Segment;
        }
        return s;
      }));
      addAuditLog('Update Segment', 'Dynamic Segments', `Updated rules and metadata for segment "${segmentData.name}".`);
    } else {
      // Create new segment
      const newSegment: Segment = {
        id: `SEG-${Date.now()}`,
        name: segmentData.name || 'Custom Audience',
        description: segmentData.description || 'Dynamic filter criteria',
        segmentType: segmentData.segmentType || 'DYNAMIC',
        isDynamic: segmentData.isDynamic ?? (segmentData.segmentType !== 'STATIC'),
        status: segmentData.status || 'ACTIVE',
        ruleTree: segmentData.ruleTree,
        matchType: segmentData.matchType || 'all',
        rules: segmentData.rules || [],
        totalContacts: segmentData.totalContacts || segmentData.estimatedCount || 0,
        estimatedCount: segmentData.estimatedCount || segmentData.cachedCount || 0,
        cachedCount: segmentData.cachedCount || segmentData.estimatedCount || 0,
        cachedAt: new Date().toISOString(),
        createdBy: segmentData.createdBy || 'Bhuvan Gupta',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setSegments(prev => [newSegment, ...prev]);
      addAuditLog('Create Segment', 'Dynamic Segments', `Created segment "${newSegment.name}" with dynamic rule tree.`);
    }
  };

  // Delete Segment
  const handleDeleteSegment = (segmentId: string) => {
    const target = segments.find(s => s.id === segmentId);
    setSegments(prev => prev.filter(s => s.id !== segmentId));
    addAuditLog('Delete Segment', 'Dynamic Segments', `Deleted segment "${target?.name || segmentId}".`);
  };

  // Duplicate Segment
  const handleDuplicateSegment = (segment: Segment) => {
    const duplicated: Segment = {
      ...segment,
      id: `SEG-${Date.now()}`,
      name: `${segment.name} (Copy)`,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setSegments(prev => [duplicated, ...prev]);
    addAuditLog('Duplicate Segment', 'Dynamic Segments', `Duplicated segment "${segment.name}" as draft.`);
  };

  // 6. Launch or Save Campaign (Phase 7)
  const handleLaunchCampaign = (campaignData: Partial<Campaign>) => {
    const campaignId = campaignData.id || `CMP-${Date.now().toString().slice(-5)}`;
    const status: CampaignStatus = campaignData.status || 'DRAFT';
    const nowIso = new Date().toISOString();

    const newCampaign: Campaign = {
      id: campaignId,
      name: campaignData.name || 'New Campaign',
      campaign_type: campaignData.campaign_type || 'Promotional',
      subject: campaignData.subject || 'Default Subject',
      preheader: campaignData.preheader || '',
      email_template_id: campaignData.email_template_id || 'tally_payment_reminder',
      html_content: campaignData.html_content || '<p>Default Content</p>',
      plain_text_content: campaignData.plain_text_content || '',
      from_name: campaignData.from_name || 'DIGISOFT Accounts Desk',
      from_email: campaignData.from_email || 'billing@notifications.digisoft.com',
      reply_to: campaignData.reply_to || 'accounts@digisoft.com',
      status: status,
      scheduled_at: campaignData.scheduled_at || null,
      started_at: status === 'PROCESSING' ? nowIso : null,
      completed_at: null,
      created_by: campaignData.created_by || 'Bhuvan Gupta',
      approved_by: campaignData.approved_by || null,
      created_at: nowIso,
      updated_at: nowIso,

      audience: campaignData.audience || {
        type: 'segment',
        segmentId: segments[0]?.id,
        segmentName: segments[0]?.name
      },
      esp_provider: campaignData.esp_provider || 'amazon_ses',
      chunk_size: campaignData.chunk_size || 500,
      rate_limit_per_second: campaignData.rate_limit_per_second || 50,
      recipients_snapshot: campaignData.recipients_snapshot || [],
      pre_send_validation: campaignData.pre_send_validation,
      structured_content: campaignData.structured_content,
      metrics: campaignData.metrics || {
        totalRecipients: campaignData.recipients_snapshot?.filter(s => s.status !== 'EXCLUDED').length || 10,
        sentCount: status === 'PROCESSING' ? 10 : 0,
        deliveredCount: 0,
        openedCount: 0,
        clickedCount: 0,
        bouncedHardCount: 0,
        bouncedSoftCount: 0,
        unsubscribedCount: 0,
        complainedCount: 0
      },
      activity_log: campaignData.activity_log || [
        {
          id: `act-${Date.now()}`,
          timestamp: nowIso,
          action: `Campaign Stored as ${status}`,
          user: 'Bhuvan Gupta',
          details: `Campaign initialized with status ${status}.`
        }
      ],

      // Backward compatibility:
      objective: campaignData.campaign_type || 'Promotional',
      senderName: campaignData.from_name || 'DIGISOFT Accounts Desk',
      senderEmail: campaignData.from_email || 'billing@notifications.digisoft.com',
      replyToEmail: campaignData.reply_to || 'accounts@digisoft.com',
      segmentId: campaignData.audience?.segmentId || segments[0]?.id,
      segmentName: campaignData.audience?.segmentName || segments[0]?.name,
      templateId: (campaignData.email_template_id as any) || 'tally_payment_reminder',
      espProvider: campaignData.esp_provider || 'amazon_ses',
      chunkSize: campaignData.chunk_size || 500,
      rateLimitPerSecond: campaignData.rate_limit_per_second || 50,
      scheduledAt: campaignData.scheduled_at || undefined,
      startedAt: status === 'PROCESSING' ? nowIso : undefined,
      createdAt: nowIso
    };

    setCampaigns(prev => [newCampaign, ...prev]);
    addAuditLog(`Campaign ${status}`, 'Campaign Studio', `Campaign "${newCampaign.name}" saved with status ${status}.`);

    // If immediate processing, simulate delivery completion
    if (status === 'PROCESSING') {
      setTimeout(() => {
        setCampaigns(prev => prev.map(c => {
          if (c.id === newCampaign.id) {
            const total = c.metrics.totalRecipients || 10;
            return {
              ...c,
              status: 'COMPLETED',
              completed_at: new Date().toISOString(),
              metrics: {
                ...c.metrics,
                sentCount: total,
                deliveredCount: total - 1,
                openedCount: Math.round(total * 0.65),
                clickedCount: Math.round(total * 0.32),
                bouncedSoftCount: 1
              },
              activity_log: [
                ...(c.activity_log || []),
                {
                  id: `act-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  action: 'Completed',
                  user: 'Horizon Worker',
                  details: `Transmission completed with ${(total - 1)} delivered.`
                }
              ]
            };
          }
          return c;
        }));
      }, 4000);
    }
  };

  const handleUpdateCampaign = (updatedCampaign: Campaign) => {
    setCampaigns(prev => prev.map(c => c.id === updatedCampaign.id ? updatedCampaign : c));
    addAuditLog('Campaign Updated', 'Campaign Studio', `Updated campaign "${updatedCampaign.name}" status to ${updatedCampaign.status}.`);
  };

  // 7. Test Email Dispatch
  const handleSendTestEmail = (email: { to: string; subject: string; html: string; campaignName: string }) => {
    const newMsg: TestEmailMessage = {
      id: `msg-${Date.now()}`,
      to: email.to,
      subject: email.subject,
      html: email.html,
      campaignName: email.campaignName,
      sentAt: new Date().toISOString(),
      isRead: false
    };
    setTestInboxEmails(prev => [newMsg, ...prev]);
    addAuditLog('Test Email Dispatched', 'Campaign Studio', `Delivered test preview of "${email.campaignName}" to ${email.to}.`);
  };

  // 8. Ingest Webhook Dispatch (Phase 9 Webhook Processing Engine)
  const handleDispatchWebhook = (params: {
    provider: ESPProviderType;
    payload: any;
    headers: Record<string, string>;
    signingSecret?: string;
    expectedToken?: string;
  }): WebhookIngestResult => {
    const { result, updatedEvents, updatedCampaigns, updatedContacts } = WebhookEventProcessor.processWebhook(
      {
        provider: params.provider,
        payload: params.payload,
        headers: params.headers,
        signingSecret: params.signingSecret,
        expectedToken: params.expectedToken
      },
      {
        campaigns,
        contacts,
        existingEvents: emailEvents
      }
    );

    if (result.success && result.status === 'PROCESSED') {
      setEmailEvents(updatedEvents);
      setCampaigns(updatedCampaigns);
      setContacts(updatedContacts);

      // Update webhook config telemetry
      setWebhookConfigs(prev => prev.map(wc => {
        if (wc.provider === params.provider) {
          return {
            ...wc,
            totalEventsProcessed: wc.totalEventsProcessed + result.eventsProcessedCount,
            lastEventReceivedAt: new Date().toISOString()
          };
        }
        return wc;
      }));

      addAuditLog(
        `Webhook Ingest: ${params.provider.toUpperCase()}`,
        'Webhook Processor',
        `Successfully processed ${result.eventsProcessedCount} event(s). Status: ${result.status}.`
      );
    } else if (result.status === 'IDEMPOTENT_DUPLICATE_SKIPPED') {
      // Update skipped count
      setWebhookConfigs(prev => prev.map(wc => {
        if (wc.provider === params.provider) {
          return {
            ...wc,
            duplicateEventsSkipped: wc.duplicateEventsSkipped + 1
          };
        }
        return wc;
      }));

      addAuditLog(
        `Webhook Deduplicated: ${params.provider.toUpperCase()}`,
        'Webhook Processor',
        `Idempotent duplicate event detected and safely skipped without double-counting.`
      );
    } else {
      // Failed validation
      setWebhookConfigs(prev => prev.map(wc => {
        if (wc.provider === params.provider) {
          return {
            ...wc,
            rejectedSignaturesCount: wc.rejectedSignaturesCount + 1
          };
        }
        return wc;
      }));

      addAuditLog(
        `Webhook Rejected: ${params.provider.toUpperCase()}`,
        'Security Validator',
        `Rejected webhook from ${params.provider}: ${result.message}`
      );
    }

    return result;
  };

  const handleUnsuppressContact = (contactId: string, reason: string) => {
    setContacts(prev => prev.map(c => {
      if (c.id === contactId) {
        return {
          ...c,
          marketingStatus: 'SUBSCRIBED',
          isSuppressed: false,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    }));
    addAuditLog('Compliance Override', 'Suppression Engine', `Unsuppressed contact ${contactId}. Reason: ${reason}`);
  };

  const handleSimulateWebhook = (event: 'open' | 'click' | 'bounce_soft' | 'bounce_hard' | 'complaint') => {
    const provider: ESPProviderType = 'amazon_ses';
    const targetCampaign = campaigns[0] || INITIAL_CAMPAIGNS[0];
    const targetContact = contacts[0] || INITIAL_CONTACTS[0];

    handleDispatchWebhook({
      provider,
      payload: {
        Type: 'Notification',
        MessageId: `ses-sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        SigningCertURL: 'https://sns.ap-south-1.amazonaws.com/SimpleNotificationService-sample.pem',
        Signature: 'VALID_MOCK_SES_SIG==',
        Message: JSON.stringify({
          eventType: event === 'open' ? 'Open' : event === 'click' ? 'Click' : event === 'bounce_hard' ? 'Bounce' : event === 'complaint' ? 'Complaint' : 'Delivery',
          mail: {
            messageId: `ses-msg-${Date.now()}`,
            destination: [targetContact.email],
            headers: [{ name: 'X-Campaign-ID', value: targetCampaign.id }]
          },
          open: event === 'open' ? { timestamp: new Date().toISOString(), ipAddress: '103.21.144.12' } : undefined,
          click: event === 'click' ? { timestamp: new Date().toISOString(), link: 'https://crm.digisoft.internal/reconcile', ipAddress: '103.21.144.12' } : undefined,
          bounce: event === 'bounce_hard' ? {
            bounceType: 'Permanent',
            bouncedRecipients: [{ emailAddress: targetContact.email, action: 'failed', status: '5.1.1', diagnosticCode: '550 User unknown' }]
          } : undefined,
          complaint: event === 'complaint' ? {
            complainedRecipients: [{ emailAddress: targetContact.email }],
            complaintFeedbackType: 'abuse'
          } : undefined
        })
      },
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer ses_token_v4_secret_auth'
      },
      signingSecret: 'aws_sns_sig_key_live_2026_9941a',
      expectedToken: 'ses_token_v4_secret_auth'
    });
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-['Inter',sans-serif] flex flex-col">
      {/* Top App Bar & Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenTestInbox={() => setIsTestInboxOpen(true)}
        onTriggerTallySync={handleTriggerTallySync}
        isTallySyncing={isTallySyncing}
        unreadTestEmailsCount={testInboxEmails.filter(e => !e.isRead).length}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'dashboard' && (
          <DashboardOverview
            contacts={contacts}
            campaigns={campaigns}
            espConfigs={espConfigs}
            tallyConfig={tallyConfig}
            onNavigate={setCurrentTab}
            onSelectCampaign={(cmp) => {
              setCurrentTab('campaigns');
            }}
            onTriggerTallySync={handleTriggerTallySync}
            isTallySyncing={isTallySyncing}
          />
        )}

        {currentTab === 'contacts' && (
          <ContactsHub
            contacts={contacts}
            companies={companies}
            onAddContact={handleAddContact}
            onMergeContacts={handleMergeContacts}
            onAddCompany={handleAddCompany}
            onUpdateConsent={handleUpdateConsent}
            onNavigateToImport={() => setCurrentTab('import')}
          />
        )}

        {currentTab === 'tally' && (
          <TallySyncCenter
            config={tallyConfig}
            logs={tallyLogs}
            onSaveConfig={(cfg) => {
              setTallyConfig(cfg);
              addAuditLog('Update Tally Settings', 'Tally Connector', `Updated Tally connection to ${cfg.host}:${cfg.port}.`);
            }}
            onRunSync={handleTriggerTallySync}
            isSyncing={isTallySyncing}
          />
        )}

        {currentTab === 'import' && (
          <ImportCenter
            existingContacts={contacts}
            onImportComplete={handleImportComplete}
            onNavigateToContacts={() => setCurrentTab('contacts')}
          />
        )}

        {currentTab === 'segments' && (
          <DynamicSegments
            segments={segments}
            contacts={contacts}
            companies={companies}
            onSaveSegment={handleSaveSegment}
            onLaunchCampaignForSegment={(seg) => {
              setPreselectedSegmentForCampaign(seg);
              setCurrentTab('campaigns');
            }}
            onDeleteSegment={handleDeleteSegment}
            onDuplicateSegment={handleDuplicateSegment}
          />
        )}

        {currentTab === 'templates' && (
          <EmailTemplates
            templates={emailTemplates}
            onUpdateTemplates={setEmailTemplates}
            contacts={contacts}
            companies={companies}
            onSendTestEmail={({ to, subject, html, templateName }) => {
              handleSendTestEmail({ to, subject, html, campaignName: templateName });
              setIsTestInboxOpen(true);
            }}
            onAddAuditLog={addAuditLog}
          />
        )}

        {currentTab === 'campaigns' && (
          <CampaignStudio
            campaigns={campaigns}
            segments={segments}
            contacts={contacts}
            managedTemplates={emailTemplates}
            preselectedSegment={preselectedSegmentForCampaign}
            onLaunchCampaign={handleLaunchCampaign}
            onUpdateCampaign={handleUpdateCampaign}
            onSendTestEmail={handleSendTestEmail}
            onNavigateToTemplates={() => setCurrentTab('templates')}
          />
        )}

        {currentTab === 'analytics' && (
          <CampaignAnalyticsDashboard
            campaigns={campaigns}
            contacts={contacts}
            events={emailEvents}
            webhookConfigs={webhookConfigs}
            selectedCampaignId={selectedAnalyticsCampaignId}
            onSelectCampaign={setSelectedAnalyticsCampaignId}
            onDispatchWebhook={handleDispatchWebhook}
            onUnsuppressContact={handleUnsuppressContact}
          />
        )}

        {currentTab === 'ai-assistant' && (
          <AiContentAssistant
            isStandalone={true}
          />
        )}

        {currentTab === 'deliverability' && (
          <DeliverabilityCenter
            campaigns={campaigns}
            contacts={contacts}
            providerConfigs={providerConfigs}
            espConfigs={espConfigs}
            onUpdateConfig={(prov, cfg) => {
              setEspConfigs(prev => ({
                ...prev,
                [prov]: { ...prev[prov], ...cfg }
              }));
              addAuditLog('Update ESP Config', 'ESP Abstraction', `Updated configuration for ${prov}.`);
            }}
            onUpdateProviderConfig={(id, updated) => {
              setProviderConfigs(prev => prev.map(p => p.id === id ? { ...p, ...updated, updated_at: new Date().toISOString() } : p));
              addAuditLog('Update ESP Provider', 'Delivery Engine', `Updated ESP Provider configuration for ${id}`);
            }}
            onAddProviderConfig={(newConfig) => {
              setProviderConfigs(prev => [...prev, newConfig]);
              addAuditLog('Add ESP Provider', 'Delivery Engine', `Added new ESP provider ${newConfig.name} (${newConfig.provider})`);
            }}
            onSetDefaultProvider={(id) => {
              setProviderConfigs(prev => prev.map(p => ({
                ...p,
                is_default: p.id === id,
                status: p.id === id ? 'active' : (p.status === 'active' ? 'standby' : p.status)
              })));
              addAuditLog('Set Default ESP Provider', 'Delivery Engine', `Promoted provider ${id} to default active gateway`);
            }}
            onUpdateCampaign={handleUpdateCampaign}
            onSimulateWebhook={handleSimulateWebhook}
          />
        )}

        {currentTab === 'audit' && (
          <AuditComplianceHub
            auditLogs={auditLogs}
            contacts={contacts}
          />
        )}

        {currentTab === 'architecture' && (
          <LaravelArchitectureViewer />
        )}
      </main>

      {/* Virtual Test Inbox Modal */}
      <VirtualTestInboxModal
        isOpen={isTestInboxOpen}
        onClose={() => setIsTestInboxOpen(false)}
        emails={testInboxEmails}
        onClearInbox={() => setTestInboxEmails([])}
      />
    </div>
  );
}
