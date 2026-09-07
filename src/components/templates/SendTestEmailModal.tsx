import React, { useState } from 'react';
import { X, Send, Mail, User, ShieldCheck, CheckCircle2, Server, AlertTriangle } from 'lucide-react';
import { ManagedEmailTemplate, Contact, Company, ESPProvider } from '../../types';
import { TemplateVariableEngine } from '../../utils/templateValidator';

interface SendTestEmailModalProps {
  template: ManagedEmailTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  companies: Company[];
  onDispatchTest: (payload: {
    to: string;
    subject: string;
    preheader: string;
    html: string;
    provider: ESPProvider;
    templateName: string;
  }) => void;
}

export const SendTestEmailModal: React.FC<SendTestEmailModalProps> = ({
  template,
  isOpen,
  onClose,
  contacts,
  companies,
  onDispatchTest
}) => {
  const [testEmail, setTestEmail] = useState('bhuvangupta.1711@gmail.com');
  const [selectedContactId, setSelectedContactId] = useState<string>(contacts[0]?.id || '');
  const [espProvider, setEspProvider] = useState<ESPProvider>('amazon_ses');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  if (!isOpen || !template) return null;

  const currentContact = contacts.find(c => c.id === selectedContactId) || contacts[0];
  const currentCompany = companies.find(c => c.id === currentContact?.companyId) || companies[0];

  const mergedSubject = TemplateVariableEngine.replace(
    template.subjectDefault,
    currentContact,
    currentCompany
  );

  const mergedPreheader = TemplateVariableEngine.replace(
    template.preheaderDefault,
    currentContact,
    currentCompany
  );

  const mergedHtml = TemplateVariableEngine.replace(
    template.htmlContent,
    currentContact,
    currentCompany
  );

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      onDispatchTest({
        to: testEmail,
        subject: mergedSubject,
        preheader: mergedPreheader,
        html: mergedHtml,
        provider: espProvider,
        templateName: template.name
      });
      setIsSending(false);
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        onClose();
      }, 1500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Send Test Email</h2>
              <p className="text-xs text-slate-500">Dispatch template rendering directly to a test inbox</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {sendSuccess ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Test Email Dispatched!</h3>
              <p className="text-xs text-slate-600">
                Successfully routed to <strong>{testEmail}</strong> via <strong>{espProvider.toUpperCase()}</strong>.
                You can inspect the full HTML payload in the <strong>Virtual Test Inbox</strong>.
              </p>
            </div>
          ) : (
            <>
              {/* Recipient Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Test Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Both real external delivery and the integrated Virtual Sandbox Inbox receive this test.
                </p>
              </div>

              {/* Sample Contact Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sample Contact (for Variable Interpolation)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    value={selectedContactId}
                    onChange={(e) => setSelectedContactId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName || c.firstName} &mdash; {c.companyName} ({c.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ESP Driver Provider */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Routing ESP Provider
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'amazon_ses', label: 'Amazon SES', note: 'DKIM 2048' },
                    { id: 'brevo', label: 'Brevo', note: 'EU Cloud' },
                    { id: 'sendgrid', label: 'SendGrid', note: 'Standby' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setEspProvider(p.id as ESPProvider)}
                      className={`p-2 rounded-lg border text-left text-xs transition-all ${
                        espProvider === p.id
                          ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-semibold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div>{p.label}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{p.note}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Interpolation Preview Box */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <div className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>Merged Header Preview:</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Live Render
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Subject: </span>
                  <span className="text-slate-900 font-medium">{mergedSubject}</span>
                </div>
                <div>
                  <span className="text-slate-500">Preheader: </span>
                  <span className="text-slate-700">{mergedPreheader}</span>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        {!sendSuccess && (
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-md font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !testEmail}
              className="inline-flex items-center px-4 py-1.5 text-xs font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {isSending ? 'Dispatching...' : 'Send Test Email'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
