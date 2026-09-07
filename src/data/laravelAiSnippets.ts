import { LaravelCodeFile } from './laravelCodeSnippets';

export const LARAVEL_AI_CODE_FILES: LaravelCodeFile[] = [
  {
    id: 'ai-generation-model',
    category: 'Model',
    filename: 'app/Models/AiGeneration.php',
    language: 'php',
    description: 'Eloquent model for AI Generations to store prompt, response JSON, tokens used, and model info.',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;

class AiGeneration extends Model
{
    protected $fillable = [
        'user_id',
        'campaign_id',
        'prompt',
        'response',
        'model',
        'tokens_used',
        'status',
    ];

    protected $casts = [
        'prompt' => 'array',
        'response' => 'array',
        'tokens_used' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }
}
`
  },
  {
    id: 'ai-provider-interface',
    category: 'Service',
    filename: 'app/Contracts/AiProviderInterface.php',
    language: 'php',
    description: 'Abstraction contract for interchangeable AI providers (Gemini, OpenAI, Anthropic).',
    code: `<?php

namespace App\\Contracts;

interface AiProviderInterface
{
    /**
     * Generate structured content based on a prompt payload.
     *
     * @param array $promptData
     * @param string $systemInstruction
     * @param array $jsonSchema
     * @return array The structured JSON response decoded to an array.
     */
    public function generateStructuredContent(array $promptData, string $systemInstruction, array $jsonSchema): array;
}
`
  },
  {
    id: 'gemini-ai-provider',
    category: 'Service',
    filename: 'app/Services/AI/GeminiAiProvider.php',
    language: 'php',
    description: 'Implementation of the AI provider using the Google Gemini API.',
    code: `<?php

namespace App\\Services\\AI;

use App\\Contracts\\AiProviderInterface;
use Illuminate\\Support\\Facades\\Http;
use Illuminate\\Support\\Facades\\Log;
use Exception;

class GeminiAiProvider implements AiProviderInterface
{
    protected string $apiKey;
    protected string $model;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.key');
        $this->model = config('services.gemini.model', 'gemini-3.8-flash');
    }

    public function generateStructuredContent(array $promptData, string $systemInstruction, array $jsonSchema): array
    {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}";

        $payload = [
            'system_instruction' => [
                'parts' => [['text' => $systemInstruction]]
            ],
            'contents' => [
                ['role' => 'user', 'parts' => [['text' => json_encode($promptData)]]]
            ],
            'generationConfig' => [
                'response_mime_type' => 'application/json',
                'response_schema' => $jsonSchema
            ]
        ];

        $response = Http::timeout(30)->post($url, $payload);

        if ($response->failed()) {
            Log::error('Gemini API Error', ['response' => $response->body()]);
            throw new Exception('AI Provider failed to generate content: ' . $response->status());
        }

        $data = $response->json();
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
        
        return json_decode($text, true) ?? [];
    }
}
`
  },
  {
    id: 'ai-prompt-service',
    category: 'Service',
    filename: 'app/Services/AI/AiPromptBuilder.php',
    language: 'php',
    description: 'Service to construct prompts and enforce safety, brand voice, and JSON schema.',
    code: `<?php

namespace App\\Services\\AI;

use Illuminate\\Support\\Facades\\Validator;
use Exception;

class AiPromptBuilder
{
    public function buildSystemPrompt(string $brandVoice = 'Professional'): string
    {
        return <<<PROMPT
You are a World-Class Senior Email Copywriter and Email Deliverability Specialist.
Your objective is to generate high-converting, compliant, structured email marketing content.
You MUST output ONLY a valid JSON object according to the schema requested.
DO NOT generate raw HTML markup. 
Brand Voice: {$brandVoice}.
Avoid spam trigger words. Do not make false claims, generate misleading offers, or promise unrealistic results.
Include personalization merge tags where appropriate like {{contact.first_name}}.
PROMPT;
    }

    public function getResponseSchema(): array
    {
        return [
            'type' => 'OBJECT',
            'properties' => [
                'subject_options' => [
                    'type' => 'ARRAY',
                    'items' => ['type' => 'STRING'],
                    'description' => '3 high-open rate subject line options under 60 characters.'
                ],
                'preheader' => ['type' => 'STRING'],
                'headline' => ['type' => 'STRING'],
                'subheadline' => ['type' => 'STRING'],
                'introduction' => ['type' => 'STRING'],
                'benefits' => [
                    'type' => 'ARRAY',
                    'items' => ['type' => 'STRING']
                ],
                'cta_text' => ['type' => 'STRING'],
                'closing_message' => ['type' => 'STRING'],
            ],
            'required' => ['subject_options', 'preheader', 'headline', 'subheadline', 'introduction', 'benefits', 'cta_text', 'closing_message']
        ];
    }
}
`
  },
  {
    id: 'ai-generation-controller',
    category: 'Controller',
    filename: 'app/Http/Controllers/Api/V1/AiCampaignController.php',
    language: 'php',
    description: 'API endpoint for the React frontend to generate content, store to DB, and validate.',
    code: `<?php

namespace App\\Http\\Controllers\\Api\\V1;

use App\\Http\\Controllers\\Controller;
use Illuminate\\Http\\Request;
use App\\Contracts\\AiProviderInterface;
use App\\Services\\AI\\AiPromptBuilder;
use App\\Models\\AiGeneration;
use Illuminate\\Support\\Facades\\Validator;
use Exception;

class AiCampaignController extends Controller
{
    public function __construct(
        protected AiProviderInterface $aiProvider,
        protected AiPromptBuilder $promptBuilder
    ) {}

    public function generate(Request $request)
    {
        $validated = $request->validate([
            'campaignObjective' => 'required|string|max:255',
            'targetAudience' => 'nullable|string|max:255',
            'productService' => 'nullable|string|max:255',
            'offer' => 'nullable|string|max:255',
            'keyBenefits' => 'nullable|string',
            'callToAction' => 'nullable|string|max:100',
            'tone' => 'required|string|max:50',
            'additionalInstructions' => 'nullable|string'
        ]);

        try {
            $systemInstruction = $this->promptBuilder->buildSystemPrompt($validated['tone']);
            $schema = $this->promptBuilder->getResponseSchema();

            // API Call
            $result = $this->aiProvider->generateStructuredContent($validated, $systemInstruction, $schema);

            // Output JSON validation
            $this->validateAiOutput($result);

            // Store Generation Logging
            AiGeneration::create([
                'user_id' => $request->user()->id ?? null,
                'prompt' => $validated,
                'response' => $result,
                'model' => config('services.gemini.model'),
                'status' => 'success'
            ]);

            return response()->json([
                'success' => true,
                'content' => $result
            ]);

        } catch (Exception $e) {
            AiGeneration::create([
                'user_id' => $request->user()->id ?? null,
                'prompt' => $validated,
                'response' => [],
                'status' => 'failed',
                'model' => config('services.gemini.model')
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    protected function validateAiOutput(array $data)
    {
        $validator = Validator::make($data, [
            'subject_options' => 'required|array|min:1',
            'preheader' => 'required|string',
            'headline' => 'required|string',
            'benefits' => 'required|array',
            'cta_text' => 'required|string',
        ]);

        if ($validator->fails()) {
            throw new Exception("AI Provider returned invalid JSON structure.");
        }
    }
}
`
  }
];
