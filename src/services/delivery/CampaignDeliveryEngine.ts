import { 
  Campaign, 
  Contact, 
  CampaignRecipient, 
  EmailProviderConfigRecord, 
  QueueBatch, 
  QueueChunk, 
  DeliveryLogEntry, 
  LiveDeliveryEngineStats,
  EmailMessage,
  CampaignRecipientStatus
} from '../../types';
import { ProviderFactory } from '../esp/ProviderFactory';
import { RateLimiter } from './RateLimiter';
import { RetryPolicy } from './RetryPolicy';

export interface DeliveryEngineEvents {
  onProgress?: (stats: LiveDeliveryEngineStats, batch: QueueBatch) => void;
  onLog?: (entry: DeliveryLogEntry) => void;
  onChunkComplete?: (chunk: QueueChunk) => void;
  onBatchFinished?: (batch: QueueBatch, stats: LiveDeliveryEngineStats) => void;
}

export class CampaignDeliveryEngine {
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private shouldAbort: boolean = false;

  private rateLimiter: RateLimiter;
  private retryPolicy: RetryPolicy;
  private activeBatch: QueueBatch | null = null;
  private deliveryLogs: DeliveryLogEntry[] = [];
  private stats: LiveDeliveryEngineStats = {
    queued: 0,
    sending: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    bounced: 0,
    complained: 0,
    unsubscribed: 0,
    percentageComplete: 0,
    currentSpeedPerSec: 0,
    targetSpeedPerSec: 80,
    status: 'idle'
  };

  private callbacks: DeliveryEngineEvents = {};
  private speedMeasurementTimer: any = null;
  private sentInLastInterval: number = 0;

  constructor(providerLimitPerSec: number = 100, safetyMargin: number = 20) {
    this.rateLimiter = new RateLimiter(providerLimitPerSec, safetyMargin);
    this.retryPolicy = new RetryPolicy(1000, 15000, 3);
  }

  public setCallbacks(events: DeliveryEngineEvents) {
    this.callbacks = events;
  }

  public getStats(): LiveDeliveryEngineStats {
    return { ...this.stats };
  }

  public getActiveBatch(): QueueBatch | null {
    return this.activeBatch;
  }

  public getLogs(): DeliveryLogEntry[] {
    return [...this.deliveryLogs];
  }

  /**
   * Adjust sending speed dynamically
   */
  public setSpeedLimit(ratePerSec: number, safetyMargin: number = 20) {
    this.rateLimiter.setRate(ratePerSec, safetyMargin);
    this.stats.targetSpeedPerSec = Math.round(ratePerSec * (1 - safetyMargin / 100));
  }

