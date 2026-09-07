import { SendResult } from '../../types';

export type ErrorSeverity = 'transient' | 'permanent' | 'fatal';

export interface RetryEvaluation {
  shouldRetry: boolean;
  attempt: number;
  maxAttempts: number;
  delayMs: number;
  reason: string;
  severity: ErrorSeverity;
}

export class RetryPolicy {
  private baseDelayMs: number;
  private maxDelayMs: number;
  private maxRetries: number;

  constructor(baseDelayMs: number = 2000, maxDelayMs: number = 30000, maxRetries: number = 3) {
    this.baseDelayMs = baseDelayMs;
    this.maxDelayMs = maxDelayMs;
    this.maxRetries = maxRetries;
  }

  /**
   * Evaluate whether an ESP send failure is retryable
   */
  evaluate(sendResult: SendResult, currentAttempt: number): RetryEvaluation {
    const { statusCode, errorCode, error } = sendResult;
    const msg = (error || '').toLowerCase();
    const code = (errorCode || '').toLowerCase();

    // 1. Non-Retryable Permanent Failures
    if (
      statusCode === 400 || 
      code.includes('invalid') || 
      code.includes('bad_request') ||
      code.includes('suppress') ||
      msg.includes('rfc 5322') ||
      msg.includes('illegal recipient') ||
      msg.includes('blacklisted') ||
      msg.includes('hard bounce') ||
      msg.includes('hard-bounced') ||
      msg.includes('unsubscribe')
    ) {
      return {
        shouldRetry: false,
        attempt: currentAttempt,
        maxAttempts: this.maxRetries,
        delayMs: 0,
        reason: `Permanent non-retryable failure: ${error || 'Invalid recipient or suppression record.'}`,
        severity: 'permanent'
      };
    }

    // 2. Exceeded Max Attempts
    if (currentAttempt >= this.maxRetries) {
      return {
        shouldRetry: false,
        attempt: currentAttempt,
        maxAttempts: this.maxRetries,
        delayMs: 0,
        reason: `Exceeded maximum retry attempts (${this.maxRetries}). Moved to Dead Letter Queue (DLQ).`,
        severity: 'fatal'
      };
    }

    // 3. Retryable Failures (429 Rate Limit, 500, 502, 503, 504, or Network Drops)
    const isRateLimit = statusCode === 429 || code.includes('rate_limit') || code.includes('toomanyrequests');
    const isServerTransient = statusCode >= 500 && statusCode < 600;
    const isNetworkTransient = sendResult.isRetryable || isRateLimit || isServerTransient;

    if (isNetworkTransient) {
      // Exponential backoff: base * 2^(attempt - 1) + jitter
      const exponentialMultiplier = Math.pow(2, Math.max(0, currentAttempt - 1));
      const jitter = Math.random() * 500;
      const calculatedDelay = Math.min(this.maxDelayMs, (this.baseDelayMs * exponentialMultiplier) + jitter);
      
      // If provider specified a retryAfterMs, respect that if larger
      const delayMs = Math.round(Math.max(calculatedDelay, sendResult.retryAfterMs || 0));

      return {
        shouldRetry: true,
        attempt: currentAttempt + 1,
        maxAttempts: this.maxRetries,
        delayMs,
        reason: isRateLimit
          ? `Rate limit reached (HTTP 429). Exponential backoff delay: ${delayMs}ms.`
          : `Transient service error (${statusCode}). Retrying in ${delayMs}ms.`,
        severity: 'transient'
      };
    }

    // Default fallback
    return {
      shouldRetry: false,
      attempt: currentAttempt,
      maxAttempts: this.maxRetries,
      delayMs: 0,
      reason: `Unknown or unhandled error code ${statusCode}. Terminating retries.`,
      severity: 'permanent'
    };
  }
}
