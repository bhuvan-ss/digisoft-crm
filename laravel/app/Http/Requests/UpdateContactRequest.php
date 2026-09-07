<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $contactId = $this->route('contact')?->id ?? $this->input('id');

        return [
            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'email' => ['sometimes', 'required', 'email:rfc,dns', 'max:191'],
            'mobile' => ['nullable', 'string', 'max:30'],
            'phone' => ['nullable', 'string', 'max:30'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'designation' => ['nullable', 'string', 'max:150'],
            'department' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'pincode' => ['nullable', 'string', 'max:20'],
            'industry' => ['nullable', 'string', 'max:100'],
            'marketing_status' => ['nullable', Rule::in(['ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED', 'PENDING'])],
            'consent_status' => ['nullable', Rule::in(['double_opt_in', 'single_opt_in', 'unsubscribed', 'bounced', 'complaint'])],
            'is_suppressed' => ['nullable', 'boolean'],
            'tags' => ['nullable', 'array'],
        ];
    }
}
