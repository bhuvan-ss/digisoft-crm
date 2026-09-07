<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Phase 2: Import Mappings Table (Uploaded Columns to CRM Schema Properties)
     */
    public function up(): void
    {
        Schema::create('import_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('import_id')
                  ->constrained('imports')
                  ->onDelete('cascade');
            
            $table->string('source_column', 255)->index();
            $table->string('target_field', 100)->index();
            $table->string('transformation_rule', 100)->nullable(); // trim, lowercase, uppercase, e164_mobile, split_name
            $table->timestamps();

            $table->unique(['import_id', 'source_column'], 'uniq_import_source_col');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('import_mappings');
    }
};
