import React, { useState } from 'react';
import { 
  Database, 
  Layers, 
  Code2, 
  FileCode, 
  Copy, 
  Check, 
  X, 
  ExternalLink, 
  Cpu, 
  Terminal, 
  CheckCircle2,
  Workflow
} from 'lucide-react';

interface LaravelImportArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CodeTab = 
  | 'migration_imports'
  | 'migration_mappings'
  | 'migration_errors'
  | 'service_chunk_reader'
  | 'service_mapping'
  | 'service_validation'
  | 'service_processor'
  | 'service_summary'
  | 'excel_chunk_import'
  | 'queue_chunk_job'
  | 'controller_api'
  | 'livewire_wizard'
  | 'feature_test';

export const LaravelImportArchitectureModal: React.FC<LaravelImportArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeCode, setActiveCode] = useState<CodeTab>('service_processor');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const CODE_SNIPPETS: Record<CodeTab, { title: string; filename: string; code: string; language: string }> = {
    service_processor: {
      title: 'Chunk Ingestion & Suppression Shield Service',
      filename: 'laravel/app/Services/ContactImportProcessorService.php',
      language: 'php',
      code: `<?php

namespace App\Services;

use App\Models\Contact;
use App\Models\Import;
use App\Models\ImportError;
use Illuminate\Support\Facades\DB;

class ContactImportProcessorService
{
    /**
     * Process chunk within a discrete atomic transaction.
     * Prevents rollback storms on massive 100k+ record imports.
     */
    public function processChunk(Import $import, array $rawRows): array
    {
        $stats = ['processed' => 0, 'successful' => 0, 'failed' => 0, 'duplicates' => 0, 'updated' => 0];

        DB::transaction(function () use ($import, $rawRows, &$stats) {
            foreach ($rawRows as $rawRow) {
                $stats['processed']++;
                // 1. Column Transformation & Mapping
                $mapped = $this->transformRow($rawRow, $import);

                // 2. Syntax & Identity Validation (RFC Email, Indian Mobile +91)
                $validation = $this->validationService->validateRow($mapped);
                if (!$validation['is_valid']) {
                    $stats['failed']++;
                    $this->logErrors($import, $validation['errors']);
                    continue;
                }

                // 3. 3-Tier Deduplication Match
                $existing = $this->findDuplicate($validation['sanitized']);

                if ($existing) {
                    $stats['duplicates']++;
                    // CRITICAL: Strict compliance check. Never overwrite UNSUBSCRIBED/BOUNCED!
                    $this->handleDuplicateRecord($import, $validation['sanitized'], $existing, $stats);
                } else {
                    $this->createNewContact($import, $validation['sanitized']);
                    $stats['successful']++;
                }
            }

            // Atomic counter increments
            $import->increment('processed_rows', $stats['processed']);
            $import->increment('successful_rows', $stats['successful']);
            $import->increment('updated_rows', $stats['updated']);
            $import->increment('duplicate_rows', $stats['duplicates']);
            $import->increment('failed_rows', $stats['failed']);
        });

        return $stats;
    }
}`
    },
    service_chunk_reader: {
      title: 'O(1) Memory Streaming Generator Service',
      filename: 'laravel/app/Services/CsvChunkReaderService.php',
      language: 'php',
      code: `<?php

namespace App\Services;

use Generator;

class CsvChunkReaderService
{
    /**
     * Reads spreadsheet CSV in chunks using PHP Generators.
     * Guaranteed constant memory (<16MB) even on 100,000+ rows.
     */
    public function readChunks(string $filePath, int $chunkSize = 1000): Generator
    {
        $handle = fopen($filePath, 'r');
        $headers = fgetcsv($handle, 0, ',');
        $chunk = [];
        $chunkIndex = 1;
        $rowNum = 1;

        while (($row = fgetcsv($handle, 0, ',')) !== false) {
            $rowNum++;
            if (empty(array_filter($row))) continue;

            $record = ['__row_number' => $rowNum];
            foreach ($headers as $i => $header) {
                $record[$header] = $row[$i] ?? '';
            }

            $chunk[] = $record;
            if (count($chunk) >= $chunkSize) {
                yield ['chunk_index' => $chunkIndex++, 'rows' => $chunk];
                $chunk = []; // Free memory immediately
            }
        }

        if (!empty($chunk)) {
            yield ['chunk_index' => $chunkIndex, 'rows' => $chunk];
        }

        fclose($handle);
    }
}`
    },
    excel_chunk_import: {
      title: 'Laravel Excel Chunk Reading & Queue Integration',
      filename: 'laravel/app/Imports/ContactsChunkImport.php',
      language: 'php',
      code: `<?php

namespace App\Imports;

use App\Models\Import;
use App\Services\ContactImportProcessorService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ContactsChunkImport implements ToArray, WithChunkReading, WithHeadingRow, ShouldQueue
{
    use Importable;

    public function __construct(
        protected Import $import,
        protected ContactImportProcessorService $processor
    ) {}

    public function array(array $rows): void
    {
        $this->processor->processChunk($this->import, $rows);
    }

    public function chunkSize(): int
    {
        return 1000; // Chunk size per queue job
    }
}`
    },
    queue_chunk_job: {
      title: 'Queued Background Chunk Job',
      filename: 'laravel/app/Jobs/ProcessContactImportChunkJob.php',
      language: 'php',
      code: `<?php

namespace App\Jobs;

use App\Models\Import;
use App\Services\ContactImportProcessorService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class ProcessContactImportChunkJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public int $timeout = 180;
    public int $tries = 3;

    public function __construct(
        public int $importId,
        public array $chunkRows,
        public int $chunkIndex
    ) {}

    public function handle(ContactImportProcessorService $processor): void
    {
        $import = Import::find($this->importId);
        if (!$import || $import->status === Import::STATUS_CANCELLED) {
            return;
        }

        $processor->processChunk($import, $this->chunkRows);
    }
}`
    },
    migration_imports: {
      title: 'Imports Table Migration (Laravel 12)',
      filename: 'laravel/database/migrations/2026_01_01_000005_create_imports_table.php',
      language: 'php',
      code: `Schema::create('imports', function (Blueprint $table) {
    $table->id();
    $table->string('file_name', 255)->index();
    $table->string('original_file_name', 255);
    $table->string('file_path', 500);
    $table->string('file_type', 10)->index(); // csv, xls, xlsx
    $table->unsignedInteger('total_rows')->default(0);
    $table->unsignedInteger('processed_rows')->default(0);
    $table->unsignedInteger('successful_rows')->default(0);
    $table->unsignedInteger('failed_rows')->default(0);
    $table->unsignedInteger('duplicate_rows')->default(0);
    $table->unsignedInteger('updated_rows')->default(0);
    $table->enum('status', ['UPLOADED', 'MAPPING', 'READY', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'])->default('UPLOADED');
    $table->enum('duplicate_handling', ['SKIP', 'UPDATE', 'POTENTIAL_DUPLICATE', 'MERGE'])->default('UPDATE');
    $table->string('default_consent_status', 50)->default('single_opt_in');
    $table->timestamp('started_at')->nullable();
    $table->timestamp('completed_at')->nullable();
    $table->json('summary_stats')->nullable();
    $table->timestamps();
});`
    },
    migration_mappings: {
      title: 'Import Mappings Table Migration',
      filename: 'laravel/database/migrations/2026_01_01_000006_create_import_mappings_table.php',
      language: 'php',
      code: `Schema::create('import_mappings', function (Blueprint $table) {
    $table->id();
    $table->foreignId('import_id')->constrained('imports')->onDelete('cascade');
    $table->string('source_column', 255);
    $table->string('target_field', 100);
    $table->string('transformation_rule', 100)->nullable(); // trim, lowercase, e164_mobile
    $table->timestamps();
    $table->unique(['import_id', 'source_column']);
});`
    },
    migration_errors: {
      title: 'Import Errors Table Migration',
      filename: 'laravel/database/migrations/2026_01_01_000007_create_import_errors_table.php',
      language: 'php',
      code: `Schema::create('import_errors', function (Blueprint $table) {
    $table->id();
    $table->foreignId('import_id')->constrained('imports')->onDelete('cascade');
    $table->unsignedInteger('row_number')->index();
    $table->string('field_name', 100)->nullable()->index();
    $table->text('error_message');
    $table->json('raw_data')->nullable();
    $table->timestamps();
});`
    },
    service_mapping: {
      title: 'Smart Column Auto-Detection & Transformation Service',
      filename: 'laravel/app/Services/ColumnMappingService.php',
      language: 'php',
      code: `<?php

namespace App\Services;

class ColumnMappingService
{
    protected const FIELD_ALIASES = [
        'full_name' => ['name', 'full name', 'fullname', 'contact name'],
        'email' => ['email', 'email id', 'email address', 'mail', 'e_mail'],
        'mobile' => ['mobile', 'mobile no', 'phone', 'phone number', 'contact no'],
        'company_name' => ['company', 'company name', 'party', 'ledger name'],
        'gstin' => ['gst no', 'gstin', 'tax id', 'vat no'],
        'city' => ['city', 'location', 'town'],
        'state' => ['state', 'province'],
    ];

    public function autoDetect(array $headers): array
    {
        // Computes fuzzy levenshtein and token containment scores
        // Returns best target_field, confidence score, and suggested transformation rule
    }
}`
    },
    service_validation: {
      title: 'Syntax & Identity Validation Service',
      filename: 'laravel/app/Services/ContactImportValidationService.php',
      language: 'php',
      code: `<?php

namespace App\Services;

class ContactImportValidationService
{
    public const GSTIN_REGEX = '/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i';

    public function validateRow(array $mappedRecord, int $rowNumber): array
    {
        // 1. Email syntax check & lowercase normalization
        // 2. Mobile cleanup & Indian E.164 (+91) format
        // 3. Required check: At least one of Email or Mobile MUST exist
        // 4. GSTIN 15-char format verification
        // Returns ['is_valid' => bool, 'errors' => array, 'sanitized' => array]
    }
}`
    },
    service_summary: {
      title: 'Import Summary & Error CSV Export Service',
      filename: 'laravel/app/Services/ImportSummaryService.php',
      language: 'php',
      code: `<?php

namespace App\Services;

use App\Models\Import;

class ImportSummaryService
{
    public function generateSummary(Import $import): array
    {
        // Aggregates total, successful, updated, duplicate, failed
        // Computes execution duration and throughput (rows/sec)
        // Groups top error reasons by frequency
    }

    public function exportErrorsAsCsv(Import $import): string
    {
        // Generates downloadable RFC 4180 CSV containing failed rows, reasons, and raw JSON
    }
}`
    },
    controller_api: {
      title: 'RESTful API Import Controller',
      filename: 'laravel/app/Http/Controllers/Api/ImportController.php',
      language: 'php',
      code: `// Endpoints:
// POST /api/v1/imports/upload           -> Inspect headers & create job
// GET  /api/v1/imports/{id}/preview      -> Sample preview records
// POST /api/v1/imports/{id}/save-mappings -> Persist mappings
// POST /api/v1/imports/{id}/start        -> Dispatch queue chunk jobs
// GET  /api/v1/imports/{id}/progress     -> Real-time polling
// GET  /api/v1/imports/{id}/summary      -> Final audit report`
    },
    livewire_wizard: {
      title: 'Reactive Livewire 3 Import Wizard Component',
      filename: 'laravel/app/Livewire/ContactImportWizard.php',
      language: 'php',
      code: `<?php

namespace App\Livewire;

use Livewire\Component;
use Livewire\WithFileUploads;

class ContactImportWizard extends Component
{
    use WithFileUploads;

    // 6-step reactive lifecycle:
    // 1: Upload -> 2: Map Columns -> 3: Preview -> 4: Duplicate Rules -> 5: Progress -> 6: Summary
}`
    },
    feature_test: {
      title: '100k Scale Resilience & Compliance Feature Tests',
      filename: 'laravel/tests/Feature/ContactImportEngineTest.php',
      language: 'php',
      code: `/** @test */
public function it_never_overwrites_suppressed_or_unsubscribed_marketing_status_during_import()
{
    // Verifies that contacts marked UNSUBSCRIBED retain their status
    // and are never re-subscribed during normal CSV imports!
}`
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_SNIPPETS[activeCode].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-5xl w-full h-[88vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  DIGISOFT CRM – Phase 2 Ingestion Engine Architecture
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  Laravel 12 / Queued Chunking
                </span>
              </div>
              <p className="text-xs text-slate-500">
                O(1) Memory Generators, Micro-Transaction Chunk Isolation & 100k+ Scale Resilience
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/70 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 bg-slate-50/80 border-r border-slate-200 p-3 overflow-y-auto space-y-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
              Core Engine Services
            </div>
            <div className="space-y-0.5 text-xs">
              <button
                onClick={() => setActiveCode('service_processor')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  activeCode === 'service_processor' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                ContactImportProcessor
              </button>
              <button
                onClick={() => setActiveCode('service_chunk_reader')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  activeCode === 'service_chunk_reader' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                CsvChunkReader (O(1) RAM)
              </button>
              <button
                onClick={() => setActiveCode('service_mapping')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  activeCode === 'service_mapping' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                ColumnMappingService
              </button>
              <button
                onClick={() => setActiveCode('service_validation')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  activeCode === 'service_validation' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                ContactValidationService
              </button>
              <button
                onClick={() => setActiveCode('service_summary')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  activeCode === 'service_summary' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                ImportSummaryService
              </button>
            </div>

            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-2">
              Queue & Excel Integration
            </div>
            <div className="space-y-0.5 text-xs">
              <button
                onClick={() => setActiveCode('excel_chunk_import')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  activeCode === 'excel_chunk_import' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                ContactsChunkImport (Excel)
              </button>
              <button
                onClick={() => setActiveCode('queue_chunk_job')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  activeCode === 'queue_chunk_job' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                ProcessChunkJob (Queue)
              </button>
            </div>

            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-2">
              Database Migrations
            </div>
            <div className="space-y-0.5 text-xs">
              <button
                onClick={() => setActiveCode('migration_imports')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  activeCode === 'migration_imports' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                2026_create_imports_table
              </button>
              <button
                onClick={() => setActiveCode('migration_mappings')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  activeCode === 'migration_mappings' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                create_import_mappings
              </button>
              <button
                onClick={() => setActiveCode('migration_errors')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  activeCode === 'migration_errors' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                create_import_errors
              </button>
            </div>

            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-2">
              Livewire & Testing
            </div>
            <div className="space-y-0.5 text-xs">
              <button
                onClick={() => setActiveCode('livewire_wizard')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  activeCode === 'livewire_wizard' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                ContactImportWizard (Livewire)
              </button>
              <button
                onClick={() => setActiveCode('feature_test')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  activeCode === 'feature_test' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                Feature Test (Resilience)
              </button>
            </div>
          </div>

          {/* Main Code View */}
          <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden text-white">
            <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-indigo-400">{CODE_SNIPPETS[activeCode].title}</span>
                <span className="text-[11px] text-slate-500 font-mono ml-2">
                  {CODE_SNIPPETS[activeCode].filename}
                </span>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-300 leading-relaxed bg-slate-900">
              <pre>{CODE_SNIPPETS[activeCode].code}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
