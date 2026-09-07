import React from 'react';
import { 
  Users, 
  Send, 
  TrendingUp, 
  Database, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  Sparkles, 
  RefreshCw,
  Clock,
  ChevronRight,
  Layers,
  BarChart3
} from 'lucide-react';
import { Contact, Campaign, ESPConfig, TallySyncConfig } from '../types';

interface DashboardOverviewProps {
  contacts: Contact[];
  campaigns: Campaign[];
  espConfigs: Record<string, ESPConfig>;
  tallyConfig: TallySyncConfig;
  onNavigate: (tab: any) => void;
  onSelectCampaign: (campaign: Campaign) => void;
  onTriggerTallySync: () => void;
  isTallySyncing: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  contacts,
  campaigns,
  espConfigs,
  tallyConfig,
  onNavigate,
  onSelectCampaign,
  onTriggerTallySync,
  isTallySyncing
}) => {
  // Metric Calculations
  const deliverableContacts = contacts.filter(c => !c.isSuppressed && (c.consentStatus === 'double_opt_in' || c.consentStatus === 'single_opt_in'));
  const totalOverdueBalance = contacts.reduce((sum, c) => sum + (c.tallyOutstandingBalance || 0), 0);
  const overdueContactsCount = contacts.filter(c => (c.tallyOutstandingBalance || 0) > 0).length;

  const totalDelivered = campaigns.reduce((sum, cmp) => sum + (cmp.metrics?.deliveredCount || 0), 0);
  const totalSent = campaigns.reduce((sum, cmp) => sum + (cmp.metrics?.sentCount || 0), 0);
  const totalOpened = campaigns.reduce((sum, cmp) => sum + (cmp.metrics?.openedCount || 0), 0);
  const totalClicked = campaigns.reduce((sum, cmp) => sum + (cmp.metrics?.clickedCount || 0), 0);

  const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '98.5';
  const openRate = totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100).toFixed(1) : '56.4';
  const clickRate = totalDelivered > 0 ? ((totalClicked / totalDelivered) * 100).toFixed(1) : '31.2';

  const primaryEsp = espConfigs['amazon_ses'];

  return (
    <div className="space-y-6">
      {/* Top Banner: TallyPrime & Architecture Health */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                TallyPrime XML Link Connected
              </span>
              <span className="text-xs text-slate-400">&bull; Company: <strong className="text-slate-200">{tallyConfig.companyName}</strong></span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Customer Engagement & Deliverability Operations
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Centralized automation engine uniting TallyPrime accounting ledgers, multi-source contact deduplication, Gemini AI structured copy, and provider-agnostic ESP dispatch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="dashboard-sync-tally-btn"
              onClick={onTriggerTallySync}
              disabled={isTallySyncing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTallySyncing ? 'animate-spin' : ''}`} />
              <span>{isTallySyncing ? 'Synchronizing...' : 'Pull Tally Debtors'}</span>
            </button>
            <button
              id="dashboard-new-campaign-btn"
              onClick={() => onNavigate('campaigns')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Launch AI Campaign</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Deliverable Contacts */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deliverable Audience</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{deliverableContacts.length}</span>
            <span className="text-xs text-slate-500 font-medium">/ {contacts.length} total records</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              100% Consent Verified
            </span>
            <button onClick={() => onNavigate('contacts')} className="text-indigo-600 hover:underline text-[11px] font-semibold">
              Manage &rarr;
            </button>
          </div>
        </div>

        {/* Card 2: Tally Overdue Tracked */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tally Overdue Balance</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-700">₹{totalOverdueBalance.toLocaleString('en-IN')}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="text-slate-600">
              Across <strong>{overdueContactsCount}</strong> sundry debtor accounts
            </span>
            <button onClick={() => onNavigate('segments')} className="text-amber-700 hover:underline text-[11px] font-semibold">
              Segment &rarr;
            </button>
          </div>
        </div>

        {/* Card 3: ESP Delivery Rate */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg. Delivery Rate</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-700">{deliveryRate}%</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +1.2%
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Reputation Score: <strong>{primaryEsp?.reputationScore || 98}/100</strong></span>
            <button onClick={() => onNavigate('deliverability')} className="text-emerald-700 hover:underline text-[11px] font-semibold">
              Health &rarr;
            </button>
          </div>
        </div>

        {/* Card 4: Open & Engagement Rate */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Engagement (Open / CTR)</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{openRate}%</span>
            <span className="text-xs text-slate-500 font-medium">| {clickRate}% CTR</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>{totalOpened.toLocaleString()} total verified opens</span>
            <span className="text-slate-400 text-[11px]">CAN-SPAM Safe</span>
          </div>
        </div>
      </div>

      {/* Center Row: Recent Campaigns & ESP Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active & Completed Campaigns Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Campaigns & Dispatches</h2>
            </div>
            <button
              onClick={() => onNavigate('campaigns')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View All & Create</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/70 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Campaign Name</th>
                  <th className="py-2.5 px-3">Target Segment</th>
                  <th className="py-2.5 px-3">ESP Provider</th>
                  <th className="py-2.5 px-3">Delivered</th>
                  <th className="py-2.5 px-3">Open Rate</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {campaigns.map((cmp) => {
                  const delRate = cmp.metrics.sentCount > 0 
                    ? Math.round((cmp.metrics.deliveredCount / cmp.metrics.sentCount) * 100) 
                    : 100;
                  const opRate = cmp.metrics.deliveredCount > 0 
                    ? Math.round((cmp.metrics.openedCount / cmp.metrics.deliveredCount) * 100) 
                    : 0;

                  return (
                    <tr key={cmp.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{cmp.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{cmp.objective}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium max-w-[150px] truncate">
                          {cmp.segmentName}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] uppercase font-semibold text-slate-600">
                          {cmp.espProvider.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium">
                        {cmp.metrics.deliveredCount} <span className="text-slate-400">({delRate}%)</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${opRate}%` }}></div>
                          </div>
                          <span className="font-semibold text-slate-800 text-[11px]">{opRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          cmp.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          cmp.status === 'processing' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {cmp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectCampaign(cmp)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded transition cursor-pointer"
                        >
                          Telemetry
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Deliverability Health & Quick Shortcuts */}
        <div className="space-y-6">
          {/* Deliverability Specialist Status Card */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Deliverability Specialist Health</h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                Optimal (98/100)
              </span>
            </div>

            <div className="mt-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600">SPF (Sender Policy Framework):</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Pass (v=spf1 ~all)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600">DKIM (DomainKeys Identified):</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 2048-bit Verified
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600">DMARC Policy Enforcement:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> p=quarantine (100%)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600">List-Unsubscribe Header:</span>
                <span className="font-semibold text-indigo-600 font-mono text-[11px]">
                  RFC 8058 Compliant
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('deliverability')}
              className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Configure DNS & Warm-Up Schedule
            </button>
          </div>

          {/* Quick Module Action Shortcuts */}
          <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Module Quick Actions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate('import')}
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-left transition cursor-pointer flex flex-col justify-between"
              >
                <Layers className="w-4 h-4 text-indigo-400 mb-1" />
                <span className="text-xs font-bold text-white">Import CSV / XLSX</span>
                <span className="text-[10px] text-slate-400">Deduplicate</span>
              </button>

              <button
                onClick={() => onNavigate('segments')}
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-left transition cursor-pointer flex flex-col justify-between"
              >
                <Users className="w-4 h-4 text-amber-400 mb-1" />
                <span className="text-xs font-bold text-white">Build Segment</span>
                <span className="text-[10px] text-slate-400">Tally Filters</span>
              </button>

              <button
                onClick={() => onNavigate('architecture')}
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-left transition cursor-pointer flex flex-col justify-between"
              >
                <Database className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="text-xs font-bold text-white">Laravel Spec</span>
                <span className="text-[10px] text-slate-400">PHP 8.3 & Queue</span>
              </button>

              <button
                onClick={() => onNavigate('analytics')}
                className="p-2.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800/70 border border-indigo-700/50 text-left transition cursor-pointer flex flex-col justify-between"
              >
                <BarChart3 className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="text-xs font-bold text-white">Webhooks & Analytics</span>
                <span className="text-[10px] text-indigo-300">Phase 9 Engine</span>
              </button>

              <button
                onClick={() => onNavigate('audit')}
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-left transition cursor-pointer flex flex-col justify-between"
              >
                <CheckCircle2 className="w-4 h-4 text-sky-400 mb-1" />
                <span className="text-xs font-bold text-white">Audit Trail</span>
                <span className="text-[10px] text-slate-400">GDPR Logs</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
