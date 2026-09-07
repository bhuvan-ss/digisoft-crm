<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContactRequest;
use App\Http\Requests\UpdateContactRequest;
use App\Models\Company;
use App\Models\Contact;
use App\Models\ContactSource;
use App\Models\Tag;
use App\Services\ContactDeduplicationService;
use App\Services\ContactMergeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ContactController extends Controller
{
    public function __construct(
        protected ContactDeduplicationService $deduplicationService,
        protected ContactMergeService $mergeService
    ) {}

    /**
     * Display a listing of master contacts with filtering & pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Contact::query()->with(['company', 'sources', 'tags']);

        // Search
        if ($search = $request->input('search')) {
            $query->search($search);
        }

        // Filter by marketing status
        if ($status = $request->input('marketing_status')) {
            $query->where('marketing_status', $status);
        }

        // Filter by consent status
        if ($consent = $request->input('consent_status')) {
            $query->where('consent_status', $consent);
        }

        // Filter by source
        if ($source = $request->input('source')) {
            $query->where('source', $source);
        }

        // Filter by company
        if ($companyId = $request->input('company_id')) {
            $query->where('company_id', $companyId);
        }

        // Filter by Tag
        if ($tagSlug = $request->input('tag')) {
            $query->whereHas('tags', fn($q) => $q->where('slug', $tagSlug));
        }

        // Deliverable only
        if ($request->boolean('deliverable_only')) {
            $query->deliverable();
        }

        $perPage = min((int) $request->input('per_page', 25), 100);
        $contacts = $query->latest()->paginate($perPage);

        return response()->json($contacts);
    }

    /**
     * Real-time duplicate check endpoint for interactive UI feedback.
     */
    public function checkDuplicate(Request $request): JsonResponse
    {
        $result = $this->deduplicationService->detectDuplicate(
            $request->only(['email', 'mobile', 'phone', 'gstin', 'first_name']),
            $request->input('exclude_contact_id')
        );

        return response()->json($result);
    }

    /**
     * Store a newly created contact with 3-tier duplicate prevention.
     */
    public function store(StoreContactRequest $request): JsonResponse
    {
        $data = $request->validated();

        // 1. Run 3-Tier Duplicate Detection
        $duplicateCheck = $this->deduplicationService->detectDuplicate($data);

        // If duplicate is detected and user has not instructed automatic merge
        if ($duplicateCheck['is_duplicate'] && !$request->boolean('auto_merge')) {
            return response()->json([
                'message' => 'A matching contact already exists in the master database.',
                'duplicate' => $duplicateCheck,
                'suggestion' => 'Consider merging this record or updating the existing contact.'
            ], 409);
        }

        // If auto_merge is requested and an existing contact was matched:
        if ($duplicateCheck['is_duplicate'] && $request->boolean('auto_merge') && $duplicateCheck['matched_contact']) {
            $tempContact = new Contact($data);
            $merged = $this->mergeService->merge($duplicateCheck['matched_contact'], $tempContact);
            return response()->json([
                'message' => 'Contact automatically merged into existing master record.',
                'contact' => $merged,
            ], 200);
        }

        // 2. Resolve or Link Company if provided
        $companyId = $data['company_id'] ?? null;
        if (!$companyId && !empty($data['gstin'])) {
            $company = Company::where('gstin', strtoupper(trim($data['gstin'])))->first();
            if ($company) {
                $companyId = $company->id;
            }
        }

        if (!$companyId && !empty($data['company_name'])) {
            $company = Company::firstOrCreate(
                ['company_name' => trim($data['company_name'])],
                [
                    'gstin' => $data['gstin'] ?? null,
                    'city' => $data['city'] ?? null,
                    'state' => $data['state'] ?? null,
                    'country' => $data['country'] ?? 'India',
                    'industry' => $data['industry'] ?? null,
                    'status' => 'ACTIVE',
                ]
            );
            $companyId = $company->id;
        }

        $data['company_id'] = $companyId;

        // 3. Create Contact
        $contact = Contact::create($data);

        // 4. Record Source Provenance
        ContactSource::create([
            'contact_id' => $contact->id,
            'source_type' => $contact->source ?: 'MANUAL',
            'source_reference' => $data['source_reference'] ?? 'Direct Contact Creation',
            'imported_at' => now(),
        ]);

        // 5. Sync Tags if provided
        if (!empty($data['tags'])) {
            $tagIds = [];
            foreach ($data['tags'] as $tagName) {
                $tag = Tag::firstOrCreate(
                    ['slug' => Str::slug($tagName)],
                    ['name' => trim($tagName)]
                );
                $tagIds[] = $tag->id;
            }
            $contact->tags()->sync($tagIds);
        }

        return response()->json([
            'message' => 'Contact successfully created.',
            'contact' => $contact->load(['company', 'sources', 'tags']),
        ], 201);
    }

    /**
     * Display the specified contact.
     */
    public function show(Contact $contact): JsonResponse
    {
        return response()->json(
            $contact->load(['company', 'sources', 'tags', 'mergedInto'])
        );
    }

    /**
     * Update the specified contact in storage.
     */
    public function update(UpdateContactRequest $request, Contact $contact): JsonResponse
    {
        $data = $request->validated();
        $contact->update($data);

        if (isset($data['tags'])) {
            $tagIds = [];
            foreach ($data['tags'] as $tagName) {
                $tag = Tag::firstOrCreate(
                    ['slug' => Str::slug($tagName)],
                    ['name' => trim($tagName)]
                );
                $tagIds[] = $tag->id;
            }
            $contact->tags()->sync($tagIds);
        }

        return response()->json([
            'message' => 'Contact successfully updated.',
            'contact' => $contact->load(['company', 'sources', 'tags']),
        ]);
    }

    /**
     * Soft-delete the contact.
     */
    public function destroy(Contact $contact): JsonResponse
    {
        $contact->delete();

        return response()->json([
            'message' => 'Contact successfully archived.',
        ]);
    }

    /**
     * Merge two contact records into one.
     */
    public function merge(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'primary_contact_id' => ['required', 'exists:contacts,id'],
            'secondary_contact_id' => ['required', 'exists:contacts,id', 'different:primary_contact_id'],
            'merge_notes' => ['nullable', 'string', 'max:500'],
        ]);

        $primary = Contact::findOrFail($validated['primary_contact_id']);
        $secondary = Contact::findOrFail($validated['secondary_contact_id']);

        $merged = $this->mergeService->merge($primary, $secondary, [
            'merge_notes' => $validated['merge_notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Contacts successfully merged.',
            'contact' => $merged,
        ]);
    }
}
