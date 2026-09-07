import React, { useState, useMemo } from 'react';
import { 
  Campaign, 
  Contact, 
  EmailEvent, 
  WebhookEndpointConfig, 
  WebhookIngestResult,
  ESPProviderType
} from '../../types';
import { 
  BarChart3, 
  Send, 
  CheckCircle2, 
  Eye, 
  MousePointerClick, 
  AlertOctagon, 
  AlertTriangle, 
  UserX, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Server, 
  Zap, 
  ShieldCheck, 
  Download, 
  Filter,
  Layers,
  ChevronDown
} from 'lucide-react';
import { DeliveryFunnel } from './DeliveryFunnel';
import { ActivityTimeline } from './ActivityTimeline';
import { SuppressionAutomationView } from './SuppressionAutomationView';
import { WebhookSimulator } from './WebhookSimulator';
import { WebhookEndpointSettings } from './WebhookEndpointSettings';
import { WebhookEventProcessor } from '../../services/webhooks/WebhookEventProcessor';

interface CampaignAnalyticsDashboardProps {
  campaigns: Campaign[];
  contacts: Contact[];
  events: EmailEvent[];
  webhookConfigs: WebhookEndpointConfig[];
  selectedCampaignId?: string | null;
  onSelectCampaign?: (id: string | null) => void;
  onDispatchWebhook: (params: {
    provider: ESPProviderType;
    payload: any;
    headers: Record<string, string>;
    signingSecret?: string;
    expectedToken?: string;
  }) => WebhookIngestResult;
  onUnsuppressContact?: (contactId: string, reason: string) => void;
}

