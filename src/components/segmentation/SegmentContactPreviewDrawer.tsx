import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Search, 
  Download, 
  ShieldCheck, 
  Building2, 
  MapPin, 
  Mail, 
  Phone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Contact, Company } from '../../types';

interface SegmentContactPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  segmentName: string;
  matchingContacts: Contact[];
  companies: Company[];
}

export const SegmentContactPreviewDrawer: React.FC<SegmentContactPreviewDrawerProps> = ({
  isOpen,
  onClose,
  segmentName,
  matchingContacts,
  companies
}) => {
  const [search, setSearch] = useState('');
  const companyMap = new Map<string, Company>(companies.map(c => [c.id, c] as [string, Company]));

  if (!isOpen) return null;

  const filtered = matchingContacts.filter(c => 
    c.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase()) ||
    c.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCsv = () => {
    const headers = ['ID', 'Full Name', 'Email', 'Mobile', 'Company', 'City', 'State', 'Marketing Status', 'Tally Balance'];
    const rows = filtered.map(c => [
      c.id,
      `"${c.fullName || ''}"`,
      c.email,
      c.mobile || c.phone || '',
      `"${c.companyName || ''}"`,
      c.city || '',
      c.state || '',
      c.marketingStatus,
      c.tallyOutstandingBalance || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `segment_${segmentName.toLowerCase().replace(/\\s+/g, '_')}_preview.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Segment Audience Preview: {segmentName}
              </h3>
              <p className="text-[11px] text-slate-500">
                Showing {filtered.length} of {matchingContacts.length} matched contact profiles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-3 border-b border-slate-100 bg-white flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search matching contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            ✓ Dynamic Keyset Stream
          </span>
        </div>

        {/* Contacts Table */}
        <div className="overflow-y-auto flex-1 p-0">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] sticky top-0">
              <tr>
                <th className="py-2.5 px-4">Contact</th>
                <th className="py-2.5 px-3">Company & Industry</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">Tally Balance</th>
                <th className="py-2.5 px-4 text-right">Marketing Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No contacts match the current search filter within this segment.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const comp = c.companyId ? companyMap.get(c.companyId) : undefined;
                  return (
                    <tr key={c.id} className="hover:bg-indigo-50/20 transition">
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-slate-900">{c.fullName || c.firstName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{c.email}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{c.companyName || comp?.name || 'Individual Account'}</div>
                        <div className="text-[10px] text-slate-400">{comp?.industry || c.industry || 'B2B Client'}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-700">{c.city || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400">{c.state || 'India'}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          c.source === 'TALLY' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {c.source}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {c.tallyOutstandingBalance ? (
                          <span className="font-bold text-slate-900">₹{c.tallyOutstandingBalance.toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.marketingStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          c.marketingStatus === 'UNSUBSCRIBED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {c.marketingStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            {matchingContacts.length} total qualified audience contacts.
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
