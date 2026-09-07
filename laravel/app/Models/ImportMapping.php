<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportMapping extends Model
{
    use HasFactory;

    protected $table = 'import_mappings';

    protected $fillable = [
        'import_id',
        'source_column',
        'target_field',
        'transformation_rule',
    ];

    /**
     * Parent import job.
     */
    public function import(): BelongsTo
    {
        return $this->belongsTo(Import::class, 'import_id');
    }
}
