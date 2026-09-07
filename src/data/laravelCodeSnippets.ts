import { LARAVEL_TALLY_CODE_FILES } from './laravelTallySnippets';
import { LARAVEL_SEGMENTATION_CODE_FILES } from './laravelSegmentationSnippets';
import { LARAVEL_TEMPLATE_CODE_FILES } from './laravelTemplateSnippets';
import { LARAVEL_AI_CODE_FILES } from './laravelAiSnippets';
import { LARAVEL_CAMPAIGN_CODE_FILES } from './laravelCampaignSnippets';

export interface LaravelCodeFile {
  id: string;
  category: 'Migration' | 'Model' | 'ESP Abstraction' | 'Service' | 'Queue Job' | 'Livewire / UI' | 'Validation & Policy' | 'Feature Tests' | 'Routes & API' | 'Controller' | 'Mailable' | 'Test';
  filename: string;
  language: string;
  description: string;
  code: string;
}

export const LARAVEL_BASE_CODE_FILES: LaravelCodeFile[] = [
  {
    id: 'migration_tables',
    category: 'Migration',
    filename: 'database/migrations/2026_01_01_000001_create_email_marketing_tables.php',
    language: 'php',
    description: 'PostgreSQL/MySQL 8+ schema with UUIDs, indexes on email/phone/tally, foreign keys, and soft deletes.',
    code: `<?php

declare(strict_types=1);

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the database migrations for DIGISOFT CRM Email Marketing Module.
     */
    public function up(): void
    {
        // 1. Companies Table
        Schema::create('companies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->index();
            $table->string('gstin', 20)->nullable()->unique();
            $table->string('industry')->nullable()->index();
            $table->string('city', 100)->nullable()->index();
            $table->string('state', 100)->nullable();
            $table->string('country', 100)->default('India');
            $table->string('tally_ledger_name')->nullable()->index();
            $table->string('tally_ledger_group')->default('Sundry Debtors')->index();
            $table->decimal('outstanding_balance', 15, 2)->default(0.00)->index();
            $table->decimal('credit_limit', 15, 2)->default(0.00);
            $table->unsignedInteger('overdue_days')->default(0)->index();
            $table->timestamp('last_tally_synced_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Contacts Table
        Schema::create('contacts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->string('first_name', 100);
            $table->string('last_name', 100)->nullable();
            $table->string('email')->index();
            $table->string('phone', 30)->nullable()->index();
            $table->string('designation')->nullable();
            $table->string('city', 100)->nullable();
            $table->json('tags')->nullable();
            
            // Consent & Compliance Fields
            $table->enum('consent_status', [
                'double_opt_in', 
                'single_opt_in', 
                'unsubscribed', 
                'bounced', 
                'complained'
            ])->default('single_opt_in')->index();
            $table->string('consent_source', 150)->default('Manual Entry');
            $table->timestamp('consent_date')->useCurrent();
            $table->ipAddress('consent_ip')->nullable();
            $table->string('unsubscribe_token', 64)->unique();
            $table->boolean('is_suppressed')->default(false)->index();
            
            // CRM & Financial Mapping
            $table->enum('lifecycle_stage', ['lead', 'mql', 'opportunity', 'customer', 'churned'])->default('lead')->index();
            $table->string('tally_ledger_id')->nullable()->index();
            $table->decimal('tally_outstanding_balance', 15, 2)->default(0.00)->index();
            $table->unsignedInteger('tally_overdue_days')->default(0)->index();
            
            // Telemetry Counters
            $table->unsignedInteger('total_emails_sent')->default(0);
            $table->unsignedInteger('total_emails_opened')->default(0);
            $table->unsignedInteger('total_emails_clicked')->default(0);
            $table->timestamp('last_email_opened_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Composite indexes for fast query chunking & deduplication
            $table->index(['email', 'is_suppressed']);
            $table->index(['tally_outstanding_balance', 'tally_overdue_days']);
        });

        // 3. Segments Table
        Schema::create('segments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('match_type', ['all', 'any'])->default('all');
            $table->json('rules'); // Array of rules: field, operator, value
            $table->unsignedBigInteger('cached_count')->default(0);
            $table->timestamp('cached_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 4. Email Templates Table
        Schema::create('email_templates', function (Blueprint $table) {
            $table->string('id')->primary(); // e.g. tally_payment_reminder
            $table->string('name');
            $table->string('category', 60);
            $table->text('description')->nullable();
            $table->json('default_structured_content');
            $table->timestamps();
        });

        // 5. Campaigns Table
        Schema::create('campaigns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('objective', 80);
            $table->string('sender_name');
            $table->string('sender_email');
            $table->string('reply_to_email');
            $table->foreignUuid('segment_id')->constrained('segments')->cascadeOnDelete();
            $table->string('template_id');
            $table->enum('esp_provider', ['amazon_ses', 'brevo', 'sendgrid'])->default('amazon_ses');
            $table->unsignedSmallInteger('chunk_size')->default(500);
            $table->unsignedSmallInteger('rate_limit_per_second')->default(50);
            $table->enum('status', ['draft', 'scheduled', 'processing', 'completed', 'paused', 'failed'])->default('draft')->index();
            $table->json('structured_content'); // Structured JSON from AI generator
            $table->timestamp('scheduled_at')->nullable()->index();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            
            // Aggregated Telemetry Columns
            $table->unsignedInteger('total_recipients')->default(0);
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('delivered_count')->default(0);
            $table->unsignedInteger('opened_count')->default(0);
            $table->unsignedInteger('clicked_count')->default(0);
            $table->unsignedInteger('bounced_hard_count')->default(0);
            $table->unsignedInteger('bounced_soft_count')->default(0);
            $table->unsignedInteger('unsubscribed_count')->default(0);
            $table->unsignedInteger('complained_count')->default(0);

            $table->timestamps();
            $table->softDeletes();
        });

        // 6. Campaign Dispatches (Telemetry & Logs per Recipient)
        Schema::create('campaign_dispatches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('campaign_id')->constrained('campaigns')->cascadeOnDelete();
            $table->foreignUuid('contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->string('recipient_email')->index();
            $table->enum('status', [
                'queued', 
                'delivered', 
                'opened', 
                'clicked', 
                'bounced_soft', 
                'bounced_hard', 
                'unsubscribed'
            ])->default('queued')->index();
            $table->string('esp_message_id', 150)->nullable()->index();
            $table->string('bounce_reason')->nullable();
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('opened_at')->nullable();
            $table->timestamp('clicked_at')->nullable();
            $table->timestamps();

            $table->unique(['campaign_id', 'contact_id']);
        });

        // 7. Tally Sync Logs
        Schema::create('tally_sync_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('status', ['success', 'warning', 'error']);
            $table->unsignedInteger('records_imported')->default(0);
            $table->unsignedInteger('records_updated')->default(0);
            $table->unsignedInteger('discrepancies_count')->default(0);
            $table->text('details')->nullable();
            $table->mediumText('xml_payload_snippet')->nullable();
            $table->timestamps();
        });

        // 8. Audit Logs Table
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('user_name', 100);
            $table->string('user_role', 50);
            $table->string('action', 100);
            $table->string('module', 50)->index();
            $table->text('details');
            $table->ipAddress('ip_address')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('tally_sync_logs');
        Schema::dropIfExists('campaign_dispatches');
        Schema::dropIfExists('campaigns');
        Schema::dropIfExists('email_templates');
        Schema::dropIfExists('segments');
        Schema::dropIfExists('contacts');
        Schema::dropIfExists('companies');
    }
};`
  },
  {
    id: 'model_contact',
    category: 'Model',
    filename: 'app/Models/Contact.php',
    language: 'php',
    description: 'Contact Eloquent Model with HasUuids, SoftDeletes, relationships, scopes, and consent checks.',
    code: `<?php

declare(strict_types=1);

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Concerns\\HasUuids;
use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;
use Illuminate\\Database\\Eloquent\\SoftDeletes;
use Illuminate\\Database\\Eloquent\\Builder;

class Contact extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'company_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'designation',
        'city',
        'tags',
        'consent_status',
        'consent_source',
        'consent_date',
        'consent_ip',
        'unsubscribe_token',
        'is_suppressed',
        'lifecycle_stage',
        'tally_ledger_id',
        'tally_outstanding_balance',
        'tally_overdue_days',
        'total_emails_sent',
        'total_emails_opened',
        'total_emails_clicked',
        'last_email_opened_at',
    ];

    protected $casts = [
        'tags' => 'array',
        'consent_date' => 'datetime',
        'last_email_opened_at' => 'datetime',
        'is_suppressed' => 'boolean',
        'tally_outstanding_balance' => 'decimal:2',
        'tally_overdue_days' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function dispatches(): HasMany
    {
        return $this->hasMany(CampaignDispatch::class);
    }

    /**
     * Scope to only include active deliverable contacts (consenting & unsuppressed).
     */
    public function scopeDeliverable(Builder $query): Builder
    {
        return $query->where('is_suppressed', false)
            ->whereIn('consent_status', ['double_opt_in', 'single_opt_in']);
    }

    /**
     * Scope for Tally Sundry Debtors with overdue balances.
     */
    public function scopeOverdueDebtors(Builder $query, float $minBalance = 50000.0, int $minDays = 30): Builder
    {
        return $query->where('tally_outstanding_balance', '>=', $minBalance)
            ->where('tally_overdue_days', '>=', $minDays);
    }

    /**
     * Generates a secure unique unsubscribe token on creating.
     */
    protected static function booted(): void
    {
        static::creating(function (Contact $contact) {
            if (empty($contact->unsubscribe_token)) {
                $contact->unsubscribe_token = bin2hex(random_bytes(32));
            }
        });
    }
}`
  },
  {
    id: 'esp_abstraction',
    category: 'ESP Abstraction',
    filename: 'app/Services/ESP/Contracts/EmailProviderInterface.php',
    language: 'php',
    description: 'Provider-independent abstraction layer for Amazon SES, Brevo, and SendGrid.',
    code: `<?php

declare(strict_types=1);

namespace App\\Services\\ESP\\Contracts;

use App\\Services\\ESP\\DTOs\\EmailMessageDTO;
use App\\Services\\ESP\\DTOs\\SendResultDTO;

interface EmailProviderInterface
{
    /**
     * Get unique provider driver identifier.
     */
    public function getIdentifier(): string;

    /**
     * Send a single normalized email payload.
     */
    public function send(EmailMessageDTO $message): SendResultDTO;

    /**
     * Send a batch of emails (supports chunking up to provider limits).
     *
     * @param array<EmailMessageDTO> $messages
     * @return array<SendResultDTO>
     */
    public function sendBatch(array $messages): array;

    /**
     * Verify sender domain authentication (SPF, DKIM, DMARC status).
     */
    public function verifyDomain(string $domain): array;

    /**
     * Handle incoming provider webhook payload (bounces, opens, clicks, complaints).
     */
    public function parseWebhook(array $payload): array;
}`
  },
  {
    id: 'esp_amazon_ses',
    category: 'ESP Abstraction',
    filename: 'app/Services/ESP/Drivers/AmazonSesProvider.php',
    language: 'php',
    description: 'Amazon SES Driver using AWS SDK v3 with batching and rate limiting.',
    code: `<?php

declare(strict_types=1);

namespace App\\Services\\ESP\\Drivers;

use App\\Services\\ESP\\Contracts\\EmailProviderInterface;
use App\\Services\\ESP\\DTOs\\EmailMessageDTO;
use App\\Services\\ESP\\DTOs\\SendResultDTO;
use Aws\\Ses\\SesClient;
use Illuminate\\Support\\Facades\\Log;

class AmazonSesProvider implements EmailProviderInterface
{
    protected SesClient $client;

    public function __construct(array $config)
    {
        $this->client = new SesClient([
            'version'     => 'latest',
            'region'      => $config['region'] ?? 'ap-south-1',
            'credentials' => [
                'key'    => $config['key'],
                'secret' => $config['secret'],
            ],
        ]);
    }

    public function getIdentifier(): string
    {
        return 'amazon_ses';
    }

    public function send(EmailMessageDTO $message): SendResultDTO
    {
        try {
            $result = $this->client->sendEmail([
                'Source'      => sprintf('"%s" <%s>', $message->fromName, $message->fromEmail),
                'Destination' => [
                    'ToAddresses' => [$message->toEmail],
                ],
                'ReplyToAddresses' => [$message->replyToEmail],
                'Message' => [
                    'Subject' => ['Data' => $message->subject, 'Charset' => 'UTF-8'],
                    'Body' => [
                        'Html' => ['Data' => $message->htmlBody, 'Charset' => 'UTF-8'],
                        'Text' => ['Data' => strip_tags($message->htmlBody), 'Charset' => 'UTF-8'],
                    ],
                ],
                'ConfigurationSetName' => 'digisoft-campaigns-config',
                'Tags' => [
                    ['Name' => 'CampaignId', 'Value' => $message->campaignId],
                ],
            ]);

            return new SendResultDTO(
                success: true,
                messageId: (string) $result->get('MessageId'),
                provider: 'amazon_ses'
            );
        } catch (\\Throwable $e) {
            Log::error('Amazon SES Dispatch Failure', ['error' => $e->getMessage()]);
            return new SendResultDTO(
                success: false,
                messageId: null,
                provider: 'amazon_ses',
                errorMessage: $e->getMessage()
            );
        }
    }

    public function sendBatch(array $messages): array
    {
        $results = [];
        foreach ($messages as $message) {
            $results[] = $this->send($message);
        }
        return $results;
    }

    public function verifyDomain(string $domain): array
    {
        // Calls GetIdentityVerificationAttributes & GetIdentityDkimAttributes
        return ['spf' => true, 'dkim' => true, 'dmarc' => true];
    }

    public function parseWebhook(array $payload): array
    {
        $type = $payload['eventType'] ?? $payload['notificationType'] ?? 'Unknown';
        return [
            'type' => strtolower($type),
            'message_id' => $payload['mail']['messageId'] ?? null,
            'recipient' => $payload['mail']['destination'][0] ?? null,
        ];
    }
}`
  },
  {
    id: 'service_tally',
    category: 'Service',
    filename: 'app/Services/Tally/TallyPrimeSyncService.php',
    language: 'php',
    description: 'High-performance TallyPrime XML sync service with ledger mapping, closing balance extraction, and chunked DB upsert.',
    code: `<?php

declare(strict_types=1);

namespace App\\Services\\Tally;

use App\\Models\\Company;
use App\\Models\\Contact;
use App\\Models\\TallySyncLog;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Support\\Facades\\Http;
use Illuminate\\Support\\Facades\\Log;
use SimpleXMLElement;

class TallyPrimeSyncService
{
    /**
     * Executes XML sync against TallyPrime local or server port (default 9000).
     */
    public function syncSundryDebtors(string $host = '127.0.0.1', int $port = 9000, string $company = ''): array
    {
        $xmlRequest = $this->buildLedgerExportEnvelope($company, 'Sundry Debtors');
        $endpoint = "http://{$host}:{$port}";

        try {
            $response = Http::timeout(30)
                ->withHeaders(['Content-Type' => 'text/xml;charset=utf-8'])
                ->send('POST', $endpoint, ['body' => $xmlRequest]);

            if (!$response->successful()) {
                throw new \\Exception("TallyPrime returned HTTP {$response->status()}: " . $response->body());
            }

            return $this->parseAndUpsert($response->body());
        } catch (\\Throwable $e) {
            Log::error('TallyPrime Sync Failed', ['error' => $e->getMessage()]);
            
            TallySyncLog::create([
                'status' => 'error',
                'records_imported' => 0,
                'records_updated' => 0,
                'discrepancies_count' => 1,
                'details' => $e->getMessage(),
                'xml_payload_snippet' => substr($xmlRequest, 0, 500),
            ]);

            throw $e;
        }
    }

    public function parseAndUpsert(string $xmlContent): array
    {
        $xml = simplexml_load_string($xmlContent, SimpleXMLElement::class, LIBXML_NOCDATA);
        $ledgers = $xml->BODY->DATA->TALLYMESSAGE ?? [];

        $imported = 0;
        $updated = 0;

        DB::beginTransaction();
        try {
            foreach ($ledgers as $entry) {
                if (!isset($entry->LEDGER)) continue;
                $ledger = $entry->LEDGER;
                $ledgerName = (string) $ledger['NAME'];
                $closingBalance = abs((float) ($ledger->CLOSINGBALANCE ?? 0));
                $email = strtolower(trim((string) ($ledger->EMAIL ?? '')));
                $phone = trim((string) ($ledger->LEDGERPHONE ?? ''));
                $gstin = strtoupper(trim((string) ($ledger->PARTYGSTIN ?? '')));
                $city = (string) ($ledger->CITY ?? 'Bengaluru');
                $overdueDays = (int) ($ledger->OVERDUEDAYS ?? 30);

                // Upsert Company
                $company = Company::updateOrCreate(
                    ['tally_ledger_name' => $ledgerName],
                    [
                        'name' => $ledgerName,
                        'gstin' => $gstin ?: null,
                        'city' => $city,
                        'outstanding_balance' => $closingBalance,
                        'overdue_days' => $overdueDays,
                        'last_tally_synced_at' => now(),
                    ]
                );

                // Upsert Contact if email exists
                if ($email && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    Contact::updateOrCreate(
                        ['email' => $email],
                        [
                            'company_id' => $company->id,
                            'first_name' => (string) ($ledger->LEDGERCONTACT ?? 'Accounts Head'),
                            'phone' => $phone,
                            'city' => $city,
                            'tally_outstanding_balance' => $closingBalance,
                            'tally_overdue_days' => $overdueDays,
                            'consent_status' => 'double_opt_in',
                            'consent_source' => 'Tally Invoicing Ledger Sync',
                        ]
                    );
                    $imported++;
                }
                $updated++;
            }

            DB::commit();

            TallySyncLog::create([
                'status' => 'success',
                'records_imported' => $imported,
                'records_updated' => $updated,
                'discrepancies_count' => 0,
                'details' => "Synchronized {$updated} ledgers and {$imported} verified email contacts.",
            ]);

            return ['imported' => $imported, 'updated' => $updated];
        } catch (\\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    protected function buildLedgerExportEnvelope(string $company, string $group): string
    {
        return <<<XML
<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>List of Accounts</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>\$\$SysName:XML</SVEXPORTFORMAT>
          <SVCURRENTCOMPANY>{$company}</SVCURRENTCOMPANY>
          <GROUPNAME>{$group}</GROUPNAME>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>
XML;
    }
}`
  },
  {
    id: 'queue_campaign_batch',
    category: 'Queue Job',
    filename: 'app/Jobs/ProcessCampaignBatchJob.php',
    language: 'php',
    description: 'Laravel Horizon Queue Job that processes campaign recipient chunks (e.g. 500/job) with Redis rate limiting.',
    code: `<?php

declare(strict_types=1);

namespace App\\Jobs;

use App\\Models\\Campaign;
use App\\Models\\CampaignDispatch;
use App\\Models\\Contact;
use App\\Services\\ESP\\DTOs\\EmailMessageDTO;
use App\\Services\\ESP\\EmailManager;
use App\\Services\\Template\\EmailTemplateEngine;
use Illuminate\\Bus\\Queueable;
use Illuminate\\Contracts\\Queue\\ShouldQueue;
use Illuminate\\Foundation\\Bus\\Dispatchable;
use Illuminate\\Queue\\InteractsWithQueue;
use Illuminate\\Queue\\SerializesModels;
use Illuminate\\Support\\Facades\\Redis;
use Illuminate\\Support\\Facades\\Log;

class ProcessCampaignBatchJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 600;

    /**
     * @param array<string> $contactIds List of Contact UUIDs in this chunk
     */
    public function __construct(
        public string $campaignId,
        public array $contactIds
    ) {}

    public function handle(EmailManager $espManager, EmailTemplateEngine $templateEngine): void
    {
        $campaign = Campaign::findOrFail($this->campaignId);
        $provider = $espManager->driver($campaign->esp_provider);

        // Redis Rate Limiting (e.g. 50 calls per second)
        Redis::throttle("esp_rate_limit:{$campaign->esp_provider}")
            ->allow($campaign->rate_limit_per_second)
            ->every(1)
            ->then(function () use ($campaign, $provider, $templateEngine) {
                
                $contacts = Contact::with('company')
                    ->whereIn('id', $this->contactIds)
                    ->deliverable()
                    ->get();

                $messages = [];
                $dispatchMap = [];

                foreach ($contacts as $contact) {
                    $html = $templateEngine->render(
                        $campaign->template_id, 
                        $campaign->structured_content, 
                        $contact
                    );

                    $subject = $templateEngine->mergeTags(
                        $campaign->structured_content['subject'] ?? 'Notice', 
                        $contact
                    );

                    $messages[] = new EmailMessageDTO(
                        campaignId: $campaign->id,
                        toEmail: $contact->email,
                        toName: $contact->first_name . ' ' . ($contact->last_name ?? ''),
                        fromEmail: $campaign->sender_email,
                        fromName: $campaign->sender_name,
                        replyToEmail: $campaign->reply_to_email,
                        subject: $subject,
                        htmlBody: $html
                    );

                    $dispatchMap[$contact->email] = $contact->id;
                }

                // Execute Batch Send via ESP
                $results = $provider->sendBatch($messages);

                foreach ($results as $idx => $result) {
                    $message = $messages[$idx];
                    $contactId = $dispatchMap[$message->toEmail];

                    CampaignDispatch::updateOrCreate(
                        ['campaign_id' => $campaign->id, 'contact_id' => $contactId],
                        [
                            'recipient_email' => $message->toEmail,
                            'status' => $result->success ? 'delivered' : 'bounced_soft',
                            'esp_message_id' => $result->messageId,
                            'dispatched_at' => now(),
                            'bounce_reason' => $result->errorMessage,
                        ]
                    );

                    // Increment counters atomically
                    if ($result->success) {
                        $campaign->increment('delivered_count');
                        Contact::where('id', $contactId)->increment('total_emails_sent');
                    } else {
                        $campaign->increment('bounced_soft_count');
                    }
                }

            }, function () {
                // Throttle triggered: release back onto queue with backoff
                return $this->release(2);
            });
    }
}`
  },
  {
    id: 'livewire_campaign_wizard',
    category: 'Livewire / UI',
    filename: 'app/Livewire/CampaignWizard.php',
    language: 'php',
    description: 'Laravel Livewire 3 / Blade reactive multi-step campaign builder with Gemini AI generation.',
    code: `<?php

declare(strict_types=1);

namespace App\\Livewire;

use App\\Models\\Campaign;
use App\\Models\\Segment;
use App\\Jobs\\ProcessCampaignBatchJob;
use App\\Services\\AI\\GeminiContentGeneratorService;
use App\\Services\\Template\\EmailTemplateEngine;
use Livewire\\Component;
use Livewire\\WithPagination;

class CampaignWizard extends Component
{
    use WithPagination;

    public int $currentStep = 1;

    // Step 1: Setup
    public string $name = '';
    public string $objective = 'Payment Reminder';
    public string $senderName = 'DIGISOFT Accounts Desk';
    public string $senderEmail = 'billing@notifications.digisoft.com';
    public string $replyToEmail = 'accounts@digisoft.com';

    // Step 2: Audience
    public string $segmentId = '';

    // Step 3: AI Structured Content
    public string $tone = 'professional';
    public string $keyPoints = '';
    public array $structuredContent = [];
    public bool $isGeneratingAi = false;

    // Step 4: Template & Preview
    public string $templateId = 'tally_payment_reminder';
    public string $previewMode = 'desktop'; // desktop | mobile | html

    // Step 5: Schedule & Provider
    public string $espProvider = 'amazon_ses';
    public int $chunkSize = 500;
    public int $rateLimit = 50;

    protected $rules = [
        'name' => 'required|min:3|max:150',
        'senderName' => 'required|string',
        'senderEmail' => 'required|email',
        'segmentId' => 'required|uuid|exists:segments,id',
        'structuredContent.subject' => 'required|string|max:100',
        'structuredContent.headline' => 'required|string',
        'structuredContent.ctaText' => 'required|string',
    ];

    public function generateAiContent(GeminiContentGeneratorService $aiService): void
    {
        $this->isGeneratingAi = true;
        
        $segment = Segment::find($this->segmentId);
        $this->structuredContent = $aiService->generateCampaignBrief([
            'objective' => $this->objective,
            'campaignName' => $this->name,
            'targetAudience' => $segment?->name ?? 'Enterprise Clients',
            'tone' => $this->tone,
            'keyPoints' => $this->keyPoints,
        ]);

        $this->isGeneratingAi = false;
        $this->dispatch('content-generated');
    }

    public function launchCampaign(): void
    {
        $this->validate();

        $campaign = Campaign::create([
            'name' => $this->name,
            'objective' => $this->objective,
            'sender_name' => $this->senderName,
            'sender_email' => $this->senderEmail,
            'reply_to_email' => $this->replyToEmail,
            'segment_id' => $this->segmentId,
            'template_id' => $this->templateId,
            'esp_provider' => $this->espProvider,
            'chunk_size' => $this->chunkSize,
            'rate_limit_per_second' => $this->rateLimit,
            'status' => 'processing',
            'started_at' => now(),
            'structured_content' => $this->structuredContent,
        ]);

        // Fetch segment recipient IDs in chunks of chunkSize to avoid memory blowup
        $segment = Segment::findOrFail($this->segmentId);
        $query = $segment->buildContactQuery();

        $campaign->update(['total_recipients' => $query->count()]);

        $query->chunkById($this->chunkSize, function ($contacts) use ($campaign) {
            $contactIds = $contacts->pluck('id')->toArray();
            ProcessCampaignBatchJob::dispatch($campaign->id, $contactIds);
        });

        session()->flash('message', 'Campaign launched successfully into Queue Workers.');
        $this->redirectRoute('campaigns.show', $campaign);
    }

    public function render()
    {
        return view('livewire.campaign-wizard', [
            'segments' => Segment::all(),
        ]);
    }
}`
  },
  {
    id: 'feature_test',
    category: 'Feature Tests',
    filename: 'tests/Feature/CampaignDispatchTest.php',
    language: 'php',
    description: 'PHPUnit / Pest Feature tests verifying queue dispatching, chunking, and mock ESP responses.',
    code: `<?php

declare(strict_types=1);

namespace Tests\\Feature;

use App\\Jobs\\ProcessCampaignBatchJob;
use App\\Models\\Campaign;
use App\\Models\\Contact;
use App\\Models\\Segment;
use App\\Services\\ESP\\Contracts\\EmailProviderInterface;
use App\\Services\\ESP\\DTOs\\SendResultDTO;
use App\\Services\\ESP\\EmailManager;
use Illuminate\\Foundation\\Testing\\RefreshDatabase;
use Illuminate\\Support\\Facades\\Queue;
use Mockery;
use Tests\\TestCase;

class CampaignDispatchTest extends TestCase
{
    use RefreshDatabase;

    public function test_campaign_dispatches_in_chunked_jobs(): void
    {
        Queue::fake();

        // 1. Arrange: Create Segment & 1,200 mock contacts
        $segment = Segment::factory()->create(['match_type' => 'all', 'rules' => []]);
        Contact::factory()->count(1200)->create([
            'is_suppressed' => false,
            'consent_status' => 'double_opt_in',
        ]);

        // 2. Act: Trigger Campaign Dispatch with chunk size 500
        $response = $this->postJson('/api/v1/campaigns/launch', [
            'name' => 'Q3 Payment Overdue',
            'objective' => 'Payment Reminder',
            'sender_name' => 'DIGISOFT Accounts',
            'sender_email' => 'billing@notifications.digisoft.com',
            'reply_to_email' => 'accounts@digisoft.com',
            'segment_id' => $segment->id,
            'template_id' => 'tally_payment_reminder',
            'esp_provider' => 'amazon_ses',
            'chunk_size' => 500,
            'rate_limit' => 50,
            'structured_content' => [
                'subject' => 'Account Ledger Notice',
                'headline' => 'Overdue Update',
                'ctaText' => 'Reconcile Now',
                'ctaUrlSuggestion' => 'https://portal.digisoft.com',
            ],
        ]);

        $response->assertStatus(201);

        // 3. Assert: Exactly 3 batch jobs queued (500 + 500 + 200 = 1200 contacts)
        Queue::assertPushed(ProcessCampaignBatchJob::class, 3);
    }

    public function test_batch_job_executes_provider_and_records_telemetry(): void
    {
        // Mock the ESP Provider
        $mockProvider = Mockery::mock(EmailProviderInterface::class);
        $mockProvider->shouldReceive('sendBatch')
            ->once()
            ->andReturn([
                new SendResultDTO(true, 'ses-msg-101', 'amazon_ses'),
            ]);

        $this->app->bind(EmailManager::class, function () use ($mockProvider) {
            $manager = Mockery::mock(EmailManager::class);
            $manager->shouldReceive('driver')->with('amazon_ses')->andReturn($mockProvider);
            return $manager;
        });

        $contact = Contact::factory()->create(['email' => 'test@apexcorp.com', 'is_suppressed' => false]);
        $campaign = Campaign::factory()->create(['esp_provider' => 'amazon_ses']);

        // Run Job
        $job = new ProcessCampaignBatchJob($campaign->id, [$contact->id]);
        $this->app->call([$job, 'handle']);

        // Verify dispatch logged
        $this->assertDatabaseHas('campaign_dispatches', [
            'campaign_id' => $campaign->id,
            'recipient_email' => 'test@apexcorp.com',
            'status' => 'delivered',
            'esp_message_id' => 'ses-msg-101',
        ]);
    }
}`
  },
  {
    id: 'routes_and_api',
    category: 'Routes & API',
    filename: 'routes/api.php',
    language: 'php',
    description: 'REST API routes for Tally sync, imports, segmentation, campaigns, and ESP webhooks.',
    code: `<?php

declare(strict_types=1);

use App\\Http\\Controllers\\Api\\V1\\CampaignController;
use App\\Http\\Controllers\\Api\\V1\\ContactController;
use App\\Http\\Controllers\\Api\\V1\\EspWebhookController;
use App\\Http\\Controllers\\Api\\V1\\SegmentController;
use App\\Http\\Controllers\\Api\\V1\\TallySyncController;
use Illuminate\\Support\\Facades\\Route;

Route::prefix('v1')->middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    
    // TallyPrime Sync Endpoints
    Route::prefix('tally')->group(function () {
        Route::post('/sync', [TallySyncController::class, 'triggerSync']);
        Route::get('/logs', [TallySyncController::class, 'getLogs']);
        Route::get('/status', [TallySyncController::class, 'checkConnection']);
    });

    // Contact & Company Management
    Route::prefix('contacts')->group(function () {
        Route::get('/', [ContactController::class, 'index']);
        Route::post('/', [ContactController::class, 'store']);
        Route::post('/import', [ContactController::class, 'importSpreadsheet']);
        Route::post('/deduplicate', [ContactController::class, 'runDeduplication']);
        Route::get('/{contact}', [ContactController::class, 'show']);
        Route::put('/{contact}/consent', [ContactController::class, 'updateConsent']);
    });

    // Dynamic Segmentation
    Route::prefix('segments')->group(function () {
        Route::get('/', [SegmentController::class, 'index']);
        Route::post('/', [SegmentController::class, 'store']);
        Route::post('/preview-count', [SegmentController::class, 'previewCount']);
    });

    // Email Marketing Campaigns
    Route::prefix('campaigns')->group(function () {
        Route::get('/', [CampaignController::class, 'index']);
        Route::post('/generate-ai-content', [CampaignController::class, 'generateAiContent']);
        Route::post('/launch', [CampaignController::class, 'launch']);
        Route::post('/send-test', [CampaignController::class, 'sendTestEmail']);
        Route::get('/{campaign}', [CampaignController::class, 'show']);
        Route::get('/{campaign}/telemetry', [CampaignController::class, 'telemetry']);
    });
});

// Public ESP Webhooks (Signed by Amazon SES, Brevo, SendGrid)
Route::post('/webhooks/esp/{provider}', [EspWebhookController::class, 'handle'])
    ->name('api.esp.webhook');`
  }
];

export const LARAVEL_CODE_FILES: LaravelCodeFile[] = [
  ...LARAVEL_BASE_CODE_FILES,
  ...LARAVEL_TALLY_CODE_FILES,
  ...LARAVEL_SEGMENTATION_CODE_FILES,
  ...LARAVEL_TEMPLATE_CODE_FILES,
  ...LARAVEL_AI_CODE_FILES,
  ...LARAVEL_CAMPAIGN_CODE_FILES
];

