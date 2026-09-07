import React from 'react';
import { 
  Mail, 
  Database, 
  Send, 
  Users, 
  Filter, 
  ShieldCheck, 
  FileText, 
  Terminal, 
  RefreshCw, 
  Inbox, 
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
  Cpu,
  Bot,
  BarChart3
} from 'lucide-react';

export type NavigationTab = 
  | 'dashboard' 
  | 'contacts' 
  | 'tally' 
  | 'import' 
  | 'segments' 
  | 'templates'
  | 'campaigns' 
  | 'analytics'
  | 'ai-assistant'
  | 'deliverability' 
  | 'audit' 
  | 'architecture';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenTestInbox: () => void;
  onTriggerTallySync: () => void;
  isTallySyncing: boolean;
  unreadTestEmailsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenTestInbox,
  onTriggerTallySync,
  isTallySyncing,
  unreadTestEmailsCount
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      {/* Top Utility Ribbon */}
      <div className="px-4 py-1.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-300">TallyPrime Connector:</span>
            <span className="text-emerald-400 font-mono">127.0.0.1:9000 (Sundry Debtors)</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="hidden sm:flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Horizon Queues:</span>
            <span className="text-indigo-300 font-mono">4 Workers Active</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <div className="hidden md:flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active ESP:</span>
            <span className="text-slate-200 font-medium">Amazon SES (Reputation: 98%)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="nav-quick-sync-btn"
            onClick={onTriggerTallySync}
            disabled={isTallySyncing}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition disabled:opacity-50 cursor-pointer text-xs"
            title="Trigger fast incremental TallyPrime ledger balance pull"
          >
            <RefreshCw className={`w-3 h-3 text-amber-400 ${isTallySyncing ? 'animate-spin' : ''}`} />
            <span>{isTallySyncing ? 'Syncing...' : 'Sync Tally'}</span>
          </button>

          <button
            id="nav-virtual-inbox-btn"
            onClick={onOpenTestInbox}
            className="relative flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-indigo-900/50 hover:bg-indigo-800/60 text-indigo-200 border border-indigo-700/50 transition cursor-pointer text-xs"
          >
            <Inbox className="w-3 h-3 text-indigo-300" />
            <span>Virtual Test Inbox</span>
            {unreadTestEmailsCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold leading-none text-white bg-indigo-600 rounded-full">
                {unreadTestEmailsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main App Bar */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 via-blue-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white font-['Plus_Jakarta_Sans']">
                DIGISOFT <span className="text-indigo-400 font-semibold">CRM</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                CAMPAIGN AUTOMATION
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              TallyPrime Synced &bull; Multi-Source Import &bull; AI Copy Studio &bull; Multi-ESP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 text-xs bg-slate-800/60 border border-slate-700/70 rounded-md px-2.5 py-1 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Gemini 3.8 AI Assistant</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </div>

          <button
            id="tab-architecture-header-btn"
            onClick={() => onSelectTab('architecture')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition cursor-pointer ${
              currentTab === 'architecture'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-slate-800/80 hover:bg-slate-800 text-amber-300 border-amber-500/30'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Laravel 12 Code Spec</span>
            <span className="sm:hidden">Laravel</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="px-4 sm:px-6 flex items-center gap-1 overflow-x-auto scrollbar-none border-t border-slate-800/60 text-xs">
        <NavButton 
          id="tab-btn-dashboard"
          active={currentTab === 'dashboard'} 
          onClick={() => onSelectTab('dashboard')} 
          icon={<Activity className="w-3.5 h-3.5" />} 
          label="Dashboard" 
        />
        <NavButton 
          id="tab-btn-contacts"
          active={currentTab === 'contacts'} 
          onClick={() => onSelectTab('contacts')} 
          icon={<Users className="w-3.5 h-3.5" />} 
          label="Contacts & Companies" 
        />
        <NavButton 
          id="tab-btn-tally"
          active={currentTab === 'tally'} 
          onClick={() => onSelectTab('tally')} 
          icon={<Database className="w-3.5 h-3.5 text-amber-400" />} 
          label="TallyPrime Sync" 
          badge="Live XML"
        />
        <NavButton 
          id="tab-btn-import"
          active={currentTab === 'import'} 
          onClick={() => onSelectTab('import')} 
          icon={<Layers className="w-3.5 h-3.5" />} 
          label="Import & Deduplication" 
        />
        <NavButton 
          id="tab-btn-segments"
          active={currentTab === 'segments'} 
          onClick={() => onSelectTab('segments')} 
          icon={<Filter className="w-3.5 h-3.5" />} 
          label="Dynamic Segments" 
        />
        <NavButton 
          id="tab-btn-templates"
          active={currentTab === 'templates'} 
          onClick={() => onSelectTab('templates')} 
          icon={<FileText className="w-3.5 h-3.5 text-cyan-400" />} 
          label="Email Templates" 
          badge="600px Table"
        />
        <NavButton 
          id="tab-btn-campaigns"
          active={currentTab === 'campaigns'} 
          onClick={() => onSelectTab('campaigns')} 
          icon={<Mail className="w-3.5 h-3.5 text-indigo-400" />} 
          label="Campaign Studio & AI" 
          badge="AI Wizard"
        />
        <NavButton 
          id="tab-btn-analytics"
          active={currentTab === 'analytics'} 
          onClick={() => onSelectTab('analytics')} 
          icon={<BarChart3 className="w-3.5 h-3.5 text-emerald-400" />} 
          label="Webhooks & Analytics" 
          badge="Funnel"
        />
        <NavButton 
          id="tab-btn-ai-assistant"
          active={currentTab === 'ai-assistant'} 
          onClick={() => onSelectTab('ai-assistant')} 
          icon={<Bot className="w-3.5 h-3.5 text-indigo-300" />} 
          label="AI Content Assistant"
        />
        <NavButton 
          id="tab-btn-deliverability"
          active={currentTab === 'deliverability'} 
          onClick={() => onSelectTab('deliverability')} 
          icon={<ShieldCheck className="w-3.5 h-3.5" />} 
          label="ESP & Deliverability" 
        />
        <NavButton 
          id="tab-btn-audit"
          active={currentTab === 'audit'} 
          onClick={() => onSelectTab('audit')} 
          icon={<FileText className="w-3.5 h-3.5" />} 
          label="Audit & Compliance" 
        />
        <NavButton 
          id="tab-btn-architecture"
          active={currentTab === 'architecture'} 
          onClick={() => onSelectTab('architecture')} 
          icon={<Terminal className="w-3.5 h-3.5 text-amber-400" />} 
          label="PHP 8.3 / Laravel Architecture" 
        />
      </div>
    </header>
  );
};

interface NavButtonProps {
  id: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

const NavButton: React.FC<NavButtonProps> = ({ id, active, onClick, icon, label, badge }) => (
  <button
    id={id}
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-2.5 font-medium whitespace-nowrap transition-all border-b-2 cursor-pointer ${
      active
        ? 'border-indigo-500 text-white font-semibold bg-slate-800/40'
        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
    }`}
  >
    {icon}
    <span>{label}</span>
    {badge && (
      <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
        {badge}
      </span>
    )}
  </button>
);
