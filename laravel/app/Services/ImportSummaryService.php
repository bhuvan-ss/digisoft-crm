<?php

namespace App\Services;

use App\Models\Import;
use App\Models\ImportError;

class ImportSummaryService
{
    /**
     * Generate comprehensive post-import summary audit statistics.
     *
     * @param Import $import
     * @return array{
     *   total: int,
     *   successful: int,
     *   failed: int,
     *   duplicate: int,
     *   updated: int,
     *   duration_seconds: int,
     *   throughput_per_sec: float,
     *   top_error_reasons: array<string, int>,
     *   status: string
     * }
     */
    public function generateSummary(Import $import): array
    {
        $duration = $import->duration_seconds ?? 0;
        $throughput = $duration > 0 ? round($import->processed_rows / $duration, 1) : 0.0;

        // Group top error reasons
        $errorBreakdown = ImportError::where('import_id', $import->id)
            ->selectRaw('field_name, count(*) as count')
            ->groupBy('field_name')
            ->orderByDesc('count')
            ->pluck('count', 'field_name')
            ->toArray();

        $summary = [
            'total' => (int) $import->total_rows,
            'processed' => (int) $import->processed_rows,
            'successful' => (int) $import->successful_rows,
            'failed' => (int) $import->failed_rows,
            'duplicate' => (int) $import->duplicate_rows,
            'updated' => (int) $import->updated_rows,
            'duration_seconds' => $duration,
            'throughput_per_sec' => $throughput,
            'top_error_reasons' => $errorBreakdown,
            'status' => $import->status,
            'completed_at' => $import->completed_at?->toIso8601String(),
        ];

        // Cache summary into the import record
        $import->update([
            'summary_stats' => $summary,
        ]);

        return $summary;
    }

    /**
     * Generate downloadable CSV string containing failed rows and reasons for user remediation.
     */
    public function exportErrorsAsCsv(Import $import): string
    {
        $errors = ImportError::where('import_id', $import->id)
            ->orderBy('row_number')
            ->get();

        $output = fopen('php://temp', 'r+');
        fputcsv($output, ['Row Number', 'Field Name', 'Error Reason', 'Raw Data Payload']);

        foreach ($errors as $err) {
            fputcsv($output, [
                $err->row_number,
                $err->field_name ?? 'N/A',
                $err->error_message,
                json_encode($err->raw_data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            ]);
        }

        rewind($output);
        $csvContent = stream_get_contents($output) ?: '';
        fclose($output);

        return $csvContent;
    }
}
