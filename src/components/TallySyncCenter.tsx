import React, { useState } from 'react';
import { 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Code, 
  FileText, 
  Server, 
  ShieldCheck, 
  ArrowRight, 
  Zap,
  Play,
  Plus,
  Layers,
  Filter,
  Activity,
  Terminal
} from 'lucide-react';
import { 
  TallySyncConfig, 
  TallySyncLog, 
  TallyConnection, 
  TallySyncLogEntry, 
  TallyStagingContact 
} from '../types';
import { 
  INITIAL_TALLY_CONNECTIONS, 
  INITIAL_TALLY_STAGING_CONTACTS, 
  INITIAL_TALLY_SYNC_RUN_LOGS, 
  INITIAL_TALLY_FIELD_MAPPINGS 
} from '../data/tallyData';
import { buildTallyExportXml, getSimulatedTallyXmlResponse } from '../utils/tallyXml';
import { SyncDashboardOverview } from './tally/SyncDashboardOverview';
import { TallyConnectionsList } from './tally/TallyConnectionsList';
import { AddConnectionModal } from './tally/AddConnectionModal';
import { ConnectionDetailsModal } from './tally/ConnectionDetailsModal';
import { InteractiveSyncPipelineModal } from './tally/InteractiveSyncPipelineModal';

interface TallySyncCenterProps {
  config?: TallySyncConfig;
  logs?: TallySyncLog[];
  onSaveConfig?: (cfg: TallySyncConfig) => void;
  onRunSync?: () => void;
  isSyncing?: boolean;
}

