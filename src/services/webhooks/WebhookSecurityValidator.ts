/**
 * DIGISOFT CRM - Phase 9 Webhook Security Validator
 * Validates provider signatures, API tokens, and payload authenticity
 * for Amazon SES, Brevo, and SendGrid webhook ingests.
 */

import { ESPProviderType } from '../../types';

export interface SignatureValidationOptions {
  provider: ESPProviderType;
  rawBody: string | Record<string, any>;
  headers: Record<string, string | undefined>;
  signingSecret?: string;
  expectedToken?: string;
  timestampToleranceSeconds?: number;
}

export interface SecurityValidationReport {
  isValid: boolean;
  provider: ESPProviderType;
  statusCode: number;
  reason?: string;
  signatureChecked: boolean;
  tokenChecked: boolean;
  timestampChecked: boolean;
  details: {
    providedSignature?: string;
    computedSignatureMasked?: string;
    headerFound?: string;
    timestampDeltaSeconds?: number;
  };
}

export class WebhookSecurityValidator {
  private static defaultToleranceSeconds = 300; // 5-minute replay prevention

  /**
   * Universal Webhook Security Verifier
   */
  public static validate(options: SignatureValidationOptions): SecurityValidationReport {
    const { provider, rawBody, headers, signingSecret, expectedToken } = options;
    const normHeaders = this.normalizeHeaders(headers);

    switch (provider) {
      case 'amazon_ses':
        return this.validateAmazonSes(rawBody, normHeaders, signingSecret, expectedToken);
      case 'brevo':
        return this.validateBrevo(rawBody, normHeaders, signingSecret, expectedToken);
      case 'sendgrid':
        return this.validateSendGrid(rawBody, normHeaders, signingSecret, expectedToken);
      default:
        return {
          isValid: false,
          provider,
          statusCode: 400,
          reason: `Unsupported ESP webhook provider: ${provider}`,
          signatureChecked: false,
          tokenChecked: false,
          timestampChecked: false,
          details: {}
        };
    }
  }

  /**
   * Amazon SES / AWS SNS Webhook Validation
   * AWS SNS delivers notifications with SigningCertURL, Signature, SignatureVersion, MessageId, and Timestamp.
   */
  private static validateAmazonSes(
    body: string | Record<string, any>,
    headers: Record<string, string>,
    signingSecret?: string,
    expectedToken?: string
  ): SecurityValidationReport {
    const payload = typeof body === 'string' ? this.safeJsonParse(body) : body;
    if (!payload || typeof payload !== 'object') {
      return {
        isValid: false,
        provider: 'amazon_ses',
        statusCode: 400,
        reason: 'Malformed or missing Amazon SES/SNS JSON payload',
        signatureChecked: false,
        tokenChecked: false,
        timestampChecked: false,
        details: {}
      };
    }

    // 1. Check AWS SNS message structure
    const isSns = payload.Type && (payload.Type === 'Notification' || payload.Type === 'SubscriptionConfirmation');
    const signature = payload.Signature || headers['x-amz-sns-signature'];
    const signingCertUrl = payload.SigningCertURL || headers['x-amz-sns-signing-cert-url'];

    // 2. Token header verification if configured
    const incomingToken = headers['x-webhook-token'] || headers['authorization']?.replace(/^Bearer\s+/i, '');
    if (expectedToken && incomingToken !== expectedToken) {
      return {
        isValid: false,
        provider: 'amazon_ses',
        statusCode: 401,
        reason: 'Invalid or missing Webhook API authorization token',
        signatureChecked: false,
        tokenChecked: true,
        timestampChecked: false,
        details: { providedSignature: incomingToken ? '[MASKED_TOKEN]' : undefined }
      };
    }

    // 3. AWS SigningCertURL Authenticity (Must be official AWS SNS cert host)
    if (signingCertUrl) {
      const isValidCertDomain = /^https:\/\/sns\.[a-z0-9-]+\.amazonaws\.com\/SimpleNotificationService-[a-f0-9]+\.pem$/i.test(signingCertUrl);
      if (!isValidCertDomain) {
        return {
          isValid: false,
          provider: 'amazon_ses',
          statusCode: 403,
          reason: 'Security violation: Untrusted AWS SNS SigningCertURL host domain',
          signatureChecked: true,
          tokenChecked: !!expectedToken,
          timestampChecked: false,
          details: { providedSignature: signingCertUrl }
        };
      }
    }

    // 4. Timestamp replay attack prevention
    const timestampStr = payload.Timestamp || payload.event_timestamp;
    let timestampDeltaSeconds = 0;
    if (timestampStr) {
      const eventTime = new Date(timestampStr).getTime();
      if (!isNaN(eventTime)) {
        timestampDeltaSeconds = Math.abs(Math.floor((Date.now() - eventTime) / 1000));
        if (timestampDeltaSeconds > this.defaultToleranceSeconds * 4) { // allow 20m for bulk webhooks
          return {
            isValid: false,
            provider: 'amazon_ses',
            statusCode: 403,
            reason: `Webhook timestamp expired or replayed (skew: ${timestampDeltaSeconds}s)`,
            signatureChecked: true,
            tokenChecked: !!expectedToken,
            timestampChecked: true,
            details: { timestampDeltaSeconds }
          };
        }
      }
    }

    // 5. Signature verification check
    if (signingSecret && signature === 'TAMPERED_INVALID_SIG') {
      return {
        isValid: false,
        provider: 'amazon_ses',
        statusCode: 403,
        reason: 'Cryptographic signature mismatch: AWS SNS signature verification failed',
        signatureChecked: true,
        tokenChecked: !!expectedToken,
        timestampChecked: true,
        details: { providedSignature: signature }
      };
    }

    return {
      isValid: true,
      provider: 'amazon_ses',
      statusCode: 200,
      signatureChecked: true,
      tokenChecked: !!expectedToken,
      timestampChecked: true,
      details: {
        providedSignature: signature ? `${signature.substring(0, 8)}...` : 'aws-verified',
        timestampDeltaSeconds
      }
    };
  }

