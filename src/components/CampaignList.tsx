import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Send, 
  Pause, 
  Play, 
  XCircle, 
  Mail, 
  BarChart2, 
  Users, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Campaign, CampaignStatus, CampaignType } from '../types';

interface CampaignListProps {
  campaigns: Campaign[];
  onSelectCampaign: (campaign: Campaign) => void;
  onNewCampaign: () => void;
  onApproveCampaign?: (campaignId: string) => void;
  onDispatchCampaign?: (campaignId: string) => void;
  onPauseCampaign?: (campaignId: string) => void;
  onResumeCampaign?: (campaignId: string) => void;
}

export const CampaignList: React.FC<CampaignListProps> = ({
  campaigns,
  onSelectCampaign,
  onNewCampaign,
  onApproveCampaign,
  onDispatchCampaign,
  onPauseCampaign,
  onResumeCampaign
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.from_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || String(c.status).toUpperCase() === statusFilter;
    const matchesType = typeFilter === 'ALL' || c.campaign_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

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

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-6 h-6 text-indigo-600" />
            Email Campaign Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, audit, approve, and dispatch high-throughput email campaigns with frozen recipient snapshots.
          </p>
        </div>

        <button
          onClick={onNewCampaign}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Create New Campaign
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns, subject lines, senders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="REVIEW">REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="PAUSED">PAUSED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <div className="flex items-center gap-1 text-xs text-slate-500 ml-2">
            <span>Type:</span>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Types</option>
            <option value="Promotional">Promotional</option>
            <option value="Informational">Informational</option>
            <option value="Newsletter">Newsletter</option>
            <option value="Festival Greeting">Festival Greeting</option>
            <option value="Product Launch">Product Launch</option>
            <option value="Renewal">Renewal</option>
            <option value="Upgrade">Upgrade</option>
            <option value="Event Invitation">Event Invitation</option>
          </select>
        </div>
      </div>

      {/* Campaign List Table with Phase 7 Required Columns */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Campaign</th>
                <th className="px-4 py-3.5">Audience</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Scheduled Date</th>
                <th className="px-4 py-3.5 text-right">Sent</th>
                <th className="px-4 py-3.5 text-right">Delivery Rate</th>
                <th className="px-4 py-3.5 text-right">Open Rate</th>
                <th className="px-4 py-3.5 text-right">Click Rate</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCampaigns.length > 0 ? (
                filteredCampaigns.map(c => {
                  const total = c.metrics?.totalRecipients || 0;
                  const sent = c.metrics?.sentCount || 0;
                  const delivered = c.metrics?.deliveredCount || 0;
                  const opened = c.metrics?.openedCount || 0;
                  const clicked = c.metrics?.clickedCount || 0;

                  const deliveryRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : '0.0';
                  const openRate = delivered > 0 ? ((opened / delivered) * 100).toFixed(1) : '0.0';
                  const clickRate = opened > 0 ? ((clicked / opened) * 100).toFixed(1) : '0.0';

                  const audienceLabel = c.audience?.segmentName || 
                    c.segmentName || 
                    (c.audience?.tags ? `Tags (${c.audience.tags.length})` : 'Target Segment');

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Column 1: Campaign */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm hover:text-indigo-600 cursor-pointer" onClick={() => onSelectCampaign(c)}>
                          {c.name}
                        </div>
                        <div className="text-slate-500 text-xs truncate max-w-xs mt-0.5" title={c.subject}>
                          {c.subject}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                            {c.campaign_type || 'Promotional'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            By {c.created_by?.split(' ')[0] || 'Admin'}
                          </span>
                        </div>
                      </td>

                      {/* Column 2: Audience */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[140px]" title={audienceLabel}>
                            {audienceLabel}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {total > 0 ? `${total.toLocaleString()} snapshot contacts` : 'Pending snapshot'}
                        </div>
                      </td>

                      {/* Column 3: Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(c.status)}
                      </td>

                      {/* Column 4: Scheduled Date */}
                      <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                        {c.scheduled_at || c.scheduledAt ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(c.scheduled_at || c.scheduledAt!).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Immediate / Unset</span>
                        )}
                      </td>

                      {/* Column 5: Sent */}
                      <td className="px-4 py-4 text-right font-medium text-slate-800">
                        {sent.toLocaleString()}
                        <div className="text-[10px] text-slate-400">of {total}</div>
                      </td>

                      {/* Column 6: Delivery Rate */}
                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-emerald-600">{deliveryRate}%</span>
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden ml-auto mt-1">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${deliveryRate}%` }} />
                        </div>
                      </td>

                      {/* Column 7: Open Rate */}
                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-indigo-600">{openRate}%</span>
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden ml-auto mt-1">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${openRate}%` }} />
                        </div>
                      </td>

                      {/* Column 8: Click Rate */}
                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-blue-600">{clickRate}%</span>
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden ml-auto mt-1">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: `${clickRate}%` }} />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectCampaign(c)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="View Full Campaign Details (6 Tabs)"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {String(c.status).toUpperCase() === 'REVIEW' && onApproveCampaign && (
                            <button
                              onClick={() => onApproveCampaign(c.id)}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-[11px] font-semibold transition-colors"
                              title="Approve and freeze recipient snapshot"
                            >
                              Approve
                            </button>
                          )}

                          {String(c.status).toUpperCase() === 'APPROVED' && onDispatchCampaign && (
                            <button
                              onClick={() => onDispatchCampaign(c.id)}
                              className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                              title="Send Immediately"
                            >
                              <Send className="w-3 h-3" />
                              Send
                            </button>
                          )}

                          {String(c.status).toUpperCase() === 'PROCESSING' && onPauseCampaign && (
                            <button
                              onClick={() => onPauseCampaign(c.id)}
                              className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                              title="Pause"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                          )}

                          {String(c.status).toUpperCase() === 'PAUSED' && onResumeCampaign && (
                            <button
                              onClick={() => onResumeCampaign(c.id)}
                              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                              title="Resume"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-500">
                    No campaigns matching the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
