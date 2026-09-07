import { 
  EmailMessage, 
  SendResult, 
  BatchSendResult, 
  SendingLimits, 
  ProviderStatistics, 
  ValidationResult,
  EmailProviderInterface,
  EmailProviderConfigRecord
} from '../../types';

export type { EmailProviderInterface };

/**
 * Base Abstract Provider class
 */
export abstract class BaseEmailProvider implements EmailProviderInterface {
  protected config: EmailProviderConfigRecord;

  constructor(config: EmailProviderConfigRecord) {
    this.config = config;
  }

  abstract send(message: EmailMessage): Promise<SendResult>;
  abstract sendBatch(messages: EmailMessage[]): Promise<BatchSendResult>;
  abstract validateConfiguration(): Promise<ValidationResult>;
  abstract getSendingLimits(): Promise<SendingLimits>;
  abstract getStatistics(): Promise<ProviderStatistics>;

  public getConfig(): EmailProviderConfigRecord {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<EmailProviderConfigRecord>): void {
    this.config = { ...this.config, ...newConfig, updated_at: new Date().toISOString() };
  }

  /**
   * Helper to evaluate whether an email address is syntactically valid RFC 5322
   */
  protected isValidEmailSyntax(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(email);
  }

  /**
   * Generates a deterministic or simulated ESP Message ID
   */
  protected generateMessageId(prefix: string): string {
    const time = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 8);
    return `<${prefix}-${time}-${rand}@${this.config.from_email.split('@')[1] || 'notifications.digisoft.com'}>`;
  }
}
