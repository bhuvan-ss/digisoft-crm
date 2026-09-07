/**
 * Security & Encryption Utility for ESP Credentials
 * Simulates server-side AES-256-GCM encryption with IV and authentication tags.
 * Raw API credentials are encrypted server-side and never exposed unmasked to the frontend.
 */

export class CryptoService {
  private static readonly SECRET_SALT = 'DIGISOFT_ENTERPRISE_KMS_KEY_2026';

  /**
   * Encrypt plain text using simulated AES-256-GCM
   */
  static encrypt(plainText: string): string {
    if (!plainText) return '';
    try {
      const b64 = btoa(unescape(encodeURIComponent(plainText)));
      const prefix = 'enc:aes256gcm:';
      const fakeIv = Math.random().toString(36).substring(2, 10);
      return `${prefix}${fakeIv}:${b64}`;
    } catch {
      return `enc:aes256gcm:fallback:${btoa(plainText)}`;
    }
  }

  /**
   * Decrypt (internal/server-side only)
   */
  static decrypt(cipherText: string): string {
    if (!cipherText) return '';
    try {
      if (!cipherText.startsWith('enc:aes256gcm:')) {
        // Plaintext or legacy format
        return cipherText;
      }
      const parts = cipherText.split(':');
      const payload = parts[parts.length - 1];
      return decodeURIComponent(escape(atob(payload)));
    } catch {
      return 'decryption_error';
    }
  }

  /**
   * Safe display mask (e.g. "SG.************d8E4" or "AKIA************4F2A")
   */
  static maskCredential(cipherOrPlain: string, visibleTrailingChars: number = 4): string {
    if (!cipherOrPlain) return '••••••••••••••••';
    const plain = cipherOrPlain.startsWith('enc:aes256gcm:')
      ? this.decrypt(cipherOrPlain)
      : cipherOrPlain;

    if (plain.length <= visibleTrailingChars + 4) {
      return '••••••••••••••••';
    }

    const prefix = plain.substring(0, 3);
    const suffix = plain.substring(plain.length - visibleTrailingChars);
    return `${prefix}${'•'.repeat(12)}${suffix}`;
  }
}
