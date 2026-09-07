import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  ShieldCheck, 
  Building2, 
  Mail, 
  Phone, 
  Tag, 
  ChevronDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  ExternalLink,
  DollarSign,
  Database,
  GitMerge,
  Sparkles,
  Layers,
  MapPin,
  Clock,
  History
} from 'lucide-react';
import { Contact, Company, ConsentStatus } from '../types';
import { detectDuplicateContact } from '../utils/contactUtils';
import { ContactMergeService } from '../services/ContactMergeService';
import { ArchitectureSchemaModal } from './ArchitectureSchemaModal';
import { DeduplicationModal } from './DeduplicationModal';

interface ContactsHubProps {
  contacts: Contact[];
  companies: Company[];
  onAddContact: (contact: Partial<Contact>) => void;
  onMergeContacts?: (mergedContact: Contact, archivedContactId: string) => void;
  onAddCompany?: (company: Company) => void;
  onUpdateConsent: (contactId: string, newStatus: ConsentStatus) => void;
  onNavigateToImport: () => void;
}

export const ContactsHub: React.FC<ContactsHubProps> = ({
  contacts,
  companies,
  onAddContact,
  onMergeContacts,
  onAddCompany,
  onUpdateConsent,
  onNavigateToImport
}) => {
  const [activeTab, setActiveTab] = useState<'contacts' | 'companies' | 'suppression'>('contacts');
  const [searchQuery, setSearchQuery] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [consentFilter, setConsentFilter] = useState<string>('all');
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('all');
  const [tallyFilter, setTallyFilter] = useState<string>('all'); // all | overdue_only | zero_balance

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [isDedupModalOpen, setIsDedupModalOpen] = useState(false);

  // Form state for adding contact
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    designation: '',
    city: 'Bengaluru',
    consentStatus: 'double_opt_in' as ConsentStatus,
    consentSource: 'Customer Direct Invoicing & Web Opt-In',
    tallyOutstandingBalance: 0,
    tags: 'Key Client, Direct Party'
  });

  // Form state for adding company
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    legalName: '',
    gstin: '',
    industry: 'Technology & SaaS',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    tallyLedgerName: '',
    tallyLedgerGroup: 'Sundry Debtors',
    outstandingBalance: 0,
    creditLimit: 500000,
  });

  // Real-time duplicate calculation for the Add Contact modal
  const candidateDuplicate = useMemo(() => {
    if (!formData.email && !formData.phone) return null;
    return detectDuplicateContact(
      {
        email: formData.email,
        mobile: formData.phone,
      },
      contacts,
      companies
    );
  }, [formData.email, formData.phone, contacts, companies]);

  // Detected duplicate pairs count across active database
  const duplicatePairsCount = useMemo(() => {
    return ContactMergeService.findDuplicatePairs(contacts).length;
  }, [contacts]);

  // Filtering contacts
  const filteredContacts = contacts.filter((contact) => {
    if (activeTab === 'suppression' && !contact.isSuppressed && contact.consentStatus !== 'unsubscribed' && contact.consentStatus !== 'bounced') {
      return false;
    }

    if (selectedCompanyFilter && contact.companyName !== selectedCompanyFilter) {
      return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = 
        contact.firstName.toLowerCase().includes(q) ||
        contact.lastName.toLowerCase().includes(q) ||
        contact.email.toLowerCase().includes(q) ||
        contact.companyName.toLowerCase().includes(q) ||
        (contact.phone && contact.phone.includes(q)) ||
        (contact.city && contact.city.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (consentFilter !== 'all' && contact.consentStatus !== consentFilter) {
      return false;
    }

    if (lifecycleFilter !== 'all' && contact.lifecycleStage !== lifecycleFilter) {
      return false;
    }

    if (tallyFilter === 'overdue_only' && (contact.tallyOutstandingBalance || 0) <= 0) {
      return false;
    }

    if (tallyFilter === 'zero_balance' && (contact.tallyOutstandingBalance || 0) > 0) {
      return false;
    }

    return true;
  });

  // Filtered companies list
  const filteredCompanies = companies.filter(comp => {
    if (!companySearch) return true;
    const q = companySearch.toLowerCase();
    return (
      comp.name.toLowerCase().includes(q) ||
      (comp.gstin && comp.gstin.toLowerCase().includes(q)) ||
      (comp.city && comp.city.toLowerCase().includes(q)) ||
      (comp.industry && comp.industry.toLowerCase().includes(q))
    );
  });

  const exportCsv = () => {
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Designation', 'City', 'Consent Status', 'Consent Source', 'Tally Balance', 'Overdue Days'];
    const rows = filteredContacts.map(c => [
      c.id,
      `"${c.firstName}"`,
      `"${c.lastName}"`,
      c.email,
      c.phone,
      `"${c.companyName}"`,
      `"${c.designation}"`,
      c.city,
      c.consentStatus,
      `"${c.consentSource}"`,
      c.tallyOutstandingBalance,
      c.tallyOverdueDays
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `digisoft_crm_contacts_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.firstName) return;

    onAddContact({
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    });

    setIsAddModalOpen(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      companyName: '',
      designation: '',
      city: 'Bengaluru',
      consentStatus: 'double_opt_in',
      consentSource: 'Customer Direct Invoicing & Web Opt-In',
      tallyOutstandingBalance: 0,
      tags: 'Key Client, Direct Party'
    });
  };

  const handleMergeCandidateFromModal = () => {
    if (!candidateDuplicate?.existingContact || !onMergeContacts) return;

    // Build temporary candidate contact object
    const candidateContact: Contact = {
      id: `CAND-${Date.now()}`,
      firstName: formData.firstName,
      lastName: formData.lastName,
      fullName: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      emailNormalized: formData.email.trim().toLowerCase(),
      phone: formData.phone,
      mobile: formData.phone,
      mobileNormalized: formData.phone,
      companyName: formData.companyName,
      designation: formData.designation,
      city: formData.city,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      consentStatus: formData.consentStatus,
      consentSource: formData.consentSource,
      consentDate: new Date().toISOString(),
      consentIp: '127.0.0.1',
      marketingStatus: 'ACTIVE',
      marketingConsent: true,
      lifecycleStage: 'lead',
      tallyOutstandingBalance: formData.tallyOutstandingBalance || 0,
      tallyOverdueDays: 0,
      totalEmailsSent: 0,
      totalEmailsOpened: 0,
      totalEmailsClicked: 0,
      unsubscribeToken: `unsub-${Date.now()}`,
      isSuppressed: false,
      createdAt: new Date().toISOString(),
      sources: [
        {
          id: `SRC-MAN-${Date.now()}`,
          contactId: `CAND-${Date.now()}`,
          sourceType: 'MANUAL',
          sourceReference: 'Interactive Form Merge',
          importedAt: new Date().toISOString()
        }
      ]
    };

    const outcome = ContactMergeService.merge(candidateDuplicate.existingContact, candidateContact);
    onMergeContacts(outcome.mergedContact, candidateContact.id);
    setIsAddModalOpen(false);
  };

  const handleAddCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyFormData.name) return;

    if (onAddCompany) {
      const newComp: Company = {
        id: `COMP-${Date.now()}`,
        name: companyFormData.name,
        companyName: companyFormData.name,
        legalName: companyFormData.legalName || companyFormData.name,
        gstin: companyFormData.gstin.toUpperCase(),
        industry: companyFormData.industry,
        status: 'ACTIVE',
        city: companyFormData.city,
        state: companyFormData.state,
        country: companyFormData.country,
        tallyLedgerName: companyFormData.tallyLedgerName || companyFormData.name,
        tallyLedgerGroup: companyFormData.tallyLedgerGroup,
        outstandingBalance: companyFormData.outstandingBalance,
        creditLimit: companyFormData.creditLimit,
        overdueDays: 0,
        contactCount: 0,
        createdAt: new Date().toISOString()
      };
      onAddCompany(newComp);
    }

    setIsAddCompanyModalOpen(false);
    setCompanyFormData({
      name: '',
      legalName: '',
      gstin: '',
      industry: 'Technology & SaaS',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      tallyLedgerName: '',
      tallyLedgerGroup: 'Sundry Debtors',
      outstandingBalance: 0,
      creditLimit: 500000,
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Contacts & Companies Directory</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Phase 1 Unified DB
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Master database synchronized with TallyPrime ledgers, normalized with verified GDPR & CAN-SPAM consent trails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Architecture & DB Schema Button */}
          <button
            onClick={() => setIsArchModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 shadow-xs transition cursor-pointer"
            title="Inspect Database Schema, ERD and Laravel 12 code"
          >
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            <span>Architecture & Schema</span>
          </button>

          {/* Deduplication & Merge Center */}
          <button
            onClick={() => setIsDedupModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 shadow-xs transition cursor-pointer"
            title="Scan database for duplicates and execute master merges"
          >
            <GitMerge className="w-3.5 h-3.5 text-amber-600" />
            <span>Deduplication & Merge</span>
            {duplicatePairsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {duplicatePairsCount}
              </span>
            )}
          </button>

          <button
            onClick={onNavigateToImport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            id="add-contact-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-medium">
        <button
          onClick={() => {
            setActiveTab('contacts');
            setSelectedCompanyFilter(null);
          }}
          className={`pb-2.5 px-3 border-b-2 transition cursor-pointer ${
            activeTab === 'contacts'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Contacts ({contacts.length})
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={`pb-2.5 px-3 border-b-2 transition cursor-pointer ${
            activeTab === 'companies'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Companies & Ledgers ({companies.length})
        </button>
        <button
          onClick={() => setActiveTab('suppression')}
          className={`pb-2.5 px-3 border-b-2 transition cursor-pointer ${
            activeTab === 'suppression'
              ? 'border-rose-600 text-rose-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Suppression & Unsubscribed ({contacts.filter(c => c.isSuppressed).length})
        </button>
      </div>

      {/* Active Company Filter Notice */}
      {selectedCompanyFilter && activeTab === 'contacts' && (
        <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-indigo-900 font-medium">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Showing contacts filtered by company: <strong>{selectedCompanyFilter}</strong></span>
          </div>
          <button
            onClick={() => setSelectedCompanyFilter(null)}
            className="text-xs text-indigo-700 hover:text-indigo-950 font-bold underline cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      {activeTab !== 'companies' ? (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, email, company, phone, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            
            {/* Consent Filter */}
            <select
              value={consentFilter}
              onChange={(e) => setConsentFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700 font-medium"
            >
              <option value="all">Consent: All</option>
              <option value="double_opt_in">Double Opt-In (Verified)</option>
              <option value="single_opt_in">Single Opt-In</option>
              <option value="unsubscribed">Unsubscribed</option>
              <option value="bounced">Bounced</option>
            </select>

            {/* Tally Overdue Filter */}
            <select
              value={tallyFilter}
              onChange={(e) => setTallyFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700 font-medium"
            >
              <option value="all">Tally Balance: All</option>
              <option value="overdue_only">Has Overdue Balance &gt; ₹0</option>
              <option value="zero_balance">Zero Balance (Cleared)</option>
            </select>

            {/* Lifecycle Stage Filter */}
            <select
              value={lifecycleFilter}
              onChange={(e) => setLifecycleFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700 font-medium"
            >
              <option value="all">Lifecycle: All</option>
              <option value="customer">Customer</option>
              <option value="lead">Lead</option>
              <option value="opportunity">Opportunity</option>
              <option value="churned">Churned</option>
            </select>
          </div>
        </div>
      ) : (
        /* Companies Search & Action Bar */
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search companies by name, GSTIN, city, industry..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          <button
            onClick={() => setIsAddCompanyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Company</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'companies' ? (
        /* Companies View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-3">GSTIN / Tax ID</th>
                  <th className="py-3 px-3">Industry</th>
                  <th className="py-3 px-3">Tally Ledger Group</th>
                  <th className="py-3 px-3">Outstanding Balance</th>
                  <th className="py-3 px-3">Contacts</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCompanies.map((comp) => {
                  const companyContacts = contacts.filter(c => c.companyName === comp.name);
                  return (
                    <tr key={comp.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{comp.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Tally Ledger: {comp.tallyLedgerName || comp.name}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {comp.gstin ? (
                          <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                            {comp.gstin}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unregistered</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{comp.industry}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                          {comp.tallyLedgerGroup || 'Sundry Debtors'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {comp.outstandingBalance > 0 ? (
                          <div>
                            <span className="font-bold text-amber-700">
                              ₹{comp.outstandingBalance.toLocaleString('en-IN')}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              {comp.overdueDays} days overdue
                            </div>
                          </div>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-[11px]">
                            ₹0 (Cleared)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-[11px]">
                          <Users className="w-3 h-3" />
                          {companyContacts.length} Contacts
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {comp.city}, {comp.state}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedCompanyFilter(comp.name);
                            setActiveTab('contacts');
                          }}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded transition cursor-pointer"
                        >
                          View Contacts
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Contacts View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-3">Company & Role</th>
                  <th className="py-3 px-3">Provenance Source</th>
                  <th className="py-3 px-3">Consent & CAN-SPAM</th>
                  <th className="py-3 px-3">Tally Receivable</th>
                  <th className="py-3 px-3">Campaign Activity</th>
                  <th className="py-3 px-3">Tags</th>
                  <th className="py-3 px-4 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No contacts found matching the active filters.
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {contact.firstName} {contact.lastName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{contact.email}</span>
                        </div>
                        {contact.phone && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">
                          {contact.companyName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {contact.designation} &bull; {contact.city}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-700">
                          <span className={`w-2 h-2 rounded-full ${
                            contact.source === 'TALLY' ? 'bg-amber-500' :
                            contact.source === 'CSV_IMPORT' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`} />
                          <span className="font-bold">{contact.source || 'MANUAL'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {contact.sourceReference || 'Direct entry'}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <ConsentBadge status={contact.consentStatus} />
                        <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[140px]">
                          {contact.consentSource}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {contact.tallyOutstandingBalance > 0 ? (
                          <div>
                            <span className="font-bold text-amber-700">
                              ₹{contact.tallyOutstandingBalance.toLocaleString('en-IN')}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              {contact.tallyOverdueDays} days overdue
                            </div>
                          </div>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-[11px]">
                            ₹0 (Cleared)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-medium">
                          {contact.totalEmailsOpened} opens / {contact.totalEmailsSent} sent
                        </div>
                        {contact.lastEmailOpenedAt && (
                          <div className="text-[10px] text-slate-400">
                            Last: {new Date(contact.lastEmailOpenedAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {contact.tags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">
                              {tag}
                            </span>
                          ))}
                          {contact.tags.length > 2 && (
                            <span className="text-[10px] text-slate-400">
                              +{contact.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedContact(contact)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded transition cursor-pointer"
                        >
                          Profile
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contact Details Modal / Drawer */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {selectedContact.id}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    selectedContact.marketingStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedContact.marketingStatus || 'ACTIVE'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedContact.firstName} {selectedContact.lastName}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedContact.designation} &bull; {selectedContact.companyName}
                </p>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-base font-bold"
              >
                &times;
              </button>
            </div>

            {/* Tally Ledger Breakdown Box */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-amber-700" />
                  TallyPrime Ledger Status
                </span>
                <div className="text-lg font-extrabold text-amber-800 mt-0.5">
                  ₹{selectedContact.tallyOutstandingBalance.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-amber-700">
                  Ageing: {selectedContact.tallyOverdueDays} days past due
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded font-mono font-bold bg-amber-200/60 text-amber-900">
                Sundry Debtor
              </span>
            </div>

            {/* Detailed Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Normalized Email</span>
                <span className="font-semibold text-slate-800 font-mono text-[11px]">
                  {selectedContact.emailNormalized || selectedContact.email}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">E.164 Phone</span>
                <span className="font-semibold text-slate-800 font-mono text-[11px]">
                  {selectedContact.mobileNormalized || selectedContact.phone || 'N/A'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Consent Status</span>
                <ConsentBadge status={selectedContact.consentStatus} />
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Opt-In Source</span>
                <span className="font-semibold text-slate-800">{selectedContact.consentSource}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Opt-In Timestamp & IP</span>
                <span className="text-slate-700 font-mono text-[11px]">
                  {new Date(selectedContact.consentDate).toLocaleString()} ({selectedContact.consentIp})
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Unsubscribe Token</span>
                <span className="font-mono text-slate-600 text-[10px] truncate block">
                  {selectedContact.unsubscribeToken}
                </span>
              </div>
            </div>

            {/* Provenance Audit Sources */}
            {selectedContact.sources && selectedContact.sources.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                  <History className="w-3 h-3 text-indigo-600" />
                  Acquisition Provenance History ({selectedContact.sources.length})
                </span>
                <div className="space-y-1.5 mt-1">
                  {selectedContact.sources.map((src, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] bg-white p-1.5 rounded border border-slate-200">
                      <span className="font-bold text-slate-800 font-mono">{src.source}</span>
                      <span className="text-slate-500 truncate max-w-[200px]">{src.sourceReference}</span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(src.importedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Consent Management Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Compliance Override:</span>
              <div className="flex items-center gap-2">
                {selectedContact.consentStatus !== 'double_opt_in' && (
                  <button
                    onClick={() => {
                      onUpdateConsent(selectedContact.id, 'double_opt_in');
                      setSelectedContact({ ...selectedContact, consentStatus: 'double_opt_in', isSuppressed: false });
                    }}
                    className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded text-xs transition cursor-pointer"
                  >
                    Set Verified Opt-In
                  </button>
                )}
                {!selectedContact.isSuppressed && (
                  <button
                    onClick={() => {
                      onUpdateConsent(selectedContact.id, 'unsubscribed');
                      setSelectedContact({ ...selectedContact, consentStatus: 'unsubscribed', isSuppressed: true });
                    }}
                    className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold rounded text-xs transition cursor-pointer"
                  >
                    Suppress / Unsubscribe
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal with Real-time Deduplication Banner */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add New Contact Record</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            {/* Real-time Duplicate Interceptor Alert */}
            {candidateDuplicate && candidateDuplicate.hasDuplicate && candidateDuplicate.existingContact && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold text-amber-900 flex items-center gap-1.5">
                      <span>Duplicate Intercepted</span>
                      <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-mono">
                        Priority {candidateDuplicate.priority}
                      </span>
                    </div>
                    <p className="text-amber-800 text-[11px] mt-0.5">
                      {candidateDuplicate.matchReason}
                    </p>
                    <div className="mt-1 text-[11px] font-semibold text-slate-800">
                      Existing Master: {candidateDuplicate.existingContact.firstName} {candidateDuplicate.existingContact.lastName} ({candidateDuplicate.existingContact.companyName})
                    </div>
                  </div>
                </div>

                {onMergeContacts && (
                  <button
                    type="button"
                    onClick={handleMergeCandidateFromModal}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    <GitMerge className="w-3.5 h-3.5" />
                    <span>Merge with Existing Master Record</span>
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="e.g. Vikram"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="e.g. Sen"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="vikram.sen@enterprise.in"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Phone (E.164)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="+919876543210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="Sen Industrial Components"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="Commercial Lead"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tally Opening Balance (₹)</label>
                  <input
                    type="number"
                    value={formData.tallyOutstandingBalance}
                    onChange={(e) => setFormData({ ...formData, tallyOutstandingBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Consent Level</label>
                  <select
                    value={formData.consentStatus}
                    onChange={(e) => setFormData({ ...formData, consentStatus: e.target.value as ConsentStatus })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="double_opt_in">Double Opt-In (Verified)</option>
                    <option value="single_opt_in">Single Opt-In</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Opt-In Proof / Source</label>
                <input
                  type="text"
                  value={formData.consentSource}
                  onChange={(e) => setFormData({ ...formData, consentSource: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm cursor-pointer"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Company Registration Modal */}
      {isAddCompanyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Register Company Entity
              </h3>
              <button onClick={() => setIsAddCompanyModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-base font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddCompanySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Company / Display Name *</label>
                <input
                  type="text"
                  required
                  value={companyFormData.name}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="e.g. Apex Power Systems Ltd"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">GSTIN (15 Digits)</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={companyFormData.gstin}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, gstin: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                    placeholder="27AAACA1234F1Z5"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Industry</label>
                  <input
                    type="text"
                    value={companyFormData.industry}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, industry: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="Manufacturing / Solar"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={companyFormData.city}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, city: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">State</label>
                  <input
                    type="text"
                    value={companyFormData.state}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, state: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Country</label>
                  <input
                    type="text"
                    value={companyFormData.country}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, country: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tally Ledger Group</label>
                  <input
                    type="text"
                    value={companyFormData.tallyLedgerGroup}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, tallyLedgerGroup: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Outstanding Balance (₹)</label>
                  <input
                    type="number"
                    value={companyFormData.outstandingBalance}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, outstandingBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCompanyModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm cursor-pointer"
                >
                  Register Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Architecture & DB Schema Modal */}
      <ArchitectureSchemaModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />

      {/* Deduplication & Merge Workbench Modal */}
      {onMergeContacts && (
        <DeduplicationModal
          isOpen={isDedupModalOpen}
          onClose={() => setIsDedupModalOpen(false)}
          contacts={contacts}
          onMergeContacts={onMergeContacts}
        />
      )}
    </div>
  );
};

export const ConsentBadge: React.FC<{ status: ConsentStatus }> = ({ status }) => {
  switch (status) {
    case 'double_opt_in':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-2.5 h-2.5" /> Double Opt-In
        </span>
      );
    case 'single_opt_in':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <CheckCircle2 className="w-2.5 h-2.5" /> Single Opt-In
        </span>
      );
    case 'unsubscribed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-2.5 h-2.5" /> Unsubscribed
        </span>
      );
    case 'bounced':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-2.5 h-2.5" /> Bounced
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
          {status}
        </span>
      );
  }
};
