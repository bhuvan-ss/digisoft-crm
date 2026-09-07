<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Phase 2: Imports Table for Scalable Contact Ingestion Engine
     */
    public function up(): void
    {
        Schema::create('imports', function (Blueprint $table) {
            $table->id();
            $table->string('file_name', 255)->index();
            $table->string('original_file_name', 255);
            $table->string('file_path', 500);
            $table->string('file_type', 10)->index(); // csv, xls, xlsx
            $table->unsignedInteger('total_rows')->default(0)->index();
            $table->unsignedInteger('processed_rows')->default(0)->index();
            $table->unsignedInteger('successful_rows')->default(0)->index();
            $table->unsignedInteger('failed_rows')->default(0)->index();
            $table->unsignedInteger('duplicate_rows')->default(0)->index();
            $table->unsignedInteger('updated_rows')->default(0)->index();
            
            // Import Status Enum
            $table->enum('status', [
                'UPLOADED',
                'MAPPING',
                'READY',
                'PROCESSING',
                'COMPLETED',
                'FAILED',
                'CANCELLED'
            ])->default('UPLOADED')->index();
            
            // Duplicate Handling Strategy
            $table->enum('duplicate_handling', [
                'SKIP',
                'UPDATE',
                'POTENTIAL_DUPLICATE',
                'MERGE'
            ])->default('UPDATE')->index();

            // Default Acquisition & Compliance Assignment
            $table->string('default_consent_status', 50)->default('single_opt_in');
            $table->string('default_consent_source', 255)->default('CSV/Excel Batch Upload');
            $table->string('default_tags', 500)->nullable();
            $table->string('default_lifecycle_stage', 50)->default('lead');

            $table->unsignedBigInteger('imported_by')->nullable()->index();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->json('error_log')->nullable();
            $table->json('summary_stats')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('imports');
    }
};
