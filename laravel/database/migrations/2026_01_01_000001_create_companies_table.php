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
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('company_name', 255)->index();
            $table->string('legal_name', 255)->nullable();
            $table->string('gstin', 15)->nullable()->unique()->index();
            $table->string('pan', 10)->nullable()->index();
            $table->string('website', 255)->nullable();
            $table->string('email', 191)->nullable()->index();
            $table->string('phone', 30)->nullable();
            $table->string('mobile', 30)->nullable()->index();
            $table->string('address_line_1', 255)->nullable();
            $table->string('address_line_2', 255)->nullable();
            $table->string('city', 100)->nullable()->index();
            $table->string('state', 100)->nullable()->index();
            $table->string('country', 100)->default('India')->index();
            $table->string('pincode', 20)->nullable()->index();
            $table->string('industry', 100)->nullable()->index();
            $table->enum('status', ['ACTIVE', 'INACTIVE', 'PROSPECT', 'BLOCKED'])->default('ACTIVE')->index();
            
            // TallyPrime Integration Metadata
            $table->string('tally_guid', 64)->nullable()->unique()->index();
            $table->string('tally_ledger_name', 255)->nullable()->index();
            $table->string('tally_ledger_group', 100)->nullable()->index();
            $table->decimal('outstanding_balance', 14, 2)->default(0.00)->index();
            $table->decimal('credit_limit', 14, 2)->default(0.00);
            $table->integer('overdue_days')->default(0)->index();
            $table->json('metadata')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Compound indexing for multi-attribute company searching
            $table->index(['state', 'city']);
            $table->index(['status', 'outstanding_balance']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
