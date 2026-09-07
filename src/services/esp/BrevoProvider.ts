import { 
  EmailMessage, 
  SendResult, 
  BatchSendResult, 
  SendingLimits, 
  ProviderStatistics, 
  ValidationResult,
  EmailProviderConfigRecord
} from '../../types';
import { BaseEmailProvider } from './EmailProviderInterface';
import { CryptoService } from '../../utils/cryptoSim';

export class BrevoProvider extends BaseEmailProvider {
  private totalSentCounter = 890450;

  constructor(config: EmailProviderConfigRecord) {
    super(config);
  }

  /**
   * Send single transactional email via Brevo REST API v3 (/smtp/email)
   */
  async send(message: EmailMessage): Promise<SendResult> {
    const startTime = performance.now();

    // 1. Email syntax check
    if (!this.isValidEmailSyntax(message.to)) {
      return {
        success: false,
        messageId: '',
        provider: 'brevo',
        statusCode: 400,
        errorCode: 'invalid_parameter',
        error: `Brevo API: Invalid email address format "${message.to}".`,
        isRetryable: false,
        latencyMs: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString()
      };
    }

    // 2. Blacklisted / hard bounce check
    if (message.to.includes('blocked') || message.to.includes('bounce')) {
      return {
        success: false,
        messageId: '',
        provider: 'brevo',
        statusCode: 400,
        errorCode: 'unauthorized_recipient',
        error: `Brevo API: Email ${message.to} is blacklisted or has previously hard-bounced.`,
        isRetryable: false,
        latencyMs: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString()
      };
    }

    // 3. Simulated rate limiting (429)
    if (message.metadata?.forceThrottle) {
      return {
        success: false,
        messageId: '',
        provider: 'brevo',
        statusCode: 429,
        errorCode: 'rate_limit_exceeded',
        error: 'Brevo API: Request rate limit reached (HTTP 429). Please back off.',
        isRetryable: true,
        retryAfterMs: 2000,
        latencyMs: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString()
      };
    }

    // Simulate Brevo cloud API latency
    await new Promise(r => setTimeout(r, 25 + Math.random() * 30));

    const messageId = this.generateMessageId('brevo');
    this.totalSentCounter++;

    return {
      success: true,
      messageId,
      provider: 'brevo',
      statusCode: 201,
      isRetryable: false,
      latencyMs: Math.round(performance.now() - startTime),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Send bulk batch via Brevo Batch API
   */
  async sendBatch(messages: EmailMessage[]): Promise<BatchSendResult> {
    const startTime = performance.now();
    const results: SendResult[] = [];
    let sent = 0;
    let failed = 0;

    for (const msg of messages) {
      const res = await this.send(msg);
      results.push(res);
      if (res.success) sent++;
      else failed++;
    }

    return {
      success: failed === 0,
      total: messages.length,
      sent,
      failed,
      results,
      provider: 'brevo',
      durationMs: Math.round(performance.now() - startTime)
    };
  }

  /**
   * Validate Brevo API Key via /account endpoint
   */
  async validateConfiguration(): Promise<ValidationResult> {
    const startTime = performance.now();
    await new Promise(r => setTimeout(r, 140));

    const decryptedKey = CryptoService.decrypt(this.config.api_key_encrypted);
    const isValidKey = decryptedKey.startsWith('xkeysib-') || decryptedKey.length >= 10;
    const latency = Math.round(performance.now() - startTime);

    if (!isValidKey) {
      return {
        valid: false,
        connectionSuccess: false,
        senderVerified: false,
        domainVerified: false,
        errorMessage: 'Brevo API Key validation failed. Key format is invalid or unauthenticated.',
        details: {
          spf: false,
          dkim: false,
          dmarc: false,
          latencyMs: latency,
          rawResponseSnippet: '{"code": "unauthorized", "message": "Key not found or deactivated"}'
        }
      };
    }

    return {
      valid: true,
      connectionSuccess: true,
      senderVerified: true,
      domainVerified: true,
      details: {
        spf: true,
        dkim: true,
        dmarc: true,
        latencyMs: latency,
        rawResponseSnippet: `{"email": "${this.config.from_email}", "plan": [{"type": "enterprise", "credits": 500000}], "relay": {"enabled": true, "port": 587}}`
      }
    };
  }

  /**
   * Get sending limits for Brevo
   */
  async getSendingLimits(): Promise<SendingLimits> {
    const providerMax = this.config.settings.provider_max_rate || 80;
    const safetyMargin = this.config.settings.safety_margin_percentage || 20;
    const configuredRate = Math.round(providerMax * (1 - safetyMargin / 100));

    return {
      providerMaxRatePerSec: providerMax,
      configuredRatePerSec: configuredRate,
      dailyQuota: this.config.settings.daily_quota || 40000,
      sentToday: this.config.settings.daily_sent || 850,
      remainingToday: (this.config.settings.daily_quota || 40000) - (this.config.settings.daily_sent || 850),
      safetyMarginPercent: safetyMargin,
      burstAllowance: Math.round(providerMax * 1.25)
    };
  }

  /**
   * Get telemetry stats for Brevo
   */
  async getStatistics(): Promise<ProviderStatistics> {
    return {
      reputationScore: 96,
      avgLatencyMs: 44,
      deliveryRate: 98.9,
      bounceRate: 0.52,
      complaintRate: 0.02,
      totalSentAllTime: this.totalSentCounter,
      activeWorkersCount: 3
    };
  }
}
