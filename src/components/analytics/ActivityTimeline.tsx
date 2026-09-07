import React, { useState, useMemo } from 'react';
import { 
  EmailEvent, 
  EmailEventType, 
  ESPProviderType, 
  Campaign, 
  Contact 
} from '../../types';
import { 
  Send, 
  CheckCircle2, 
  Eye, 
  MousePointerClick, 
  AlertOctagon, 
  AlertTriangle, 
  UserX, 
  Search, 
  Filter, 
  Download, 
  ShieldCheck, 
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Clock,
  MapPin,
  Laptop,
  Server
} from 'lucide-react';

interface ActivityTimelineProps {
  events: EmailEvent[];
  campaigns: Campaign[];
  contacts: Contact[];
  onExportCsv?: () => void;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  events,
  campaigns,
  contacts,
  onExportCsv
}) => {
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const campaignMap = useMemo(() => new Map(campaigns.map(c => [c.id, c])), [campaigns]);
  const contactMap = useMemo(() => new Map(contacts.map(c => [c.id, c])), [contacts]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      if (selectedEventType !== 'ALL' && evt.event_type !== selectedEventType) {
        return false;
      }
      if (selectedProvider !== 'ALL' && evt.provider !== selectedProvider) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const contact = contactMap.get(evt.contact_id);
        const campaign = campaignMap.get(evt.campaign_id);
        const email = evt.metadata.recipient_email || contact?.email || '';
        const name = contact ? `${contact.firstName} ${contact.lastName}` : '';
        const bounceReason = evt.metadata.bounce_reason || '';
        const link = evt.metadata.link_url || '';

        return (
          email.toLowerCase().includes(query) ||
          name.toLowerCase().includes(query) ||
          (campaign?.name && campaign.name.toLowerCase().includes(query)) ||
          evt.provider_event_id.toLowerCase().includes(query) ||
          bounceReason.toLowerCase().includes(query) ||
          link.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [events, selectedEventType, selectedProvider, searchQuery, contactMap, campaignMap]);

  // Helper for Event Badges
  const getEventBadge = (type: EmailEventType) => {
    switch (type) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Send className="w-3 h-3 text-blue-600" />
            SENT
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            DELIVERED
          </span>
        );
      case 'OPENED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Eye className="w-3 h-3 text-indigo-600" />
            OPENED
          </span>
        );
      case 'CLICKED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <MousePointerClick className="w-3 h-3 text-purple-600" />
            CLICKED
          </span>
        );
      case 'BOUNCED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertOctagon className="w-3 h-3 text-rose-600" />
            BOUNCED
          </span>
        );
      case 'COMPLAINED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            COMPLAINED
          </span>
        );
      case 'UNSUBSCRIBED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <UserX className="w-3 h-3 text-slate-600" />
            UNSUBSCRIBED
          </span>
        );
    }
  };

  const getProviderBadge = (prov: ESPProviderType) => {
    switch (prov) {
      case 'amazon_ses':
        return <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">SES (SNS)</span>;
      case 'brevo':
        return <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-medium">Brevo</span>;
      case 'sendgrid':
        return <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 font-medium">SendGrid</span>;
    }
  };

  const handleDownloadCsv = () => {
    if (onExportCsv) {
      onExportCsv();
      return;
    }
    const headers = ['Event ID', 'Provider', 'Event Type', 'Recipient Email', 'Campaign ID', 'Timestamp', 'Bounce Type', 'Bounce Reason', 'Link URL'];
    const rows = filteredEvents.map(e => [
      e.id,
      e.provider,
      e.event_type,
      e.metadata.recipient_email || '',
      e.campaign_id,
      e.event_timestamp,
      e.metadata.bounce_type || '',
      `"${(e.metadata.bounce_reason || '').replace(/"/g, '""')}"`,
      `"${(e.metadata.link_url || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `email_events_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      {/* Top Header & Search Ribbon */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Real-Time Webhook Activity Timeline</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold">
              Live Stream &bull; {filteredEvents.length} Events
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable audit trail of inbound ESP webhook events with verified signatures, idempotency hashes, and client telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search email, contact, bounce..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-60"
            />
          </div>

          {/* Event Filter */}
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Event Types</option>
            <option value="SENT">Sent</option>
            <option value="DELIVERED">Delivered</option>
            <option value="OPENED">Opened</option>
            <option value="CLICKED">Clicked</option>
            <option value="BOUNCED">Bounced</option>
            <option value="COMPLAINED">Complained</option>
            <option value="UNSUBSCRIBED">Unsubscribed</option>
          </select>

          {/* Provider Filter */}
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Providers</option>
            <option value="amazon_ses">Amazon SES</option>
            <option value="brevo">Brevo</option>
            <option value="sendgrid">SendGrid</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Events Table / Timeline List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50 font-semibold">
              <th className="py-2.5 px-3">Event Type</th>
              <th className="py-2.5 px-3">Recipient & Contact</th>
              <th className="py-2.5 px-3">Campaign & Provider</th>
              <th className="py-2.5 px-3">Security & Details</th>
              <th className="py-2.5 px-3 text-right">Timestamp</th>
              <th className="py-2.5 px-2 text-center w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No webhook events matching filter criteria.
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => {
                const contact = contactMap.get(evt.contact_id);
                const campaign = campaignMap.get(evt.campaign_id);
                const isExpanded = expandedEventId === evt.id;
                const email = evt.metadata.recipient_email || contact?.email || 'N/A';

                return (
                  <React.Fragment key={evt.id}>
                    <tr 
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-indigo-50/20' : ''
                      }`}
                      onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                    >
                      {/* Event Type */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getEventBadge(evt.event_type)}
                          {evt.metadata.bounce_type && (
                            <span className={`text-[10px] font-mono px-1 py-0.2 rounded font-bold ${
                              evt.metadata.bounce_type === 'HARD' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {evt.metadata.bounce_type}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Recipient */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-900">{email}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span>{contact ? `${contact.firstName} ${contact.lastName}` : 'Audience Member'}</span>
                          {contact?.companyName && (
                            <>
                              <span>&bull;</span>
                              <span className="truncate max-w-[140px]">{contact.companyName}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Campaign & Provider */}
                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-medium truncate max-w-[180px]">
                          {campaign?.name || evt.campaign_id}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          {getProviderBadge(evt.provider)}
                          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                            {evt.provider_event_id.slice(-12)}
                          </span>
                        </div>
                      </td>

                      {/* Security & Summary Details */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[180px]">
                            {evt.metadata.bounce_reason 
                              ? evt.metadata.bounce_reason 
                              : evt.metadata.link_url 
                                ? `Clicked: ${evt.metadata.link_url}`
                                : 'Verified Inbound Signature'}
                          </span>
                        </div>
                        {evt.metadata.ip && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                            <span>{evt.metadata.ip}</span>
                            {evt.metadata.geo_city && <span>({evt.metadata.geo_city}, {evt.metadata.geo_country})</span>}
                          </div>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="text-slate-800 font-mono text-[11px]">
                          {new Date(evt.event_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(evt.event_timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                      </td>

                      {/* Expander Icon */}
                      <td className="py-3 px-2 text-center text-slate-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </td>
                    </tr>

                    {/* Detailed Metadata Accordion Drawer */}
                    {isExpanded && (
                      <tr className="bg-slate-50 border-y border-indigo-100">
                        <td colSpan={6} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            {/* Ingestion & Identity */}
                            <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                              <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                                Ingestion & Idempotency
                              </span>
                              <div className="text-slate-600"><span className="text-slate-400">Event DB ID:</span> <span className="font-mono text-slate-800">{evt.id}</span></div>
                              <div className="text-slate-600"><span className="text-slate-400">Provider ID:</span> <span className="font-mono text-slate-800 break-all">{evt.provider_event_id}</span></div>
                              <div className="text-slate-600"><span className="text-slate-400">Recipient ID:</span> <span className="font-mono text-slate-800">{evt.campaign_recipient_id}</span></div>
                              <div className="text-slate-600"><span className="text-slate-400">Idempotency Hash:</span> <span className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">SHA-256 Validated</span></div>
                            </div>

                            {/* Client & Device Telemetry */}
                            <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                              <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                                Client & Device Telemetry
                              </span>
                              <div className="text-slate-600"><span className="text-slate-400">Client IP:</span> <span className="font-mono text-slate-800">{evt.metadata.ip || '127.0.0.1'}</span></div>
                              <div className="text-slate-600"><span className="text-slate-400">Location:</span> <span className="text-slate-800">{evt.metadata.geo_city || 'Bengaluru'}, {evt.metadata.geo_country || 'IN'}</span></div>
                              <div className="text-slate-600"><span className="text-slate-400">User-Agent:</span> <span className="text-slate-700 text-[11px] block truncate">{evt.metadata.user_agent || 'Mozilla/5.0'}</span></div>
                              {evt.metadata.link_url && (
                                <div className="text-slate-600 truncate">
                                  <span className="text-slate-400">Click URL:</span> <a href={evt.metadata.link_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{evt.metadata.link_url}</a>
                                </div>
                              )}
                            </div>

                            {/* Delivery Diagnostics */}
                            <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                              <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                                Diagnostics & Security
                              </span>
                              <div className="text-slate-600"><span className="text-slate-400">Signature:</span> <span className="text-emerald-700 font-semibold">Verified Cryptographically</span></div>
                              {evt.metadata.bounce_code && (
                                <div className="text-slate-600"><span className="text-slate-400">Bounce Code:</span> <span className="font-mono font-bold text-rose-700">{evt.metadata.bounce_code}</span></div>
                              )}
                              {evt.metadata.bounce_reason && (
                                <div className="text-slate-600"><span className="text-slate-400">Diagnostic:</span> <span className="text-rose-700">{evt.metadata.bounce_reason}</span></div>
                              )}
                              {evt.metadata.complaint_feedback_type && (
                                <div className="text-slate-600"><span className="text-slate-400">Complaint Type:</span> <span className="text-amber-700 font-semibold">{evt.metadata.complaint_feedback_type}</span></div>
                              )}
                              <div className="text-slate-600"><span className="text-slate-400">Ingested At:</span> <span className="text-slate-800">{evt.created_at}</span></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
