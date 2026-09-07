import React, { useState } from 'react';
import { 
  Users, 
  Sparkles, 
  Layers, 
  Plus, 
  Search, 
  CheckCircle2, 
  ShieldCheck, 
  Database,
  ArrowRight,
  SlidersHorizontal,
  Code
} from 'lucide-react';
import { Segment, Contact, Company } from '../types';
import { SegmentListView } from './segmentation/SegmentListView';
import { SegmentBuilderStudio } from './segmentation/SegmentBuilderStudio';
import { SegmentContactPreviewDrawer } from './segmentation/SegmentContactPreviewDrawer';
import { evaluateRuleTree } from '../utils/segmentEngine';

interface DynamicSegmentsProps {
  segments: Segment[];
  contacts: Contact[];
  companies?: Company[];
  onSaveSegment: (segment: Partial<Segment>) => void;
  onLaunchCampaignForSegment: (segment: Segment) => void;
  onDeleteSegment?: (segmentId: string) => void;
  onDuplicateSegment?: (segment: Segment) => void;
}

export const DynamicSegments: React.FC<DynamicSegmentsProps> = ({
  segments,
  contacts,
  companies = [],
  onSaveSegment,
  onLaunchCampaignForSegment,
  onDeleteSegment,
  onDuplicateSegment
}) => {
  // Modes: 'LIST' or 'BUILDER'
  const [viewMode, setViewMode] = useState<'LIST' | 'BUILDER'>('LIST');
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);

  // Preview Drawer State
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [previewSegmentName, setPreviewSegmentName] = useState('');
  const [previewMatchingContacts, setPreviewMatchingContacts] = useState<Contact[]>([]);

  const companyMap = new Map<string, Company>(companies.map(c => [c.id, c] as [string, Company]));

  const handleOpenBuilder = (segmentToEdit?: Segment) => {
    setEditingSegment(segmentToEdit || null);
    setViewMode('BUILDER');
  };

  const handleSaveAndReturn = (segmentData: Partial<Segment>) => {
    onSaveSegment(segmentData);
    setViewMode('LIST');
    setEditingSegment(null);
  };

  const handleCancelBuilder = () => {
    setViewMode('LIST');
    setEditingSegment(null);
  };

  const handlePreviewContactsFromList = (segment: Segment) => {
    let matching: Contact[] = [];
    if (segment.ruleTree) {
      matching = contacts.filter(c => evaluateRuleTree(segment.ruleTree!, c, companyMap));
    } else {
      // Legacy fallback
      matching = contacts.filter(c => {
        if (c.isSuppressed) return false;
        if (!segment.rules || segment.rules.length === 0) return true;
        return true;
      });
    }

    setPreviewSegmentName(segment.name);
    setPreviewMatchingContacts(matching);
    setPreviewDrawerOpen(true);
  };

  const handlePreviewContactsFromStudio = (matching: Contact[]) => {
    setPreviewSegmentName(editingSegment?.name || 'Current Rule Builder Draft');
    setPreviewMatchingContacts(matching);
    setPreviewDrawerOpen(true);
  };

  const handleDelete = (segmentId: string) => {
    if (onDeleteSegment) {
      onDeleteSegment(segmentId);
    }
  };

  const handleDuplicate = (segment: Segment) => {
    if (onDuplicateSegment) {
      onDuplicateSegment(segment);
    } else {
      const duplicated: Partial<Segment> = {
        name: `${segment.name} (Copy)`,
        description: segment.description,
        segmentType: segment.segmentType,
        isDynamic: segment.isDynamic,
        status: 'DRAFT',
        ruleTree: segment.ruleTree ? JSON.parse(JSON.stringify(segment.ruleTree)) : undefined,
        matchType: segment.matchType,
        rules: segment.rules ? JSON.parse(JSON.stringify(segment.rules)) : [],
        totalContacts: segment.totalContacts,
        estimatedCount: segment.estimatedCount,
        cachedCount: segment.cachedCount
      };
      onSaveSegment(duplicated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Banner & Architecture Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Phase 4: Contact Segmentation Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Dynamic Customer Segmentation Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Create reusable customer segments without writing SQL. Build Boolean rules with nested groups, 
              evaluating Contact attributes, Company firmographics, Tally financials, and Email activity in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {viewMode === 'LIST' ? (
              <button
                onClick={() => handleOpenBuilder()}
                className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Segment</span>
              </button>
            ) : (
              <button
                onClick={handleCancelBuilder}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition flex items-center gap-2 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Return to Segment Catalog</span>
              </button>
            )}
          </div>
        </div>

        {/* Feature Pills */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero Data Duplication (Parameterized Dynamic Queries)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nested AND / OR Boolean Logic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Redis / Column Cached Counts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Built-in Marketing Suppression Protection</span>
          </div>
        </div>
      </div>

      {/* Main Content: List View vs Builder Studio */}
      {viewMode === 'LIST' ? (
        <SegmentListView
          segments={segments}
          contacts={contacts}
          companies={companies}
          onOpenBuilder={handleOpenBuilder}
          onSelectPreviewSegment={handlePreviewContactsFromList}
          onLaunchCampaign={onLaunchCampaignForSegment}
          onDeleteSegment={handleDelete}
          onDuplicateSegment={handleDuplicate}
        />
      ) : (
        <SegmentBuilderStudio
          segmentToEdit={editingSegment}
          contacts={contacts}
          companies={companies}
          onSave={handleSaveAndReturn}
          onCancel={handleCancelBuilder}
          onPreviewContacts={handlePreviewContactsFromStudio}
        />
      )}

      {/* Segment Contact Preview Drawer */}
      <SegmentContactPreviewDrawer
        isOpen={previewDrawerOpen}
        onClose={() => setPreviewDrawerOpen(false)}
        segmentName={previewSegmentName}
        matchingContacts={previewMatchingContacts}
        companies={companies}
      />
    </div>
  );
};
