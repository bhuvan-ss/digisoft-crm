import React, { useState } from 'react';
import { Bot, Sparkles, RefreshCw, ChevronLeft, CheckCircle, AlertTriangle, Layers, Type, FileText } from 'lucide-react';
import { StructuredEmailContent } from '../types';

interface AiBriefForm {
  campaignObjective: string;
  targetAudience: string;
  productService: string;
  offer: string;
  keyBenefits: string;
  callToAction: string;
  tone: string;
  language: string;
  emailLength: string;
  additionalInstructions: string;
}

const TONE_OPTIONS = ['Professional', 'Corporate', 'Friendly', 'Promotional', 'Urgent', 'Premium', 'Informational', 'Festive'];
const LENGTH_OPTIONS = ['Short (under 100 words)', 'Medium (100-250 words)', 'Long (detailed, 250+ words)'];
const LANGUAGE_OPTIONS = ['English', 'Spanish', 'French', 'German', 'Italian', 'Hindi'];

export interface GeneratedAiResponse {
  subject_options: string[];
  preheader: string;
  headline: string;
  subheadline: string;
  introduction: string;
  benefits: string[];
  cta_text: string;
  closing_message: string;
}

interface AiContentAssistantProps {
  onApplyContent?: (content: Partial<StructuredEmailContent>) => void;
  onNavigateBack?: () => void;
  isStandalone?: boolean;
}

