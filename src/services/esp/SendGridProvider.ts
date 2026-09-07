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

export class SendGridProvider extends BaseEmailProvider {
  private totalSentCounter = 2105400;

  constructor(config: EmailProviderConfigRecord) {
    super(config);
  }

  /**
   * Send single transactional/marketing email via Twilio SendGrid v3 /mail/send
   */
  async send(message: EmailMessage): Promise<SendResult> {
    const startTime = performance.now();

    // 1. Email syntax check
    if (!this.isValidEmailSyntax(message.to)) {
      return {
        success: false,
        messageId: '',
        provider: 'sendgrid',
        statusCode: 400,
        errorCode: 'BAD_REQUEST',
        error: `SendGrid: The provided recipient email "${message.to}" is not a valid RFC-compliant address.`,
        isRetryable: false,
        latencyMs: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString()
      };
    }

    // 2. Global suppression & unsubscribe check
    if (message.to.includes('unsubscribed') || message.to.includes('bounce')) {
      return {
        success: false,
        messageId: '',
        provider: 'sendgrid',
        statusCode: 400,
        errorCode: 'SUPPRESSED_RECIPIENT',
        error: `SendGrid: Recipient ${message.to} is on the SendGrid Global Unsubscribe / Bounce suppression list.`,
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
        provider: 'sendgrid',
        statusCode: 429,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        error: 'SendGrid: API rate limit exceeded (HTTP 429). Retry after 3 seconds.',
        isRetryable: true,
        retryAfterMs: 3000,
        latencyMs: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString()
      };
    }

    // Simulate network latency (20ms - 40ms)
    await new Promise(r => setTimeout(r, 20 + Math.random() * 20));

    const messageId = this.generateMessageId('sendgrid');
    this.totalSentCounter++;

    return {
      success: true,
      messageId,
      provider: 'sendgrid',
      statusCode: 202, // SendGrid returns 202 Accepted
      isRetryable: false,
      latencyMs: Math.round(performance.now() - startTime),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Send batch via SendGrid multiple personalizations
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
      provider: 'sendgrid',
      durationMs: Math.round(performance.now() - startTime)
    };
  }

  /**
   * Validate API Key via /v3/scopes or /v3/user/profile
   */
  async validateConfiguration(): Promise<ValidationResult> {
    const startTime = performance.now();
    await new Promise(r => setTimeout(r, 130));

    const decryptedKey = CryptoService.decrypt(this.config.api_key_encrypted);
    const isValidKey = decryptedKey.startsWith('SG.') || decryptedKey.length >= 12;
    const latency = Math.round(performance.now() - startTime);

    if (!isValidKey) {
      return {
        valid: false,
        connectionSuccess: false,
        senderVerified: false,
        domainVerified: false,
        errorMessage: 'SendGrid API key authentication failed. Must start with "SG." and have mail.send scope.',
        details: {
          spf: false,
          dkim: false,
          dmarc: false,
          latencyMs: latency,
          rawResponseSnippet: '{"errors":[{"message":"The provided authorization grant is invalid, expired, or revoked","field":null,"help":null}]}'
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
        rawResponseSnippet: '{"scopes":["mail.send","alerts.read","user.profile.read"],"reputation":94.0}'
      }
    };
  }

  /**
   * Get sending limits for SendGrid
   */
  async getSendingLimits(): Promise<SendingLimits> {
    const providerMax = this.config.settings.provider_max_rate || 100;
    const safetyMargin = this.config.settings.safety_margin_percentage || 20;
    const configuredRate = Math.round(providerMax * (1 - safetyMargin / 100));

    return {
      providerMaxRatePerSec: providerMax,
      configuredRatePerSec: configuredRate,
      dailyQuota: this.config.settings.daily_quota || 100000,
      sentToday: this.config.settings.daily_sent || 2100,
      remainingToday: (this.config.settings.daily_quota || 100000) - (this.config.settings.daily_sent || 2100),
      safetyMarginPercent: safetyMargin,
      burstAllowance: Math.round(providerMax * 1.5)
    };
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<ProviderStatistics> {
    return {
      reputationScore: 94,
      avgLatencyMs: 32,
      deliveryRate: 99.1,
      bounceRate: 0.44,
      complaintRate: 0.02,
      totalSentAllTime: this.totalSentCounter,
      activeWorkersCount: 4
    };
  }
}
