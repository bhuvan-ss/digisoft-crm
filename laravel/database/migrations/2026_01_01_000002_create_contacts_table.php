<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            
            // Company Association
            $table->foreignId('company_id')
                ->nullable()
                ->constrained('companies')
                ->nullOnDelete();

            // Name
            $table->string('first_name', 100)->index();
            $table->string('last_name', 100)->nullable()->index();
            $table->string('full_name', 200)->index();
            $table->string('designation', 150)->nullable()->index();
            $table->string('department', 100)->nullable()->index();

            // Contact Identifiers & Normalized Fields
            $table->string('email', 191)->index();
            $table->string('email_normalized', 191)->index();
            $table->string('phone', 30)->nullable();
            $table->string('mobile', 30)->nullable()->index();
            $table->string('mobile_normalized', 30)->nullable()->index();
            $table->string('alternate_mobile', 30)->nullable();

            // Postal / Geographical
            $table->string('address_line_1', 255)->nullable();
            $table->string('address_line_2', 255)->nullable();
            $table->string('city', 100)->nullable()->index();
            $table->string('state', 100)->nullable()->index();
            $table->string('country', 100)->default('India')->index();
            $table->string('pincode', 20)->nullable()->index();
            $table->string('industry', 100)->nullable()->index();

            // Acquisition Source
            $table->enum('source', ['TALLY', 'CSV_IMPORT', 'XLS_IMPORT', 'MANUAL', 'CRM_LEAD', 'WEBSITE', 'API'])
                ->default('MANUAL')
                ->index();
            $table->string('source_reference', 255)->nullable();

            // Verification & Deliverability
            $table->timestamp('email_verified_at')->nullable();
            $table->enum('marketing_status', ['ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED', 'PENDING'])
                ->default('ACTIVE')
                ->index();
            $table->boolean('marketing_consent')->default(true)->index();
            
            // Detailed Consent Tracking & GDPR/DPDP Compliance
            $table->enum('consent_status', ['double_opt_in', 'single_opt_in', 'unsubscribed', 'bounced', 'complaint', 'suppressed'])
                ->default('double_opt_in')
                ->index();
            $table->string('consent_source', 255)->nullable();
            $table->timestamp('consent_date')->nullable();
            $table->string('consent_ip', 45)->nullable();
            $table->string('unsubscribe_token', 64)->unique()->index();
            $table->boolean('is_suppressed')->default(false)->index();

            // Tally Ledger Context & Financials
            $table->string('tally_ledger_id', 64)->nullable()->index();
            $table->decimal('tally_outstanding_balance', 14, 2)->default(0.00)->index();
            $table->integer('tally_overdue_days')->default(0)->index();

            // Engagement Telemetry
            $table->unsignedInteger('total_emails_sent')->default(0);
            $table->unsignedInteger('total_emails_opened')->default(0);
            $table->unsignedInteger('total_emails_clicked')->default(0);
            $table->timestamp('last_email_sent_at')->nullable();
            $table->timestamp('last_email_opened_at')->nullable();

            // Merge & Deduplication Reference
            $table->foreignId('merged_into_contact_id')
                ->nullable()
                ->constrained('contacts')
                ->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            // Indexes for Performance & Filtering
            $table->index(['company_id', 'marketing_status']);
            $table->index(['city', 'state']);
            $table->index(['marketing_status', 'is_suppressed']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contacts');
    }
};