export const CampaignAnalyticsDashboard: React.FC<CampaignAnalyticsDashboardProps> = ({
  campaigns,
  contacts,
  events,
  webhookConfigs,
  selectedCampaignId: initialCampaignId = null,
  onSelectCampaign,
  onDispatchWebhook,
  onUnsuppressContact
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'suppression' | 'simulator' | 'endpoints'>('overview');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(initialCampaignId);

  // Sync with prop if changed
  React.useEffect(() => {
    if (initialCampaignId !== undefined) {
      setSelectedCampaignId(initialCampaignId);
    }
  }, [initialCampaignId]);

  // Selected campaign or aggregate
  const activeCampaign = useMemo(() => {
    if (!selectedCampaignId) return null;
    return campaigns.find(c => c.id === selectedCampaignId) || null;
  }, [campaigns, selectedCampaignId]);

  // Aggregated or Campaign-specific metrics
  const displayMetrics = useMemo(() => {
    if (activeCampaign) {
      return activeCampaign.metrics;
    }
    // Compute aggregate metrics across all campaigns
    return campaigns.reduce(
      (acc, c) => ({
        totalRecipients: acc.totalRecipients + (c.metrics.totalRecipients || 0),
        sentCount: acc.sentCount + (c.metrics.sentCount || 0),
        deliveredCount: acc.deliveredCount + (c.metrics.deliveredCount || 0),
        openedCount: acc.openedCount + (c.metrics.openedCount || 0),
        clickedCount: acc.clickedCount + (c.metrics.clickedCount || 0),
        bouncedHardCount: acc.bouncedHardCount + (c.metrics.bouncedHardCount || 0),
        bouncedSoftCount: acc.bouncedSoftCount + (c.metrics.bouncedSoftCount || 0),
        complainedCount: acc.complainedCount + (c.metrics.complainedCount || 0),
        unsubscribedCount: acc.unsubscribedCount + (c.metrics.unsubscribedCount || 0)
      }),
      {
        totalRecipients: 0,
        sentCount: 0,
        deliveredCount: 0,
        openedCount: 0,
        clickedCount: 0,
        bouncedHardCount: 0,
        bouncedSoftCount: 0,
        complainedCount: 0,
        unsubscribedCount: 0
      }
    );
  }, [campaigns, activeCampaign]);

  // Calculated Rates
  const rates = useMemo(() => {
    return WebhookEventProcessor.calculateRates(displayMetrics);
  }, [displayMetrics]);

  // Calculated Funnel
  const funnelSteps = useMemo(() => {
    return WebhookEventProcessor.calculateDeliveryFunnel(displayMetrics);
  }, [displayMetrics]);

  // Filtered Events for Timeline
  const displayedEvents = useMemo(() => {
    if (!activeCampaign) return events;
    return events.filter(e => e.campaign_id === activeCampaign.id);
  }, [events, activeCampaign]);

  return (
    <div className="space-y-6">
      {/* Top Header & Campaign Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>Email Webhooks & Campaign Analytics</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
              Phase 9 Production
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time webhook ingestion, cryptographic signature validation, automated contact status suppression, and deliverability funnels.
          </p>
        </div>

        {/* Campaign Filter Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Scope:</label>
          <select
            value={selectedCampaignId || 'ALL'}
            onChange={(e) => {
              const val = e.target.value === 'ALL' ? null : e.target.value;
              setSelectedCampaignId(val);
              if (onSelectCampaign) onSelectCampaign(val);
            }}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[240px]"
          >
            <option value="ALL">🌐 All Campaigns (Global Aggregate)</option>
            {campaigns.map((cmp) => (
              <option key={cmp.id} value={cmp.id}>
                📧 {cmp.name} ({cmp.esp_provider?.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Delivery Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Delivery Rate</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono">
            {rates.deliveryRate}%
          </div>
          <div className="text-[11px] text-emerald-700 flex items-center gap-1 mt-1 font-medium">
            <span>{displayMetrics.deliveredCount} / {displayMetrics.sentCount} sent</span>
          </div>
        </div>

        {/* Open Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Open Rate</span>
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono">
            {rates.openRate}%
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
            <span>{displayMetrics.openedCount} opens</span>
          </div>
        </div>

        {/* Click Rate (CTR) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Click Rate (CTR)</span>
            <MousePointerClick className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono">
            {rates.clickRate}%
          </div>
          <div className="text-[11px] text-purple-700 flex items-center gap-1 mt-1 font-medium">
            <span>CTOR: {rates.ctor}%</span>
          </div>
        </div>

        {/* Bounce Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Bounce Rate</span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className={`text-xl font-extrabold font-mono ${rates.bounceRate > 5 ? 'text-rose-600' : 'text-slate-900'}`}>
            {rates.bounceRate}%
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
            <span>{displayMetrics.bouncedHardCount} hard &bull; {displayMetrics.bouncedSoftCount} soft</span>
          </div>
        </div>

        {/* Complaint Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Complaint Rate</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className={`text-xl font-extrabold font-mono ${rates.complaintRate >= 0.1 ? 'text-rose-600' : 'text-slate-900'}`}>
            {rates.complaintRate}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <span className={rates.complaintRate < 0.1 ? 'text-emerald-600' : 'text-rose-600'}>
              {rates.complaintRate < 0.1 ? 'Below 0.1% threshold' : 'Exceeds spam threshold!'}
            </span>
          </div>
        </div>

        {/* Unsubscribe Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Unsub Rate</span>
            <UserX className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono">
            {rates.unsubscribeRate}%
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
            <span>{displayMetrics.unsubscribedCount} opt-outs</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 px-3 border-b-2 transition cursor-pointer shrink-0 ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Delivery Funnel & Overview
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-2.5 px-3 border-b-2 transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === 'timeline'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Activity Timeline</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
            {displayedEvents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('suppression')}
          className={`pb-2.5 px-3 border-b-2 transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === 'suppression'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Contact Suppression Automation</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 font-bold">
            Hard Bounce / FBL / Unsub
          </span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`pb-2.5 px-3 border-b-2 transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === 'simulator'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Webhook Testing Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('endpoints')}
          className={`pb-2.5 px-3 border-b-2 transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === 'endpoints'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Server className="w-3.5 h-3.5 text-slate-500" />
          <span>Endpoints & Secrets</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & DELIVERY FUNNEL */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <DeliveryFunnel
            funnelSteps={funnelSteps}
            bouncedTotal={displayMetrics.bouncedHardCount + displayMetrics.bouncedSoftCount}
            complainedTotal={displayMetrics.complainedCount}
            unsubscribedTotal={displayMetrics.unsubscribedCount}
          />

          {/* Quick Preview of Recent Webhook Events */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Recent Webhook Feed</h4>
                <p className="text-xs text-slate-500">Last 5 verified delivery events received from ESP providers.</p>
              </div>
              <button
                onClick={() => setActiveTab('timeline')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                View Full Timeline ({displayedEvents.length}) &rarr;
              </button>
            </div>

            <div className="space-y-2">
              {displayedEvents.slice(0, 5).map((evt) => (
                <div key={evt.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      evt.event_type === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                      evt.event_type === 'OPENED' ? 'bg-indigo-100 text-indigo-800' :
                      evt.event_type === 'CLICKED' ? 'bg-purple-100 text-purple-800' :
                      evt.event_type === 'BOUNCED' ? 'bg-rose-100 text-rose-800' :
                      evt.event_type === 'COMPLAINED' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-200 text-slate-800'
                    }`}>
                      {evt.event_type}
                    </span>
                    <span className="font-medium text-slate-800">{evt.metadata.recipient_email}</span>
                    <span className="text-slate-400 font-mono text-[11px]">via {evt.provider.toUpperCase()}</span>
                  </div>

                  <span className="font-mono text-slate-500 text-[11px]">
                    {new Date(evt.event_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVITY TIMELINE */}
      {activeTab === 'timeline' && (
        <ActivityTimeline
          events={displayedEvents}
          campaigns={campaigns}
          contacts={contacts}
        />
      )}

      {/* TAB 3: CONTACT SUPPRESSION AUTOMATION */}
      {activeTab === 'suppression' && (
        <SuppressionAutomationView
          contacts={contacts}
          onUnsuppressContact={onUnsuppressContact}
        />
      )}

      {/* TAB 4: WEBHOOK TESTING STUDIO */}
      {activeTab === 'simulator' && (
        <WebhookSimulator
          campaigns={campaigns}
          contacts={contacts}
          onDispatchWebhook={onDispatchWebhook}
        />
      )}

      {/* TAB 5: ENDPOINTS & SECRETS */}
      {activeTab === 'endpoints' && (
        <WebhookEndpointSettings
          configs={webhookConfigs}
        />
      )}
    </div>
  );
};
