<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Contact;
use Illuminate\Support\Collection;

class ContactDeduplicationService
{
    /**
     * Normalize email string (trim and lowercase).
     */
    public function normalizeEmail(?string $email): ?string
    {
        if (!$email) return null;
        return strtolower(trim($email));
    }

    /**
     * Normalize phone/mobile to E.164 international standard.
     */
    public function normalizeMobile(?string $phone): ?string
    {
        if (!$phone) return null;

        $cleaned = preg_replace('/[^\d+]/', '', $phone);
        if (!$cleaned) return null;

        // Indian 10-digit mobile starting with 6-9
        if (preg_match('/^[6-9]\d{9}$/', $cleaned)) {
            return '+91' . $cleaned;
        }

        // 11 digits starting with 0
        if (preg_match('/^0([6-9]\d{9})$/', $cleaned, $matches)) {
            return '+91' . $matches[1];
        }

        // 12 digits starting with 91
        if (preg_match('/^91([6-9]\d{9})$/', $cleaned, $matches)) {
            return '+91' . $matches[1];
        }

        if (!str_starts_with($cleaned, '+') && strlen($cleaned) >= 10) {
            return '+' . $cleaned;
        }

        return $cleaned;
    }

    /**
     * Detect duplicate contact based on the 3-tier priority matrix:
     * Priority 1: Normalized Email Match
     * Priority 2: Normalized Mobile Match (E.164)
     * Priority 3: Company GSTIN Match
     *
     * @param array $attributes Candidate attributes (email, mobile, phone, gstin, company_id)
     * @param int|null $excludeContactId Contact ID to exclude (e.g. when updating)
     * @return array{
     *   is_duplicate: bool,
     *   priority: int|null,
     *   match_reason: string|null,
     *   matched_contact: Contact|null,
     *   matched_company: Company|null
     * }
     */
    public function detectDuplicate(array $attributes, ?int $excludeContactId = null): array
    {
        $emailNorm = $this->normalizeEmail($attributes['email'] ?? null);
        $mobileNorm = $this->normalizeMobile($attributes['mobile'] ?? ($attributes['phone'] ?? null));
        $gstin = !empty($attributes['gstin']) ? strtoupper(trim($attributes['gstin'])) : null;

        // PRIORITY 1: Normalized Email Match
        if ($emailNorm) {
            $existing = Contact::where('email_normalized', $emailNorm)
                ->when($excludeContactId, fn($q) => $q->where('id', '!=', $excludeContactId))
                ->first();

            if ($existing) {
                return [
                    'is_duplicate' => true,
                    'priority' => 1,
                    'match_reason' => 'Priority 1: Normalized email matches existing master contact.',
                    'matched_contact' => $existing,
                    'matched_company' => $existing->company,
                ];
            }
        }

        // PRIORITY 2: Normalized Mobile Match (E.164)
        if ($mobileNorm) {
            $existing = Contact::where(function ($q) use ($mobileNorm) {
                    $q->where('mobile_normalized', $mobileNorm)
                      ->orWhere('phone', $mobileNorm);
                })
                ->when($excludeContactId, fn($q) => $q->where('id', '!=', $excludeContactId))
                ->first();

            if ($existing) {
                return [
                    'is_duplicate' => true,
                    'priority' => 2,
                    'match_reason' => 'Priority 2: E.164 normalized mobile number matches existing master contact.',
                    'matched_contact' => $existing,
                    'matched_company' => $existing->company,
                ];
            }
        }

        // PRIORITY 3: Company GSTIN Match
        if ($gstin) {
            $company = Company::where('gstin', $gstin)->first();
            if ($company) {
                // If candidate also specifies a contact name, check if that contact already exists under this company
                if (!empty($attributes['first_name'])) {
                    $firstName = trim($attributes['first_name']);
                    $existing = Contact::where('company_id', $company->id)
                        ->where('first_name', 'LIKE', $firstName)
                        ->when($excludeContactId, fn($q) => $q->where('id', '!=', $excludeContactId))
                        ->first();

                    if ($existing) {
                        return [
                            'is_duplicate' => true,
                            'priority' => 3,
                            'match_reason' => 'Priority 3: Company GSTIN matched, and contact with identical first name exists under company.',
                            'matched_contact' => $existing,
                            'matched_company' => $company,
                        ];
                    }
                }

                return [
                    'is_duplicate' => false,
                    'priority' => 3,
                    'match_reason' => 'Company GSTIN matches existing registered company entity.',
                    'matched_contact' => null,
                    'matched_company' => $company,
                ];
            }
        }

        return [
            'is_duplicate' => false,
            'priority' => null,
            'match_reason' => null,
            'matched_contact' => null,
            'matched_company' => null,
        ];
    }
}
