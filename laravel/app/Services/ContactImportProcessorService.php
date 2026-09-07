<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Contact;
use App\Models\ContactSource;
use App\Models\Import;
use App\Models\ImportError;
use App\Models\ImportMapping;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class ContactImportProcessorService
{
    public function __construct(
        protected ColumnMappingService $mappingService,
        protected ContactImportValidationService $validationService,
        protected ContactDeduplicationService $dedupService,
        protected ContactMergeService $mergeService
    ) {}

    /**
     * Process a single chunk of raw file rows within a discrete database transaction.
     *
     * @param Import $import The parent import model
     * @param array<array<string, mixed>> $rawRows The raw data rows from CsvChunkReaderService
     * @param array<string, ImportMapping>|null $mappings Mappings keyed by source_column
     * @return array{processed: int, successful: int, failed: int, duplicates: int, updated: int}
     */
    public function processChunk(Import $import, array $rawRows, ?array $mappings = null): array
    {
        if ($mappings === null) {
            $mappings = $import->mappings->keyBy('source_column')->all();
        }

        $stats = [
            'processed' => 0,
            'successful' => 0,
            'failed' => 0,
            'duplicates' => 0,
            'updated' => 0,
        ];

        // Wrap execution strictly at chunk level to prevent massive rollback overhead
        DB::transaction(function () use ($import, $rawRows, $mappings, &$stats) {
            foreach ($rawRows as $rawRow) {
                $stats['processed']++;
                $rowNumber = $rawRow['__row_number'] ?? $stats['processed'];
                unset($rawRow['__row_number']);

                // 1. Transform raw row to mapped CRM fields
                $mappedRecord = [];
                foreach ($rawRow as $colName => $value) {
                    if (isset($mappings[$colName]) && $mappings[$colName]->target_field) {
                        $target = $mappings[$colName]->target_field;
                        $rule = $mappings[$colName]->transformation_rule;
                        $transformed = $this->mappingService->applyTransformation($value, $rule);
                        $mappedRecord[$target] = $transformed;
                    }
                }

                // 2. Validate Row Data
                $validation = $this->validationService->validateRow($mappedRecord, $rowNumber);
                if (!$validation['is_valid']) {
                    $stats['failed']++;
                    foreach ($validation['errors'] as $err) {
                        ImportError::create([
                            'import_id' => $import->id,
                            'row_number' => $rowNumber,
                            'field_name' => $err['field'],
                            'error_message' => $err['message'],
                            'raw_data' => $rawRow,
                        ]);
                    }
                    continue;
                }

                $cleanData = $validation['sanitized'];

                // 3. Duplicate Detection across existing database
                $existingContact = $this->findExistingContact($cleanData);

                if ($existingContact) {
                    $stats['duplicates']++;
                    $this->handleDuplicateRecord($import, $cleanData, $existingContact, $rawRow, $rowNumber, $stats);
                } else {
                    // Create New Contact
                    $this->createNewContact($import, $cleanData);
                    $stats['successful']++;
                }
            }

            // Atomically update Import progress counters
            $import->increment('processed_rows', $stats['processed']);
            $import->increment('successful_rows', $stats['successful']);
            $import->increment('failed_rows', $stats['failed']);
            $import->increment('duplicate_rows', $stats['duplicates']);
            $import->increment('updated_rows', $stats['updated']);
        });

        return $stats;
    }

    /**
     * Find existing contact by Normalized Email (Priority 1) or Normalized Mobile (Priority 2).
     */
    protected function findExistingContact(array $data): ?Contact
    {
        if (!empty($data['email_normalized'])) {
            $contact = Contact::where('email_normalized', $data['email_normalized'])->first();
            if ($contact) {
                return $contact;
            }
        }

        if (!empty($data['mobile_normalized'])) {
            $contact = Contact::where('mobile_normalized', $data['mobile_normalized'])
                ->orWhere('mobile', $data['mobile'])
                ->first();
            if ($contact) {
                return $contact;
            }
        }

        return null;
    }

    /**
     * Handle duplicate records according to user-selected strategy:
     * 1. SKIP
     * 2. UPDATE
     * 3. POTENTIAL_DUPLICATE
     * 4. MERGE
     */
    protected function handleDuplicateRecord(
        Import $import,
        array $cleanData,
        Contact $existing,
        array $rawRow,
        int $rowNumber,
        array &$stats
    ): void {
        $strategy = $import->duplicate_handling ?? Import::DUP_UPDATE;

        switch ($strategy) {
            case Import::DUP_SKIP:
                // No modification made, record skipped
                break;

            case Import::DUP_POTENTIAL:
                // Create flagged potential duplicate contact record linked to existing
                $newRecord = $this->buildContactPayload($import, $cleanData);
                $newRecord['is_suppressed'] = false;
                $newRecord['source_reference'] = "Import #{$import->id} (Flagged Potential Duplicate of #{$existing->id})";
                $contact = Contact::create($newRecord);
                $this->attachContactSource($contact, $import, 'POTENTIAL_DUPLICATE');
                $stats['successful']++;
                break;

            case Import::DUP_MERGE:
                // Transactional merge combining non-empty attributes and appending tags
                $this->mergeWithExisting($existing, $cleanData, $import);
                $stats['updated']++;
                break;

            case Import::DUP_UPDATE:
            default:
                // Update existing contact: fills empty fields and updates fresher demographic data
                $this->updateExistingSafely($existing, $cleanData, $import);
                $stats['updated']++;
                break;
        }
    }

    /**
     * Update existing contact record safely.
     * CRITICAL RULE: Never overwrite UNSUBSCRIBED, BOUNCED, COMPLAINED, SUPPRESSED marketing statuses!
     */
    protected function updateExistingSafely(Contact $existing, array $incoming, Import $import): void
    {
        $updates = [];

        // Safe fields that can be enriched if currently empty in master record
        $fillableIfEmpty = [
            'designation', 'department', 'city', 'state', 'country', 'pincode', 
            'industry', 'address_line_1', 'address_line_2'
        ];

        foreach ($fillableIfEmpty as $field) {
            if (empty($existing->{$field}) && !empty($incoming[$field])) {
                $updates[$field] = $incoming[$field];
            }
        }

        // Names: update if incoming has more complete name
        if (!empty($incoming['first_name']) && ($existing->first_name === 'Contact' || empty($existing->first_name))) {
            $updates['first_name'] = $incoming['first_name'];
            $updates['last_name'] = $incoming['last_name'] ?? $existing->last_name;
        }

        // Company linking or enrichment
        if (empty($existing->company_id) && !empty($incoming['company_name'])) {
            $company = $this->resolveOrCreateCompany($incoming['company_name'], $incoming['gstin'] ?? null);
            if ($company) {
                $updates['company_id'] = $company->id;
            }
        }

        // Tally / Outstanding Balance update if provided
        if (isset($incoming['outstanding_balance']) && (float)$incoming['outstanding_balance'] > 0) {
            $updates['tally_outstanding_balance'] = (float)$incoming['outstanding_balance'];
        }

        // --- STRICT COMPLIANCE PROTECTION ---
        // Never overwrite UNSUBSCRIBED, BOUNCED, COMPLAINED, or SUPPRESSED statuses!
        $protectedStatuses = ['UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED', 'SUPPRESSED'];
        $isProtected = in_array(strtoupper((string)$existing->marketing_status), $protectedStatuses, true) || $existing->is_suppressed;

        if (!$isProtected) {
            // Only update marketing consent if contact was not previously suppressed
            if (!empty($import->default_consent_status) && $existing->consent_status === 'opt_out') {
                $updates['consent_status'] = $import->default_consent_status;
            }
        }

        if (!empty($updates)) {
            $existing->update($updates);
        }

        $this->attachContactSource($existing, $import, 'IMPORT_UPDATE');
    }

    /**
     * Merge incoming row attributes into existing master contact.
     */
    protected function mergeWithExisting(Contact $existing, array $incoming, Import $import): void
    {
        $this->updateExistingSafely($existing, $incoming, $import);

        // Append any incoming tags
        if (!empty($incoming['tags'])) {
            $newTags = is_array($incoming['tags']) ? $incoming['tags'] : explode(',', (string)$incoming['tags']);
            $cleanTags = array_map('trim', array_filter($newTags));
            if (!empty($cleanTags)) {
                $existing->attachTags($cleanTags);
            }
        }
    }

    /**
     * Create brand new contact record from validated data.
     */
    protected function createNewContact(Import $import, array $data): Contact
    {
        $payload = $this->buildContactPayload($import, $data);
        $contact = Contact::create($payload);

        // Handle Tags
        $tags = [];
        if (!empty($import->default_tags)) {
            $tags = array_merge($tags, explode(',', $import->default_tags));
        }
        if (!empty($data['tags'])) {
            $tags = array_merge($tags, is_array($data['tags']) ? $data['tags'] : explode(',', (string)$data['tags']));
        }
        $tags = array_unique(array_map('trim', array_filter($tags)));
        if (!empty($tags)) {
            $contact->attachTags($tags);
        }

        $this->attachContactSource($contact, $import, 'CSV_IMPORT');

        return $contact;
    }

    /**
     * Resolve company by name or GSTIN, or create prospect company.
     */
    protected function resolveOrCreateCompany(?string $name, ?string $gstin): ?Company
    {
        if (empty($name) && empty($gstin)) {
            return null;
        }

        if (!empty($gstin)) {
            $company = Company::where('gstin', $gstin)->first();
            if ($company) {
                return $company;
            }
        }

        if (!empty($name)) {
            $company = Company::where('company_name', $name)->first();
            if ($company) {
                return $company;
            }

            return Company::create([
                'company_name' => $name,
                'legal_name' => $name,
                'gstin' => $gstin,
                'status' => 'ACTIVE',
                'country' => 'India',
            ]);
        }

        return null;
    }

    /**
     * Build standardized Eloquent payload for new contact.
     */
    protected function buildContactPayload(Import $import, array $data): array
    {
        $company = $this->resolveOrCreateCompany($data['company_name'] ?? null, $data['gstin'] ?? null);

        return [
            'company_id' => $company?->id,
            'first_name' => $data['first_name'] ?? 'Contact',
            'last_name' => $data['last_name'] ?? null,
            'email' => $data['email'] ?? null,
            'email_normalized' => $data['email_normalized'] ?? null,
            'mobile' => $data['mobile'] ?? null,
            'mobile_normalized' => $data['mobile_normalized'] ?? null,
            'phone' => $data['phone'] ?? null,
            'designation' => $data['designation'] ?? null,
            'department' => $data['department'] ?? null,
            'city' => $data['city'] ?? 'Bengaluru',
            'state' => $data['state'] ?? 'Karnataka',
            'country' => $data['country'] ?? 'India',
            'pincode' => $data['pincode'] ?? null,
            'source' => 'CSV_IMPORT',
            'source_reference' => "Import Job #{$import->id} ({$import->original_file_name})",
            'marketing_status' => 'ACTIVE',
            'marketing_consent' => true,
            'consent_status' => $import->default_consent_status ?? 'single_opt_in',
            'consent_source' => $import->default_consent_source ?? 'Batch Import Engine',
            'consent_date' => now(),
            'consent_ip' => '127.0.0.1',
            'unsubscribe_token' => Str::random(32),
            'is_suppressed' => false,
            'lifecycle_stage' => $import->default_lifecycle_stage ?? 'lead',
            'tally_outstanding_balance' => (float)($data['outstanding_balance'] ?? 0),
        ];
    }

    /**
     * Record provenance record in contact_sources table.
     */
    protected function attachContactSource(Contact $contact, Import $import, string $sourceType): void
    {
        ContactSource::create([
            'contact_id' => $contact->id,
            'source_type' => $sourceType,
            'source_reference' => "Import #{$import->id}: {$import->original_file_name}",
            'payload' => [
                'import_id' => $import->id,
                'file_name' => $import->file_name,
                'processed_at' => now()->toIso8601String(),
            ],
            'imported_at' => now(),
        ]);
    }
}
