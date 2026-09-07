<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

class Company extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'companies';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'company_name',
        'legal_name',
        'gstin',
        'pan',
        'website',
        'email',
        'phone',
        'mobile',
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'country',
        'pincode',
        'industry',
        'status',
        'tally_guid',
        'tally_ledger_name',
        'tally_ledger_group',
        'outstanding_balance',
        'credit_limit',
        'overdue_days',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'outstanding_balance' => 'decimal:2',
        'credit_limit' => 'decimal:2',
        'overdue_days' => 'integer',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Mutator to guarantee GSTIN is consistently stored in uppercase trimmed format.
     */
    public function setGstinAttribute(?string $value): void
    {
        $this->attributes['gstin'] = $value ? strtoupper(trim($value)) : null;
    }

    /**
     * Mutator to guarantee PAN is consistently stored in uppercase trimmed format.
     */
    public function setPanAttribute(?string $value): void
    {
        $this->attributes['pan'] = $value ? strtoupper(trim($value)) : null;
    }

    /**
     * Get the contacts for the company.
     */
    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class);
    }

    /**
     * Scope a query to only include active companies.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'ACTIVE');
    }

    /**
     * Scope a query to search companies by name, GSTIN, PAN or email.
     */
    public function scopeSearch(Builder $query, string $term): Builder
    {
        $term = trim($term);
        return $query->where(function (Builder $q) use ($term) {
            $q->where('company_name', 'LIKE', "%{$term}%")
              ->orWhere('legal_name', 'LIKE', "%{$term}%")
              ->orWhere('gstin', 'LIKE', "%{$term}%")
              ->orWhere('pan', 'LIKE', "%{$term}%")
              ->orWhere('email', 'LIKE', "%{$term}%")
              ->orWhere('city', 'LIKE', "%{$term}%");
        });
    }

    /**
     * Scope a query to companies with overdue receivables.
     */
    public function scopeOverdue(Builder $query, int $minDays = 30): Builder
    {
        return $query->where('outstanding_balance', '>', 0)
                     ->where('overdue_days', '>=', $minDays);
    }
}
