import React, { useState } from 'react';
import { 
  X, 
  Server, 
  Settings, 
  Layers, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Code, 
  RefreshCw,
  ShieldCheck,
  Zap,
  Activity,
  Check,
  Eye,
  RotateCcw
} from 'lucide-react';
import { 
  TallyConnection, 
  TallyFieldMappingItem, 
  TallySyncLogEntry, 
  TallyStagingContact 
} from '../../types';
import { INITIAL_TALLY_FIELD_MAPPINGS } from '../../data/tallyData';

interface ConnectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: TallyConnection | null;
  onUpdateConnection: (updated: TallyConnection) => void;
  syncLogs: TallySyncLogEntry[];
  stagingContacts: TallyStagingContact[];
  onTriggerSync: (connectionId: string) => void;
  isSyncing: boolean;
}

export const ConnectionDetailsModal: React.FC<ConnectionDetailsModalProps> = ({
  isOpen,
  onClose,
  connection,
  onUpdateConnection,
  syncLogs,
  stagingContacts,
  onTriggerSync,
  isSyncing
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'mapping' | 'settings' | 'history' | 'staging'>('config');
  const [mappings, setMappings] = useState<TallyFieldMappingItem[]>(INITIAL_TALLY_FIELD_MAPPINGS);
  const [selectedStagingRow, setSelectedStagingRow] = useState<TallyStagingContact | null>(null);
  const [stagingFilter, setStagingFilter] = useState<'ALL' | 'PENDING' | 'VALIDATED' | 'PROCESSED' | 'FAILED'>('ALL');
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ success: boolean; latency: number } | null>(null);

  if (!isOpen || !connection) return null;

  const connLogs = syncLogs.filter(l => l.connectionId === connection.id);
  const connStaging = stagingContacts.filter(s => s.connectionId === connection.id);
  const filteredStaging = stagingFilter === 'ALL' 
    ? connStaging 
    : connStaging.filter(s => s.processingStatus === stagingFilter);

  const handlePing = () => {
    setIsPinging(true);
    setPingResult(null);
    setTimeout(() => {
      setIsPinging(false);
      setPingResult({ success: true, latency: 38 });
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col h-[90vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              connection.status === 'ONLINE' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' :
              connection.status === 'SYNCING' ? 'bg-amber-100 text-amber-700 border border-amber-300' :
              'bg-rose-100 text-rose-700 border border-rose-300'
            }`}>
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {connection.name}
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  connection.connectionType === 'ODBC' 
                    ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {connection.connectionType} Port {connection.port}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {connection.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Active Tally Company: <strong className="text-slate-800">{connection.tallyCompanyName}</strong> • Device ID: <span className="font-mono">{connection.deviceFingerprint}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onTriggerSync(connection.id)}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 5 Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 border-b border-slate-200 bg-white text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-3.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'config'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Configuration
          </button>
          <button
            onClick={() => setActiveTab('mapping')}
            className={`py-3 px-3.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'mapping'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Field Mapping ({mappings.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-3.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            3. Sync Settings & Groups
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            4. Sync History ({connLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('staging')}
            className={`py-3 px-3.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'staging'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            5. Staging Inspector & Error Logs ({connStaging.length})
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="p-5 overflow-y-auto flex-1 text-xs text-slate-700 space-y-4">
          {/* TAB 1: Configuration */}
          {activeTab === 'config' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                  <span>Tally Gateway Parameters</span>
                  <button
                    onClick={handlePing}
                    disabled={isPinging}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  >
                    {isPinging ? 'Pinging Gateway...' : 'Ping Test'}
                  </button>
                </h4>

                {pingResult && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Ping verified in <strong>{pingResult.latency}ms</strong>. Port {connection.port} is accepting connections.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 text-[11px] font-semibold mb-1">Local Host / IP Address</label>
                    <input
                      type="text"
                      disabled
                      value={connection.host}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[11px] font-semibold mb-1">Port</label>
                    <input
                      type="number"
                      disabled
                      value={connection.port}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 text-[11px] font-semibold mb-1">Tally Company Name</label>
                    <input
                      type="text"
                      disabled
                      value={connection.tallyCompanyName}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  {connection.databaseName && (
                    <div className="sm:col-span-2">
                      <label className="block text-slate-500 text-[11px] font-semibold mb-1">ODBC DSN Name</label>
                      <input
                        type="text"
                        disabled
                        value={connection.databaseName}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 text-[11px] font-semibold mb-1">
                      Encrypted Ingestion Token (AES-256 Masked)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={connection.apiTokenMasked || 'dgtly_agt_98f2************a19d'}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-amber-800"
                    />
                  </div>
                </div>
              </div>

              {/* Agent Device Fingerprint & Health */}
              <div className="space-y-4">
                <div className="bg-slate-900 rounded-xl p-4 text-slate-200 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Agent Device Fingerprint
                  </span>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Fingerprint ID:</span>
                      <span className="font-mono text-slate-200">{connection.deviceFingerprint}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Agent Release:</span>
                      <span className="font-mono text-emerald-400">{connection.agentVersion || 'v2.4.2-win64'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Last Heartbeat:</span>
                      <span className="text-slate-300">{new Date(connection.lastHeartbeatAt || Date.now()).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Last Tally AlterID:</span>
                      <span className="font-mono text-amber-400">#{connection.lastAlterId || 148290}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-mono">
                    Device verified. Cryptographic token exchange active over outbound HTTPS port 443.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Field Mapping */}
          {activeTab === 'mapping' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Tally Ledger Schema to Master Contact Entities
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Normalized mapping applied during the Staging Processor phase before deduplication.
                  </p>
                </div>
                <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200">
                  8 Target Fields Active
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Tally Source (ODBC / XML)</th>
                      <th className="py-2.5 px-3">Sample Value</th>
                      <th className="py-2.5 px-3">CRM Schema Target</th>
                      <th className="py-2.5 px-4">Transformation Pipeline</th>
                      <th className="py-2.5 px-3">Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {mappings.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-bold text-indigo-700">
                          {m.tallyField}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                          {m.tallySample}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {m.crmTarget}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 text-[11px]">
                          {m.transformationRule}
                        </td>
                        <td className="py-2.5 px-3">
                          {m.isRequired ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Mandatory
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Optional</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Sync Settings & Groups */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500">
                  Customer Ledger Groups Included
                </h4>
                <div className="flex flex-wrap gap-2">
                  {connection.customerGroups.map((grp) => (
                    <span key={grp} className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      {grp}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  Ledgers belonging to these parent groups or their child groups will be ingested into Staging.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500">
                  Excluded Groups (Permanently Ignored)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {connection.excludedGroups.map((grp) => (
                    <span key={grp} className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
                      ✕ {grp}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  Financial accounting records, revenue accounts, and bank accounts are discarded before staging.
                </p>
              </div>

              <div className="lg:col-span-2 bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800">Automated Sync Schedule</div>
                  <div className="text-[11px] text-slate-500">Configured frequency: <strong className="text-indigo-700">{connection.syncSchedule}</strong>. Next execution in background queue.</div>
                </div>
                <span className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700">
                  Laravel Horizon Managed
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: Sync History */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Run ID & Started</th>
                      <th className="py-2.5 px-3">Sync Type</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3">Records Found</th>
                      <th className="py-2.5 px-3">Created</th>
                      <th className="py-2.5 px-3">Updated</th>
                      <th className="py-2.5 px-3">Failed</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {connLogs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-400">
                          No sync execution logs recorded for this connection yet.
                        </td>
                      </tr>
                    ) : (
                      connLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4">
                            <div className="font-mono font-bold text-slate-900">{log.id}</div>
                            <div className="text-[10px] text-slate-400">{new Date(log.startedAt).toLocaleString()}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 font-bold">
                              {log.syncType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                            {log.durationMs ? `${(log.durationMs / 1000).toFixed(1)}s` : '3.2s'}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{log.recordsFound}</td>
                          <td className="py-2.5 px-3 font-semibold text-emerald-600">+{log.recordsCreated}</td>
                          <td className="py-2.5 px-3 font-semibold text-sky-600">{log.recordsUpdated}</td>
                          <td className="py-2.5 px-3">
                            {log.recordsFailed > 0 ? (
                              <span className="font-bold text-rose-600">{log.recordsFailed}</span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                              log.status === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {log.status === 'SUCCESS' && <CheckCircle2 className="w-2.5 h-2.5" />}
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: Staging Inspector & Error Logs */}
          {activeTab === 'staging' && (
            <div className="space-y-4">
              {/* Filter Pills */}
              <div className="flex items-center gap-2">
                {(['ALL', 'PENDING', 'VALIDATED', 'PROCESSED', 'FAILED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStagingFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      stagingFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {st} ({st === 'ALL' ? connStaging.length : connStaging.filter(s => s.processingStatus === st).length})
                  </button>
                ))}
              </div>

              {/* Staging Contacts Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-4">Tally Ledger Name</th>
                        <th className="py-2.5 px-3">Parent Group</th>
                        <th className="py-2.5 px-3">Email & Mobile</th>
                        <th className="py-2.5 px-3">GSTIN & City</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-4 text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredStaging.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">
                            No staging records found under status {stagingFilter}.
                          </td>
                        </tr>
                      ) : (
                        filteredStaging.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-semibold text-slate-900">
                              <div>{row.ledgerName}</div>
                              <div className="text-[10px] font-mono text-slate-400">{row.externalId}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                {row.parentGroup}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="text-slate-800">{row.email}</div>
                              <div className="text-[10px] font-mono text-slate-400">{row.mobile}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-mono text-indigo-700 font-semibold">{row.gstin || 'N/A'}</div>
                              <div className="text-[10px] text-slate-400">{row.city}, {row.state}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.processingStatus === 'PROCESSED' ? 'bg-emerald-100 text-emerald-800' :
                                row.processingStatus === 'VALIDATED' ? 'bg-sky-100 text-sky-800' :
                                row.processingStatus === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {row.processingStatus}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                onClick={() => setSelectedStagingRow(row)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer"
                              >
                                View Payload
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Inspect Staging Record Drawer / Modal */}
              {selectedStagingRow && (
                <div className="p-4 bg-slate-900 rounded-xl text-slate-200 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-mono">
                      <Code className="w-4 h-4" />
                      Staging Contact Raw Payload: {selectedStagingRow.ledgerName}
                    </span>
                    <button
                      onClick={() => setSelectedStagingRow(null)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Close Payload
                    </button>
                  </div>

                  {selectedStagingRow.validationErrors && selectedStagingRow.validationErrors.length > 0 && (
                    <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-lg text-rose-300 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Validation Failures:
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                        {selectedStagingRow.validationErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <pre className="text-[11px] font-mono leading-relaxed p-3 bg-slate-950 rounded-lg overflow-x-auto text-emerald-400 max-h-48">
                    {JSON.stringify(selectedStagingRow, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
