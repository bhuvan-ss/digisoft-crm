import React, { useState } from 'react';
import { 
  ManagedEmailTemplate, 
  EmailTemplateCategory, 
  EmailTemplateStatus, 
  EmailTemplateVersion, 
  Contact, 
  Company, 
  ESPProvider 
} from '../types';
import { TemplateListView } from './templates/TemplateListView';
import { TemplateEditorStudio } from './templates/TemplateEditorStudio';
import { TemplatePreviewModal } from './templates/TemplatePreviewModal';
import { TemplateVersionModal } from './templates/TemplateVersionModal';
import { SendTestEmailModal } from './templates/SendTestEmailModal';
import { INITIAL_MANAGED_TEMPLATES } from '../data/emailTemplatePresets';

interface EmailTemplatesProps {
  templates: ManagedEmailTemplate[];
  onUpdateTemplates: (templates: ManagedEmailTemplate[]) => void;
  contacts: Contact[];
  companies: Company[];
  onSendTestEmail: (testEmail: {
    to: string;
    subject: string;
    preheader: string;
    html: string;
    provider: ESPProvider;
    templateName: string;
  }) => void;
  onAddAuditLog?: (action: string, module: string, details: string) => void;
}

export const EmailTemplates: React.FC<EmailTemplatesProps> = ({
  templates,
  onUpdateTemplates,
  contacts,
  companies,
  onSendTestEmail,
  onAddAuditLog
}) => {
  // Current view mode: 'list' or 'editor'
  const [currentView, setCurrentView] = useState<'list' | 'editor'>('list');
  const [editingTemplate, setEditingTemplate] = useState<ManagedEmailTemplate | null>(null);

  // Active Modals
  const [previewTemplate, setPreviewTemplate] = useState<ManagedEmailTemplate | null>(null);
  const [versionTemplate, setVersionTemplate] = useState<ManagedEmailTemplate | null>(null);
  const [testEmailTemplate, setTestEmailTemplate] = useState<ManagedEmailTemplate | null>(null);

  // Handlers for template operations
  const handleSelectForEdit = (tmpl: ManagedEmailTemplate) => {
    setEditingTemplate(tmpl);
    setCurrentView('editor');
  };

  const handleBackToList = () => {
    setEditingTemplate(null);
    setCurrentView('list');
  };

  const handleSaveTemplate = (updated: ManagedEmailTemplate, versionSummary?: string) => {
    let finalTemplate = { ...updated };

    if (versionSummary && versionSummary.trim()) {
      const nextVerNum = (finalTemplate.version || 1) + 1;
      const newVersionSnapshot: EmailTemplateVersion = {
        id: `VER-${Date.now()}`,
        templateId: finalTemplate.id,
        versionNumber: nextVerNum,
        name: finalTemplate.name,
        subjectDefault: finalTemplate.subjectDefault,
        preheaderDefault: finalTemplate.preheaderDefault,
        htmlContent: finalTemplate.htmlContent,
        plainTextContent: finalTemplate.plainTextContent,
        changeSummary: versionSummary.trim(),
        createdBy: 'Bhuvan Gupta (Lead Architect)',
        createdAt: new Date().toISOString()
      };

      finalTemplate = {
        ...finalTemplate,
        version: nextVerNum,
        versions: [...(finalTemplate.versions || []), newVersionSnapshot]
      };

      onAddAuditLog?.(
        'Email Template Version Created',
        'EmailTemplates',
        `Saved version v${nextVerNum}.0 for template "${finalTemplate.name}": ${versionSummary}`
      );
    } else {
      onAddAuditLog?.(
        'Email Template Updated',
        'EmailTemplates',
        `Updated content and metadata for template "${finalTemplate.name}"`
      );
    }

    const updatedList = templates.map(t => t.id === finalTemplate.id ? finalTemplate : t);
    onUpdateTemplates(updatedList);
    setEditingTemplate(finalTemplate);
  };

  const handleCreateNewTemplate = (category?: EmailTemplateCategory) => {
    // If a preset exists for this category, use its content as the baseline
    const preset = category ? INITIAL_MANAGED_TEMPLATES.find(t => t.category === category) : null;
    const cat = category || 'Corporate';

    const newId = `TMPL-${Date.now().toString(36).toUpperCase()}`;
    const newTemplate: ManagedEmailTemplate = {
      id: newId,
      name: preset ? `Custom ${cat} Template` : `New ${cat} Template`,
      category: cat,
      description: preset?.description || `Responsive 600px table layout for ${cat} communication.`,
      subjectDefault: preset?.subjectDefault || `Important Update for {{COMPANY_NAME}}`,
      preheaderDefault: preset?.preheaderDefault || `Key points and summary inside for {{FIRST_NAME}}.`,
      htmlContent: preset?.htmlContent || `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Email Template</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,sans-serif;">
  <div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">
    Preview snippet for {{FIRST_NAME}} at {{COMPANY_NAME}} &zwnj;&nbsp;&zwnj;&nbsp;
  </div>
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f8fafc">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="padding:24px 36px;background-color:#0f172a;">
              <img src="{{COMPANY_LOGO}}" alt="Logo" width="130" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td style="padding:32px 36px 16px;">
              <h1 style="margin:0;font-size:24px;color:#0f172a;">Hello {{FIRST_NAME}},</h1>
              <p style="margin:16px 0 0;font-size:15px;line-height:24px;color:#334155;">
                We are pleased to connect with the team at {{COMPANY_NAME}} in {{CITY}}, {{STATE}}.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 36px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius:6px;background-color:#2563eb;">
                    <a href="https://digisoft.com" target="_blank" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">
                      Click Here to Proceed &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 36px;background-color:#0f172a;color:#94a3b8;font-size:11px;line-height:18px;text-align:center;">
              <p style="margin:0 0 6px;">&copy; 2026 DIGISOFT. Registered Address: {{COMPANY_ADDRESS}}</p>
              <p style="margin:0;">
                <a href="{{PRIVACY_POLICY_URL}}" style="color:#60a5fa;">Privacy Policy</a> &bull; 
                <a href="{{UNSUBSCRIBE_URL}}" style="color:#60a5fa;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      plainTextContent: preset?.plainTextContent || `Hello {{FIRST_NAME}},\n\nUpdate for {{COMPANY_NAME}}.\n\nAddress: {{COMPANY_ADDRESS}}\nUnsubscribe: {{UNSUBSCRIBE_URL}}`,
      thumbnail: preset?.thumbnail || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&auto=format&fit=crop&q=80',
      status: 'DRAFT',
      version: 1,
      createdBy: 'Bhuvan Gupta',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versions: [
        {
          id: `VER-${Date.now()}-1`,
          templateId: newId,
          versionNumber: 1,
          name: `Initial Draft (${cat})`,
          subjectDefault: `Important Update for {{COMPANY_NAME}}`,
          preheaderDefault: `Key points and summary inside for {{FIRST_NAME}}.`,
          htmlContent: '',
          plainTextContent: '',
          changeSummary: 'Initial template creation',
          createdBy: 'Bhuvan Gupta',
          createdAt: new Date().toISOString()
        }
      ]
    };

    onAddAuditLog?.(
      'Email Template Created',
      'EmailTemplates',
      `Created new template "${newTemplate.name}" in category ${cat}`
    );

    const updatedList = [newTemplate, ...templates];
    onUpdateTemplates(updatedList);
    setEditingTemplate(newTemplate);
    setCurrentView('editor');
  };

  const handleDuplicateTemplate = (tmpl: ManagedEmailTemplate) => {
    const duplicated: ManagedEmailTemplate = {
      ...tmpl,
      id: `TMPL-${Date.now().toString(36).toUpperCase()}`,
      name: `${tmpl.name} (Copy)`,
      status: 'DRAFT',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versions: [
        {
          id: `VER-${Date.now()}-DUP`,
          templateId: `TMPL-${Date.now()}`,
          versionNumber: 1,
          name: `${tmpl.name} (Copy Initial)`,
          subjectDefault: tmpl.subjectDefault,
          preheaderDefault: tmpl.preheaderDefault,
          htmlContent: tmpl.htmlContent,
          plainTextContent: tmpl.plainTextContent,
          changeSummary: `Cloned from ${tmpl.name}`,
          createdBy: 'Bhuvan Gupta',
          createdAt: new Date().toISOString()
        }
      ]
    };

    onAddAuditLog?.(
      'Email Template Duplicated',
      'EmailTemplates',
      `Duplicated template "${tmpl.name}" as "${duplicated.name}"`
    );

    onUpdateTemplates([duplicated, ...templates]);
  };

  const handleDeleteTemplate = (id: string) => {
    const target = templates.find(t => t.id === id);
    if (!target) return;

    if (window.confirm(`Are you sure you want to delete template "${target.name}"?`)) {
      const updatedList = templates.filter(t => t.id !== id);
      onUpdateTemplates(updatedList);
      if (editingTemplate?.id === id) {
        setEditingTemplate(null);
        setCurrentView('list');
      }

      onAddAuditLog?.(
        'Email Template Deleted',
        'EmailTemplates',
        `Deleted template "${target.name}" (ID: ${id})`
      );
    }
  };

  const handleRestoreVersion = (templateId: string, version: EmailTemplateVersion) => {
    const target = templates.find(t => t.id === templateId);
    if (!target) return;

    const restored: ManagedEmailTemplate = {
      ...target,
      name: version.name || target.name,
      subjectDefault: version.subjectDefault || target.subjectDefault,
      preheaderDefault: version.preheaderDefault || target.preheaderDefault,
      htmlContent: version.htmlContent || target.htmlContent,
      plainTextContent: version.plainTextContent || target.plainTextContent,
      version: target.version + 1,
      updatedAt: new Date().toISOString(),
      versions: [
        ...(target.versions || []),
        {
          id: `VER-RESTORE-${Date.now()}`,
          templateId,
          versionNumber: target.version + 1,
          name: `Restored to v${version.versionNumber}.0`,
          subjectDefault: version.subjectDefault,
          preheaderDefault: version.preheaderDefault,
          htmlContent: version.htmlContent,
          plainTextContent: version.plainTextContent,
          changeSummary: `Restored from snapshot v${version.versionNumber}.0`,
          createdBy: 'Bhuvan Gupta',
          createdAt: new Date().toISOString()
        }
      ]
    };

    const updatedList = templates.map(t => t.id === templateId ? restored : t);
    onUpdateTemplates(updatedList);

    if (editingTemplate?.id === templateId) {
      setEditingTemplate(restored);
    }

    onAddAuditLog?.(
      'Email Template Restored',
      'EmailTemplates',
      `Restored template "${target.name}" to version v${version.versionNumber}.0`
    );
  };

  return (
    <div className="h-full flex flex-col">
      {currentView === 'list' ? (
        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* Section Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Email Template Management
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Design, validate, and version responsive table-based HTML email templates compatible with Gmail, Outlook MSO, and mobile clients.
              </p>
            </div>
          </div>

          {/* List View Component */}
          <TemplateListView
            templates={templates}
            onSelectTemplateForEdit={handleSelectForEdit}
            onSelectTemplateForPreview={setPreviewTemplate}
            onSelectTemplateForTestEmail={setTestEmailTemplate}
            onSelectTemplateForVersions={setVersionTemplate}
            onCreateNewTemplate={handleCreateNewTemplate}
            onDuplicateTemplate={handleDuplicateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        </div>
      ) : editingTemplate ? (
        <TemplateEditorStudio
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onBack={handleBackToList}
          onOpenPreview={setPreviewTemplate}
          onOpenTestEmail={setTestEmailTemplate}
          onOpenVersions={setVersionTemplate}
          contacts={contacts}
          companies={companies}
        />
      ) : null}

      {/* Modals */}
      <TemplatePreviewModal
        template={previewTemplate}
        isOpen={Boolean(previewTemplate)}
        onClose={() => setPreviewTemplate(null)}
        contacts={contacts}
        companies={companies}
      />

      <TemplateVersionModal
        template={versionTemplate}
        isOpen={Boolean(versionTemplate)}
        onClose={() => setVersionTemplate(null)}
        onRestoreVersion={handleRestoreVersion}
      />

      <SendTestEmailModal
        template={testEmailTemplate}
        isOpen={Boolean(testEmailTemplate)}
        onClose={() => setTestEmailTemplate(null)}
        contacts={contacts}
        companies={companies}
        onDispatchTest={(payload) => {
          onSendTestEmail(payload);
          onAddAuditLog?.(
            'Test Email Dispatched',
            'EmailTemplates',
            `Sent test render of template "${payload.templateName}" to ${payload.to} via ${payload.provider}`
          );
        }}
      />
    </div>
  );
};
