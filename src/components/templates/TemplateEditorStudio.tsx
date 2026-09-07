import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Smartphone, 
  Monitor, 
  Code, 
  FileText, 
  Layers, 
  ShieldCheck, 
  RotateCcw, 
  History, 
  Check, 
  Copy, 
  Wand2,
  Tag,
  Info
} from 'lucide-react';
import { 
  ManagedEmailTemplate, 
  EmailTemplateCategory, 
  EmailTemplateStatus, 
  EmailTemplateVersion, 
  Contact, 
  Company, 
  TemplateValidationResult 
} from '../../types';
import { 
  EmailTemplateValidator, 
  TemplateVariableEngine, 
  SUPPORTED_TEMPLATE_VARIABLES 
} from '../../utils/templateValidator';

interface TemplateEditorStudioProps {
  template: ManagedEmailTemplate;
  onSave: (updatedTemplate: ManagedEmailTemplate, newVersionSummary?: string) => void;
  onBack: () => void;
  onOpenPreview: (tmpl: ManagedEmailTemplate) => void;
  onOpenTestEmail: (tmpl: ManagedEmailTemplate) => void;
  onOpenVersions: (tmpl: ManagedEmailTemplate) => void;
  contacts: Contact[];
  companies: Company[];
}

export const TemplateEditorStudio: React.FC<TemplateEditorStudioProps> = ({
  template,
  onSave,
  onBack,
  onOpenPreview,
  onOpenTestEmail,
  onOpenVersions,
  contacts,
  companies
}) => {
  // Form state
  const [name, setName] = useState(template.name);
  const [category, setCategory] = useState<EmailTemplateCategory>(template.category);
  const [status, setStatus] = useState<EmailTemplateStatus>(template.status);
  const [description, setDescription] = useState(template.description);
  const [subjectDefault, setSubjectDefault] = useState(template.subjectDefault);
  const [preheaderDefault, setPreheaderDefault] = useState(template.preheaderDefault);
  const [htmlContent, setHtmlContent] = useState(template.htmlContent);
  const [plainTextContent, setPlainTextContent] = useState(template.plainTextContent);
  
  // UI and Editor state
  const [activeTab, setActiveTab] = useState<'editor' | 'inspector' | 'validator' | 'plaintext'>('editor');
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedContactId, setSelectedContactId] = useState<string>(contacts[0]?.id || '');
  const [showVersionPrompt, setShowVersionPrompt] = useState(false);
  const [versionSummary, setVersionSummary] = useState('');
  const [saveSuccessNotification, setSaveSuccessNotification] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentContact = contacts.find(c => c.id === selectedContactId) || contacts[0];
  const currentCompany = companies.find(c => c.id === currentContact?.companyId) || companies[0];

  // Run real-time validation
  const validationResult: TemplateValidationResult = EmailTemplateValidator.validate(
    htmlContent,
    subjectDefault,
    preheaderDefault
  );

  // Real-time variable interpolation for live preview
  const interpolatedHtml = TemplateVariableEngine.replace(
    htmlContent,
    currentContact,
    currentCompany
  );

  const interpolatedSubject = TemplateVariableEngine.replace(
    subjectDefault,
    currentContact,
    currentCompany
  );

  const interpolatedPreheader = TemplateVariableEngine.replace(
    preheaderDefault,
    currentContact,
    currentCompany
  );

  // Insert variable into active cursor location in HTML editor
  const handleInsertVariable = (variableKey: string) => {
    if (!textareaRef.current) {
      setHtmlContent(prev => prev + variableKey);
      return;
    }

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newHtml = htmlContent.substring(0, start) + variableKey + htmlContent.substring(end);
    setHtmlContent(newHtml);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variableKey.length, start + variableKey.length);
    }, 50);
  };

  // Auto-generate plain text from current HTML
  const handleAutoGeneratePlainText = () => {
    const generated = EmailTemplateValidator.generatePlainText(htmlContent);
    setPlainTextContent(generated);
  };

  // Sanitize HTML
  const handleSanitizeHtml = () => {
    const sanitized = EmailTemplateValidator.sanitize(htmlContent);
    setHtmlContent(sanitized);
  };

  // Save handler
  const handlePerformSave = (withVersion = false) => {
    const updated: ManagedEmailTemplate = {
      ...template,
      name,
      category,
      status,
      description,
      subjectDefault,
      preheaderDefault,
      htmlContent,
      plainTextContent: plainTextContent || EmailTemplateValidator.generatePlainText(htmlContent),
      updatedAt: new Date().toISOString()
    };

    onSave(updated, withVersion ? versionSummary : undefined);
    setShowVersionPrompt(false);
    setVersionSummary('');
    setSaveSuccessNotification(true);
    setTimeout(() => setSaveSuccessNotification(false), 2500);
  };

  // Check which of the 10 required sections are detected
  const lowerHtml = htmlContent.toLowerCase();
  const sectionChecks = [
    {
      id: 1,
      title: 'Hidden Preheader',
      desc: 'Controls recipient inbox list preview snippet before opening',
      passed: preheaderDefault.length > 0 && (lowerHtml.includes('mso-hide:all') || lowerHtml.includes('display:none') || lowerHtml.includes('display: none')),
      required: true
    },
    {
      id: 2,
      title: 'Header Bar',
      desc: 'Web version link or top branding container',
      passed: lowerHtml.includes('<header') || lowerHtml.includes('header') || lowerHtml.includes('executive briefing') || lowerHtml.includes('border-bottom'),
      required: false
    },
    {
      id: 3,
      title: 'Company Logo',
      desc: 'Branded identity logo tag {{COMPANY_LOGO}}',
      passed: htmlContent.includes('{{COMPANY_LOGO}}') || lowerHtml.includes('logo'),
      required: true
    },
    {
      id: 4,
      title: 'Hero Section',
      desc: 'Visual headline banner with high contrast typography',
      passed: lowerHtml.includes('<h1') || lowerHtml.includes('font-size: 24px') || lowerHtml.includes('font-size: 26px') || lowerHtml.includes('font-size: 28px'),
      required: true
    },
    {
      id: 5,
      title: 'Main Content Body',
      desc: 'Personal greeting using {{FIRST_NAME}} or {{CONTACT_NAME}}',
      passed: (htmlContent.includes('{{FIRST_NAME}}') || htmlContent.includes('{{CONTACT_NAME}}')) && lowerHtml.includes('<p'),
      required: true
    },
    {
      id: 6,
      title: 'Benefits / Feature Section',
      desc: 'Table grid or bullet layout with key milestone value propositions',
      passed: lowerHtml.includes('benefits') || lowerHtml.includes('highlight') || lowerHtml.includes('feature') || lowerHtml.includes('&bull;') || lowerHtml.includes('&#10003;'),
      required: false
    },
    {
      id: 7,
      title: 'Bulletproof CTA Button',
      desc: 'Table-based button with inline styling for universal client clickability',
      passed: lowerHtml.includes('padding: 14px') || lowerHtml.includes('padding: 12px') || (lowerHtml.includes('<a') && lowerHtml.includes('border-radius')),
      required: true
    },
    {
      id: 8,
      title: 'Contact Information',
      desc: 'Support telephone, dedicated account email, and office hours',
      passed: lowerHtml.includes('phone:') || lowerHtml.includes('email:') || lowerHtml.includes('+91') || lowerHtml.includes('desk'),
      required: false
    },
    {
      id: 9,
      title: 'Footer & Postal Address',
      desc: 'CAN-SPAM mandatory postal address variable {{COMPANY_ADDRESS}}',
      passed: htmlContent.includes('{{COMPANY_ADDRESS}}'),
      required: true
    },
    {
      id: 10,
      title: 'Unsubscribe Link',
      desc: 'One-click unsubscribe opt-out variable {{UNSUBSCRIBE_URL}}',
      passed: htmlContent.includes('{{UNSUBSCRIBE_URL}}'),
      required: true
    }
  ];

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

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-hidden">
      
      {/* 1. TOP HEADER & ACTION BAR */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        
        {/* Left: Back + Name + Metadata */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Back to Template List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-base font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none px-1 py-0.5"
                placeholder="Template Name..."
              />
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                v{template.version}.0
              </span>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5 px-1">
              <span>Category:</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EmailTemplateCategory)}
                className="border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white text-slate-700 font-medium"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <span className="text-slate-300">&bull;</span>

              <span>Status:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EmailTemplateStatus)}
                className="border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white text-slate-700 font-medium"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: Validation Badge + Actions */}
        <div className="flex items-center space-x-2.5">
          
          {/* Deliverability Quality Score Badge */}
          <div 
            onClick={() => setActiveTab('validator')}
            className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              validationResult.isValid && validationResult.score >= 80
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
            }`}
          >
            {validationResult.isValid && validationResult.score >= 80 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            )}
            <span>Quality Score: {validationResult.score}/100</span>
          </div>

          <button
            onClick={() => onOpenVersions(template)}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Inspect version history"
          >
            <History className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Versions ({template.versions?.length || 1})
          </button>

          <button
            onClick={() => onOpenTestEmail({ ...template, name, category, status, subjectDefault, preheaderDefault, htmlContent, plainTextContent })}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Send className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
            Send Test
          </button>

          <button
            onClick={() => onOpenPreview({ ...template, name, category, status, subjectDefault, preheaderDefault, htmlContent, plainTextContent })}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
            Fullscreen
          </button>

          <button
            onClick={() => setShowVersionPrompt(true)}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
            Save As Version
          </button>

          <button
            onClick={() => handlePerformSave(false)}
            className="inline-flex items-center px-4 py-1.5 text-xs font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Save Changes
          </button>
        </div>

      </div>

      {/* Save Notification Toast */}
      {saveSuccessNotification && (
        <div className="bg-emerald-600 text-white text-xs px-6 py-1.5 flex items-center justify-center space-x-2 font-medium shadow-inner animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>Template changes saved successfully! Version updated.</span>
        </div>
      )}

      {/* 2. MERGE VARIABLES TOOLBAR RIBBON */}
      <div className="bg-slate-900 text-slate-200 px-6 py-2.5 flex items-center justify-between overflow-x-auto shrink-0 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2 shrink-0 pr-3 border-r border-slate-700">
          <Tag className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">
            Insert Variables:
          </span>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pl-3 py-0.5">
          {SUPPORTED_TEMPLATE_VARIABLES.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => handleInsertVariable(v.key)}
              title={`${v.name}: ${v.description} (Example: ${v.sampleValue})`}
              className={`shrink-0 px-2 py-1 rounded text-[11px] font-mono transition-all border ${
                v.required
                  ? 'bg-blue-950/80 border-blue-500/50 text-blue-200 hover:bg-blue-900'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {v.key}
            </button>
          ))}
        </div>
      </div>

      {/* 3. WORKSPACE TABS SELECTOR */}
      <div className="bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex space-x-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('editor')}
            className={`py-3 border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Split Editor & Live Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('inspector')}
            className={`py-3 border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'inspector'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>10-Section Structural Inspector</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
              {sectionChecks.filter(s => s.passed).length}/10
            </span>
          </button>

          <button
            onClick={() => setActiveTab('validator')}
            className={`py-3 border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'validator'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Validator & Compliance Diagnostics</span>
            {validationResult.errors.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">
                {validationResult.errors.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('plaintext')}
            className={`py-3 border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'plaintext'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Plain Text Counterpart</span>
          </button>
        </div>

        {/* Device & Contact switcher (shown in editor tab) */}
        {activeTab === 'editor' && (
          <div className="flex items-center space-x-3 py-2 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-medium">Merge Sample:</span>
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800"
              >
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName || c.firstName} ({c.companyName})
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setViewport('desktop')}
                className={`px-2 py-1 rounded text-xs font-medium flex items-center ${
                  viewport === 'desktop' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 mr-1" />
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setViewport('mobile')}
                className={`px-2 py-1 rounded text-xs font-medium flex items-center ${
                  viewport === 'mobile' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 mr-1" />
                Mobile
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. MAIN CONTENT AREA ACCORDING TO ACTIVE TAB */}
      <div className="flex-1 overflow-hidden">
        
        {/* TAB 1: SPLIT CODE & LIVE PREVIEW */}
        {activeTab === 'editor' && (
          <div className="h-full flex divide-x divide-slate-200 overflow-hidden">
            
            {/* Left: Code Editor Pane */}
            <div className="w-1/2 flex flex-col h-full bg-white overflow-y-auto">
              
              {/* Subject & Preheader Inputs */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-2.5 shrink-0 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Subject Line
                  </label>
                  <input
                    type="text"
                    value={subjectDefault}
                    onChange={(e) => setSubjectDefault(e.target.value)}
                    placeholder="Enter engaging email subject..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Preheader Snippet (Hidden Preview Text)
                  </label>
                  <input
                    type="text"
                    value={preheaderDefault}
                    onChange={(e) => setPreheaderDefault(e.target.value)}
                    placeholder="Brief inbox list snippet..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-mono"
                  />
                </div>
              </div>

              {/* HTML Editor Toolbar */}
              <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
                <span className="font-semibold">HTML Template Source Code</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSanitizeHtml}
                    className="text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded px-2 py-0.5 hover:bg-slate-50 transition-colors"
                    title="Strip unwanted script and iframe tags"
                  >
                    Sanitize Clean
                  </button>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {htmlContent.length} chars
                  </span>
                </div>
              </div>

              {/* Code Textarea */}
              <div className="flex-1 p-2 bg-slate-950 overflow-hidden flex flex-col">
                <textarea
                  ref={textareaRef}
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  className="w-full flex-1 bg-transparent text-slate-200 font-mono text-xs p-3 focus:outline-none resize-none leading-relaxed selection:bg-blue-600"
                  spellCheck={false}
                  placeholder="Paste or write table-based email HTML here..."
                />
              </div>

            </div>

            {/* Right: Live Rendered Preview Pane */}
            <div className="w-1/2 flex flex-col h-full bg-slate-200/90 overflow-hidden">
              
              {/* Preview Header / Device Meta */}
              <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
                <div className="flex items-center space-x-2 truncate">
                  <span className="font-semibold text-slate-800">Subject:</span>
                  <span className="text-slate-900 font-medium truncate">{interpolatedSubject}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono shrink-0">
                  {viewport === 'desktop' ? '600px Max-Width' : '375px Mobile Viewport'}
                </div>
              </div>

              {/* Viewport Frame */}
              <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center">
                <div
                  className={`transition-all duration-300 bg-white shadow-xl overflow-hidden ${
                    viewport === 'desktop'
                      ? 'w-[600px] max-w-full rounded-md border border-slate-300'
                      : 'w-[375px] rounded-[36px] border-[10px] border-slate-800 shadow-2xl relative'
                  }`}
                >
                  {viewport === 'mobile' && (
                    <div className="w-full bg-slate-800 py-1 flex justify-center items-center">
                      <div className="w-24 h-4 bg-black rounded-full mb-1"></div>
                    </div>
                  )}

                  <iframe
                    title="Live Email Preview Frame"
                    srcDoc={interpolatedHtml}
                    className="w-full border-0 bg-white"
                    style={{
                      height: viewport === 'desktop' ? '560px' : '620px',
                      display: 'block'
                    }}
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: 10-SECTION STRUCTURAL INSPECTOR */}
        {activeTab === 'inspector' && (
          <div className="h-full overflow-y-auto p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
              <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                <h3 className="text-base font-bold text-slate-900">
                  Required Email Structure Architecture (10 Sections)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Bulletproof responsive templates require specific structural sections for maximum deliverability and rendering consistency across Gmail, Microsoft Outlook, and Apple Mail.
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {sectionChecks.map((sec) => (
                  <div key={sec.id} className="p-4 flex items-start justify-between hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-start space-x-3.5">
                      <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        sec.passed
                          ? 'bg-emerald-100 text-emerald-700'
                          : sec.required
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}>
                        {sec.passed ? '✓' : '!'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            {sec.id}. {sec.title}
                          </h4>
                          {sec.required && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              MANDATORY
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{sec.desc}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full inline-block ${
                        sec.passed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : sec.required
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {sec.passed ? 'COMPLIANT' : sec.required ? 'MISSING REQUIRED' : 'RECOMMENDED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VALIDATOR & COMPLIANCE DIAGNOSTICS */}
        {activeTab === 'validator' && (
          <div className="h-full overflow-y-auto p-8 max-w-4xl mx-auto space-y-6">
            
            {/* Score Banner */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-bold text-2xl ${
                  validationResult.score >= 85
                    ? 'bg-emerald-100 text-emerald-700'
                    : validationResult.score >= 60
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-rose-100 text-rose-700'
                }`}>
                  {validationResult.score}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {validationResult.score >= 85
                      ? 'Excellent Deliverability Profile'
                      : validationResult.score >= 60
                        ? 'Acceptable with Recommendations'
                        : 'Action Required Before Dispatch'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluated against CAN-SPAM, GDPR, Outlook MSO table standards, and ESP spam filter heuristics.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSanitizeHtml}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
              >
                Auto-Sanitize &amp; Repair HTML
              </button>
            </div>

            {/* Critical Errors */}
            {validationResult.errors.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center space-x-2 text-rose-900 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Critical Validation Violations ({validationResult.errors.length})</span>
                </div>
                <div className="space-y-2">
                  {validationResult.errors.map((err, i) => (
                    <div key={i} className="bg-white p-3 rounded-lg border border-rose-100 text-xs">
                      <p className="font-semibold text-rose-800">{err.message}</p>
                      {err.suggestion && (
                        <p className="text-slate-600 text-[11px] mt-1">Tip: {err.suggestion}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Deliverability &amp; Compatibility Warnings ({validationResult.warnings.length})</span>
                </div>
                <div className="space-y-2">
                  {validationResult.warnings.map((warn, i) => (
                    <div key={i} className="bg-white p-3 rounded-lg border border-amber-100 text-xs">
                      <p className="font-semibold text-amber-900">{warn.message}</p>
                      {warn.suggestion && (
                        <p className="text-slate-600 text-[11px] mt-1">Recommendation: {warn.suggestion}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Variable Usage Matrix */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Variable Usage Analysis
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-2">
                    Detected in Template ({validationResult.detectedVariables.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {validationResult.detectedVariables.length > 0 ? (
                      validationResult.detectedVariables.map((v) => (
                        <span key={v} className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px]">
                          {v}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">None detected.</span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-2">
                    Missing Mandatory Variables ({validationResult.missingRequiredVariables.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {validationResult.missingRequiredVariables.length > 0 ? (
                      validationResult.missingRequiredVariables.map((v) => (
                        <span key={v} className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-mono text-[11px] font-bold">
                          {v}
                        </span>
                      ))
                    ) : (
                      <span className="text-emerald-600 font-semibold flex items-center">
                        <Check className="w-3.5 h-3.5 mr-1" /> All mandatory compliance variables present!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: PLAIN TEXT COUNTERPART */}
        {activeTab === 'plaintext' && (
          <div className="h-full overflow-y-auto p-8 max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Multi-Part MIME Plain Text Alternative
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Spam filters heavily penalize emails that lack a synchronized plain-text part.
                </p>
              </div>

              <button
                onClick={handleAutoGeneratePlainText}
                className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold rounded-lg text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                Auto-Generate from HTML
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <textarea
                value={plainTextContent}
                onChange={(e) => setPlainTextContent(e.target.value)}
                rows={16}
                className="w-full font-mono text-xs text-slate-800 p-3 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none resize-y leading-relaxed"
                placeholder="Plain text representation..."
              />
            </div>
          </div>
        )}

      </div>

      {/* VERSION CREATION PROMPT MODAL */}
      {showVersionPrompt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center space-x-2 text-indigo-700">
              <Layers className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Create Version Snapshot</h3>
            </div>
            <p className="text-xs text-slate-600">
              Enter a concise summary of the changes made. This creates an immutable release tag (v{template.version + 1}.0) that can be inspected and restored anytime.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Change Summary / Release Note
              </label>
              <textarea
                value={versionSummary}
                onChange={(e) => setVersionSummary(e.target.value)}
                rows={3}
                placeholder="e.g. Updated CTA button styling, polished footer address, added festival greeting banner."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowVersionPrompt(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handlePerformSave(true)}
                disabled={!versionSummary.trim()}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
              >
                Save Version Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
