<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Import extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'imports';

    public const STATUS_UPLOADED = 'UPLOADED';
    public const STATUS_MAPPING = 'MAPPING';
    public const STATUS_READY = 'READY';
    public const STATUS_PROCESSING = 'PROCESSING';
    public const STATUS_COMPLETED = 'COMPLETED';
    public const STATUS_FAILED = 'FAILED';
    public const STATUS_CANCELLED = 'CANCELLED';

    public const DUP_SKIP = 'SKIP';
    public const DUP_UPDATE = 'UPDATE';
    public const DUP_POTENTIAL = 'POTENTIAL_DUPLICATE';
    public const DUP_MERGE = 'MERGE';

    protected $fillable = [
        'file_name',
        'original_file_name',
        'file_path',
        'file_type',
        'total_rows',
        'processed_rows',
        'successful_rows',
        'failed_rows',
        'duplicate_rows',
        'updated_rows',
        'status',
        'duplicate_handling',
        'default_consent_status',
        'default_consent_source',
        'default_tags',
        'default_lifecycle_stage',
        'imported_by',
        'started_at',
        'completed_at',
        'error_log',
        'summary_stats',
    ];

    protected $casts = [
        'total_rows' => 'integer',
        'processed_rows' => 'integer',
        'successful_rows' => 'integer',
        'failed_rows' => 'integer',
        'duplicate_rows' => 'integer',
        'updated_rows' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'error_log' => 'array',
        'summary_stats' => 'array',
    ];

    /**
     * Mappings defined for this import file.
     */
    public function mappings(): HasMany
    {
        return $this->hasMany(ImportMapping::class, 'import_id');
    }

    /**
     * Row errors logged during import processing.
     */
    public function errors(): HasMany
    {
        return $this->hasMany(ImportError::class, 'import_id');
    }

    /**
     * Calculate live completion percentage.
     */
    public function getProgressPercentageAttribute(): float
    {
        if ($this->total_rows === 0) {
            return $this->status === self::STATUS_COMPLETED ? 100.0 : 0.0;
        }

        return round(min(100.0, ($this->processed_rows / $this->total_rows) * 100), 1);
    }

    /**
     * Calculate execution duration in seconds.
     */
    public function getDurationSecondsAttribute(): ?int
    {
        if (!$this->started_at) {
            return null;
        }

        $end = $this->completed_at ?? now();
        return (int) $this->started_at->diffInSeconds($end);
    }

    /**
     * Calculate rows processed per second.
     */
    public function getThroughputPerSecondAttribute(): float
    {
        $duration = $this->duration_seconds;
        if (!$duration || $duration <= 0) {
            return 0.0;
        }

        return round($this->processed_rows / $duration, 1);
    }

    /**
     * Check if processing can be cancelled.
     */
    public function canBeCancelled(): bool
    {
        return in_array($this->status, [self::STATUS_UPLOADED, self::STATUS_MAPPING, self::STATUS_READY, self::STATUS_PROCESSING]);
    }
}
