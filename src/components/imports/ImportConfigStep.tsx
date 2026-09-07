import React from 'react';
import { 
  ArrowRight, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  CheckCircle, 
  Tag, 
  Zap, 
  Sparkles,
  Lock
} from 'lucide-react';
import { ConsentStatus, DuplicateHandlingOption, LifecycleStage } from '../../types';

interface ImportConfigStepProps {
  duplicateHandling: DuplicateHandlingOption;
  onDuplicateHandlingChange: (val: DuplicateHandlingOption) => void;
  consentStatus: ConsentStatus;
  onConsentStatusChange: (val: ConsentStatus) => void;
  consentSource: string;
  onConsentSourceChange: (val: string) => void;
  tagsInput: string;
  onTagsInputChange: (val: string) => void;
  chunkSize: number;
  onChunkSizeChange: (val: number) => void;
  lifecycleStage: LifecycleStage;
  onLifecycleStageChange: (val: LifecycleStage) => void;
  onStartImport: () => void;
  onBack: () => void;
  totalRows: number;
}

export const ImportConfigStep: React.FC<ImportConfigStepProps> = ({
  duplicateHandling,
  onDuplicateHandlingChange,
  consentStatus,
  onConsentStatusChange,
  consentSource,
  onConsentSourceChange,
  tagsInput,
  onTagsInputChange,
  chunkSize,
  onChunkSizeChange,
  lifecycleStage,
  onLifecycleStageChange,
  onStartImport,
  onBack,
  totalRows,
}) => {
  const duplicateStrategies: Array<{
    id: DuplicateHandlingOption;
    title: string;
    description: string;
    badge?: string;
    isDefault?: boolean;
  }> = [
    {
      id: 'UPDATE',
      title: 'Update Existing Contact',
      description: 'Enrich existing contact record with fresh imported data, filling empty properties and updating newer demographic details.',
      badge: 'Default Recommendation',
      isDefault: true,
    },
    {
      id: 'MERGE',
      title: 'Merge Automatically',
      description: 'Transactionally merge attributes, union tags, and preserve existing values where incoming fields are empty.',
    },
    {
      id: 'POTENTIAL_DUPLICATE',
      title: 'Create as Potential Duplicate',
      description: 'Create a new contact flagged as "Potential Duplicate" linked to the original record for manual review in Deduplication Workbench.',
    },
    {
      id: 'SKIP',
      title: 'Skip Duplicate',
      description: 'Ignore incoming row if a matching email or mobile number already exists in the master database.',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-900">Configure Duplicate Resolution & Ingestion Rules</h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
            Step 4 of 6
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Select deduplication rules for matching records, compliance opt-in provenance, and chunk transaction batching.
        </p>
      </div>

      {/* Mandatory Suppression Protection Callout */}
      <div className="p-4 rounded-xl border bg-rose-50/70 border-rose-200 text-rose-950 text-xs space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-rose-800">
          <Lock className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Strict Marketing Compliance & Suppression Protection Guarantee</span>
        </div>
        <p className="text-rose-800/90 leading-relaxed pl-6">
          <strong>Mandatory Safeguard:</strong> The import engine will <strong>NEVER</strong> overwrite contacts in <code className="px-1 py-0.5 rounded bg-rose-100 font-mono text-[10px] font-bold">UNSUBSCRIBED</code>, <code className="px-1 py-0.5 rounded bg-rose-100 font-mono text-[10px] font-bold">BOUNCED</code>, <code className="px-1 py-0.5 rounded bg-rose-100 font-mono text-[10px] font-bold">COMPLAINED</code>, or <code className="px-1 py-0.5 rounded bg-rose-100 font-mono text-[10px] font-bold">SUPPRESSED</code> marketing statuses. Suppression tags, opt-out dates, and suppression flags remain permanently locked during all update and merge operations.
        </p>
      </div>

      {/* Duplicate Strategy Selector */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          Duplicate Record Handling Strategy
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {duplicateStrategies.map((strat) => {
            const isSelected = duplicateHandling === strat.id;
            return (
              <div
                key={strat.id}
                onClick={() => onDuplicateHandlingChange(strat.id)}
                className={`p-4 rounded-xl border cursor-pointer transition relative ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="font-bold text-slate-900 text-xs">{strat.title}</span>
                  </div>
                  {strat.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full shrink-0">
                      {strat.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-2 pl-6 leading-relaxed">
                  {strat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Batching & Compliance Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Chunk Transaction Batch Size
          </label>
          <select
            value={chunkSize}
            onChange={(e) => onChunkSizeChange(Number(e.target.value))}
            className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white"
          >
            <option value={250}>250 rows / chunk (Ultra-responsive UI)</option>
            <option value={500}>500 rows / chunk (Balanced throughput)</option>
            <option value={1000}>1,000 rows / chunk (Recommended for 100k scale)</option>
            <option value={2500}>2,500 rows / chunk (High-volume throughput)</option>
          </select>
          <p className="text-[10px] text-slate-400 mt-1">
            Estimated chunks: <strong>{Math.ceil(totalRows / chunkSize)}</strong> discrete transactions.
          </p>
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Default Lifecycle Stage
          </label>
          <select
            value={lifecycleStage}
            onChange={(e) => onLifecycleStageChange(e.target.value as LifecycleStage)}
            className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white"
          >
            <option value="lead">Lead</option>
            <option value="prospect">Prospect</option>
            <option value="customer">Customer</option>
            <option value="partner">Partner</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Default Marketing Consent Status
          </label>
          <select
            value={consentStatus}
            onChange={(e) => onConsentStatusChange(e.target.value as ConsentStatus)}
            className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white"
          >
            <option value="single_opt_in">Single Opt-In (Direct form submission or contract)</option>
            <option value="double_opt_in">Double Opt-In (Verified with confirmation link)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Consent Source Audit Stamp
          </label>
          <input
            type="text"
            value={consentSource}
            onChange={(e) => onConsentSourceChange(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            placeholder="e.g. Q3 Expo Lead Sheet / CRM Migration"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-slate-700 font-bold mb-1">
            Append Tags to Imported Contacts
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => onTagsInputChange(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
            placeholder="e.g. Enterprise Leads, Q3 Campaign, North India"
          />
          <p className="text-[10px] text-slate-400 mt-1">Separate tags with commas.</p>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <button
          onClick={onBack}
          className="px-4 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
        >
          &larr; Back to Preview
        </button>

        <button
          id="start-import-btn"
          onClick={onStartImport}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Launch Chunked Ingestion ({totalRows.toLocaleString()} Records)</span>
        </button>
      </div>
    </div>
  );
};
