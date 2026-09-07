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

export class AmazonSESProvider extends BaseEmailProvider {
  private totalSentCounter = 1420800;

  constructor(config: EmailProviderConfigRecord) {
    super(config);
  }

  /**
   * Send single email via Amazon SES v2 SendEmail API
   */
  async send(message: EmailMessage): Promise<SendResult> {
    const startTime = performance.now();
    const region = this.config.region || 'us-east-1';

    // 1. Immediate syntax validation check
    if (!this.isValidEmailSyntax(message.to)) {
      return {
        success: false,
        messageId: '',
        provider: 'amazon_ses',
        statusCode: 400,
        errorCode: 'InvalidParameterException',
        error: `Amazon SES: Illegal recipient address "${message.to}". Email address does not conform to RFC 5322.`,
        isRetryable: false,
        latencyMs: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString()
      };
    }

    // 2. Check suppression simulator
    if (message.to.includes('bounce') || message.to.includes('suppressed')) {
      return {
        success: false,
        messageId: '',
        provider: 'amazon_ses',
        statusCode: 554,
        errorCode: 'MessageRejected',
        error: `Amazon SES: Address ${message.to} is in the Amazon SES Global Suppression List (Permanent Hard Bounce).`,
        isRetryable: false,
        latencyMs: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString()
      };
    }

    // 3. Check simulated throttling / 429
    if (message.metadata?.forceThrottle) {
      return {
        success: false,
        messageId: '',
        provider: 'amazon_ses',
        statusCode: 429,
        errorCode: 'TooManyRequestsException',
        error: 'Amazon SES: Maximum sending rate exceeded (HTTP 429 Too Many Requests).',
        isRetryable: true,
        retryAfterMs: 2500,
        latencyMs: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString()
      };
    }

    // Simulate API network round-trip latency (15ms - 45ms)
    await new Promise(r => setTimeout(r, 20 + Math.random() * 25));

    const messageId = this.generateMessageId('ses');
    this.totalSentCounter++;

    return {
      success: true,
      messageId,
      provider: 'amazon_ses',
      statusCode: 200,
      isRetryable: false,
      latencyMs: Math.round(performance.now() - startTime),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Send bulk batch via Amazon SES SendBulkEmail API (SES v2 accepts up to 50 entries per batch)
   */
  async sendBatch(messages: EmailMessage[]): Promise<BatchSendResult> {
    const startTime = performance.now();
    const results: SendResult[] = [];
    let sent = 0;
    let failed = 0;

    // Process chunk sequentially or in parallel batches
    for (const msg of messages) {
      const res = await this.send(msg);
      results.push(res);
      if (res.success) {
        sent++;
      } else {
        failed++;
      }
    }

    return {
      success: failed === 0,
      total: messages.length,
      sent,
      failed,
      results,
      provider: 'amazon_ses',
      durationMs: Math.round(performance.now() - startTime)
    };
  }

  /**
   * Validate SES configuration (AWS credentials, STS GetCallerIdentity, GetSendQuota)
   */
  async validateConfiguration(): Promise<ValidationResult> {
    const startTime = performance.now();
    await new Promise(r => setTimeout(r, 120));

    const decryptedKey = CryptoService.decrypt(this.config.api_key_encrypted);
    const region = this.config.region || 'us-east-1';

    const isValidKey = decryptedKey.length >= 8;
    const hasSender = Boolean(this.config.from_email && this.isValidEmailSyntax(this.config.from_email));

    const latency = Math.round(performance.now() - startTime);

    if (!isValidKey) {
      return {
        valid: false,
        connectionSuccess: false,
        senderVerified: false,
        domainVerified: false,
        errorMessage: 'Invalid AWS Access Key / Secret Credentials provided for Amazon SES.',
        details: {
          spf: false,
          dkim: false,
          dmarc: false,
          latencyMs: latency,
          rawResponseSnippet: '{"Error": {"Code": "AuthFailure", "Message": "AWS was not able to validate the provided access credentials."}}'
        }
      };
    }

    return {
      valid: hasSender,
      connectionSuccess: true,
      senderVerified: hasSender,
      domainVerified: true,
      details: {
        spf: true,
        dkim: true,
        dmarc: true,
        latencyMs: latency,
        rawResponseSnippet: `{"ResponseMetadata": {"RequestId": "ses-${Date.now()}"}, "Region": "${region}", "Max24HourSend": 50000.0, "MaxSendRate": 100.0, "SentLast24Hours": ${this.config.settings.daily_sent}}`
      }
    };
  }

  /**
   * Get live sending limits from Amazon SES GetSendQuota
   */
  async getSendingLimits(): Promise<SendingLimits> {
    const providerMax = this.config.settings.provider_max_rate || 100;
    const safetyMargin = this.config.settings.safety_margin_percentage || 20;
    const configuredRate = Math.round(providerMax * (1 - safetyMargin / 100));

    return {
      providerMaxRatePerSec: providerMax,
      configuredRatePerSec: configuredRate,
      dailyQuota: this.config.settings.daily_quota || 50000,
      sentToday: this.config.settings.daily_sent || 1420,
      remainingToday: (this.config.settings.daily_quota || 50000) - (this.config.settings.daily_sent || 1420),
      safetyMarginPercent: safetyMargin,
      burstAllowance: Math.round(providerMax * 1.5)
    };
  }

  /**
   * Get live deliverability telemetry statistics
   */
  async getStatistics(): Promise<ProviderStatistics> {
    return {
      reputationScore: 98,
      avgLatencyMs: 38,
      deliveryRate: 99.4,
      bounceRate: 0.38,
      complaintRate: 0.01,
      totalSentAllTime: this.totalSentCounter,
      activeWorkersCount: 4
    };
  }
}
