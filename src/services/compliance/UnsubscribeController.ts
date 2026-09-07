import { 
  Contact, 
  EmailPreference, 
  EmailPreferenceType, 
  SuppressionRecord, 
  AuditLog 
} from '../../types';
import { SecureTokenService } from './SecureTokenService';
import { SuppressionService } from './SuppressionService';
import { EMAIL_PREFERENCE_DEFINITIONS } from '../../data/initialComplianceData';

export interface UnsubscribePageState {
  valid: boolean;
  contact?: Contact;
  email: string;
  isGloballyUnsubscribed: boolean;
  preferences: {
    type: EmailPreferenceType;
    label: string;
    description: string;
    badge: string;
    isSubscribed: boolean;
    updatedAt: string;
  }[];
  errorMessage?: string;
}

export interface UnsubscribeExecutionResult {
  success: boolean;
  action: 'UNSUBSCRIBE_ALL' | 'PREFERENCES_UPDATED' | 'ONE_CLICK_POST';
  message: string;
  contactUpdated?: Contact;
  suppressionRecordAdded?: SuppressionRecord;
  updatedPreferences?: EmailPreference[];
  auditLogsGenerated: {
    action: string;
    module: string;
    details: string;
  }[];
}

export class UnsubscribeController {
  /**
   * GET /unsubscribe/{secure-token}
   * Resolves the token without exposing any sequential IDs.
   * Loads the contact and current category preference records.
   */
  public static showUnsubscribePage(
    token: string,
    contacts: Contact[],
    preferences: EmailPreference[],
    suppressionList: SuppressionRecord[]
  ): UnsubscribePageState {
    const tokenResult = SecureTokenService.verifyToken(token);

    if (!tokenResult.valid) {
      return {
        valid: false,
        email: '',
        isGloballyUnsubscribed: false,
        preferences: [],
        errorMessage: tokenResult.error || 'The unsubscribe link is invalid or has expired.'
      };
    }

    // Find contact by contactId or email from verified payload
    const contact = contacts.find(c => 
      (tokenResult.contactId && c.id === tokenResult.contactId) ||
      (tokenResult.email && c.email.toLowerCase() === tokenResult.email.toLowerCase())
    );

    const email = contact ? contact.email : (tokenResult.email || 'recipient@domain.com');
    const isSuppressedInList = SuppressionService.isSuppressed(email, suppressionList);
    const isContactUnsubscribed = contact 
      ? (contact.marketingStatus === 'UNSUBSCRIBED' || contact.consentStatus === 'unsubscribed' || contact.isSuppressed)
      : isSuppressedInList;

    const contactPreferences = contact 
      ? preferences.filter(p => p.contact_id === contact.id)
      : [];

    const mappedPreferences = EMAIL_PREFERENCE_DEFINITIONS.map(def => {
      const existing = contactPreferences.find(p => p.preference_type === def.type);
      const isSubscribed = existing ? existing.is_subscribed : !isContactUnsubscribed;
      return {
        type: def.type,
        label: def.label,
        description: def.description,
        badge: def.badge,
        isSubscribed,
        updatedAt: existing?.updated_at || new Date().toISOString()
      };
    });

    return {
      valid: true,
      contact,
      email,
      isGloballyUnsubscribed: isContactUnsubscribed || isSuppressedInList,
      preferences: mappedPreferences
    };
  }

