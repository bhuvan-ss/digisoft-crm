import React from 'react';
import { 
  RefreshCw, 
  Pause, 
  Play, 
  XOctagon, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  Activity, 
  Zap, 
  Clock, 
  Cpu
} from 'lucide-react';
import { ChunkProgressEvent } from '../../services/ContactImportEngine';

interface ImportProgressStepProps {
  progress: ChunkProgressEvent;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  fileName: string;
  totalRows: number;
}

export const ImportProgressStep: React.FC<ImportProgressStepProps> = ({
  progress,
  isPaused,
  onPause,
  onResume,
  onCancel,
  fileName,
  totalRows,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Background Ingestion & Queued Chunk Processor</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 animate-pulse">
              Step 5 of 6 &bull; Live Queue
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Streaming <strong>{fileName}</strong> in discrete transactions with non-blocking memory allocation.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isPaused ? (
            <button
              onClick={onResume}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Resume Queue</span>
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause Batch</span>
            </button>
          )}

          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <XOctagon className="w-3.5 h-3.5 text-rose-600" />
            <span>Abort Import</span>
          </button>
        </div>
      </div>

      {/* Primary Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700 flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${!isPaused ? 'animate-spin' : ''}`} />
            <span>Processing Chunk {progress.currentChunk} of {progress.totalChunks}</span>
          </span>
          <span className="font-mono text-indigo-600 text-sm font-extrabold">{progress.percentage}% Complete</span>
        </div>

        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-200 ease-out"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>{progress.processed.toLocaleString()} of {totalRows.toLocaleString()} rows</span>
          <span>{progress.throughputRowsPerSec.toLocaleString()} rows/sec throughput</span>
        </div>
      </div>

      {/* Real-time Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Processed</span>
          <span className="text-xl font-mono font-bold text-slate-900 mt-0.5 block">{progress.processed.toLocaleString()}</span>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">New Created</span>
          <span className="text-xl font-mono font-bold text-emerald-700 mt-0.5 block">{progress.successful.toLocaleString()}</span>
        </div>

        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
          <span className="text-[10px] font-semibold text-indigo-800 uppercase tracking-wider block">Updated</span>
          <span className="text-xl font-mono font-bold text-indigo-700 mt-0.5 block">{progress.updated.toLocaleString()}</span>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider block">Duplicates</span>
          <span className="text-xl font-mono font-bold text-amber-700 mt-0.5 block">{progress.duplicates.toLocaleString()}</span>
        </div>

        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl col-span-2 sm:col-span-1">
          <span className="text-[10px] font-semibold text-rose-800 uppercase tracking-wider block">Failed Rows</span>
          <span className="text-xl font-mono font-bold text-rose-700 mt-0.5 block">{progress.failed.toLocaleString()}</span>
        </div>
      </div>

      {/* Live Rolling Execution Log Terminal */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-slate-200 space-y-2 shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-300">Laravel Horizon / Stream Processing Log</span>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
            Worker Active
          </span>
        </div>

        <div className="h-28 overflow-y-auto space-y-1 text-[11px] text-slate-300 leading-relaxed font-mono">
          <div className="text-emerald-400">&gt; [INFO] Started streaming import job #{fileName}</div>
          <div className="text-slate-400">&gt; [QUEUE] Initialized chunk worker pool with {progress.totalChunks} discrete transactions</div>
          <div className="text-slate-300">&gt; [DISPATCH] Executing chunk #{progress.currentChunk} ({progress.processed} records ingested)</div>
          <div className="text-indigo-400">&gt; [THROUGHPUT] Current speed: {progress.throughputRowsPerSec} rows/sec &bull; Deduplication active</div>
          {progress.failed > 0 && (
            <div className="text-rose-400">&gt; [WARN] {progress.failed} row(s) failed syntax checks and logged to import_errors table</div>
          )}
          {isPaused && (
            <div className="text-amber-400 font-bold">&gt; [PAUSED] Ingestion queue paused by user request</div>
          )}
        </div>
      </div>
    </div>
  );
};
