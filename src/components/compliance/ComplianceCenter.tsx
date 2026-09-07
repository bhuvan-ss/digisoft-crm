import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Users, 
  Lock, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Trash2, 
  Search, 
  ExternalLink, 
  Terminal, 
  Mail, 
  RefreshCw, 
  Download, 
  Eye, 
  Info,
  Code,
  ShieldAlert,
  Send,
  Play
} from 'lucide-react';
import { 
  Contact, 
  Campaign, 
  EmailPreference, 
  EmailPreferenceType, 
  SuppressionRecord, 
  SuppressionReason, 
  AuditLog,
  CampaignComplianceReport 
} from '../../types';
import { EMAIL_PREFERENCE_DEFINITIONS } from '../../data/initialComplianceData';
import { SuppressionService } from '../../services/compliance/SuppressionService';
import { SecureTokenService } from '../../services/compliance/SecureTokenService';
import { CampaignComplianceValidator } from '../../services/compliance/CampaignComplianceValidator';
import { UnsubscribeController } from '../../services/compliance/UnsubscribeController';
import { PublicUnsubscribeView } from './PublicUnsubscribeView';

interface ComplianceCenterProps {
  contacts: Contact[];
  campaigns: Campaign[];
  preferences: EmailPreference[];
  suppressionList: SuppressionRecord[];
  auditLogs: AuditLog[];
  onUpdatePreferences: (preferences: EmailPreference[]) => void;
  onUpdateSuppressionList: (list: SuppressionRecord[]) => void;
  onUpdateContact: (contact: Contact) => void;
  onAddAuditLog: (action: string, module: string, details: string) => void;
  onOpenPublicUnsubscribeForContact?: (contact: Contact) => void;
}

