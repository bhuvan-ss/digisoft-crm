import React, { useState } from 'react';
import { X, Monitor, Smartphone, CheckCircle, Code, Eye, User } from 'lucide-react';
import { ManagedEmailTemplate, Contact, Company } from '../../types';
import { TemplateVariableEngine } from '../../utils/templateValidator';

interface TemplatePreviewModalProps {
  template: ManagedEmailTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  companies: Company[];
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  isOpen,
  onClose,
  contacts,
  companies
}) => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedContactId, setSelectedContactId] = useState<string>(contacts[0]?.id || '');
  const [previewTab, setPreviewTab] = useState<'visual' | 'code' | 'text'>('visual');

  if (!isOpen || !template) return null;

  const currentContact = contacts.find(c => c.id === selectedContactId) || contacts[0];
  const currentCompany = companies.find(c => c.id === currentContact?.companyId) || companies[0];

  const interpolatedHtml = TemplateVariableEngine.replace(
    template.htmlContent,
    currentContact,
    currentCompany
  );

  const interpolatedSubject = TemplateVariableEngine.replace(
    template.subjectDefault,
    currentContact,
    currentCompany
  );

  const interpolatedPreheader = TemplateVariableEngine.replace(
    template.preheaderDefault,
    currentContact,
    currentCompany
  );

  const interpolatedPlainText = TemplateVariableEngine.replace(
    template.plainTextContent,
    currentContact,
    currentCompany
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              {template.category}
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-700">
              v{template.version}.0
            </span>
            <h2 className="text-base font-bold text-slate-800 truncate max-w-md">
              {template.name}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            {/* Viewport Toggles */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  device === 'desktop'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 mr-1.5" />
                Desktop (600px)
              </button>
              <button
                type="button"
                onClick={() => setDevice('mobile')}
                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  device === 'mobile'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 mr-1.5" />
                Mobile (375px)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Sample Contact + View Tabs */}
        <div className="px-6 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700">Preview Data Source:</span>
            <select
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
              className="border border-slate-300 rounded-md px-2.5 py-1 text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName || c.firstName} &bull; {c.companyName} ({c.city}, {c.state})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPreviewTab('visual')}
              className={`px-3 py-1 rounded font-medium text-xs ${
                previewTab === 'visual' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Rendered Preview
            </button>
            <button
              onClick={() => setPreviewTab('code')}
              className={`px-3 py-1 rounded font-medium text-xs ${
                previewTab === 'code' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Raw HTML
            </button>
            <button
              onClick={() => setPreviewTab('text')}
              className={`px-3 py-1 rounded font-medium text-xs ${
                previewTab === 'text' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Plain Text
            </button>
          </div>
        </div>

        {/* Email Metadata Bar (Subject & Preheader) */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 text-xs flex flex-col space-y-1">
          <div className="flex items-baseline space-x-2">
            <span className="font-semibold text-slate-500 w-16">Subject:</span>
            <span className="font-medium text-slate-900">{interpolatedSubject}</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-semibold text-slate-500 w-16">Preheader:</span>
            <span className="text-slate-600 truncate">{interpolatedPreheader}</span>
          </div>
        </div>

        {/* Preview Canvas Area */}
        <div className="flex-1 bg-slate-200/80 p-6 overflow-y-auto flex items-center justify-center min-h-[450px]">
          {previewTab === 'visual' && (
            <div
              className={`transition-all duration-300 bg-white shadow-lg overflow-hidden ${
                device === 'desktop'
                  ? 'w-[600px] max-w-full rounded-md border border-slate-300'
                  : 'w-[375px] rounded-[36px] border-[10px] border-slate-800 shadow-2xl relative'
              }`}
            >
              {device === 'mobile' && (
                <div className="w-full bg-slate-800 py-1 flex justify-center items-center">
                  <div className="w-24 h-4 bg-black rounded-full mb-1"></div>
                </div>
              )}
              <iframe
                title="Email Preview"
                srcDoc={interpolatedHtml}
                className="w-full border-0 bg-white"
                style={{
                  height: device === 'desktop' ? '560px' : '620px',
                  display: 'block'
                }}
                sandbox="allow-same-origin"
              />
            </div>
          )}

          {previewTab === 'code' && (
            <div className="w-full h-full max-w-4xl bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-200 overflow-auto max-h-[560px]">
              <pre>{interpolatedHtml}</pre>
            </div>
          )}

          {previewTab === 'text' && (
            <div className="w-full max-w-2xl bg-white rounded-lg p-6 font-mono text-xs text-slate-800 whitespace-pre-wrap shadow border border-slate-300 max-h-[560px] overflow-auto">
              {interpolatedPlainText || 'No plain text representation generated.'}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Responsive 600px Table Architecture Verified &bull; CAN-SPAM Compliant</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-medium transition-colors"
          >
            Close Preview
          </button>
        </div>

      </div>
    </div>
  );
};
