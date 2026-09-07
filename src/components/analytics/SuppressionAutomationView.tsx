import React, { useState } from 'react';
import { Contact, MarketingStatus } from '../../types';
import { 
  ShieldAlert, 
  UserX, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Lock, 
  RotateCcw, 
  Info,
  Building,
  Mail
} from 'lucide-react';

interface SuppressionAutomationViewProps {
  contacts: Contact[];
  onUnsuppressContact?: (contactId: string, reason: string) => void;
}

export const SuppressionAutomationView: React.FC<SuppressionAutomationViewProps> = ({
  contacts,
  onUnsuppressContact
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BOUNCED' | 'COMPLAINED' | 'UNSUBSCRIBED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContactForOverride, setSelectedContactForOverride] = useState<Contact | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  // Filter suppressed contacts
  const suppressedContacts = contacts.filter(c => 
    c.marketingStatus === 'BOUNCED' || 
    c.marketingStatus === 'COMPLAINED' || 
    c.marketingStatus === 'UNSUBSCRIBED' ||
    c.isSuppressed === true
  );

  const displayedContacts = suppressedContacts.filter(c => {
    if (statusFilter !== 'ALL' && c.marketingStatus !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.email.toLowerCase().includes(q) ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const bouncedCount = suppressedContacts.filter(c => c.marketingStatus === 'BOUNCED').length;
  const complaintCount = suppressedContacts.filter(c => c.marketingStatus === 'COMPLAINED').length;
  const unsubscribedCount = suppressedContacts.filter(c => c.marketingStatus === 'UNSUBSCRIBED').length;

  const handleConfirmOverride = () => {
    if (selectedContactForOverride && onUnsuppressContact) {
      onUnsuppressContact(selectedContactForOverride.id, overrideReason || 'Manual compliance review completed');
      setSelectedContactForOverride(null);
      setOverrideReason('');
    }
  };

  return (
    <div className="space-y-5">
      {/* Policy Guarantee Banner */}
      <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0 mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Automated Suppression Engine & Policy Enforcement</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Active & Enforced
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              When an ESP webhook registers a <strong>Hard Bounce</strong>, <strong>Spam Complaint</strong>, or <strong>Unsubscribe</strong>, the contact status is instantly transitioned and locked. All subsequent campaign dispatch engines strictly exclude these contacts during audience snapshotting.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 shrink-0 text-center text-xs">
          <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] text-slate-400 block">Bounced</span>
            <span className="text-base font-bold font-mono text-rose-400">{bouncedCount}</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] text-slate-400 block">Complaints</span>
            <span className="text-base font-bold font-mono text-amber-400">{complaintCount}</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] text-slate-400 block">Unsubscribes</span>
            <span className="text-base font-bold font-mono text-slate-200">{unsubscribedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Suppressed ({suppressedContacts.length})
          </button>
          <button
            onClick={() => setStatusFilter('BOUNCED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'BOUNCED'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertOctagon className="w-3 h-3" />
            Hard Bounced ({bouncedCount})
          </button>
          <button
            onClick={() => setStatusFilter('COMPLAINED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'COMPLAINED'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Complaints ({complaintCount})
          </button>
          <button
            onClick={() => setStatusFilter('UNSUBSCRIBED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'UNSUBSCRIBED'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <UserX className="w-3 h-3" />
            Opted Out ({unsubscribedCount})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search email, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-60"
          />
        </div>
      </div>

      {/* Suppressed Contacts List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 font-semibold">
              <th className="py-2.5 px-4">Contact & Company</th>
              <th className="py-2.5 px-3">Current Status</th>
              <th className="py-2.5 px-3">Automation Rule Applied</th>
              <th className="py-2.5 px-3">Campaign Dispatch Protection</th>
              <th className="py-2.5 px-3">Updated At</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedContacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  No suppressed contacts found under selected filter. All active contacts are eligible for campaigns.
                </td>
              </tr>
            ) : (
              displayedContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-slate-50/60 transition">
                  {/* Contact */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{contact.firstName} {contact.lastName}</div>
                    <div className="text-slate-500 font-mono text-[11px] flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{contact.email}</span>
                    </div>
                    <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                      <Building className="w-3 h-3 text-slate-400" />
                      <span>{contact.companyName}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {contact.marketingStatus === 'BOUNCED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-rose-100 text-rose-800 border border-rose-300">
                        <AlertOctagon className="w-3 h-3" />
                        BOUNCED (5xx)
                      </span>
                    )}
                    {contact.marketingStatus === 'COMPLAINED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-amber-100 text-amber-800 border border-amber-300">
                        <AlertTriangle className="w-3 h-3" />
                        COMPLAINED
                      </span>
                    )}
                    {contact.marketingStatus === 'UNSUBSCRIBED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-slate-200 text-slate-800 border border-slate-300">
                        <UserX className="w-3 h-3" />
                        UNSUBSCRIBED
                      </span>
                    )}
                  </td>

                  {/* Automation Rule */}
                  <td className="py-3 px-3">
                    <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {contact.marketingStatus === 'BOUNCED' 
                        ? 'RULE_HARD_BOUNCE_AUTO_SUPPRESS'
                        : contact.marketingStatus === 'COMPLAINED'
                          ? 'RULE_FBL_COMPLAINT_TERMINATE'
                          : 'RULE_UNSUB_ONE_CLICK_SUPPRESS'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Triggered via ESP Webhook
                    </span>
                  </td>

                  {/* Protection Guarantee */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Permanently Excluded from all queues</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      PreSendValidator: EXCLUDED
                    </span>
                  </td>

                  {/* Updated At */}
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {contact.updatedAt ? new Date(contact.updatedAt).toLocaleDateString() : 'Historical'}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedContactForOverride(contact)}
                      className="px-2.5 py-1 text-xs font-medium rounded text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                      title="Review suppression or grant compliance override"
                    >
                      Override
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Override Compliance Modal */}
      {selectedContactForOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Compliance Suppression Override</span>
              </h4>
              <button 
                onClick={() => setSelectedContactForOverride(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong>Caution:</strong> Re-activating a contact that hard-bounced or filed a spam complaint may harm sender reputation and result in ESP suspension by Amazon SES or SendGrid.
            </div>

            <div className="space-y-1 text-xs text-slate-700">
              <p><strong>Contact:</strong> {selectedContactForOverride.firstName} {selectedContactForOverride.lastName} ({selectedContactForOverride.email})</p>
              <p><strong>Current Status:</strong> <span className="font-mono font-bold text-rose-600">{selectedContactForOverride.marketingStatus}</span></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mandatory Compliance Justification / Audit Reason:
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g., Mailbox revived by customer IT desk; written re-consent obtained on 2026-09-04."
                rows={3}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedContactForOverride(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOverride}
                disabled={!overrideReason.trim()}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reactivate Contact (ACTIVE)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
