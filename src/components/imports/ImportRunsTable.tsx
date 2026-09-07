import React from 'react';
import { 
  FileSpreadsheet, 
  Calendar, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Play, 
  ArrowUpRight, 
  Layers, 
  Eye, 
  Download,
  Copy,
  RefreshCw,
  Plus
} from 'lucide-react';
import { ImportRecord, ImportStatus } from '../../types';

interface ImportRunsTableProps {
  imports: ImportRecord[];
  onStartNewImport: () => void;
  onInspectImport: (importRecord: ImportRecord) => void;
  onOpenArchitecture: () => void;
}

export const ImportRunsTable: React.FC<ImportRunsTableProps> = ({
  imports,
  onStartNewImport,
  onInspectImport,
  onOpenArchitecture,
}) => {
  const getStatusBadge = (status: ImportStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            COMPLETED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
            <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin" />
            PROCESSING
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            FAILED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            CANCELLED
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            READY
          </span>
        );
      case 'MAPPING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            MAPPING
          </span>
        );
      case 'UPLOADED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            UPLOADED
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Historical Import Jobs & Batch Queue</h3>
          <p className="text-xs text-slate-500">
            Monitor chunked file ingestion pipelines, audit row logs, and inspect background queue throughput.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="view-import-architecture-btn"
            onClick={onOpenArchitecture}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-200 hover:border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Laravel Architecture & Schemas</span>
          </button>

          <button
            id="new-import-wizard-btn"
            onClick={onStartNewImport}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Import Wizard</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">File Name & Format</th>
                <th className="py-3 px-3">Import Date</th>
                <th className="py-3 px-3">Uploaded By</th>
                <th className="py-3 px-3 text-right">Total Rows</th>
                <th className="py-3 px-3 text-right">Success</th>
                <th className="py-3 px-3 text-right">Updated</th>
                <th className="py-3 px-3 text-right">Duplicates</th>
                <th className="py-3 px-3 text-right">Failed</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {imports.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-medium text-slate-600">No import runs recorded yet.</p>
                    <p className="text-[11px] text-slate-400">Launch the Import Wizard to ingest CSV, XLS, or XLSX files.</p>
                  </td>
                </tr>
              ) : (
                imports.map((imp) => (
                  <tr key={imp.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate max-w-xs">{imp.originalFileName}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-mono">{imp.fileType} format &bull; Job #{imp.id.slice(-6)}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(imp.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 pl-4.5">
                        {new Date(imp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      <div className="flex items-center gap-1 text-[11px]">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">{imp.importedBy || 'Admin System'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                      {imp.totalRows.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-emerald-600 font-semibold">
                      {imp.successfulRows.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-indigo-600 font-semibold">
                      {imp.updatedRows.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-amber-600">
                      {imp.duplicateRows.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-rose-600">
                      {imp.failedRows > 0 ? (
                        <span className="font-bold text-rose-600">{imp.failedRows.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {getStatusBadge(imp.status)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onInspectImport(imp)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition cursor-pointer"
                        title="Inspect Import Summary & Errors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
