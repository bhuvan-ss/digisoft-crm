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
        Schema::create('contact_sources', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('contact_id')
                ->constrained('contacts')
                ->cascadeOnDelete();

            $table->enum('source_type', ['TALLY', 'CSV_IMPORT', 'XLS_IMPORT', 'MANUAL', 'CRM_LEAD', 'WEBSITE', 'API'])
                ->index();

            $table->string('source_reference', 255)->nullable();
            $table->string('external_id', 100)->nullable()->index();
            $table->json('metadata')->nullable();
            $table->timestamp('imported_at')->useCurrent();

            $table->timestamps();

            // Compound index for idempotency
            $table->index(['contact_id', 'source_type']);
            $table->index(['source_type', 'external_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contact_sources');
    }
};
