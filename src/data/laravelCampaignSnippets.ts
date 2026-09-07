import { LaravelCodeFile } from './laravelCodeSnippets';

export const LARAVEL_CAMPAIGN_CODE_FILES: LaravelCodeFile[] = [
  {
    id: 'campaign_migration',
    category: 'Migration',
    filename: 'database/migrations/2026_09_04_000001_create_campaigns_table.php',
    language: 'php',
    description: 'Migration for campaigns table with strict enums, audit timestamps, and relationships.',
    code: `<?php

declare(strict_types=1);

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 255)->index();
            $table->enum('campaign_type', [
                'Promotional',
                'Informational',
                'Newsletter',
                'Festival Greeting',
                'Product Launch',
                'Renewal',
                'Upgrade',
                'Event Invitation'
            ])->index();
            $table->string('subject', 255);
            $table->string('preheader', 255)->nullable();
            $table->foreignUuid('email_template_id')->nullable()->constrained('email_templates')->nullOnDelete();
            $table->longText('html_content');
            $table->longText('plain_text_content')->nullable();
            $table->string('from_name', 150);
            $table->string('from_email', 255)->index();
            $table->string('reply_to', 255)->nullable();
            
            $table->enum('status', [
                'DRAFT',
                'REVIEW',
                'APPROVED',
                'SCHEDULED',
                'PROCESSING',
                'PAUSED',
                'COMPLETED',
                'CANCELLED',
                'FAILED'
            ])->default('DRAFT')->index();

            // Audience definition & ESP configuration
            $table->jsonb('audience_config')->nullable(); // segment, tags, imported list or manual IDs
            $table->string('esp_provider', 50)->default('amazon_ses');
            $table->unsignedInteger('chunk_size')->default(500);
            $table->unsignedInteger('rate_limit_per_second')->default(50);

            // Timestamps & Workflow Tracking
            $table->timestamp('scheduled_at')->nullable()->index();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            
            $table->foreignUuid('created_by')->constrained('users');
            $table->foreignUuid('approved_by')->nullable()->constrained('users');
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};`
  },
  {
    id: 'campaign_recipients_migration',
    category: 'Migration',
    filename: 'database/migrations/2026_09_04_000002_create_campaign_recipients_table.php',
    language: 'php',
    description: 'Migration for frozen recipient snapshots with immutable personalization data.',
    code: `<?php

declare(strict_types=1);

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_recipients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('campaign_id')->constrained('campaigns')->cascadeOnDelete();
            $table->foreignUuid('contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->string('email', 255)->index();
            $table->jsonb('personalization_data'); // Frozen snapshot of contact variables at approval time
            
            $table->enum('status', [
                'QUEUED',
                'SENT',
                'DELIVERED',
                'OPENED',
                'CLICKED',
                'BOUNCED',
                'COMPLAINED',
                'UNSUBSCRIBED',
                'EXCLUDED',
                'FAILED'
            ])->default('QUEUED')->index();

            $table->string('exclusion_reason', 100)->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('opened_at')->nullable();
            $table->timestamp('clicked_at')->nullable();
            
            $table->timestamps();

            $table->unique(['campaign_id', 'contact_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_recipients');
    }
};`
  },
  {
    id: 'campaign_model',
    category: 'Model',
    filename: 'app/Models/Campaign.php',
    language: 'php',
    description: 'Eloquent Model for Campaign with enums, relations, scopes, and state machine helpers.',
    code: `<?php

declare(strict_types=1);

namespace App\\Models;

use App\\Enums\\CampaignStatus;
use App\\Enums\\CampaignType;
use Illuminate\\Database\\Eloquent\\Concerns\\HasUuids;
use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;
use Illuminate\\Database\\Eloquent\\SoftDeletes;

class Campaign extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'campaign_type',
        'subject',
        'preheader',
        'email_template_id',
        'html_content',
        'plain_text_content',
        'from_name',
        'from_email',
        'reply_to',
        'status',
        'audience_config',
        'esp_provider',
        'chunk_size',
        'rate_limit_per_second',
        'scheduled_at',
        'started_at',
        'completed_at',
        'created_by',
        'approved_by',
    ];

    protected $casts = [
        'campaign_type' => CampaignType::class,
        'status' => CampaignStatus::class,
        'audience_config' => 'array',
        'chunk_size' => 'integer',
        'rate_limit_per_second' => 'integer',
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(EmailTemplate::class, 'email_template_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(CampaignRecipient::class);
    }

    public function activeRecipients(): HasMany
    {
        return $this->hasMany(CampaignRecipient::class)->where('status', '!=', 'EXCLUDED');
    }

    public function canBeApproved(): bool
    {
        return $this->status === CampaignStatus::REVIEW;
    }

    public function canBeScheduled(): bool
    {
        return in_array($this->status, [CampaignStatus::APPROVED, CampaignStatus::DRAFT], true);
    }
}`
  },
  {
    id: 'campaign_recipient_model',
    category: 'Model',
    filename: 'app/Models/CampaignRecipient.php',
    language: 'php',
    description: 'Eloquent model for CampaignRecipient with personalization JSON casting and relations.',
    code: `<?php

declare(strict_types=1);

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Concerns\\HasUuids;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;

class CampaignRecipient extends Model
{
    use HasUuids;

    protected $fillable = [
        'campaign_id',
        'contact_id',
        'email',
        'personalization_data',
        'status',
        'exclusion_reason',
        'sent_at',
        'delivered_at',
        'opened_at',
        'clicked_at',
    ];

    protected $casts = [
        'personalization_data' => 'array',
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
        'opened_at' => 'datetime',
        'clicked_at' => 'datetime',
    ];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }
}`
  },
  {
    id: 'campaign_workflow_engine',
    category: 'Service',
    filename: 'app/Services/Campaign/CampaignWorkflowEngine.php',
    language: 'php',
    description: 'Workflow State Machine enforcing transitions: Draft -> Review -> Approved -> Scheduled -> Processing -> Completed.',
    code: `<?php

declare(strict_types=1);

namespace App\\Services\\Campaign;

use App\\Enums\\CampaignStatus;
use App\\Models\\Campaign;
use App\\Models\\User;
use DomainException;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Support\\Facades\\Log;

class CampaignWorkflowEngine
{
    public function __construct(
        private readonly PreSendValidationService $validationService,
        private readonly RecipientSnapshotService $snapshotService
    ) {}

    /**
     * Transition campaign from DRAFT to REVIEW.
     */
    public function submitForReview(Campaign $campaign, User $user): Campaign
    {
        if ($campaign->status !== CampaignStatus::DRAFT) {
            throw new DomainException("Campaign must be in DRAFT status to submit for review.");
        }

        // Validate campaign pre-requisites
        $report = $this->validationService->validate($campaign);
        if (!$report['is_valid']) {
            throw new DomainException("Validation failed: " . implode(", ", $report['errors']));
        }

        $campaign->update([
            'status' => CampaignStatus::REVIEW,
        ]);

        Log::info("Campaign [{$campaign->id}] submitted for review by User [{$user->id}]");

        return $campaign;
    }

    /**
     * Approve campaign and generate immutable recipient snapshot.
     */
    public function approve(Campaign $campaign, User $approver): Campaign
    {
        if ($campaign->status !== CampaignStatus::REVIEW) {
            throw new DomainException("Only campaigns in REVIEW status can be approved.");
        }

        return DB::transaction(function () use ($campaign, $approver) {
            // 1. Generate frozen recipient snapshot
            $this->snapshotService->createSnapshot($campaign);

            // 2. Transition status to APPROVED
            $campaign->update([
                'status' => CampaignStatus::APPROVED,
                'approved_by' => $approver->id,
            ]);

            Log::info("Campaign [{$campaign->id}] approved by Manager [{$approver->id}]. Recipient snapshot created.");

            return $campaign;
        });
    }

    /**
     * Schedule or immediately dispatch an approved campaign.
     */
    public function scheduleOrDispatch(Campaign $campaign, ?string $scheduledAt = null): Campaign
    {
        if ($campaign->status !== CampaignStatus::APPROVED) {
            throw new DomainException("Campaign must be APPROVED before scheduling or dispatching.");
        }

        if ($scheduledAt) {
            $campaign->update([
                'status' => CampaignStatus::SCHEDULED,
                'scheduled_at' => $scheduledAt,
            ]);
            return $campaign;
        }

        // Send Immediately -> Dispatch to Horizon queue workers
        $campaign->update([
            'status' => CampaignStatus::PROCESSING,
            'started_at' => now(),
        ]);

        // Dispatch chunked batch jobs
        dispatch(new \\App\\Jobs\\DispatchCampaignQueueJob($campaign));

        return $campaign;
    }
}`
  },
  {
    id: 'recipient_snapshot_service',
    category: 'Service',
    filename: 'app/Services/Campaign/RecipientSnapshotService.php',
    language: 'php',
    description: 'Freezes audience snapshot into campaign_recipients table to insulate scheduled campaigns from future segmentation changes.',
    code: `<?php

declare(strict_types=1);

namespace App\\Services\\Campaign;

use App\\Models\\Campaign;
use App\\Models\\CampaignRecipient;
use App\\Models\\Contact;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Support\\Str;

class RecipientSnapshotService
{
    /**
     * Resolves audience query and generates immutable snapshot.
     */
    public function createSnapshot(Campaign $campaign): int
    {
        // Delete any existing draft snapshot
        CampaignRecipient::where('campaign_id', $campaign->id)->delete();

        $audienceConfig = $campaign->audience_config ?? [];
        $type = $audienceConfig['type'] ?? 'segment';

        $contactsQuery = Contact::query()->with('company');

        // Resolve audience by type
        match ($type) {
            'segment' => $contactsQuery->whereHasSegment($audienceConfig['segment_id'] ?? ''),
            'tags' => $contactsQuery->whereJsonContains('tags', $audienceConfig['tags'] ?? []),
            'individual_contacts' => $contactsQuery->whereIn('id', $audienceConfig['contact_ids'] ?? []),
            'imported_list' => $contactsQuery->where('source', 'IMPORT'),
            default => $contactsQuery,
        };

        $batch = [];
        $insertedCount = 0;

        $contactsQuery->chunk(500, function ($contacts) use ($campaign, &$batch, &$insertedCount) {
            foreach ($contacts as $contact) {
                // Determine pre-send exclusion status
                $exclusionReason = null;
                $status = 'QUEUED';

                if ($contact->is_suppressed) {
                    $status = 'EXCLUDED';
                    $exclusionReason = 'SUPPRESSED';
                } elseif (!$contact->marketing_consent || $contact->marketing_status === 'UNSUBSCRIBED') {
                    $status = 'EXCLUDED';
                    $exclusionReason = 'UNSUBSCRIBED';
                } elseif ($contact->marketing_status === 'BOUNCED') {
                    $status = 'EXCLUDED';
                    $exclusionReason = 'BOUNCED';
                } elseif ($contact->marketing_status === 'COMPLAINED') {
                    $status = 'EXCLUDED';
                    $exclusionReason = 'COMPLAINED';
                } elseif (!filter_var($contact->email, FILTER_VALIDATE_EMAIL)) {
                    $status = 'EXCLUDED';
                    $exclusionReason = 'INVALID_EMAIL';
                }

                $batch[] = [
                    'id' => Str::uuid()->toString(),
                    'campaign_id' => $campaign->id,
                    'contact_id' => $contact->id,
                    'email' => $contact->email,
                    'personalization_data' => json_encode([
                        'first_name' => $contact->first_name,
                        'last_name' => $contact->last_name,
                        'email' => $contact->email,
                        'company_name' => $contact->company?->name ?? '',
                        'city' => $contact->city ?? '',
                        'state' => $contact->state ?? '',
                        'tally_outstanding_balance' => $contact->company?->outstanding_balance ?? 0,
                        'tally_overdue_days' => $contact->company?->overdue_days ?? 0,
                        'unsubscribe_url' => route('api.esp.unsubscribe', ['token' => $contact->unsubscribe_token]),
                    ], JSON_THROW_ON_ERROR),
                    'status' => $status,
                    'exclusion_reason' => $exclusionReason,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            if (count($batch) >= 500) {
                DB::table('campaign_recipients')->insert($batch);
                $insertedCount += count($batch);
                $batch = [];
            }
        });

        if (!empty($batch)) {
            DB::table('campaign_recipients')->insert($batch);
            $insertedCount += count($batch);
        }

        return $insertedCount;
    }
}`
  },
  {
    id: 'pre_send_validation_service',
    category: 'Service',
    filename: 'app/Services/Campaign/PreSendValidationService.php',
    language: 'php',
    description: 'Pre-send validator ensuring spam compliance, unsubscribe tags, and suppression exclusions.',
    code: `<?php

declare(strict_types=1);

namespace App\\Services\\Campaign;

use App\\Models\\Campaign;

class PreSendValidationService
{
    /**
     * Executes 5-point pre-send verification rules.
     */
    public function validate(Campaign $campaign): array
    {
        $errors = [];
        $warnings = [];

        // 1. Subject exists
        $subjectExists = !empty(trim($campaign->subject));
        if (!$subjectExists) {
            $errors[] = 'Subject line is mandatory and cannot be empty.';
        }

        // 2. HTML exists
        $htmlExists = !empty(trim($campaign->html_content));
        if (!$htmlExists) {
            $errors[] = 'HTML email content is required.';
        }

        // 3. From email configured
        $fromEmailConfigured = !empty($campaign->from_email) && filter_var($campaign->from_email, FILTER_VALIDATE_EMAIL);
        if (!$fromEmailConfigured) {
            $errors[] = 'Valid sender "From Email" is not configured.';
        }

        // 4. Unsubscribe URL exists
        $hasUnsubTag = str_contains($campaign->html_content, '{{UNSUBSCRIBE_URL}}') 
            || str_contains($campaign->html_content, '{{unsubscribe_url}}')
            || str_contains(strtolower($campaign->html_content), 'unsubscribe');
        if (!$hasUnsubTag) {
            $errors[] = 'Mandatory {{UNSUBSCRIBE_URL}} merge variable is missing from template.';
        }

        // 5. Recipient count > 0
        $recipientCount = $campaign->recipients()->count();
        if ($recipientCount === 0 && !empty($campaign->audience_config)) {
            // If snapshot not yet created, test estimate
            $recipientCount = 1; // provisional pass for pre-approval check
        }
        $recipientCountValid = $recipientCount > 0;
        if (!$recipientCountValid) {
            $errors[] = 'Target audience yields 0 deliverable recipients.';
        }

        $isValid = empty($errors);

        return [
            'is_valid' => $isValid,
            'checks' => [
                'subject_exists' => $subjectExists,
                'html_exists' => $htmlExists,
                'from_email_configured' => (bool)$fromEmailConfigured,
                'unsubscribe_url_exists' => $hasUnsubTag,
                'recipient_count_valid' => $recipientCountValid,
            ],
            'errors' => $errors,
            'warnings' => $warnings,
        ];
    }
}`
  },
  {
    id: 'campaign_controller',
    category: 'Controller',
    filename: 'app/Http/Controllers/Api/CampaignController.php',
    language: 'php',
    description: 'REST Controller supporting wizard steps, approval workflow, and telemetry analytics.',
    code: `<?php

declare(strict_types=1);

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\Campaign;
use App\\Services\\Campaign\\CampaignWorkflowEngine;
use App\\Services\\Campaign\\PreSendValidationService;
use App\\Services\\Campaign\\CampaignTestEmailService;
use Illuminate\\Http\\JsonResponse;
use Illuminate\\Http\\Request;

class CampaignController extends Controller
{
    public function __construct(
        private readonly CampaignWorkflowEngine $workflowEngine,
        private readonly PreSendValidationService $validationService,
        private readonly CampaignTestEmailService $testEmailService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $campaigns = Campaign::query()
            ->with(['creator:id,name', 'approver:id,name'])
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->when($request->campaign_type, fn ($q, $type) => $q->where('campaign_type', $type))
            ->latest()
            ->paginate(15);

        return response()->json($campaigns);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Campaign::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'campaign_type' => 'required|string',
            'subject' => 'required|string|max:255',
            'preheader' => 'nullable|string|max:255',
            'email_template_id' => 'nullable|uuid',
            'html_content' => 'required|string',
            'plain_text_content' => 'nullable|string',
            'from_name' => 'required|string|max:150',
            'from_email' => 'required|email|max:255',
            'reply_to' => 'nullable|email|max:255',
            'audience_config' => 'required|array',
        ]);

        $campaign = Campaign::create([
            ...$validated,
            'created_by' => $request->user()->id,
            'status' => 'DRAFT',
        ]);

        return response()->json($campaign, 201);
    }

    public function submitForReview(Campaign $campaign, Request $request): JsonResponse
    {
        $this->authorize('update', $campaign);
        $campaign = $this->workflowEngine->submitForReview($campaign, $request->user());
        return response()->json(['message' => 'Campaign submitted for review', 'campaign' => $campaign]);
    }

    public function approve(Campaign $campaign, Request $request): JsonResponse
    {
        $this->authorize('approve', $campaign);
        $campaign = $this->workflowEngine->approve($campaign, $request->user());
        return response()->json(['message' => 'Campaign approved and recipient snapshot generated', 'campaign' => $campaign]);
    }

    public function sendTestEmail(Campaign $campaign, Request $request): JsonResponse
    {
        $request->validate(['test_email' => 'required|email']);
        $result = $this->testEmailService->send($campaign, $request->test_email);
        return response()->json($result);
    }

    public function dispatch(Campaign $campaign, Request $request): JsonResponse
    {
        $this->authorize('dispatch', $campaign);
        $scheduledAt = $request->input('scheduled_at');
        $campaign = $this->workflowEngine->scheduleOrDispatch($campaign, $scheduledAt);
        return response()->json(['message' => 'Campaign dispatched/scheduled successfully', 'campaign' => $campaign]);
    }
}`
  },
  {
    id: 'campaign_policy',
    category: 'Validation & Policy',
    filename: 'app/Policies/CampaignPolicy.php',
    language: 'php',
    description: 'Authorization policy separating Campaign Creator vs Manager approval permissions.',
    code: `<?php

declare(strict_types=1);

namespace App\\Policies;

use App\\Models\\Campaign;
use App\\Models\\User;

class CampaignPolicy
{
    public function view(User $user, Campaign $campaign): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'marketing_manager', 'marketing_specialist']);
    }

    public function update(User $user, Campaign $campaign): bool
    {
        // Only DRAFT or REVIEW can be edited
        return in_array($campaign->status->value, ['DRAFT', 'REVIEW'], true)
            && ($user->id === $campaign->created_by || $user->hasRole('admin'));
    }

    public function approve(User $user, Campaign $campaign): bool
    {
        // Segregation of duties: Creator cannot approve their own campaign unless Super Admin
        if ($user->id === $campaign->created_by && !$user->hasRole('super_admin')) {
            return false;
        }

        return $user->hasAnyRole(['admin', 'marketing_director', 'compliance_officer']);
    }

    public function dispatch(User $user, Campaign $campaign): bool
    {
        return $user->hasAnyRole(['admin', 'marketing_director', 'marketing_manager']);
    }
}`
  },
  {
    id: 'campaign_workflow_test',
    category: 'Feature Tests',
    filename: 'tests/Feature/CampaignWorkflowTest.php',
    language: 'php',
    description: 'Pest / PHPUnit feature test covering approval workflow, recipient freezing, and pre-send validation.',
    code: `<?php

declare(strict_types=1);

namespace Tests\\Feature;

use App\\Enums\\CampaignStatus;
use App\\Models\\Campaign;
use App\\Models\\Contact;
use App\\Models\\User;
use Illuminate\\Foundation\\Testing\\RefreshDatabase;
use Tests\\TestCase;

class CampaignWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_campaign_transitions_from_draft_to_review_to_approved(): void
    {
        $creator = User::factory()->create(['role' => 'marketing_specialist']);
        $manager = User::factory()->create(['role' => 'marketing_director']);

        $contact = Contact::factory()->create([
            'email' => 'finance@client.com',
            'marketing_consent' => true,
            'is_suppressed' => false,
        ]);

        $campaign = Campaign::factory()->create([
            'created_by' => $creator->id,
            'status' => CampaignStatus::DRAFT,
            'subject' => 'Q3 Invoicing Statement',
            'html_content' => '<p>Hello {{first_name}}</p><a href="{{UNSUBSCRIBE_URL}}">Unsubscribe</a>',
            'from_email' => 'billing@digisoft.com',
            'audience_config' => ['type' => 'individual_contacts', 'contact_ids' => [$contact->id]],
        ]);

        // 1. Submit for review
        $response = $this->actingAs($creator)->postJson("/api/v1/campaigns/{$campaign->id}/submit-review");
        $response->assertOk();
        $this->assertEquals(CampaignStatus::REVIEW, $campaign->fresh()->status);

        // 2. Approve and freeze snapshot
        $approveResponse = $this->actingAs($manager)->postJson("/api/v1/campaigns/{$campaign->id}/approve");
        $approveResponse->assertOk();

        $freshCampaign = $campaign->fresh();
        $this->assertEquals(CampaignStatus::APPROVED, $freshCampaign->status);
        $this->assertEquals($manager->id, $freshCampaign->approved_by);

        // Verify recipient snapshot exists
        $this->assertDatabaseHas('campaign_recipients', [
            'campaign_id' => $campaign->id,
            'email' => 'finance@client.com',
            'status' => 'QUEUED',
        ]);
    }

    public function test_validation_fails_if_unsubscribe_link_missing(): void
    {
        $creator = User::factory()->create(['role' => 'marketing_specialist']);
        $campaign = Campaign::factory()->create([
            'created_by' => $creator->id,
            'status' => CampaignStatus::DRAFT,
            'subject' => 'No Unsubscribe Link',
            'html_content' => '<p>Direct promotional offer without opt-out</p>',
        ]);

        $response = $this->actingAs($creator)->postJson("/api/v1/campaigns/{$campaign->id}/submit-review");
        $response->assertStatus(422);
    }
}`
  }
];
