<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Phase 2: Import Errors Table (Row-level Granular Failure Tracking & Audit)
     */
    public function up(): void
    {
        Schema::create('import_errors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('import_id')
                  ->constrained('imports')
                  ->onDelete('cascade');
            
            $table->unsignedInteger('row_number')->index();
            $table->string('field_name', 100)->nullable()->index();
            $table->text('error_message');
            $table->json('raw_data')->nullable();
            $table->timestamps();

            $table->index(['import_id', 'row_number'], 'idx_import_row');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('import_errors');
    }
};
