<?php

namespace App\Jobs;

use App\Models\Import;
use App\Services\ContactImportProcessorService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessContactImportChunkJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Timeout for each chunk job (seconds).
     */
    public int $timeout = 180;

    /**
     * Max retries for transient database issues.
     */
    public int $tries = 3;

    public function __construct(
        public int $importId,
        public array $chunkRows,
        public int $chunkIndex
    ) {}

    public function handle(ContactImportProcessorService $processor): void
    {
        $import = Import::find($this->importId);
        if (!$import) {
            Log::error("Import #{$this->importId} not found in queue worker.");
            return;
        }

        // Cancel execution if user cancelled in UI
        if ($import->status === Import::STATUS_CANCELLED) {
            Log::info("Import #{$this->importId} cancelled by user. Skipping chunk #{$this->chunkIndex}.");
            return;
        }

        try {
            $processor->processChunk($import, $this->chunkRows);
        } catch (Throwable $e) {
            Log::error("Failed processing chunk #{$this->chunkIndex} for Import #{$this->importId}: " . $e->getMessage(), [
                'exception' => $e,
            ]);

            $import->increment('failed_rows', count($this->chunkRows));
            $import->increment('processed_rows', count($this->chunkRows));

            // Log error into import error log
            $existingLog = $import->error_log ?? [];
            $existingLog[] = [
                'chunk' => $this->chunkIndex,
                'error' => $e->getMessage(),
                'time' => now()->toIso8601String(),
            ];
            $import->update(['error_log' => $existingLog]);

            throw $e;
        }
    }
}