export const AiContentAssistant: React.FC<AiContentAssistantProps> = ({ 
  onApplyContent, 
  onNavigateBack,
  isStandalone = false 
}) => {
  const [form, setForm] = useState<AiBriefForm>({
    campaignObjective: '',
    targetAudience: '',
    productService: '',
    offer: '',
    keyBenefits: '',
    callToAction: '',
    tone: 'Professional',
    language: 'English',
    emailLength: 'Medium (100-250 words)',
    additionalInstructions: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedResult, setGeneratedResult] = useState<GeneratedAiResponse | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generateContent = async (modifier?: string) => {
    setIsLoading(true);
    setError('');
    try {
      let promptPayload = { ...form };
      if (modifier) {
        promptPayload.additionalInstructions = (promptPayload.additionalInstructions + `\n\n[Modifier applied: ${modifier}]`).trim();
      }

      const res = await fetch('/api/ai/generate-campaign-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptPayload)
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to generate content');
      
      setGeneratedResult(data.content);
      if (data.content.subject_options && data.content.subject_options.length > 0) {
        setSelectedSubject(data.content.subject_options[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to AI Service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!generatedResult || !onApplyContent) return;
    onApplyContent({
      subject: selectedSubject || generatedResult.subject_options?.[0] || '',
      preheader: generatedResult.preheader,
      headline: generatedResult.headline,
      introduction: generatedResult.introduction,
      benefits: generatedResult.benefits,
      ctaText: generatedResult.cta_text,
      secondaryText: generatedResult.closing_message
    });
  };

  return (
    <div className={`flex flex-col h-full bg-slate-50 ${isStandalone ? 'p-6 max-w-7xl mx-auto w-full' : ''}`}>
      {!isStandalone && (
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shadow-sm z-10 relative">
          <div className="flex items-center space-x-3">
            {onNavigateBack && (
              <button onClick={onNavigateBack} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
                <Bot className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">AI Content Assistant</h2>
            </div>
          </div>
          {generatedResult && onApplyContent && (
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center transition shadow-sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Apply to Campaign
            </button>
          )}
        </div>
      )}

      {isStandalone && (
         <div className="mb-6 flex items-center justify-between">
           <div>
             <h1 className="text-2xl font-bold text-slate-900 flex items-center">
               <Bot className="w-6 h-6 mr-3 text-indigo-600" />
               AI Content Assistant
             </h1>
             <p className="text-slate-500 text-sm mt-1">Generate structured, high-converting email copy with built-in compliance boundaries.</p>
           </div>
         </div>
      )}

      <div className={`flex-1 flex flex-col md:flex-row gap-6 ${!isStandalone ? 'p-4 overflow-hidden' : ''}`}>
        {/* Left Panel: Campaign Input */}
        <div className={`flex flex-col w-full md:w-5/12 bg-white border border-slate-200 rounded-xl shadow-sm ${!isStandalone ? 'overflow-y-auto' : 'h-fit p-5'}`}>
          {!isStandalone && (
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
              <h3 className="font-semibold text-slate-800 flex items-center">
                <Layers className="w-4 h-4 mr-2 text-slate-500" />
                Campaign Brief
              </h3>
            </div>
          )}
          
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Objective *</label>
              <input
                type="text"
                name="campaignObjective"
                value={form.campaignObjective}
                onChange={handleChange}
                placeholder="e.g. Announce new Q3 features, Recover abandoned carts..."
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                <input
                  type="text"
                  name="targetAudience"
                  value={form.targetAudience}
                  onChange={handleChange}
                  placeholder="e.g. Existing Customers"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product / Service</label>
                <input
                  type="text"
                  name="productService"
                  value={form.productService}
                  onChange={handleChange}
                  placeholder="e.g. Premium Plan"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Key Benefits (Comma separated)</label>
              <textarea
                name="keyBenefits"
                value={form.keyBenefits}
                onChange={handleChange}
                placeholder="Faster workflow, 24/7 support, ROI tracking..."
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm min-h-[60px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Offer / Hook</label>
                  <input
                    type="text"
                    name="offer"
                    value={form.offer}
                    onChange={handleChange}
                    placeholder="e.g. 20% off annual plan"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Call To Action</label>
                  <input
                    type="text"
                    name="callToAction"
                    value={form.callToAction}
                    onChange={handleChange}
                    placeholder="e.g. Upgrade Now"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tone</label>
                <select
                  name="tone"
                  value={form.tone}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-slate-50 focus:bg-white"
                >
                  {TONE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Language</label>
                <select
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-slate-50 focus:bg-white"
                >
                  {LANGUAGE_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Length</label>
                <select
                  name="emailLength"
                  value={form.emailLength}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-slate-50 focus:bg-white"
                >
                  {LENGTH_OPTIONS.map(l => <option key={l} value={l}>{l.split(' ')[0]}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Additional Instructions</label>
              <textarea
                name="additionalInstructions"
                value={form.additionalInstructions}
                onChange={handleChange}
                placeholder="Include a postscript (P.S.), avoid using the word 'cheap', etc."
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm min-h-[60px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              onClick={() => generateContent()}
              disabled={isLoading || !form.campaignObjective}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center transition shadow-sm"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Structured Content...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Content
                </>
              )}
            </button>
            {error && (
              <div className="p-3 mt-2 bg-red-50 text-red-700 rounded-lg text-xs font-medium flex items-center border border-red-100">
                <AlertTriangle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Generated Content */}
        <div className={`flex flex-col w-full md:w-7/12 bg-white border border-slate-200 rounded-xl shadow-sm ${!isStandalone ? 'overflow-y-auto' : 'h-fit'}`}>
          {!isStandalone && (
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-slate-500" />
                Generated Output
              </h3>
              {generatedResult && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  <CheckCircle className="w-3 h-3 mr-1" /> Ready
                </span>
              )}
            </div>
          )}
          
          <div className="p-5">
            {!generatedResult && !isLoading && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                  <Sparkles className="w-8 h-8" />
                </div>
                <p className="font-medium text-slate-600 mb-1">No content generated yet</p>
                <p className="text-sm">Fill out the campaign brief and click generate.</p>
              </div>
            )}

            {isLoading && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-500 space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-indigo-100 rounded-full border-t-indigo-600 animate-spin"></div>
                  <Sparkles className="w-4 h-4 text-indigo-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-sm font-medium animate-pulse text-indigo-600">Drafting campaign content...</p>
                <div className="max-w-xs text-center text-xs text-slate-400">
                  Aligning with {form.tone.toLowerCase()} tone, optimizing for {form.targetAudience || 'your audience'}, and enforcing compliance rules.
                </div>
              </div>
            )}

            {generatedResult && !isLoading && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Generation Modifiers */}
                <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100">
                  <button onClick={() => generateContent("Make it shorter and punchier")} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full transition">
                    Shorten
                  </button>
                  <button onClick={() => generateContent("Make it more professional and corporate")} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full transition">
                    Make More Professional
                  </button>
                  <button onClick={() => generateContent("Improve the tone to be more persuasive")} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full transition">
                    Improve Tone
                  </button>
                  <button onClick={() => generateContent("Generate 3 completely different alternative subject lines")} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full transition">
                    Alternative Subjects
                  </button>
                </div>

                {/* Subject Lines */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Subject Line Options</label>
                  <div className="space-y-2">
                    {generatedResult.subject_options?.map((subj, idx) => (
                      <div 
                        key={idx}
                        onClick={() => setSelectedSubject(subj)}
                        className={`p-3 rounded-lg border text-sm cursor-pointer transition ${
                          selectedSubject === subj ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-medium' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {subj}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Preheader / Snippet</label>
                  <textarea
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 min-h-[60px]"
                    value={generatedResult.preheader}
                    onChange={(e) => setGeneratedResult({...generatedResult, preheader: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Headline</label>
                    <textarea
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900"
                      value={generatedResult.headline}
                      onChange={(e) => setGeneratedResult({...generatedResult, headline: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Subheadline</label>
                    <textarea
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700"
                      value={generatedResult.subheadline || ''}
                      onChange={(e) => setGeneratedResult({...generatedResult, subheadline: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Introduction</label>
                  <textarea
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 min-h-[100px]"
                    value={generatedResult.introduction}
                    onChange={(e) => setGeneratedResult({...generatedResult, introduction: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Key Benefits</label>
                  <div className="space-y-2">
                    {generatedResult.benefits?.map((benefit, idx) => (
                      <div key={idx} className="flex">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mr-3 text-xs font-bold mt-0.5">
                          {idx + 1}
                        </div>
                        <textarea
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700"
                          value={benefit}
                          onChange={(e) => {
                            const newBenefits = [...generatedResult.benefits];
                            newBenefits[idx] = e.target.value;
                            setGeneratedResult({...generatedResult, benefits: newBenefits});
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Call to Action (Button)</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-indigo-700"
                      value={generatedResult.cta_text}
                      onChange={(e) => setGeneratedResult({...generatedResult, cta_text: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Closing Message</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700"
                      value={generatedResult.closing_message}
                      onChange={(e) => setGeneratedResult({...generatedResult, closing_message: e.target.value})}
                    />
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
