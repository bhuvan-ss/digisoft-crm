import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  Layers, 
  HelpCircle,
  FileText,
  Sparkles,
  Zap,
  Clock,
  Database
} from 'lucide-react';
import { 
  Contact, 
  ConsentStatus, 
  DuplicateHandlingOption, 
  ImportErrorItem, 
  ImportMappingItem, 
  ImportRecord, 
  ImportStatus, 
  ImportSummaryStats, 
  LifecycleStage, 
  TransformationRule 
} from '../types';
import { parseUploadedFile, ParsedFileData } from '../utils/csvParser';
import { 
  autoDetectColumnMappings, 
  ContactImportProcessor, 
  ChunkProgressEvent 
} from '../services/ContactImportEngine';
import { ImportSummaryService } from '../services/ImportSummaryService';
import { ImportRunsTable } from './imports/ImportRunsTable';
import { ImportMappingStep } from './imports/ImportMappingStep';
import { ImportPreviewStep } from './imports/ImportPreviewStep';
import { ImportConfigStep } from './imports/ImportConfigStep';
import { ImportProgressStep } from './imports/ImportProgressStep';
import { ImportSummaryStep } from './imports/ImportSummaryStep';
import { LaravelImportArchitectureModal } from './imports/LaravelImportArchitectureModal';

interface ImportCenterProps {
  existingContacts: Contact[];
  onImportComplete: (newContacts: Contact[], updatedContacts: Contact[]) => void;
  onNavigateToContacts: () => void;
}

