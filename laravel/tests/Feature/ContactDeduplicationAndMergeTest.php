<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Contact;
use App\Models\ContactSource;
use App\Models\Tag;
use App\Services\ContactDeduplicationService;
use App\Services\ContactMergeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactDeduplicationAndMergeTest extends TestCase
{
    use RefreshDatabase;

    protected ContactDeduplicationService $dedupService;
    protected ContactMergeService $mergeService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->dedupService = new ContactDeduplicationService();
        $this->mergeService = new ContactMergeService();
    }

    /** @test */
    public function it_detects_duplicate_by_normalized_email_priority_1()
    {
        $contact = Contact::create([
            'first_name' => 'Bhuvan',
            'last_name' => 'Gupta',
            'email' => 'bhuvangupta.1711@gmail.com',
            'phone' => '+919876543210',
            'marketing_status' => 'ACTIVE',
        ]);

        $check = $this->dedupService->detectDuplicate([
            'email' => '  BHUVANGUPTA.1711@GMAIL.COM  ',
            'phone' => '+919800000000',
        ]);

        $this->assertTrue($check['is_duplicate']);
        $this->assertEquals(1, $check['priority']);
        $this->assertEquals($contact->id, $check['matched_contact']->id);
    }

    /** @test */
    public function it_detects_duplicate_by_normalized_mobile_priority_2()
    {
        $contact = Contact::create([
            'first_name' => 'Priya',
            'last_name' => 'Sharma',
            'email' => 'priya.sharma@apex.in',
            'phone' => '+919811223344',
            'mobile' => '+919811223344',
            'marketing_status' => 'ACTIVE',
        ]);

        $check = $this->dedupService->detectDuplicate([
            'email' => 'priya.new@apex.in',
            'mobile' => '09811223344', // 11-digit format normalized to +919811223344
        ]);

        $this->assertTrue($check['is_duplicate']);
        $this->assertEquals(2, $check['priority']);
        $this->assertEquals($contact->id, $check['matched_contact']->id);
    }

    /** @test */
    public function it_detects_duplicate_by_company_gstin_priority_3()
    {
        $company = Company::create([
            'company_name' => 'Bharat Logistics Ltd',
            'gstin' => '27AABCB9876Q1Z2',
            'status' => 'ACTIVE',
        ]);

        $contact = Contact::create([
            'company_id' => $company->id,
            'first_name' => 'Rajesh',
            'last_name' => 'Nair',
            'email' => 'rajesh.nair@bharatlogix.com',
            'marketing_status' => 'ACTIVE',
        ]);

        $check = $this->dedupService->detectDuplicate([
            'gstin' => '27aabcb9876q1z2',
            'first_name' => 'Rajesh',
            'email' => 'rajesh.alt@gmail.com',
        ]);

        $this->assertTrue($check['is_duplicate']);
        $this->assertEquals(3, $check['priority']);
        $this->assertEquals($contact->id, $check['matched_contact']->id);
        $this->assertEquals($company->id, $check['matched_company']->id);
    }

    /** @test */
    public function it_merges_secondary_contact_into_primary_with_full_provenance()
    {
        $primary = Contact::create([
            'first_name' => 'Vikram',
            'last_name' => 'Malhotra',
            'email' => 'vikram@skylinecloud.io',
            'mobile' => '+919810077889',
            'city' => 'New Delhi',
            'marketing_status' => 'ACTIVE',
            'total_emails_sent' => 5,
            'total_emails_opened' => 3,
        ]);

        $secondary = Contact::create([
            'first_name' => 'Vikram',
            'last_name' => 'Malhotra',
            'email' => 'vikram.personal@gmail.com',
            'mobile' => '+919810077889',
            'designation' => 'Managing Director',
            'marketing_status' => 'ACTIVE',
            'total_emails_sent' => 3,
            'total_emails_opened' => 2,
        ]);

        // Add source to secondary
        ContactSource::create([
            'contact_id' => $secondary->id,
            'source_type' => 'CSV_IMPORT',
            'source_reference' => 'legacy_backup.csv',
            'imported_at' => now(),
        ]);

        // Add tag to secondary
        $tag = Tag::create(['name' => 'Tech Founder', 'slug' => 'tech-founder']);
        $secondary->tags()->attach($tag->id);

        // Execute Merge
        $merged = $this->mergeService->merge($primary, $secondary, [
            'merge_notes' => 'Confirmed duplicate via phone number match'
        ]);

        $this->assertEquals($primary->id, $merged->id);
        // Engagement summed
        $this->assertEquals(8, $merged->total_emails_sent);
        $this->assertEquals(5, $merged->total_emails_opened);
        // Designation backfilled
        $this->assertEquals('Managing Director', $merged->designation);
        // Tag consolidated
        $this->assertTrue($merged->tags->contains('slug', 'tech-founder'));
        // Sources repointed
        $this->assertEquals(2, $merged->sources()->count());
        // Secondary soft-deleted and marked
        $secondary->refresh();
        $this->assertEquals($primary->id, $secondary->merged_into_contact_id);
        $this->assertNotNull($secondary->deleted_at);
    }
}