  /**
   * POST /unsubscribe/{secure-token}/all
   * Handles Option 1: "Unsubscribe from all marketing emails."
   */
  public static unsubscribeAll(
    params: {
      token: string;
      ipAddress: string;
      userAgent?: string;
      source?: string;
      contacts: Contact[];
      preferences: EmailPreference[];
      suppressionList: SuppressionRecord[];
    }
  ): UnsubscribeExecutionResult {
    const { token, ipAddress, userAgent = 'Web Browser', source = 'PREFERENCE_CENTER', contacts, preferences, suppressionList } = params;
    const tokenResult = SecureTokenService.verifyToken(token);

    if (!tokenResult.valid) {
      return {
        success: false,
        action: 'UNSUBSCRIBE_ALL',
        message: tokenResult.error || 'Token verification failed.',
        auditLogsGenerated: []
      };
    }

    const contact = contacts.find(c => 
      (tokenResult.contactId && c.id === tokenResult.contactId) ||
      (tokenResult.email && c.email.toLowerCase() === tokenResult.email.toLowerCase())
    );

    const targetEmail = contact?.email || tokenResult.email!;
    const now = new Date().toISOString();

    // 1. Add to suppression list
    const { record: suppressionRecord } = SuppressionService.suppressEmail({
      email: targetEmail,
      reason: 'UNSUBSCRIBED',
      source: source,
      metadata: {
        contact_id: contact?.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        token_verified_at: now
      },
      suppressionList
    });

    // 2. Update contact record
    let updatedContact: Contact | undefined;
    if (contact) {
      updatedContact = {
        ...contact,
        marketingStatus: 'UNSUBSCRIBED',
        marketingConsent: false,
        consentStatus: 'unsubscribed',
        isSuppressed: true,
        updatedAt: now
      };
    }

    // 3. Update all email preferences to false
    const updatedPreferences = preferences.map(p => {
      if (contact && p.contact_id === contact.id) {
        return {
          ...p,
          is_subscribed: false,
          updated_at: now
        };
      }
      return p;
    });

    // If preference records did not exist for this contact, create them
    if (contact && !preferences.some(p => p.contact_id === contact.id)) {
      for (const def of EMAIL_PREFERENCE_DEFINITIONS) {
        updatedPreferences.push({
          id: `PREF-${contact.id}-${def.type}`,
          contact_id: contact.id,
          preference_type: def.type,
          is_subscribed: false,
          updated_at: now
        });
      }
    }

    // 4. Generate compliant audit logs
    const auditLogsGenerated = [
      {
        action: 'Contact Unsubscribed',
        module: 'Compliance Engine',
        details: `Recipient ${targetEmail} opted out from all marketing communications via ${source} (IP: ${ipAddress}).`
      },
      {
        action: 'Suppression Added',
        module: 'Suppression Registry',
        details: `Added ${targetEmail} to global suppression list with reason: UNSUBSCRIBED.`
      },
      {
        action: 'Preference Updated',
        module: 'Preference Center',
        details: `All 6 marketing email categories set to unsubscribed for ${targetEmail}.`
      }
    ];

    return {
      success: true,
      action: 'UNSUBSCRIBE_ALL',
      message: `You have been successfully unsubscribed from all marketing emails for ${targetEmail}.`,
      contactUpdated: updatedContact,
      suppressionRecordAdded: suppressionRecord,
      updatedPreferences,
      auditLogsGenerated
    };
  }

