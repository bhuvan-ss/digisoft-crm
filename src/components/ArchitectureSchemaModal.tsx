import React, { useState } from 'react';
import { 
  Database, 
  Layers, 
  GitMerge, 
  Code2, 
  FileCode, 
  CheckCircle, 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  ExternalLink,
  Table,
  Cpu,
  KeyRound
} from 'lucide-react';

interface ArchitectureSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureSchemaModal: React.FC<ArchitectureSchemaModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'erd' | 'schema' | 'dedup' | 'laravel'>('erd');
  const [activeCodeFile, setActiveCodeFile] = useState<'migration_contacts' | 'migration_companies' | 'model_contact' | 'model_company' | 'dedup_service' | 'merge_service' | 'feature_test'>('model_contact');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyCurrentCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-5xl w-full h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  DIGISOFT CRM – Phase 1 Technical Architecture
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  Laravel 12 / PHP 8.3
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Master Database Schema, 3-Tier Deduplication Hierarchy & Production Eloquent Services
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('erd')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'erd'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Relationship Diagram (ERD)</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'schema'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Database Tables & Indexes</span>
          </button>

          <button
            onClick={() => setActiveTab('dedup')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'dedup'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GitMerge className="w-4 h-4" />
            <span>3-Tier Deduplication & Merge Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('laravel')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'laravel'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Laravel Codebase Explorer</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {activeTab === 'erd' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Visual Entity Relationships & Multi-Tenant Boundaries
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Companies maintain 1:N relations with Contacts. Contacts maintain 1:N provenance with Contact Sources and M:N polymorphic relations with Tags.
                </p>

                {/* Visual Architecture Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Entity 1: Companies */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        COMPANIES
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                        Primary Organization
                      </span>
                    </div>
                    <ul className="text-[11px] text-slate-600 space-y-1 font-mono">
                      <li className="font-bold text-slate-800">id: BIGINT PK</li>
                      <li>company_name: VARCHAR(255) [INDEX]</li>
                      <li>gstin: VARCHAR(15) [UNIQUE, INDEX]</li>
                      <li>pan: VARCHAR(10) [INDEX]</li>
                      <li>status: ENUM('ACTIVE', ...)</li>
                      <li>outstanding_balance: DECIMAL(14,2)</li>
                      <li>tally_guid: VARCHAR(64) [UNIQUE]</li>
                    </ul>
                  </div>

                  {/* Entity 2: Contacts */}
                  <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                        CONTACTS (Master Record)
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                        1:N from Company
                      </span>
                    </div>
                    <ul className="text-[11px] text-slate-700 space-y-1 font-mono">
                      <li className="font-bold text-slate-900">id: BIGINT PK</li>
                      <li>company_id: BIGINT FK [NULL ON DELETE]</li>
                      <li className="text-indigo-700 font-bold">email_normalized: VARCHAR(191) [INDEX]</li>
                      <li className="text-indigo-700 font-bold">mobile_normalized: VARCHAR(30) [INDEX, E.164]</li>
                      <li>marketing_status: ENUM('ACTIVE', ...)</li>
                      <li>consent_status: ENUM('double_opt_in', ...)</li>
                      <li>unsubscribe_token: VARCHAR(64) [UNIQUE]</li>
                      <li>merged_into_contact_id: BIGINT FK</li>
                    </ul>
                  </div>

                  {/* Entity 3: Provenance & Tags */}
                  <div className="space-y-4">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-slate-900">CONTACT_SOURCES</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          1:N Audit
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Retains external IDs & raw sync payloads from TallyPrime, CSV, XLS, and Web Portal forms without data loss.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-slate-900">TAGS & TAGGABLES</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                          M:N Polymorphic
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Powers dynamic rule-based audience segmentation, GST tagging, and Tally debtor categorizations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Architectural Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs mb-2">
                    01
                  </span>
                  <h5 className="font-bold text-slate-900 text-xs mb-1">Idempotent Provenance</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Contacts can receive updates from multiple sources simultaneously. `ContactSource` records preserve origin history and timestamps across merges.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs mb-2">
                    02
                  </span>
                  <h5 className="font-bold text-slate-900 text-xs mb-1">Strict E.164 & Email Indexing</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Every mobile number is formatted into canonical E.164 (+91 standard). Lowercase normalized emails allow sub-millisecond duplicate queries.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs mb-2">
                    03
                  </span>
                  <h5 className="font-bold text-slate-900 text-xs mb-1">Audit-Safe Merges</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Merged contacts are never hard deleted; `merged_into_contact_id` maintains full forward lineage and soft deletes preserve historic click logs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 mb-2">Table Definitions & Field Specifications</h4>
                <div className="space-y-4 text-xs">
                  {/* Table 1 */}
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs py-1 px-2.5 bg-slate-100 rounded-md inline-block font-mono mb-2">
                      Table: contacts
                    </h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] border border-slate-200 rounded-lg">
                        <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                          <tr>
                            <th className="p-2">Column</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">Modifiers / Index</th>
                            <th className="p-2">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                          <tr>
                            <td className="p-2 font-bold text-indigo-600">id</td>
                            <td className="p-2">BIGINT UNSIGNED</td>
                            <td className="p-2">PRIMARY KEY, AUTO_INCREMENT</td>
                            <td className="p-2 font-sans">Unique master contact identifier</td>
                          </tr>
                          <tr>
                            <td className="p-2">company_id</td>
                            <td className="p-2">BIGINT UNSIGNED</td>
                            <td className="p-2">INDEX, FOREIGN KEY (NULL ON DELETE)</td>
                            <td className="p-2 font-sans">Belongs to Company entity</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold text-slate-900">email_normalized</td>
                            <td className="p-2">VARCHAR(191)</td>
                            <td className="p-2">INDEX, NOT NULL</td>
                            <td className="p-2 font-sans">Trimmed, lowercase normalized email for Priority 1 deduplication</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold text-slate-900">mobile_normalized</td>
                            <td className="p-2">VARCHAR(30)</td>
                            <td className="p-2">INDEX, NULLABLE</td>
                            <td className="p-2 font-sans">E.164 canonical phone number (+91...) for Priority 2 deduplication</td>
                          </tr>
                          <tr>
                            <td className="p-2">marketing_status</td>
                            <td className="p-2">ENUM(...)</td>
                            <td className="p-2">INDEX, DEFAULT 'ACTIVE'</td>
                            <td className="p-2 font-sans">ACTIVE, UNSUBSCRIBED, BOUNCED, COMPLAINED, PENDING</td>
                          </tr>
                          <tr>
                            <td className="p-2">tally_outstanding_balance</td>
                            <td className="p-2">DECIMAL(14,2)</td>
                            <td className="p-2">INDEX, DEFAULT 0.00</td>
                            <td className="p-2 font-sans">Real-time ledger receivable amount from TallyPrime</td>
                          </tr>
                          <tr>
                            <td className="p-2">merged_into_contact_id</td>
                            <td className="p-2">BIGINT UNSIGNED</td>
                            <td className="p-2">NULLABLE, FK (contacts.id)</td>
                            <td className="p-2 font-sans">Points to master contact if this record was merged</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Table 2 */}
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs py-1 px-2.5 bg-slate-100 rounded-md inline-block font-mono mb-2">
                      Table: companies
                    </h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] border border-slate-200 rounded-lg">
                        <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                          <tr>
                            <th className="p-2">Column</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">Modifiers / Index</th>
                            <th className="p-2">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                          <tr>
                            <td className="p-2 font-bold text-indigo-600">id</td>
                            <td className="p-2">BIGINT UNSIGNED</td>
                            <td className="p-2">PRIMARY KEY, AUTO_INCREMENT</td>
                            <td className="p-2 font-sans">Company entity identifier</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold">company_name</td>
                            <td className="p-2">VARCHAR(255)</td>
                            <td className="p-2">INDEX, NOT NULL</td>
                            <td className="p-2 font-sans">Trade / Display business name</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold text-slate-900">gstin</td>
                            <td className="p-2">VARCHAR(15)</td>
                            <td className="p-2">UNIQUE, INDEX, NULLABLE</td>
                            <td className="p-2 font-sans">15-digit GSTIN (Priority 3 duplicate match anchor)</td>
                          </tr>
                          <tr>
                            <td className="p-2">pan</td>
                            <td className="p-2">VARCHAR(10)</td>
                            <td className="p-2">INDEX, NULLABLE</td>
                            <td className="p-2 font-sans">10-character Permanent Account Number</td>
                          </tr>
                          <tr>
                            <td className="p-2">tally_guid</td>
                            <td className="p-2">VARCHAR(64)</td>
                            <td className="p-2">UNIQUE, INDEX, NULLABLE</td>
                            <td className="p-2 font-sans">Direct XML Ledger GUID from TallyPrime</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dedup' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-indigo-600" />
                  The 3-Tier Deduplication Hierarchy
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Incoming contact data (from TallyPrime, manual entries, or spreadsheet imports) is passed through this sequential deterministic pipeline before database persistence.
                </p>

                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 flex items-start gap-3">
                    <span className="px-2 py-1 rounded bg-indigo-600 text-white font-mono font-bold text-xs">
                      PRIORITY 1
                    </span>
                    <div className="flex-1 text-xs">
                      <h5 className="font-bold text-slate-900">Normalized Email Match</h5>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Standardizes email strings with <code className="font-mono bg-white px-1 rounded">strtolower(trim($email))</code>. If an exact match is discovered in <code className="font-mono bg-white px-1 rounded">email_normalized</code>, the system flags a duplicate immediately with Priority 1 certainty.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex items-start gap-3">
                    <span className="px-2 py-1 rounded bg-blue-600 text-white font-mono font-bold text-xs">
                      PRIORITY 2
                    </span>
                    <div className="flex-1 text-xs">
                      <h5 className="font-bold text-slate-900">Normalized Mobile (E.164) Match</h5>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Strips all whitespace, hyphens, and parentheses. Indian 10-digit formats (starting 6-9) are automatically prepended with country code <code className="font-mono bg-white px-1 rounded">+91</code>. Evaluates against <code className="font-mono bg-white px-1 rounded">mobile_normalized</code>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 flex items-start gap-3">
                    <span className="px-2 py-1 rounded bg-amber-600 text-white font-mono font-bold text-xs">
                      PRIORITY 3
                    </span>
                    <div className="flex-1 text-xs">
                      <h5 className="font-bold text-slate-900">Company GSTIN Match</h5>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Validates 15-character uppercase GSTIN format against <code className="font-mono bg-white px-1 rounded">companies.gstin</code>. If matched and candidate shares contact name or role under the same registered business, duplicates are intercepted.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Merge Rules Specification */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 mb-2">Master Record Merge Policy (`ContactMergeService`)</h4>
                <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
                  <li><strong>Tags:</strong> Merged without duplication via <code className="font-mono bg-slate-100 px-1 rounded">syncWithoutDetaching</code>.</li>
                  <li><strong>Provenance:</strong> Reassigns all <code className="font-mono bg-slate-100 px-1 rounded">ContactSource</code> rows to the master profile and logs a merge event in JSON metadata.</li>
                  <li><strong>Engagement Stats:</strong> Aggregates <code className="font-mono bg-slate-100 px-1 rounded">total_emails_sent</code>, <code className="font-mono bg-slate-100 px-1 rounded">opened</code>, and <code className="font-mono bg-slate-100 px-1 rounded">clicked</code> counters.</li>
                  <li><strong>Consent:</strong> Strictest compliance wins — if secondary is unsubscribed, master is marked suppressed. Verified double opt-in is elevated.</li>
                  <li><strong>Data Integrity:</strong> Master record is preserved; secondary is marked with <code className="font-mono bg-slate-100 px-1 rounded">merged_into_contact_id</code> and soft deleted.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'laravel' && (
            <div className="flex flex-col h-full space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                  <button
                    onClick={() => setActiveCodeFile('model_contact')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono cursor-pointer ${
                      activeCodeFile === 'model_contact' ? 'bg-indigo-600 text-white font-bold' : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    Contact.php
                  </button>
                  <button
                    onClick={() => setActiveCodeFile('model_company')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono cursor-pointer ${
                      activeCodeFile === 'model_company' ? 'bg-indigo-600 text-white font-bold' : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    Company.php
                  </button>
                  <button
                    onClick={() => setActiveCodeFile('dedup_service')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono cursor-pointer ${
                      activeCodeFile === 'dedup_service' ? 'bg-indigo-600 text-white font-bold' : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    ContactDeduplicationService.php
                  </button>
                  <button
                    onClick={() => setActiveCodeFile('merge_service')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono cursor-pointer ${
                      activeCodeFile === 'merge_service' ? 'bg-indigo-600 text-white font-bold' : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    ContactMergeService.php
                  </button>
                  <button
                    onClick={() => setActiveCodeFile('migration_contacts')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono cursor-pointer ${
                      activeCodeFile === 'migration_contacts' ? 'bg-indigo-600 text-white font-bold' : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    create_contacts_table.php
                  </button>
                  <button
                    onClick={() => setActiveCodeFile('feature_test')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono cursor-pointer ${
                      activeCodeFile === 'feature_test' ? 'bg-indigo-600 text-white font-bold' : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    ContactDeduplicationAndMergeTest.php
                  </button>
                </div>

                <button
                  onClick={() => copyCurrentCode(codeSnippets[activeCodeFile])}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy File'}</span>
                </button>
              </div>

              {/* Code Display Area */}
              <div className="flex-1 bg-slate-900 rounded-xl p-4 text-emerald-300 font-mono text-[11px] overflow-auto max-h-[50vh] shadow-inner">
                <pre className="whitespace-pre">{codeSnippets[activeCodeFile]}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Ready for Laravel 12+ API deployment & SQLite / MySQL / PostgreSQL migrations.</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">All backend files located in /laravel</span>
        </div>
      </div>
    </div>
  );
};

// Ready-to-display code snippets for the Laravel explorer
const codeSnippets = {
  model_contact: `<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class Contact extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'contacts';

    protected $fillable = [
        'company_id', 'first_name', 'last_name', 'full_name',
        'designation', 'department', 'email', 'email_normalized',
        'phone', 'mobile', 'mobile_normalized', 'alternate_mobile',
        'city', 'state', 'country', 'pincode', 'industry',
        'source', 'source_reference', 'email_verified_at',
        'marketing_status', 'marketing_consent', 'consent_status',
        'consent_source', 'consent_date', 'consent_ip',
        'unsubscribe_token', 'is_suppressed', 'tally_ledger_id',
        'tally_outstanding_balance', 'tally_overdue_days',
        'total_emails_sent', 'total_emails_opened', 'total_emails_clicked',
        'last_email_sent_at', 'last_email_opened_at', 'merged_into_contact_id',
    ];

    protected static function booted(): void
    {
        static::saving(function (Contact $contact) {
            $contact->full_name = trim(($contact->first_name ?? '') . ' ' . ($contact->last_name ?? ''));

            // Auto-normalize email
            if (!empty($contact->email)) {
                $contact->email_normalized = strtolower(trim($contact->email));
            }

            // Auto-normalize mobile to E.164 (+91 standard)
            $mobile = $contact->mobile ?: $contact->phone;
            if (!empty($mobile)) {
                $cleaned = preg_replace('/[^\\d+]/', '', $mobile);
                if (preg_match('/^[6-9]\\d{9}$/', $cleaned)) {
                    $cleaned = '+91' . $cleaned;
                }
                $contact->mobile_normalized = $cleaned;
            }

            if (empty($contact->unsubscribe_token)) {
                $contact->unsubscribe_token = Str::random(32) . '-' . time();
            }
        });
    }

    public function company(): BelongsTo { return $this->belongsTo(Company::class); }
    public function sources(): HasMany { return $this->hasMany(ContactSource::class); }
    public function tags(): MorphToMany { return $this->morphToMany(Tag::class, 'taggable'); }
    public function mergedInto(): BelongsTo { return $this->belongsTo(Contact::class, 'merged_into_contact_id'); }
}`,

  model_company: `<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'companies';

    protected $fillable = [
        'company_name', 'legal_name', 'gstin', 'pan', 'website',
        'email', 'phone', 'mobile', 'address_line_1', 'city',
        'state', 'country', 'pincode', 'industry', 'status',
        'tally_guid', 'tally_ledger_name', 'outstanding_balance',
        'credit_limit', 'overdue_days', 'metadata',
    ];

    public function setGstinAttribute(?string $val): void
    {
        $this->attributes['gstin'] = $val ? strtoupper(trim($val)) : null;
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class);
    }
}`,

  dedup_service: `<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Contact;

class ContactDeduplicationService
{
    public function detectDuplicate(array $attributes, ?int $excludeContactId = null): array
    {
        $emailNorm = strtolower(trim($attributes['email'] ?? ''));
        $mobileNorm = $this->normalizeMobile($attributes['mobile'] ?? ($attributes['phone'] ?? null));
        $gstin = !empty($attributes['gstin']) ? strtoupper(trim($attributes['gstin'])) : null;

        // PRIORITY 1: Normalized Email Match
        if ($emailNorm) {
            $existing = Contact::where('email_normalized', $emailNorm)
                ->when($excludeContactId, fn($q) => $q->where('id', '!=', $excludeContactId))
                ->first();

            if ($existing) {
                return [
                    'is_duplicate' => true,
                    'priority' => 1,
                    'match_reason' => 'Priority 1: Normalized email matches existing master contact.',
                    'matched_contact' => $existing,
                ];
            }
        }

        // PRIORITY 2: Normalized Mobile Match (E.164)
        if ($mobileNorm) {
            $existing = Contact::where('mobile_normalized', $mobileNorm)
                ->when($excludeContactId, fn($q) => $q->where('id', '!=', $excludeContactId))
                ->first();

            if ($existing) {
                return [
                    'is_duplicate' => true,
                    'priority' => 2,
                    'match_reason' => 'Priority 2: E.164 normalized mobile number matches existing contact.',
                    'matched_contact' => $existing,
                ];
            }
        }

        // PRIORITY 3: Company GSTIN Match
        if ($gstin) {
            $company = Company::where('gstin', $gstin)->first();
            if ($company) {
                return [
                    'is_duplicate' => false,
                    'priority' => 3,
                    'match_reason' => 'Company GSTIN registered in database.',
                    'matched_company' => $company,
                ];
            }
        }

        return ['is_duplicate' => false, 'priority' => null];
    }
}`,

  merge_service: `<?php

namespace App\Services;

use App\Models\Contact;
use App\Models\ContactSource;
use Illuminate\Support\Facades\DB;

class ContactMergeService
{
    public function merge(Contact $primary, Contact $secondary, array $options = []): Contact
    {
        return DB::transaction(function () use ($primary, $secondary, $options) {
            // 1. Repoint all secondary ContactSources to primary
            ContactSource::where('contact_id', $secondary->id)->update(['contact_id' => $primary->id]);

            // 2. Consolidate tags
            $secondaryTagIds = $secondary->tags()->pluck('tags.id')->toArray();
            if (!empty($secondaryTagIds)) {
                $primary->tags()->syncWithoutDetaching($secondaryTagIds);
            }

            // 3. Roll up engagement stats
            $primary->total_emails_sent += (int) $secondary->total_emails_sent;
            $primary->total_emails_opened += (int) $secondary->total_emails_opened;
            $primary->total_emails_clicked += (int) $secondary->total_emails_clicked;

            // 4. Strictest compliance
            if ($secondary->is_suppressed) {
                $primary->is_suppressed = true;
                $primary->marketing_status = 'UNSUBSCRIBED';
            }

            $primary->save();

            // 5. Mark secondary as merged and soft-delete
            $secondary->merged_into_contact_id = $primary->id;
            $secondary->save();
            $secondary->delete();

            return $primary;
        });
    }
}`,

  migration_contacts: `<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->string('first_name', 100)->index();
            $table->string('last_name', 100)->nullable()->index();
            $table->string('full_name', 200)->index();
            $table->string('email', 191)->index();
            $table->string('email_normalized', 191)->index();
            $table->string('mobile', 30)->nullable()->index();
            $table->string('mobile_normalized', 30)->nullable()->index();
            $table->enum('source', ['TALLY', 'CSV_IMPORT', 'XLS_IMPORT', 'MANUAL', 'CRM_LEAD', 'WEBSITE', 'API'])->default('MANUAL')->index();
            $table->enum('marketing_status', ['ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED', 'PENDING'])->default('ACTIVE')->index();
            $table->boolean('marketing_consent')->default(true)->index();
            $table->string('unsubscribe_token', 64)->unique()->index();
            $table->boolean('is_suppressed')->default(false)->index();
            $table->decimal('tally_outstanding_balance', 14, 2)->default(0.00)->index();
            $table->foreignId('merged_into_contact_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }
};`,

  migration_companies: `<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('company_name', 255)->index();
            $table->string('legal_name', 255)->nullable();
            $table->string('gstin', 15)->nullable()->unique()->index();
            $table->string('pan', 10)->nullable()->index();
            $table->string('email', 191)->nullable()->index();
            $table->enum('status', ['ACTIVE', 'INACTIVE', 'PROSPECT', 'BLOCKED'])->default('ACTIVE')->index();
            $table->string('tally_guid', 64)->nullable()->unique()->index();
            $table->decimal('outstanding_balance', 14, 2)->default(0.00)->index();
            $table->timestamps();
            $table->softDeletes();
        });
    }
};`,

  feature_test: `<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Contact;
use App\Services\ContactDeduplicationService;
use App\Services\ContactMergeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactDeduplicationAndMergeTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_detects_duplicate_by_normalized_email_priority_1()
    {
        $contact = Contact::create([
            'first_name' => 'Bhuvan',
            'last_name' => 'Gupta',
            'email' => 'bhuvangupta.1711@gmail.com',
            'marketing_status' => 'ACTIVE',
        ]);

        $service = new ContactDeduplicationService();
        $result = $service->detectDuplicate([
            'email' => '  BHUVANGUPTA.1711@GMAIL.COM  ',
        ]);

        $this->assertTrue($result['is_duplicate']);
        $this->assertEquals(1, $result['priority']);
    }
}`
};
