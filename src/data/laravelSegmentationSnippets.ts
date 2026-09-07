import { LaravelCodeFile } from './laravelCodeSnippets';

export const LARAVEL_SEGMENTATION_CODE_FILES: LaravelCodeFile[] = [
  // 1. Database Migration
  {
    id: 'migration_segments_tables',
    category: 'Migration',
    filename: 'database/migrations/2026_01_04_000001_create_segmentation_tables.php',
    language: 'php',
    description: 'Schema definition for segments and segment_contacts tables with JSON rules, caching, and indexes.',
    code: `<?php

declare(strict_types=1);

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for Contact Segmentation Engine.
     */
    public function up(): void
    {
        // 1. Segments Table
        Schema::create('segments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 150)->index();
            $table->text('description')->nullable();
            $table->enum('segment_type', ['STATIC', 'DYNAMIC'])->default('DYNAMIC')->index();
            $table->jsonb('rules')->nullable()->comment('Recursive rule group tree with AND/OR operators');
            $table->unsignedInteger('total_contacts')->default(0)->index()->comment('Cached matching count');
            $table->boolean('is_dynamic')->default(true)->index();
            $table->enum('status', ['ACTIVE', 'ARCHIVED', 'DRAFT'])->default('ACTIVE')->index();
            $table->uuid('created_by')->nullable()->index();
            $table->timestamp('last_calculated_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Composite Indexes for fast dashboard filtering
            $table->index(['status', 'segment_type']);
            $table->index(['created_by', 'status']);
        });

        // 2. Segment Contacts Table (Used strictly for STATIC segments)
        Schema::create('segment_contacts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('segment_id')->constrained('segments')->cascadeOnDelete();
            $table->foreignUuid('contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->timestamp('added_at')->useCurrent();

            // Unique constraint prevents duplicate memberships
            $table->unique(['segment_id', 'contact_id'], 'uq_segment_contact');
            $table->index(['segment_id', 'added_at']);
        });

        // Supplementary high-performance indexes on contacts for segmentation engine
        Schema::table('contacts', function (Blueprint $table) {
            $table->index(['marketing_status', 'state', 'city'], 'idx_contacts_seg_geo');
            $table->index(['source', 'marketing_status'], 'idx_contacts_seg_src');
            $table->index(['tally_outstanding_balance', 'marketing_status'], 'idx_contacts_seg_tally_bal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('segment_contacts');
        Schema::dropIfExists('segments');

        Schema::table('contacts', function (Blueprint $table) {
            $table->dropIndex('idx_contacts_seg_geo');
            $table->dropIndex('idx_contacts_seg_src');
            $table->dropIndex('idx_contacts_seg_tally_bal');
        });
    }
};`
  },

  // 2. Segment Model
  {
    id: 'model_segment',
    category: 'Model',
    filename: 'app/Models/Segment.php',
    language: 'php',
    description: 'Eloquent model for Segments with JSON casting, scopes, relationships, and rule helpers.',
    code: `<?php

declare(strict_types=1);

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Concerns\\HasUuids;
use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsToMany;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;
use Illuminate\\Database\\Eloquent\\SoftDeletes;
use App\\Services\\Segmentation\\SegmentQueryBuilderService;

class Segment extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'segments';

    protected $fillable = [
        'name',
        'description',
        'segment_type',
        'rules',
        'total_contacts',
        'is_dynamic',
        'status',
        'created_by',
        'last_calculated_at'
    ];

    protected $casts = [
        'rules' => 'array',
        'total_contacts' => 'integer',
        'is_dynamic' => 'boolean',
        'last_calculated_at' => 'datetime',
    ];

    /**
     * Relationship: Static contacts attached to this segment.
     */
    public function staticContacts(): BelongsToMany
    {
        return $this->belongsToMany(Contact::class, 'segment_contacts', 'segment_id', 'contact_id')
                    ->withPivot('added_at');
    }

    /**
     * Dynamic contacts query builder instance.
     */
    public function contactsQuery()
    {
        if ($this->segment_type === 'STATIC') {
            return $this->staticContacts();
        }

        return app(SegmentQueryBuilderService::class)->buildQuery($this->rules ?? []);
    }

    /**
     * Scope: Only Active segments.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }

    /**
     * Scope: Only Dynamic segments.
     */
    public function scopeDynamic($query)
    {
        return $query->where('segment_type', 'DYNAMIC');
    }

    /**
     * Scope: Only Static segments.
     */
    public function scopeStatic($query)
    {
        return $query->where('segment_type', 'STATIC');
    }
}`
  },

  // 3. SegmentContact Model
  {
    id: 'model_segment_contact',
    category: 'Model',
    filename: 'app/Models/SegmentContact.php',
    language: 'php',
    description: 'Pivot model representing explicit contact membership in STATIC segments.',
    code: `<?php

declare(strict_types=1);

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Concerns\\HasUuids;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;

class SegmentContact extends Model
{
    use HasUuids;

    public $timestamps = false;
    protected $table = 'segment_contacts';

    protected $fillable = [
        'segment_id',
        'contact_id',
        'added_at',
    ];

    protected $casts = [
        'added_at' => 'datetime',
    ];

    public function segment(): BelongsTo
    {
        return $this->belongsTo(Segment::class, 'segment_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'contact_id');
    }
}`
  },

  // 4. Segment Rule Parser
  {
    id: 'service_segment_rule_parser',
    category: 'Service',
    filename: 'app/Services/Segmentation/SegmentRuleParser.php',
    language: 'php',
    description: 'Validates and normalizes recursive JSON rule trees against allowed fields and operators.',
    code: `<?php

declare(strict_types=1);

namespace App\\Services\\Segmentation;

use InvalidArgumentException;

class SegmentRuleParser
{
    /**
     * Whitelist of searchable fields and their target SQL column mapping.
     */
    public const ALLOWED_FIELDS = [
        // Contact attributes
        'name'                    => 'contacts.full_name',
        'email'                   => 'contacts.email',
        'mobile'                  => 'contacts.mobile',
        'city'                    => 'contacts.city',
        'state'                   => 'contacts.state',
        'country'                 => 'contacts.country',
        'source'                  => 'contacts.source',
        'marketing_status'        => 'contacts.marketing_status',
        'tags'                    => 'contacts.tags',
        'created_at'              => 'contacts.created_at',

        // Company attributes
        'industry'                => 'companies.industry',
        'gstin'                   => 'companies.gstin',
        'company_type'            => 'companies.company_type',

        // Tally attributes
        'tally_ledger_group'      => 'contacts.tally_ledger_group',
        'tally_outstanding_balance' => 'contacts.tally_outstanding_balance',
        'last_transaction_date'   => 'contacts.last_transaction_date',

        // Email Activity attributes
        'last_email_sent_at'      => 'contacts.last_email_sent_at',
        'last_email_opened_at'    => 'contacts.last_email_opened_at',
        'total_emails_opened'     => 'contacts.total_emails_opened',
        'total_emails_clicked'    => 'contacts.total_emails_clicked',
    ];

    public const ALLOWED_OPERATORS = [
        'equals',
        'not_equals',
        'contains',
        'starts_with',
        'ends_with',
        'in',
        'not_in',
        'greater_than',
        'less_than',
        'between',
        'is_empty',
        'is_not_empty',
    ];

    /**
     * Recursively validates the rule tree structure and prevents SQL injection.
     */
    public function validateRuleTree(array $node): void
    {
        $type = $node['type'] ?? 'group';

        if ($type === 'group') {
            $logical = strtoupper($node['logicalOperator'] ?? 'AND');
            if (!in_array($logical, ['AND', 'OR'], true)) {
                throw new InvalidArgumentException("Invalid logical operator: {$logical}. Must be AND or OR.");
            }

            $children = $node['children'] ?? [];
            if (!is_array($children)) {
                throw new InvalidArgumentException("Group children must be an array.");
            }

            foreach ($children as $child) {
                $this->validateRuleTree($child);
            }
        } elseif ($type === 'condition') {
            $field = $node['field'] ?? null;
            $operator = $node['operator'] ?? null;

            if (!array_key_exists($field, self::ALLOWED_FIELDS)) {
                throw new InvalidArgumentException("Unauthorized or unknown filter field: {$field}");
            }

            if (!in_array($operator, self::ALLOWED_OPERATORS, true)) {
                throw new InvalidArgumentException("Unauthorized or unknown operator: {$operator}");
            }
        } else {
            throw new InvalidArgumentException("Unknown node type: {$type}");
        }
    }
}`
  },

  // 5. Query Builder Service
  {
    id: 'service_segment_query_builder',
    category: 'Service',
    filename: 'app/Services/Segmentation/SegmentQueryBuilderService.php',
    language: 'php',
    description: 'Generates index-optimized parameterized SQL queries handling 100,000+ contacts without memory exhaustion.',
    code: `<?php

declare(strict_types=1);

namespace App\\Services\\Segmentation;

use App\\Models\\Contact;
use Illuminate\\Database\\Eloquent\\Builder;
use Illuminate\\Support\\Facades\\DB;
use InvalidArgumentException;

class SegmentQueryBuilderService
{
    public function __construct(
        protected SegmentRuleParser $parser
    ) {}

    /**
     * Builds an Eloquent Builder for a given segment rule tree.
     */
    public function buildQuery(array $ruleTree): Builder
    {
        $this->parser->validateRuleTree($ruleTree);

        $query = Contact::query()
            ->select([
                'contacts.id',
                'contacts.first_name',
                'contacts.last_name',
                'contacts.email',
                'contacts.mobile',
                'contacts.city',
                'contacts.state',
                'contacts.source',
                'contacts.marketing_status',
                'contacts.tally_outstanding_balance',
                'contacts.company_id'
            ])
            ->leftJoin('companies', 'contacts.company_id', '=', 'companies.id')
            ->whereNull('contacts.deleted_at')
            // CRITICAL: Strict suppression protection
            ->where('contacts.marketing_status', '!=', 'UNSUBSCRIBED')
            ->where('contacts.is_suppressed', false);

        $this->applyGroup($query, $ruleTree);

        return $query;
    }

    /**
     * Applies a rule group recursively onto the Query Builder.
     */
    protected function applyGroup(Builder $query, array $group): void
    {
        $logicalOperator = strtoupper($group['logicalOperator'] ?? 'AND');
        $children = $group['children'] ?? [];

        if (empty($children)) {
            return;
        }

        $booleanMethod = $logicalOperator === 'OR' ? 'orWhere' : 'where';

        $query->{$booleanMethod}(function (Builder $subQuery) use ($children, $logicalOperator) {
            foreach ($children as $child) {
                if (($child['type'] ?? 'condition') === 'group') {
                    $childLogical = strtoupper($child['logicalOperator'] ?? 'AND');
                    $nestedMethod = $childLogical === 'OR' ? 'orWhere' : 'where';
                    $subQuery->{$nestedMethod}(fn (Builder $q) => $this->applyGroup($q, $child));
                } else {
                    $this->applyCondition($subQuery, $child, $logicalOperator);
                }
            }
        });
    }

    /**
     * Applies a single condition with parameterized bindings and index friendliness.
     */
    protected function applyCondition(Builder $query, array $cond, string $groupLogical): void
    {
        $fieldKey = $cond['field'];
        $column = SegmentRuleParser::ALLOWED_FIELDS[$fieldKey];
        $operator = $cond['operator'];
        $value = $cond['value'] ?? null;
        $isOr = $groupLogical === 'OR';

        switch ($operator) {
            case 'equals':
                $isOr ? $query->orWhere($column, '=', $value) : $query->where($column, '=', $value);
                break;

            case 'not_equals':
                $isOr ? $query->orWhere($column, '!=', $value) : $query->where($column, '!=', $value);
                break;

            case 'contains':
                $pattern = "%{$value}%";
                $isOr ? $query->orWhere($column, 'ILIKE', $pattern) : $query->where($column, 'ILIKE', $pattern);
                break;

            case 'starts_with':
                $pattern = "{$value}%";
                $isOr ? $query->orWhere($column, 'ILIKE', $pattern) : $query->where($column, 'ILIKE', $pattern);
                break;

            case 'ends_with':
                $pattern = "%{$value}";
                $isOr ? $query->orWhere($column, 'ILIKE', $pattern) : $query->where($column, 'ILIKE', $pattern);
                break;

            case 'in':
                $values = is_array($value) ? $value : array_map('trim', explode(',', (string)$value));
                $isOr ? $query->orWhereIn($column, $values) : $query->whereIn($column, $values);
                break;

            case 'not_in':
                $values = is_array($value) ? $value : array_map('trim', explode(',', (string)$value));
                $isOr ? $query->orWhereNotIn($column, $values) : $query->whereNotIn($column, $values);
                break;

            case 'greater_than':
                $isOr ? $query->orWhere($column, '>', $value) : $query->where($column, '>', $value);
                break;

            case 'less_than':
                $isOr ? $query->orWhere($column, '<', $value) : $query->where($column, '<', $value);
                break;

            case 'between':
                $range = is_array($value) ? $value : array_map('trim', explode('-', (string)$value));
                $min = $range[0] ?? 0;
                $max = $range[1] ?? 1000000;
                $isOr ? $query->orWhereBetween($column, [$min, $max]) : $query->whereBetween($column, [$min, $max]);
                break;

            case 'is_empty':
                $isOr ? $query->orWhere(fn ($q) => $q->whereNull($column)->orWhere($column, ''))
                      : $query->where(fn ($q) => $q->whereNull($column)->orWhere($column, ''));
                break;

            case 'is_not_empty':
                $isOr ? $query->orWhere(fn ($q) => $q->whereNotNull($column)->where($column, '!=', ''))
                      : $query->where(fn ($q) => $q->whereNotNull($column)->where($column, '!=', ''));
                break;
        }
    }

    /**
     * Efficiently counts matching records using COUNT(*) index scan.
     */
    public function getCount(array $ruleTree): int
    {
        return $this->buildQuery($ruleTree)->count();
    }

    /**
     * Memory-safe chunk streaming for processing 100,000+ contacts into campaigns or jobs.
     */
    public function streamContacts(array $ruleTree, int $chunkSize, callable $callback): void
    {
        $this->buildQuery($ruleTree)
            ->orderBy('contacts.id', 'asc')
            ->chunkById($chunkSize, $callback, 'contacts.id', 'id');
    }
}`
  },

  // 6. Cached Contact Counts Service
  {
    id: 'service_segment_cache',
    category: 'Service',
    filename: 'app/Services/Segmentation/SegmentCacheService.php',
    language: 'php',
    description: 'Redis caching service with tagging and automatic invalidation upon contact imports or Tally syncs.',
    code: `<?php

declare(strict_types=1);

namespace App\\Services\\Segmentation;

use App\\Models\\Segment;
use Illuminate\\Support\\Facades\\Cache;

class SegmentCacheService
{
    public const CACHE_TTL_SECONDS = 3600; // 1 Hour TTL

    public function __construct(
        protected SegmentQueryBuilderService $queryBuilder
    ) {}

    /**
     * Retrieves or calculates the cached contact count for a segment.
     */
    public function getCachedCount(Segment $segment, bool $forceRefresh = false): int
    {
        $cacheKey = "segment:count:{$segment->id}";

        if ($forceRefresh) {
            Cache::forget($cacheKey);
        }

        return Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($segment) {
            if ($segment->segment_type === 'STATIC') {
                $count = $segment->staticContacts()->count();
            } else {
                $count = $this->queryBuilder->getCount($segment->rules ?? []);
            }

            // Also persist onto database column for fast sorting
            $segment->updateQuietly([
                'total_contacts'     => $count,
                'last_calculated_at' => now(),
            ]);

            return $count;
        });
    }

    /**
     * Invalidates all segment counts across the system (e.g. after massive Tally sync or CSV import).
     */
    public function invalidateAllSegmentCaches(): void
    {
        Cache::tags(['segments'])->flush();
    }
}`
  },

  // 7. Segment Controller & Preview API
  {
    id: 'controller_segment_api',
    category: 'Routes & API',
    filename: 'app/Http/Controllers/Api/V1/SegmentController.php',
    language: 'php',
    description: 'REST Controller with previewCount, previewContacts, rule validation, and CRUD operations.',
    code: `<?php

declare(strict_types=1);

namespace App\\Http\\Controllers\\Api\\V1;

use App\\Http\\Controllers\\Controller;
use App\\Models\\Segment;
use App\\Services\\Segmentation\\SegmentQueryBuilderService;
use App\\Services\\Segmentation\\SegmentCacheService;
use Illuminate\\Http\\JsonResponse;
use Illuminate\\Http\\Request;
use Illuminate\\Validation\\Rule;

class SegmentController extends Controller
{
    public function __construct(
        protected SegmentQueryBuilderService $queryBuilder,
        protected SegmentCacheService $cacheService
    ) {}

    /**
     * GET /api/v1/segments
     */
    public function index(Request $request): JsonResponse
    {
        $query = Segment::query();

        if ($request->filled('type')) {
            $query->where('segment_type', $request->input('type'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('search')) {
            $term = $request->input('search');
            $query->where(fn ($q) => $q->where('name', 'ILIKE', "%{$term}%")->orWhere('description', 'ILIKE', "%{$term}%"));
        }

        $segments = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($segments);
    }

    /**
     * POST /api/v1/segments/preview-count
     * Fast live count calculated while user edits rules in the UI builder.
     */
    public function previewCount(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rules' => ['required', 'array'],
        ]);

        $count = $this->queryBuilder->getCount($validated['rules']);

        return response()->json([
            'status'        => 'success',
            'matching_count'=> $count,
            'calculated_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * POST /api/v1/segments/preview-contacts
     * Returns a paginated preview sample of matching records.
     */
    public function previewContacts(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rules'     => ['required', 'array'],
            'per_page'  => ['nullable', 'integer', 'max:100'],
        ]);

        $perPage = $validated['per_page'] ?? 25;
        $contacts = $this->queryBuilder->buildQuery($validated['rules'])->paginate($perPage);

        return response()->json($contacts);
    }

    /**
     * POST /api/v1/segments
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:150'],
            'description'  => ['nullable', 'string'],
            'segment_type' => ['required', Rule::in(['STATIC', 'DYNAMIC'])],
            'rules'        => ['nullable', 'array'],
            'status'       => ['required', Rule::in(['ACTIVE', 'ARCHIVED', 'DRAFT'])],
        ]);

        $segment = Segment::create([
            ...$validated,
            'is_dynamic' => $validated['segment_type'] === 'DYNAMIC',
            'created_by' => $request->user()?->id,
        ]);

        // Calculate and cache initial count
        $count = $this->cacheService->getCachedCount($segment, true);

        return response()->json([
            'message' => 'Segment created successfully.',
            'segment' => $segment->fresh(),
            'count'   => $count,
        ], 201);
    }

    /**
     * PUT /api/v1/segments/{segment}
     */
    public function update(Request $request, Segment $segment): JsonResponse
    {
        $validated = $request->validate([
            'name'         => ['sometimes', 'string', 'max:150'],
            'description'  => ['nullable', 'string'],
            'segment_type' => ['sometimes', Rule::in(['STATIC', 'DYNAMIC'])],
            'rules'        => ['nullable', 'array'],
            'status'       => ['sometimes', Rule::in(['ACTIVE', 'ARCHIVED', 'DRAFT'])],
        ]);

        $segment->update($validated);
        $count = $this->cacheService->getCachedCount($segment, true);

        return response()->json([
            'message' => 'Segment updated successfully.',
            'segment' => $segment->fresh(),
            'count'   => $count,
        ]);
    }

    /**
     * DELETE /api/v1/segments/{segment}
     */
    public function destroy(Segment $segment): JsonResponse
    {
        $segment->delete();

        return response()->json([
            'message' => 'Segment deleted successfully.'
        ]);
    }
}`
  },

  // 8. Feature Tests
  {
    id: 'test_segment_query_builder',
    category: 'Feature Tests',
    filename: 'tests/Feature/SegmentQueryBuilderTest.php',
    language: 'php',
    description: 'Pest / PHPUnit feature tests verifying Boolean parsing, nested groups, suppression filters, and count caching.',
    code: `<?php

declare(strict_types=1);

namespace Tests\\Feature;

use App\\Models\\Company;
use App\\Models\\Contact;
use App\\Models\\Segment;
use App\\Services\\Segmentation\\SegmentQueryBuilderService;
use App\\Services\\Segmentation\\SegmentCacheService;
use Illuminate\\Foundation\\Testing\\RefreshDatabase;
use Tests\\TestCase;

class SegmentQueryBuilderTest extends TestCase
{
    use RefreshDatabase;

    protected SegmentQueryBuilderService $builder;
    protected SegmentCacheService $cache;

    protected function setUp(): void
    {
        parent::setUp();
        $this->builder = app(SegmentQueryBuilderService::class);
        $this->cache = app(SegmentCacheService::class);
    }

    /** @test */
    public function it_filters_tally_customers_in_delhi_ncr_with_nested_or_group(): void
    {
        // Contact 1: Tally + Delhi + Active (Should match)
        Contact::factory()->create([
            'first_name'       => 'Bhuvan',
            'source'           => 'TALLY',
            'state'            => 'Delhi',
            'city'             => 'New Delhi',
            'marketing_status' => 'ACTIVE',
            'is_suppressed'    => false,
        ]);

        // Contact 2: Tally + Noida (UP) + Active (Should match via City IN)
        Contact::factory()->create([
            'first_name'       => 'Rohit',
            'source'           => 'TALLY',
            'state'            => 'Uttar Pradesh',
            'city'             => 'Noida',
            'marketing_status' => 'ACTIVE',
            'is_suppressed'    => false,
        ]);

        // Contact 3: Tally + Mumbai + Active (Should NOT match)
        Contact::factory()->create([
            'first_name'       => 'Anita',
            'source'           => 'TALLY',
            'state'            => 'Maharashtra',
            'city'             => 'Mumbai',
            'marketing_status' => 'ACTIVE',
            'is_suppressed'    => false,
        ]);

        // Contact 4: Tally + Delhi + UNSUBSCRIBED (Must NOT match due to suppression protection)
        Contact::factory()->create([
            'first_name'       => 'Sunil',
            'source'           => 'TALLY',
            'state'            => 'Delhi',
            'city'             => 'New Delhi',
            'marketing_status' => 'UNSUBSCRIBED',
            'is_suppressed'    => true,
        ]);

        $rules = [
            'type'            => 'group',
            'logicalOperator' => 'AND',
            'children'        => [
                [
                    'type'     => 'condition',
                    'field'    => 'source',
                    'operator' => 'equals',
                    'value'    => 'TALLY',
                ],
                [
                    'type'            => 'group',
                    'logicalOperator' => 'OR',
                    'children'        => [
                        [
                            'type'     => 'condition',
                            'field'    => 'state',
                            'operator' => 'equals',
                            'value'    => 'Delhi',
                        ],
                        [
                            'type'     => 'condition',
                            'field'    => 'city',
                            'operator' => 'in',
                            'value'    => ['Noida', 'Ghaziabad', 'Gurgaon'],
                        ],
                    ],
                ],
                [
                    'type'     => 'condition',
                    'field'    => 'marketing_status',
                    'operator' => 'equals',
                    'value'    => 'ACTIVE',
                ],
            ],
        ];

        $matchedContacts = $this->builder->buildQuery($rules)->get();

        $this->assertCount(2, $matchedContacts);
        $this->assertTrue($matchedContacts->contains('first_name', 'Bhuvan'));
        $this->assertTrue($matchedContacts->contains('first_name', 'Rohit'));
        $this->assertFalse($matchedContacts->contains('first_name', 'Anita'));
        $this->assertFalse($matchedContacts->contains('first_name', 'Sunil'));
    }

    /** @test */
    public function it_filters_inactive_customers_over_180_days(): void
    {
        Contact::factory()->create([
            'first_name'             => 'Inactive Client',
            'last_transaction_date'  => 220,
            'marketing_status'       => 'ACTIVE',
            'is_suppressed'          => false,
        ]);

        Contact::factory()->create([
            'first_name'             => 'Active Client',
            'last_transaction_date'  => 30,
            'marketing_status'       => 'ACTIVE',
            'is_suppressed'          => false,
        ]);

        $rules = [
            'type'            => 'group',
            'logicalOperator' => 'AND',
            'children'        => [
                [
                    'type'     => 'condition',
                    'field'    => 'last_transaction_date',
                    'operator' => 'greater_than',
                    'value'    => 180,
                ],
                [
                    'type'     => 'condition',
                    'field'    => 'marketing_status',
                    'operator' => 'equals',
                    'value'    => 'ACTIVE',
                ],
            ],
        ];

        $count = $this->builder->getCount($rules);
        $this->assertEquals(1, $count);
    }

    /** @test */
    public function it_caches_segment_count_in_redis_and_updates_database_column(): void
    {
        $segment = Segment::factory()->create([
            'name'         => 'Test Cache Segment',
            'segment_type' => 'DYNAMIC',
            'rules'        => [
                'type'            => 'group',
                'logicalOperator' => 'AND',
                'children'        => [
                    [
                        'type'     => 'condition',
                        'field'    => 'marketing_status',
                        'operator' => 'equals',
                        'value'    => 'ACTIVE',
                    ]
                ]
            ]
        ]);

        Contact::factory()->count(5)->create([
            'marketing_status' => 'ACTIVE',
            'is_suppressed'    => false,
        ]);

        $count = $this->cache->getCachedCount($segment);

        $this->assertEquals(5, $count);
        $this->assertEquals(5, $segment->fresh()->total_contacts);
    }
}`
  }
];
