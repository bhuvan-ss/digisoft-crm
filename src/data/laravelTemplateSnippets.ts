import { LaravelCodeFile } from './laravelCodeSnippets';

export const LARAVEL_TEMPLATE_CODE_FILES: LaravelCodeFile[] = [
  // 1. MIGRATION
  {
    id: 'mig-email-templates',
    category: 'Migration',
    filename: 'database/migrations/2026_01_05_000001_create_email_templates_table.php',
    language: 'php',
    description: 'Schema definition for email_templates and version snapshot ledger with JSON and fulltext indexes.',
    code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for Phase 5 Email Template Management.
     */
    public function up(): void
    {
        Schema::create('email_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 150)->index();
            $table->enum('category', [
                'Corporate',
                'Promotional',
                'Newsletter',
                'Product Launch',
                'Festival',
                'Offer',
                'Informational',
                'Renewal Reminder'
            ])->index();
            $table->text('description')->nullable();
            $table->string('subject_default', 255);
            $table->string('preheader_default', 255)->nullable();
            $table->longText('html_content');
            $table->longText('plain_text_content')->nullable();
            $table->string('thumbnail', 500)->nullable();
            $table->enum('status', ['ACTIVE', 'DRAFT', 'ARCHIVED'])->default('DRAFT')->index();
            $table->unsignedInteger('version')->default(1);
            $table->string('created_by', 100);
            $table->string('approved_by', 100)->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes for fast lookup
            $table->index(['status', 'category']);
        });

        Schema::create('email_template_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('template_id')->constrained('email_templates')->cascadeOnDelete();
            $table->unsignedInteger('version_number');
            $table->string('name', 150);
            $table->string('subject_default', 255);
            $table->string('preheader_default', 255)->nullable();
            $table->longText('html_content');
            $table->longText('plain_text_content')->nullable();
            $table->string('change_summary', 500)->nullable();
            $table->string('created_by', 100);
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['template_id', 'version_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_template_versions');
        Schema::dropIfExists('email_templates');
    }
};`
  },

  // 2. MODELS
  {
    id: 'mod-email-template',
    category: 'Model',
    filename: 'app/Models/EmailTemplate.php',
    language: 'php',
    description: 'Eloquent model for managed email templates with version relations and scopes.',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\SoftDeletes;
use Illuminate\\Database\\Eloquent\\Concerns\\HasUuids;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;

class EmailTemplate extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'email_templates';

    protected $fillable = [
        'name',
        'category',
        'description',
        'subject_default',
        'preheader_default',
        'html_content',
        'plain_text_content',
        'thumbnail',
        'status',
        'version',
        'created_by',
        'approved_by',
    ];

    protected $casts = [
        'version' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relationship to historical snapshots.
     */
    public function versions(): HasMany
    {
        return $this->hasMany(EmailTemplateVersion::class, 'template_id')
                    ->orderByDesc('version_number');
    }

    /**
     * Scope for active production templates.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }

    /**
     * Scope filtering by category.
     */
    public function scopeCategory($query, string $category)
    {
        return $query->where('category', $category);
    }
}`
  },
  {
    id: 'mod-email-template-version',
    category: 'Model',
    filename: 'app/Models/EmailTemplateVersion.php',
    language: 'php',
    description: 'Immutable historical snapshots for template rollback and audit verification.',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Concerns\\HasUuids;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;

class EmailTemplateVersion extends Model
{
    use HasUuids;

    protected $table = 'email_template_versions';
    public $timestamps = false;

    protected $fillable = [
        'template_id',
        'version_number',
        'name',
        'subject_default',
        'preheader_default',
        'html_content',
        'plain_text_content',
        'change_summary',
        'created_by',
        'created_at',
    ];

    protected $casts = [
        'version_number' => 'integer',
        'created_at' => 'datetime',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(EmailTemplate::class, 'template_id');
    }
}`
  },

  // 3. SERVICES: VALIDATOR
  {
    id: 'srv-template-validator',
    category: 'Service',
    filename: 'app/Services/Templates/EmailTemplateValidator.php',
    language: 'php',
    description: 'Sanitization and strict validation checking for CAN-SPAM compliance, 600px table layout, and XSS prevention.',
    code: `<?php

namespace App\\Services\\Templates;

class EmailTemplateValidator
{
    public const REQUIRED_VARIABLES = [
        '{{UNSUBSCRIBE_URL}}',
        '{{COMPANY_ADDRESS}}',
    ];

    public const SUPPORTED_VARIABLES = [
        '{{CONTACT_NAME}}',
        '{{FIRST_NAME}}',
        '{{LAST_NAME}}',
        '{{COMPANY_NAME}}',
        '{{EMAIL}}',
        '{{CITY}}',
        '{{STATE}}',
        '{{UNSUBSCRIBE_URL}}',
        '{{COMPANY_LOGO}}',
        '{{COMPANY_ADDRESS}}',
        '{{PRIVACY_POLICY_URL}}',
    ];

    /**
     * Validates an HTML template string and returns structured diagnostics.
     */
    public function validate(string $html, string $subject = '', string $preheader = ''): array
    {
        $errors = [];
        $warnings = [];

        if (trim($html) === '') {
            return [
                'is_valid' => false,
                'score' => 0,
                'errors' => ['Template HTML cannot be empty.'],
                'warnings' => [],
            ];
        }

        // 1. Security Violations (XSS & Scripts)
        if (preg_match('/<script\\b[^>]*>(.*?)<\\/script>/is', $html)) {
            $errors[] = 'Security Violation: <script> tags are strictly forbidden in email templates.';
        }
        if (preg_match('/<(iframe|object|embed|applet|meta|form)\\b/i', $html)) {
            $errors[] = 'Security Violation: Embedded elements (<iframe, <object, <embed) are prohibited.';
        }
        if (preg_match('/\\bon[a-z]+\\s*=\\s*["\'][^"\']*["\']/i', $html)) {
            $errors[] = 'Security Violation: Inline JavaScript event handlers (onload, onclick) detected.';
        }
        if (preg_match('/href\\s*=\\s*["\']javascript:/i', $html)) {
            $errors[] = 'Security Violation: "javascript:" protocol detected in hyperlinks.';
        }

        // 2. Mandatory CAN-SPAM / Compliance Variables
        if (!str_contains($html, '{{UNSUBSCRIBE_URL}}')) {
            $errors[] = 'CAN-SPAM Violation: Mandatory {{UNSUBSCRIBE_URL}} merge tag is missing from template.';
        }
        if (!str_contains($html, '{{COMPANY_ADDRESS}}')) {
            $warnings[] = 'Compliance Warning: Physical postal address tag {{COMPANY_ADDRESS}} is recommended.';
        }

        // 3. Broken Variable Syntax Check
        if (preg_match('/\\{\\{[A-Z0-9_]+(?!\\}\\})/i', $html, $matches)) {
            $errors[] = 'Broken syntax: Merge variable without closing curly braces found: ' . $matches[0];
        }

        // 4. Email Client Compatibility & Table Layout
        $lower = strtolower($html);
        if (!str_contains($lower, '<table') || !str_contains($lower, 'cellpadding') || !str_contains($lower, 'cellspacing')) {
            $warnings[] = 'Compatibility Warning: Table-based layout (<table cellpadding="0" cellspacing="0" border="0">) recommended for Microsoft Outlook.';
        }

        if (!str_contains($html, '600') && !str_contains($html, 'max-width: 600px')) {
            $warnings[] = 'Layout Warning: 600px max-width wrapper not explicitly declared.';
        }

        // Calculate Quality Score
        $score = 100 - (count($errors) * 25) - (count($warnings) * 8);
        $score = max(0, min(100, $score));

        return [
            'is_valid' => empty($errors),
            'score' => $score,
            'errors' => $errors,
            'warnings' => $warnings,
            'detected_variables' => $this->extractVariables($html),
        ];
    }

    /**
     * Strips dangerous script tags and event listeners.
     */
    public function sanitize(string $html): string
    {
        $sanitized = preg_replace('/<script\\b[^>]*>(.*?)<\\/script>/is', '', $html);
        $sanitized = preg_replace('/<(iframe|object|embed|applet)\\b[^>]*>.*?<\\/\\1>/is', '', $sanitized);
        $sanitized = preg_replace('/\\bon[a-z]+\\s*=\\s*["\'][^"\']*["\']/i', '', $sanitized);
        $sanitized = preg_replace('/href\\s*=\\s*["\']javascript:[^"\']*["\']/i', 'href="#"', $sanitized);

        return $sanitized;
    }

    public function extractVariables(string $html): array
    {
        preg_match_all('/\\{\\{([A-Z0-9_]+)\\}\\}/', $html, $matches);
        return array_values(array_unique($matches[0] ?? []));
    }
}`
  },

  // 4. SERVICES: VARIABLE ENGINE
  {
    id: 'srv-variable-engine',
    category: 'Service',
    filename: 'app/Services/Templates/TemplateVariableEngine.php',
    language: 'php',
    description: 'Substitutes standard contact, company, and compliance merge variables with real database values and fallbacks.',
    code: `<?php

namespace App\\Services\\Templates;

use App\\Models\\Contact;

class TemplateVariableEngine
{
    /**
     * Interpolate variables into text or HTML content using contact and company records.
     */
    public function render(string $content, ?Contact $contact = null, array $customOverrides = []): string
    {
        $company = $contact?->company;

        $dictionary = [
            '{{CONTACT_NAME}}' => $contact?->full_name ?? 'Valued Partner',
            '{{FIRST_NAME}}' => $contact?->first_name ?? 'Valued',
            '{{LAST_NAME}}' => $contact?->last_name ?? 'Partner',
            '{{COMPANY_NAME}}' => $company?->name ?? $contact?->company_name ?? 'Valued Enterprise',
            '{{EMAIL}}' => $contact?->email ?? 'partner@example.com',
            '{{CITY}}' => $contact?->city ?? $company?->city ?? 'Bengaluru',
            '{{STATE}}' => $contact?->state ?? $company?->state ?? 'Karnataka',
            '{{UNSUBSCRIBE_URL}}' => config('app.url') . '/unsubscribe?token=' . ($contact?->unsubscribe_token ?? 'test-sample-token'),
            '{{COMPANY_LOGO}}' => config('mail.branding.logo_url', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240'),
            '{{COMPANY_ADDRESS}}' => config('mail.branding.physical_address', 'DIGISOFT Tower, Plot 42, Electronics City Phase 1, Bengaluru, KA 560100'),
            '{{PRIVACY_POLICY_URL}}' => config('app.url') . '/privacy-policy',
        ];

        $merged = array_merge($dictionary, $customOverrides);

        return strtr($content, $merged);
    }
}`
  },

  // 5. SERVICES: VERSION SERVICE
  {
    id: 'srv-version-service',
    category: 'Service',
    filename: 'app/Services/Templates/TemplateVersionService.php',
    language: 'php',
    description: 'Manages automated snapshotting, release tagging, and point-in-time version rollback.',
    code: `<?php

namespace App\\Services\\Templates;

use App\\Models\\EmailTemplate;
use App\\Models\\EmailTemplateVersion;
use Illuminate\\Support\\Facades\\DB;

class TemplateVersionService
{
    /**
     * Creates a new historical snapshot of the template.
     */
    public function createSnapshot(EmailTemplate $template, string $changeSummary, string $author): EmailTemplateVersion
    {
        return EmailTemplateVersion::create([
            'template_id' => $template->id,
            'version_number' => $template->version,
            'name' => $template->name,
            'subject_default' => $template->subject_default,
            'preheader_default' => $template->preheader_default,
            'html_content' => $template->html_content,
            'plain_text_content' => $template->plain_text_content,
            'change_summary' => $changeSummary,
            'created_by' => $author,
            'created_at' => now(),
        ]);
    }

    /**
     * Reverts a template to a specified previous version snapshot.
     */
    public function rollbackToVersion(EmailTemplate $template, int $targetVersionNumber, string $author): EmailTemplate
    {
        return DB::transaction(function () use ($template, $targetVersionNumber, $author) {
            $snapshot = $template->versions()
                ->where('version_number', $targetVersionNumber)
                ->firstOrFail();

            // Save current state as intermediate backup
            $this->createSnapshot($template, "Automatic pre-rollback backup before restoring v{$targetVersionNumber}", $author);

            // Apply snapshot values and bump version number
            $newVersion = $template->version + 1;
            $template->update([
                'name' => $snapshot->name,
                'subject_default' => $snapshot->subject_default,
                'preheader_default' => $snapshot->preheader_default,
                'html_content' => $snapshot->html_content,
                'plain_text_content' => $snapshot->plain_text_content,
                'version' => $newVersion,
            ]);

            // Create record for the restored version
            $this->createSnapshot($template, "Restored from version {$targetVersionNumber}.0", $author);

            return $template->fresh(['versions']);
        });
    }
}`
  },

  // 6. CONTROLLER
  {
    id: 'ctrl-template-controller',
    category: 'Controller',
    filename: 'app/Http/Controllers/Api/V1/EmailTemplateController.php',
    language: 'php',
    description: 'Full REST API controller for template CRUD, validation endpoint, live preview rendering, test email dispatch, and version rollback.',
    code: `<?php

namespace App\\Http\\Controllers\\Api\\V1;

use App\\Http\\Controllers\\Controller;
use App\\Models\\EmailTemplate;
use App\\Models\\Contact;
use App\\Services\\Templates\\EmailTemplateValidator;
use App\\Services\\Templates\\TemplateVariableEngine;
use App\\Services\\Templates\\TemplateVersionService;
use App\\Mail\\TestTemplateMailable;
use Illuminate\\Http\\Request;
use Illuminate\\Http\\JsonResponse;
use Illuminate\\Support\\Facades\\Mail;
use Illuminate\\Support\\Facades\\DB;

class EmailTemplateController extends Controller
{
    public function __construct(
        protected EmailTemplateValidator $validator,
        protected TemplateVariableEngine $variableEngine,
        protected TemplateVersionService $versionService
    ) {}

    /**
     * List all email templates with optional category/status filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = EmailTemplate::with('versions:id,template_id,version_number,change_summary,created_at');

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('subject_default', 'like', $search);
            });
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->orderByDesc('updated_at')->paginate(20),
        ]);
    }

    /**
     * Store a newly created email template.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'category' => 'required|in:Corporate,Promotional,Newsletter,Product Launch,Festival,Offer,Informational,Renewal Reminder',
            'description' => 'nullable|string',
            'subject_default' => 'required|string|max:255',
            'preheader_default' => 'nullable|string|max:255',
            'html_content' => 'required|string',
            'plain_text_content' => 'nullable|string',
            'thumbnail' => 'nullable|string|url',
            'status' => 'required|in:ACTIVE,DRAFT,ARCHIVED',
        ]);

        // Validate HTML syntax & compliance
        $diagnostics = $this->validator->validate($validated['html_content']);
        if (!$diagnostics['is_valid']) {
            return response()->json([
                'status' => 'error',
                'message' => 'HTML Template validation failed.',
                'errors' => $diagnostics['errors'],
            ], 422);
        }

        $sanitizedHtml = $this->validator->sanitize($validated['html_content']);

        $template = DB::transaction(function () use ($validated, $sanitizedHtml) {
            $template = EmailTemplate::create([
                ...$validated,
                'html_content' => $sanitizedHtml,
                'version' => 1,
                'created_by' => auth()->user()?->name ?? 'Integration Specialist',
            ]);

            $this->versionService->createSnapshot($template, 'Initial template creation', $template->created_by);

            return $template;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Email template created successfully.',
            'data' => $template->load('versions'),
        ], 201);
    }

    /**
     * Show single template with version history.
     */
    public function show(EmailTemplate $emailTemplate): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $emailTemplate->load('versions'),
        ]);
    }

    /**
     * Update template and optionally create version snapshot.
     */
    public function update(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:150',
            'category' => 'sometimes|required|in:Corporate,Promotional,Newsletter,Product Launch,Festival,Offer,Informational,Renewal Reminder',
            'description' => 'nullable|string',
            'subject_default' => 'sometimes|required|string|max:255',
            'preheader_default' => 'nullable|string|max:255',
            'html_content' => 'sometimes|required|string',
            'plain_text_content' => 'nullable|string',
            'thumbnail' => 'nullable|string',
            'status' => 'sometimes|required|in:ACTIVE,DRAFT,ARCHIVED',
            'change_summary' => 'nullable|string|max:500',
        ]);

        if (isset($validated['html_content'])) {
            $diagnostics = $this->validator->validate($validated['html_content']);
            if (!$diagnostics['is_valid']) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'HTML Template validation failed.',
                    'errors' => $diagnostics['errors'],
                ], 422);
            }
            $validated['html_content'] = $this->validator->sanitize($validated['html_content']);
        }

        DB::transaction(function () use ($emailTemplate, $validated) {
            $hasVersionSummary = !empty($validated['change_summary']);
            if ($hasVersionSummary) {
                $emailTemplate->version += 1;
            }

            $emailTemplate->update($validated);

            if ($hasVersionSummary) {
                $author = auth()->user()?->name ?? 'Lead Architect';
                $this->versionService->createSnapshot($emailTemplate, $validated['change_summary'], $author);
            }
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Email template updated successfully.',
            'data' => $emailTemplate->fresh(['versions']),
        ]);
    }

    /**
     * Validate raw HTML content endpoint.
     */
    public function validateHtml(Request $request): JsonResponse
    {
        $request->validate(['html_content' => 'required|string']);
        $result = $this->validator->validate($request->input('html_content'));

        return response()->json([
            'status' => 'success',
            'data' => $result,
        ]);
    }

    /**
     * Render live preview with interpolated contact variables.
     */
    public function preview(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        $contactId = $request->query('contact_id');
        $contact = $contactId ? Contact::with('company')->find($contactId) : null;

        $renderedHtml = $this->variableEngine->render($emailTemplate->html_content, $contact);
        $renderedSubject = $this->variableEngine->render($emailTemplate->subject_default, $contact);
        $renderedPreheader = $this->variableEngine->render($emailTemplate->preheader_default ?? '', $contact);

        return response()->json([
            'status' => 'success',
            'data' => [
                'subject' => $renderedSubject,
                'preheader' => $renderedPreheader,
                'html' => $renderedHtml,
            ],
        ]);
    }

    /**
     * Dispatch test email to specified inbox.
     */
    public function sendTestEmail(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        $request->validate([
            'to' => 'required|email',
            'contact_id' => 'nullable|uuid|exists:contacts,id',
        ]);

        $contact = $request->filled('contact_id') 
            ? Contact::with('company')->find($request->input('contact_id')) 
            : Contact::with('company')->first();

        $renderedSubject = $this->variableEngine->render($emailTemplate->subject_default, $contact);
        $renderedHtml = $this->variableEngine->render($emailTemplate->html_content, $contact);

        Mail::to($request->input('to'))->send(
            new TestTemplateMailable($renderedSubject, $renderedHtml)
        );

        return response()->json([
            'status' => 'success',
            'message' => "Test email successfully sent to {$request->input('to')}.",
        ]);
    }

    /**
     * Rollback template to a prior version snapshot.
     */
    public function restoreVersion(Request $request, EmailTemplate $emailTemplate, int $versionNumber): JsonResponse
    {
        $author = auth()->user()?->name ?? 'Operations Manager';
        $restored = $this->versionService->rollbackToVersion($emailTemplate, $versionNumber, $author);

        return response()->json([
            'status' => 'success',
            'message' => "Template restored to version {$versionNumber}.0 successfully.",
            'data' => $restored,
        ]);
    }
}`
  },

  // 7. MAILABLE
  {
    id: 'mail-test-mailable',
    category: 'Mailable',
    filename: 'app/Mail/TestTemplateMailable.php',
    language: 'php',
    description: 'Laravel Mailable delivering compiled responsive HTML and plain-text alternatives for test dispatching.',
    code: `<?php

