<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class Contact extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'contacts';

    protected $fillable = [
        'company_id',
        'first_name',
        'last_name',
        'full_name',
        'designation',
        'department',
        'email',
        'email_normalized',
        'phone',
        'mobile',
        'mobile_normalized',
        'alternate_mobile',
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'country',
        'pincode',
        'industry',
        'source',
        'source_reference',
        'email_verified_at',
        'marketing_status',
        'marketing_consent',
        'consent_status',
        'consent_source',
        'consent_date',
        'consent_ip',
        'unsubscribe_token',
        'is_suppressed',
        'tally_ledger_id',
        'tally_outstanding_balance',
        'tally_overdue_days',
        'total_emails_sent',
        'total_emails_opened',
        'total_emails_clicked',
        'last_email_sent_at',
        'last_email_opened_at',
        'merged_into_contact_id',
    ];

    protected $casts = [
        'marketing_consent' => 'boolean',
        'is_suppressed' => 'boolean',
        'email_verified_at' => 'datetime',
        'consent_date' => 'datetime',
        'last_email_sent_at' => 'datetime',
        'last_email_opened_at' => 'datetime',
        'tally_outstanding_balance' => 'decimal:2',
        'tally_overdue_days' => 'integer',
        'total_emails_sent' => 'integer',
        'total_emails_opened' => 'integer',
        'total_emails_clicked' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * The "booted" method of the model.
     * Enforces normalization, full_name derivation, and token generation on save.
     */
    protected static function booted(): void
    {
        static::saving(function (Contact $contact) {
            // Normalize and concatenate full name
            $contact->full_name = trim(($contact->first_name ?? '') . ' ' . ($contact->last_name ?? ''));

            // Auto-normalize email
            if (!empty($contact->email)) {
                $contact->email_normalized = strtolower(trim($contact->email));
            }

            // Auto-normalize mobile to E.164 (+91 standard for 10-digit Indian numbers)
            $mobileToNormalize = $contact->mobile ?: $contact->phone;
            if (!empty($mobileToNormalize)) {
                $cleaned = preg_replace('/[^\d+]/', '', $mobileToNormalize);
                if (preg_match('/^[6-9]\d{9}$/', $cleaned)) {
                    $cleaned = '+91' . $cleaned;
                } elseif (preg_match('/^0[6-9]\d{9}$/', $cleaned)) {
                    $cleaned = '+91' . substr($cleaned, 1);
                } elseif (preg_match('/^91[6-9]\d{9}$/', $cleaned)) {
                    $cleaned = '+' . $cleaned;
                }
                $contact->mobile_normalized = $cleaned;
            }

            // Generate secure unique unsubscribe token if missing
            if (empty($contact->unsubscribe_token)) {
                $contact->unsubscribe_token = Str::random(32) . '-' . time();
            }

            // Auto-enforce suppression if unsubscribed or bounced
            if (in_array($contact->consent_status, ['unsubscribed', 'bounced', 'complaint', 'suppressed'])) {
                $contact->is_suppressed = true;
                $contact->marketing_status = 'UNSUBSCRIBED';
                $contact->marketing_consent = false;
            }
        });
    }

    /**
     * Relationship: The company this contact belongs to.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Relationship: Historical acquisition sources.
     */
    public function sources(): HasMany
    {
        return $this->hasMany(ContactSource::class);
    }

    /**
     * Relationship: Tags attached to this contact.
     */
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }

    /**
     * Relationship: If merged, points to the target master contact.
     */
    public function mergedInto(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'merged_into_contact_id');
    }

    /**
     * Scope: Deliverable contacts eligible for campaign dispatches.
     */
    public function scopeDeliverable(Builder $query): Builder
    {
        return $query->where('marketing_status', 'ACTIVE')
                     ->where('marketing_consent', true)
                     ->where('is_suppressed', false)
                     ->whereNull('merged_into_contact_id')
                     ->whereNotNull('email');
    }

    /**
     * Scope: Unsubscribed / Suppressed contacts.
     */
    public function scopeSuppressed(Builder $query): Builder
    {
        return $query->where(function (Builder $q) {
            $q->where('is_suppressed', true)
              ->orWhere('marketing_status', 'UNSUBSCRIBED')
              ->orWhere('consent_status', 'unsubscribed');
        });
    }

    /**
     * Scope: Search contacts by name, email, phone, designation, or city.
     */
    public function scopeSearch(Builder $query, string $term): Builder
    {
        $term = trim($term);
        $norm = strtolower($term);

        return $query->where(function (Builder $q) use ($term, $norm) {
            $q->where('full_name', 'LIKE', "%{$term}%")
              ->orWhere('first_name', 'LIKE', "%{$term}%")
              ->orWhere('last_name', 'LIKE', "%{$term}%")
              ->orWhere('email_normalized', 'LIKE', "%{$norm}%")
              ->orWhere('mobile_normalized', 'LIKE', "%{$term}%")
              ->orWhere('city', 'LIKE', "%{$term}%")
              ->orWhere('designation', 'LIKE', "%{$term}%")
              ->orWhereHas('company', function (Builder $compQuery) use ($term) {
                  $compQuery->where('company_name', 'LIKE', "%{$term}%");
              });
        });
    }
}
