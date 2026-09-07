import React, { useState } from 'react';
import { 
  Plus, 
  Mail, 
  List, 
  Sparkles, 
  BarChart3, 
  Layers, 
  FileEdit,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Smartphone,
  Monitor,
  Code
} from 'lucide-react';
import { 
  Campaign, 
  Segment, 
  Contact, 
  ManagedEmailTemplate, 
  CampaignStatus 
} from '../types';
import { CampaignList } from './CampaignList';
import { CampaignWizard } from './CampaignWizard';
import { CampaignDetailsModal } from './CampaignDetailsModal';

interface CampaignStudioProps {
  campaigns: Campaign[];
  segments: Segment[];
  contacts: Contact[];
  managedTemplates?: ManagedEmailTemplate[];
  preselectedSegment?: Segment | null;
  onLaunchCampaign: (newCampaign: Partial<Campaign>) => void;
  onUpdateCampaign?: (updated: Campaign) => void;
  onSendTestEmail: (email: { to: string; subject: string; html: string; campaignName: string }) => void;
  onNavigateToTemplates?: () => void;
}

export const CampaignStudio: React.FC<CampaignStudioProps> = ({
  campaigns,
  segments,
  contacts,
  managedTemplates = [],
  preselectedSegment,
  onLaunchCampaign,
  onUpdateCampaign,
  onSendTestEmail,
  onNavigateToTemplates
}) => {
  // Current mode: 'list' | 'wizard'
  const [activeView, setActiveView] = useState<'list' | 'wizard'>(
    preselectedSegment ? 'wizard' : 'list'
  );

  // Selected campaign for modal details view
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Quick Action Handlers
  const handleApprove = (campaignId: string) => {
    const target = campaigns.find(c => c.id === campaignId);
    if (!target) return;
    const updated: Campaign = {
      ...target,
      status: 'APPROVED',
      approved_by: 'Managing Director (Compliance Sign-off)',
      updated_at: new Date().toISOString(),
      activity_log: [
        ...(target.activity_log || []),
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Campaign Approved & Snapshot Frozen',
          user: 'Managing Director',
          details: 'Approved by compliance officer. Recipient snapshot locked in database.'
        }
      ]
    };
    if (onUpdateCampaign) onUpdateCampaign(updated);
    if (selectedCampaign?.id === campaignId) setSelectedCampaign(updated);
  };

  const handleDispatch = (campaignId: string) => {
    const target = campaigns.find(c => c.id === campaignId);
    if (!target) return;
    const updated: Campaign = {
      ...target,
      status: 'PROCESSING',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      activity_log: [
        ...(target.activity_log || []),
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Queue Dispatched',
          user: 'System Worker',
          details: 'Dispatched to Horizon background queue workers.'
        }
      ]
    };
    if (onUpdateCampaign) onUpdateCampaign(updated);
    if (selectedCampaign?.id === campaignId) setSelectedCampaign(updated);
  };

  const handlePause = (campaignId: string) => {
    const target = campaigns.find(c => c.id === campaignId);
    if (!target) return;
    const updated: Campaign = {
      ...target,
      status: 'PAUSED',
      updated_at: new Date().toISOString(),
      activity_log: [
        ...(target.activity_log || []),
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Campaign Paused',
          user: 'Admin',
          details: 'Queue workers paused transmission.'
        }
      ]
    };
    if (onUpdateCampaign) onUpdateCampaign(updated);
    if (selectedCampaign?.id === campaignId) setSelectedCampaign(updated);
  };

  const handleResume = (campaignId: string) => {
    const target = campaigns.find(c => c.id === campaignId);
    if (!target) return;
    const updated: Campaign = {
      ...target,
      status: 'PROCESSING',
      updated_at: new Date().toISOString(),
      activity_log: [
        ...(target.activity_log || []),
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Campaign Resumed',
          user: 'Admin',
          details: 'Transmission resumed.'
        }
      ]
    };
    if (onUpdateCampaign) onUpdateCampaign(updated);
    if (selectedCampaign?.id === campaignId) setSelectedCampaign(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top View Toggle Navigation */}
      <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('list')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
              activeView === 'list'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <List className="w-4 h-4" />
            Campaigns Registry ({campaigns.length})
          </button>

          <button
            onClick={() => setActiveView('wizard')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
              activeView === 'wizard'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Plus className="w-4 h-4" />
            8-Step Campaign Wizard
          </button>
        </div>

        <div className="text-xs text-slate-500 hidden sm:block">
          Phase 7: Full Campaign Management • Segregation of Duties Enforced
        </div>
      </div>

      {/* View 1: Campaign List */}
      {activeView === 'list' && (
        <CampaignList
          campaigns={campaigns}
          onSelectCampaign={(c) => setSelectedCampaign(c)}
          onNewCampaign={() => setActiveView('wizard')}
          onApproveCampaign={handleApprove}
          onDispatchCampaign={handleDispatch}
          onPauseCampaign={handlePause}
          onResumeCampaign={handleResume}
        />
      )}

      {/* View 2: Campaign 8-Step Wizard */}
      {activeView === 'wizard' && (
        <CampaignWizard
          segments={segments}
          contacts={contacts}
          managedTemplates={managedTemplates}
          preselectedSegment={preselectedSegment}
          onSaveDraft={(payload) => {
            onLaunchCampaign({ ...payload, status: 'DRAFT' });
            setActiveView('list');
          }}
          onSubmitReview={(payload) => {
            onLaunchCampaign({ ...payload, status: 'REVIEW' });
            setActiveView('list');
          }}
          onApproveAndDispatch={(payload, scheduleDate) => {
            const finalStatus = scheduleDate ? 'SCHEDULED' : 'PROCESSING';
            onLaunchCampaign({
              ...payload,
              status: finalStatus,
              approved_by: 'Managing Director (Compliance Sign-off)',
              scheduled_at: scheduleDate
            });
            setActiveView('list');
          }}
          onSendTestEmail={onSendTestEmail}
          onCancel={() => setActiveView('list')}
        />
      )}

      {/* 6-Tab Campaign Details Modal */}
      {selectedCampaign && (
        <CampaignDetailsModal
          campaign={selectedCampaign}
          allContacts={contacts}
          allSegments={segments}
          onClose={() => setSelectedCampaign(null)}
          onApprove={handleApprove}
          onDispatch={handleDispatch}
          onPause={handlePause}
          onResume={handleResume}
          onOpenTestModal={() => {
            onSendTestEmail({
              to: 'bhuvangupta.1711@gmail.com',
              subject: `[TEST] ${selectedCampaign.subject}`,
              html: selectedCampaign.html_content,
              campaignName: selectedCampaign.name
            });
          }}
        />
      )}
    </div>
  );
};
