import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Send, 
  Sliders, 
  ArrowLeft, 
  AlertTriangle,
  Lock,
  Sparkles,
  Info,
  Check,
  RotateCcw
} from 'lucide-react';
import { 
  Contact, 
  EmailPreference, 
  EmailPreferenceType, 
  SuppressionRecord 
} from '../../types';
import { EMAIL_PREFERENCE_DEFINITIONS } from '../../data/initialComplianceData';
import { UnsubscribeController, UnsubscribePageState } from '../../services/compliance/UnsubscribeController';
import { SecureTokenService } from '../../services/compliance/SecureTokenService';

interface PublicUnsubscribeViewProps {
  token: string;
  contacts: Contact[];
  preferences: EmailPreference[];
  suppressionList: SuppressionRecord[];
  onUnsubscribeAll: (token: string) => void;
  onUpdatePreferences: (token: string, toggles: Record<EmailPreferenceType, boolean>) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const PublicUnsubscribeView: React.FC<PublicUnsubscribeViewProps> = ({
  token,
  contacts,
  preferences,
  suppressionList,
  onUnsubscribeAll,
  onUpdatePreferences,
  onClose,
  isModal = false
}) => {
  const [viewMode, setViewMode] = useState<'main' | 'preferences' | 'success' | 'cancelled'>('main');
  const [successMessage, setSuccessMessage] = useState('');
  const [categoryToggles, setCategoryToggles] = useState<Record<EmailPreferenceType, boolean>>({
    PRODUCT_UPDATES: true,
    PROMOTIONAL_OFFERS: true,
    NEWSLETTERS: true,
    EVENT_INVITATIONS: true,
    FESTIVAL_GREETINGS: true,
    EDUCATIONAL_CONTENT: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load state from controller
  const pageState: UnsubscribePageState = UnsubscribeController.showUnsubscribePage(
    token,
    contacts,
    preferences,
    suppressionList
  );

  useEffect(() => {
    if (pageState.valid && pageState.preferences.length > 0) {
      const initial: Record<EmailPreferenceType, boolean> = {
        PRODUCT_UPDATES: true,
        PROMOTIONAL_OFFERS: true,
        NEWSLETTERS: true,
        EVENT_INVITATIONS: true,
        FESTIVAL_GREETINGS: true,
        EDUCATIONAL_CONTENT: true
      };
      pageState.preferences.forEach(p => {
        initial[p.type] = p.isSubscribed;
      });
      setCategoryToggles(initial);
    }
  }, [token, preferences]);

  const handleExecuteUnsubscribeAll = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onUnsubscribeAll(token);
      setIsSubmitting(false);
      setSuccessMessage('You have been successfully unsubscribed from all DIGISOFT marketing communications.');
      setViewMode('success');
    }, 400);
  };

