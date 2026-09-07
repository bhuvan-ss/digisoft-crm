import React from 'react';
import { 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers, 
  UserPlus, 
  UserCheck, 
  ShieldCheck, 
  Activity,
  Server,
  Calendar,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { TallyConnection, TallySyncLogEntry, TallyStagingContact } from '../../types';

interface SyncDashboardOverviewProps {
  connections: TallyConnection[];
  logs: TallySyncLogEntry[];
  stagingContacts: TallyStagingContact[];
  onTriggerSync: (connectionId?: string) => void;
  isSyncing: boolean;
  onOpenNewConnection: () => void;
  onSelectConnection: (conn: TallyConnection) => void;
}

export const SyncDashboardOverview: React.FC<SyncDashboardOverviewProps> = ({
  connections,
  logs,
  stagingContacts,
  onTriggerSync,
  isSyncing,
  onOpenNewConnection,
  onSelectConnection
}) => {
  // Aggregate metrics
  const activeConnectionsCount = connections.filter(c => c.status === 'ONLINE').length;
  const latestLog = logs[0];

  const totalRecordsFound = logs.reduce((acc, l) => acc + l.recordsFound, 0);
  const totalCreated = logs.reduce((acc, l) => acc + l.recordsCreated, 0);
  const totalUpdated = logs.reduce((acc, l) => acc + l.recordsUpdated, 0);
  const totalFailed = logs.reduce((acc, l) => acc + l.recordsFailed, 0);

  const pendingStagingCount = stagingContacts.filter(s => s.processingStatus === 'PENDING').length;
  const failedStagingCount = stagingContacts.filter(s => s.processingStatus === 'FAILED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Alert / Info */}
      <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-transparent border border-amber-200/80 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                TallyPrime Enterprise Connector Mesh
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Agent TLS 1.3 Active
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Synchronizing customer ledgers from on-premise Tally installations into centralized CRM contacts via the lightweight Windows agent. Direct internet exposure to Tally ports is permanently blocked.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            onClick={() => onTriggerSync()}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing Mesh...' : 'Sync All Active (Full)'}</span>
          </button>
        </div>
      </div>

      {/* 6 Key Sync Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Last Sync */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Last Sync</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-sm font-bold text-slate-900 truncate">
              {latestLog ? new Date(latestLog.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>{latestLog?.status === 'SUCCESS' ? 'Success' : 'Verified'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Records Found */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Records Found</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-black text-slate-900">
              {totalRecordsFound.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Across {connections.length} gateways
            </div>
          </div>
        </div>

        {/* Card 3: New Contacts */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">New Contacts</span>
            <UserPlus className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-black text-emerald-600">
              +{totalCreated.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Created in Master DB
            </div>
          </div>
        </div>

        {/* Card 4: Updated Contacts */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Updated / Enriched</span>
            <UserCheck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-black text-sky-700">
              {totalUpdated.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Balances & GSTIN synced
            </div>
          </div>
        </div>

        {/* Card 5: Failed Records */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Failed Records</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <div className={`text-lg font-black ${totalFailed > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {totalFailed}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {failedStagingCount} in error review
            </div>
          </div>
        </div>

        {/* Card 6: Next Scheduled Sync */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Next Scheduled</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-sm font-bold text-slate-900 truncate">
              {connections[0]?.nextScheduledSync ? new Date(connections[0].nextScheduledSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Every 6 hrs'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Cron Scheduler On</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Status Cards & Recent Executions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configured Gateways Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Connected Tally Installations ({connections.length})
              </h4>
              <p className="text-xs text-slate-500">
                {activeConnectionsCount} of {connections.length} gateways communicating through local connector agents
              </p>
            </div>
            <button
              onClick={onOpenNewConnection}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer"
            >
              + Add Tally Connection
            </button>
          </div>

          <div className="space-y-3">
            {connections.map((conn) => (
              <div 
                key={conn.id}
                onClick={() => onSelectConnection(conn)}
                className="p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/20 transition cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl mt-0.5 ${
                    conn.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                    conn.status === 'SYNCING' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                    'bg-rose-50 text-rose-600 border border-rose-200'
                  }`}>
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition">
                        {conn.name}
                      </h5>
                      <span className={`text-[10px] font-mono px-2 py-0.2 rounded font-semibold ${
                        conn.connectionType === 'ODBC' 
                          ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {conn.connectionType} Port {conn.port}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Company: <span className="font-semibold text-slate-700">{conn.tallyCompanyName}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 mt-2">
                      <span>Host: <strong className="font-mono text-slate-600">{conn.host}</strong></span>
                      <span>•</span>
                      <span>Agent: <strong className="font-mono text-slate-600">{conn.agentVersion || 'v2.4.2'}</strong></span>
                      <span>•</span>
                      <span>Last Sync: <strong className="text-slate-600">{conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleDateString() : 'N/A'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    conn.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    conn.status === 'SYNCING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      conn.status === 'ONLINE' ? 'bg-emerald-500' :
                      conn.status === 'SYNCING' ? 'bg-amber-500 animate-pulse' :
                      'bg-rose-500'
                    }`}></span>
                    {conn.status}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTriggerSync(conn.id);
                    }}
                    disabled={isSyncing}
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                    title="Run Sync Now"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <div className="text-slate-400 group-hover:text-amber-600 transition">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Staging Health & Security Architecture */}
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-2xl p-5 text-slate-200 border border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Local Agent Security
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                Zero Inbound Open Ports
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-[11px] pb-2 border-b border-slate-800/60">
                <span className="text-slate-400">Communication Mode:</span>
                <span className="font-semibold text-emerald-400">Outbound HTTPS TLS 1.3</span>
              </div>
              <div className="flex justify-between items-center text-[11px] pb-2 border-b border-slate-800/60">
                <span className="text-slate-400">Device Fingerprint:</span>
                <span className="font-mono text-slate-300">HMAC-SHA256 Signed</span>
              </div>
              <div className="flex justify-between items-center text-[11px] pb-2 border-b border-slate-800/60">
                <span className="text-slate-400">Token Rotation:</span>
                <span className="text-slate-300">Automated 30-Day Cycle</span>
              </div>
              <div className="flex justify-between items-center text-[11px] pb-2 border-b border-slate-800/60">
                <span className="text-slate-400">Incremental Tracking:</span>
                <span className="font-mono text-amber-300">Tally _AlterID &gt;= 148290</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Staging Buffer:</span>
                <span className="text-slate-300">{stagingContacts.length} total records cached</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[10px] text-slate-400 leading-relaxed font-mono">
              <span className="text-amber-400">🔒 Protection:</span> Customer firewall does not require port forwarding. The DIGISOFT connector service runs as a Windows background daemon and polls/pushes encrypted batches.
            </div>
          </div>

          {/* Quick Ledger Filter Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              Active Customer Filter
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {['Sundry Debtors', 'Customers', 'Dealers', 'Distributors'].map((grp) => (
                <span key={grp} className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                  ✓ {grp}
                </span>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              Excluded non-contact ledgers: <span className="font-medium text-slate-700">Cash, Bank Accounts, Duties & Taxes, Expenses</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
