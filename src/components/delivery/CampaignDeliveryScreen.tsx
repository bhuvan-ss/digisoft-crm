import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Pause, 
  Play, 
  Square, 
  RefreshCw, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Gauge, 
  Layers, 
  Cpu, 
  Sliders, 
  ShieldAlert, 
  Search, 
  Filter,
  Check,
  Zap,
  Radio,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import { 
  Campaign, 
  Contact, 
  EmailProviderConfigRecord, 
  LiveDeliveryEngineStats, 
  QueueBatch, 
  QueueChunk, 
  DeliveryLogEntry,
  CampaignRecipient
} from '../../types';
import { CampaignDeliveryEngine } from '../../services/delivery/CampaignDeliveryEngine';

interface CampaignDeliveryScreenProps {
  campaigns: Campaign[];
  contacts: Contact[];
  providerConfigs: EmailProviderConfigRecord[];
  onUpdateCampaign?: (campaign: Campaign) => void;
  onNavigateToSettings?: () => void;
}

export const CampaignDeliveryScreen: React.FC<CampaignDeliveryScreenProps> = ({
  campaigns,
  contacts,
  providerConfigs,
  onUpdateCampaign,
  onNavigateToSettings
}) => {
  // Available campaigns to dispatch
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    campaigns[0]?.id || ''
  );
  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    providerConfigs.find(p => p.is_default)?.id || providerConfigs[0]?.id || ''
  );

  // Large-scale benchmark simulation options
  const [simulationScale, setSimulationScale] = useState<'normal' | '10k' | '100k' | '1m'>('normal');

  // Delivery Engine instance ref
  const engineRef = useRef<CampaignDeliveryEngine | null>(null);

  // Real-time UI State
  const [stats, setStats] = useState<LiveDeliveryEngineStats>({
    queued: 0,
    sending: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    bounced: 0,
    complained: 0,
    unsubscribed: 0,
    percentageComplete: 0,
    currentSpeedPerSec: 0,
    targetSpeedPerSec: 80,
    status: 'idle'
  });

  const [activeBatch, setActiveBatch] = useState<QueueBatch | null>(null);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLogEntry[]>([]);
  const [recipientSnapshot, setRecipientSnapshot] = useState<{
    valid: CampaignRecipient[];
    suppressed: CampaignRecipient[];
  }>({ valid: [], suppressed: [] });

  // Slider for dynamic speed throttling
  const [speedSlider, setSpeedSlider] = useState<number>(80);
  const [logFilter, setLogFilter] = useState<'all' | 'DELIVERED' | 'BOUNCED' | 'FAILED'>('all');
  const [searchLog, setSearchLog] = useState('');

  const currentCampaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0];
  const currentProvider = providerConfigs.find(p => p.id === selectedProviderId) || providerConfigs[0];

  // Initialize engine & snapshot on campaign change
  useEffect(() => {
    if (!currentCampaign || !currentProvider) return;

    const engine = new CampaignDeliveryEngine(
      currentProvider.settings.provider_max_rate || 100,
      currentProvider.settings.safety_margin_percentage || 20
    );

    engine.setCallbacks({
      onProgress: (newStats, batch) => {
        setStats({ ...newStats });
        setActiveBatch({ ...batch });
      },
      onLog: (entry) => {
        setDeliveryLogs(prev => [entry, ...prev.slice(0, 199)]);
      },
      onChunkComplete: (chunk) => {
        setActiveBatch(prev => {
          if (!prev) return null;
          return {
            ...prev,
            chunks: prev.chunks.map(c => c.id === chunk.id ? chunk : c)
          };
        });
      },
      onBatchFinished: (batch, finalStats) => {
        setStats({ ...finalStats });
        setActiveBatch({ ...batch });
        if (currentCampaign && onUpdateCampaign) {
          onUpdateCampaign({
            ...currentCampaign,
            status: finalStats.status === 'completed' ? 'COMPLETED' : 'FAILED',
            completed_at: new Date().toISOString(),
            metrics: {
              ...currentCampaign.metrics,
              sentCount: finalStats.sent,
              deliveredCount: finalStats.delivered,
              bouncedSoftCount: finalStats.bounced,
              complainedCount: finalStats.complained
            }
          });
        }
      }
    });

    engineRef.current = engine;

    // Generate recipient snapshot
    let baseContacts = contacts;
    if (simulationScale === '10k') {
      baseContacts = generateSyntheticAudience(10000);
    } else if (simulationScale === '100k') {
      baseContacts = generateSyntheticAudience(100000);
    } else if (simulationScale === '1m') {
      baseContacts = generateSyntheticAudience(1000000);
    }

    const snapshot = engine.prepareRecipientSnapshot(currentCampaign, baseContacts);
    setRecipientSnapshot({
      valid: snapshot.validRecipients,
      suppressed: snapshot.suppressedRecipients
    });

    const batch = engine.createBatchJobs(
      currentCampaign, 
      snapshot.validRecipients, 
      currentProvider,
      simulationScale === '1m' ? 2000 : 500
    );
    setActiveBatch(batch);
    setStats(engine.getStats());

    return () => {
      engine.abort();
    };
  }, [selectedCampaignId, selectedProviderId, simulationScale, campaigns, contacts, providerConfigs]);

  // Synthetic Audience Generator for 10k, 100k, 1M+ benchmark simulations
  function generateSyntheticAudience(count: number): Contact[] {
    const list: Contact[] = [];
    const domains = ['apexinfotech.in', 'bharatlogix.com', 'zenithpharma.org', 'tallycorp.com', 'digisoft.com'];
    for (let i = 0; i < Math.min(count, 5000); i++) {
      const dom = domains[i % domains.length];
      list.push({
        id: `CNT-SYNTH-${i + 1}`,
        firstName: `User${i + 1}`,
        lastName: `Enterprise`,
        companyName: `Corporate Entity ${Math.floor(i / 10) + 1}`,
        email: `contact.${i + 1}@${dom}`,
        phone: '+919800000000',
        designation: 'Accounts Manager',
        city: 'Mumbai',
        marketingStatus: i % 100 === 0 ? 'BOUNCED' : 'ACTIVE',
        marketingConsent: i % 150 !== 0,
        consentStatus: i % 100 === 0 ? 'bounced' : 'double_opt_in',
        consentSource: 'Bulk Import',
        consentDate: '2026-09-01T10:00:00Z',
        consentIp: '127.0.0.1',
        lifecycleStage: 'customer',
        totalEmailsSent: 0,
        totalEmailsOpened: 0,
        totalEmailsClicked: 0,
        unsubscribeToken: `unsub-${i}`,
        isSuppressed: i % 200 === 0,
        tags: ['Enterprise Customer'],
        tallyOutstandingBalance: 50000,
        tallyOverdueDays: 15,
        createdAt: '2026-09-01T10:00:00Z'
      });
    }
    // If count > 5000, repeat reference array to avoid memory overhead
    while (list.length < count) {
      const needed = count - list.length;
      list.push(...list.slice(0, Math.min(needed, list.length)));
    }
    return list;
  }

  // Engine Actions
  const handleStartDispatch = async () => {
    if (!engineRef.current || !currentCampaign || !currentProvider) return;
    await engineRef.current.startDispatch(
      currentCampaign, 
      recipientSnapshot.valid, 
      currentProvider,
      simulationScale !== 'normal'
    );
  };

  const handlePause = () => {
    engineRef.current?.pause();
    setStats(prev => ({ ...prev, status: 'paused' }));
  };

  const handleResume = () => {
    engineRef.current?.resume();
    setStats(prev => ({ ...prev, status: 'running' }));
  };

  const handleAbort = () => {
    engineRef.current?.abort();
    setStats(prev => ({ ...prev, status: 'aborted' }));
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeedSlider(newSpeed);
    engineRef.current?.setSpeedLimit(newSpeed, currentProvider?.settings.safety_margin_percentage || 20);
    setStats(prev => ({ ...prev, targetSpeedPerSec: Math.round(newSpeed * 0.8) }));
  };

  const filteredLogs = deliveryLogs.filter(log => {
    if (logFilter !== 'all' && log.status !== logFilter) return false;
    if (searchLog && !log.recipientEmail.toLowerCase().includes(searchLog.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                High-Throughput Campaign Delivery Engine
              </h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                stats.status === 'running'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                  : stats.status === 'paused'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {stats.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Redis Queue &bull; 4 Concurrent Horizon Workers &bull; Token-Bucket Rate Limiter &bull; Exponential Backoff Retry Engine
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {stats.status === 'idle' || stats.status === 'completed' || stats.status === 'aborted' ? (
              <button
                id="btn-start-dispatch"
                onClick={handleStartDispatch}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Campaign Dispatch</span>
              </button>
            ) : stats.status === 'running' ? (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition cursor-pointer"
              >
                <Pause className="w-4 h-4 fill-slate-950" />
                <span>Pause Queue</span>
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Resume Queue</span>
              </button>
            )}

            {(stats.status === 'running' || stats.status === 'paused') && (
              <button
                onClick={handleAbort}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-rose-300 hover:bg-rose-50 text-rose-700 font-bold text-xs transition cursor-pointer"
                title="Emergency stop queue workers"
              >
                <Square className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                <span>Emergency Abort</span>
              </button>
            )}
          </div>
        </div>

        {/* Configuration Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Campaign Selector */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Target Campaign</label>
            <select
              value={selectedCampaignId}
              onChange={e => setSelectedCampaignId(e.target.value)}
              disabled={stats.status === 'running'}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-800 disabled:opacity-60"
            >
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.campaign_type}) - {c.status}
                </option>
              ))}
            </select>
          </div>

          {/* ESP Provider Selector */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Active ESP Driver</label>
            <select
              value={selectedProviderId}
              onChange={e => setSelectedProviderId(e.target.value)}
              disabled={stats.status === 'running'}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-800 disabled:opacity-60"
            >
              {providerConfigs.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.is_default ? '(Default Primary)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Scale Benchmark Simulator */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Volume Scale Benchmark</label>
            <select
              value={simulationScale}
              onChange={e => setSimulationScale(e.target.value as any)}
              disabled={stats.status === 'running'}
              className="w-full px-3 py-1.5 border border-indigo-200 rounded-lg bg-indigo-50/50 font-medium text-indigo-900 disabled:opacity-60"
            >
              <option value="normal">Live CRM Contacts ({contacts.length.toLocaleString()} recipients)</option>
              <option value="10k">High Volume Test: 10,000 Recipients (20 Chunks)</option>
              <option value="100k">Enterprise Stress Test: 100,000 Recipients (200 Chunks)</option>
              <option value="1m">Million-Scale Architecture Test: 1,000,000 Recipients (500 Chunks)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Real-time Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Queued */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Queued</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-800 font-mono">
              {stats.queued.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">pending</span>
          </div>
        </div>

        {/* Sending / In-Flight */}
        <div className="bg-white p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block">In-Flight</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-indigo-600 font-mono animate-pulse">
              {stats.sending}
            </span>
            <span className="text-[10px] text-indigo-500 font-mono">4 workers</span>
          </div>
        </div>

        {/* Sent */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Dispatched</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 font-mono">
              {stats.sent.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">HTTP 200/202</span>
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Delivered</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-emerald-600 font-mono">
              {stats.delivered.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold font-mono">
              {stats.sent > 0 ? Math.round((stats.delivered / stats.sent) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Bounced */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">Bounced</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-amber-600 font-mono">
              {stats.bounced.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-500 font-mono">auto-suppressed</span>
          </div>
        </div>

        {/* Failed */}
        <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">Failed (DLQ)</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-rose-600 font-mono">
              {stats.failed.toLocaleString()}
            </span>
            <span className="text-[10px] text-rose-500 font-mono">3 retries exhausted</span>
          </div>
        </div>

        {/* Percentage Complete */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-4 lg:col-span-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Progress</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-indigo-700 font-mono">
              {stats.percentageComplete}%
            </span>
            <span className="text-[10px] text-slate-500 font-mono">completed</span>
          </div>
        </div>
      </div>

      {/* Progress & Speed Gauge Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Campaign Dispatch Progress: {activeBatch?.processedJobs.toLocaleString() || 0} of {activeBatch?.totalJobs.toLocaleString() || 0} Recipients
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Provider Limit: <strong>{currentProvider?.settings.provider_max_rate}/s</strong> &bull; Target Dispatch Rate: <strong>{stats.targetSpeedPerSec}/s</strong> (20% safety margin enforced)
            </p>
          </div>

          {/* Speed Indicator */}
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <Gauge className="w-4 h-4 text-indigo-600" />
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Live Throughput</span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-extrabold text-slate-900 font-mono">
                  {stats.currentSpeedPerSec}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">emails / sec</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-amber-500 transition-all duration-300"
              style={{ width: `${stats.percentageComplete}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0% (Initialized)</span>
            <span>Batch ID: {activeBatch?.id || 'N/A'}</span>
            <span>100% (Batch Complete)</span>
          </div>
        </div>

        {/* Dynamic Speed Throttle Slider */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs">
            <Sliders className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700">Dynamic Sending Rate Limiter:</span>
            <span className="font-mono font-bold text-indigo-700">{speedSlider} / sec</span>
            <span className="text-[11px] text-slate-400">
              (Effective after safety margin: {Math.round(speedSlider * 0.8)} / sec)
            </span>
          </div>

          <div className="flex items-center gap-2 max-w-xs w-full">
            <span className="text-[10px] text-slate-400 font-mono">10/s</span>
            <input
              type="range"
              min={10}
              max={300}
              step={5}
              value={speedSlider}
              onChange={e => handleSpeedChange(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 font-mono">300/s</span>
          </div>
        </div>
      </div>

      {/* Chunks & Workers Visualization */}
      {activeBatch && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Laravel Bus Chunks ({activeBatch.chunks.length} Total Chunks &bull; Chunk Size: {activeBatch.chunkSize.toLocaleString()})
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Completed
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> Processing
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span> Queued
              </span>
            </div>
          </div>

          {/* Chunk Blocks Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-20 gap-1.5 max-h-48 overflow-y-auto p-1">
            {activeBatch.chunks.map(chunk => {
              let bg = 'bg-slate-100 text-slate-500 border-slate-200';
              if (chunk.status === 'completed') {
                bg = 'bg-emerald-50 text-emerald-700 border-emerald-300';
              } else if (chunk.status === 'processing') {
                bg = 'bg-indigo-600 text-white border-indigo-700 animate-pulse';
              } else if (chunk.status === 'retrying') {
                bg = 'bg-amber-100 text-amber-800 border-amber-300';
              } else if (chunk.status === 'failed') {
                bg = 'bg-rose-100 text-rose-800 border-rose-300';
              }

              return (
                <div
                  key={chunk.id}
                  title={`Chunk ${chunk.chunkIndex}: ${chunk.recipientCount} recipients - Status: ${chunk.status} ${chunk.workerId ? `(${chunk.workerId})` : ''}`}
                  className={`py-1 px-1.5 rounded text-[10px] font-mono font-bold text-center border cursor-default transition ${bg}`}
                >
                  #{chunk.chunkIndex}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suppression & Recipient Snapshot Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recipient Snapshot Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-sm">Pre-Dispatch Suppression Audit</h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Total Audience Count:</span>
              <span className="font-bold font-mono text-slate-900">
                {(recipientSnapshot.valid.length + recipientSnapshot.suppressed.length).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-emerald-700 font-medium">Valid Cleared Recipients:</span>
              <span className="font-bold font-mono text-emerald-700">
                {recipientSnapshot.valid.length.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-rose-600">Suppressed & Excluded:</span>
              <span className="font-bold font-mono text-rose-600">
                {recipientSnapshot.suppressed.length.toLocaleString()}
              </span>
            </div>

            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">Suppression Reasons:</span>
              <div className="space-y-1 text-[11px] text-slate-600">
                {recipientSnapshot.suppressed.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="flex justify-between bg-slate-50 px-2 py-1 rounded">
                    <span className="truncate max-w-[180px]">{item.email}</span>
                    <span className="text-rose-600 font-mono text-[10px]">{item.exclusion_reason}</span>
                  </div>
                ))}
                {recipientSnapshot.suppressed.length === 0 && (
                  <div className="p-2 bg-emerald-50 text-emerald-800 rounded text-center text-xs">
                    Clean list: Zero suppression flags detected.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Delivery Telemetry Log */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Real-time ESP Telemetry & Event Log</h3>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search recipient email..."
                  value={searchLog}
                  onChange={e => setSearchLog(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-hidden"
                />
                <select
                  value={logFilter}
                  onChange={e => setLogFilter(e.target.value as any)}
                  className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="all">All Events</option>
                  <option value="DELIVERED">Delivered Only</option>
                  <option value="BOUNCED">Bounces Only</option>
                  <option value="FAILED">Failed Only</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="mt-3 overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 text-[10px] uppercase sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Recipient</th>
                    <th className="py-2 px-2">Provider</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2">HTTP</th>
                    <th className="py-2 px-2">Latency</th>
                    <th className="py-2 px-3">ESP Message ID / Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {filteredLogs.map(log => {
                    let statusBadge = 'bg-slate-100 text-slate-700';
                    if (log.status === 'DELIVERED') statusBadge = 'bg-emerald-50 text-emerald-700 font-bold';
                    else if (log.status === 'BOUNCED') statusBadge = 'bg-amber-50 text-amber-800 font-bold';
                    else if (log.status === 'FAILED') statusBadge = 'bg-rose-50 text-rose-700 font-bold';
                    else if (log.status === 'COMPLAINED') statusBadge = 'bg-purple-50 text-purple-700 font-bold';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-1.5 px-3 text-slate-400">
                          {log.timestamp.split('T')[1].substring(0, 8)}
                        </td>
                        <td className="py-1.5 px-3 text-slate-800 font-sans font-medium truncate max-w-[160px]">
                          {log.recipientEmail}
                        </td>
                        <td className="py-1.5 px-2 text-slate-500 uppercase text-[10px]">
                          {log.provider}
                        </td>
                        <td className="py-1.5 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${statusBadge}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-slate-600">
                          {log.httpCode}
                        </td>
                        <td className="py-1.5 px-2 text-slate-500">
                          {log.latencyMs}ms
                        </td>
                        <td className="py-1.5 px-3 text-slate-500 truncate max-w-[200px]" title={log.errorMessage || log.espMessageId}>
                          {log.errorMessage ? (
                            <span className="text-rose-600 font-sans">{log.errorMessage}</span>
                          ) : (
                            log.espMessageId
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                        No delivery events recorded yet. Click <strong>"Start Campaign Dispatch"</strong> to launch transmission.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