  /**
   * 1. RECIPIENT SNAPSHOT & MULTI-TIER SUPPRESSION CHECK
   */
  public prepareRecipientSnapshot(campaign: Campaign, allContacts: Contact[]): {
    validRecipients: CampaignRecipient[];
    suppressedRecipients: CampaignRecipient[];
  } {
    const validRecipients: CampaignRecipient[] = [];
    const suppressedRecipients: CampaignRecipient[] = [];

    // Filter contacts based on audience selection
    let targetedContacts = allContacts;
    if (campaign.audience) {
      if (campaign.audience.type === 'segment' && campaign.audience.segmentId) {
        // Targeted via segment
        targetedContacts = allContacts.filter(c => !c.deletedAt);
      } else if (campaign.audience.type === 'tags' && campaign.audience.tags?.length) {
        const tags = campaign.audience.tags;
        targetedContacts = allContacts.filter(c => c.tags?.some(t => tags.includes(t)));
      } else if (campaign.audience.type === 'individual_contacts' && campaign.audience.contactIds?.length) {
        const ids = new Set(campaign.audience.contactIds);
        targetedContacts = allContacts.filter(c => ids.has(c.id));
      }
    }

    for (const contact of targetedContacts) {
      const email = contact.email?.trim().toLowerCase() || '';
      let exclusionReason: string | null = null;

      // Email Syntax Check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        exclusionReason = 'Invalid email syntax (RFC 5322 non-compliant)';
      }
      // Suppression Check
      else if (contact.isSuppressed) {
        exclusionReason = 'Contact is globally suppressed';
      }
      // Hard Bounce Check
      else if (contact.marketingStatus === 'BOUNCED' || contact.consentStatus === 'bounced') {
        exclusionReason = 'Previous permanent hard bounce';
      }
      // Spam Complaint Check
      else if (contact.marketingStatus === 'COMPLAINED' || contact.consentStatus === 'complained') {
        exclusionReason = 'Previous spam complaint recorded';
      }
      // Unsubscribe Check
      else if (contact.marketingStatus === 'UNSUBSCRIBED' || contact.consentStatus === 'unsubscribed') {
        exclusionReason = 'Explicit unsubscribe opt-out';
      }
      // Missing Consent Check
      else if (!contact.marketingConsent) {
        exclusionReason = 'Missing marketing consent (ConsentStatus: Revoked)';
      }

      const recipientRecord: CampaignRecipient = {
        id: `REC-${campaign.id}-${contact.id}-${Date.now().toString(36)}`,
        campaign_id: campaign.id,
        contact_id: contact.id,
        email: contact.email,
        personalization_data: {
          firstName: contact.firstName,
          lastName: contact.lastName,
          companyName: contact.companyName,
          tallyOutstanding: contact.tallyOutstandingBalance || 0,
          city: contact.city || ''
        },
        status: exclusionReason ? 'EXCLUDED' : 'PENDING',
        exclusion_reason: exclusionReason
      };

      if (exclusionReason) {
        suppressedRecipients.push(recipientRecord);
      } else {
        validRecipients.push(recipientRecord);
      }
    }

