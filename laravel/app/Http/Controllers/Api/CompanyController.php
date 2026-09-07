<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    /**
     * Display a listing of companies with contacts count & search.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Company::query()->withCount('contacts');

        if ($search = $request->input('search')) {
            $query->search($search);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($request->boolean('overdue_only')) {
            $query->overdue(30);
        }

        $perPage = min((int) $request->input('per_page', 25), 100);
        $companies = $query->latest()->paginate($perPage);

        return response()->json($companies);
    }

    /**
     * Store a new company record.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'legal_name' => ['nullable', 'string', 'max:255'],
            'gstin' => ['nullable', 'string', 'size:15', 'unique:companies,gstin'],
            'pan' => ['nullable', 'string', 'size:10'],
            'website' => ['nullable', 'url', 'max:255'],
            'email' => ['nullable', 'email', 'max:191'],
            'phone' => ['nullable', 'string', 'max:30'],
            'mobile' => ['nullable', 'string', 'max:30'],
            'address_line_1' => ['nullable', 'string', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'pincode' => ['nullable', 'string', 'max:20'],
            'industry' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:ACTIVE,INACTIVE,PROSPECT,BLOCKED'],
        ]);

        $company = Company::create($validated);

        return response()->json([
            'message' => 'Company successfully created.',
            'company' => $company,
        ], 201);
    }

    /**
     * Display the specified company along with its contacts.
     */
    public function show(Company $company): JsonResponse
    {
        return response()->json(
            $company->load(['contacts' => fn($q) => $q->deliverable()])
        );
    }

    /**
     * Update the specified company.
     */
    public function update(Request $request, Company $company): JsonResponse
    {
        $validated = $request->validate([
            'company_name' => ['sometimes', 'required', 'string', 'max:255'],
            'legal_name' => ['nullable', 'string', 'max:255'],
            'gstin' => ['nullable', 'string', 'size:15', "unique:companies,gstin,{$company->id}"],
            'pan' => ['nullable', 'string', 'size:10'],
            'website' => ['nullable', 'url', 'max:255'],
            'email' => ['nullable', 'email', 'max:191'],
            'phone' => ['nullable', 'string', 'max:30'],
            'mobile' => ['nullable', 'string', 'max:30'],
            'address_line_1' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'pincode' => ['nullable', 'string', 'max:20'],
            'industry' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:ACTIVE,INACTIVE,PROSPECT,BLOCKED'],
        ]);

        $company->update($validated);

        return response()->json([
            'message' => 'Company successfully updated.',
            'company' => $company,
        ]);
    }

    /**
     * Remove the specified company.
     */
    public function destroy(Company $company): JsonResponse
    {
        $company->delete();

        return response()->json([
            'message' => 'Company successfully archived.',
        ]);
    }
}
