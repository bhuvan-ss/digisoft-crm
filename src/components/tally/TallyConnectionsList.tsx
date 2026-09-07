import React, { useState } from 'react';
import { 
  Server, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink, 
  Plus, 
  Search, 
  MoreVertical,
  Activity,
  Shield,
  Trash2,
  Edit3,
  Terminal,
  Zap,
  Check
} from 'lucide-react';
import { TallyConnection } from '../../types';

interface TallyConnectionsListProps {
  connections: TallyConnection[];
  onSelectConnection: (conn: TallyConnection) => void;
  onOpenAddModal: () => void;
  onTriggerSync: (connectionId: string) => void;
  isSyncing: boolean;
  onDeleteConnection: (connectionId: string) => void;
}

export const TallyConnectionsList: React.FC<TallyConnectionsListProps> = ({
  connections,
  onSelectConnection,
  onOpenAddModal,
  onTriggerSync,
  isSyncing,
  onDeleteConnection
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testSuccessId, setTestSuccessId] = useState<string | null>(null);

  const filteredConnections = connections.filter(conn => 
    conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conn.tallyCompanyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conn.host.includes(searchQuery)
  );

  const handleTestConnection = (e: React.MouseEvent, connId: string) => {
    e.stopPropagation();
    setTestingId(connId);
    setTestSuccessId(null);
    setTimeout(() => {
      setTestingId(null);
      setTestSuccessId(connId);
      setTimeout(() => setTestSuccessId(null), 3000);
    }, 750);
  };

  return (
    <div className="space-y-4">
      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search connections by name, company, or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Connection</span>
          </button>
        </div>
      </div>

      {/* Connections Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Connection Name & Protocol</th>
                <th className="py-3 px-4">Tally Company</th>
                <th className="py-3 px-3">Connection Type</th>
                <th className="py-3 px-3">Gateway Status</th>
                <th className="py-3 px-3">Last Sync</th>
                <th className="py-3 px-3">Schedule</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredConnections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No Tally connections found matching your search.
                  </td>
                </tr>
              ) : (
                filteredConnections.map((conn) => (
                  <tr 
                    key={conn.id} 
                    onClick={() => onSelectConnection(conn)}
                    className="hover:bg-amber-50/20 transition cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${
                          conn.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                          conn.status === 'SYNCING' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                          'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}>
                          <Server className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-amber-700 transition">
                            {conn.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            {conn.host}:{conn.port}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 max-w-[200px] truncate" title={conn.tallyCompanyName}>
                        {conn.tallyCompanyName}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {conn.customerGroups.length} Active Groups Filtered
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        conn.connectionType === 'ODBC' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {conn.connectionType === 'ODBC' ? 'ODBC 64-bit' : 'XML / HTTP API'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
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
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Never'}
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {conn.syncSchedule.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleTestConnection(e, conn.id)}
                          disabled={testingId === conn.id}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Test Port Connection"
                        >
                          {testingId === conn.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-amber-600 inline" />
                          ) : testSuccessId === conn.id ? (
                            <Check className="w-3 h-3 text-emerald-600 inline" />
                          ) : (
                            'Test'
                          )}
                        </button>

                        <button
                          onClick={() => onTriggerSync(conn.id)}
                          disabled={isSyncing}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition"
                          title="Trigger Contact Sync"
                        >
                          <RefreshCw className={`w-3 h-3 inline mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                          Sync
                        </button>

                        <button
                          onClick={() => onSelectConnection(conn)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          title="View Connection Details & Tabs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteConnection(conn.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Connection"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
