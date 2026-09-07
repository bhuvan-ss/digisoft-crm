import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Database, 
  Code, 
  Search, 
  Users, 
  ArrowLeft, 
  Building2, 
  CreditCard, 
  Mail, 
  Layers, 
  Eye, 
  Save, 
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Filter
} from 'lucide-react';
import { 
  Segment, 
  SegmentRuleGroup, 
  SegmentRuleCondition, 
  RuleGroupLogicalOperator, 
  SegmentOperator, 
  Contact, 
  Company 
} from '../../types';
import { 
  AVAILABLE_FILTER_FIELDS, 
  OPERATOR_LABELS, 
  PRESET_SEGMENT_TEMPLATES, 
  evaluateRuleTree, 
  compileSegmentToSql, 
  FieldDefinition 
} from '../../utils/segmentEngine';

interface SegmentBuilderStudioProps {
  segmentToEdit?: Segment | null;
  contacts: Contact[];
  companies: Company[];
  onSave: (segmentData: Partial<Segment>) => void;
  onCancel: () => void;
  onPreviewContacts: (matching: Contact[]) => void;
}

export const SegmentBuilderStudio: React.FC<SegmentBuilderStudioProps> = ({
  segmentToEdit,
  contacts,
  companies,
  onSave,
  onCancel,
  onPreviewContacts
}) => {
  // Metadata fields
  const [name, setName] = useState(segmentToEdit?.name || '');
  const [description, setDescription] = useState(segmentToEdit?.description || '');
  const [segmentType, setSegmentType] = useState<'DYNAMIC' | 'STATIC'>(
    segmentToEdit?.segmentType || (segmentToEdit?.isDynamic === false ? 'STATIC' : 'DYNAMIC')
  );
  const [status, setStatus] = useState<'ACTIVE' | 'DRAFT'>(segmentToEdit?.status === 'DRAFT' ? 'DRAFT' : 'ACTIVE');

  // Left Panel Search
  const [fieldSearch, setFieldSearch] = useState('');
  const [showSqlPreview, setShowSqlPreview] = useState(false);

  // Initialize Rule Tree (from existing segment or default)
  const [ruleTree, setRuleTree] = useState<SegmentRuleGroup>(() => {
    if (segmentToEdit?.ruleTree) {
      return segmentToEdit.ruleTree;
    }
    // Default root group
    return {
      id: 'root-group',
      type: 'group',
      logicalOperator: segmentToEdit?.matchType === 'any' ? 'OR' : 'AND',
      children: [
        {
          id: 'cond-1',
          type: 'condition',
          field: 'source',
          category: 'contact',
          operator: 'equals',
          value: 'TALLY'
        },
        {
          id: 'cond-2',
          type: 'condition',
          field: 'marketing_status',
          category: 'contact',
          operator: 'equals',
          value: 'ACTIVE'
        }
      ]
    };
  });

  const companyMap = useMemo(() => new Map(companies.map(c => [c.id, c])), [companies]);

  // Live matching contacts
  const matchingContacts = useMemo(() => {
    return contacts.filter(c => evaluateRuleTree(ruleTree, c, companyMap));
  }, [ruleTree, contacts, companyMap]);

  // Generated SQL
  const { sql, indexesUsed } = useMemo(() => compileSegmentToSql(ruleTree), [ruleTree]);

  // Handle Preset Loader
  const handleLoadPreset = (presetIndex: number) => {
    const preset = PRESET_SEGMENT_TEMPLATES[presetIndex];
    if (preset) {
      setName(preset.name);
      setDescription(preset.description);
      setRuleTree(JSON.parse(JSON.stringify(preset.group)));
    }
  };

  // Helper functions to mutate tree
  const updateGroupOperator = (groupId: string, operator: RuleGroupLogicalOperator) => {
    const mutate = (grp: SegmentRuleGroup): SegmentRuleGroup => {
      if (grp.id === groupId) {
        return { ...grp, logicalOperator: operator };
      }
      return {
        ...grp,
        children: grp.children.map(child => child.type === 'group' ? mutate(child) : child)
      };
    };
    setRuleTree(mutate(ruleTree));
  };

  const addConditionToGroup = (groupId: string, fieldDef?: FieldDefinition) => {
    const targetField = fieldDef || AVAILABLE_FILTER_FIELDS[0];
    const newCond: SegmentRuleCondition = {
      id: `cond-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'condition',
      field: targetField.id,
      category: targetField.category,
      operator: targetField.defaultOperator,
      value: targetField.options ? targetField.options[0] : (targetField.type === 'number' ? 0 : '')
    };

    const mutate = (grp: SegmentRuleGroup): SegmentRuleGroup => {
      if (grp.id === groupId) {
        return { ...grp, children: [...grp.children, newCond] };
      }
      return {
        ...grp,
        children: grp.children.map(child => child.type === 'group' ? mutate(child) : child)
      };
    };
    setRuleTree(mutate(ruleTree));
  };

  const addNestedGroup = (parentGroupId: string) => {
    const newNested: SegmentRuleGroup = {
      id: `group-${Date.now()}`,
      type: 'group',
      logicalOperator: 'OR',
      children: [
        {
          id: `cond-${Date.now()}`,
          type: 'condition',
          field: 'city',
          category: 'contact',
          operator: 'equals',
          value: 'Delhi'
        }
      ]
    };

    const mutate = (grp: SegmentRuleGroup): SegmentRuleGroup => {
      if (grp.id === parentGroupId) {
        return { ...grp, children: [...grp.children, newNested] };
      }
      return {
        ...grp,
        children: grp.children.map(child => child.type === 'group' ? mutate(child) : child)
      };
    };
    setRuleTree(mutate(ruleTree));
  };

  const removeNode = (nodeId: string) => {
    const mutate = (grp: SegmentRuleGroup): SegmentRuleGroup => {
      return {
        ...grp,
        children: grp.children
          .filter(child => child.id !== nodeId)
          .map(child => child.type === 'group' ? mutate(child) : child)
      };
    };
    setRuleTree(mutate(ruleTree));
  };

  const updateCondition = (condId: string, updates: Partial<SegmentRuleCondition>) => {
    const mutate = (grp: SegmentRuleGroup): SegmentRuleGroup => {
      return {
        ...grp,
        children: grp.children.map(child => {
          if (child.type === 'condition' && child.id === condId) {
            const updated = { ...child, ...updates };
            // If field changed, update category and default operator
            if (updates.field && updates.field !== child.field) {
              const def = AVAILABLE_FILTER_FIELDS.find(f => f.id === updates.field);
              if (def) {
                updated.category = def.category;
                updated.operator = def.defaultOperator;
                updated.value = def.options ? def.options[0] : (def.type === 'number' ? 0 : '');
              }
            }
            return updated;
          }
          if (child.type === 'group') {
            return mutate(child);
          }
          return child;
        })
      };
    };
    setRuleTree(mutate(ruleTree));
  };

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      id: segmentToEdit?.id,
      name,
      description: description || `Target audience with ${matchingContacts.length} qualified contacts`,
      segmentType,
      isDynamic: segmentType === 'DYNAMIC',
      status,
      ruleTree,
      matchType: ruleTree.logicalOperator === 'AND' ? 'all' : 'any',
      rules: ruleTree,
      totalContacts: matchingContacts.length,
      estimatedCount: matchingContacts.length,
      cachedCount: matchingContacts.length,
      cachedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  // Filter available fields for left column
  const filteredFields = AVAILABLE_FILTER_FIELDS.filter(f => 
    f.name.toLowerCase().includes(fieldSearch.toLowerCase()) ||
    f.id.toLowerCase().includes(fieldSearch.toLowerCase()) ||
    f.category.toLowerCase().includes(fieldSearch.toLowerCase())
  );

  const fieldsByCategory = {
    contact: filteredFields.filter(f => f.category === 'contact'),
    company: filteredFields.filter(f => f.category === 'company'),
    tally: filteredFields.filter(f => f.category === 'tally'),
    activity: filteredFields.filter(f => f.category === 'activity'),
  };

  // Recursive Group Renderer
  const renderRuleGroup = (group: SegmentRuleGroup, isRoot = false) => {
    return (
      <div 
        key={group.id} 
        className={`rounded-2xl transition ${
          isRoot 
            ? 'p-4 sm:p-5 bg-white border border-slate-200 shadow-xs space-y-4' 
            : 'p-3 sm:p-4 bg-slate-50/70 border-2 border-dashed border-slate-200 space-y-3'
        }`}
      >
        {/* Group Header */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Match</span>
            <div className="inline-flex rounded-lg bg-slate-200 p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => updateGroupOperator(group.id, 'AND')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  group.logicalOperator === 'AND' 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AND (All Rules)
              </button>
              <button
                type="button"
                onClick={() => updateGroupOperator(group.id, 'OR')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  group.logicalOperator === 'OR' 
                    ? 'bg-amber-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                OR (Any Rule)
              </button>
            </div>
            {!isRoot && (
              <span className="text-[10px] text-slate-400 font-mono">
                Nested Group ({group.children.length} items)
              </span>
            )}
          </div>

          {!isRoot && (
            <button
              type="button"
              onClick={() => removeNode(group.id)}
              className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition"
              title="Delete Nested Group"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Children Rows */}
        <div className="space-y-2.5">
          {group.children.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">
              No rules added yet. Click &quot;Add Condition&quot; or select a field from the left panel.
            </div>
          ) : (
            group.children.map((child, idx) => {
              if (child.type === 'group') {
                return (
                  <div key={child.id} className="relative pl-3 border-l-2 border-indigo-300 my-2">
                    {renderRuleGroup(child, false)}
                  </div>
                );
              }

              // Condition Row
              const cond = child;
              const fieldDef = AVAILABLE_FILTER_FIELDS.find(f => f.id === cond.field) || AVAILABLE_FILTER_FIELDS[0];

              return (
                <div 
                  key={cond.id} 
                  className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition shadow-2xs"
                >
                  {/* Field Selector */}
                  <div className="w-full sm:w-48">
                    <select
                      value={cond.field}
                      onChange={(e) => updateCondition(cond.id, { field: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <optgroup label="👤 Contact Fields">
                        {AVAILABLE_FILTER_FIELDS.filter(f => f.category === 'contact').map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="🏢 Company Details">
                        {AVAILABLE_FILTER_FIELDS.filter(f => f.category === 'company').map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="📊 Tally Financials">
                        {AVAILABLE_FILTER_FIELDS.filter(f => f.category === 'tally').map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="⚡ Email Engagement">
                        {AVAILABLE_FILTER_FIELDS.filter(f => f.category === 'activity').map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Operator Selector */}
                  <div className="w-full sm:w-40">
                    <select
                      value={cond.operator}
                      onChange={(e) => updateCondition(cond.id, { operator: e.target.value as SegmentOperator })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {fieldDef.allowedOperators.map(op => (
                        <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dynamic Value Input */}
                  <div className="flex-1 min-w-[160px]">
                    {cond.operator === 'is_empty' || cond.operator === 'is_not_empty' ? (
                      <div className="p-2 text-[11px] text-slate-400 italic bg-slate-50 rounded-lg border border-slate-200">
                        No value required for empty checks
                      </div>
                    ) : fieldDef.type === 'select' && fieldDef.options && (cond.operator === 'equals' || cond.operator === 'not_equals') ? (
                      <select
                        value={cond.value}
                        onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {fieldDef.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : cond.operator === 'in' || cond.operator === 'not_in' ? (
                      <input
                        type="text"
                        value={Array.isArray(cond.value) ? cond.value.join(', ') : cond.value}
                        onChange={(e) => updateCondition(cond.id, { 
                          value: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                        })}
                        placeholder="Comma-separated e.g. Noida, Gurgaon, Delhi"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    ) : fieldDef.type === 'number' ? (
                      <input
                        type="number"
                        value={cond.value}
                        onChange={(e) => updateCondition(cond.id, { value: Number(e.target.value) })}
                        placeholder={fieldDef.placeholder || '0'}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                      />
                    ) : fieldDef.type === 'date' ? (
                      <input
                        type="date"
                        value={cond.value || ''}
                        onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    ) : (
                      <input
                        type="text"
                        value={cond.value || ''}
                        onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                        placeholder={fieldDef.placeholder || 'Enter value...'}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeNode(cond.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition self-end sm:self-center"
                    title="Remove Condition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Action Buttons for Group */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => addConditionToGroup(group.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Condition</span>
          </button>

          <button
            type="button"
            onClick={() => addNestedGroup(group.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Nested Group (AND / OR)</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Presets Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            title="Back to Segments List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {segmentToEdit ? `Edit Segment: ${segmentToEdit.name}` : 'Visual Contact Segment Builder Studio'}
            </h2>
            <p className="text-xs text-slate-500">
              Construct recursive Boolean rules with zero SQL. Dynamic segments update in realtime as contacts change.
            </p>
          </div>
        </div>

        {/* Quick Presets Dropdown */}
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Preset Template:</span>
          </div>
          <select
            onChange={(e) => {
              if (e.target.value !== '') {
                handleLoadPreset(Number(e.target.value));
              }
            }}
            defaultValue=""
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="" disabled>Select Example Rule Template...</option>
            {PRESET_SEGMENT_TEMPLATES.map((p, idx) => (
              <option key={idx} value={idx}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3-COLUMN STUDIO LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUMN 1 (Left 3 cols): Available Filter Fields */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 sticky top-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Available Fields
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {filteredFields.length} attributes
            </span>
          </div>

          {/* Search Fields */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search fields..."
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <p className="text-[10px] text-slate-400">
            Click any field to add it to the active rule builder group:
          </p>

          {/* Categorized Fields List */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {/* Contact Fields */}
            {fieldsByCategory.contact.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-3 h-3 text-indigo-500" />
                  <span>Contact Properties</span>
                </div>
                <div className="space-y-0.5">
                  {fieldsByCategory.contact.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => addConditionToGroup(ruleTree.id, f)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition flex items-center justify-between group cursor-pointer"
                    >
                      <span>{f.name}</span>
                      <Plus className="w-3 h-3 text-slate-300 group-hover:text-indigo-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Company Details */}
            {fieldsByCategory.company.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-sky-500" />
                  <span>Company Properties</span>
                </div>
                <div className="space-y-0.5">
                  {fieldsByCategory.company.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => addConditionToGroup(ruleTree.id, f)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition flex items-center justify-between group cursor-pointer"
                    >
                      <span>{f.name}</span>
                      <Plus className="w-3 h-3 text-slate-300 group-hover:text-sky-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tally Financials */}
            {fieldsByCategory.tally.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-amber-500" />
                  <span>Tally Financials</span>
                </div>
                <div className="space-y-0.5">
                  {fieldsByCategory.tally.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => addConditionToGroup(ruleTree.id, f)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition flex items-center justify-between group cursor-pointer"
                    >
                      <span>{f.name}</span>
                      <Plus className="w-3 h-3 text-slate-300 group-hover:text-amber-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Email Activity */}
            {fieldsByCategory.activity.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Mail className="w-3 h-3 text-emerald-500" />
                  <span>Email Activity</span>
                </div>
                <div className="space-y-0.5">
                  {fieldsByCategory.activity.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => addConditionToGroup(ruleTree.id, f)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition flex items-center justify-between group cursor-pointer"
                    >
                      <span>{f.name}</span>
                      <Plus className="w-3 h-3 text-slate-300 group-hover:text-emerald-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2 (Center 6 cols): Visual Rule Builder */}
        <div className="lg:col-span-6 space-y-4">
          {/* Segment Name & Configuration Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Segment Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tally Customers in Delhi NCR"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Segment Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSegmentType('DYNAMIC')}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                      segmentType === 'DYNAMIC'
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">Dynamic</div>
                    <div className="text-[10px] text-slate-400">Live query evaluation</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSegmentType('STATIC')}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                      segmentType === 'STATIC'
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">Static</div>
                    <div className="text-[10px] text-slate-400">Pinned contact IDs</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="ACTIVE">Active (Available for campaigns)</option>
                  <option value="DRAFT">Draft (Work in progress)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Marketing Purpose
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Inactive enterprise accounts for reactivation campaign"
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          {/* Visual Rule Builder Tree */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                Rule Conditions & Nested Groups
              </span>
              <span className="text-[11px] text-slate-500">
                Evaluating {matchingContacts.length} of {contacts.length} total contacts
              </span>
            </div>

            {renderRuleGroup(ruleTree, true)}
          </div>
        </div>

        {/* COLUMN 3 (Right 3 cols): Audience Telemetry & Actions */}
        <div className="lg:col-span-3 space-y-4 sticky top-4">
          {/* Matching Contact Count Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-center space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Matching Audience
            </span>

            <div className="py-2">
              <div className="text-4xl font-extrabold text-indigo-600 tracking-tight font-mono">
                {matchingContacts.length}
              </div>
              <div className="text-xs font-semibold text-slate-700 mt-1">
                Qualified Contacts
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {contacts.length > 0 ? ((matchingContacts.length / contacts.length) * 100).toFixed(1) : 0}% of contact database
              </div>
            </div>

            {/* Suppression Notice */}
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 text-left flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Suppression Lock Active:</strong> Unsubscribed and hard-bounced contacts are automatically excluded from final deliveries.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onPreviewContacts(matchingContacts)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Preview Contacts ({matchingContacts.length})</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={!name.trim()}
                className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Segment</span>
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Cancel & Return
              </button>
            </div>
          </div>

          {/* SQL Preview Toggle */}
          <div className="bg-slate-900 rounded-2xl p-4 text-slate-200 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-mono">
                <Code className="w-3.5 h-3.5" />
                Compiled SQL Query
              </span>
              <button
                type="button"
                onClick={() => setShowSqlPreview(!showSqlPreview)}
                className="text-[10px] text-slate-400 hover:text-white"
              >
                {showSqlPreview ? 'Hide SQL' : 'View SQL'}
              </button>
            </div>

            <div className="text-[10px] text-slate-400">
              Indexed columns: {indexesUsed.map(idx => (
                <span key={idx} className="font-mono text-emerald-400 mr-1">{idx}</span>
              ))}
            </div>

            {showSqlPreview && (
              <pre className="text-[10px] font-mono leading-relaxed text-slate-300 overflow-x-auto p-2.5 bg-slate-950 rounded-xl max-h-48 border border-slate-800">
                {sql}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