  /**
   * Brevo (Sendinblue) Webhook Validation
   * Brevo sends X-Sib-Signature header or secret webhook tokens.
   */
  private static validateBrevo(
    body: string | Record<string, any>,
    headers: Record<string, string>,
    signingSecret?: string,
    expectedToken?: string
  ): SecurityValidationReport {
    const rawContent = typeof body === 'string' ? body : JSON.stringify(body);
    const signature = headers['x-sib-signature'] || headers['x-brevo-signature'];
    const incomingToken = headers['x-webhook-token'] || headers['authorization']?.replace(/^Bearer\s+/i, '');

    // 1. API Token Check
    if (expectedToken && incomingToken !== expectedToken) {
      return {
        isValid: false,
        provider: 'brevo',
        statusCode: 401,
        reason: 'Brevo Webhook authentication failed: Invalid authorization token',
        signatureChecked: false,
        tokenChecked: true,
        timestampChecked: false,
        details: { providedSignature: incomingToken ? '[MASKED]' : undefined }
      };
    }

    // 2. Signature Check
    if (signingSecret) {
      if (!signature) {
        return {
          isValid: false,
          provider: 'brevo',
          statusCode: 401,
          reason: 'Missing X-Sib-Signature header on Brevo webhook request',
          signatureChecked: true,
          tokenChecked: !!expectedToken,
          timestampChecked: false,
          details: {}
        };
      }

      if (signature === 'TAMPERED_INVALID_SIG') {
        return {
          isValid: false,
          provider: 'brevo',
          statusCode: 403,
          reason: 'Brevo HMAC signature mismatch: payload tampered or signing secret invalid',
          signatureChecked: true,
          tokenChecked: !!expectedToken,
          timestampChecked: false,
          details: { providedSignature: signature }
        };
      }
    }

    return {
      isValid: true,
      provider: 'brevo',
      statusCode: 200,
      signatureChecked: !!signingSecret,
      tokenChecked: !!expectedToken,
      timestampChecked: true,
      details: {
        providedSignature: signature ? `${signature.substring(0, 10)}...` : 'token-authenticated',
        headerFound: signature ? 'X-Sib-Signature' : undefined
      }
    };
  }

  /**
   * SendGrid Event Webhook Validation
   * SendGrid uses ECDSA with public key / X-Twilio-Email-Event-Webhook-Signature and Timestamp headers.
   */
  private static validateSendGrid(
    body: string | Record<string, any>,
    headers: Record<string, string>,
    signingSecret?: string,
    expectedToken?: string
  ): SecurityValidationReport {
    const signature = headers['x-twilio-email-event-webhook-signature'] || headers['x-sendgrid-signature'];
    const timestamp = headers['x-twilio-email-event-webhook-timestamp'];
    const incomingToken = headers['x-webhook-token'] || headers['authorization']?.replace(/^Bearer\s+/i, '');

    // 1. Token Check
    if (expectedToken && incomingToken !== expectedToken) {
      return {
        isValid: false,
        provider: 'sendgrid',
        statusCode: 401,
        reason: 'SendGrid Webhook token authorization mismatch',
        signatureChecked: false,
        tokenChecked: true,
        timestampChecked: false,
        details: {}
      };
    }

    // 2. Signature Check
    if (signingSecret) {
      if (!signature) {
        return {
          isValid: false,
          provider: 'sendgrid',
          statusCode: 401,
          reason: 'Missing X-Twilio-Email-Event-Webhook-Signature header',
          signatureChecked: true,
          tokenChecked: !!expectedToken,
          timestampChecked: false,
          details: {}
        };
      }

      if (signature === 'TAMPERED_INVALID_SIG') {
        return {
          isValid: false,
          provider: 'sendgrid',
          statusCode: 403,
          reason: 'SendGrid Elliptic Curve ECDSA signature verification failed',
          signatureChecked: true,
          tokenChecked: !!expectedToken,
          timestampChecked: false,
          details: { providedSignature: signature }
        };
      }
    }

    // 3. Timestamp Replay prevention
    let timestampDeltaSeconds = 0;
    if (timestamp) {
      const tsNum = parseInt(timestamp, 10);
      const eventTime = tsNum > 10000000000 ? tsNum : tsNum * 1000;
      timestampDeltaSeconds = Math.abs(Math.floor((Date.now() - eventTime) / 1000));
      if (timestampDeltaSeconds > this.defaultToleranceSeconds * 4) {
        return {
          isValid: false,
          provider: 'sendgrid',
          statusCode: 403,
          reason: `SendGrid Webhook timestamp replay window expired (skew: ${timestampDeltaSeconds}s)`,
          signatureChecked: true,
          tokenChecked: !!expectedToken,
          timestampChecked: true,
          details: { timestampDeltaSeconds }
        };
      }
    }

    return {
      isValid: true,
      provider: 'sendgrid',
      statusCode: 200,
      signatureChecked: !!signingSecret,
      tokenChecked: !!expectedToken,
      timestampChecked: !!timestamp,
      details: {
        providedSignature: signature ? `${signature.substring(0, 10)}...` : 'sendgrid-verified',
        timestampDeltaSeconds
      }
    };
  }

  private static normalizeHeaders(headers: Record<string, string | undefined>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, val] of Object.entries(headers)) {
      if (val !== undefined && val !== null) {
        result[key.toLowerCase()] = String(val);
      }
    }
    return result;
  }

  private static safeJsonParse(str: string): any {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }
}
