/**
 * Sliding Window & Token Bucket Rate Limiter
 * Enforces configured sending limits with application-level safety margin.
 * Example: Provider Limit = 100/sec, Safety Margin = 20% -> Application Cap = 80/sec.
 */
export class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRatePerSecond: number;
  private lastRefillTimestamp: number;
  private safetyMarginPercentage: number;
  private providerLimitPerSecond: number;

  constructor(providerLimitPerSecond: number = 100, safetyMarginPercentage: number = 20) {
    this.providerLimitPerSecond = providerLimitPerSecond;
    this.safetyMarginPercentage = safetyMarginPercentage;
    
    // Calculate actual application rate after safety margin
    this.refillRatePerSecond = Math.max(1, Math.round(providerLimitPerSecond * (1 - safetyMarginPercentage / 100)));
    this.maxTokens = this.refillRatePerSecond;
    this.tokens = this.maxTokens;
    this.lastRefillTimestamp = performance.now();
  }

  /**
   * Refills tokens based on elapsed time
   */
  private refill(): void {
    const now = performance.now();
    const elapsedSeconds = (now - this.lastRefillTimestamp) / 1000;

    if (elapsedSeconds > 0) {
      const addedTokens = elapsedSeconds * this.refillRatePerSecond;
      this.tokens = Math.min(this.maxTokens, this.tokens + addedTokens);
      this.lastRefillTimestamp = now;
    }
  }

  /**
   * Acquire a sending permit (token).
   * Waits asynchronously if rate limit is reached.
   */
  async acquireToken(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // Wait until at least 1 token is refilled
    const missingTokens = 1 - this.tokens;
    const waitMs = Math.ceil((missingTokens / this.refillRatePerSecond) * 1000);

    await new Promise(resolve => setTimeout(resolve, Math.max(5, waitMs)));
    this.refill();
    this.tokens = Math.max(0, this.tokens - 1);
  }

  /**
   * Dynamically adjust rate limit
   */
  setRate(providerLimit: number, safetyMargin: number = 20): void {
    this.providerLimitPerSecond = providerLimit;
    this.safetyMarginPercentage = safetyMargin;
    this.refillRatePerSecond = Math.max(1, Math.round(providerLimit * (1 - safetyMargin / 100)));
    this.maxTokens = this.refillRatePerSecond;
    this.tokens = Math.min(this.tokens, this.maxTokens);
  }

  /**
   * Get current rate configuration details
   */
  getStatus() {
    this.refill();
    return {
      providerLimitPerSec: this.providerLimitPerSecond,
      appRateLimitPerSec: this.refillRatePerSecond,
      safetyMarginPercentage: this.safetyMarginPercentage,
      availableTokens: Math.floor(this.tokens),
      maxTokens: this.maxTokens
    };
  }
}
