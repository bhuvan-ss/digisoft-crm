<?php

namespace App\Services;

class ColumnMappingService
{
    /**
     * Dictionary of supported target fields with known column aliases.
     */
    protected const FIELD_ALIASES = [
        'full_name' => [
            'name', 'full name', 'fullname', 'contact name', 'customer name', 
            'contact person', 'party name', 'person name', 'lead name'
        ],
        'first_name' => [
            'first name', 'firstname', 'fname', 'first_name', 'given name'
        ],
        'last_name' => [
            'last name', 'lastname', 'lname', 'last_name', 'surname', 'family name'
        ],
        'email' => [
            'email', 'email id', 'email address', 'mail', 'work email', 
            'primary email', 'e-mail', 'e_mail', 'electronic mail'
        ],
        'mobile' => [
            'mobile', 'mobile no', 'mobile number', 'phone', 'phone no', 
            'phone number', 'contact no', 'contact number', 'cell', 'whatsapp no',
            'cell phone', 'primary mobile'
        ],
        'company_name' => [
            'company', 'company name', 'organization', 'org name', 'account name', 
            'firm name', 'party', 'ledger name', 'business name', 'client'
        ],
        'gstin' => [
            'gst no', 'gstin', 'gst number', 'tax id', 'gst', 'tin', 'vat no'
        ],
        'designation' => [
            'designation', 'job title', 'title', 'role', 'position', 'occupation'
        ],
        'department' => [
            'department', 'dept', 'division', 'functional area'
        ],
        'city' => [
            'city', 'location', 'town', 'district', 'station'
        ],
        'state' => [
            'state', 'province', 'region'
        ],
        'country' => [
            'country', 'nation'
        ],
        'pincode' => [
            'pincode', 'pin code', 'postal code', 'zip', 'zipcode'
        ],
        'outstanding_balance' => [
            'balance', 'outstanding', 'outstanding balance', 'closing balance',
            'due amount', 'ledger balance', 'amount due'
        ],
        'tags' => [
            'tags', 'category', 'segment', 'group', 'tag', 'labels', 'type'
        ],
    ];

    /**
     * Available transformation rules.
     */
    public const TRANSFORMATION_RULES = [
        'trim' => 'Trim Whitespace',
        'lowercase' => 'Convert to Lowercase',
        'uppercase' => 'Convert to Uppercase',
        'e164_mobile' => 'Normalize Indian Mobile (E.164 +91)',
        'split_name' => 'Split Full Name into First & Last',
        'decimal_sanitize' => 'Sanitize Currency Amount to Decimal',
    ];

    /**
     * Auto-detect matching target fields for a given list of source column headers.
     *
     * @param array<string> $headers
     * @return array<string, array{target_field: string|null, confidence: int, transformation_rule: string|null}>
     */
    public function autoDetect(array $headers): array
    {
        $mappings = [];
        $assignedTargets = [];

        foreach ($headers as $header) {
            $normalizedHeader = strtolower(trim(preg_replace('/[^a-zA-Z0-9]/', ' ', $header) ?? ''));
            $bestMatch = null;
            $highestScore = 0;
            $suggestedTransform = 'trim';

            foreach (self::FIELD_ALIASES as $targetField => $aliases) {
                // Skip if this high-priority target field is already assigned with high confidence
                if (in_array($targetField, $assignedTargets, true) && $targetField === 'email') {
                    continue;
                }

                foreach ($aliases as $alias) {
                    $normalizedAlias = strtolower($alias);
                    
                    // Exact match
                    if ($normalizedHeader === $normalizedAlias) {
                        $score = 100;
                    } elseif (str_contains($normalizedHeader, $normalizedAlias)) {
                        $score = 80;
                    } elseif (levenshtein($normalizedHeader, $normalizedAlias) <= 2) {
                        $score = 65;
                    } else {
                        $score = 0;
                    }

                    if ($score > $highestScore) {
                        $highestScore = $score;
                        $bestMatch = $targetField;
                    }
                }
            }

            if ($bestMatch && $highestScore >= 60) {
                $assignedTargets[] = $bestMatch;

                // Determine default recommended transformation
                if ($bestMatch === 'email') {
                    $suggestedTransform = 'lowercase';
                } elseif ($bestMatch === 'mobile') {
                    $suggestedTransform = 'e164_mobile';
                } elseif ($bestMatch === 'gstin') {
                    $suggestedTransform = 'uppercase';
                } elseif ($bestMatch === 'outstanding_balance') {
                    $suggestedTransform = 'decimal_sanitize';
                } elseif ($bestMatch === 'full_name') {
                    $suggestedTransform = 'split_name';
                }

                $mappings[$header] = [
                    'target_field' => $bestMatch,
                    'confidence' => $highestScore,
                    'transformation_rule' => $suggestedTransform,
                ];
            } else {
                $mappings[$header] = [
                    'target_field' => null,
                    'confidence' => 0,
                    'transformation_rule' => 'trim',
                ];
            }
        }

        return $mappings;
    }

    /**
     * Apply transformation rule to a raw column value.
     */
    public function applyTransformation(mixed $value, ?string $rule): mixed
    {
        if ($value === null) {
            return '';
        }

        $val = trim((string) $value);

        return match ($rule) {
            'lowercase' => strtolower($val),
            'uppercase' => strtoupper($val),
            'e164_mobile' => $this->normalizeMobile($val),
            'decimal_sanitize' => $this->sanitizeDecimal($val),
            default => $val,
        };
    }

    /**
     * Normalize Indian mobile numbers.
     * Strips non-digits, leading zeros, +91 or 91 prefixes, returning 10-digit number.
     */
    public function normalizeMobile(string $phone): string
    {
        $digits = preg_replace('/\D/', '', $phone) ?? '';

        if (str_starts_with($digits, '91') && strlen($digits) === 12) {
            $digits = substr($digits, 2);
        } elseif (str_starts_with($digits, '0') && strlen($digits) === 11) {
            $digits = substr($digits, 1);
        }

        return $digits;
    }

    /**
     * Sanitize currency string to clean float.
     */
    public function sanitizeDecimal(string $value): float
    {
        $cleaned = preg_replace('/[^0-9.-]/', '', $value);
        return is_numeric($cleaned) ? (float) $cleaned : 0.0;
    }

    /**
     * Split a full name into first and last name components.
     */
    public function splitFullName(string $fullName): array
    {
        $trimmed = trim(preg_replace('/\s+/', ' ', $fullName) ?? '');
        if ($trimmed === '') {
            return ['first_name' => 'Contact', 'last_name' => ''];
        }

        $parts = explode(' ', $trimmed);
        if (count($parts) === 1) {
            return ['first_name' => $parts[0], 'last_name' => ''];
        }

        $firstName = array_shift($parts);
        $lastName = implode(' ', $parts);

        return ['first_name' => $firstName, 'last_name' => $lastName];
    }
}
