<?php

namespace App\Services;

use App\Models\Contact;
use App\Models\ContactSource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

class ContactMergeService
{
    /**
     * Merge a secondary contact into a primary master contact.
     *
     * @param Contact $primary The recipient master contact record.
     * @param Contact $secondary The contact to be merged into primary.
     * @param array $options Merge options (e.g. override fields, custom notes)
     * @return Contact The updated master contact.
     *
     * @throws InvalidArgumentException
     */
    public function merge(Contact $primary, Contact $secondary, array $options = []): Contact
    {
        if ($primary->id === $secondary->id) {
            throw new InvalidArgumentException("Cannot merge a contact record into itself.");
        }

        return DB::transaction(function () use ($primary, $secondary, $options) {
            // 1. Repoint all secondary ContactSource records to primary
            ContactSource::where('contact_id', $secondary->id)
                ->update(['contact_id' => $primary->id]);

            // Add an audit source record representing the merge event
            ContactSource::create([
                'contact_id' => $primary->id,
                'source_type' => $secondary->source ?: 'MANUAL',
                'source_reference' => "Consolidated from Contact ID #{$secondary->id} ({$secondary->full_name})",
                'external_id' => (string) $secondary->id,
                'metadata' => [
                    'merged_at' => now()->toIso8601String(),
                    'secondary_email' => $secondary->email,
                    'secondary_mobile' => $secondary->mobile ?: $secondary->phone,
                    'notes' => $options['merge_notes'] ?? null,
                ],
                'imported_at' => now(),
            ]);

            // 2. Consolidate polymorphic tags (union)
            $secondaryTagIds = $secondary->tags()->pluck('tags.id')->toArray();
            if (!empty($secondaryTagIds)) {
                $primary->tags()->syncWithoutDetaching($secondaryTagIds);
            }

            // 3. Backfill empty attributes on primary from secondary
            $backfillable = [
                'company_id',
                'last_name',
                'designation',
                'department',
                'address_line_1',
                'address_line_2',
                'city',
                'state',
                'country',
                'pincode',
                'industry',
                'tally_ledger_id',
                'alternate_mobile',
            ];

            foreach ($backfillable as $field) {
                if (empty($primary->{$field}) && !empty($secondary->{$field})) {
                    $primary->{$field} = $secondary->{$field};
                }
            }

            // 4. Stricter compliance / consent resolution
            // If either contact has unsubscribed, maintain suppression
            if ($secondary->is_suppressed || $secondary->consent_status === 'unsubscribed') {
                $primary->is_suppressed = true;
                $primary->consent_status = 'unsubscribed';
                $primary->marketing_status = 'UNSUBSCRIBED';
                $primary->marketing_consent = false;
            } elseif ($secondary->consent_status === 'double_opt_in' && $primary->consent_status !== 'double_opt_in') {
                // Elevate to double opt-in if secondary possessed verified consent
                $primary->consent_status = 'double_opt_in';
            }

            // 5. Consolidate engagement counters
            $primary->total_emails_sent += (int) $secondary->total_emails_sent;
            $primary->total_emails_opened += (int) $secondary->total_emails_opened;
            $primary->total_emails_clicked += (int) $secondary->total_emails_clicked;

            if ($secondary->last_email_opened_at && (!$primary->last_email_opened_at || $secondary->last_email_opened_at > $primary->last_email_opened_at)) {
                $primary->last_email_opened_at = $secondary->last_email_opened_at;
            }

            if ($secondary->last_email_sent_at && (!$primary->last_email_sent_at || $secondary->last_email_sent_at > $primary->last_email_sent_at)) {
                $primary->last_email_sent_at = $secondary->last_email_sent_at;
            }

            // 6. Maximize Tally financial visibility
            $primary->tally_outstanding_balance = max(
                (float) $primary->tally_outstanding_balance,
                (float) $secondary->tally_outstanding_balance
            );
            $primary->tally_overdue_days = max(
                (int) $primary->tally_overdue_days,
                (int) $secondary->tally_overdue_days
            );

            $primary->save();

            // 7. Mark secondary record as merged and soft-delete
            $secondary->merged_into_contact_id = $primary->id;
            $secondary->marketing_status = 'UNSUBSCRIBED';
            $secondary->is_suppressed = true;
            $secondary->save();
            $secondary->delete(); // Soft delete for retention & audit

            Log::info("Contact merged: #{$secondary->id} merged into master #{$primary->id}", [
                'primary_id' => $primary->id,
                'secondary_id' => $secondary->id,
            ]);

            return $primary->load(['company', 'sources', 'tags']);
        });
    }
}
