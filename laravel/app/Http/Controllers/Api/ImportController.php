<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\FinalizeContactImportJob;
use App\Jobs\ProcessContactImportChunkJob;
use App\Models\Import;
use App\Models\ImportError;
use App\Models\ImportMapping;
use App\Services\ColumnMappingService;
use App\Services\ContactImportProcessorService;
use App\Services\ContactImportValidationService;
use App\Services\CsvChunkReaderService;
use App\Services\ImportSummaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class ImportController extends Controller
{
    public function __construct(
        protected CsvChunkReaderService $chunkReader,
        protected ColumnMappingService $mappingService,
        protected ContactImportValidationService $validationService,
        protected ContactImportProcessorService $processorService,
        protected ImportSummaryService $summaryService
    ) {}

    /**
     * List historical import jobs.
     */
    public function index(Request $request): JsonResponse
    {
        $imports = Import::withCount(['mappings', 'errors'])
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 15));

        return response()->json($imports);
    }

    /**
     * Step 1: Upload file and create Import job record.
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xls,xlsx|max:102400', // max 100MB
        ]);

        $uploadedFile = $request->file('file');
        $originalName = $uploadedFile->getClientOriginalName();
        $extension = strtolower($uploadedFile->getClientOriginalExtension());
        $storedPath = $uploadedFile->storeAs('imports', uniqid('imp_') . '.' . $extension, 'local');
        $absolutePath = Storage::disk('local')->path($storedPath);

        // Inspect headers and calculate total rows
        try {
            $inspection = $this->chunkReader->inspect($absolutePath);
        } catch (Throwable $e) {
            return response()->json([
                'error' => 'File inspection failed: ' . $e->getMessage(),
            ], 422);
        }

        $import = Import::create([
            'file_name' => basename($storedPath),
            'original_file_name' => $originalName,
            'file_path' => $absolutePath,
            'file_type' => $extension,
            'total_rows' => $inspection['total_rows'],
            'processed_rows' => 0,
            'successful_rows' => 0,
            'failed_rows' => 0,
            'duplicate_rows' => 0,
            'updated_rows' => 0,
            'status' => Import::STATUS_UPLOADED,
            'imported_by' => auth()->id() ?? null,
        ]);

        // Auto-detect mappings immediately
        $autoDetected = $this->mappingService->autoDetect($inspection['headers']);

        return response()->json([
            'import' => $import,
            'headers' => $inspection['headers'],
            'total_rows' => $inspection['total_rows'],
            'suggested_mappings' => $autoDetected,
        ], 201);
    }

    /**
     * Step 2: Auto-detect column mappings for uploaded file.
     */
    public function detectMappings(int $id): JsonResponse
    {
        $import = Import::findOrFail($id);
        $inspection = $this->chunkReader->inspect($import->file_path);
        $detected = $this->mappingService->autoDetect($inspection['headers']);

        return response()->json([
            'headers' => $inspection['headers'],
            'suggested_mappings' => $detected,
            'available_transformations' => ColumnMappingService::TRANSFORMATION_RULES,
        ]);
    }

    /**
     * Step 2 (Submit): Save column mappings.
     */
    public function saveMappings(Request $request, int $id): JsonResponse
    {
        $import = Import::findOrFail($id);

        $request->validate([
            'mappings' => 'required|array',
            'mappings.*.source_column' => 'required|string',
            'mappings.*.target_field' => 'nullable|string',
            'mappings.*.transformation_rule' => 'nullable|string',
        ]);

        // Delete any prior mappings for this import
        $import->mappings()->delete();

        $saved = [];
        foreach ($request->input('mappings') as $item) {
            if (!empty($item['target_field'])) {
                $saved[] = ImportMapping::create([
                    'import_id' => $import->id,
                    'source_column' => $item['source_column'],
                    'target_field' => $item['target_field'],
                    'transformation_rule' => $item['transformation_rule'] ?? 'trim',
                ]);
            }
        }

        $import->update(['status' => Import::STATUS_READY]);

        return response()->json([
            'message' => 'Column mappings saved successfully.',
            'count' => count($saved),
            'mappings' => $saved,
        ]);
    }

    /**
     * Step 3: Preview sample records with applied mappings & validation diagnostics.
     */
    public function preview(int $id, Request $request): JsonResponse
    {
        $import = Import::with('mappings')->findOrFail($id);
        $limit = $request->input('limit', 10);

        $rawPreview = $this->chunkReader->preview($import->file_path, $limit);
        $mappings = $import->mappings->keyBy('source_column');

        $previewRecords = [];
        foreach ($rawPreview['rows'] as $index => $rawRow) {
            $mappedRecord = [];
            foreach ($rawRow as $col => $val) {
                if (isset($mappings[$col]) && $mappings[$col]->target_field) {
                    $target = $mappings[$col]->target_field;
                    $rule = $mappings[$col]->transformation_rule;
                    $mappedRecord[$target] = $this->mappingService->applyTransformation($val, $rule);
                }
            }

            // Run validation check on sample
            $validation = $this->validationService->validateRow($mappedRecord, $index + 2);

            $previewRecords[] = [
                'row_number' => $index + 2,
                'raw' => $rawRow,
                'mapped' => $mappedRecord,
                'is_valid' => $validation['is_valid'],
                'errors' => $validation['errors'],
            ];
        }

        return response()->json([
            'headers' => $rawPreview['headers'],
            'samples' => $previewRecords,
            'total_rows' => $import->total_rows,
        ]);
    }

    /**
     * Step 4 & 5: Configure duplicate rules and dispatch queued chunk processing.
     */
    public function start(Request $request, int $id): JsonResponse
    {
        $import = Import::with('mappings')->findOrFail($id);

        $request->validate([
            'duplicate_handling' => 'required|in:SKIP,UPDATE,POTENTIAL_DUPLICATE,MERGE',
            'default_consent_status' => 'nullable|string',
            'default_consent_source' => 'nullable|string',
            'default_tags' => 'nullable|string',
            'chunk_size' => 'nullable|integer|min:100|max:5000',
        ]);

        $chunkSize = $request->input('chunk_size', 1000);

        $import->update([
            'duplicate_handling' => $request->input('duplicate_handling', Import::DUP_UPDATE),
            'default_consent_status' => $request->input('default_consent_status', 'single_opt_in'),
            'default_consent_source' => $request->input('default_consent_source', 'Spreadsheet Batch Import'),
            'default_tags' => $request->input('default_tags', 'Imported'),
            'status' => Import::STATUS_PROCESSING,
            'started_at' => now(),
        ]);

        // Stream file in chunks and dispatch jobs to Laravel Queue
        $chunksCount = 0;
        foreach ($this->chunkReader->readChunks($import->file_path, $chunkSize) as $chunkData) {
            ProcessContactImportChunkJob::dispatch(
                $import->id,
                $chunkData['rows'],
                $chunkData['chunk_index']
            );
            $chunksCount++;
        }

        // Dispatch finalizer job after chunks
        FinalizeContactImportJob::dispatch($import->id);

        return response()->json([
            'message' => "Import job queued with {$chunksCount} background chunks.",
            'import_id' => $import->id,
            'chunks_dispatched' => $chunksCount,
            'status' => $import->status,
        ]);
    }

    /**
     * Step 6: Live Progress Polling endpoint.
     */
    public function progress(int $id): JsonResponse
    {
        $import = Import::findOrFail($id);

        return response()->json([
            'id' => $import->id,
            'status' => $import->status,
            'total_rows' => $import->total_rows,
            'processed_rows' => $import->processed_rows,
            'successful_rows' => $import->successful_rows,
            'failed_rows' => $import->failed_rows,
            'duplicate_rows' => $import->duplicate_rows,
            'updated_rows' => $import->updated_rows,
            'progress_percentage' => $import->progress_percentage,
            'duration_seconds' => $import->duration_seconds,
            'throughput_per_sec' => $import->throughput_per_second,
            'completed_at' => $import->completed_at?->toIso8601String(),
        ]);
    }

    /**
     * Step 6: Full Summary & Audit Statistics.
     */
    public function summary(int $id): JsonResponse
    {
        $import = Import::findOrFail($id);
        $summary = $this->summaryService->generateSummary($import);

        return response()->json($summary);
    }

    /**
     * Download or view Error Log.
     */
    public function errors(int $id, Request $request): JsonResponse|StreamedResponse
    {
        $import = Import::findOrFail($id);

        if ($request->boolean('export_csv')) {
            $csv = $this->summaryService->exportErrorsAsCsv($import);
            return response()->streamDownload(function () use ($csv) {
                echo $csv;
            }, "import_{$import->id}_errors.csv", [
                'Content-Type' => 'text/csv',
            ]);
        }

        $errors = ImportError::where('import_id', $import->id)
            ->orderBy('row_number')
            ->paginate($request->input('per_page', 50));

        return response()->json($errors);
    }

    /**
     * Cancel running import job.
     */
    public function cancel(int $id): JsonResponse
    {
        $import = Import::findOrFail($id);

        if (!$import->canBeCancelled()) {
            return response()->json(['error' => 'Import cannot be cancelled in its current state.'], 400);
        }

        $import->update([
            'status' => Import::STATUS_CANCELLED,
            'completed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Import marked as CANCELLED. In-flight jobs will be aborted.',
            'status' => $import->status,
        ]);
    }
}
