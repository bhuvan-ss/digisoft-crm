<?php

namespace App\Imports;

use App\Models\Import;
use App\Services\ContactImportProcessorService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\OnEachRow;
use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Row;

/**
 * Scalable Laravel Excel Import handler for XLS/XLSX/CSV.
 * Processes 100,000+ rows via queued chunk reading (1,000 rows per batch)
 * with dedicated chunk transactions.
 */
class ContactsChunkImport implements ToArray, WithChunkReading, WithHeadingRow, ShouldQueue
{
    use Importable;

    protected Import $import;
    protected ContactImportProcessorService $processor;

    public function __construct(Import $import, ContactImportProcessorService $processor)
    {
        $this->import = $import;
        $this->processor = $processor;
    }

    /**
     * Process chunk of rows.
     */
    public function array(array $rows): void
    {
        // Add row index offset for accurate row numbers
        $indexedRows = [];
        $baseOffset = $this->import->processed_rows + 2; // +1 for 0-index, +1 for header row

        foreach ($rows as $idx => $row) {
            $row['__row_number'] = $baseOffset + $idx;
            $indexedRows[] = $row;
        }

        $this->processor->processChunk($this->import, $indexedRows);
    }

    /**
     * Batch size for reading chunks.
     * Prevents loading complete file into memory.
     */
    public function chunkSize(): int
    {
        return 1000;
    }
}
