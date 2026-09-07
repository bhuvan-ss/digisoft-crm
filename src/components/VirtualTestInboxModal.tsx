import React, { useState } from 'react';
import { 
  Inbox, 
  X, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export interface TestEmailMessage {
  id: string;
  to: string;
  subject: string;
  html: string;
  campaignName: string;
  sentAt: string;
  isRead: boolean;
}

interface VirtualTestInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  emails: TestEmailMessage[];
  onClearInbox: () => void;
}

export const VirtualTestInboxModal: React.FC<VirtualTestInboxModalProps> = ({
  isOpen,
  onClose,
  emails,
  onClearInbox
}) => {
  const [selectedEmail, setSelectedEmail] = useState<TestEmailMessage | null>(emails[0] || null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
              <Inbox className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">Virtual Test Inbox & Email Inspector</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900/80 text-indigo-300 border border-indigo-700/50">
                  Simulated Mail Server
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Inspect test messages, RFC compliance, List-Unsubscribe headers, and HTML layout rendering.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {emails.length > 0 && (
              <button
                onClick={onClearInbox}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Inbox</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded transition text-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split Inbox List and Email Canvas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left 1/3: Message List */}
          <div className="w-72 sm:w-80 border-r border-slate-200 overflow-y-auto bg-slate-50/50 flex flex-col">
            <div className="p-3 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider flex justify-between">
              <span>Inbox Messages</span>
              <span className="font-mono text-indigo-700">({emails.length})</span>
            </div>

            {emails.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2 my-auto">
                <Inbox className="w-8 h-8 mx-auto text-slate-300" />
                <p>No test emails sent yet.</p>
                <p className="text-[11px] text-slate-400">
                  Go to <strong>Campaign Studio &gt; Step 5</strong> and click "Send Test" to populate this inbox.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200/80">
                {emails.map((msg) => {
                  const isSelected = selectedEmail?.id === msg.id;
                  return (
                    <div
                      key={msg.id}
                      onClick={() => setSelectedEmail(msg)}
                      className={`p-3 text-xs cursor-pointer transition ${
                        isSelected ? 'bg-white border-l-4 border-indigo-600 shadow-xs' : 'hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="font-bold text-indigo-700 truncate max-w-[140px]">{msg.to}</span>
                        <span className="font-mono text-[10px]">{new Date(msg.sentAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="font-semibold text-slate-900 line-clamp-1">
                        {msg.subject}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        Campaign: {msg.campaignName}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right 2/3: Inspector & HTML Frame */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-slate-100">
            {selectedEmail ? (
              <div className="p-4 space-y-4">
                {/* Header Information Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{selectedEmail.subject}</h4>
                      <div className="text-xs text-slate-600 mt-1">
                        To: <strong className="font-mono text-indigo-700">{selectedEmail.to}</strong> &bull; From: <strong>DIGISOFT Accounts &lt;billing@notifications.digisoft.com&gt;</strong>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(selectedEmail.sentAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Header Authentication Chips */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 text-[11px]">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> SPF: PASS
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> DKIM: 2048 PASS
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> DMARC: PASS
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                      List-Unsubscribe: One-Click (RFC 8058)
                    </span>
                  </div>
                </div>

                {/* Rendered HTML Email Frame */}
                <div className="bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden">
                  <div className="p-2 bg-slate-200 border-b border-slate-300 text-[10px] text-slate-600 font-mono flex items-center justify-between">
                    <span>Rendered Email Canvas (Table Structure with Inline CSS)</span>
                    <span>Client: Webmail Standard</span>
                  </div>
                  <iframe
                    srcDoc={selectedEmail.html}
                    title="Rendered Email Frame"
                    className="w-full h-[480px] border-none"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                Select an email from the left pane to view headers and HTML rendering.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
