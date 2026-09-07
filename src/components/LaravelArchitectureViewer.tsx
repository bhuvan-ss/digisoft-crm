import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  FileCode, 
  Download, 
  Server, 
  Layers, 
  Cpu, 
  Database, 
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { LARAVEL_CODE_FILES, LaravelCodeFile } from '../data/laravelCodeSnippets';

export const LaravelArchitectureViewer: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState<string>(LARAVEL_CODE_FILES[0].id);
  const [copied, setCopied] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const selectedFile = LARAVEL_CODE_FILES.find(f => f.id === selectedFileId) || LARAVEL_CODE_FILES[0];

  const categories = ['all', ...Array.from(new Set(LARAVEL_CODE_FILES.map(f => f.category)))];

  const filteredFiles = selectedCategory === 'all' 
    ? LARAVEL_CODE_FILES 
    : LARAVEL_CODE_FILES.filter(f => f.category === selectedCategory);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([selectedFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.filename.split('/').pop() || 'laravel_file.php';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Terminal className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">
              Laravel 12+ & PHP 8.3 Production Architecture Spec
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-500 text-slate-950">
              Enterprise Grade
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Complete architectural implementation covering Eloquent models with UUIDs, chunked database migrations, provider-agnostic ESP drivers, TallyPrime XML sync services, Redis Horizon jobs, Livewire 3 components, and Pest feature tests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadFile}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Download Selected File</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy File Content'}</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat === 'all' ? 'All Files (9 Modules)' : cat}
          </button>
        ))}
      </div>

      {/* Main Split Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: File Tree Navigation */}
        <div className="space-y-2 bg-white rounded-xl border border-slate-200 p-3 shadow-sm max-h-[640px] overflow-y-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
            Laravel Project Structure
          </span>

          {filteredFiles.map((file) => {
            const isSelected = file.id === selectedFileId;

            return (
              <div
                key={file.id}
                onClick={() => setSelectedFileId(file.id)}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-xs'
                    : 'border-transparent hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="truncate font-mono">{file.filename.split('/').pop()}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-sans">
                    {file.category}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                  {file.filename}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 3 Columns: Code Preview Canvas */}
        <div className="lg:col-span-3 bg-slate-950 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
          {/* File Header Bar */}
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-slate-200 font-semibold">{selectedFile.filename}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-sans border border-slate-700">
                {selectedFile.category}
              </span>
            </div>
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              {selectedFile.description}
            </span>
          </div>

          {/* Code Viewer */}
          <div className="p-4 overflow-auto max-h-[580px] font-mono text-[12px] leading-relaxed text-slate-300 bg-slate-950 scrollbar-thin">
            <pre>{selectedFile.code}</pre>
          </div>
        </div>

      </div>

      {/* Production Deployment Architecture Checklist */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-600" />
          Production Deployment Architecture Checklist (Laravel 12 + Docker)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-600">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="font-bold text-slate-900 block">1. Queue Processing (Horizon)</span>
            <p className="text-[11px]">
              Deploy with Redis and Laravel Horizon: <code>php artisan horizon</code>. Chunks recipient queries at 500 records per job to maintain memory footprint &lt; 64MB.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="font-bold text-slate-900 block">2. Tally ODBC Network Bridge</span>
            <p className="text-[11px]">
              Ensure TallyPrime machine exposes port <code>9000</code> over LAN or WireGuard VPN. Automated cron runs <code>tally:sync-debtors</code> every 2 hours.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="font-bold text-slate-900 block">3. Multi-ESP Fallback Routing</span>
            <p className="text-[11px]">
              Amazon SES primary, with automatic failover to Brevo and SendGrid if reputation threshold dips or provider API returns HTTP 429 rate limit errors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
