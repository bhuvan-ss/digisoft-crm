import React, { useState } from 'react';
import { 
  X, 
  Eye, 
  FileText, 
  Users, 
  Send, 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Smartphone, 
  Monitor, 
  Code,
  Tag,
  Mail,
  UserCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react';
import { Campaign, CampaignStatus, Contact, Segment } from '../types';
import { renderEmailTemplate } from '../utils/templateEngine';

interface CampaignDetailsModalProps {
  campaign: Campaign;
  allContacts: Contact[];
  allSegments: Segment[];
  onClose: () => void;
  onApprove?: (campaignId: string) => void;
  onDispatch?: (campaignId: string) => void;
  onPause?: (campaignId: string) => void;
  onResume?: (campaignId: string) => void;
  onCancel?: (campaignId: string) => void;
  onOpenTestModal?: (campaign: Campaign) => void;
}

export const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({
  campaign,
  allContacts,
  allSegments,
  onClose,
  onApprove,
  onDispatch,
  onPause,
  onResume,
  onCancel,
  onOpenTestModal
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'audience' | 'delivery' | 'analytics' | 'activity'>('overview');
  const [contentView, setContentView] = useState<'desktop' | 'mobile' | 'html' | 'text'>('desktop');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Helper badge for campaign status
  const getStatusBadge = (status: CampaignStatus) => {
    const s = String(status).toUpperCase();
    switch (s) {
      case 'DRAFT':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">DRAFT</span>;
      case 'REVIEW':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">UNDER REVIEW</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">APPROVED</span>;
      case 'SCHEDULED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">SCHEDULED</span>;
      case 'PROCESSING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>PROCESSING</span>;
      case 'PAUSED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">PAUSED</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />COMPLETED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">CANCELLED</span>;
      case 'FAILED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">FAILED</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  // Safe metrics calculations
  const total = campaign.metrics?.totalRecipients || 0;
  const sent = campaign.metrics?.sentCount || 0;
  const delivered = campaign.metrics?.deliveredCount || 0;
  const opened = campaign.metrics?.openedCount || 0;
  const clicked = campaign.metrics?.clickedCount || 0;
  const bounced = (campaign.metrics?.bouncedHardCount || 0) + (campaign.metrics?.bouncedSoftCount || 0);
  const unsubscribed = campaign.metrics?.unsubscribedCount || 0;

  const deliveryRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : '0.0';
  const openRate = delivered > 0 ? ((opened / delivered) * 100).toFixed(1) : '0.0';
  const clickRate = opened > 0 ? ((clicked / opened) * 100).toFixed(1) : '0.0';

  // Snapshot or mock snapshot list
  const snapshotList = campaign.recipients_snapshot || [];
  const filteredSnapshot = snapshotList.filter(r => {
    const matchesSearch = r.email.toLowerCase().includes(recipientSearch.toLowerCase()) ||
      (r.personalization_data?.first_name || '').toLowerCase().includes(recipientSearch.toLowerCase()) ||
      (r.personalization_data?.company_name || '').toLowerCase().includes(recipientSearch.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{campaign.name}</h2>
                {getStatusBadge(campaign.status)}
                <span className="px-2 py-0.5 text-xs rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                  {campaign.campaign_type || 'Promotional'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ID: <span className="font-mono text-slate-600">{campaign.id}</span> • Created by {campaign.created_by}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {String(campaign.status).toUpperCase() === 'REVIEW' && onApprove && (
              <button
                onClick={() => onApprove(campaign.id)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve Campaign
              </button>
            )}

            {String(campaign.status).toUpperCase() === 'APPROVED' && onDispatch && (
              <button
                onClick={() => onDispatch(campaign.id)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Send Immediately
              </button>
            )}

            {String(campaign.status).toUpperCase() === 'PROCESSING' && onPause && (
              <button
                onClick={() => onPause(campaign.id)}
                className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause
              </button>
            )}

            {String(campaign.status).toUpperCase() === 'PAUSED' && onResume && (
              <button
                onClick={() => onResume(campaign.id)}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <Play className="w-3.5 h-3.5" />
                Resume
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 6 Tabs Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white overflow-x-auto">
          {[
            { id: 'overview', label: '1. Overview', icon: Eye },
            { id: 'content', label: '2. Content', icon: FileText },
            { id: 'audience', label: '3. Audience Snapshot', icon: Users },
            { id: 'delivery', label: '4. Delivery & ESP', icon: Send },
            { id: 'analytics', label: '5. Analytics', icon: BarChart3 },
            { id: 'activity', label: '6. Activity Log', icon: Clock },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Quick Metric Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="text-xs font-medium text-slate-500">Total Recipients</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{total.toLocaleString()}</div>
                  <div className="text-xs text-slate-400 mt-1">Snapshot Audience</div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="text-xs font-medium text-slate-500">Delivery Rate</div>
                  <div className="text-xl font-bold text-emerald-600 mt-1">{deliveryRate}%</div>
                  <div className="text-xs text-slate-400 mt-1">{delivered} delivered</div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="text-xs font-medium text-slate-500">Open Rate</div>
                  <div className="text-xl font-bold text-indigo-600 mt-1">{openRate}%</div>
                  <div className="text-xs text-slate-400 mt-1">{opened} unique opens</div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="text-xs font-medium text-slate-500">Click Rate</div>
                  <div className="text-xl font-bold text-blue-600 mt-1">{clickRate}%</div>
                  <div className="text-xs text-slate-400 mt-1">{clicked} link clicks</div>
                </div>
              </div>

              {/* Campaign Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b pb-2">
                    Campaign Specifications
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Campaign Type:</span>
                      <span className="font-medium text-slate-900">{campaign.campaign_type || 'Promotional'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sender (From):</span>
                      <span className="font-medium text-slate-900">{campaign.from_name} &lt;{campaign.from_email}&gt;</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reply-To Address:</span>
                      <span className="font-medium text-slate-900">{campaign.reply_to || 'None configured'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Template ID:</span>
                      <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {campaign.email_template_id || campaign.templateId || 'Standard Custom'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ESP Provider:</span>
                      <span className="font-medium text-slate-900 uppercase">{campaign.esp_provider || campaign.espProvider || 'amazon_ses'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b pb-2">
                    Lifecycle & Governance
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Workflow Status:</span>
                      <div>{getStatusBadge(campaign.status)}</div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Created By:</span>
                      <span className="font-medium text-slate-900">{campaign.created_by}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Approved By:</span>
                      <span className="font-medium text-slate-900">{campaign.approved_by || 'Pending Manager Sign-off'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Scheduled At:</span>
                      <span className="font-medium text-slate-900">
                        {campaign.scheduled_at || campaign.scheduledAt ? new Date(campaign.scheduled_at || campaign.scheduledAt!).toLocaleString() : 'Not Scheduled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Completed At:</span>
                      <span className="font-medium text-slate-900">
                        {campaign.completed_at || campaign.completedAt ? new Date(campaign.completed_at || campaign.completedAt!).toLocaleString() : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject & Preheader Preview Card */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Subject & Snippet</div>
                <div className="text-base font-bold text-slate-900">{campaign.subject}</div>
                <div className="text-sm text-slate-600">{campaign.preheader || 'No preheader defined.'}</div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTENT */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setContentView('desktop')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                      contentView === 'desktop' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" /> Desktop
                  </button>
                  <button
                    onClick={() => setContentView('mobile')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                      contentView === 'mobile' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Mobile (375px)
                  </button>
                  <button
                    onClick={() => setContentView('html')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                      contentView === 'html' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" /> HTML Source
                  </button>
                  <button
                    onClick={() => setContentView('text')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                      contentView === 'text' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Plain Text
                  </button>
                </div>

                <div className="text-xs text-slate-500">
                  Subject: <span className="font-semibold text-slate-800">{campaign.subject}</span>
                </div>
              </div>

              {/* Rendered Preview Box */}
              <div className="bg-slate-200/70 p-6 rounded-xl flex justify-center items-start min-h-[420px] overflow-auto">
                {contentView === 'desktop' && (
                  <div className="w-[620px] bg-white rounded-lg shadow-md border border-slate-300 p-6">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: campaign.html_content || '<p>No content generated</p>' 
                      }} 
                    />
                  </div>
                )}

                {contentView === 'mobile' && (
                  <div className="w-[375px] bg-white rounded-2xl shadow-xl border-4 border-slate-700 p-4 min-h-[500px]">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: campaign.html_content || '<p>No content generated</p>' 
                      }} 
                    />
                  </div>
                )}

                {contentView === 'html' && (
                  <div className="w-full bg-slate-900 text-emerald-400 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-[480px]">
                    <pre>{campaign.html_content}</pre>
                  </div>
                )}

                {contentView === 'text' && (
                  <div className="w-full bg-white text-slate-800 p-6 rounded-lg font-mono text-xs border border-slate-200 whitespace-pre-wrap max-h-[480px] overflow-y-auto">
                    {campaign.plain_text_content || 'No plain text alternative generated.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AUDIENCE */}
          {activeTab === 'audience' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Audience Type: {campaign.audience?.type ? campaign.audience.type.toUpperCase() : 'SEGMENT'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {campaign.audience?.segmentName || (campaign.audience?.tags && `Tags: ${campaign.audience.tags.join(', ')}`) || 'Default Audience'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {snapshotList.length > 0 ? `${snapshotList.length} Frozen Recipients` : 'Live Preview Audience'}
                  </span>
                </div>
              </div>

              {/* Snapshot Recipient Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <input
                  type="text"
                  placeholder="Search snapshot by email, contact name, company..."
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  className="w-full sm:w-80 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-slate-500">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="QUEUED">QUEUED</option>
                    <option value="SENT">SENT</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="OPENED">OPENED</option>
                    <option value="CLICKED">CLICKED</option>
                    <option value="EXCLUDED">EXCLUDED</option>
                  </select>
                </div>
              </div>

              {/* Snapshot Table */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="px-4 py-3">Recipient Email</th>
                      <th className="px-4 py-3">Contact Name</th>
                      <th className="px-4 py-3">Company / Ledger</th>
                      <th className="px-4 py-3">Snapshot Status</th>
                      <th className="px-4 py-3">Exclusion Reason / Event</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSnapshot.length > 0 ? (
                      filteredSnapshot.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-medium text-slate-900">{item.email}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.personalization_data?.first_name || ''} {item.personalization_data?.last_name || ''}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.personalization_data?.company_name || 'Individual'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              item.status === 'DELIVERED' || item.status === 'SENT' ? 'bg-emerald-50 text-emerald-700' :
                              item.status === 'OPENED' ? 'bg-indigo-50 text-indigo-700' :
                              item.status === 'CLICKED' ? 'bg-blue-50 text-blue-700' :
                              item.status === 'EXCLUDED' ? 'bg-rose-50 text-rose-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {item.exclusion_reason ? (
                              <span className="text-rose-600 font-medium">{item.exclusion_reason}</span>
                            ) : item.opened_at ? (
                              `Opened: ${new Date(item.opened_at).toLocaleTimeString()}`
                            ) : (
                              'Eligible for transmission'
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          No snapshot entries found. Recipient snapshot will be frozen automatically upon campaign approval.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: DELIVERY */}
          {activeTab === 'delivery' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <div className="text-xs font-medium text-slate-500">ESP Provider</div>
                  <div className="text-lg font-bold text-slate-900 mt-1 uppercase">
                    {campaign.esp_provider || campaign.espProvider || 'Amazon SES'}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Multi-ESP Smart Fallback Enabled</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <div className="text-xs font-medium text-slate-500">Chunk Size</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {campaign.chunk_size || campaign.chunkSize || 500} emails/batch
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Horizon parallel worker chunks</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <div className="text-xs font-medium text-slate-500">Rate Limit Throttle</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {campaign.rate_limit_per_second || campaign.rateLimitPerSecond || 50} msg/sec
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Sender reputation protection</div>
                </div>
              </div>

              {/* Delivery Progress Bar */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-700">Dispatch Queue Progress</span>
                  <span className="text-indigo-600">{deliveryRate}% Completed</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${deliveryRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Delivered: {delivered}</span>
                  <span>Bounced: {bounced}</span>
                  <span>Total Target: {total}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="text-xs font-medium text-slate-500">Delivered Count</div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">{delivered}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{deliveryRate}% delivery rate</div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="text-xs font-medium text-slate-500">Unique Opens</div>
                  <div className="text-2xl font-bold text-indigo-600 mt-1">{opened}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{openRate}% open rate</div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="text-xs font-medium text-slate-500">Unique Clicks</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">{clicked}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{clickRate}% click rate</div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="text-xs font-medium text-slate-500">Hard / Soft Bounces</div>
                  <div className="text-2xl font-bold text-rose-600 mt-1">{bounced}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Unsubscribed: {unsubscribed}</div>
                </div>
              </div>

              {/* Conversion Funnel */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Telemetry Engagement Funnel
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>1. Total Sent ({total})</span>
                      <span>100%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-slate-700 h-full w-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>2. Delivered to Inbox ({delivered})</span>
                      <span>{deliveryRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${deliveryRate}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>3. Opened ({opened})</span>
                      <span>{openRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full" style={{ width: `${openRate}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>4. Clicked Link ({clicked})</span>
                      <span>{clickRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full" style={{ width: `${clickRate}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ACTIVITY LOG */}
          {activeTab === 'activity' && (
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                Audit Trail & State Machine Transitions
              </h3>
              
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                {(campaign.activity_log && campaign.activity_log.length > 0 ? campaign.activity_log : [
                  {
                    id: 'act-init',
                    timestamp: campaign.created_at || new Date().toISOString(),
                    action: 'Campaign Created',
                    user: campaign.created_by,
                    details: 'Draft initialized in Campaign Studio'
                  }
                ]).map((log, idx) => (
                  <div key={log.id || idx} className="ml-6 relative">
                    <span className="absolute -left-[31px] top-0.5 bg-indigo-600 text-white p-1 rounded-full ring-4 ring-white">
                      <Clock className="w-3 h-3" />
                    </span>
                    <div className="text-xs font-bold text-slate-900">{log.action}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {new Date(log.timestamp).toLocaleString()} • By <span className="font-semibold text-slate-700">{log.user}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2.5 rounded border border-slate-100">
                      {log.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <div>
            Last updated: {new Date(campaign.updated_at || campaign.created_at || Date.now()).toLocaleDateString()}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
};
