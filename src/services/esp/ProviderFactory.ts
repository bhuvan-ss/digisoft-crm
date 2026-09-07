import { 
  EmailProviderInterface, 
  EmailProviderConfigRecord, 
  ESPDriverType 
} from '../../types';
import { AmazonSESProvider } from './AmazonSESProvider';
import { BrevoProvider } from './BrevoProvider';
import { SendGridProvider } from './SendGridProvider';

export class ProviderFactory {
  private static instanceCache: Map<string, EmailProviderInterface> = new Map();

  /**
   * Instantiate an EmailProviderInterface implementation based on configuration
   */
  static getProvider(config: EmailProviderConfigRecord): EmailProviderInterface {
    const cacheKey = `${config.id}-${config.provider}-${config.updated_at}`;
    if (this.instanceCache.has(cacheKey)) {
      return this.instanceCache.get(cacheKey)!;
    }

    let provider: EmailProviderInterface;

    switch (config.provider) {
      case 'amazon_ses':
        provider = new AmazonSESProvider(config);
        break;
      case 'brevo':
        provider = new BrevoProvider(config);
        break;
      case 'sendgrid':
        provider = new SendGridProvider(config);
        break;
      default:
        throw new Error(`Unsupported email provider type: ${(config as any).provider}`);
    }

    this.instanceCache.set(cacheKey, provider);
    return provider;
  }

  /**
   * Clears provider instance cache
   */
  static clearCache(): void {
    this.instanceCache.clear();
  }
}