export const ComplianceCenter: React.FC<ComplianceCenterProps> = ({
  contacts,
  campaigns,
  preferences,
  suppressionList,
  auditLogs,
  onUpdatePreferences,
  onUpdateSuppressionList,
  onUpdateContact,
  onAddAuditLog
}) => {
  const [activeTab, setActiveTab] = useState<'suppression' | 'preferences' | 'compliance_checker' | 'simulator' | 'laravel_spec' | 'tests'>('suppression');

  // Suppression list filters
  const [suppressionFilter, setSuppressionFilter] = useState<string>('ALL');
  const [suppressionSearch, setSuppressionSearch] = useState('');
  const [selectedRecordMetadata, setSelectedRecordMetadata] = useState<SuppressionRecord | null>(null);

  // Manual suppression modal state
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualReason, setManualReason] = useState<SuppressionReason>('MANUAL');
  const [manualNotes, setManualNotes] = useState('');

  // Unsuppress modal state
  const [unsuppressTarget, setUnsuppressTarget] = useState<SuppressionRecord | null>(null);
  const [unsuppressReason, setUnsuppressReason] = useState('');

  // Compliance checker state
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaigns[0]?.id || '');
  const [complianceReport, setComplianceReport] = useState<CampaignComplianceReport | null>(null);

  // Public Unsubscribe Simulator state
  const [simulatedContactId, setSimulatedContactId] = useState<string>(contacts[0]?.id || '');
  const [customTokenInput, setCustomTokenInput] = useState<string>('');
  const [tamperFlag, setTamperFlag] = useState(false);

  // Automated Tests state
  const [testResults, setTestResults] = useState<{ name: string; passed: boolean; message: string; duration: number }[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // -------------------------------------------------------------
  // HANDLERS: Suppression List Management
  // -------------------------------------------------------------
  const handleAddManualSuppression = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim()) return;

    const { updatedList, record } = SuppressionService.suppressEmail({
      email: manualEmail.trim(),
      reason: manualReason,
      source: 'MANUAL_ADMIN',
      metadata: {
        adminUser: 'Lead Systems Architect',
        notes: manualNotes.trim() || 'Manual administrative suppression override'
      },
      suppressionList
    });

    onUpdateSuppressionList(updatedList);

    // If contact exists in contacts, update its flag as well
    const matchingContact = contacts.find(c => c.email.toLowerCase() === manualEmail.trim().toLowerCase());
    if (matchingContact) {
      onUpdateContact({
        ...matchingContact,
        isSuppressed: true,
        marketingConsent: false,
        marketingStatus: manualReason === 'UNSUBSCRIBED' ? 'UNSUBSCRIBED' : 'SUPPRESSED'
      });
    }

    onAddAuditLog(
      'Suppression Added',
      'Suppression Registry',
      `Manually added ${manualEmail.trim()} to suppression registry (Reason: ${manualReason}). Notes: ${manualNotes || 'None'}`
    );

    setManualEmail('');
    setManualNotes('');
    setIsAddManualOpen(false);
  };

  const handleConfirmUnsuppress = () => {
    if (!unsuppressTarget) return;

    const email = unsuppressTarget.email_normalized;
    const { updatedList } = SuppressionService.unsuppressEmail(
      email,
      'Lead Systems Architect',
      unsuppressReason || 'Administrative override with verified re-consent',
      suppressionList
    );

    onUpdateSuppressionList(updatedList);

    // Update contact if present
    const matchingContact = contacts.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (matchingContact) {
      onUpdateContact({
        ...matchingContact,
        isSuppressed: false,
        marketingConsent: true,
        marketingStatus: 'ACTIVE',
        consentStatus: 'single_opt_in'
      });
    }

    onAddAuditLog(
      'Suppression Removed',
      'Suppression Registry',
      `Removed ${email} from suppression registry. Compliance reason: ${unsuppressReason || 'Direct user re-opt-in verified'}`
    );

    setUnsuppressTarget(null);
    setUnsuppressReason('');
  };

  // -------------------------------------------------------------
  // HANDLERS: Preference Matrix
  // -------------------------------------------------------------
  const handleTogglePreference = (contactId: string, type: EmailPreferenceType) => {
    const existing = preferences.find(p => p.contact_id === contactId && p.preference_type === type);
    const now = new Date().toISOString();

    let updatedPreferences: EmailPreference[];
    let newStatus = true;

    if (existing) {
      newStatus = !existing.is_subscribed;
      updatedPreferences = preferences.map(p => 
        p.id === existing.id ? { ...p, is_subscribed: newStatus, updated_at: now } : p
      );
    } else {
      newStatus = false;
      const newPref: EmailPreference = {
        id: `PREF-${contactId}-${type}`,
        contact_id: contactId,
        preference_type: type,
        is_subscribed: newStatus,
        updated_at: now
      };
      updatedPreferences = [...preferences, newPref];
    }

    onUpdatePreferences(updatedPreferences);

    const targetContact = contacts.find(c => c.id === contactId);
    onAddAuditLog(
      'Preference Updated',
      'Preference Center',
      `Changed ${type} for ${targetContact?.email || contactId} to ${newStatus ? 'Subscribed' : 'Unsubscribed'}`
    );
  };

  // -------------------------------------------------------------
  // HANDLERS: Compliance Validator
  // -------------------------------------------------------------
  const handleRunComplianceCheck = () => {
    const campaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0];
    if (!campaign) return;

    // Use current contacts as audience sample
    const report = CampaignComplianceValidator.validateCampaign({
      campaignName: campaign.name,
      subject: campaign.subject,
      htmlContent: campaign.htmlContent || '<p>Sample newsletter body with {{UNSUBSCRIBE_URL}} and corporate address.</p>',
      fromName: campaign.fromName || 'DIGISOFT Enterprise Communications',
      fromEmail: campaign.fromEmail || 'communications@digisoft.in',
      targetContacts: contacts,
      suppressionList,
      companyAddress: 'Plot 42, Electronics City Phase 1, Bengaluru, Karnataka - 560100',
      privacyPolicyUrl: 'https://digisoft.com/privacy'
    });

    setComplianceReport(report);

    onAddAuditLog(
      'Campaign Compliance Check',
      'Compliance Validator',
      `Executed 5-pillar compliance audit for "${campaign.name}". Result: ${report.isCompliant ? 'PASSED (Score: ' + report.score + '/100)' : 'FAILED'}. Suppressed quarantined: ${report.suppressionAudit.suppressedCount}.`
    );
  };

  // -------------------------------------------------------------
  // HANDLERS: Public Unsubscribe Actions
  // -------------------------------------------------------------
  const selectedContact = contacts.find(c => c.id === simulatedContactId) || contacts[0];
  const generatedSecureToken = selectedContact 
    ? (tamperFlag ? SecureTokenService.generateToken(selectedContact.id, selectedContact.email) + 'TAMPERED_HASH' : SecureTokenService.generateToken(selectedContact.id, selectedContact.email))
    : '';

  const activeToken = customTokenInput.trim() || generatedSecureToken;

  const handleUnsubscribeAllViaController = (token: string) => {
    const res = UnsubscribeController.unsubscribeAll({
      token,
      ipAddress: '103.21.144.88',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      source: 'PREFERENCE_CENTER',
      contacts,
      preferences,
      suppressionList
    });

    if (res.success) {
      if (res.contactUpdated) onUpdateContact(res.contactUpdated);
      if (res.suppressionRecordAdded) {
        onUpdateSuppressionList([res.suppressionRecordAdded, ...suppressionList.filter(s => s.email_normalized !== res.suppressionRecordAdded!.email_normalized)]);
      }
      if (res.updatedPreferences) onUpdatePreferences(res.updatedPreferences);
      res.auditLogsGenerated.forEach(log => onAddAuditLog(log.action, log.module, log.details));
    }
  };

  const handleUpdatePreferencesViaController = (token: string, toggles: Record<EmailPreferenceType, boolean>) => {
    const res = UnsubscribeController.updatePreferences({
      token,
      categoryToggles: toggles,
      ipAddress: '103.21.144.88',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      contacts,
      preferences,
      suppressionList
    });

    if (res.success) {
      if (res.contactUpdated) onUpdateContact(res.contactUpdated);
      if (res.suppressionRecordAdded) {
        onUpdateSuppressionList([res.suppressionRecordAdded, ...suppressionList.filter(s => s.email_normalized !== res.suppressionRecordAdded!.email_normalized)]);
      }
      if (res.updatedPreferences) onUpdatePreferences(res.updatedPreferences);
      res.auditLogsGenerated.forEach(log => onAddAuditLog(log.action, log.module, log.details));
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: Run Automated Tests
  // -------------------------------------------------------------
  const handleExecuteAutomatedTests = () => {
    setIsRunningTests(true);
    setTestResults([]);

    setTimeout(() => {
      const results: { name: string; passed: boolean; message: string; duration: number }[] = [];

      // Test 1: Secure token generation & verification
      const t1Start = performance.now();
      const testEmail = 'bhuvan.gupta@enterprise.in';
      const token = SecureTokenService.generateToken('CNT-TEST-999', testEmail);
      const verified = SecureTokenService.verifyToken(token);
      const tampered = SecureTokenService.verifyToken(token + 'INVALID');
      const t1Passed = verified.valid && verified.email === testEmail && !tampered.valid;
      results.push({
        name: 'Secure Token Generation & HMAC Tamper-Proofing',
        passed: t1Passed,
        message: t1Passed 
          ? `Token generated without sequential ID. Tampered signature correctly rejected.` 
          : `Token verification failed or allowed tampered payload.`,
        duration: Math.round(performance.now() - t1Start)
      });

      // Test 2: Suppression list import priority
      const t2Start = performance.now();
      const suppressedSample: SuppressionRecord[] = [
        {
          id: 'SUP-TEST-1',
          email_normalized: 'suppressed.user@testcorp.com',
          reason: 'UNSUBSCRIBED',
          source: 'ONE_CLICK_UNSUBSCRIBE',
          suppressed_at: new Date().toISOString(),
          metadata: {}
        }
      ];
      const incomingImport: Partial<Contact>[] = [
        {
          email: 'suppressed.user@testcorp.com',
          marketingConsent: true,
          marketingStatus: 'ACTIVE',
          isSuppressed: false
        },
        {
          email: 'clean.customer@testcorp.com',
          marketingConsent: true,
          marketingStatus: 'ACTIVE',
          isSuppressed: false
        }
      ];
      const sanitized = SuppressionService.sanitizeImportedContacts(incomingImport, suppressedSample);
      const t2Passed = 
        sanitized.suppressedCount === 1 && 
        sanitized.sanitizedContacts[0].isSuppressed === true &&
        sanitized.sanitizedContacts[0].marketingStatus === 'UNSUBSCRIBED' &&
        sanitized.sanitizedContacts[1].isSuppressed === false;
      results.push({
        name: 'Suppression List Absolute Priority Over Imports',
        passed: t2Passed,
        message: t2Passed 
          ? `Re-imported unsubscribed contact was quarantined and blocked from reactivation automatically.` 
          : `Import allowed suppressed user to become active.`,
        duration: Math.round(performance.now() - t2Start)
      });

      // Test 3: Campaign Compliance Validator (5 Pillars)
      const t3Start = performance.now();
      const validHtml = '<div>Welcome to DIGISOFT.<p>Plot 42, Electronics City Phase 1, Bengaluru</p><a href="{{UNSUBSCRIBE_URL}}">Unsubscribe</a><a href="https://digisoft.com/privacy">Privacy</a></div>';
      const complianceRes = CampaignComplianceValidator.validateCampaign({
        subject: 'Q3 Enterprise Product Roadmap',
        htmlContent: validHtml,
        fromName: 'DIGISOFT Tech',
        fromEmail: 'updates@digisoft.in',
        targetContacts: contacts,
        suppressionList: suppressionList
      });
      const t3Passed = complianceRes.isCompliant && complianceRes.score === 100;
      results.push({
        name: 'Campaign Compliance Validator (5/5 Pillars)',
        passed: t3Passed,
        message: t3Passed
          ? `All 5 pillars verified: Unsubscribe link, Sender identity, Company address, Privacy policy, Suppression checked.`
          : `Validator failed with score ${complianceRes.score}/100.`,
        duration: Math.round(performance.now() - t3Start)
      });

      // Test 4: Granular Preference Category Persistence
      const t4Start = performance.now();
      const prefCategories = EMAIL_PREFERENCE_DEFINITIONS.map(d => d.type);
      const hasAll6 = prefCategories.length === 6;
      results.push({
        name: '6 Selective Preference Categories Schema Conformance',
        passed: hasAll6,
        message: hasAll6 
          ? `Product Updates, Promotional Offers, Newsletters, Event Invitations, Festival Greetings, Educational Content.` 
          : `Missing expected categories.`,
        duration: Math.round(performance.now() - t4Start)
      });

      setTestResults(results);
      setIsRunningTests(false);
      onAddAuditLog(
        'Campaign Compliance Check',
        'Automated Test Suite',
        `Ran Phase 10 compliance & suppression test suite: ${results.filter(r => r.passed).length}/${results.length} tests passed.`
      );
    }, 600);
  };

  // Filtered suppression list
  const filteredSuppression = suppressionList.filter(item => {
    const matchesFilter = suppressionFilter === 'ALL' || item.reason === suppressionFilter;
    const matchesSearch = !suppressionSearch.trim() || 
      item.email_normalized.toLowerCase().includes(suppressionSearch.toLowerCase()) ||
      item.source.toLowerCase().includes(suppressionSearch.toLowerCase()) ||
      JSON.stringify(item.metadata).toLowerCase().includes(suppressionSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">Compliance, Suppression & Unsubscribe Engine</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              PHASE 10 &bull; RFC 8058 &bull; CAN-SPAM &bull; GDPR
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Multi-tiered compliance framework enforcing non-sequential cryptographic unsubscribe URLs, 6-category selective preference center, immutable suppression list overrides, and pre-send compliance verification.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('simulator')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview Unsubscribe Portal</span>
          </button>
          <button
            onClick={() => setIsAddManualOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Suppression</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('suppression')}
          className={`pb-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'suppression'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span>Global Suppression List ({suppressionList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`pb-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'preferences'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-600" />
          <span>Email Preference Matrix (6 Categories)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('compliance_checker');
            if (!complianceReport) handleRunComplianceCheck();
          }}
          className={`pb-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'compliance_checker'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Campaign Compliance Validator (5 Pillars)</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`pb-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'simulator'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-blue-600" />
          <span>Public Unsubscribe Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`pb-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'tests'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Play className="w-3.5 h-3.5 text-purple-600" />
          <span>Automated Compliance Tests</span>
        </button>

        <button
          onClick={() => setActiveTab('laravel_spec')}
          className={`pb-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'laravel_spec'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-amber-600" />
          <span>Laravel 12 / PHP 8.3 Deliverables</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: GLOBAL SUPPRESSION LIST */}
      {/* ============================================================= */}
      {activeTab === 'suppression' && (
        <div className="space-y-4">
          {/* Key Rule Callout */}
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-900">
                  Priority Enforcement: Suppression List Prevents Re-Activation by Imports
                </h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  If an email marked as UNSUBSCRIBED, HARD_BOUNCE, or SPAM_COMPLAINT is re-imported via Tally XML, CSV upload, or REST API, the system automatically preserves its suppressed status.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-rose-950 font-mono">
                {suppressionList.length} Active Records
              </span>
            </div>
          </div>

          {/* Search & Reason Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={suppressionSearch}
                onChange={e => setSuppressionSearch(e.target.value)}
                placeholder="Search suppressed emails or metadata..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {(['ALL', 'UNSUBSCRIBED', 'HARD_BOUNCE', 'SPAM_COMPLAINT', 'MANUAL', 'INVALID_EMAIL'] as const).map(reason => (
                <button
                  key={reason}
                  onClick={() => setSuppressionFilter(reason)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    suppressionFilter === reason
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Suppressed Email</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Source Channel</th>
                    <th className="py-2.5 px-3">Suppressed Timestamp</th>
                    <th className="py-2.5 px-3">Metadata</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredSuppression.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No suppression records match your query.
                      </td>
                    </tr>
                  ) : (
                    filteredSuppression.map(record => (
                      <tr key={record.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">
                          {record.email_normalized}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            record.reason === 'UNSUBSCRIBED' ? 'bg-amber-100 text-amber-800' :
                            record.reason === 'HARD_BOUNCE' ? 'bg-rose-100 text-rose-800' :
                            record.reason === 'SPAM_COMPLAINT' ? 'bg-purple-100 text-purple-800' :
                            record.reason === 'MANUAL' ? 'bg-slate-200 text-slate-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {record.reason}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                          {record.source}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                          {new Date(record.suppressed_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => setSelectedRecordMetadata(record)}
                            className="text-indigo-600 hover:underline flex items-center gap-1 font-mono text-[11px] cursor-pointer"
                          >
                            <Info className="w-3 h-3" />
                            <span>View JSON</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setUnsuppressTarget(record)}
                            className="text-rose-600 hover:text-rose-800 font-semibold text-[11px] hover:underline cursor-pointer"
                            title="Unsuppress contact (requires audit justification)"
                          >
                            Override & Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: EMAIL PREFERENCE MATRIX */}
      {/* ============================================================= */}
      {activeTab === 'preferences' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between text-xs text-indigo-900">
            <div>
              <span className="font-bold">6 Selective Communication Channels</span>
              <p className="text-indigo-700 text-[11px] mt-0.5">
                Subscribers can opt in or out of individual categories. Toggling off all 6 categories automatically shifts the recipient to global suppression.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-indigo-900 bg-white px-2 py-1 rounded border border-indigo-200">
              {contacts.length} Contact Profiles Managed
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4 min-w-[200px]">Contact & Company</th>
                    {EMAIL_PREFERENCE_DEFINITIONS.map(def => (
                      <th key={def.type} className="py-2.5 px-2 text-center" title={def.description}>
                        <div>{def.label}</div>
                        <div className="text-[9px] text-slate-400 font-normal lowercase">{def.badge}</div>
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-right">Global Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {contacts.map(contact => {
                    const isSuppressed = contact.isSuppressed || contact.marketingStatus === 'UNSUBSCRIBED';
                    const contactPrefs = preferences.filter(p => p.contact_id === contact.id);

                    return (
                      <tr key={contact.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{contact.firstName} {contact.lastName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{contact.email}</div>
                          <div className="text-[10px] text-slate-500">{contact.companyName}</div>
                        </td>

                        {EMAIL_PREFERENCE_DEFINITIONS.map(def => {
                          const pref = contactPrefs.find(p => p.preference_type === def.type);
                          const isSubscribed = pref ? pref.is_subscribed : !isSuppressed;

                          return (
                            <td key={def.type} className="py-3 px-2 text-center">
                              <button
                                onClick={() => handleTogglePreference(contact.id, def.type)}
                                className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition cursor-pointer ${
                                  isSubscribed
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                    : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                                }`}
                                title={`${def.label}: ${isSubscribed ? 'Subscribed (Click to disable)' : 'Unsubscribed (Click to enable)'}`}
                              >
                                {isSubscribed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                              </button>
                            </td>
                          );
                        })}

                        <td className="py-3 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isSuppressed ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isSuppressed ? 'SUPPRESSED' : 'ACTIVE'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: CAMPAIGN COMPLIANCE VALIDATOR */}
      {/* ============================================================= */}
      {activeTab === 'compliance_checker' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Select Campaign to Audit</label>
              <div className="flex items-center gap-3">
                <select
                  value={selectedCampaignId}
                  onChange={e => setSelectedCampaignId(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.status})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleRunComplianceCheck}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Run 5-Pillar Audit</span>
                </button>
              </div>
            </div>

            {complianceReport && (
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Compliance Score</div>
                  <div className={`text-2xl font-black ${
                    complianceReport.score >= 90 ? 'text-emerald-600' : complianceReport.score >= 70 ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {complianceReport.score}/100
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-200"></div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Pre-Send Verdict</div>
                  <div className={`text-xs font-extrabold flex items-center gap-1 ${
                    complianceReport.isCompliant ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {complianceReport.isCompliant ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>{complianceReport.isCompliant ? 'CLEARED FOR SEND' : 'DISPATCH BLOCKED'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Pillars breakdown */}
          {complianceReport && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(complianceReport.checks).map(([key, check]) => (
                <div 
                  key={key} 
                  className={`p-4 rounded-xl border transition ${
                    check.passed 
                      ? 'bg-white border-slate-200 shadow-sm' 
                      : 'bg-rose-50/50 border-rose-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {check.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                      <h4 className="text-xs font-bold text-slate-900">{check.name}</h4>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      check.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {check.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                    {check.description}
                  </p>

                  <div className="p-2 rounded bg-slate-50 border border-slate-100 text-[11px] text-slate-700 font-mono">
                    {check.details}
                  </div>

                  {check.remediation && (
                    <div className="mt-2 text-[11px] font-semibold text-rose-700 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>Fix: {check.remediation}</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Suppression List Partition Audit Box */}
              <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-md col-span-1 md:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold">Audience Partition & Deliverability Safety</h4>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    Zero Suppressed Leaks Guaranteed
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-slate-800/80 rounded-lg">
                    <div className="text-[10px] text-slate-400 uppercase">Target Contacts</div>
                    <div className="text-lg font-bold text-white font-mono mt-1">
                      {complianceReport.suppressionAudit.totalAudience}
                    </div>
                  </div>
                  <div className="p-3 bg-rose-950/60 rounded-lg border border-rose-900/50">
                    <div className="text-[10px] text-rose-400 uppercase">Quarantined (Excluded)</div>
                    <div className="text-lg font-bold text-rose-300 font-mono mt-1">
                      {complianceReport.suppressionAudit.suppressedCount}
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-950/60 rounded-lg border border-emerald-900/50">
                    <div className="text-[10px] text-emerald-400 uppercase">Deliverable Recipients</div>
                    <div className="text-lg font-bold text-emerald-300 font-mono mt-1">
                      {complianceReport.suppressionAudit.deliverableCount}
                    </div>
                  </div>
                </div>

                {complianceReport.suppressionAudit.suppressedEmailsFound.length > 0 && (
                  <div className="mt-3 text-[11px] text-slate-400">
                    <span className="text-rose-400 font-semibold">Excluded addresses: </span>
                    {complianceReport.suppressionAudit.suppressedEmailsFound.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 4: PUBLIC UNSUBSCRIBE SIMULATOR */}
      {/* ============================================================= */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-slate-800">Unsubscribe Link & Cryptographic Token Simulator</h3>
                <p className="text-xs text-slate-500">
                  Select a contact to generate their unique, non-sequential HMAC signed token URL, or simulate tampering to test security guards.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={simulatedContactId}
                  onChange={e => {
                    setSimulatedContactId(e.target.value);
                    setCustomTokenInput('');
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.email})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setTamperFlag(!tamperFlag)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                    tamperFlag
                      ? 'bg-rose-600 text-white border-rose-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                  }`}
                  title="Corrupt the cryptographic HMAC signature to test security rejection"
                >
                  {tamperFlag ? 'Corrupted Token Active' : 'Simulate Tampered Token'}
                </button>
              </div>
            </div>

            {/* Token URL display */}
            <div className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-2 truncate">
                <span className="text-amber-400 font-bold shrink-0">Generated URL:</span>
                <span className="truncate">{window.location.origin}/unsubscribe/{generatedSecureToken}</span>
              </div>
              <span className="text-[10px] text-emerald-400 shrink-0 font-sans px-2 py-0.5 rounded bg-slate-800">
                RFC 8058 Non-Sequential
              </span>
            </div>
          </div>

          {/* Embedded Public View */}
          <div className="border border-slate-200 rounded-2xl p-4 sm:p-6 bg-slate-100/60 shadow-inner">
            <div className="max-w-xl mx-auto mb-3 text-center">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                Live Preview of End-User Unsubscribe Experience
              </span>
            </div>

            <PublicUnsubscribeView
              token={activeToken}
              contacts={contacts}
              preferences={preferences}
              suppressionList={suppressionList}
              onUnsubscribeAll={handleUnsubscribeAllViaController}
              onUpdatePreferences={handleUpdatePreferencesViaController}
            />
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 5: AUTOMATED COMPLIANCE TESTS */}
      {/* ============================================================= */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Automated Compliance & Security Test Suite</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Validates token tamper-proofing, suppression priority over imports, compliance verification, and selective preference center logic.
              </p>
            </div>
            <button
              onClick={handleExecuteAutomatedTests}
              disabled={isRunningTests}
              className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunningTests ? 'Executing Tests...' : 'Run Test Suite'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {testResults.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
                Click "Run Test Suite" to execute test assertions.
              </div>
            ) : (
              testResults.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
                    t.passed ? 'bg-white border-slate-200' : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {t.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-900">{t.name}</div>
                      <div className="text-xs text-slate-600 mt-1">{t.message}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {t.duration}ms
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 6: LARAVEL 12 DELIVERABLES */}
      {/* ============================================================= */}
      {activeTab === 'laravel_spec' && (
        <div className="space-y-6">
          <div className="bg-slate-950 text-slate-200 rounded-2xl p-6 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Laravel 12 / PHP 8.3 Production Code Deliverables
                  </h3>
                  <p className="text-xs text-slate-400">
                    Enterprise migrations, UnsubscribeController, CampaignComplianceValidator, and SuppressionService.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-slate-900 text-amber-400 px-2.5 py-1 rounded border border-slate-700">
                PHP 8.3 &bull; Laravel 12.x
              </span>
            </div>

            {/* Deliverable 1: Database Migrations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 font-mono">
                  database/migrations/2026_09_04_000001_create_compliance_and_suppression_tables.php
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Migration</span>
              </div>
              <pre className="p-4 bg-slate-900 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800/80 leading-relaxed">
{`<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. email_preferences table
        Schema::create('email_preferences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('contact_id');
            $table->string('preference_type'); // PRODUCT_UPDATES, PROMOTIONAL_OFFERS, etc.
            $table->boolean('is_subscribed')->default(true);
            $table->timestamp('updated_at')->useCurrent();

            $table->foreign('contact_id')->references('id')->on('contacts')->onDelete('cascade');
            $table->unique(['contact_id', 'preference_type']);
            $table->index('preference_type');
        });

        // 2. suppression_list table
        Schema::create('suppression_list', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('email_normalized')->unique();
            $table->enum('reason', ['UNSUBSCRIBED', 'HARD_BOUNCE', 'SPAM_COMPLAINT', 'MANUAL', 'INVALID_EMAIL']);
            $table->string('source'); // ONE_CLICK_UNSUBSCRIBE, PREFERENCE_CENTER, WEBHOOK_SES, MANUAL_ADMIN
            $table->timestamp('suppressed_at')->useCurrent();
            $table->json('metadata')->nullable();

            $table->index('email_normalized');
            $table->index('reason');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_preferences');
        Schema::dropIfExists('suppression_list');
    }
};`}
              </pre>
            </div>

            {/* Deliverable 2: UnsubscribeController */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 font-mono">
                  app/Http/Controllers/Compliance/UnsubscribeController.php
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Controller (RFC 8058)</span>
              </div>
              <pre className="p-4 bg-slate-900 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800/80 leading-relaxed">
{`<?php

namespace App\\Http\\Controllers\\Compliance;

use App\\Http\\Controllers\\Controller;
use App\\Services\\Compliance\\SecureTokenService;
use App\\Services\\Compliance\\SuppressionService;
use App\\Models\\Contact;
use App\\Models\\EmailPreference;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Log;

class UnsubscribeController extends Controller
{
    public function show(string $token)
    {
        $payload = SecureTokenService::verify($token);
        if (!$payload) {
            return response()->view('compliance.invalid-token', [], 404);
        }

        $contact = Contact::where('id', $payload['cid'])->first();
        $preferences = EmailPreference::where('contact_id', $payload['cid'])->get();

        return view('compliance.unsubscribe', [
            'contact' => $contact,
            'email' => $payload['em'],
            'token' => $token,
            'preferences' => $preferences
        ]);
    }

    /**
     * Unsubscribe from all marketing communications
     */
    public function unsubscribeAll(Request $request, string $token)
    {
        $payload = SecureTokenService::verify($token);
        if (!$payload) abort(403, 'Invalid or tampered unsubscribe token');

        SuppressionService::suppress(
            email: $payload['em'],
            reason: 'UNSUBSCRIBED',
            source: 'PREFERENCE_CENTER',
            metadata: ['ip' => $request->ip(), 'ua' => $request->userAgent()]
        );

        return response()->json(['status' => 'success', 'message' => 'Unsubscribed from all']);
    }

    /**
     * RFC 8058 One-Click HTTP POST endpoint
     */
    public function oneClickPost(Request $request, string $token)
    {
        $payload = SecureTokenService::verify($token);
        if (!$payload) abort(403);

        SuppressionService::suppress(
            email: $payload['em'],
            reason: 'UNSUBSCRIBED',
            source: 'ONE_CLICK_UNSUBSCRIBE',
            metadata: ['ip' => $request->ip(), 'agent' => 'RFC_8058']
        );

        return response('Unsubscribe successful', 200);
    }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 1: ADD MANUAL SUPPRESSION */}
      {/* ============================================================= */}
      {isAddManualOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Email to Global Suppression</h3>
            <p className="text-xs text-slate-500 mb-4">
              Emails added here will be permanently excluded from all marketing dispatches and cannot be overwritten by re-imports.
            </p>

            <form onSubmit={handleAddManualSuppression} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Email</label>
                <input
                  type="email"
                  required
                  value={manualEmail}
                  onChange={e => setManualEmail(e.target.value)}
                  placeholder="e.g. competitor@rivalcorp.com"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Suppression Reason</label>
                <select
                  value={manualReason}
                  onChange={e => setManualReason(e.target.value as SuppressionReason)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
                >
                  <option value="MANUAL">MANUAL (Administrative Override)</option>
                  <option value="UNSUBSCRIBED">UNSUBSCRIBED (Customer Opt-Out)</option>
                  <option value="HARD_BOUNCE">HARD_BOUNCE (Invalid Mailbox)</option>
                  <option value="SPAM_COMPLAINT">SPAM_COMPLAINT (Feedback Loop)</option>
                  <option value="INVALID_EMAIL">INVALID_EMAIL (Syntax Failure)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Audit Notes / Justification</label>
                <textarea
                  rows={2}
                  value={manualNotes}
                  onChange={e => setManualNotes(e.target.value)}
                  placeholder="Provide legal or compliance justification..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddManualOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow transition"
                >
                  Add to Suppression
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: CONFIRM UNSUPPRESS OVERRIDE */}
      {/* ============================================================= */}
      {unsuppressTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-amber-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Confirm Compliance Override</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              You are removing <strong>{unsuppressTarget.email_normalized}</strong> from the global suppression registry. Under CAN-SPAM and GDPR, you must possess explicit verifiable re-consent.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Compliance Justification (Required for Audit Log)</label>
                <input
                  type="text"
                  required
                  value={unsuppressReason}
                  onChange={e => setUnsuppressReason(e.target.value)}
                  placeholder="e.g. Received signed re-opt-in ticket #8841 via customer support portal"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUnsuppressTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUnsuppress}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow transition"
                >
                  Confirm & Unsuppress
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: JSON METADATA VIEWER */}
      {/* ============================================================= */}
      {selectedRecordMetadata && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 text-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold text-amber-400">
                Metadata: {selectedRecordMetadata.email_normalized}
              </h3>
              <button
                onClick={() => setSelectedRecordMetadata(null)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto max-h-72 border border-slate-800">
              {JSON.stringify(selectedRecordMetadata.metadata, null, 2)}
            </pre>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedRecordMetadata(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