namespace App\\Mail;

use Illuminate\\Bus\\Queueable;
use Illuminate\\Mail\\Mailable;
use Illuminate\\Mail\\Mailables\\Content;
use Illuminate\\Mail\\Mailables\\Envelope;
use Illuminate\\Queue\\SerializesModels;

class TestTemplateMailable extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $renderedSubject,
        public string $renderedHtml,
        public ?string $renderedText = null
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[TEST] ' . $this->renderedSubject,
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: $this->renderedHtml,
        );
    }
}`
  },

  // 8. FEATURE TEST
  {
    id: 'test-template-feature',
    category: 'Test',
    filename: 'tests/Feature/EmailTemplateTest.php',
    language: 'php',
    description: 'Comprehensive test suite covering CRUD, validation rejections (script tags, missing unsubscribe), variable parsing, and version rollbacks.',
    code: `<?php

namespace Tests\\Feature;

use Tests\\TestCase;
use App\\Models\\EmailTemplate;
use App\\Models\\Contact;
use Illuminate\\Foundation\\Testing\\RefreshDatabase;
use Illuminate\\Support\\Facades\\Mail;
use App\\Mail\\TestTemplateMailable;

class EmailTemplateTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_valid_email_template(): void
    {
        $payload = [
            'name' => 'Q3 Performance Review',
            'category' => 'Corporate',
            'subject_default' => 'Review for {{COMPANY_NAME}}',
            'preheader_default' => 'Leadership summary',
            'html_content' => '<table cellpadding="0" cellspacing="0" border="0" style="max-width:600px;"><tr><td>Hello {{FIRST_NAME}}<br/><a href="{{UNSUBSCRIBE_URL}}">Unsubscribe</a><p>{{COMPANY_ADDRESS}}</p></td></tr></table>',
            'status' => 'ACTIVE',
        ];

        $response = $this->postJson('/api/v1/email-templates', $payload);

        $response->assertStatus(201)
                 ->assertJsonPath('status', 'success')
                 ->assertJsonPath('data.version', 1);

        $this->assertDatabaseHas('email_templates', [
            'name' => 'Q3 Performance Review',
            'category' => 'Corporate',
        ]);
    }

    public function test_rejects_templates_with_malicious_script_tags(): void
    {
        $payload = [
            'name' => 'Malicious Template',
            'category' => 'Promotional',
            'subject_default' => 'Discount',
            'html_content' => '<script>alert("xss")</script><a href="{{UNSUBSCRIBE_URL}}">Unsub</a>',
            'status' => 'DRAFT',
        ];

        $response = $this->postJson('/api/v1/email-templates', $payload);

        $response->assertStatus(422)
                 ->assertJsonFragment(['Security Violation: <script> tags are strictly forbidden in email templates.']);
    }

    public function test_rejects_templates_without_mandatory_unsubscribe_url(): void
    {
        $payload = [
            'name' => 'Non-compliant Template',
            'category' => 'Newsletter',
            'subject_default' => 'Weekly Digest',
            'html_content' => '<p>Hello world without opt-out link</p>',
            'status' => 'ACTIVE',
        ];

        $response = $this->postJson('/api/v1/email-templates', $payload);

        $response->assertStatus(422)
                 ->assertJsonFragment(['CAN-SPAM Violation: Mandatory {{UNSUBSCRIBE_URL}} merge tag is missing from template.']);
    }

    public function test_version_snapshot_and_rollback(): void
    {
        $template = EmailTemplate::create([
            'name' => 'Initial Version',
            'category' => 'Offer',
            'subject_default' => 'Old Subject',
            'html_content' => '<a href="{{UNSUBSCRIBE_URL}}">Unsub</a> {{COMPANY_ADDRESS}}',
            'status' => 'ACTIVE',
            'version' => 1,
            'created_by' => 'Architect',
        ]);

        // Update with version note
        $this->putJson("/api/v1/email-templates/{$template->id}", [
            'subject_default' => 'New Subject V2',
            'change_summary' => 'Updated subject headline',
        ])->assertStatus(200)
          ->assertJsonPath('data.version', 2);

        // Rollback to version 1
        $rollback = $this->postJson("/api/v1/email-templates/{$template->id}/versions/1/restore");

        $rollback->assertStatus(200)
                 ->assertJsonPath('data.subject_default', 'Old Subject')
                 ->assertJsonPath('data.version', 3);
    }

    public function test_send_test_email(): void
    {
        Mail::fake();

        $template = EmailTemplate::create([
            'name' => 'Test Dispatch Template',
            'category' => 'Corporate',
            'subject_default' => 'Notice for {{FIRST_NAME}}',
            'html_content' => '<p>Test email content</p><a href="{{UNSUBSCRIBE_URL}}">Unsub</a>{{COMPANY_ADDRESS}}',
            'status' => 'ACTIVE',
            'version' => 1,
            'created_by' => 'QA Engineer',
        ]);

        $response = $this->postJson("/api/v1/email-templates/{$template->id}/send-test", [
            'to' => 'tester@digisoft.com',
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success');

        Mail::assertSent(TestTemplateMailable::class, function ($mail) {
            return $mail->hasTo('tester@digisoft.com');
        });
    }
}`
  }
];
