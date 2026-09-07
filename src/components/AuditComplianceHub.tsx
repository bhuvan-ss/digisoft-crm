import React, { useState } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Download, 
  Clock, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Lock,
  Search,
  Sliders,
  ShieldAlert
} from 'lucide-react';
import { 
  AuditLog, 
  Contact, 
  Campaign, 
  EmailPreference, 
  SuppressionRecord 
} from '../types';
import { ComplianceCenter } from './compliance/ComplianceCenter';

interface AuditComplianceHubProps {
  auditLogs: AuditLog[];
  contacts: Contact[];
  campaigns?: Campaign[];
  preferences?: EmailPreference[];
  suppressionList?: SuppressionRecord[];
  onUpdatePreferences?: (preferences: EmailPreference[]) => void;
  onUpdateSuppressionList?: (list: SuppressionRecord[]) => void;
  onUpdateContact?: (contact: Contact) => void;
  onAddAuditLog?: (action: string, module: string, details: string) => void;
}

export const AuditComplianceHub: React.FC<AuditComplianceHubProps> = ({
  auditLogs,
  contacts,
  campaigns = [],
  preferences = [],
  suppressionList = [],
  onUpdatePreferences = () => {},
  onUpdateSuppressionList = () => {},
  onUpdateContact = () => {},
  onAddAuditLog = () => {}
}) => {
  const [subTab, setSubTab] = useState<'compliance_center' | 'consent_ledger' | 'suppression' | 'system_logs'>('compliance_center');
  const [searchQuery, setSearchQuery] = useState('');

  const suppressedContacts = contacts.filter(c => c.isSuppressed);

  const exportConsentTrail = () => {
    const headers = ['Contact ID', 'Email', 'Consent Status', 'Consent Source', 'Consent Timestamp', 'Consent IP', 'Unsubscribe Token'];
    const rows = contacts.map(c => [
      c.id,
      c.email,
      c.consentStatus,
      `"${c.consentSource}"`,
      c.consentDate,
      c.consentIp,
      c.unsubscribeToken
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `digisoft_gdpr_canspam_consent_trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Audit, Compliance & Consent Ledger
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              CAN-SPAM & GDPR Trail
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable audit logging of opt-in consent records, IP addresses, unsubscribe requests, and administrative operations.
          </p>
        </div>

        <button
          onClick={exportConsentTrail}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          <span>Export Consent Trail (CSV)</span>
        </button>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setSubTab('compliance_center')}
          className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            subTab === 'compliance_center'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
          <span>Compliance & Suppression Center (Phase 10)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-mono">RFC 8058</span>
        </button>
        <button
          onClick={() => setSubTab('consent_ledger')}
          className={`pb-2.5 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
            subTab === 'consent_ledger'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Customer Consent & Opt-In Trail ({contacts.length})
        </button>
        <button
          onClick={() => setSubTab('suppression')}
          className={`pb-2.5 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
            subTab === 'suppression'
              ? 'border-rose-600 text-rose-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Suppression Quick List ({suppressedContacts.length})
        </button>
        <button
          onClick={() => setSubTab('system_logs')}
          className={`pb-2.5 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
            subTab === 'system_logs'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          System Security & Activity Logs ({auditLogs.length})
        </button>
      </div>

      {/* TAB 0: COMPLIANCE CENTER (PHASE 10) */}
      {subTab === 'compliance_center' && (
        <ComplianceCenter
          contacts={contacts}
          campaigns={campaigns}
          preferences={preferences}
          suppressionList={suppressionList}
          auditLogs={auditLogs}
          onUpdatePreferences={onUpdatePreferences}
          onUpdateSuppressionList={onUpdateSuppressionList}
          onUpdateContact={onUpdateContact}
          onAddAuditLog={onAddAuditLog}
        />
      )}

      {/* TAB 1: CONSENT LEDGER */}
      {subTab === 'consent_ledger' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              Verified Opt-In Proof per Recipient
            </span>
            <span className="text-slate-500">
              Compliant with CAN-SPAM Act 2003 & Digital Personal Data Protection Act (DPDP)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Contact</th>
                  <th className="py-2.5 px-3">Consent Status</th>
                  <th className="py-2.5 px-3">Opt-In Source Proof</th>
                  <th className="py-2.5 px-3">Timestamp (UTC)</th>
                  <th className="py-2.5 px-3">Sign-Up IP Address</th>
                  <th className="py-2.5 px-4">Unsubscribe Hash Token</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{c.firstName} {c.lastName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{c.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.consentStatus === 'double_opt_in' ? 'bg-emerald-100 text-emerald-800' :
                        c.consentStatus === 'single_opt_in' ? 'bg-blue-100 text-blue-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {c.consentStatus === 'double_opt_in' && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {c.consentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {c.consentSource}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {new Date(c.consentDate).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                      {c.consentIp}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400 truncate max-w-[140px]">
                      {c.unsubscribeToken}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SUPPRESSION */}
      {subTab === 'suppression' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3.5 bg-rose-50/60 border-b border-rose-100 flex items-center justify-between text-xs text-rose-900">
            <span className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              Global Suppression & Opt-Out Registry
            </span>
            <span>These contacts are permanently blocked from receiving campaign dispatches.</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Contact</th>
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Suppression Reason</th>
                  <th className="py-2.5 px-3">Opt-Out Date</th>
                  <th className="py-2.5 px-4">One-Click Token</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {suppressedContacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{c.firstName} {c.lastName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{c.email}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">{c.companyName}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800">
                        {c.consentStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {new Date(c.consentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
                      {c.unsubscribeToken}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM AUDIT LOGS */}
      {subTab === 'system_logs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-3">User & Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Module</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{log.userName}</div>
                      <div className="text-[10px] text-slate-400">{log.userRole}</div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-indigo-700">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
