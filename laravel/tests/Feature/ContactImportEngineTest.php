<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Contact;
use App\Models\Import;
use App\Models\ImportError;
use App\Models\ImportMapping;
use App\Services\ColumnMappingService;
use App\Services\ContactDeduplicationService;
use App\Services\ContactImportProcessorService;
use App\Services\ContactImportValidationService;
use App\Services\ContactMergeService;
use App\Services\CsvChunkReaderService;
use App\Services\ImportSummaryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactImportEngineTest extends TestCase
{
    use RefreshDatabase;

    protected ColumnMappingService $mappingService;
    protected ContactImportValidationService $validationService;
    protected ContactImportProcessorService $processorService;
    protected ImportSummaryService $summaryService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mappingService = new ColumnMappingService();
        $this->validationService = new ContactImportValidationService();
        $dedup = new ContactDeduplicationService();
        $merge = new ContactMergeService();
        $this->processorService = new ContactImportProcessorService(
            $this->mappingService,
            $this->validationService,
            $dedup,
            $merge
        );
        $this->summaryService = new ImportSummaryService();
    }

    /** @test */
    public function it_auto_detects_common_crm_columns()
    {
        $headers = [
            'Full Name',
            'Email ID',
            'Mobile No',
            'Company Name',
            'GST No',
            'City',
            'Outstanding Balance',
        ];

        $detected = $this->mappingService->autoDetect($headers);

        $this->assertEquals('full_name', $detected['Full Name']['target_field']);
        $this->assertEquals('email', $detected['Email ID']['target_field']);
        $this->assertEquals('mobile', $detected['Mobile No']['target_field']);
        $this->assertEquals('company_name', $detected['Company Name']['target_field']);
        $this->assertEquals('gstin', $detected['GST No']['target_field']);
        $this->assertEquals('city', $detected['City']['target_field']);
        $this->assertEquals('outstanding_balance', $detected['Outstanding Balance']['target_field']);
    }

    /** @test */
    public function it_validates_email_and_mobile_and_rejects_empty_identifiers()
    {
        // 1. Valid email & 10-digit Indian mobile
        $validRow = [
            'email' => '  vikram.mehta@ApexLogistics.in  ',
            'mobile' => '+91 98765 43210',
            'full_name' => 'Vikram Mehta',
        ];
        $val1 = $this->validationService->validateRow($validRow, 2);
        $this->assertTrue($val1['is_valid']);
        $this->assertEquals('vikram.mehta@apexlogistics.in', $val1['sanitized']['email_normalized']);
        $this->assertEquals('+919876543210', $val1['sanitized']['mobile_normalized']);

        // 2. Reject row with missing both email and mobile
        $invalidRow = [
            'full_name' => 'Ghost Contact',
            'company_name' => 'Phantom Corp',
        ];
        $val2 = $this->validationService->validateRow($invalidRow, 3);
        $this->assertFalse($val2['is_valid']);
        $this->assertEquals('contact_identifier', $val2['errors'][0]['field']);

        // 3. Reject malformed GSTIN
        $invalidGstinRow = [
            'email' => 'valid@domain.com',
            'gstin' => 'INVALID_GST_123',
        ];
        $val3 = $this->validationService->validateRow($invalidGstinRow, 4);
        $this->assertFalse($val3['is_valid']);
        $this->assertEquals('gstin', $val3['errors'][0]['field']);
    }

    /** @test */
    public function it_processes_chunks_with_skip_duplicate_strategy()
    {
        // Pre-existing contact
        Contact::create([
            'first_name' => 'Aditi',
            'last_name' => 'Sharma',
            'email' => 'aditi@sharmatech.com',
            'email_normalized' => 'aditi@sharmatech.com',
            'marketing_status' => 'ACTIVE',
        ]);

        $import = Import::create([
            'file_name' => 'test.csv',
            'original_file_name' => 'test.csv',
            'file_path' => '/tmp/test.csv',
            'file_type' => 'csv',
            'total_rows' => 2,
            'status' => Import::STATUS_PROCESSING,
            'duplicate_handling' => Import::DUP_SKIP,
        ]);

        ImportMapping::create(['import_id' => $import->id, 'source_column' => 'email', 'target_field' => 'email']);
        ImportMapping::create(['import_id' => $import->id, 'source_column' => 'name', 'target_field' => 'full_name']);

        $chunk = [
            ['email' => 'aditi@sharmatech.com', 'name' => 'Aditi Sharma (Dup)'],
            ['email' => 'new.contact@innovate.in', 'name' => 'Rohan Sen'],
        ];

        $stats = $this->processorService->processChunk($import, $chunk);

        $this->assertEquals(2, $stats['processed']);
        $this->assertEquals(1, $stats['duplicates']);
        $this->assertEquals(1, $stats['successful']);
        $this->assertEquals(0, $stats['updated']);

        // Total contacts in DB should be 2 (1 original + 1 new, duplicate was skipped)
        $this->assertEquals(2, Contact::count());
    }

    /** @test */
    public function it_never_overwrites_suppressed_or_unsubscribed_marketing_status_during_import()
    {
        // Pre-existing contact who unsubscribed
        $unsubContact = Contact::create([
            'first_name' => 'Pooja',
            'last_name' => 'Iyer',
            'email' => 'pooja.iyer@zenith.com',
            'email_normalized' => 'pooja.iyer@zenith.com',
            'marketing_status' => 'UNSUBSCRIBED',
            'marketing_consent' => false,
            'consent_status' => 'opt_out',
            'is_suppressed' => true,
        ]);

        $import = Import::create([
            'file_name' => 'marketing_leads.csv',
            'original_file_name' => 'marketing_leads.csv',
            'file_path' => '/tmp/marketing_leads.csv',
            'file_type' => 'csv',
            'total_rows' => 1,
            'status' => Import::STATUS_PROCESSING,
            'duplicate_handling' => Import::DUP_UPDATE,
            'default_consent_status' => 'double_opt_in',
        ]);

        ImportMapping::create(['import_id' => $import->id, 'source_column' => 'Email', 'target_field' => 'email']);
        ImportMapping::create(['import_id' => $import->id, 'source_column' => 'City', 'target_field' => 'city']);

        $chunk = [
            [
                'Email' => 'pooja.iyer@zenith.com',
                'City' => 'Mumbai',
            ]
        ];

        $stats = $this->processorService->processChunk($import, $chunk);

        $this->assertEquals(1, $stats['duplicates']);
        $this->assertEquals(1, $stats['updated']);

        // Refresh model from DB
        $unsubContact->refresh();

        // CRITICAL CHECK: Marketing status MUST stay UNSUBSCRIBED and is_suppressed MUST stay true!
        $this->assertEquals('UNSUBSCRIBED', $unsubContact->marketing_status);
        $this->assertTrue($unsubContact->is_suppressed);
        $this->assertEquals('opt_out', $unsubContact->consent_status);
        // Non-marketing demographic field (city) was safely enriched
        $this->assertEquals('Mumbai', $unsubContact->city);
    }

    /** @test */
    public function it_generates_accurate_import_summary_and_error_exports()
    {
        $import = Import::create([
            'file_name' => 'enterprise_batch.csv',
            'original_file_name' => 'enterprise_batch.csv',
            'file_path' => '/tmp/enterprise_batch.csv',
            'file_type' => 'csv',
            'total_rows' => 100,
            'processed_rows' => 100,
            'successful_rows' => 85,
            'failed_rows' => 5,
            'duplicate_rows' => 15,
            'updated_rows' => 10,
            'status' => Import::STATUS_COMPLETED,
            'started_at' => now()->subSeconds(10),
            'completed_at' => now(),
        ]);

        ImportError::create([
            'import_id' => $import->id,
            'row_number' => 12,
            'field_name' => 'email',
            'error_message' => "Invalid email syntax: 'invalid@@email'.",
            'raw_data' => ['name' => 'Bad Email User', 'email' => 'invalid@@email'],
        ]);

        $summary = $this->summaryService->generateSummary($import);

        $this->assertEquals(100, $summary['total']);
        $this->assertEquals(85, $summary['successful']);
        $this->assertEquals(5, $summary['failed']);
        $this->assertEquals(15, $summary['duplicate']);
        $this->assertEquals(10, $summary['updated']);
        $this->assertArrayHasKey('email', $summary['top_error_reasons']);

        $csv = $this->summaryService->exportErrorsAsCsv($import);
        $this->assertStringContainsString('Row Number,Field Name,Error Reason', $csv);
        $this->assertStringContainsString('invalid@@email', $csv);
    }
}
