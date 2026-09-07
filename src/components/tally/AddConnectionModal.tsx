import React, { useState } from 'react';
import { 
  X, 
  Server, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw,
  Terminal,
  Database,
  ArrowRight
} from 'lucide-react';
import { TallyConnection, TallyConnectionType, TallySyncSchedule } from '../../types';
import { TALLY_GROUP_SUGGESTIONS, TALLY_EXCLUDED_GROUP_SUGGESTIONS } from '../../data/tallyData';

interface AddConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddConnection: (newConn: TallyConnection) => void;
}

export const AddConnectionModal: React.FC<AddConnectionModalProps> = ({
  isOpen,
  onClose,
  onAddConnection
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [connectionType, setConnectionType] = useState<TallyConnectionType>('ODBC');
  const [host, setHost] = useState('192.168.1.100');
  const [port, setPort] = useState(9000);
  const [databaseName, setDatabaseName] = useState('TallyODBC64_9000');
  const [tallyCompanyName, setTallyCompanyName] = useState('');
  const [syncSchedule, setSyncSchedule] = useState<TallySyncSchedule>('EVERY_6_HOURS');
  
  // Ledger Group Filtering
  const [customerGroups, setCustomerGroups] = useState<string[]>([
    'Sundry Debtors',
    'Customers',
    'Dealers',
    'Distributors'
  ]);
  const [excludedGroups, setExcludedGroups] = useState<string[]>([
    'Cash',
    'Bank Accounts',
    'Expenses',
    'Income',
    'Duties & Taxes',
    'Internal Ledgers'
  ]);

  // Generated Agent Token
  const [generatedToken] = useState(() => `dgtly_agt_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latency: number } | null>(null);

  if (!isOpen) return null;

  const handleToggleGroup = (group: string) => {
    if (customerGroups.includes(group)) {
      setCustomerGroups(customerGroups.filter(g => g !== group));
    } else {
      setCustomerGroups([...customerGroups, group]);
    }
  };

  const handleToggleExclude = (group: string) => {
    if (excludedGroups.includes(group)) {
      setExcludedGroups(excludedGroups.filter(g => g !== group));
    } else {
      setExcludedGroups([...excludedGroups, group]);
    }
  };

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTesting(false);
      setTestResult({
        success: true,
        latency: Math.floor(Math.random() * 30) + 25
      });
    }, 700);
  };

  const handleSave = () => {
    if (!name || !tallyCompanyName) return;

    const newConn: TallyConnection = {
      id: `TCONN-${Date.now().toString().slice(-4)}`,
      name,
      companyId: 'COMP-101',
      connectionType,
      host,
      port,
      databaseName: connectionType === 'ODBC' ? databaseName : undefined,
      tallyCompanyName,
      status: 'ONLINE',
      syncSchedule,
      customerGroups,
      excludedGroups,
      deviceFingerprint: `WIN-SRV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      agentVersion: 'v2.4.2-win64',
      lastHeartbeatAt: new Date().toISOString(),
      apiTokenMasked: `${generatedToken.substring(0, 14)}************${generatedToken.slice(-4)}`,
      lastAlterId: 1000,
      totalLedgersCount: 0,
      createdBy: 'Bhuvan Gupta',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onAddConnection(newConn);
    onClose();
  };

  const copyToken = () => {
    navigator.clipboard.writeText(generatedToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Register New TallyPrime Gateway Connection
              </h3>
              <p className="text-[11px] text-slate-500">
                Step {step} of 3: {step === 1 ? 'Connection Parameters' : step === 2 ? 'Ledger Filtering Rules' : 'Agent Installation & Security'}
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
          {/* STEP 1: Basic Parameters */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Connection Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Headquarters Tally Gateway (Factory 1)"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Connector Architecture
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConnectionType('ODBC')}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        connectionType === 'ODBC'
                          ? 'border-amber-500 bg-amber-50/50 text-amber-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-semibold text-xs">Tally ODBC</div>
                      <div className="text-[10px] text-slate-400">SQL DSN Query</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConnectionType('XML_HTTP')}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        connectionType === 'XML_HTTP'
                          ? 'border-amber-500 bg-amber-50/50 text-amber-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-semibold text-xs">Tally XML / HTTP</div>
                      <div className="text-[10px] text-slate-400">Port 9000 Envelopes</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Sync Schedule Frequency
                  </label>
                  <select
                    value={syncSchedule}
                    onChange={(e) => setSyncSchedule(e.target.value as TallySyncSchedule)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="EVERY_6_HOURS">Every 6 Hours (Recommended)</option>
                    <option value="EVERY_12_HOURS">Every 12 Hours</option>
                    <option value="DAILY">Daily (At 06:00 AM)</option>
                    <option value="MANUAL">Manual On-Demand Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Tally Server Local Host / IP
                  </label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="127.0.0.1 or LAN IP"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Local machine address accessible by DIGISOFT Connector Agent.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(parseInt(e.target.value) || 9000)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Default port configured in Tally F12: Advanced Configuration.
                  </span>
                </div>

                {connectionType === 'ODBC' && (
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-800 mb-1">
                      ODBC System DSN Name
                    </label>
                    <input
                      type="text"
                      value={databaseName}
                      onChange={(e) => setDatabaseName(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Tally Company Exact Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tallyCompanyName}
                    onChange={(e) => setTallyCompanyName(e.target.value)}
                    placeholder="e.g. DIGISOFT Technologies (P) Ltd (2025-2026)"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Must match the active company currently loaded in TallyPrime.
                  </span>
                </div>
              </div>

              {/* Ping Test Bar */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="text-[11px] text-slate-600">
                  Verify network reachability from local connector to Tally gateway:
                </div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin text-amber-600' : ''}`} />
                  <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>

              {testResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-[11px]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Successfully reached Tally Gateway at <strong>{host}:{port}</strong> in <strong>{testResult.latency}ms</strong>.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Ledger Group Filtering */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                <strong>Customer Filtering Guarantee:</strong> Only valid business contacts will be synchronized into the centralized master database. All internal accounting ledgers (Cash, Bank, Taxes, Expenses) will be discarded automatically.
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-2">
                  Include Customer Ledger Groups (Whitelisted)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TALLY_GROUP_SUGGESTIONS.map((grp) => {
                    const isChecked = customerGroups.includes(grp);
                    return (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => handleToggleGroup(grp)}
                        className={`p-2 rounded-xl border text-left flex items-center justify-between text-xs transition cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-50/60 border-indigo-300 text-indigo-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{grp}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-900 mb-2">
                  Permanently Excluded Non-Contact Groups (Blacklisted)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TALLY_EXCLUDED_GROUP_SUGGESTIONS.map((grp) => {
                    const isExcluded = excludedGroups.includes(grp);
                    return (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => handleToggleExclude(grp)}
                        className={`p-2 rounded-xl border text-left flex items-center justify-between text-xs transition cursor-pointer ${
                          isExcluded
                            ? 'bg-rose-50/60 border-rose-300 text-rose-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{grp}</span>
                        {isExcluded && <span className="text-[10px] text-rose-600 font-mono font-bold">EXCLUDED</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Agent Token & Security */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-900 rounded-xl text-slate-200 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Dedicated Agent Authentication Token
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">AES-256-GCM Ingestion</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg flex items-center justify-between font-mono text-xs text-amber-300 border border-slate-800">
                  <span className="truncate mr-2">{generatedToken}</span>
                  <button
                    type="button"
                    onClick={copyToken}
                    className="p-1 hover:text-white transition"
                    title="Copy API Token"
                  >
                    {copiedToken ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  This token is embedded into the local Windows service agent. The agent uses this token to sign outbound HTTPS requests with HMAC-SHA256.
                </p>
              </div>

              {/* Windows Agent CLI Installer Snippet */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-800 text-xs">
                  Windows PowerShell Connector Agent Setup (Run on Tally PC as Administrator):
                </label>
                <div className="p-3 bg-slate-900 text-slate-300 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                  <span className="text-slate-500"># 1. Download & register connector daemon</span>
                  <br />
                  <span className="text-emerald-400">iwr</span> -useb https://api.digisoft.com/tally/agent/install.ps1 | <span className="text-emerald-400">iex</span>
                  <br />
                  <span className="text-slate-500"># 2. Authenticate service with cloud endpoint</span>
                  <br />
                  .\digisoft-tally-agent.exe register --token="{generatedToken}" --port={port} --company="{tallyCompanyName || 'My Tally Company'}"
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev - 1) as any)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 && (!name || !tallyCompanyName)}
              onClick={() => setStep((prev) => (prev + 1) as any)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <span>Next: {step === 1 ? 'Ledger Filtering' : 'Agent Credentials'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
            >
              Save & Register Connection
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
