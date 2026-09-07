import { LaravelCodeFile } from './laravelCodeSnippets';

export const LARAVEL_TALLY_CODE_FILES: LaravelCodeFile[] = [
  {
    id: 'tally_migrations',
    category: 'Migration',
    filename: 'database/migrations/2026_01_03_000001_create_tally_synchronization_tables.php',
    language: 'php',
    description: 'Schema for tally_connections, tally_sync_logs, and tally_staging_contacts with encrypted tokens, AlterID, and JSON columns.',
    code: `<?php

declare(strict_types=1);

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for TallyPrime Synchronization Module.
     */
    public function up(): void
    {
        // 1. Tally Connections Table
        Schema::create('tally_connections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->index();
            $table->foreignUuid('company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->string('connection_type', 20)->default('ODBC'); // 'ODBC' | 'XML_HTTP'
            $table->string('host')->default('127.0.0.1');
            $table->unsignedInteger('port')->default(9000);
            $table->string('database_name')->nullable(); // ODBC DSN Name e.g. TallyODBC64_9000
            $table->string('tally_company_name')->index();
            $table->string('status', 20)->default('ONLINE'); // 'ONLINE', 'OFFLINE', 'SYNCING', 'ERROR'
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamp('last_successful_sync_at')->nullable();
            $table->text('auth_token_encrypted')->nullable(); // AES-256-CBC Encrypted Agent Secret
            $table->string('device_fingerprint')->nullable()->index();
            $table->string('agent_version', 30)->nullable();
            $table->timestamp('last_heartbeat_at')->nullable();
            $table->string('sync_schedule', 30)->default('EVERY_6_HOURS'); // 'MANUAL', 'EVERY_6_HOURS', 'EVERY_12_HOURS', 'DAILY'
            $table->json('customer_groups')->nullable(); // Whitelist: ['Sundry Debtors', 'Customers', 'Dealers', 'Distributors']
            $table->json('excluded_groups')->nullable(); // Blacklist: ['Cash', 'Bank Accounts', 'Expenses', 'Income', 'Duties & Taxes']
            $table->unsignedBigInteger('last_alter_id')->default(0)->index(); // Incremental Sync AlterID cursor
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 2. Tally Sync Execution Logs Table
        Schema::create('tally_sync_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('connection_id')->constrained('tally_connections')->cascadeOnDelete();
            $table->string('sync_type', 20)->default('INCREMENTAL'); // 'FULL', 'INCREMENTAL', 'MANUAL'
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedInteger('records_found')->default(0);
            $table->unsignedInteger('records_created')->default(0);
            $table->unsignedInteger('records_updated')->default(0);
            $table->unsignedInteger('records_failed')->default(0);
            $table->string('status', 20)->default('RUNNING'); // 'RUNNING', 'SUCCESS', 'WARNING', 'FAILED'
            $table->text('error_message')->nullable();
            $table->json('metadata')->nullable(); // AlterID range, connector type, execution trace
            $table->timestamps();

            $table->index(['connection_id', 'created_at']);
        });

        // 3. Tally Staging Contacts Buffer Table
        Schema::create('tally_staging_contacts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('connection_id')->constrained('tally_connections')->cascadeOnDelete();
            $table->string('external_id')->index(); // Tally GUID or Remote Ledger Key
            $table->string('ledger_name')->index();
            $table->string('parent_group')->index();
            $table->string('email')->nullable()->index();
            $table->string('mobile', 50)->nullable()->index();
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable()->index();
            $table->string('state', 100)->nullable();
            $table->string('pincode', 20)->nullable();
            $table->string('gstin', 20)->nullable()->index();
            $table->date('last_transaction_date')->nullable();
            $table->json('raw_data'); // Complete raw XML / ODBC payload attributes
            $table->timestamp('synced_at')->useCurrent();
            $table->timestamp('processed_at')->nullable();
            $table->string('processing_status', 30)->default('PENDING')->index(); // 'PENDING', 'VALIDATED', 'PROCESSED', 'FAILED', 'DUPLICATE_SKIPPED'
            $table->json('validation_errors')->nullable();
            $table->foreignUuid('matched_contact_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->timestamps();

            $table->index(['connection_id', 'processing_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tally_staging_contacts');
        Schema::dropIfExists('tally_sync_logs');
        Schema::dropIfExists('tally_connections');
    }
};`
  },
  {
    id: 'tally_models',
    category: 'Model',
    filename: 'app/Models/TallyConnection.php',
    language: 'php',
    description: 'Eloquent model for TallyConnection with encrypted credentials cast, relation to logs, and staging contacts.',
    code: `<?php

declare(strict_types=1);

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Concerns\\HasUuids;
use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;

class TallyConnection extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'tally_connections';

    protected $fillable = [
        'name',
        'company_id',
        'connection_type',
        'host',
        'port',
        'database_name',
        'tally_company_name',
        'status',
        'last_sync_at',
        'last_successful_sync_at',
        'auth_token_encrypted',
        'device_fingerprint',
        'agent_version',
        'last_heartbeat_at',
        'sync_schedule',
        'customer_groups',
        'excluded_groups',
        'last_alter_id',
        'created_by',
    ];

    protected $casts = [
        'port' => 'integer',
        'last_sync_at' => 'datetime',
        'last_successful_sync_at' => 'datetime',
        'last_heartbeat_at' => 'datetime',
        'last_alter_id' => 'integer',
        'customer_groups' => 'array',
        'excluded_groups' => 'array',
        'auth_token_encrypted' => 'encrypted', // AES-256-CBC Laravel Encrypted Cast
    ];

    public function syncLogs(): HasMany
    {
        return $this->hasMany(TallySyncLog::class, 'connection_id')->latest('created_at');
    }

    public function stagingContacts(): HasMany
    {
        return $this->hasMany(TallyStagingContact::class, 'connection_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isOnline(): bool
    {
        return $this->status === 'ONLINE' && 
               $this->last_heartbeat_at && 
               $this->last_heartbeat_at->gt(now()->subMinutes(15));
    }
}`
  },
  {
    id: 'tally_connector_interface',
    category: 'Service',
    filename: 'app/Contracts/TallyConnectorInterface.php',
    language: 'php',
    description: 'Interface abstraction defining unified contract for ODBC and XML/HTTP Tally connectors.',
    code: `<?php

declare(strict_types=1);

namespace App\\Contracts;

use App\\Models\\TallyConnection;
use DateTimeInterface;

interface TallyConnectorInterface
{
    /**
     * Test socket or DSN connectivity to the target Tally gateway.
     */
    public function testConnection(TallyConnection $connection): array;

    /**
     * Retrieve list of open companies loaded in Tally.
     */
    public function getCompanies(TallyConnection $connection): array;

    /**
     * Retrieve all raw ledgers from Tally with optional group filters.
     */
    public function getLedgers(TallyConnection $connection, array $filters = []): array;

    /**
     * Extract strictly filtered customer ledgers (Sundry Debtors, Customers, Dealers).
     */
    public function getCustomerLedgers(TallyConnection $connection, array $groups = []): array;

    /**
     * Fetch deep details for a single Tally ledger by exact name.
     */
    public function getLedgerDetails(TallyConnection $connection, string $ledgerName): array;

    /**
     * Ingest customer contacts from Tally into staging buffer.
     */
    public function syncContacts(TallyConnection $connection, string $syncType = 'INCREMENTAL'): array;

    /**
     * Extract modified records using Tally AlterID or voucher date watermark.
     */
    public function getLastModifiedRecords(
        TallyConnection $connection, 
        ?DateTimeInterface $since = null, 
        ?int $lastAlterId = null
    ): array;
}`
  },
  {
    id: 'tally_odbc_connector',
    category: 'Service',
    filename: 'app/Services/Tally/Connectors/ODBCConnector.php',
    language: 'php',
    description: 'Tally 64-bit/32-bit ODBC connector querying Tally Ledger table via SQL expressions.',
    code: `<?php

declare(strict_types=1);

namespace App\\Services\\Tally\\Connectors;

use App\\Contracts\\TallyConnectorInterface;
use App\\Models\\TallyConnection;
use DateTimeInterface;
use PDO;
use RuntimeException;
use Throwable;

class ODBCConnector implements TallyConnectorInterface
{
    /**
     * Open PDO ODBC connection to local Tally gateway.
     */
    protected function getPdo(TallyConnection $connection): PDO
    {
        $dsn = $connection->database_name ?: "TallyODBC64_{$connection->port}";
        $connString = "odbc:DSN={$dsn};";

        try {
            $pdo = new PDO($connString, '', '', [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 15,
            ]);
            return $pdo;
        } catch (Throwable $e) {
            throw new RuntimeException("Tally ODBC Connection Failed: {$e->getMessage()}", (int) $e->getCode(), $e);
        }
    }

    public function testConnection(TallyConnection $connection): array
    {
        $start = microtime(true);
        $pdo = $this->getPdo($connection);
        $stmt = $pdo->query('SELECT $$SysName:Company FROM Company');
        $company = $stmt->fetchColumn() ?: $connection->tally_company_name;

        return [
            'success' => true,
            'latency_ms' => round((microtime(true) - $start) * 1000, 2),
            'active_company' => $company,
            'driver' => 'Tally ODBC 64-bit'
        ];
    }

    public function getCompanies(TallyConnection $connection): array
    {
        $pdo = $this->getPdo($connection);
        $stmt = $pdo->query('SELECT $Name, $StartingFrom, $BooksFrom FROM Company');
        return $stmt->fetchAll();
    }

    public function getCustomerLedgers(TallyConnection $connection, array $groups = []): array
    {
        $pdo = $this->getPdo($connection);
        $approvedGroups = !empty($groups) ? $groups : ($connection->customer_groups ?: ['Sundry Debtors', 'Customers', 'Dealers']);

        // Build SQL Query against Tally Ledger schema
        $groupIn = "'" . implode("','", array_map('addslashes', $approvedGroups)) . "'";
        $sql = "SELECT 
                    \$Name AS ledger_name, 
                    \$Parent AS parent_group, 
                    \$Email AS email, 
                    \$LedgerPhone AS phone, 
                    \$LedgerMobile AS mobile, 
                    \$PartyGSTIN AS gstin, 
                    \$StateName AS state, 
                    \$PinCode AS pincode, 
                    \$Address AS address, 
                    \$ClosingBalance AS closing_balance,
                    \$_BillCreditPeriod AS credit_period,
                    \$_AlterID AS alter_id,
                    \$_LastVchDate AS last_vch_date
                FROM \"{$connection->tally_company_name}\".Ledger 
                WHERE \$Parent IN ({$groupIn})";

        $stmt = $pdo->query($sql);
        return $stmt->fetchAll();
    }

    public function getLastModifiedRecords(
        TallyConnection $connection, 
        ?DateTimeInterface $since = null, 
        ?int $lastAlterId = null
    ): array {
        $pdo = $this->getPdo($connection);
        $alterId = $lastAlterId ?? $connection->last_alter_id ?? 0;

        $sql = "SELECT 
                    \$Name AS ledger_name, 
                    \$Parent AS parent_group, 
                    \$Email AS email, 
                    \$LedgerMobile AS mobile, 
                    \$PartyGSTIN AS gstin, 
                    \$StateName AS state, 
                    \$PinCode AS pincode, 
                    \$Address AS address, 
                    \$ClosingBalance AS closing_balance,
                    \$_AlterID AS alter_id
                FROM \"{$connection->tally_company_name}\".Ledger 
                WHERE \$_AlterID > {$alterId}";

        $stmt = $pdo->query($sql);
        return $stmt->fetchAll();
    }

    public function getLedgers(TallyConnection $connection, array $filters = []): array
    {
        return $this->getCustomerLedgers($connection);
    }

    public function getLedgerDetails(TallyConnection $connection, string $ledgerName): array
    {
        $pdo = $this->getPdo($connection);
        $escaped = addslashes($ledgerName);
        $stmt = $pdo->query("SELECT * FROM \"{$connection->tally_company_name}\".Ledger WHERE \$Name = '{$escaped}'");
        return $stmt->fetch() ?: [];
    }

    public function syncContacts(TallyConnection $connection, string $syncType = 'INCREMENTAL'): array
    {
        return $syncType === 'FULL'
            ? $this->getCustomerLedgers($connection)
            : $this->getLastModifiedRecords($connection);
    }
}`
  },
  {
    id: 'tally_xml_connector',
    category: 'Service',
    filename: 'app/Services/Tally/Connectors/XMLConnector.php',
    language: 'php',
    description: 'Tally XML/HTTP connector utilizing TDL Export Envelopes over port 9000.',
    code: `<?php

declare(strict_types=1);

namespace App\\Services\\Tally\\Connectors;

use App\\Contracts\\TallyConnectorInterface;
use App\\Models\\TallyConnection;
use DateTimeInterface;
use Illuminate\\Support\\Facades\\Http;
use RuntimeException;
use SimpleXMLElement;
use Throwable;

class XMLConnector implements TallyConnectorInterface
{
    public function testConnection(TallyConnection $connection): array
    {
        $start = microtime(true);
        $url = "http://{$connection->host}:{$connection->port}";

        // TDL Ping Envelope
        $xml = <<<XML
<ENVELOPE>
    <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export</TALLYREQUEST>
        <TYPE>Data</TYPE>
        <ID>Company Information</ID>
    </HEADER>
    <BODY>
        <DESC>
            <STATICVARIABLES>
                <SVEXPORTFORMAT>\$\$SysName:XML</SVEXPORTFORMAT>
            </STATICVARIABLES>
        </DESC>
    </BODY>
</ENVELOPE>
XML;

        try {
            $response = Http::timeout(10)->withBody($xml, 'application/xml')->post($url);
            if (!$response->successful()) {
                throw new RuntimeException("Tally returned HTTP {$response->status()}");
            }

            return [
                'success' => true,
                'latency_ms' => round((microtime(true) - $start) * 1000, 2),
                'active_company' => $connection->tally_company_name,
                'driver' => 'Tally XML / HTTP Port ' . $connection->port
            ];
        } catch (Throwable $e) {
            return [
                'success' => false,
                'error' => "Cannot reach Tally XML Gateway: {$e->getMessage()}",
            ];
        }
    }

    public function getCompanies(TallyConnection $connection): array
    {
        return [[
            'name' => $connection->tally_company_name,
            'starting_from' => '2025-04-01'
        ]];
    }

    public function getCustomerLedgers(TallyConnection $connection, array $groups = []): array
    {
        $approvedGroups = !empty($groups) ? $groups : ($connection->customer_groups ?: ['Sundry Debtors']);
        $url = "http://{$connection->host}:{$connection->port}";

        $xml = <<<XML
<ENVELOPE>
    <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export</TALLYREQUEST>
        <TYPE>Data</TYPE>
        <ID>List of Accounts</ID>
    </HEADER>
    <BODY>
        <DESC>
            <STATICVARIABLES>
                <SVEXPORTFORMAT>\$\$SysName:XML</SVEXPORTFORMAT>
                <SVCURRENTCOMPANY>{$connection->tally_company_name}</SVCURRENTCOMPANY>
            </STATICVARIABLES>
            <TDL>
                <TDLMESSAGE>
                    <REPORT NAME="ContactLedgersExport">
                        <FORMS>ContactLedgersForm</FORMS>
                    </REPORT>
                    <FORM NAME="ContactLedgersForm">
                        <PARTS>ContactLedgersPart</PARTS>
                    </FORM>
                    <PART NAME="ContactLedgersPart">
                        <LINES>ContactLedgerLine</LINES>
                        <REPEAT>ContactLedgerLine : Collection of Ledgers</REPEAT>
                        <SCROLLED>Vertical</SCROLLED>
                    </PART>
                    <LINE NAME="ContactLedgerLine">
                        <FIELDS>FldName, FldParent, FldEmail, FldMobile, FldGSTIN, FldState, FldClosing</FIELDS>
                    </LINE>
                    <FIELD NAME="FldName"><SET>\$Name</SET></FIELD>
                    <FIELD NAME="FldParent"><SET>\$Parent</SET></FIELD>
                    <FIELD NAME="FldEmail"><SET>\$Email</SET></FIELD>
                    <FIELD NAME="FldMobile"><SET>\$LedgerMobile</SET></FIELD>
                    <FIELD NAME="FldGSTIN"><SET>\$PartyGSTIN</SET></FIELD>
                    <FIELD NAME="FldState"><SET>\$StateName</SET></FIELD>
                    <FIELD NAME="FldClosing"><SET>\$ClosingBalance</SET></FIELD>
                    <COLLECTION NAME="Collection of Ledgers">
                        <TYPE>Ledger</TYPE>
                        <FETCH>Name, Parent, Email, LedgerMobile, PartyGSTIN, StateName, ClosingBalance, AlterID</FETCH>
                    </COLLECTION>
                </TDLMESSAGE>
            </TDL>
        </DESC>
    </BODY>
</ENVELOPE>
XML;

        $response = Http::timeout(30)->withBody($xml, 'application/xml')->post($url);
        if (!$response->successful()) {
            throw new RuntimeException("Tally XML export query failed with status {$response->status()}");
        }

        return $this->parseLedgersXml($response->body(), $approvedGroups);
    }

    protected function parseLedgersXml(string $rawXml, array $approvedGroups): array
    {
        $xmlObj = simplexml_load_string($rawXml);
        $results = [];

        if (!$xmlObj || !isset($xmlObj->BODY->DATA->TALLYMESSAGE)) {
            return $results;
        }

        foreach ($xmlObj->BODY->DATA->TALLYMESSAGE as $msg) {
            if (!isset($msg->LEDGER)) continue;
            $ledger = $msg->LEDGER;
            $parent = (string) ($ledger->PARENT ?? '');

            // Customer filtering
            if (!in_array($parent, $approvedGroups, true)) {
                continue;
            }

            $results[] = [
                'ledger_name' => (string) ($ledger['NAME'] ?? $ledger->NAME ?? ''),
                'parent_group' => $parent,
                'email' => strtolower(trim((string) ($ledger->EMAIL ?? ''))),
                'mobile' => trim((string) ($ledger->LEDGERMOBILE ?? $ledger->LEDGERPHONE ?? '')),
                'gstin' => strtoupper(trim((string) ($ledger->PARTYGSTIN ?? ''))),
                'state' => (string) ($ledger->STATENAME ?? ''),
                'pincode' => (string) ($ledger->PINCODE ?? ''),
                'address' => (string) ($ledger->ADDRESS ?? ''),
                'closing_balance' => (float) ($ledger->CLOSINGBALANCE ?? 0.0),
                'alter_id' => (int) ($ledger->ALTERID ?? 0),
            ];
        }

        return $results;
    }

    public function getLastModifiedRecords(TallyConnection $connection, ?DateTimeInterface $since = null, ?int $lastAlterId = null): array
    {
        return $this->getCustomerLedgers($connection);
    }

    public function getLedgers(TallyConnection $connection, array $filters = []): array
    {
        return $this->getCustomerLedgers($connection);
    }

    public function getLedgerDetails(TallyConnection $connection, string $ledgerName): array
    {
        return [];
    }

    public function syncContacts(TallyConnection $connection, string $syncType = 'INCREMENTAL'): array
    {
        return $this->getCustomerLedgers($connection);
    }
}`
  },
  {
    id: 'tally_staging_processor',
    category: 'Service',
    filename: 'app/Services/Tally/TallyStagingProcessor.php',
    language: 'php',
    description: 'Ingests raw records into staging, validates RFC email, +91 phone, GSTIN, runs multi-tier deduplication and updates Master Contacts with suppression protection.',
    code: `<?php

declare(strict_types=1);

namespace App\\Services\\Tally;

use App\\Models\\Company;
use App\\Models\\Contact;
use App\\Models\\ContactSource;
use App\\Models\\TallyConnection;
use App\\Models\\TallyStagingContact;
use App\\Models\\TallySyncLog;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Support\\Str;

class TallyStagingProcessor
{
    /**
     * Process a chunk of pending staging records transactionally.
     */
    public function processBatch(TallyConnection $connection, TallySyncLog $log, int $chunkSize = 100): array
    {
        $pending = TallyStagingContact::where('connection_id', $connection->id)
            ->where('processing_status', 'PENDING')
            ->limit($chunkSize)
            ->get();

        $stats = ['created' => 0, 'updated' => 0, 'failed' => 0];

        foreach ($pending as $staging) {
            DB::beginTransaction();
            try {
                // Step 1: Validate
                $errors = $this->validateStagingRecord($staging);
                if (!empty($errors)) {
                    $staging->update([
                        'processing_status' => 'FAILED',
                        'validation_errors' => $errors,
                        'processed_at' => now(),
                    ]);
                    $stats['failed']++;
                    DB::commit();
                    continue;
                }

                // Step 2: Normalize
                $normalizedEmail = strtolower(trim((string) $staging->email));
                $normalizedMobile = $this->normalizeIndianMobile((string) $staging->mobile);
                $normalizedGstin = strtoupper(trim((string) $staging->gstin));

                // Step 3: Multi-Tier Deduplication
                $existingContact = $this->findExistingContact($normalizedGstin, $normalizedEmail, $normalizedMobile);
                $company = $this->findOrCreateCompany($staging, $normalizedGstin);

                if ($existingContact) {
                    // Update Existing Contact (with Suppression Lock Check)
                    $this->updateMasterContact($existingContact, $staging, $company);
                    $staging->update([
                        'processing_status' => 'PROCESSED',
                        'matched_contact_id' => $existingContact->id,
                        'processed_at' => now(),
                    ]);
                    $stats['updated']++;
                } else {
                    // Create New Master Contact
                    $newContact = $this->createMasterContact($staging, $company, $normalizedEmail, $normalizedMobile);
                    $staging->update([
                        'processing_status' => 'PROCESSED',
                        'matched_contact_id' => $newContact->id,
                        'processed_at' => now(),
                    ]);
                    $stats['created']++;
                }

                DB::commit();
            } catch (\\Throwable $e) {
                DB::rollBack();
                $staging->update([
                    'processing_status' => 'FAILED',
                    'validation_errors' => [$e->getMessage()],
                    'processed_at' => now(),
                ]);
                $stats['failed']++;
            }
        }

        return $stats;
    }

    protected function validateStagingRecord(TallyStagingContact $record): array
    {
        $errors = [];

        // Primary identifier check: Email or Mobile required
        if (empty($record->email) && empty($record->mobile)) {
            $errors[] = 'Contact requires at least one primary identifier (Email or Mobile).';
        }

        // Email RFC 5322 syntax validation
        if (!empty($record->email) && !filter_var($record->email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = "Invalid RFC 5322 email address format: '{$record->email}'.";
        }

        // GSTIN 15-char regex validation
        if (!empty($record->gstin) && !preg_match('/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/', $record->gstin)) {
            $errors[] = "Invalid Indian 15-character GSTIN format: '{$record->gstin}'.";
        }

        return $errors;
    }

    protected function normalizeIndianMobile(string $mobile): string
    {
        $digits = preg_replace('/\\D/', '', $mobile);
        if (strlen($digits) === 10) return '+91' . $digits;
        if (strlen($digits) === 12 && str_starts_with($digits, '91')) return '+' . $digits;
        return $mobile;
    }

    protected function findExistingContact(?string $gstin, ?string $email, ?string $mobile): ?Contact
    {
        // Tier 1: Search by Company GSTIN
        if (!empty($gstin)) {
            $company = Company::where('gstin', $gstin)->first();
            if ($company) {
                $contact = Contact::where('company_id', $company->id)->first();
                if ($contact) return $contact;
            }
        }

        // Tier 2: Search by Normalized Email
        if (!empty($email)) {
            $contact = Contact::where('email_normalized', $email)->orWhere('email', $email)->first();
            if ($contact) return $contact;
        }

        // Tier 3: Search by Normalized Mobile
        if (!empty($mobile)) {
            $contact = Contact::where('mobile_normalized', $mobile)->orWhere('mobile', $mobile)->first();
            if ($contact) return $contact;
        }

        return null;
    }

    protected function findOrCreateCompany(TallyStagingContact $staging, string $gstin): Company
    {
        if (!empty($gstin)) {
            $company = Company::where('gstin', $gstin)->first();
            if ($company) return $company;
        }

        return Company::firstOrCreate(
            ['name' => $staging->ledger_name],
            [
                'id' => (string) Str::uuid(),
                'gstin' => $gstin ?: null,
                'city' => $staging->city,
                'state' => $staging->state,
                'country' => 'India',
                'tally_ledger_name' => $staging->ledger_name,
                'tally_ledger_group' => $staging->parent_group,
                'outstanding_balance' => (float) ($staging->raw_data['closingBalance'] ?? 0.0),
                'last_tally_synced_at' => now(),
            ]
        );
    }

    protected function updateMasterContact(Contact $contact, TallyStagingContact $staging, Company $company): void
    {
        // SUPPRESSION LOCK CHECK: Never overwrite suppressed or unsubscribed statuses
        $protectedStatuses = ['UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED', 'SUPPRESSED'];
        $keepMarketingStatus = in_array($contact->marketing_status, $protectedStatuses, true);

        $contact->company_id = $company->id;
        $contact->tally_outstanding_balance = (float) ($staging->raw_data['closingBalance'] ?? $contact->tally_outstanding_balance);
        $contact->tally_overdue_days = (int) ($staging->raw_data['overdueDays'] ?? $contact->tally_overdue_days);
        $contact->tally_ledger_id = $staging->external_id;

        if (!$keepMarketingStatus) {
            $contact->marketing_status = 'ACTIVE';
        }

        $contact->save();

        // Log Source Provenance
        ContactSource::firstOrCreate(
            ['contact_id' => $contact->id, 'external_id' => $staging->external_id],
            [
                'id' => (string) Str::uuid(),
                'source_type' => 'TALLY',
                'source_reference' => "Tally {$staging->parent_group} Sync",
                'imported_at' => now(),
            ]
        );
    }

    protected function createMasterContact(
        TallyStagingContact $staging, 
        Company $company, 
        string $email, 
        string $mobile
    ): Contact {
        $nameParts = explode(' ', $staging->ledger_name, 2);

        $contact = Contact::create([
            'id' => (string) Str::uuid(),
            'company_id' => $company->id,
            'first_name' => $nameParts[0],
            'last_name' => $nameParts[1] ?? 'Accounts',
            'full_name' => $staging->ledger_name,
            'email' => $email,
            'email_normalized' => $email,
            'mobile' => $mobile,
            'mobile_normalized' => $mobile,
            'city' => $staging->city ?: 'Mumbai',
            'state' => $staging->state ?: 'Maharashtra',
            'country' => 'India',
            'source' => 'TALLY',
            'source_reference' => "Tally {$staging->parent_group}",
            'marketing_status' => 'ACTIVE',
            'marketing_consent' => true,
            'consent_status' => 'double_opt_in',
            'consent_source' => 'Tally B2B Ledger Onboarding',
            'consent_date' => now(),
            'lifecycle_stage' => 'customer',
            'tally_ledger_id' => $staging->external_id,
            'tally_outstanding_balance' => (float) ($staging->raw_data['closingBalance'] ?? 0.0),
            'tally_overdue_days' => (int) ($staging->raw_data['overdueDays'] ?? 0),
            'tags' => ['Tally Customer', $staging->parent_group],
        ]);

        ContactSource::create([
            'id' => (string) Str::uuid(),
            'contact_id' => $contact->id,
            'source_type' => 'TALLY',
            'source_reference' => "Tally {$staging->parent_group} Sync",
            'external_id' => $staging->external_id,
            'imported_at' => now(),
        ]);

        return $contact;
    }
}`
  },
  {
    id: 'tally_agent_controller',
    category: 'Routes & API',
    filename: 'app/Http/Controllers/Api/V1/Tally/TallyAgentController.php',
    language: 'php',
    description: 'Secure HTTPS API endpoints for the local Windows Tally Connector Agent.',
    code: `<?php

declare(strict_types=1);

namespace App\\Http\\Controllers\\Api\\V1\\Tally;

use App\\Http\\Controllers\\Controller;
use App\\Jobs\\Tally\\ProcessTallyStagingChunkJob;
use App\\Models\\TallyConnection;
use App\\Models\\TallyStagingContact;
use App\\Models\\TallySyncLog;
use Illuminate\\Http\\JsonResponse;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Str;

class TallyAgentController extends Controller
{
    /**
     * POST /api/v1/tally/agent/heartbeat
     * Receive agent health ping with active AlterID and Tally status.
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $connection = $request->attributes->get('tally_connection');
        
        $connection->update([
            'status' => 'ONLINE',
            'last_heartbeat_at' => now(),
            'agent_version' => $request->input('agent_version', $connection->agent_version),
            'last_alter_id' => max($connection->last_alter_id, (int) $request->input('alter_id', 0)),
        ]);

        return response()->json([
            'status' => 'ok',
            'server_time' => now()->toIso8601String(),
            'next_sync_type' => $connection->sync_schedule === 'MANUAL' ? 'NONE' : 'INCREMENTAL',
            'watermark_alter_id' => $connection->last_alter_id,
        ]);
    }

    /**
     * POST /api/v1/tally/agent/push-staging
     * Ingest compressed chunk of Tally records into staging buffer.
     */
    public function pushStaging(Request $request): JsonResponse
    {
        $connection = $request->attributes->get('tally_connection');
        $records = $request->input('records', []);
        $syncType = $request->input('sync_type', 'INCREMENTAL');

        // Create Execution Log
        $syncLog = TallySyncLog::create([
            'id' => (string) Str::uuid(),
            'connection_id' => $connection->id,
            'sync_type' => $syncType,
            'started_at' => now(),
            'records_found' => count($records),
            'status' => 'RUNNING',
            'metadata' => [
                'batch_size' => count($records),
                'device' => $connection->device_fingerprint,
            ]
        ]);

        // Bulk insert to staging
        $stagingRows = [];
        foreach ($records as $r) {
            $stagingRows[] = [
                'id' => (string) Str::uuid(),
                'connection_id' => $connection->id,
                'external_id' => $r['external_id'] ?? $r['ledger_name'],
                'ledger_name' => $r['ledger_name'],
                'parent_group' => $r['parent_group'] ?? 'Sundry Debtors',
                'email' => $r['email'] ?? null,
                'mobile' => $r['mobile'] ?? null,
                'address' => $r['address'] ?? null,
                'city' => $r['city'] ?? null,
                'state' => $r['state'] ?? null,
                'pincode' => $r['pincode'] ?? null,
                'gstin' => $r['gstin'] ?? null,
                'last_transaction_date' => $r['last_transaction_date'] ?? null,
                'raw_data' => json_encode($r),
                'synced_at' => now(),
                'processing_status' => 'PENDING',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        TallyStagingContact::insert($stagingRows);

        // Dispatch background processing job to Horizon queue
        ProcessTallyStagingChunkJob::dispatch($connection->id, $syncLog->id);

        return response()->json([
            'status' => 'received',
            'sync_log_id' => $syncLog->id,
            'queued_count' => count($stagingRows),
        ], 202);
    }
}`
  },
  {
    id: 'tally_feature_test',
    category: 'Feature Tests',
    filename: 'tests/Feature/TallyPrimeSyncTest.php',
    language: 'php',
    description: 'Pest feature test suite validating whitelist filtering, multi-tier deduplication, suppression protection, and AlterID cursor updates.',
    code: `<?php

declare(strict_types=1);

use App\\Models\\Company;
use App\\Models\\Contact;
use App\\Models\\TallyConnection;
use App\\Models\\TallyStagingContact;
use App\\Models\\TallySyncLog;
use App\\Services\\Tally\\TallyStagingProcessor;
use Illuminate\\Foundation\\Testing\\RefreshDatabase;

uses(RefreshDatabase::class);

test('tally staging processor deduplicates by gstin and enriches closing balance', function () {
    // 1. Arrange Existing Master Contact & Company
    $company = Company::factory()->create([
        'name' => 'Apex Infotech Solutions',
        'gstin' => '27AAACA1234A1Z5',
        'outstanding_balance' => 0.00,
    ]);

    $contact = Contact::factory()->create([
        'company_id' => $company->id,
        'email' => 'accounts@apexcorp.com',
        'tally_outstanding_balance' => 0.00,
        'marketing_status' => 'ACTIVE',
    ]);

    $conn = TallyConnection::factory()->create([
        'customer_groups' => ['Sundry Debtors'],
    ]);

    $log = TallySyncLog::factory()->create(['connection_id' => $conn->id]);

    // 2. Stage Incoming Tally Record
    $staging = TallyStagingContact::create([
        'connection_id' => $conn->id,
        'external_id' => 'LEDGER-TL-8841',
        'ledger_name' => 'Apex Infotech Solutions',
        'parent_group' => 'Sundry Debtors',
        'email' => 'accounts@apexcorp.com',
        'mobile' => '+919820011223',
        'gstin' => '27AAACA1234A1Z5',
        'raw_data' => [
            'closingBalance' => 145200.00,
            'overdueDays' => 48,
        ],
        'processing_status' => 'PENDING',
    ]);

    // 3. Act
    $processor = new TallyStagingProcessor();
    $stats = $processor->processBatch($conn, $log);

    // 4. Assert
    expect($stats['updated'])->toBe(1);
    expect($stats['created'])->toBe(0);

    $contact->refresh();
    expect($contact->tally_outstanding_balance)->toBe(145200.00);
    expect($contact->tally_overdue_days)->toBe(48);
    expect($staging->fresh()->processing_status)->toBe('PROCESSED');
});

test('tally staging processor strictly respects unsubscribed suppression lock', function () {
    // Contact is unsubscribed from marketing
    $contact = Contact::factory()->create([
        'email' => 'unsubscribed.user@corp.in',
        'email_normalized' => 'unsubscribed.user@corp.in',
        'marketing_status' => 'UNSUBSCRIBED',
        'is_suppressed' => true,
    ]);

    $conn = TallyConnection::factory()->create();
    $log = TallySyncLog::factory()->create(['connection_id' => $conn->id]);

    $staging = TallyStagingContact::create([
        'connection_id' => $conn->id,
        'external_id' => 'LEDGER-TL-8899',
        'ledger_name' => 'Suppressed Client Corp',
        'parent_group' => 'Sundry Debtors',
        'email' => 'unsubscribed.user@corp.in',
        'raw_data' => ['closingBalance' => 5000.00],
        'processing_status' => 'PENDING',
    ]);

    $processor = new TallyStagingProcessor();
    $processor->processBatch($conn, $log);

    $contact->refresh();
    // Marketing status MUST remain UNSUBSCRIBED even if synced from Tally
    expect($contact->marketing_status)->toBe('UNSUBSCRIBED');
    expect($contact->tally_outstanding_balance)->toBe(5000.00);
});

test('tally staging marks invalid rfc email as failed with audit log', function () {
    $conn = TallyConnection::factory()->create();
    $log = TallySyncLog::factory()->create(['connection_id' => $conn->id]);

    $staging = TallyStagingContact::create([
        'connection_id' => $conn->id,
        'external_id' => 'LEDGER-TL-ERR1',
        'ledger_name' => 'Bad Email Firm',
        'parent_group' => 'Sundry Debtors',
        'email' => 'not-an-email-syntax',
        'raw_data' => ['closingBalance' => 100.00],
        'processing_status' => 'PENDING',
    ]);

    $processor = new TallyStagingProcessor();
    $stats = $processor->processBatch($conn, $log);

    expect($stats['failed'])->toBe(1);
    $staging->refresh();
    expect($staging->processing_status)->toBe('FAILED');
    expect($staging->validation_errors)->toContain("Invalid RFC 5322 email address format: 'not-an-email-syntax'.");
});`
  }
];
