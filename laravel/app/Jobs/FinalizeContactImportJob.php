<?php

namespace App\Jobs;

use App\Models\Import;
use App\Services\ImportSummaryService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class FinalizeContactImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $importId
    ) {}

    public function handle(ImportSummaryService $summaryService): void
    {
        $import = Import::find($this->importId);
        if (!$import) {
            return;
        }

        if ($import->status === Import::STATUS_CANCELLED) {
            return;
        }

        $import->update([
            'status' => Import::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);

        $summary = $summaryService->generateSummary($import);

        Log::info("Finalized Contact Import #{$this->importId}", [
            'total' => $summary['total'],
            'successful' => $summary['successful'],
            'updated' => $summary['updated'],
            'failed' => $summary['failed'],
            'duplicates' => $summary['duplicate'],
            'throughput_per_sec' => $summary['throughput_per_sec'],
        ]);
    }
}
