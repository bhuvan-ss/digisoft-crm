import React, { useState } from 'react';
import { X, History, RotateCcw, Check, Clock, User, FileText, AlertCircle } from 'lucide-react';
import { ManagedEmailTemplate, EmailTemplateVersion } from '../../types';

interface TemplateVersionModalProps {
  template: ManagedEmailTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onRestoreVersion: (templateId: string, version: EmailTemplateVersion) => void;
}

export const TemplateVersionModal: React.FC<TemplateVersionModalProps> = ({
  template,
  isOpen,
  onClose,
  onRestoreVersion
}) => {
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');

  if (!isOpen || !template) return null;

  const versions = template.versions || [];
  const selectedVersion = versions.find(v => v.id === selectedVersionId) || versions[versions.length - 1] || null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Version History: {template.name}
              </h2>
              <p className="text-xs text-slate-500">
                Audit trail of changes, release notes, and single-click rollback
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left Version List, Right Version Details */}
        <div className="flex-1 flex overflow-hidden min-h-[400px]">
          
          {/* Version List */}
          <div className="w-80 border-r border-slate-200 overflow-y-auto p-4 bg-slate-50/50 space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
              Recorded Snapshots ({versions.length})
            </div>

            {versions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
                <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                No previous snapshots recorded yet. When you save significant edits, version checkpoints will appear here.
              </div>
            ) : (
              versions.map((ver) => {
                const isSelected = (selectedVersion?.id === ver.id);
                const isCurrent = ver.versionNumber === template.version;

                return (
                  <button
                    key={ver.id}
                    onClick={() => setSelectedVersionId(ver.id)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/70 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-900">
                          v{ver.versionNumber}.0
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(ver.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-slate-600 line-clamp-2 mb-2 font-normal">
                      {ver.changeSummary || 'No release description provided.'}
                    </p>

                    <div className="flex items-center text-[11px] text-slate-500 space-x-1">
                      <User className="w-3 h-3" />
                      <span>{ver.createdBy}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Version Details & Code Viewer */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white p-6">
            {selectedVersion ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-start justify-between pb-4 border-b border-slate-200 mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        Snapshot v{selectedVersion.versionNumber}.0
                      </h3>
                      <span className="text-xs text-slate-500">
                        Created {new Date(selectedVersion.createdAt).toLocaleString()} by {selectedVersion.createdBy}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md mt-1.5 inline-block font-medium">
                      Release Note: {selectedVersion.changeSummary}
                    </p>
                  </div>

                  {selectedVersion.versionNumber !== template.version && (
                    <button
                      onClick={() => {
                        onRestoreVersion(template.id, selectedVersion);
                        onClose();
                      }}
                      className="inline-flex items-center px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Restore This Version
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-semibold block mb-1">Subject:</span>
                    <span className="text-slate-800 font-mono">{selectedVersion.subjectDefault}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-semibold block mb-1">Preheader:</span>
                    <span className="text-slate-800 font-mono truncate block">{selectedVersion.preheaderDefault}</span>
                  </div>
                </div>

                {/* HTML content snippet */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>HTML Template Source Snapshot:</span>
                    <span className="text-slate-400 font-mono">{selectedVersion.htmlContent.length} bytes</span>
                  </div>
                  <div className="flex-1 bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs overflow-auto border border-slate-700">
                    <pre>{selectedVersion.htmlContent || '<!-- Empty snapshot HTML content -->'}</pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                Select a version from the left panel to inspect details.
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>All version restores create an immutable audit record.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md font-medium"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
