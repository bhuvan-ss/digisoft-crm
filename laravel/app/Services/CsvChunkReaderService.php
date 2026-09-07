<?php

namespace App\Services;

use Generator;
use InvalidArgumentException;
use RuntimeException;

/**
 * High-performance streaming reader for CSV/Excel data.
 * Uses PHP Generators to process files with 100,000+ rows in constant O(1) memory.
 */
class CsvChunkReaderService
{
    /**
     * Inspect file headers and estimate total rows.
     */
    public function inspect(string $filePath, string $delimiter = ','): array
    {
        if (!file_exists($filePath)) {
            throw new InvalidArgumentException("Import file not found: {$filePath}");
        }

        $handle = fopen($filePath, 'r');
        if ($handle === false) {
            throw new RuntimeException("Unable to open file for inspection: {$filePath}");
        }

        // Auto-detect delimiter if comma yields 1 column
        $firstLine = fgets($handle);
        if ($firstLine !== false) {
            if (substr_count($firstLine, "\t") > substr_count($firstLine, ',')) {
                $delimiter = "\t";
            } elseif (substr_count($firstLine, ';') > substr_count($firstLine, ',')) {
                $delimiter = ';';
            }
        }
        rewind($handle);

        $headers = fgetcsv($handle, 0, $delimiter);
        if ($headers === false || empty($headers)) {
            fclose($handle);
            throw new RuntimeException("File contains no valid headers.");
        }

        // Clean UTF-8 BOM if present on first header
        $headers[0] = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $headers[0]) ?? $headers[0];
        $headers = array_map('trim', $headers);

        // Fast row counter using line streaming
        $totalRows = 0;
        while (!feof($handle)) {
            $line = fgets($handle);
            if ($line !== false && trim($line) !== '') {
                $totalRows++;
            }
        }
        fclose($handle);

        return [
            'headers' => $headers,
            'total_rows' => $totalRows,
            'delimiter' => $delimiter,
        ];
    }

    /**
     * Read sample preview records (e.g., first 10 rows) with column headers.
     */
    public function preview(string $filePath, int $limit = 10, string $delimiter = ','): array
    {
        $handle = fopen($filePath, 'r');
        if (!$handle) {
            throw new RuntimeException("Unable to read file: {$filePath}");
        }

        $headers = fgetcsv($handle, 0, $delimiter);
        if (!$headers) {
            fclose($handle);
            return [];
        }
        $headers = array_map('trim', $headers);

        $samples = [];
        $count = 0;
        while (($row = fgetcsv($handle, 0, $delimiter)) !== false && $count < $limit) {
            if (empty(array_filter($row))) {
                continue;
            }
            $record = [];
            foreach ($headers as $index => $colName) {
                $record[$colName] = $row[$index] ?? '';
            }
            $samples[] = $record;
            $count++;
        }
        fclose($handle);

        return [
            'headers' => $headers,
            'rows' => $samples,
        ];
    }

    /**
     * Generator yielding chunks of records.
     * Memory consumption stays strictly within a few megabytes regardless of file size.
     *
     * @param string $filePath
     * @param int $chunkSize Number of records per chunk (default 500)
     * @param string $delimiter
     * @return Generator<int, array{chunk_index: int, rows: array<int, array<string, mixed>>}>
     */
    public function readChunks(string $filePath, int $chunkSize = 500, string $delimiter = ','): Generator
    {
        $handle = fopen($filePath, 'r');
        if ($handle === false) {
            throw new RuntimeException("Failed to open file: {$filePath}");
        }

        $headers = fgetcsv($handle, 0, $delimiter);
        if ($headers === false) {
            fclose($handle);
            return;
        }

        // Clean headers
        $headers[0] = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $headers[0]) ?? $headers[0];
        $headers = array_map('trim', $headers);

        $chunk = [];
        $chunkIndex = 1;
        $rowNumber = 1; // Row 1 is headers, data begins at row 2

        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            $rowNumber++;

            // Skip completely empty lines
            if (empty(array_filter($row, fn($val) => trim((string)$val) !== ''))) {
                continue;
            }

            $mappedRow = [
                '__row_number' => $rowNumber,
            ];
            foreach ($headers as $colIdx => $headerName) {
                $mappedRow[$headerName] = isset($row[$colIdx]) ? trim($row[$colIdx]) : '';
            }

            $chunk[] = $mappedRow;

            if (count($chunk) >= $chunkSize) {
                yield [
                    'chunk_index' => $chunkIndex++,
                    'rows' => $chunk,
                ];
                $chunk = [];
            }
        }

        if (!empty($chunk)) {
            yield [
                'chunk_index' => $chunkIndex,
                'rows' => $chunk,
            ];
        }

        fclose($handle);
    }
}
