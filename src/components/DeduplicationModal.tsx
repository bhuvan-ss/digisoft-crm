import React, { useState, useMemo } from 'react';
import { 
  GitMerge, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  ArrowRight, 
  UserCheck, 
  ShieldCheck, 
  Sparkles,
  Building2,
  Mail,
  Phone,
  Tag,
  Clock
} from 'lucide-react';
import { Contact } from '../types';
import { ContactMergeService } from '../services/ContactMergeService';

interface DeduplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  onMergeContacts: (mergedContact: Contact, archivedContactId: string) => void;
}

export const DeduplicationModal: React.FC<DeduplicationModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onMergeContacts,
}) => {
  // Find all duplicates in active contact database
  const duplicatePairs = useMemo(() => {
    return ContactMergeService.findDuplicatePairs(contacts);
  }, [contacts]);

  const [selectedPairIndex, setSelectedPairIndex] = useState<number>(0);
  const [primaryChoice, setPrimaryChoice] = useState<'A' | 'B'>('A');
  const [mergeNotes, setMergeNotes] = useState<string>('Standard deduplication merge');
  const [isSuccessToast, setIsSuccessToast] = useState(false);

  if (!isOpen) return null;

  const currentPair = duplicatePairs[selectedPairIndex] || null;

  const primaryContact = currentPair 
    ? (primaryChoice === 'A' ? currentPair.contactA : currentPair.contactB)
    : null;
  const secondaryContact = currentPair 
    ? (primaryChoice === 'A' ? currentPair.contactB : currentPair.contactA)
    : null;

  // Compute live merge preview
  const mergeOutcome = primaryContact && secondaryContact 
    ? ContactMergeService.merge(primaryContact, secondaryContact)
    : null;
  const mergedPreview = mergeOutcome?.mergedContact || null;

  const handleExecuteMerge = () => {
    if (!primaryContact || !secondaryContact || !mergedPreview) return;

    onMergeContacts(mergedPreview, secondaryContact.id);
    setIsSuccessToast(true);

    setTimeout(() => {
      setIsSuccessToast(false);
      // Adjust index if needed
      if (selectedPairIndex >= duplicatePairs.length - 1) {
        setSelectedPairIndex(Math.max(0, duplicatePairs.length - 2));
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-5xl w-full h-[88vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Deduplication & Master Merge Center
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {duplicatePairs.length} Candidates Detected
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Deterministic matching across Priority 1 (Normalized Email) & Priority 2 (E.164 Phone)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>

        {/* Modal Body */}
        {duplicatePairs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Database is Clean & Fully Normalized</h4>
            <p className="text-xs text-slate-500 max-w-md mt-1">
              No duplicate contacts detected across email, international E.164 mobile numbers, or registered company entities.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
            >
              Return to Contacts Directory
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Sidebar: Detected Pairs List */}
            <div className="w-full md:w-72 border-r border-slate-200 bg-slate-50/60 p-3 overflow-y-auto space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 pt-1 pb-1">
                Detected Pairs ({duplicatePairs.length})
              </div>
              {duplicatePairs.map((pair, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedPairIndex(idx);
                    setPrimaryChoice('A');
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                    selectedPairIndex === idx
                      ? 'bg-white border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                      : 'bg-white/80 border-slate-200 hover:bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 truncate">
                      {pair.contactA.firstName} {pair.contactA.lastName}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      pair.priority === 1 ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      P{pair.priority}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {pair.matchedField}: {pair.matchedValue}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <span>{pair.contactA.id}</span>
                    <span>&bull;</span>
                    <span>{pair.contactB.id}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Main Stage: Interactive Merge Workbench */}
            <div className="flex-1 flex flex-col overflow-y-auto p-5 bg-white space-y-4">
              {currentPair && primaryContact && secondaryContact && mergedPreview && (
                <>
                  {/* Pair Match Banner */}
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <div className="text-xs">
                        <span className="font-bold text-amber-900">
                          Priority {currentPair.priority} Duplicate Match:
                        </span>{' '}
                        <span className="text-amber-800">
                          Matched via normalized {currentPair.matchedField} (
                          <span className="font-mono font-bold">{currentPair.matchedValue}</span>)
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-800">
                      Step {selectedPairIndex + 1} of {duplicatePairs.length}
                    </span>
                  </div>

                  {/* Side-by-Side Comparison & Primary Selector */}
                  <div>
                    <div className="text-xs font-bold text-slate-800 mb-2">
                      Choose Master Primary Record:
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Record A */}
                      <div 
                        onClick={() => setPrimaryChoice('A')}
                        className={`p-4 rounded-xl border text-xs cursor-pointer transition ${
                          primaryChoice === 'A'
                            ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <input 
                              type="radio" 
                              checked={primaryChoice === 'A'} 
                              onChange={() => setPrimaryChoice('A')}
                              className="text-indigo-600"
                            />
                            Record A ({currentPair.contactA.id})
                          </span>
                          {primaryChoice === 'A' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                              Master Record
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 text-slate-600">
                          <div className="font-semibold text-slate-900 text-sm">
                            {currentPair.contactA.firstName} {currentPair.contactA.lastName}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{currentPair.contactA.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{currentPair.contactA.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{currentPair.contactA.companyName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 pt-1">
                            Balance: ₹{currentPair.contactA.tallyOutstandingBalance.toLocaleString('en-IN')} &bull; Consent: {currentPair.contactA.consentStatus}
                          </div>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {currentPair.contactA.tags.map((t, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Record B */}
                      <div 
                        onClick={() => setPrimaryChoice('B')}
                        className={`p-4 rounded-xl border text-xs cursor-pointer transition ${
                          primaryChoice === 'B'
                            ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <input 
                              type="radio" 
                              checked={primaryChoice === 'B'} 
                              onChange={() => setPrimaryChoice('B')}
                              className="text-indigo-600"
                            />
                            Record B ({currentPair.contactB.id})
                          </span>
                          {primaryChoice === 'B' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                              Master Record
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 text-slate-600">
                          <div className="font-semibold text-slate-900 text-sm">
                            {currentPair.contactB.firstName} {currentPair.contactB.lastName}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{currentPair.contactB.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{currentPair.contactB.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{currentPair.contactB.companyName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 pt-1">
                            Balance: ₹{currentPair.contactB.tallyOutstandingBalance.toLocaleString('en-IN')} &bull; Consent: {currentPair.contactB.consentStatus}
                          </div>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {currentPair.contactB.tags.map((t, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Merged Outcome Preview Box */}
                  <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-xs text-white">
                          Live Unified Output Preview
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">
                        Preserves Provenance & Consolidates Tags
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400">Master Name</div>
                        <div className="font-bold text-white truncate">{mergedPreview.fullName || mergedPreview.firstName}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Normalized Email</div>
                        <div className="font-mono text-[11px] text-indigo-300 truncate">{mergedPreview.emailNormalized}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">E.164 Phone</div>
                        <div className="font-mono text-[11px] text-indigo-300 truncate">{mergedPreview.mobileNormalized}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Tally Balance</div>
                        <div className="font-bold text-amber-400">₹{mergedPreview.tallyOutstandingBalance.toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Tag className="w-3 h-3 text-indigo-400" />
                        <span>Unified Tags: {mergedPreview.tags.join(', ')}</span>
                      </div>
                      <div className="text-slate-400">
                        Acquisition Sources: {mergedPreview.sources?.length || 2} entries
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      Secondary contact <code className="font-mono font-bold text-slate-700">{secondaryContact.id}</code> will be marked merged and soft-deleted.
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (selectedPairIndex < duplicatePairs.length - 1) {
                            setSelectedPairIndex(prev => prev + 1);
                          }
                        }}
                        className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                      >
                        Skip for Now
                      </button>

                      <button
                        onClick={handleExecuteMerge}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
                      >
                        <GitMerge className="w-4 h-4" />
                        <span>Execute Transactional Merge</span>
                      </button>
                    </div>
                  </div>

                  {isSuccessToast && (
                    <div className="p-2.5 rounded-lg bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Contact record merged and master profile updated!</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
