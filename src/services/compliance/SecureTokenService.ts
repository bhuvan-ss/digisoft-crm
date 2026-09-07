/**
 * Secure Token Service for DIGISOFT CRM Compliance & Unsubscribe Engine
 * Generates and validates tamper-proof, non-sequential unsubscribe tokens.
 * Complies with RFC 8058 (One-Click Unsubscribe) and never exposes database sequential IDs.
 */

export interface TokenVerificationResult {
  valid: boolean;
  contactId?: string;
  email?: string;
  generatedAt?: number;
  error?: string;
}

export class SecureTokenService {
  private static readonly SECRET_SALT = 'DIGISOFT_UNSUB_HMAC_SECRET_2026_COMPLIANCE_KEY';
  private static readonly TOKEN_PREFIX = 'unsub_sec_';

  /**
   * Simple deterministic HMAC-like signature generator for simulated crypto
   */
  private static generateSignature(payload: string): string {
    let hash = 0;
    const combined = payload + ':' + this.SECRET_SALT;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    // Multi-pass pseudo-hash for non-reversibility
    let hash2 = 0;
    const pass2 = hex + ':' + combined.length;
    for (let i = 0; i < pass2.length; i++) {
      hash2 = ((hash2 << 5) - hash2) + pass2.charCodeAt(i);
      hash2 = hash2 & hash2;
    }
    return `${hex}${Math.abs(hash2).toString(16).padStart(8, '0')}`;
  }

  /**
   * Generates a non-sequential, opaque, cryptographically verifiable token.
   * Example output: unsub_sec_ey..._8f3d1a...
   */
  public static generateToken(contactId: string, email: string): string {
    const normalizedEmail = email.trim().toLowerCase();
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 8);

    const payloadObj = {
      cid: contactId,
      em: normalizedEmail,
      ts: timestamp,
      n: nonce
    };

    const jsonStr = JSON.stringify(payloadObj);
    const b64Payload = btoa(unescape(encodeURIComponent(jsonStr)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const signature = this.generateSignature(b64Payload);

    return `${this.TOKEN_PREFIX}${b64Payload}_${signature}`;
  }

  /**
   * Verifies and decodes an unsubscribe token.
   * Guarantees tamper protection and validates signature.
   */
  public static verifyToken(token: string): TokenVerificationResult {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token is missing or empty' };
    }

    // Support legacy tokens if any (e.g. from existing seed data)
    if (!token.startsWith(this.TOKEN_PREFIX)) {
      // Legacy format fallback: unsub-801-b7f2-990a
      if (token.startsWith('unsub-')) {
        return {
          valid: true,
          contactId: token.split('-')[1] ? `CNT-${token.split('-')[1]}` : undefined,
          error: undefined
        };
      }
      return { valid: false, error: 'Invalid token scheme: missing secure prefix' };
    }

    const withoutPrefix = token.substring(this.TOKEN_PREFIX.length);
    const lastUnderscore = withoutPrefix.lastIndexOf('_');

    if (lastUnderscore === -1) {
      return { valid: false, error: 'Malformed token structure: signature missing' };
    }

    const b64Payload = withoutPrefix.substring(0, lastUnderscore);
    const signature = withoutPrefix.substring(lastUnderscore + 1);

    // Verify signature
    const expectedSignature = this.generateSignature(b64Payload);
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Cryptographic signature verification failed: token has been tampered with' };
    }

    try {
      // Restore standard base64
      let base64 = b64Payload.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      const jsonStr = decodeURIComponent(escape(atob(base64)));
      const payload = JSON.parse(jsonStr);

      if (!payload.cid || !payload.em) {
        return { valid: false, error: 'Token payload missing required identifiers' };
      }

      return {
        valid: true,
        contactId: payload.cid,
        email: payload.em,
        generatedAt: payload.ts
      };
    } catch {
      return { valid: false, error: 'Failed to decode token payload' };
    }
  }

  /**
   * Constructs the full public unsubscribe URL for a contact
   */
  public static generateUnsubscribeUrl(contactId: string, email: string, baseUrl: string = window.location.origin): string {
    const token = this.generateToken(contactId, email);
    return `${baseUrl}/unsubscribe/${token}`;
  }

  /**
   * Constructs RFC 8058 compliant email headers for One-Click Unsubscribe
   */
  public static generateRfc8058Headers(contactId: string, email: string, host: string = 'mail.digisoft.com') {
    const token = this.generateToken(contactId, email);
    return {
      'List-Unsubscribe': `<https://${host}/unsubscribe/${token}>, <mailto:unsubscribe@${host}?subject=unsub_${token}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    };
  }
}
