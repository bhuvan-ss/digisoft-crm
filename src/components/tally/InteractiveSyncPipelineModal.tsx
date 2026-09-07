import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  Database, 
  ShieldCheck, 
  Server, 
  ArrowRight,
  UserPlus,
  UserCheck,
  X,
  Play
} from 'lucide-react';
import { TallyConnection } from '../../types';

interface InteractiveSyncPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection?: TallyConnection;
  onComplete: (stats: { found: number; created: number; updated: number; failed: number }) => void;
}

interface PipelineStep {
  id: number;
  label: string;
  description: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'failed';
}

export const InteractiveSyncPipelineModal: React.FC<InteractiveSyncPipelineModalProps> = ({
  isOpen,
  onClose,
  connection,
  onComplete
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const [stats, setStats] = useState({
    found: 0,
    created: 0,
    updated: 0,
    failed: 0
  });

  const steps: PipelineStep[] = [
    { id: 1, label: 'Local Tally Query', description: 'Querying port 9000 XML / ODBC for AlterID >= 148290', status: currentStepIndex > 0 ? 'completed' : currentStepIndex === 0 ? 'in_progress' : 'waiting' },
    { id: 2, label: 'Customer Filter Match', description: 'Applying Whitelist (Sundry Debtors, Customers, Dealers)', status: currentStepIndex > 1 ? 'completed' : currentStepIndex === 1 ? 'in_progress' : 'waiting' },
    { id: 3, label: 'Encrypted Transit', description: 'Agent payload HTTPS POST to /api/v1/tally/agent/push-staging', status: currentStepIndex > 2 ? 'completed' : currentStepIndex === 2 ? 'in_progress' : 'waiting' },
    { id: 4, label: 'Staging Ingestion', description: 'Buffering raw JSON in tally_staging_contacts', status: currentStepIndex > 3 ? 'completed' : currentStepIndex === 3 ? 'in_progress' : 'waiting' },
    { id: 5, label: 'Validation & Normalization', description: 'RFC 5322 Email check, +91 E.164 phone, 15-char GSTIN', status: currentStepIndex > 4 ? 'completed' : currentStepIndex === 4 ? 'in_progress' : 'waiting' },
    { id: 6, label: 'Deduplication & Merge', description: '3-Tier matching (GSTIN, Email, Mobile) & Master Update', status: currentStepIndex > 5 ? 'completed' : currentStepIndex === 5 ? 'in_progress' : 'waiting' },
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setLogs([]);
      setIsFinished(false);
      return;
    }

    const timer1 = setTimeout(() => {
      setLogs(prev => [...prev, `[00:00.2] Initiating handshake with Tally Gateway on ${connection?.host || '127.0.0.1'}:${connection?.port || 9000}`]);
      setLogs(prev => [...prev, `[00:00.5] Sending TDL Envelope: <REPORTNAME>List of Ledgers</REPORTNAME>`]);
      setCurrentStepIndex(1);
    }, 600);

    const timer2 = setTimeout(() => {
      setLogs(prev => [...prev, `[00:01.2] Received 32 ledgers. Filtering against approved groups [Sundry Debtors, Customers, Dealers]`]);
      setLogs(prev => [...prev, `[00:01.4] Excluded 4 non-business ledgers (Cash-in-Hand, HDFC Current A/c, GST Input Tax)`]);
      setCurrentStepIndex(2);
      setStats(prev => ({ ...prev, found: 28 }));
    }, 1400);

    const timer3 = setTimeout(() => {
      setLogs(prev => [...prev, `[00:02.0] Signing payload with HMAC-SHA256 device fingerprint WIN-SRV-90812`]);
      setLogs(prev => [...prev, `[00:02.3] Outbound HTTPS TLS 1.3 push to central DIGISOFT Cloud API`]);
      setCurrentStepIndex(3);
    }, 2200);

    const timer4 = setTimeout(() => {
      setLogs(prev => [...prev, `[00:03.0] Central Ingestion: 28 records buffered in tally_staging_contacts table`]);
      setLogs(prev => [...prev, `[00:03.2] Dispatched ProcessTallyStagingChunkJob to Redis Horizon queue`]);
      setCurrentStepIndex(4);
    }, 3000);

    const timer5 = setTimeout(() => {
      setLogs(prev => [...prev, `[00:03.8] Data Validation: 27 records passed RFC 5322 & GSTIN format validation`]);
      setLogs(prev => [...prev, `[00:04.1] Warning: 1 record failed email format validation ("invalid-email-format") -> marked FAILED`]);
      setStats(prev => ({ ...prev, failed: 1 }));
      setCurrentStepIndex(5);
    }, 3800);

    const timer6 = setTimeout(() => {
      setLogs(prev => [...prev, `[00:04.6] Deduplication Tier 1 (GSTIN): Matched 18 existing companies`]);
      setLogs(prev => [...prev, `[00:04.9] Deduplication Tier 2 (Email): Matched 5 existing contacts; updated closing balance`]);
      setLogs(prev => [...prev, `[00:05.2] Created 4 brand new Master Contact profiles with Tally tag`]);
      setLogs(prev => [...prev, `[00:05.5] Sync job finalized. Duration: 5.5s. AlterID updated to 148292`]);
      setStats({
        found: 28,
        created: 4,
        updated: 23,
        failed: 1
      });
      setCurrentStepIndex(6);
      setIsFinished(true);
      onComplete({ found: 28, created: 4, updated: 23, failed: 1 });
    }, 4800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
              <RefreshCw className={`w-4 h-4 ${!isFinished ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Executing TallyPrime Synchronization Pipeline
              </h3>
              <p className="text-[11px] text-slate-500">
                Target: {connection?.name || 'All Active Gateways'} ({connection?.tallyCompanyName || 'Enterprise Accounts'})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs text-slate-700">
          {/* Steps Progress List */}
          <div className="space-y-2">
            {steps.map((step, idx) => (
              <div 
                key={step.id} 
                className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                  step.status === 'completed' ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' :
                  step.status === 'in_progress' ? 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-xs' :
                  'bg-slate-50/50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    step.status === 'completed' ? 'bg-emerald-600 text-white' :
                    step.status === 'in_progress' ? 'bg-amber-500 text-white animate-pulse' :
                    'bg-slate-200 text-slate-600'
                  }`}>
                    {step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                  </div>
                  <div>
                    <div className="font-bold text-xs">{step.label}</div>
                    <div className="text-[10px] text-slate-500">{step.description}</div>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold uppercase">
                  {step.status === 'completed' ? 'Done' : step.status === 'in_progress' ? 'Processing...' : 'Queued'}
                </span>
              </div>
            ))}
          </div>

          {/* Live Telemetry Cards */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="text-[10px] font-semibold text-slate-500">Found</div>
              <div className="text-base font-bold text-slate-900">{stats.found}</div>
            </div>
            <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <div className="text-[10px] font-semibold text-emerald-700">Created</div>
              <div className="text-base font-bold text-emerald-700">+{stats.created}</div>
            </div>
            <div className="p-2 bg-sky-50 rounded-xl border border-sky-200 text-center">
              <div className="text-[10px] font-semibold text-sky-700">Updated</div>
              <div className="text-base font-bold text-sky-700">{stats.updated}</div>
            </div>
            <div className="p-2 bg-rose-50 rounded-xl border border-rose-200 text-center">
              <div className="text-[10px] font-semibold text-rose-700">Failed</div>
              <div className="text-base font-bold text-rose-700">{stats.failed}</div>
            </div>
          </div>

          {/* Rolling Console Log Terminal */}
          <div className="bg-slate-950 rounded-xl p-3 text-slate-300 font-mono text-[10px] leading-relaxed border border-slate-800 space-y-1 max-h-36 overflow-y-auto">
            <div className="text-slate-500 flex items-center gap-1 pb-1 border-b border-slate-800">
              <Terminal className="w-3 h-3 text-amber-400" />
              <span>DIGISOFT Tally Sync Runner Output:</span>
            </div>
            {logs.map((line, i) => (
              <div key={i} className="text-slate-300">
                <span className="text-amber-400">&gt;</span> {line}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs text-slate-500">
            {isFinished ? '✓ Synchronization completed successfully' : 'Executing background pipeline...'}
          </span>
          <button
            onClick={onClose}
            disabled={!isFinished}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition disabled:opacity-40 cursor-pointer"
          >
            {isFinished ? 'Done & Close' : 'Processing...'}
          </button>
        </div>
      </div>
    </div>
  );
};
