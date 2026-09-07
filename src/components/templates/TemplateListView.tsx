import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Eye, 
  Edit3, 
  History, 
  Send, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Sparkles,
  FileCheck,
  Tag,
  AlertCircle
} from 'lucide-react';
import { ManagedEmailTemplate, EmailTemplateCategory, EmailTemplateStatus } from '../../types';

interface TemplateListViewProps {
  templates: ManagedEmailTemplate[];
  onSelectTemplateForEdit: (template: ManagedEmailTemplate) => void;
  onSelectTemplateForPreview: (template: ManagedEmailTemplate) => void;
  onSelectTemplateForTestEmail: (template: ManagedEmailTemplate) => void;
  onSelectTemplateForVersions: (template: ManagedEmailTemplate) => void;
  onCreateNewTemplate: (category?: EmailTemplateCategory) => void;
  onDuplicateTemplate: (template: ManagedEmailTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
}

export const TemplateListView: React.FC<TemplateListViewProps> = ({
  templates,
  onSelectTemplateForEdit,
  onSelectTemplateForPreview,
  onSelectTemplateForTestEmail,
  onSelectTemplateForVersions,
  onCreateNewTemplate,
  onDuplicateTemplate,
  onDeleteTemplate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const categories: EmailTemplateCategory[] = [
    'Corporate',
    'Promotional',
    'Newsletter',
    'Product Launch',
    'Festival',
    'Offer',
    'Informational',
    'Renewal Reminder'
  ];

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subjectDefault.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const activeCount = templates.filter(t => t.status === 'ACTIVE').length;
  const draftCount = templates.filter(t => t.status === 'DRAFT').length;

  const getCategoryColor = (cat: EmailTemplateCategory) => {
    switch (cat) {
      case 'Corporate': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Promotional': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Newsletter': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Product Launch': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Festival': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Offer': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Informational': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'Renewal Reminder': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP METRICS RIBBON */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Templates</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{templates.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">8 Standard Categories</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active in Production</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Ready for campaign dispatch</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Draft &amp; Archived</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{draftCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Work in progress / snapshots</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Client Compatibility</div>
            <div className="text-2xl font-bold text-indigo-600 mt-1">100%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">600px Table &bull; Outlook MSO</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. SEARCH, FILTERS & ACTION BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates by name, subject, or description..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="DRAFT">Drafts</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid Card View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${
                viewMode === 'table' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Dense Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Create Button with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Template
            </button>

            {showCreateMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-20 text-xs">
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Create from Preset
                </div>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setShowCreateMenu(false);
                      onCreateNewTemplate(cat);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                  >
                    <span>{cat} Preset</span>
                    <span className="text-[10px] text-slate-400">10 Sections</span>
                  </button>
                ))}
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={() => {
                    setShowCreateMenu(false);
                    onCreateNewTemplate();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-blue-600 font-semibold"
                >
                  Start with Blank Canvas
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-2 border-t border-slate-100">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories ({templates.length})
          </button>
          {categories.map((cat) => {
            const count = templates.filter(t => t.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. TEMPLATES GRID / TABLE VIEW */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No templates found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No email templates match your active filters or search terms. Try clearing search filters or creating a new template.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedStatus('ALL');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col group"
            >
              {/* Thumbnail Container */}
              <div className="relative h-44 bg-slate-100 overflow-hidden border-b border-slate-200">
                {template.thumbnail ? (
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400 font-mono text-xs">
                    600px Responsive HTML
                  </div>
                )}

                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border shadow-xs ${getCategoryColor(template.category)}`}>
                    {template.category}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-900/80 text-white backdrop-blur-xs">
                    v{template.version}.0
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full uppercase shadow-xs ${
                    template.status === 'ACTIVE'
                      ? 'bg-emerald-500 text-white'
                      : template.status === 'DRAFT'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-500 text-white'
                  }`}>
                    {template.status}
                  </span>
                </div>

                {/* Hover Quick Actions */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 p-4">
                  <button
                    onClick={() => onSelectTemplateForPreview(template)}
                    className="p-2.5 bg-white text-slate-800 rounded-full hover:bg-slate-100 shadow-md transition-transform hover:scale-110"
                    title="Quick Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onSelectTemplateForTestEmail(template)}
                    className="p-2.5 bg-white text-blue-600 rounded-full hover:bg-slate-100 shadow-md transition-transform hover:scale-110"
                    title="Send Test Email"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onSelectTemplateForVersions(template)}
                    className="p-2.5 bg-white text-indigo-600 rounded-full hover:bg-slate-100 shadow-md transition-transform hover:scale-110"
                    title="Version History"
                  >
                    <History className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs font-mono text-slate-600 line-clamp-1 mt-1 bg-slate-50 p-1 rounded border border-slate-100">
                    Subject: {template.subjectDefault}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-2">
                    {template.description || 'No description provided.'}
                  </p>
                </div>

                {/* Card Meta & Bottom Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onDuplicateTemplate(template)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
                      title="Duplicate Template"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTemplate(template.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                      title="Delete Template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSelectTemplateForEdit(template)}
                      className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md font-semibold text-xs transition-colors ml-1"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      ) : (
        /* DENSE TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Template Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Subject Default</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTemplates.map((template) => (
                <tr key={template.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {template.name}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getCategoryColor(template.category)}`}>
                      {template.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 max-w-xs truncate">
                    {template.subjectDefault}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      template.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : template.status === 'DRAFT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      {template.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                    v{template.version}.0
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => onSelectTemplateForPreview(template)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onSelectTemplateForTestEmail(template)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                        title="Send Test Email"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onSelectTemplateForVersions(template)}
                        className="p-1.5 text-indigo-600 hover:text-indigo-800 rounded hover:bg-indigo-50"
                        title="Versions"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onSelectTemplateForEdit(template)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                        title="Edit Template"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTemplate(template.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