  /**
   * POST /unsubscribe/{secure-token}/preferences
   * Handles Option 2: "Manage preferences"
   */
  public static updatePreferences(
    params: {
      token: string;
      categoryToggles: Record<EmailPreferenceType, boolean>;
      ipAddress: string;
      userAgent?: string;
      contacts: Contact[];
      preferences: EmailPreference[];
      suppressionList: SuppressionRecord[];
    }
  ): UnsubscribeExecutionResult {
    const { token, categoryToggles, ipAddress, userAgent = 'Web Browser', contacts, preferences, suppressionList } = params;
    const tokenResult = SecureTokenService.verifyToken(token);

    if (!tokenResult.valid) {
      return {
        success: false,
        action: 'PREFERENCES_UPDATED',
        message: tokenResult.error || 'Token verification failed.',
        auditLogsGenerated: []
      };
    }

    const contact = contacts.find(c => 
      (tokenResult.contactId && c.id === tokenResult.contactId) ||
      (tokenResult.email && c.email.toLowerCase() === tokenResult.email.toLowerCase())
    );

    const targetEmail = contact?.email || tokenResult.email!;
    const now = new Date().toISOString();

    const allUnsubscribed = Object.values(categoryToggles).every(v => v === false);
    const anySubscribed = Object.values(categoryToggles).some(v => v === true);

    let updatedContact: Contact | undefined;
    let suppressionRecordAdded: SuppressionRecord | undefined;

    if (allUnsubscribed) {
      // If all are false, treat as full suppression
      const res = SuppressionService.suppressEmail({
        email: targetEmail,
        reason: 'UNSUBSCRIBED',
        source: 'PREFERENCE_CENTER_ALL_OFF',
        metadata: {
          contact_id: contact?.id,
          ip_address: ipAddress,
          user_agent: userAgent
        },
        suppressionList
      });
      suppressionRecordAdded = res.record;

      if (contact) {
        updatedContact = {
          ...contact,
          marketingStatus: 'UNSUBSCRIBED',
          marketingConsent: false,
          consentStatus: 'unsubscribed',
          isSuppressed: true,
          updatedAt: now
        };
      }
    } else {
      // Partially subscribed: if contact was previously suppressed strictly for UNSUBSCRIBE, unsuppress if they re-enabled any category
      if (contact) {
        updatedContact = {
          ...contact,
          marketingStatus: 'ACTIVE',
          marketingConsent: true,
          consentStatus: contact.consentStatus === 'unsubscribed' ? 'single_opt_in' : contact.consentStatus,
          isSuppressed: false,
          updatedAt: now
        };
      }
    }

    // Update preferences list
    const contactId = contact?.id || tokenResult.contactId || `TEMP-${Date.now()}`;
    const updatedPreferences = [...preferences];

    for (const [prefType, isSub] of Object.entries(categoryToggles)) {
      const type = prefType as EmailPreferenceType;
      const existingIdx = updatedPreferences.findIndex(p => p.contact_id === contactId && p.preference_type === type);

      if (existingIdx >= 0) {
        updatedPreferences[existingIdx] = {
          ...updatedPreferences[existingIdx],
          is_subscribed: isSub,
          updated_at: now
        };
      } else {
        updatedPreferences.push({
          id: `PREF-${contactId}-${type}`,
          contact_id: contactId,
          preference_type: type,
          is_subscribed: isSub,
          updated_at: now
        });
      }
    }

    const activeCount = Object.values(categoryToggles).filter(Boolean).length;
    const auditLogsGenerated = [
      {
        action: 'Preference Updated',
        module: 'Preference Center',
        details: `Updated subscription preferences for ${targetEmail}: ${activeCount}/6 categories active (IP: ${ipAddress}).`
      }
    ];

    if (allUnsubscribed) {
      auditLogsGenerated.push({
        action: 'Contact Unsubscribed',
        module: 'Compliance Engine',
        details: `Recipient ${targetEmail} disabled all categories; shifted to global suppression.`
      });
    }

    return {
      success: true,
      action: 'PREFERENCES_UPDATED',
      message: `Your communication preferences for ${targetEmail} have been successfully saved (${activeCount} categories active).`,
      contactUpdated: updatedContact,
      suppressionRecordAdded,
      updatedPreferences,
      auditLogsGenerated
    };
  }

  /**
   * RFC 8058 One-Click HTTP POST handler
   * Used by email clients (Apple Mail, Gmail, Yahoo) clicking the header unsubscribe button.
   */
  public static handleOneClickPost(
    params: {
      token: string;
      headers: Record<string, string>;
      ipAddress: string;
      contacts: Contact[];
      preferences: EmailPreference[];
      suppressionList: SuppressionRecord[];
    }
  ): UnsubscribeExecutionResult {
    return this.unsubscribeAll({
      token: params.token,
      ipAddress: params.ipAddress,
      userAgent: params.headers['user-agent'] || 'RFC 8058 Mail Agent',
      source: 'ONE_CLICK_UNSUBSCRIBE',
      contacts: params.contacts,
      preferences: params.preferences,
      suppressionList: params.suppressionList
    });
  }
}
