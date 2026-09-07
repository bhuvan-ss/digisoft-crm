<?php

namespace App\Services;

class ContactImportValidationService
{
    /**
     * Regex for standard 15-character Indian GSTIN.
     * Example: 29AAACA1234F1Z5
     */
    public const GSTIN_REGEX = '/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i';

    /**
     * Validate and sanitize an incoming contact import row.
     *
     * @param array<string, mixed> $mappedRecord Keyed by target CRM property
     * @param int $rowNumber The row number in the file for error diagnostics
     * @return array{is_valid: bool, errors: array<array{field: string, message: string}>, sanitized: array<string, mixed>}
     */
    public function validateRow(array $mappedRecord, int $rowNumber): array
    {
        $errors = [];
        $sanitized = $mappedRecord;

        // 1. Email Validation & Normalization
        $rawEmail = isset($mappedRecord['email']) ? trim((string) $mappedRecord['email']) : '';
        $normalizedEmail = null;

        if ($rawEmail !== '') {
            $cleanedEmail = strtolower($rawEmail);
            if (!filter_var($cleanedEmail, FILTER_VALIDATE_EMAIL)) {
                $errors[] = [
                    'field' => 'email',
                    'message' => "Invalid email syntax: '{$rawEmail}'.",
                ];
            } else {
                $normalizedEmail = $cleanedEmail;
                $sanitized['email'] = $normalizedEmail;
                $sanitized['email_normalized'] = $normalizedEmail;
            }
        } else {
            $sanitized['email'] = null;
            $sanitized['email_normalized'] = null;
        }

        // 2. Mobile Validation & Normalization (Indian 10-digit / E.164)
        $rawMobile = isset($mappedRecord['mobile']) ? trim((string) $mappedRecord['mobile']) : '';
        $normalizedMobile = null;

        if ($rawMobile !== '') {
            // Strip all non-digit characters
            $digitsOnly = preg_replace('/\D/', '', $rawMobile) ?? '';

            // Handle country code +91 or leading 0
            if (str_starts_with($digitsOnly, '91') && strlen($digitsOnly) === 12) {
                $digitsOnly = substr($digitsOnly, 2);
            } elseif (str_starts_with($digitsOnly, '0') && strlen($digitsOnly) === 11) {
                $digitsOnly = substr($digitsOnly, 1);
            }

            // Indian mobile numbers must be 10 digits starting with 6, 7, 8, or 9
            if (strlen($digitsOnly) === 10 && preg_match('/^[6-9]\d{9}$/', $digitsOnly)) {
                $normalizedMobile = "+91{$digitsOnly}";
                $sanitized['mobile'] = $digitsOnly;
                $sanitized['mobile_normalized'] = $normalizedMobile;
                $sanitized['phone'] = $digitsOnly;
            } elseif (strlen($digitsOnly) >= 7 && strlen($digitsOnly) <= 15) {
                // International or alternate phone format
                $normalizedMobile = "+{$digitsOnly}";
                $sanitized['mobile'] = $digitsOnly;
                $sanitized['mobile_normalized'] = $normalizedMobile;
                $sanitized['phone'] = $digitsOnly;
            } else {
                $errors[] = [
                    'field' => 'mobile',
                    'message' => "Invalid mobile number format: '{$rawMobile}'. Must be a 10-digit Indian number or valid international format.",
                ];
            }
        } else {
            $sanitized['mobile'] = null;
            $sanitized['mobile_normalized'] = null;
        }

        // 3. Mandatory Requirement Check: At least one of Email or Mobile must exist!
        if (empty($sanitized['email_normalized']) && empty($sanitized['mobile_normalized'])) {
            $errors[] = [
                'field' => 'contact_identifier',
                'message' => "Row {$rowNumber} rejected: At least one valid Email or Mobile number must be provided.",
            ];
        }

        // 4. GSTIN Validation if provided
        $rawGstin = isset($mappedRecord['gstin']) ? strtoupper(trim((string) $mappedRecord['gstin'])) : '';
        if ($rawGstin !== '') {
            if (!preg_match(self::GSTIN_REGEX, $rawGstin)) {
                $errors[] = [
                    'field' => 'gstin',
                    'message' => "Invalid GSTIN format: '{$rawGstin}'. Must follow standard 15-character alphanumeric format (e.g. 29AAACA1234F1Z5).",
                ];
            } else {
                $sanitized['gstin'] = $rawGstin;
            }
        }

        // 5. Name Sanitization
        if (!empty($mappedRecord['full_name']) && empty($sanitized['first_name'])) {
            $parts = explode(' ', trim((string) $mappedRecord['full_name']), 2);
            $sanitized['first_name'] = $parts[0];
            $sanitized['last_name'] = $parts[1] ?? '';
        }

        if (empty($sanitized['first_name'])) {
            $sanitized['first_name'] = !empty($sanitized['company_name']) 
                ? "Contact @ {$sanitized['company_name']}"
                : 'Contact';
        }

        return [
            'is_valid' => empty($errors),
            'errors' => $errors,
            'sanitized' => $sanitized,
        ];
    }
}