    return { validRecipients, suppressedRecipients };
  }

  /**
   * 2. GENERATE LARAVEL BUS BATCH & QUEUE CHUNKS
   */
  public createBatchJobs(
    campaign: Campaign, 
    recipients: CampaignRecipient[], 
    providerConfig: EmailProviderConfigRecord,
    chunkSize: number = 500
  ): QueueBatch {
    const totalRecipients = recipients.length;
    const numChunks = Math.max(1, Math.ceil(totalRecipients / chunkSize));
    const chunks: QueueChunk[] = [];
    const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    for (let i = 0; i < numChunks; i++) {
      const startIdx = i * chunkSize;
      const count = Math.min(chunkSize, totalRecipients - startIdx);
      chunks.push({
        id: `CHK-${batchId}-${i + 1}`,
        batchId,
        chunkIndex: i + 1,
        totalChunks: numChunks,
        recipientCount: count,
        status: 'pending',
        attempt: 1,
        maxAttempts: 3
      });
    }

    const batch: QueueBatch = {
      id: batchId,
      campaignId: campaign.id,
      campaignName: campaign.name,
      provider: providerConfig.provider,
      totalJobs: totalRecipients,
      pendingJobs: totalRecipients,
      failedJobs: 0,
      processedJobs: 0,
      progressPercentage: 0,
      chunkSize,
      rateLimit: providerConfig.settings.rate_limit_per_second || 80,
      status: 'queued',
      createdAt: new Date().toISOString(),
      chunks
    };

    this.activeBatch = batch;
    this.stats = {
      queued: totalRecipients,
      sending: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      bounced: 0,
      complained: 0,
      unsubscribed: 0,
      percentageComplete: 0,
      currentSpeedPerSec: 0,
      targetSpeedPerSec: batch.rateLimit,
      activeBatchId: batch.id,
      status: 'idle'
    };

    return batch;
  }

  /**
   * 3. DISPATCH & WORKER ORCHESTRATION
   */
  public async startDispatch(
    campaign: Campaign, 
    recipients: CampaignRecipient[], 
    providerConfig: EmailProviderConfigRecord,
    simulationMode: boolean = false
  ): Promise<void> {
    if (this.isRunning && !this.isPaused) return;

    this.isRunning = true;
    this.isPaused = false;
    this.shouldAbort = false;

    if (!this.activeBatch) {
      this.createBatchJobs(campaign, recipients, providerConfig, campaign.chunk_size || 500);
    }

    const batch = this.activeBatch!;
    batch.status = 'processing';
    batch.startedAt = batch.startedAt || new Date().toISOString();
    this.stats.status = 'running';

    const provider = ProviderFactory.getProvider(providerConfig);
    const workerCount = 4; // 4 concurrent Horizon queue workers
    
    // Start speed throughput calculator (every 500ms)
    this.startSpeedTracker();

    // Map chunk index to recipients slice
    const chunkSize = batch.chunkSize;
    let chunkPointer = 0;

    const workerLoop = async (workerId: string) => {
      while (chunkPointer < batch.chunks.length && !this.shouldAbort) {
        if (this.isPaused) {
          await new Promise(resolve => setTimeout(resolve, 300));
          continue;
        }

        const chunkIndex = chunkPointer++;
        if (chunkIndex >= batch.chunks.length) break;

        const chunk = batch.chunks[chunkIndex];
        chunk.status = 'processing';
        chunk.workerId = workerId;
        chunk.startedAt = new Date().toISOString();

        const chunkStart = chunkIndex * chunkSize;
        const chunkRecipients = recipients.slice(chunkStart, chunkStart + chunk.recipientCount);

        const chunkStartTime = performance.now();

        // Process recipients in chunk with rate limiter
        for (const rec of chunkRecipients) {
          if (this.shouldAbort) break;

          while (this.isPaused && !this.shouldAbort) {
            await new Promise(r => setTimeout(r, 200));
          }

          // Check token bucket rate limiter
          await this.rateLimiter.acquireToken();

          this.stats.sending++;
          this.stats.queued = Math.max(0, this.stats.queued - 1);
          rec.status = 'QUEUED';

          const msg: EmailMessage = {
            to: rec.email,
            toName: rec.personalization_data?.firstName 
              ? `${rec.personalization_data.firstName} ${rec.personalization_data.lastName || ''}`.trim()
              : undefined,
            from: campaign.from_email || providerConfig.from_email,
            fromName: campaign.from_name || providerConfig.from_name,
            replyTo: campaign.reply_to || providerConfig.reply_to,
            subject: campaign.subject,
            html: campaign.html_content,
            plainText: campaign.plain_text_content,
            campaignId: campaign.id,
            contactId: rec.contact_id
          };

          let attempt = 1;
          let sendSuccess = false;

          while (attempt <= 3 && !sendSuccess && !this.shouldAbort) {
            const res = await provider.send(msg);

            if (res.success) {
              sendSuccess = true;
              rec.status = 'SENT';
              rec.sent_at = new Date().toISOString();
              this.stats.sending = Math.max(0, this.stats.sending - 1);
              this.stats.sent++;
              this.sentInLastInterval++;

              // Simulate 97% delivery success, 2.5% soft bounce, 0.5% spam complaint
              const rand = Math.random();
              if (rand < 0.96) {
                rec.status = 'DELIVERED';
                rec.delivered_at = new Date().toISOString();
                this.stats.delivered++;
              } else if (rand < 0.985) {
                rec.status = 'BOUNCED';
                this.stats.bounced++;
              } else {
                rec.status = 'COMPLAINED';
                this.stats.complained++;
              }

              const log: DeliveryLogEntry = {
                id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                campaignId: campaign.id,
                recipientEmail: rec.email,
                contactId: rec.contact_id,
                provider: providerConfig.provider,
                status: rec.status,
                espMessageId: res.messageId,
                httpCode: res.statusCode,
                latencyMs: res.latencyMs,
                attempts: attempt,
                timestamp: new Date().toISOString()
              };

              this.deliveryLogs.unshift(log);
              if (this.deliveryLogs.length > 200) this.deliveryLogs.pop();
              this.callbacks.onLog?.(log);

            } else {
              // Failure evaluation via RetryPolicy
              const evaluation = this.retryPolicy.evaluate(res, attempt);

              if (evaluation.shouldRetry && attempt < 3) {
                attempt++;
                chunk.status = 'retrying';
                chunk.attempt = attempt;
                // Wait exponential backoff delay (shortened in demo/sim)
                const delay = Math.min(300, evaluation.delayMs / 10);
                await new Promise(r => setTimeout(r, delay));
              } else {
                // Terminate - mark failed
                rec.status = 'FAILED';
                this.stats.sending = Math.max(0, this.stats.sending - 1);
                this.stats.failed++;
                batch.failedJobs++;

                const log: DeliveryLogEntry = {
                  id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  campaignId: campaign.id,
                  recipientEmail: rec.email,
                  contactId: rec.contact_id,
                  provider: providerConfig.provider,
                  status: 'FAILED',
                  espMessageId: 'N/A',
                  httpCode: res.statusCode,
                  latencyMs: res.latencyMs,
                  attempts: attempt,
                  errorMessage: res.error || evaluation.reason,
                  timestamp: new Date().toISOString()
                };

                this.deliveryLogs.unshift(log);
                this.callbacks.onLog?.(log);
                break;
              }
            }
          }

          batch.processedJobs++;
          batch.pendingJobs = Math.max(0, batch.totalJobs - batch.processedJobs);
          batch.progressPercentage = Math.round((batch.processedJobs / batch.totalJobs) * 100);
          this.stats.percentageComplete = batch.progressPercentage;

          this.callbacks.onProgress?.(this.getStats(), batch);
        }

        chunk.status = 'completed';
        chunk.completedAt = new Date().toISOString();
        chunk.durationMs = Math.round(performance.now() - chunkStartTime);
        this.callbacks.onChunkComplete?.(chunk);
      }
    };

    // Spawn 4 concurrent worker threads
    const workerPromises = Array.from({ length: workerCount }, (_, i) => 
      workerLoop(`Worker-${i + 1}`)
    );

    await Promise.all(workerPromises);

    this.stopSpeedTracker();
    this.isRunning = false;

    if (this.shouldAbort) {
      batch.status = 'cancelled';
      this.stats.status = 'aborted';
    } else {
      batch.status = 'completed';
      batch.finishedAt = new Date().toISOString();
      this.stats.status = 'completed';
      this.stats.percentageComplete = 100;
    }

    this.callbacks.onBatchFinished?.(batch, this.getStats());
  }

  public pause(): void {
    if (this.isRunning) {
      this.isPaused = true;
      this.stats.status = 'paused';
      if (this.activeBatch) this.activeBatch.status = 'paused';
    }
  }

  public resume(): void {
    if (this.isRunning && this.isPaused) {
      this.isPaused = false;
      this.stats.status = 'running';
      if (this.activeBatch) this.activeBatch.status = 'processing';
    }
  }

  public abort(): void {
    this.shouldAbort = true;
    this.isPaused = false;
    this.isRunning = false;
    this.stats.status = 'aborted';
    if (this.activeBatch) this.activeBatch.status = 'cancelled';
    this.stopSpeedTracker();
  }

  private startSpeedTracker(): void {
    this.stopSpeedTracker();
    this.sentInLastInterval = 0;
    this.speedMeasurementTimer = setInterval(() => {
      // Multiply by 2 for per-second estimate
      const currentSpeed = this.sentInLastInterval * 2;
      this.stats.currentSpeedPerSec = currentSpeed;
      this.sentInLastInterval = 0;
    }, 500);
  }

  private stopSpeedTracker(): void {
    if (this.speedMeasurementTimer) {
      clearInterval(this.speedMeasurementTimer);
      this.speedMeasurementTimer = null;
    }
    this.stats.currentSpeedPerSec = 0;
  }
}
