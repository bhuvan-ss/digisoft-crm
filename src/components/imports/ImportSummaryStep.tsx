import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  ArrowRight, 
  RefreshCw, 
  Layers, 
  Clock, 
  Zap, 
  ShieldCheck, 
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { ImportErrorItem, ImportSummaryStats } from '../../types';
import { ImportSummaryService } from '../../services/ImportSummaryService';

interface ImportSummaryStepProps {
  summary: ImportSummaryStats;
  errors: ImportErrorItem[];
  fileName: string;
  onNavigateToContacts: () => void;
  onImportAnother: () => void;
  onOpenArchitecture: () => void;
}

export const ImportSummaryStep: React.FC<ImportSummaryStepProps> = ({
  summary,
  errors,
  fileName,
  onNavigateToContacts,
  onImportAnother,
  onOpenArchitecture,
}) => {
  const [selectedError, setSelectedError] = useState<ImportErrorItem | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);

  const handleDownloadCsv = () => {
    if (errors.length === 0) return;
    const csvContent = ImportSummaryService.generateErrorCsv(errors);
    ImportSummaryService.triggerDownload(csvContent, `import_errors_${Date.now()}.csv`);
  };

  const handleCopyRaw = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 pb-2 border-b border-slate-100">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          Contact Ingestion & Normalization Completed
        </h3>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          File: <strong>{fileName}</strong> &bull; Processed through chunked transactional pipeline with compliance and deduplication enforcement.
        </p>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Total Records</span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5 block">{summary.total.toLocaleString()}</span>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">New Contacts</span>
          <span className="text-2xl font-extrabold text-emerald-700 font-mono mt-0.5 block">{summary.successful.toLocaleString()}</span>
        </div>

        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
          <span className="text-[10px] font-semibold text-indigo-800 uppercase tracking-wider block">Enriched / Updated</span>
          <span className="text-2xl font-extrabold text-indigo-700 font-mono mt-0.5 block">{summary.updated.toLocaleString()}</span>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider block">Duplicates Handled</span>
          <span className="text-2xl font-extrabold text-amber-700 font-mono mt-0.5 block">{summary.duplicate.toLocaleString()}</span>
        </div>

        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl col-span-2 sm:col-span-1">
          <span className="text-[10px] font-semibold text-rose-800 uppercase tracking-wider block">Failed Rows</span>
          <span className="text-2xl font-extrabold text-rose-700 font-mono mt-0.5 block">{summary.failed.toLocaleString()}</span>
        </div>
      </div>

      {/* Execution Performance & Throughput */}
      <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-600">
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Duration: <strong className="text-slate-900 font-mono">{summary.durationSeconds}s</strong>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Throughput: <strong className="text-slate-900 font-mono">{summary.throughputRowsPerSec.toLocaleString()} rows/sec</strong>
          </span>
        </div>

        <button
          onClick={onOpenArchitecture}
          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold transition cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>View Laravel Queue & DB Transaction Architecture</span>
        </button>
      </div>

      {/* Error Breakdown & Inspection Section */}
      {errors.length > 0 && (
        <div className="border border-rose-200 rounded-xl overflow-hidden bg-white">
          <div className="bg-rose-50/80 px-4 py-3 border-b border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span className="font-bold text-rose-900 text-xs">
                Row Failures & Audit Exceptions ({errors.length})
              </span>
            </div>

            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Error Log (CSV)</span>
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-[10px] font-semibold uppercase">
                  <th className="py-2 px-3 w-16 text-center">Row</th>
                  <th className="py-2 px-3 w-32">Field Name</th>
                  <th className="py-2 px-3">Failure Reason</th>
                  <th className="py-2 px-3 text-right">Raw Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {errors.slice(0, 30).map((err, i) => (
                  <tr key={i} className="hover:bg-rose-50/20 transition">
                    <td className="py-2 px-3 text-center font-mono font-bold text-rose-800 text-[11px]">
                      #{err.rowNumber}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-700">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono">
                        {err.fieldName || 'identifier'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-rose-700 text-[11px]">
                      {err.errorMessage}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => setSelectedError(err)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] underline cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {errors.length > 30 && (
            <div className="p-2 bg-slate-50 text-center text-[10px] text-slate-500 border-t border-slate-200">
              Showing first 30 errors. Download CSV for full record logs.
            </div>
          )}
        </div>
      )}

      {/* Raw Error Inspection Modal */}
      {selectedError && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-sm text-slate-900">
                Row #{selectedError.rowNumber} Payload Inspection
              </h4>
              <button
                onClick={() => setSelectedError(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="text-xs space-y-1">
              <span className="text-slate-500">Error Message:</span>
              <p className="text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
                {selectedError.errorMessage}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Raw Record JSON:</span>
                <button
                  onClick={() => handleCopyRaw(selectedError.rawData)}
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-[11px]"
                >
                  {copiedRaw ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedRaw ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[10px] font-mono overflow-x-auto max-h-48">
                {JSON.stringify(selectedError.rawData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <button
          onClick={onImportAnother}
          className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
        >
          &larr; Import Another Spreadsheet
        </button>

        <button
          id="view-contacts-btn"
          onClick={onNavigateToContacts}
          className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
        >
          <span>View Master Contacts Hub</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
