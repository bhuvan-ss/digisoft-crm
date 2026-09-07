import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle, XCircle, Info, ShieldCheck } from 'lucide-react';
import { ImportMappingItem } from '../../types';
import { applyTransformation, validateContactRow } from '../../services/ContactImportEngine';

interface ImportPreviewStepProps {
  rows: Record<string, any>[];
  mappings: Record<string, ImportMappingItem>;
  onNext: () => void;
  onBack: () => void;
  totalRows: number;
}

export const ImportPreviewStep: React.FC<ImportPreviewStepProps> = ({
  rows,
  mappings,
  onNext,
  onBack,
  totalRows,
}) => {
  const previewRows = rows.slice(0, 8);

  // Active mapped target columns
  const activeMappedColumns: Array<[string, ImportMappingItem]> = (
    Object.entries(mappings) as Array<[string, ImportMappingItem]>
  ).filter(([, item]) => Boolean(item && item.targetField && item.targetField.trim() !== ''));

  // Pre-calculate sample validations
  const analyzedSamples = previewRows.map((rawRow, idx) => {
    const mapped: Record<string, any> = {};
    for (const [sourceCol, item] of activeMappedColumns) {
      const val = rawRow[sourceCol];
      mapped[item.targetField] = applyTransformation(val, item.transformationRule);
    }

    const validation = validateContactRow(mapped, idx + 2);
    return {
      rowNumber: idx + 2,
      raw: rawRow,
      mapped,
      isValid: validation.isValid,
      errors: validation.errors,
    };
  });

  const validCount = analyzedSamples.filter((s) => s.isValid).length;
  const invalidCount = analyzedSamples.length - validCount;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Preview & Sample Record Validation</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
              Step 3 of 6
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspecting first {analyzedSamples.length} records with applied column mappings and normalization transformations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Adjust Mappings
          </button>
          <button
            id="preview-next-btn"
            onClick={onNext}
            className="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
          >
            <span>Next: Configure Duplicate Rules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Validation Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-lg border bg-slate-50 border-slate-200 flex items-center justify-between">
          <span className="text-slate-600 font-medium">Sample Checked</span>
          <span className="font-bold text-slate-900">{analyzedSamples.length} records</span>
        </div>
        <div className="p-3 rounded-lg border bg-emerald-50 border-emerald-200 flex items-center justify-between text-emerald-900">
          <span className="font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Syntax Clean
          </span>
          <span className="font-bold">{validCount} rows</span>
        </div>
        <div className="p-3 rounded-lg border bg-amber-50 border-amber-200 flex items-center justify-between text-amber-900">
          <span className="font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Validation Warnings
          </span>
          <span className="font-bold">{invalidCount} rows</span>
        </div>
      </div>

      {/* Preview Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <th className="py-2.5 px-3 w-16 text-center">Row</th>
                <th className="py-2.5 px-3 w-28 text-center">Validation</th>
                {activeMappedColumns.map(([src, item]) => (
                  <th key={item.targetField} className="py-2.5 px-3 whitespace-nowrap">
                    <div>{item.targetField}</div>
                    <div className="text-[9px] font-normal text-slate-400">from: {src}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analyzedSamples.map((sample) => (
                <tr key={sample.rowNumber} className={`hover:bg-slate-50/80 transition ${!sample.isValid ? 'bg-rose-50/30' : ''}`}>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                    #{sample.rowNumber}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {sample.isValid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Valid
                      </span>
                    ) : (
                      <span 
                        title={sample.errors.map((e) => e.message).join('\n')}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 cursor-help"
                      >
                        <XCircle className="w-2.5 h-2.5 text-rose-600" />
                        Issues ({sample.errors.length})
                      </span>
                    )}
                  </td>

                  {activeMappedColumns.map(([, item]) => {
                    const cellVal = sample.mapped[item.targetField];
                    const hasErr = sample.errors.some((e) => e.field === item.targetField || (e.field === 'contact_identifier' && (item.targetField === 'email' || item.targetField === 'mobile')));

                    return (
                      <td key={item.targetField} className={`py-2.5 px-3 font-mono text-[11px] max-w-xs truncate ${hasErr ? 'text-rose-700 bg-rose-50/60 font-bold' : 'text-slate-800'}`}>
                        {cellVal !== undefined && cellVal !== '' ? (
                          String(cellVal)
                        ) : (
                          <span className="text-slate-300 italic">null</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Callout */}
      <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-lg flex items-start gap-2.5 text-indigo-900 text-xs">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          During execution, any record failing strict RFC email syntax, missing both identifiers, or containing malformed GSTIN will be captured into the <code className="px-1 py-0.5 bg-white font-mono text-[11px] rounded">import_errors</code> audit log with full raw JSON and will not break the rest of the file.
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button
          onClick={onBack}
          className="px-4 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
        >
          &larr; Back to Mapping
        </button>

        <button
          onClick={onNext}
          className="flex items-center gap-1 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
        >
          <span>Next: Configure Duplicate Rules</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
