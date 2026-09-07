import React from 'react';
import { ArrowRight, Sparkles, CheckCircle, RefreshCw, Wand2, ShieldCheck } from 'lucide-react';
import { ImportMappingItem, TransformationRule } from '../../types';

interface ImportMappingStepProps {
  headers: string[];
  sampleRow: Record<string, any>;
  mappings: Record<string, ImportMappingItem>;
  onMappingChange: (header: string, targetField: string, rule: TransformationRule) => void;
  onAutoDetectAll: () => void;
  onNext: () => void;
  onBack: () => void;
  totalRows: number;
  fileName: string;
}

const TARGET_FIELD_OPTIONS: Array<{ key: string; label: string; group: string; required?: boolean }> = [
  { key: 'full_name', label: 'Full Name', group: 'Contact Identity' },
  { key: 'first_name', label: 'First Name', group: 'Contact Identity' },
  { key: 'last_name', label: 'Last Name', group: 'Contact Identity' },
  { key: 'email', label: 'Email Address (Normalized)', group: 'Primary Contact & Compliance', required: true },
  { key: 'mobile', label: 'Mobile Number (Normalized E.164)', group: 'Primary Contact & Compliance', required: true },
  { key: 'company_name', label: 'Company / Enterprise Name', group: 'Organization & B2B' },
  { key: 'gstin', label: 'GSTIN (Tax ID)', group: 'Organization & B2B' },
  { key: 'designation', label: 'Designation / Job Role', group: 'Professional' },
  { key: 'department', label: 'Department', group: 'Professional' },
  { key: 'city', label: 'City', group: 'Location' },
  { key: 'state', label: 'State', group: 'Location' },
  { key: 'country', label: 'Country', group: 'Location' },
  { key: 'pincode', label: 'Pincode / Postal Code', group: 'Location' },
  { key: 'outstanding_balance', label: 'Outstanding Balance (Tally)', group: 'Financial Exposure' },
  { key: 'tags', label: 'Tags / Categories', group: 'Segmentation' },
];

const TRANSFORMATION_RULES: Array<{ key: TransformationRule; label: string }> = [
  { key: 'trim', label: 'Trim Whitespace' },
  { key: 'lowercase', label: 'Convert to Lowercase' },
  { key: 'uppercase', label: 'Convert to Uppercase' },
  { key: 'e164_mobile', label: 'Normalize Indian Mobile (E.164 +91)' },
  { key: 'split_name', label: 'Split Full Name into First & Last' },
  { key: 'decimal_sanitize', label: 'Sanitize Currency to Decimal' },
];

export const ImportMappingStep: React.FC<ImportMappingStepProps> = ({
  headers,
  sampleRow,
  mappings,
  onMappingChange,
  onAutoDetectAll,
  onNext,
  onBack,
  totalRows,
  fileName,
}) => {
  // Check if at least Email or Mobile is mapped
  const mappedTargets = (Object.values(mappings) as ImportMappingItem[]).map((m) => m.targetField);
  const hasEmailOrMobile = mappedTargets.includes('email') || mappedTargets.includes('mobile');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Map File Columns to CRM Properties</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
              Step 2 of 6
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            File: <strong>{fileName}</strong> &bull; Total rows: <strong>{totalRows.toLocaleString()}</strong> &bull; Columns detected: <strong>{headers.length}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAutoDetectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Re-run Auto Detect</span>
          </button>

          <button
            id="mapping-next-btn"
            onClick={onNext}
            disabled={!hasEmailOrMobile}
            className="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Next: Preview Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Requirement Notice */}
      <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${hasEmailOrMobile ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
        <ShieldCheck className={`w-4 h-4 mt-0.5 shrink-0 ${hasEmailOrMobile ? 'text-emerald-600' : 'text-amber-600'}`} />
        <div>
          <span className="font-bold">Required Contact Identifier:</span> At least one of{' '}
          <code className="px-1 py-0.5 rounded bg-white/70 font-semibold">Email Address</code> or{' '}
          <code className="px-1 py-0.5 rounded bg-white/70 font-semibold">Mobile Number</code> must be mapped to ensure contacts can be uniquely identified, deduplicated, and messaged.
        </div>
      </div>

      {/* Mapping Matrix Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <th className="py-2.5 px-4 w-1/4">Source Column Header</th>
                <th className="py-2.5 px-4 w-1/4">Sample File Value</th>
                <th className="py-2.5 px-4 w-1/4">Target CRM Property</th>
                <th className="py-2.5 px-4 w-1/4">Transformation Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {headers.map((header) => {
                const current = mappings[header] || {
                  targetField: '',
                  transformationRule: 'trim',
                  confidence: 0,
                };
                const sampleVal = sampleRow[header] !== undefined ? String(sampleRow[header]) : '—';

                return (
                  <tr key={header} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{header}</div>
                      {current.confidence && current.confidence > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium mt-0.5">
                          <CheckCircle className="w-2.5 h-2.5" />
                          Auto-matched ({current.confidence}% confidence)
                        </span>
                      ) : null}
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-600 font-mono text-[11px] truncate max-w-xs bg-slate-50 px-2 py-1 rounded border border-slate-200">
                        {sampleVal || <span className="text-slate-400 italic">Empty</span>}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={current.targetField}
                        onChange={(e) => onMappingChange(header, e.target.value, current.transformationRule)}
                        className={`w-full p-2 border rounded-lg text-xs font-medium ${
                          current.targetField 
                            ? 'bg-indigo-50/40 border-indigo-300 text-indigo-950 font-bold' 
                            : 'bg-white border-slate-300 text-slate-500'
                        }`}
                      >
                        <option value="">-- Do Not Import / Skip --</option>
                        {TARGET_FIELD_OPTIONS.map((opt) => (
                          <option key={opt.key} value={opt.key}>
                            {opt.label} {opt.required ? '(Identifier)' : ''}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-4">
                      <select
                        disabled={!current.targetField}
                        value={current.transformationRule}
                        onChange={(e) => onMappingChange(header, current.targetField, e.target.value as TransformationRule)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50 disabled:opacity-40 disabled:bg-slate-100"
                      >
                        {TRANSFORMATION_RULES.map((rule) => (
                          <option key={rule.key} value={rule.key}>
                            {rule.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button
          onClick={onBack}
          className="px-4 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
        >
          &larr; Back to Upload
        </button>

        <button
          onClick={onNext}
          disabled={!hasEmailOrMobile}
          className="flex items-center gap-1 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Next: Preview Sample Records</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