export const TallySyncCenter: React.FC<TallySyncCenterProps> = ({
  config,
  logs = [],
  onSaveConfig,
  onRunSync,
  isSyncing = false
}) => {
  const [activeMainView, setActiveMainView] = useState<'dashboard' | 'connections' | 'mapping' | 'xml' | 'staging' | 'logs'>('dashboard');
  
  // State for connections, sync logs, and staging
  const [connections, setConnections] = useState<TallyConnection[]>(INITIAL_TALLY_CONNECTIONS);
  const [syncRunLogs, setSyncRunLogs] = useState<TallySyncLogEntry[]>(INITIAL_TALLY_SYNC_RUN_LOGS);
  const [stagingContacts, setStagingContacts] = useState<TallyStagingContact[]>(INITIAL_TALLY_STAGING_CONTACTS);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedConnectionForDetails, setSelectedConnectionForDetails] = useState<TallyConnection | null>(null);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [activeSyncTargetConnection, setActiveSyncTargetConnection] = useState<TallyConnection | undefined>(undefined);

  // XML samples
  const activeConn = connections[0];
  const sampleXmlRequest = buildTallyExportXml(activeConn.tallyCompanyName, activeConn.customerGroups[0] || 'Sundry Debtors');
  const sampleXmlResponse = getSimulatedTallyXmlResponse();

  const handleOpenSyncPipeline = (connectionId?: string) => {
    const target = connectionId ? connections.find(c => c.id === connectionId) : connections[0];
    setActiveSyncTargetConnection(target);
    setIsPipelineModalOpen(true);
    if (onRunSync) {
      onRunSync();
    }
  };

  const handlePipelineComplete = (stats: { found: number; created: number; updated: number; failed: number }) => {
    const newLog: TallySyncLogEntry = {
      id: `SLOG-${Date.now().toString().slice(-4)}`,
      connectionId: activeSyncTargetConnection?.id || connections[0].id,
      connectionName: activeSyncTargetConnection?.name || connections[0].name,
      syncType: 'MANUAL',
      startedAt: new Date(Date.now() - 5500).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: 5500,
      recordsFound: stats.found,
      recordsCreated: stats.created,
      recordsUpdated: stats.updated,
      recordsFailed: stats.failed,
      status: stats.failed > 0 ? 'WARNING' : 'SUCCESS',
      metadata: {
        agentIp: activeSyncTargetConnection?.host || '127.0.0.1',
        protocol: activeSyncTargetConnection?.connectionType || 'ODBC'
      }
    };

    setSyncRunLogs(prev => [newLog, ...prev]);

    // Update connection last sync time
    setConnections(prev => prev.map(c => {
      if (c.id === (activeSyncTargetConnection?.id || connections[0].id)) {
        return {
          ...c,
          lastSyncAt: new Date().toISOString(),
          lastSuccessfulSyncAt: new Date().toISOString(),
          lastAlterId: (c.lastAlterId || 148290) + stats.found
        };
      }
      return c;
    }));
  };

  const handleAddConnection = (newConn: TallyConnection) => {
    setConnections(prev => [newConn, ...prev]);
  };

  const handleUpdateConnection = (updated: TallyConnection) => {
    setConnections(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelectedConnectionForDetails(updated);
  };

  const handleDeleteConnection = (connectionId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
  };

  return (
    <div className="space-y-6">
      {/* Top Main Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMainView('dashboard')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeMainView === 'dashboard'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Sync Dashboard
          </button>
          <button
            onClick={() => setActiveMainView('connections')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeMainView === 'connections'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Tally Connections ({connections.length})
          </button>
          <button
            onClick={() => setActiveMainView('staging')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeMainView === 'staging'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Staging Database ({stagingContacts.length})
          </button>
          <button
            onClick={() => setActiveMainView('mapping')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeMainView === 'mapping'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Field Mapping
          </button>
          <button
            onClick={() => setActiveMainView('xml')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeMainView === 'xml'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            XML / ODBC Envelopes
          </button>
          <button
            onClick={() => setActiveMainView('logs')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeMainView === 'logs'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Sync Run Logs ({syncRunLogs.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Connection</span>
          </button>
          <button
            onClick={() => handleOpenSyncPipeline()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Now</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Dashboard Overview */}
      {activeMainView === 'dashboard' && (
        <SyncDashboardOverview
          connections={connections}
          logs={syncRunLogs}
          stagingContacts={stagingContacts}
          onTriggerSync={handleOpenSyncPipeline}
          isSyncing={isSyncing}
          onOpenNewConnection={() => setIsAddModalOpen(true)}
          onSelectConnection={(conn) => setSelectedConnectionForDetails(conn)}
        />
      )}

      {/* VIEW 2: Connections List */}
      {activeMainView === 'connections' && (
        <TallyConnectionsList
          connections={connections}
          onSelectConnection={(conn) => setSelectedConnectionForDetails(conn)}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onTriggerSync={handleOpenSyncPipeline}
          isSyncing={isSyncing}
          onDeleteConnection={handleDeleteConnection}
        />
      )}

      {/* VIEW 3: Staging Database */}
      {activeMainView === 'staging' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Staging Database Contacts Buffer (<code>tally_staging_contacts</code>)
              </h3>
              <p className="text-xs text-slate-500">
                Extracted records buffered prior to normalization, validation, and multi-tier deduplication.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-200">
              {stagingContacts.filter(s => s.processingStatus === 'PROCESSED').length} Processed • {stagingContacts.filter(s => s.processingStatus === 'FAILED').length} Validation Errors
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Tally Ledger Name</th>
                  <th className="py-3 px-3">Parent Group</th>
                  <th className="py-3 px-3">Contact Email</th>
                  <th className="py-3 px-3">Mobile</th>
                  <th className="py-3 px-3">GSTIN</th>
                  <th className="py-3 px-3">City & State</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Raw JSON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {stagingContacts.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{row.ledgerName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{row.externalId}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {row.parentGroup}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-800">{row.email}</td>
                    <td className="py-3 px-3 font-mono text-slate-800">{row.mobile}</td>
                    <td className="py-3 px-3 font-mono text-indigo-700 font-bold">{row.gstin || 'N/A'}</td>
                    <td className="py-3 px-3 text-slate-600">{row.city}, {row.state}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.processingStatus === 'PROCESSED' ? 'bg-emerald-100 text-emerald-800' :
                        row.processingStatus === 'VALIDATED' ? 'bg-sky-100 text-sky-800' :
                        row.processingStatus === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {row.processingStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          const conn = connections.find(c => c.id === row.connectionId) || connections[0];
                          setSelectedConnectionForDetails(conn);
                        }}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Inspect Payload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: Field Mapping */}
      {activeMainView === 'mapping' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tally Ledger to DIGISOFT CRM Normalized Schema Mappings
              </h3>
              <p className="text-xs text-slate-500">
                Standard transformations applied to all incoming Tally records across ODBC and XML connectors.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg">
              8 Fields Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Tally Source Expression</th>
                  <th className="py-3 px-4">CRM Destination Field</th>
                  <th className="py-3 px-3">Entity Type</th>
                  <th className="py-3 px-4">Transformation Pipeline</th>
                  <th className="py-3 px-3">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {INITIAL_TALLY_FIELD_MAPPINGS.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      <div>{m.tallyField}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">Sample: {m.tallySample}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{m.crmTarget}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">{m.description}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">
                        {m.crmEntity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {m.transformationRule}
                    </td>
                    <td className="py-3 px-3">
                      {m.isRequired ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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

      {/* VIEW 5: XML / ODBC Inspector */}
      {activeMainView === 'xml' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-slate-900 rounded-2xl p-5 text-slate-200 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2 font-mono">
                <Code className="w-4 h-4" />
                Outgoing TDL / XML Envelope
              </span>
              <span className="text-[10px] font-mono text-slate-400">POST http://{activeConn.host}:{activeConn.port}</span>
            </div>
            <pre className="text-[11px] font-mono leading-relaxed text-slate-300 overflow-x-auto max-h-[420px] p-3 bg-slate-950 rounded-xl">
              {sampleXmlRequest}
            </pre>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 text-slate-200 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-2 font-mono">
                <Code className="w-4 h-4" />
                Raw TallyPrime Response Envelope
              </span>
              <span className="text-[10px] font-mono text-slate-400">STATUS: 200 OK (142 KB)</span>
            </div>
            <pre className="text-[11px] font-mono leading-relaxed text-emerald-400 overflow-x-auto max-h-[420px] p-3 bg-slate-950 rounded-xl">
              {sampleXmlResponse}
            </pre>
          </div>
        </div>
      )}

      {/* VIEW 6: Logs */}
      {activeMainView === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tally Connector Synchronization Audit Trail (<code>tally_sync_logs</code>)
              </h3>
              <p className="text-xs text-slate-500">
                Detailed telemetry for Full, Incremental, and Manual synchronizations.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Log ID & Timestamp</th>
                  <th className="py-3 px-4">Gateway Connection</th>
                  <th className="py-3 px-3">Sync Type</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Found</th>
                  <th className="py-3 px-3">Created</th>
                  <th className="py-3 px-3">Updated</th>
                  <th className="py-3 px-3">Failed</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {syncRunLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{log.id}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{new Date(log.startedAt).toLocaleString()}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {log.connectionName}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                        {log.syncType}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {log.durationMs ? `${(log.durationMs / 1000).toFixed(1)}s` : '3.5s'}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{log.recordsFound}</td>
                    <td className="py-3 px-3 font-bold text-emerald-600">+{log.recordsCreated}</td>
                    <td className="py-3 px-3 font-bold text-sky-600">{log.recordsUpdated}</td>
                    <td className="py-3 px-3">
                      {log.recordsFailed > 0 ? (
                        <span className="font-bold text-rose-600">{log.recordsFailed}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                        log.status === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {log.status === 'SUCCESS' && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      <AddConnectionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddConnection={handleAddConnection}
      />

      <ConnectionDetailsModal
        isOpen={Boolean(selectedConnectionForDetails)}
        onClose={() => setSelectedConnectionForDetails(null)}
        connection={selectedConnectionForDetails}
        onUpdateConnection={handleUpdateConnection}
        syncLogs={syncRunLogs}
        stagingContacts={stagingContacts}
        onTriggerSync={handleOpenSyncPipeline}
        isSyncing={isSyncing}
      />

      <InteractiveSyncPipelineModal
        isOpen={isPipelineModalOpen}
        onClose={() => setIsPipelineModalOpen(false)}
        connection={activeSyncTargetConnection}
        onComplete={handlePipelineComplete}
      />
    </div>
  );
};