  const handleExecuteSavePreferences = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onUpdatePreferences(token, categoryToggles);
      setIsSubmitting(false);
      const activeCount = Object.values(categoryToggles).filter(Boolean).length;
      setSuccessMessage(
        activeCount === 0
          ? 'All categories disabled. You have been placed on our global suppression list.'
          : `Your subscription preferences have been updated (${activeCount} categories active).`
      );
      setViewMode('success');
    }, 400);
  };

  const handleToggleCategory = (type: EmailPreferenceType) => {
    setCategoryToggles(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleToggleAll = (enable: boolean) => {
    setCategoryToggles({
      PRODUCT_UPDATES: enable,
      PROMOTIONAL_OFFERS: enable,
      NEWSLETTERS: enable,
      EVENT_INVITATIONS: enable,
      FESTIVAL_GREETINGS: enable,
      EDUCATIONAL_CONTENT: enable
    });
  };

  if (!pageState.valid) {
    return (
      <div className="max-w-xl mx-auto my-8 p-6 bg-white rounded-2xl border border-rose-200 shadow-xl text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-4">
          <XCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Invalid or Expired Link</h2>
        <p className="text-sm text-slate-600 mb-6">
          {pageState.errorMessage || 'The unsubscribe security token could not be verified.'}
        </p>
        <div className="p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-500 mb-6 break-all">
          Token: {token}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  const activeCategoriesCount = Object.values(categoryToggles).filter(Boolean).length;

  return (
    <div className="w-full max-w-xl mx-auto my-4 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden font-['Inter',sans-serif]">
      {/* Brand Header */}
      <div className="bg-slate-950 px-6 py-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-amber-500 flex items-center justify-center shadow-md shadow-indigo-600/30">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white font-['Plus_Jakarta_Sans']">
                DIGISOFT <span className="text-indigo-400 font-semibold">CRM</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                COMPLIANCE CENTER
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Communication & Consent Management Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 font-mono">
          <Lock className="w-3 h-3" />
          <span>RFC 8058 Verified</span>
        </div>
      </div>

      {/* Recipient Context Banner */}
      <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-500" />
          <span className="text-slate-500">Recipient Email:</span>
          <span className="font-semibold text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
            {pageState.email}
          </span>
        </div>
        {pageState.contact?.companyName && (
          <span className="text-[11px] text-slate-500">
            Company: <strong className="text-slate-700">{pageState.contact.companyName}</strong>
          </span>
        )}
      </div>

      {/* Body Content */}
      <div className="p-6 sm:p-8">
        {/* VIEW 1: MAIN OPTIONS */}
        {viewMode === 'main' && (
          <div className="space-y-6">
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Subscription Status</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Manage Your Email Subscription
              </h2>
              <p className="text-sm text-slate-600 mt-2 font-medium">
                You are currently subscribed to marketing communications from DIGISOFT Technologies.
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                We respect your inbox and time. You can choose to opt out completely, tailor the types of updates you receive, or cancel this action.
              </p>
            </div>

            {/* Current Status Indicator */}
            {pageState.isGloballyUnsubscribed && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Notice: This email is currently in suppression</div>
                  <div className="text-amber-700 mt-0.5">
                    Our records indicate this address has previously opted out or bounced. You can manage preferences below to re-enable selected categories if desired.
                  </div>
                </div>
              </div>
            )}

            {/* The 3 Required Options */}
            <div className="space-y-3 pt-2">
              {/* Option 1: Unsubscribe from all */}
              <button
                id="btn-unsub-all"
                onClick={handleExecuteUnsubscribeAll}
                disabled={isSubmitting}
                className="w-full p-4 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-left transition cursor-pointer flex items-center justify-between group shadow-sm hover:border-rose-300"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
                    1
                  </div>
                  <div>
                    <div className="text-sm font-bold text-rose-950 group-hover:text-rose-700 transition">
                      Unsubscribe from all marketing emails
                    </div>
                    <div className="text-xs text-rose-800/80 mt-0.5">
                      Opt out completely from all newsletters, promotional offers, webinars, and product updates.
                    </div>
                  </div>
                </div>
                <div className="text-rose-600 text-xs font-semibold shrink-0 pl-2">
                  Opt-Out &rarr;
                </div>
              </button>

              {/* Option 2: Manage preferences */}
              <button
                id="btn-manage-preferences"
                onClick={() => setViewMode('preferences')}
                className="w-full p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 text-left transition cursor-pointer flex items-center justify-between group shadow-sm hover:border-indigo-300"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
                    2
                  </div>
                  <div>
                    <div className="text-sm font-bold text-indigo-950 group-hover:text-indigo-700 transition">
                      Manage preferences
                    </div>
                    <div className="text-xs text-indigo-800/80 mt-0.5">
                      Select which categories to keep (Product Updates, Newsletters, Events, etc.).
                    </div>
                  </div>
                </div>
                <div className="text-indigo-600 text-xs font-semibold shrink-0 pl-2 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Customize &rarr;</span>
                </div>
              </button>

              {/* Option 3: Cancel */}
              <button
                id="btn-unsub-cancel"
                onClick={() => {
                  if (onClose) {
                    onClose();
                  } else {
                    setViewMode('cancelled');
                  }
                }}
                className="w-full p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                    3
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      Cancel
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Keep my current settings unchanged and return to email.
                    </div>
                  </div>
                </div>
                <div className="text-slate-400 text-xs font-semibold shrink-0 pl-2">
                  Dismiss
                </div>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: GRANULAR PREFERENCE CENTER */}
        {viewMode === 'preferences' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <button
                onClick={() => setViewMode('main')}
                className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Options</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleAll(true)}
                  className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => handleToggleAll(false)}
                  className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                >
                  Uncheck All
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Communication Preferences</h3>
              <p className="text-xs text-slate-500 mt-1">
                Customize which communications you wish to receive from DIGISOFT Technologies.
              </p>
            </div>

            {/* Category Toggle List */}
            <div className="space-y-3">
              {EMAIL_PREFERENCE_DEFINITIONS.map(def => {
                const isSubscribed = categoryToggles[def.type];
                return (
                  <div
                    key={def.type}
                    onClick={() => handleToggleCategory(def.type)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                      isSubscribed
                        ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                        : 'bg-white border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{def.label}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-slate-200 text-slate-700">
                          {def.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-normal">
                        {def.description}
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <div className="pt-0.5 shrink-0">
                      <div
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                          isSubscribed ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                            isSubscribed ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                {activeCategoriesCount} of {EMAIL_PREFERENCE_DEFINITIONS.length} active
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('main')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-preferences"
                  type="button"
                  onClick={handleExecuteSavePreferences}
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: SUCCESS STATE */}
        {viewMode === 'success' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Preferences Recorded</h3>
              <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                {successMessage}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 max-w-md mx-auto text-left flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800">Audit & Compliance Trail:</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Timestamp: {new Date().toUTCString()} &bull; IP logged &bull; Encrypted Token &bull; Suppression DB Updated.
                </p>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setViewMode('preferences')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Change Preferences Again</span>
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: CANCELLED STATE */}
        {viewMode === 'cancelled' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 mx-auto flex items-center justify-center">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Changes Were Made</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your existing email communication preferences remain active. You may close this window.
            </p>
            <button
              onClick={() => setViewMode('main')}
              className="px-4 py-2 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
            >
              Reopen Options
            </button>
          </div>
        )}
      </div>

      {/* Compliance Footer */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          <span>DIGISOFT Technologies &bull; Registered Office: Plot 42, Electronics City Phase 1, Bengaluru</span>
        </div>
        <div className="flex items-center gap-3 font-medium">
          <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('DIGISOFT Privacy Policy:\nWe adhere to CAN-SPAM Act, GDPR Article 7(3), and DPDP Act 2023 regulations. We do not sell or lease personal data.'); }} className="text-indigo-600 hover:underline">
            Privacy Policy
          </a>
          <span>&bull;</span>
          <a href="#terms" onClick={(e) => { e.preventDefault(); alert('DIGISOFT Terms of Service: Enterprise SLA with 99.9% uptime and encrypted communications.'); }} className="text-indigo-600 hover:underline">
            Terms of Service
          </a>
        </div>
      </div>
    </div>
  );
};
