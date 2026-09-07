import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Sparkles, 
  RefreshCw, 
  Send, 
  Eye, 
  Copy, 
  Trash2, 
  Edit3, 
  Clock, 
  Database,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Segment, Contact, Company } from '../../types';

interface SegmentListViewProps {
  segments: Segment[];
  contacts: Contact[];
  companies: Company[];
  onOpenBuilder: (segmentToEdit?: Segment) => void;
  onSelectPreviewSegment: (segment: Segment) => void;
  onLaunchCampaign: (segment: Segment) => void;
  onDeleteSegment: (segmentId: string) => void;
  onDuplicateSegment: (segment: Segment) => void;
}

export const SegmentListView: React.FC<SegmentListViewProps> = ({
  segments,
  contacts,
  companies,
  onOpenBuilder,
  onSelectPreviewSegment,
  onLaunchCampaign,
  onDeleteSegment,
  onDuplicateSegment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DYNAMIC' | 'STATIC'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ALL');

  const filteredSegments = segments.filter(seg => {
    const matchesSearch = 
      seg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seg.description.toLowerCase().includes(searchQuery.toLowerCase());

    const isDynamic = seg.isDynamic ?? (seg.segmentType ? seg.segmentType === 'DYNAMIC' : true);
    const segType = isDynamic ? 'DYNAMIC' : 'STATIC';
    const matchesType = typeFilter === 'ALL' || segType === typeFilter;

    const segStatus = seg.status || 'ACTIVE';
    const matchesStatus = statusFilter === 'ALL' || segStatus === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search segments by name or rule description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Types</option>
            <option value="DYNAMIC">Dynamic (Realtime Rules)</option>
            <option value="STATIC">Static (Fixed List)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <button
          onClick={() => onOpenBuilder()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Segment Builder</span>
        </button>
      </div>

      {/* Segments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Segment Name & Logic</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Contact Count</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Created By</th>
                <th className="py-3 px-3">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSegments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No segments found matching your search or filters.
                  </td>
                </tr>
              ) : (
                filteredSegments.map((seg) => {
                  const isDynamic = seg.isDynamic ?? (seg.segmentType ? seg.segmentType === 'DYNAMIC' : true);
                  const count = seg.cachedCount ?? seg.totalContacts ?? seg.estimatedCount ?? 0;
                  const status = seg.status || 'ACTIVE';

                  return (
                    <tr 
                      key={seg.id}
                      className="hover:bg-indigo-50/20 transition group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl mt-0.5 ${
                            isDynamic ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition">
                              {seg.name}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 max-w-md line-clamp-1">
                              {seg.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isDynamic 
                            ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {isDynamic ? 'DYNAMIC' : 'STATIC'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs font-mono">
                            {count}
                          </span>
                          <span className="text-[10px] text-slate-400">contacts</span>
                        </div>
                        <div className="text-[9px] text-emerald-600 mt-0.5 flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Cached Query</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          status === 'DRAFT' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        {seg.createdBy || 'Bhuvan Gupta'}
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        {new Date(seg.updatedAt || seg.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelectPreviewSegment(seg)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Preview Matching Contacts"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenBuilder(seg)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Edit Segment Rules"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onLaunchCampaign(seg)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
                            title="Launch Email Campaign for Segment"
                          >
                            <Send className="w-3 h-3 inline mr-1" />
                            Campaign
                          </button>

                          <button
                            onClick={() => onDuplicateSegment(seg)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title="Duplicate Segment"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteSegment(seg.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Segment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
