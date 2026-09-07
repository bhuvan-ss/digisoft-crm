<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportError extends Model
{
    use HasFactory;

    protected $table = 'import_errors';

    protected $fillable = [
        'import_id',
        'row_number',
        'field_name',
        'error_message',
        'raw_data',
    ];

    protected $casts = [
        'row_number' => 'integer',
        'raw_data' => 'array',
    ];

    /**
     * Parent import job.
     */
    public function import(): BelongsTo
    {
        return $this->belongsTo(Import::class, 'import_id');
    }
}
