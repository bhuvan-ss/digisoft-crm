<?php

namespace App\Livewire;

use App\Models\Import;
use App\Models\ImportMapping;
use App\Services\ColumnMappingService;
use App\Services\ContactImportProcessorService;
use App\Services\ContactImportValidationService;
use App\Services\CsvChunkReaderService;
use App\Services\ImportSummaryService;
use Livewire\Component;
use Livewire\WithFileUploads;

class ContactImportWizard extends Component
{
    use WithFileUploads;

    // Wizard Step State (1: Upload, 2: Map Columns, 3: Preview, 4: Duplicate Rules, 5: Progress, 6: Summary)
    public int $currentStep = 1;

    // File upload
    public $file;
    public ?int $importId = null;
    public array $headers = [];
    public int $totalRows = 0;

    // Mapping state
    public array $mappings = []; // [colName => ['target_field' => ..., 'transformation_rule' => ...]]
    public array $suggestedMappings = [];
    public array $samplePreviews = [];

    // Duplicate handling & configuration
    public string $duplicateHandling = 'UPDATE';
    public string $defaultConsentStatus = 'single_opt_in';
    public string $defaultConsentSource = 'Spreadsheet Batch Import';
    public string $defaultTags = 'Batch Imported';
    public string $defaultLifecycleStage = 'lead';

    // Live progress state
    public array $progressStats = [
        'processed' => 0,
        'successful' => 0,
        'failed' => 0,
        'duplicate' => 0,
        'updated' => 0,
        'percentage' => 0.0,
        'throughput' => 0.0,
        'status' => 'UPLOADED',
    ];

    // Summary statistics
    public array $summaryReport = [];

    public function mount(?int $importId = null): void
    {
        if ($importId) {
            $this->importId = $importId;
            $import = Import::find($importId);
            if ($import) {
                $this->currentStep = $import->status === Import::STATUS_COMPLETED ? 6 : 5;
                $this->refreshProgress();
            }
        }
    }

    /**
     * Step 1: Upload and auto-detect columns
     */
    public function handleFileUpload(CsvChunkReaderService $reader, ColumnMappingService $mappingService): void
    {
        $this->validate([
            'file' => 'required|file|mimes:csv,txt,xls,xlsx|max:102400',
        ]);

        $storedPath = $this->file->store('imports', 'local');
        $absolutePath = storage_path("app/{$storedPath}");

        $inspection = $reader->inspect($absolutePath);
        $this->headers = $inspection['headers'];
        $this->totalRows = $inspection['total_rows'];

        $import = Import::create([
            'file_name' => basename($storedPath),
            'original_file_name' => $this->file->getClientOriginalName(),
            'file_path' => $absolutePath,
            'file_type' => $this->file->getClientOriginalExtension(),
            'total_rows' => $this->totalRows,
            'status' => Import::STATUS_UPLOADED,
        ]);

        $this->importId = $import->id;

        // Auto-detect mappings
        $detected = $mappingService->autoDetect($this->headers);
        $this->suggestedMappings = $detected;
        $this->mappings = [];

        foreach ($this->headers as $h) {
            $this->mappings[$h] = [
                'target_field' => $detected[$h]['target_field'] ?? '',
                'transformation_rule' => $detected[$h]['transformation_rule'] ?? 'trim',
            ];
        }

        $this->currentStep = 2;
    }

    /**
     * Step 2: Validate column mappings & advance to Preview
     */
    public function confirmMappings(CsvChunkReaderService $reader, ColumnMappingService $mappingService, ContactImportValidationService $validator): void
    {
        $import = Import::findOrFail($this->importId);
        $import->mappings()->delete();

        foreach ($this->mappings as $col => $config) {
            if (!empty($config['target_field'])) {
                ImportMapping::create([
                    'import_id' => $import->id,
                    'source_column' => $col,
                    'target_field' => $config['target_field'],
                    'transformation_rule' => $config['transformation_rule'] ?? 'trim',
                ]);
            }
        }

        // Generate sample preview records
        $rawPreview = $reader->preview($import->file_path, 8);
        $this->samplePreviews = [];

        foreach ($rawPreview['rows'] as $idx => $row) {
            $mapped = [];
            foreach ($row as $c => $val) {
                if (!empty($this->mappings[$c]['target_field'])) {
                    $target = $this->mappings[$c]['target_field'];
                    $rule = $this->mappings[$c]['transformation_rule'] ?? 'trim';
                    $mapped[$target] = $mappingService->applyTransformation($val, $rule);
                }
            }
            $valCheck = $validator->validateRow($mapped, $idx + 2);
            $this->samplePreviews[] = [
                'row' => $idx + 2,
                'mapped' => $mapped,
                'is_valid' => $valCheck['is_valid'],
                'errors' => $valCheck['errors'],
            ];
        }

        $import->update(['status' => Import::STATUS_READY]);
        $this->currentStep = 3;
    }

    /**
     * Step 3 -> 4: Configure Duplicate Strategy
     */
    public function proceedToDuplicateRules(): void
    {
        $this->currentStep = 4;
    }

    /**
     * Step 4 -> 5: Launch Queued Import Processing
     */
    public function startImport(): void
    {
        $import = Import::findOrFail($this->importId);
        $import->update([
            'duplicate_handling' => $this->duplicateHandling,
            'default_consent_status' => $this->defaultConsentStatus,
            'default_consent_source' => $this->defaultConsentSource,
            'default_tags' => $this->defaultTags,
            'default_lifecycle_stage' => $this->defaultLifecycleStage,
            'status' => Import::STATUS_PROCESSING,
            'started_at' => now(),
        ]);

        $this->currentStep = 5;
    }

    /**
     * Live Wire polling method for Step 5
     */
    public function refreshProgress(ImportSummaryService $summaryService = null): void
    {
        if (!$this->importId) return;

        $import = Import::find($this->importId);
        if (!$import) return;

        $this->progressStats = [
            'processed' => $import->processed_rows,
            'successful' => $import->successful_rows,
            'failed' => $import->failed_rows,
            'duplicate' => $import->duplicate_rows,
            'updated' => $import->updated_rows,
            'percentage' => $import->progress_percentage,
            'throughput' => $import->throughput_per_second,
            'status' => $import->status,
        ];

        if ($import->status === Import::STATUS_COMPLETED && $this->currentStep === 5) {
            $summaryService = $summaryService ?? app(ImportSummaryService::class);
            $this->summaryReport = $summaryService->generateSummary($import);
            $this->currentStep = 6;
        }
    }

    /**
     * Render the Livewire component view.
     */
    public function render()
    {
        return view('livewire.contact-import-wizard', [
            'availableTargets' => [
                'full_name' => 'Full Name',
                'first_name' => 'First Name',
                'last_name' => 'Last Name',
                'email' => 'Email Address (Normalized)',
                'mobile' => 'Mobile Number (Normalized E.164)',
                'company_name' => 'Company / Account Name',
                'gstin' => 'GSTIN (Tax ID)',
                'designation' => 'Designation / Job Title',
                'department' => 'Department',
                'city' => 'City',
                'state' => 'State',
                'country' => 'Country',
                'pincode' => 'Pincode / Postal Code',
                'outstanding_balance' => 'Tally Outstanding Balance',
                'tags' => 'Contact Tags',
            ],
            'availableRules' => ColumnMappingService::TRANSFORMATION_RULES,
        ]);
    }
}