export const ImportCenter: React.FC<ImportCenterProps> = ({
  existingContacts,
  onImportComplete,
  onNavigateToContacts,
}) => {
  // Navigation & View State
  const [activeView, setActiveView] = useState<'list' | 'wizard'>('wizard');
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);

  // File & Upload State
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'csv' | 'xls' | 'xlsx'>('csv');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Mappings State
  const [mappings, setMappings] = useState<Record<string, ImportMappingItem>>({});

  // Configuration State
  const [duplicateHandling, setDuplicateHandling] = useState<DuplicateHandlingOption>('UPDATE');
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>('single_opt_in');
  const [consentSource, setConsentSource] = useState('Enterprise CSV Batch Upload');
  const [tagsInput, setTagsInput] = useState('Q3 Campaign, High Intent');
  const [lifecycleStage, setLifecycleStage] = useState<LifecycleStage>('lead');
  const [chunkSize, setChunkSize] = useState<number>(500);

  // Execution & Progress State
  const [isPaused, setIsPaused] = useState(false);
  const [processorInstance, setProcessorInstance] = useState<ContactImportProcessor | null>(null);
  const [progress, setProgress] = useState<ChunkProgressEvent>({
    processed: 0,
    successful: 0,
    failed: 0,
    duplicates: 0,
    updated: 0,
    currentChunk: 0,
    totalChunks: 1,
    percentage: 0,
    throughputRowsPerSec: 0,
    currentErrors: [],
    logMessage: 'Initializing queue worker pool...',
  });

  // Completed State
  const [currentImportRecord, setCurrentImportRecord] = useState<ImportRecord | null>(null);
  const [completedSummary, setCompletedSummary] = useState<ImportSummaryStats | null>(null);
  const [allErrors, setAllErrors] = useState<ImportErrorItem[]>([]);

  // Historical Import Jobs List
  const [importHistory, setImportHistory] = useState<ImportRecord[]>([
    {
      id: 'imp-seed-001',
      fileName: 'mumbai_manufacturing_leads.csv',
      originalFileName: 'mumbai_manufacturing_leads.csv',
      filePath: 'imports/2026/08/mumbai_manufacturing_leads.csv',
      fileType: 'csv',
      totalRows: 1250,
      processedRows: 1250,
      successfulRows: 1180,
      failedRows: 12,
      duplicateRows: 58,
      updatedRows: 58,
      status: 'COMPLETED',
      duplicateHandling: 'UPDATE',
      defaultConsentStatus: 'single_opt_in',
      defaultConsentSource: 'B2B Trade Directory Export',
      defaultTags: ['Manufacturing', 'Mumbai Leads'],
      defaultLifecycleStage: 'lead',
      importedBy: 'Admin System',
      startedAt: '2026-08-15T10:30:00Z',
      completedAt: '2026-08-15T10:30:04Z',
      createdAt: '2026-08-15T10:29:50Z',
    },
    {
      id: 'imp-seed-002',
      fileName: 'delhi_ncr_tally_outstanding.xlsx',
      originalFileName: 'delhi_ncr_tally_outstanding.xlsx',
      filePath: 'imports/2026/08/delhi_ncr_tally_outstanding.xlsx',
      fileType: 'xlsx',
      totalRows: 480,
      processedRows: 480,
      successfulRows: 420,
      failedRows: 4,
      duplicateRows: 56,
      updatedRows: 56,
      status: 'COMPLETED',
      duplicateHandling: 'MERGE',
      defaultConsentStatus: 'double_opt_in',
      defaultConsentSource: 'TallyPrime Synchronizer',
      defaultTags: ['Tally Overdue', 'ERP Sync'],
      defaultLifecycleStage: 'customer',
      importedBy: 'Finance Controller',
      startedAt: '2026-08-20T14:10:00Z',
      completedAt: '2026-08-20T14:10:02Z',
      createdAt: '2026-08-20T14:09:40Z',
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload Handler
  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const parsed = await parseUploadedFile(file);
      setFileName(file.name);
      const ext = file.name.split('.').pop()?.toLowerCase();
      setFileType(ext === 'xlsx' ? 'xlsx' : (ext === 'xls' ? 'xls' : 'csv'));
      setHeaders(parsed.headers);
      setRawRows(parsed.rows);

      // Auto detect mappings
      initMappingsFromHeaders(parsed.headers);
      setWizardStep(2);
    } catch (err: any) {
      alert(err?.message || 'Failed to parse file. Please upload a valid CSV, XLS, or XLSX file.');
    } finally {
      setIsUploading(false);
    }
  };

  const initMappingsFromHeaders = (cols: string[]) => {
    const detected = autoDetectColumnMappings(cols);
    const mappingObj: Record<string, ImportMappingItem> = {};
    for (const [col, auto] of Object.entries(detected)) {
      mappingObj[col] = {
        id: `map-${col}`,
        importId: 'imp-active',
        sourceColumn: col,
        targetField: auto.targetField,
        transformationRule: auto.transformationRule,
        confidence: auto.confidence,
      };
    }
    setMappings(mappingObj);
  };

  const handleMappingChange = (header: string, targetField: string, rule: TransformationRule) => {
    setMappings((prev) => ({
      ...prev,
      [header]: {
        ...prev[header],
        targetField,
        transformationRule: rule,
      },
    }));
  };

  // Load standard sample data for instant testing
  const handleLoadSampleData = () => {
    const sampleHeaders = [
      'Full Name',
      'Work Email',
      'Mobile Number',
      'Company Name',
      'Job Title',
      'City',
      'GST Number',
      'Ledger Due Amount',
      'Category Tag',
    ];
    const sampleRows = [
      {
        'Full Name': 'Pooja Agarwal',
        'Work Email': 'pooja.agarwal@kalyanitools.com',
        'Mobile Number': '+919811223344',
        'Company Name': 'Kalyani Precision Tools',
        'Job Title': 'Procurement Head',
        'City': 'Pune',
        'GST Number': '27AAACK1122D1Z4',
        'Ledger Due Amount': '75000',
        'Category Tag': 'OEM, High Priority',
      },
      {
        'Full Name': 'Suresh Menon',
        'Work Email': 'suresh.m@cochinrefineries.org',
        'Mobile Number': '+919447112233',
        'Company Name': 'Cochin Maritime Refineries',
        'Job Title': 'Operations VP',
        'City': 'Kochi',
        'GST Number': '32AABCC9988E1Z1',
        'Ledger Due Amount': '120000',
        'Category Tag': 'Infrastructure, Maritime',
      },
      {
        'Full Name': 'Bhuvan Gupta', // Existing in seed data for deduplication test
        'Work Email': 'bhuvangupta.1711@gmail.com',
        'Mobile Number': '+919876543210',
        'Company Name': 'Apex Infotech Solutions Pvt Ltd',
        'Job Title': 'Chief Executive Officer',
        'City': 'Bengaluru',
        'GST Number': '29AAACA1234F1Z5',
        'Ledger Due Amount': '145200',
        'Category Tag': 'Key Account, IT',
      },
    ];

    setFileName('sample_enterprise_contacts.csv');
    setFileType('csv');
    setHeaders(sampleHeaders);
    setRawRows(sampleRows);
    initMappingsFromHeaders(sampleHeaders);
    setWizardStep(2);
  };

  // Benchmark generator: 1k or 10k rows
  const handleGenerateBenchmark = (rowCount: number) => {
    setIsUploading(true);
    setTimeout(() => {
      const generated = ImportSummaryService.generateBenchmarkDataset(rowCount);
      const cols = Object.keys(generated[0]);
      setFileName(`benchmark_dataset_${rowCount}_records.csv`);
      setFileType('csv');
      setHeaders(cols);
      setRawRows(generated);
      initMappingsFromHeaders(cols);
      setIsUploading(false);
      setWizardStep(2);
    }, 150);
  };

  // Execute Background Queued Import
  const handleStartImport = async () => {
    const importId = `imp-${Date.now()}`;
    const newRecord: ImportRecord = {
      id: importId,
      fileName,
      originalFileName: fileName,
      filePath: `imports/2026/09/${fileName}`,
      fileType,
      totalRows: rawRows.length,
      processedRows: 0,
      successfulRows: 0,
      failedRows: 0,
      duplicateRows: 0,
      updatedRows: 0,
      status: 'PROCESSING',
      duplicateHandling,
      defaultConsentStatus: consentStatus,
      defaultConsentSource: consentSource,
      defaultTags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      defaultLifecycleStage: lifecycleStage,
      importedBy: 'Admin User',
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setCurrentImportRecord(newRecord);
    setWizardStep(5);
    setIsPaused(false);

    const processor = new ContactImportProcessor();
    setProcessorInstance(processor);

    try {
      const result = await processor.processInChunks(
        rawRows,
        mappings,
        existingContacts,
        newRecord,
        chunkSize,
        (evt) => {
          setProgress(evt);
        }
      );

      // Finalize stats
      const finalImportRecord: ImportRecord = {
        ...newRecord,
        processedRows: result.summary.processed,
        successfulRows: result.summary.successful,
        failedRows: result.summary.failed,
        duplicateRows: result.summary.duplicate,
        updatedRows: result.summary.updated,
        status: result.summary.status,
        completedAt: new Date().toISOString(),
        summaryStats: result.summary,
      };

      setCurrentImportRecord(finalImportRecord);
      setCompletedSummary(result.summary);
      setAllErrors(result.allErrors);

      // Append to import history
      setImportHistory((prev) => [finalImportRecord, ...prev]);

      // Propagate contacts to parent store
      onImportComplete(result.importedContacts, result.updatedContacts);

      setWizardStep(6);
    } catch (err: any) {
      alert(`Import process failed: ${err?.message || 'Unknown queue error'}`);
    }
  };

  const handlePause = () => {
    processorInstance?.pause();
    setIsPaused(true);
  };

  const handleResume = () => {
    processorInstance?.resume();
    setIsPaused(false);
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to abort this import? Current chunk will finalize and remaining rows will be cancelled.')) {
      processorInstance?.cancel();
    }
  };

  const handleResetWizard = () => {
    setWizardStep(1);
    setFileName('');
    setHeaders([]);
    setRawRows([]);
    setMappings({});
    setCompletedSummary(null);
    setAllErrors([]);
    setIsPaused(false);
  };

  const handleInspectImport = (imp: ImportRecord) => {
    if (imp.summaryStats) {
      setCompletedSummary(imp.summaryStats);
      setCurrentImportRecord(imp);
      setFileName(imp.originalFileName);
      setWizardStep(6);
      setActiveView('wizard');
    } else {
      alert(`Job #${imp.id} completed. Total: ${imp.totalRows}, Success: ${imp.successfulRows}, Updated: ${imp.updatedRows}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Switcher Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Phase 2 Engine
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              CSV / XLS / XLSX Contact Import Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            High-throughput chunked ingestion pipeline with column auto-detection, deduplication, and suppression shielding.
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveView('wizard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeView === 'wizard' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Import Wizard
          </button>
          <button
            onClick={() => setActiveView('list')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeView === 'list' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Import History & Queue ({importHistory.length})
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {activeView === 'list' ? (
        <ImportRunsTable
          imports={importHistory}
          onStartNewImport={() => {
            handleResetWizard();
            setActiveView('wizard');
          }}
          onInspectImport={handleInspectImport}
          onOpenArchitecture={() => setIsArchitectureOpen(true)}
        />
      ) : (
        <div>
          {/* STEP 1: FILE UPLOAD */}
          {wizardStep === 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 max-w-4xl mx-auto">
              {/* Step indicator header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Upload Spreadsheet File</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      Step 1 of 6
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select a CSV, XLS, or XLSX file from your computer or run an automated enterprise benchmark test.
                  </p>
                </div>

                <button
                  onClick={() => setIsArchitectureOpen(true)}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Architecture Docs</span>
                </button>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/60 hover:bg-indigo-50/20 rounded-2xl p-10 text-center transition cursor-pointer group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  accept=".csv,.xls,.xlsx"
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center mx-auto transition shadow-xs">
                  <UploadCloud className="w-7 h-7" />
                </div>

                <div className="mt-4 space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    {isUploading ? 'Parsing file structure...' : 'Click to browse or drag and drop spreadsheet'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Supports CSV, XLS, XLSX (100k+ records chunk-processed with stream isolation)
                  </p>
                </div>
              </div>

              {/* Sample Data & Benchmark Scalability Testers */}
              <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Quick Testing & Stress Benchmark Generators:
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Simulates B2B ERP & CRM imports</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={handleLoadSampleData}
                    className="p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition cursor-pointer"
                  >
                    <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                      <span>Standard B2B Sample</span>
                      <span className="text-[10px] text-indigo-600 font-mono">3 rows</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Includes 1 existing duplicate, GSTIN, Tally balance, and tags.
                    </p>
                  </button>

                  <button
                    onClick={() => handleGenerateBenchmark(1000)}
                    className="p-3 bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition cursor-pointer"
                  >
                    <div className="font-bold text-xs text-indigo-900 flex items-center justify-between">
                      <span>Scale Benchmark 1K</span>
                      <span className="text-[10px] text-emerald-600 font-mono font-bold">1,000 rows</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Tests 2 chunks of 500 rows with duplicate & invalid syntax edge cases.
                    </p>
                  </button>

                  <button
                    onClick={() => handleGenerateBenchmark(10000)}
                    className="p-3 bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition cursor-pointer"
                  >
                    <div className="font-bold text-xs text-indigo-900 flex items-center justify-between">
                      <span>Massive Scale 10K</span>
                      <span className="text-[10px] text-purple-600 font-mono font-bold">10,000 rows</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Tests high-volume streaming, live throughput, and memory bounds.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {wizardStep === 2 && (
            <ImportMappingStep
              headers={headers}
              sampleRow={rawRows[0] || {}}
              mappings={mappings}
              onMappingChange={handleMappingChange}
              onAutoDetectAll={() => initMappingsFromHeaders(headers)}
              onNext={() => setWizardStep(3)}
              onBack={() => setWizardStep(1)}
              totalRows={rawRows.length}
              fileName={fileName}
            />
          )}

          {/* STEP 3: PREVIEW SAMPLE RECORDS */}
          {wizardStep === 3 && (
            <ImportPreviewStep
              rows={rawRows}
              mappings={mappings}
              onNext={() => setWizardStep(4)}
              onBack={() => setWizardStep(2)}
              totalRows={rawRows.length}
            />
          )}

          {/* STEP 4: IMPORT CONFIGURATION & DEDUPLICATION */}
          {wizardStep === 4 && (
            <ImportConfigStep
              duplicateHandling={duplicateHandling}
              onDuplicateHandlingChange={setDuplicateHandling}
              consentStatus={consentStatus}
              onConsentStatusChange={setConsentStatus}
              consentSource={consentSource}
              onConsentSourceChange={setConsentSource}
              tagsInput={tagsInput}
              onTagsInputChange={setTagsInput}
              chunkSize={chunkSize}
              onChunkSizeChange={setChunkSize}
              lifecycleStage={lifecycleStage}
              onLifecycleStageChange={setLifecycleStage}
              onStartImport={handleStartImport}
              onBack={() => setWizardStep(3)}
              totalRows={rawRows.length}
            />
          )}

          {/* STEP 5: REAL-TIME QUEUED PROGRESS */}
          {wizardStep === 5 && (
            <ImportProgressStep
              progress={progress}
              isPaused={isPaused}
              onPause={handlePause}
              onResume={handleResume}
              onCancel={handleCancel}
              fileName={fileName}
              totalRows={rawRows.length}
            />
          )}

          {/* STEP 6: IMPORT SUMMARY REPORT */}
          {wizardStep === 6 && completedSummary && (
            <ImportSummaryStep
              summary={completedSummary}
              errors={allErrors}
              fileName={fileName}
              onNavigateToContacts={onNavigateToContacts}
              onImportAnother={handleResetWizard}
              onOpenArchitecture={() => setIsArchitectureOpen(true)}
            />
          )}
        </div>
      )}

      {/* Technical Architecture Modal */}
      <LaravelImportArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />
    </div>
  );
};
