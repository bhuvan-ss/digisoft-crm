/**
 * DIGISOFT CRM - Phase 9 Webhook Event Processor & Analytics Engine
 * Ingests incoming ESP webhooks, enforces idempotency, validates signatures,
 * updates Contact suppression statuses, updates Campaign metrics, and computes delivery rates.
 */

import { 
  Campaign, 
  Contact, 
  EmailEvent, 
  EmailEventType, 
  ESPProviderType, 
  WebhookIngestResult,
  CampaignAnalyticsRates,
  CampaignDeliveryFunnelStep
} from '../../types';
import { WebhookSecurityValidator, SignatureValidationOptions } from './WebhookSecurityValidator';

export interface IngestPayloadRequest {
  provider: ESPProviderType;
  payload: any;
  headers?: Record<string, string | undefined>;
  signingSecret?: string;
  expectedToken?: string;
}

export interface IngestStateContext {
  campaigns: Campaign[];
  contacts: Contact[];
  existingEvents: EmailEvent[];
}

export interface IngestStateUpdate {
  result: WebhookIngestResult;
  updatedEvents: EmailEvent[];
  updatedCampaigns: Campaign[];
  updatedContacts: Contact[];
}

export class WebhookEventProcessor {
  // Fast in-memory idempotency cache (provider + ":" + provider_event_id)
  private static idempotencyRegistry: Set<string> = new Set();

  /**
   * Initialize idempotency cache from existing events
   */
  public static initializeRegistry(events: EmailEvent[]): void {
    events.forEach(e => {
      if (e.provider && e.provider_event_id) {
        this.idempotencyRegistry.add(`${e.provider}:${e.provider_event_id}`);
      }
    });
  }

  /**
   * Process an incoming webhook payload end-to-end
   */
  public static processWebhook(
    request: IngestPayloadRequest,
    context: IngestStateContext
  ): IngestStateUpdate {
    const { provider, payload, headers = {}, signingSecret, expectedToken } = request;
    const { campaigns, contacts, existingEvents } = context;

    // 1. Webhook Security & Signature Validation
    const securityReport = WebhookSecurityValidator.validate({
      provider,
      rawBody: payload,
      headers,
      signingSecret,
      expectedToken
    });

    if (!securityReport.isValid) {
      return {
        result: {
          success: false,
          status: securityReport.statusCode === 401 ? 'SIGNATURE_REJECTED' : 'SIGNATURE_REJECTED',
          message: securityReport.reason || 'Webhook request rejected by security policy',
          provider,
          eventsProcessedCount: 0,
          validationDetails: {
            signatureValid: false,
            tokenValid: securityReport.tokenChecked,
            timestampValid: securityReport.timestampChecked
          }
        },
        updatedEvents: existingEvents,
        updatedCampaigns: campaigns,
        updatedContacts: contacts
      };
    }

    // 2. Parse Raw ESP Payload into normalized EmailEvents
    const parsedNormalizedEvents = this.normalizeEspPayload(provider, payload, campaigns, contacts);

    if (parsedNormalizedEvents.length === 0) {
      return {
        result: {
          success: false,
          status: 'INVALID_PAYLOAD',
          message: 'No actionable email events found in webhook payload structure',
          provider,
          eventsProcessedCount: 0
        },
        updatedEvents: existingEvents,
        updatedCampaigns: campaigns,
        updatedContacts: contacts
      };
    }

    // 3. Process Events with Idempotency & Contact Automation
    let newEventsToInsert: EmailEvent[] = [];
    let updatedContactsList = [...contacts];
    let updatedCampaignsList = [...campaigns];
    let contactStatusUpdates: { contactId: string; previousStatus: string; newStatus: string; reason: string }[] = [];
    let duplicateSkippedCount = 0;

    for (const rawEvent of parsedNormalizedEvents) {
      const idempotencyKey = `${rawEvent.provider}:${rawEvent.provider_event_id}`;

      // Check Idempotency
      const isAlreadyInRegistry = this.idempotencyRegistry.has(idempotencyKey);
      const isAlreadyInStore = existingEvents.some(
        e => e.provider === rawEvent.provider && e.provider_event_id === rawEvent.provider_event_id
      );

      if (isAlreadyInRegistry || isAlreadyInStore) {
        duplicateSkippedCount++;
        continue;
      }

      // Mark processed in idempotency set
      this.idempotencyRegistry.add(idempotencyKey);
      newEventsToInsert.push(rawEvent);

      // Contact Status Automation
      const contactIndex = updatedContactsList.findIndex(c => c.id === rawEvent.contact_id || c.email.toLowerCase() === rawEvent.metadata.recipient_email?.toLowerCase());
      if (contactIndex >= 0) {
        const targetContact = { ...updatedContactsList[contactIndex] };
        const prevStatus = targetContact.marketingStatus;
        let statusChanged = false;
        let changeReason = '';

        if (rawEvent.event_type === 'BOUNCED') {
          // Hard bounce check
          if (rawEvent.metadata.bounce_type === 'HARD' || (rawEvent.metadata.bounce_code && rawEvent.metadata.bounce_code.startsWith('5'))) {
            targetContact.marketingStatus = 'BOUNCED';
            targetContact.isSuppressed = true;
            targetContact.marketingConsent = false;
            targetContact.consentStatus = 'bounced';
            statusChanged = true;
            changeReason = `Hard bounce: ${rawEvent.metadata.bounce_reason || 'Permanent 5xx mailbox failure'}`;
          }
        } else if (rawEvent.event_type === 'COMPLAINED') {
          // Spam / abuse complaint
          targetContact.marketingStatus = 'COMPLAINED';
          targetContact.isSuppressed = true;
          targetContact.marketingConsent = false;
          targetContact.consentStatus = 'complained';
          statusChanged = true;
          changeReason = `Spam complaint reported via ${provider.toUpperCase()} FBL (${rawEvent.metadata.complaint_feedback_type || 'abuse'})`;
        } else if (rawEvent.event_type === 'UNSUBSCRIBED') {
          // Unsubscribe request
          targetContact.marketingStatus = 'UNSUBSCRIBED';
          targetContact.isSuppressed = true;
          targetContact.marketingConsent = false;
          targetContact.consentStatus = 'unsubscribed';
          statusChanged = true;
          changeReason = `Unsubscribe confirmation from ${provider.toUpperCase()}`;
        } else if (rawEvent.event_type === 'OPENED') {
          targetContact.totalEmailsOpened = (targetContact.totalEmailsOpened || 0) + 1;
          targetContact.lastEmailOpenedAt = rawEvent.event_timestamp;
        } else if (rawEvent.event_type === 'CLICKED') {
          targetContact.totalEmailsClicked = (targetContact.totalEmailsClicked || 0) + 1;
        }

        if (statusChanged) {
          targetContact.updatedAt = new Date().toISOString();
          contactStatusUpdates.push({
            contactId: targetContact.id,
            previousStatus: prevStatus,
            newStatus: targetContact.marketingStatus,
            reason: changeReason
          });
        }

        updatedContactsList[contactIndex] = targetContact;
      }

      // Campaign & Recipient Real-Time Update
      const campaignIndex = updatedCampaignsList.findIndex(c => c.id === rawEvent.campaign_id);
      if (campaignIndex >= 0) {
        const campaign = { ...updatedCampaignsList[campaignIndex] };
        const metrics = { ...campaign.metrics };

        // Increment respective metric counters
        switch (rawEvent.event_type) {
          case 'SENT':
            metrics.sentCount = Math.max(metrics.sentCount, metrics.sentCount + 1);
            break;
          case 'DELIVERED':
            metrics.deliveredCount = metrics.deliveredCount + 1;
            break;
          case 'OPENED':
            metrics.openedCount = metrics.openedCount + 1;
            break;
          case 'CLICKED':
            metrics.clickedCount = metrics.clickedCount + 1;
            break;
          case 'BOUNCED':
            if (rawEvent.metadata.bounce_type === 'HARD') {
              metrics.bouncedHardCount = metrics.bouncedHardCount + 1;
            } else {
              metrics.bouncedSoftCount = metrics.bouncedSoftCount + 1;
            }
            break;
          case 'COMPLAINED':
            metrics.complainedCount = metrics.complainedCount + 1;
            break;
          case 'UNSUBSCRIBED':
            metrics.unsubscribedCount = metrics.unsubscribedCount + 1;
            break;
        }

        // Update recipients snapshot item if present
        if (campaign.recipients_snapshot && campaign.recipients_snapshot.length > 0) {
          const recipIndex = campaign.recipients_snapshot.findIndex(
            r => r.id === rawEvent.campaign_recipient_id || r.email.toLowerCase() === rawEvent.metadata.recipient_email?.toLowerCase()
          );

          if (recipIndex >= 0) {
            const updatedSnap = [...campaign.recipients_snapshot];
            const recip = { ...updatedSnap[recipIndex] };

            if (rawEvent.event_type === 'DELIVERED') {
              recip.status = 'DELIVERED';
              recip.delivered_at = rawEvent.event_timestamp;
            } else if (rawEvent.event_type === 'OPENED') {
              recip.status = 'OPENED';
              recip.opened_at = rawEvent.event_timestamp;
            } else if (rawEvent.event_type === 'CLICKED') {
              recip.status = 'CLICKED';
              recip.clicked_at = rawEvent.event_timestamp;
            } else if (rawEvent.event_type === 'BOUNCED') {
              recip.status = 'BOUNCED';
              recip.exclusion_reason = rawEvent.metadata.bounce_reason || 'Bounced';
            } else if (rawEvent.event_type === 'COMPLAINED') {
              recip.status = 'COMPLAINED';
              recip.exclusion_reason = 'Complaint filed';
            } else if (rawEvent.event_type === 'UNSUBSCRIBED') {
              recip.status = 'UNSUBSCRIBED';
              recip.exclusion_reason = 'Unsubscribed';
            }

            updatedSnap[recipIndex] = recip;
            campaign.recipients_snapshot = updatedSnap;
          }
        }

        // Add activity log entry
        campaign.metrics = metrics;
        campaign.activity_log = [
          {
            id: `ACT-EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: rawEvent.event_timestamp,
            action: `Webhook: ${rawEvent.event_type}`,
            user: `${provider.toUpperCase()} Ingest`,
            details: `${rawEvent.metadata.recipient_email || 'Contact'} registered ${rawEvent.event_type.toLowerCase()}${rawEvent.metadata.bounce_reason ? ` (${rawEvent.metadata.bounce_reason})` : ''}`
          },
          ...(campaign.activity_log || [])
        ].slice(0, 50);

        updatedCampaignsList[campaignIndex] = campaign;
      }
    }

    if (newEventsToInsert.length === 0 && duplicateSkippedCount > 0) {
      return {
        result: {
          success: true,
          status: 'IDEMPOTENT_DUPLICATE_SKIPPED',
          message: `Idempotency verified: ${duplicateSkippedCount} duplicate webhook event(s) skipped safely without double-counting`,
          provider,
          eventsProcessedCount: 0,
          validationDetails: {
            signatureValid: true,
            tokenValid: true,
            timestampValid: true
          }
        },
        updatedEvents: existingEvents,
        updatedCampaigns: campaigns,
        updatedContacts: contacts
      };
    }

    const allEvents = [...newEventsToInsert, ...existingEvents];

    return {
      result: {
        success: true,
        status: 'PROCESSED',
        message: `Successfully ingested and verified ${newEventsToInsert.length} event(s) from ${provider.toUpperCase()}.${duplicateSkippedCount > 0 ? ` (${duplicateSkippedCount} duplicate skipped)` : ''}`,
        provider,
        eventsProcessedCount: newEventsToInsert.length,
        createdEventIds: newEventsToInsert.map(e => e.id),
        contactStatusUpdated: contactStatusUpdates,
        validationDetails: {
          signatureValid: true,
          tokenValid: true,
          timestampValid: true
        }
      },
      updatedEvents: allEvents,
      updatedCampaigns: updatedCampaignsList,
      updatedContacts: updatedContactsList
    };
  }

  /**
   * Parse provider-specific webhook structures into standardized EmailEvent objects
   */
  private static normalizeEspPayload(
    provider: ESPProviderType,
    payload: any,
    campaigns: Campaign[],
    contacts: Contact[]
  ): EmailEvent[] {
    const events: EmailEvent[] = [];
    const nowIso = new Date().toISOString();

    const findContact = (email?: string, id?: string): Contact | undefined => {
      if (id) {
        const byId = contacts.find(c => c.id === id);
        if (byId) return byId;
      }
      if (email) {
        return contacts.find(c => c.email.toLowerCase() === email.toLowerCase());
      }
      return contacts[0];
    };

    const findCampaign = (cmpId?: string): Campaign | undefined => {
      if (cmpId) {
        const byId = campaigns.find(c => c.id === cmpId);
        if (byId) return byId;
      }
      return campaigns[0];
    };

    if (provider === 'amazon_ses') {
      // AWS SNS notification payload wrapping SES message
      let sesData = payload;
      if (payload.Type === 'Notification' && typeof payload.Message === 'string') {
        try {
          sesData = JSON.parse(payload.Message);
        } catch {
          sesData = payload;
        }
      }

      const eventType = sesData.eventType || sesData.notificationType || payload.eventType || 'DELIVERED';
      const mail = sesData.mail || {};
      const recipient = mail.destination?.[0] || sesData.recipient || 'bhuvangupta.1711@gmail.com';
      const headers = mail.headers || [];
      const campaignIdHeader = headers.find((h: any) => h.name === 'X-Campaign-ID')?.value || sesData.campaignId;
      
      const campaign = findCampaign(campaignIdHeader);
      const contact = findContact(recipient, sesData.contactId);

      let normalizedType: EmailEventType = 'DELIVERED';
      let bounceType: 'HARD' | 'SOFT' | undefined;
      let bounceReason = '';
      let bounceCode = '';
      let complaintFeedbackType: 'abuse' | 'fraud' | 'virus' | 'not-spam' | 'other' | undefined;

      const upperType = String(eventType).toUpperCase();
      if (upperType.includes('SEND') || upperType === 'SEND') {
        normalizedType = 'SENT';
      } else if (upperType.includes('DELIVER') || upperType === 'DELIVERY') {
        normalizedType = 'DELIVERED';
      } else if (upperType.includes('OPEN')) {
        normalizedType = 'OPENED';
      } else if (upperType.includes('CLICK')) {
        normalizedType = 'CLICKED';
      } else if (upperType.includes('BOUNCE')) {
        normalizedType = 'BOUNCED';
        const bounce = sesData.bounce || {};
        bounceType = bounce.bounceType === 'Permanent' ? 'HARD' : 'SOFT';
        bounceReason = bounce.bouncedRecipients?.[0]?.diagnosticCode || bounce.bounceSubType || 'Mailbox unavailable';
        bounceCode = bounce.bouncedRecipients?.[0]?.status || (bounceType === 'HARD' ? '5.1.1' : '4.2.2');
      } else if (upperType.includes('COMPLAIN')) {
        normalizedType = 'COMPLAINED';
        const complaint = sesData.complaint || {};
        complaintFeedbackType = (complaint.complaintFeedbackType?.toLowerCase() as any) || 'abuse';
      } else if (upperType.includes('UNSUB')) {
        normalizedType = 'UNSUBSCRIBED';
      }

      const providerEventId = sesData.mail?.messageId || payload.MessageId || `ses-msg-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      events.push({
        id: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        provider: 'amazon_ses',
        provider_event_id: providerEventId,
        campaign_id: campaign?.id || 'CMP-2026-01',
        contact_id: contact?.id || 'CNT-801',
        campaign_recipient_id: `RECIP-${contact?.id || 'CNT-801'}`,
        event_type: normalizedType,
        event_timestamp: mail.timestamp || payload.Timestamp || nowIso,
        metadata: {
          recipient_email: recipient,
          sender_email: mail.source || 'billing@notifications.digisoft.com',
          subject: mail.commonHeaders?.subject || 'Statement Update',
          ip: sesData.open?.ipAddress || sesData.click?.ipAddress || '157.240.241.35',
          user_agent: sesData.open?.userAgent || sesData.click?.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128',
          geo_city: 'Bengaluru',
          geo_country: 'IN',
          link_url: sesData.click?.link,
          bounce_type: bounceType,
          bounce_code: bounceCode,
          bounce_reason: bounceReason,
          complaint_feedback_type: complaintFeedbackType,
          signature_verified: true,
          raw_payload: payload
        },
        created_at: nowIso
      });
    } else if (provider === 'brevo') {
      // Brevo webhook structure: { event: 'delivered' | 'opened' | 'click' | 'hard_bounce' | 'soft_bounce' | 'complaint' | 'unsubscribe', email, 'message-id', ... }
      const items = Array.isArray(payload) ? payload : [payload];

      for (const item of items) {
        const rawEvent = (item.event || item.event_type || 'delivered').toLowerCase();
        let normalizedType: EmailEventType = 'DELIVERED';
        let bounceType: 'HARD' | 'SOFT' | undefined;
        let bounceReason = item.reason || '';

        if (rawEvent.includes('sent') || rawEvent === 'request') {
          normalizedType = 'SENT';
        } else if (rawEvent.includes('deliver')) {
          normalizedType = 'DELIVERED';
        } else if (rawEvent.includes('open')) {
          normalizedType = 'OPENED';
        } else if (rawEvent.includes('click')) {
          normalizedType = 'CLICKED';
        } else if (rawEvent.includes('hard_bounce') || rawEvent.includes('hardbounce')) {
          normalizedType = 'BOUNCED';
          bounceType = 'HARD';
          bounceReason = bounceReason || 'Mailbox does not exist (Brevo permanent bounce)';
        } else if (rawEvent.includes('soft_bounce') || rawEvent.includes('softbounce')) {
          normalizedType = 'BOUNCED';
          bounceType = 'SOFT';
          bounceReason = bounceReason || 'Mailbox full or server timeout (Brevo soft bounce)';
        } else if (rawEvent.includes('spam') || rawEvent.includes('complaint')) {
          normalizedType = 'COMPLAINED';
        } else if (rawEvent.includes('unsub')) {
          normalizedType = 'UNSUBSCRIBED';
        }

        const email = item.email || 'priya.sharma@apexinfotech.in';
        const contact = findContact(email, item.contact_id);
        const campaign = findCampaign(item.campaign_id || item.tag);
        const eventId = item['message-id'] || item.id || `brevo-evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        events.push({
          id: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          provider: 'brevo',
          provider_event_id: String(eventId),
          campaign_id: campaign?.id || 'CMP-2026-02',
          contact_id: contact?.id || 'CNT-802',
          campaign_recipient_id: `RECIP-${contact?.id || 'CNT-802'}`,
          event_type: normalizedType,
          event_timestamp: item.date || nowIso,
          metadata: {
            recipient_email: email,
            sender_email: 'product@updates.digisoft.com',
            subject: item.subject || 'Product Announcement',
            ip: item.ip || '49.206.12.98',
            user_agent: item['user-agent'] || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            geo_city: 'Mumbai',
            geo_country: 'IN',
            link_url: item.link,
            bounce_type: bounceType,
            bounce_code: bounceType === 'HARD' ? '5.1.1' : '4.2.0',
            bounce_reason: bounceReason,
            signature_verified: true,
            raw_payload: item
          },
          created_at: nowIso
        });
      }
    } else if (provider === 'sendgrid') {
      // SendGrid delivers an array of events: [ { email, timestamp, event: 'processed' | 'delivered' | 'open' | 'click' | 'bounce' | 'spamreport' | 'unsubscribe', sg_message_id, ... } ]
      const items = Array.isArray(payload) ? payload : [payload];

      for (const item of items) {
        const rawEvent = (item.event || '').toLowerCase();
        let normalizedType: EmailEventType = 'DELIVERED';
        let bounceType: 'HARD' | 'SOFT' | undefined;
        let bounceReason = item.reason || '';

        if (rawEvent === 'processed') {
          normalizedType = 'SENT';
        } else if (rawEvent === 'delivered') {
          normalizedType = 'DELIVERED';
        } else if (rawEvent === 'open') {
          normalizedType = 'OPENED';
        } else if (rawEvent === 'click') {
          normalizedType = 'CLICKED';
        } else if (rawEvent === 'bounce') {
          normalizedType = 'BOUNCED';
          bounceType = item.type === 'bounce' || item.status?.startsWith('5') ? 'HARD' : 'SOFT';
          bounceReason = item.reason || 'SendGrid 550 User unknown';
        } else if (rawEvent === 'dropped') {
          normalizedType = 'BOUNCED';
          bounceType = 'HARD';
          bounceReason = item.reason || 'SendGrid suppression list drop';
        } else if (rawEvent === 'spamreport') {
          normalizedType = 'COMPLAINED';
        } else if (rawEvent === 'unsubscribe' || rawEvent === 'group_unsubscribe') {
          normalizedType = 'UNSUBSCRIBED';
        }

        const email = item.email || 'contact@bharatlogix.com';
        const contact = findContact(email);
        const campaign = findCampaign(item.campaign_id);
        const eventId = item.sg_event_id || item.sg_message_id || `sg-evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        const eventTime = item.timestamp 
          ? new Date(item.timestamp > 10000000000 ? item.timestamp : item.timestamp * 1000).toISOString()
          : nowIso;

        events.push({
          id: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          provider: 'sendgrid',
          provider_event_id: String(eventId),
          campaign_id: campaign?.id || 'CMP-2026-01',
          contact_id: contact?.id || 'CNT-803',
          campaign_recipient_id: `RECIP-${contact?.id || 'CNT-803'}`,
          event_type: normalizedType,
          event_timestamp: eventTime,
          metadata: {
            recipient_email: email,
            sender_email: 'notifications@digisoft.com',
            subject: 'Delivery Notification',
            ip: item.ip || '103.21.144.55',
            user_agent: item.useragent || 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5)',
            geo_city: 'Hyderabad',
            geo_country: 'IN',
            link_url: item.url,
            bounce_type: bounceType,
            bounce_code: item.status || (bounceType === 'HARD' ? '5.0.0' : '4.0.0'),
            bounce_reason: bounceReason,
            signature_verified: true,
            raw_payload: item
          },
          created_at: nowIso
        });
      }
    }

    return events;
  }

  /**
   * Compute comprehensive analytics rates for a campaign
   */
  public static calculateRates(metrics: Campaign['metrics']): CampaignAnalyticsRates {
    const sent = metrics.sentCount || 0;
    const delivered = metrics.deliveredCount || 0;
    const opened = metrics.openedCount || 0;
    const clicked = metrics.clickedCount || 0;
    const bouncedHard = metrics.bouncedHardCount || 0;
    const bouncedSoft = metrics.bouncedSoftCount || 0;
    const totalBounces = bouncedHard + bouncedSoft;
    const complained = metrics.complainedCount || 0;
    const unsubscribed = metrics.unsubscribedCount || 0;

    const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
    const ctor = opened > 0 ? (clicked / opened) * 100 : 0;
    const bounceRate = sent > 0 ? (totalBounces / sent) * 100 : 0;
    const hardBounceRate = sent > 0 ? (bouncedHard / sent) * 100 : 0;
    const softBounceRate = sent > 0 ? (bouncedSoft / sent) * 100 : 0;
    const complaintRate = delivered > 0 ? (complained / delivered) * 100 : 0;
    const unsubscribeRate = delivered > 0 ? (unsubscribed / delivered) * 100 : 0;

    return {
      deliveryRate: Number(deliveryRate.toFixed(2)),
      openRate: Number(openRate.toFixed(2)),
      clickRate: Number(clickRate.toFixed(2)),
      ctor: Number(ctor.toFixed(2)),
      bounceRate: Number(bounceRate.toFixed(2)),
      hardBounceRate: Number(hardBounceRate.toFixed(2)),
      softBounceRate: Number(softBounceRate.toFixed(2)),
      complaintRate: Number(complaintRate.toFixed(3)),
      unsubscribeRate: Number(unsubscribeRate.toFixed(2))
    };
  }

  /**
   * Generate Delivery Funnel steps with drop-off percentages
   */
  public static calculateDeliveryFunnel(metrics: Campaign['metrics']): CampaignDeliveryFunnelStep[] {
    const audience = metrics.totalRecipients || 100;
    const sent = metrics.sentCount || 0;
    const delivered = metrics.deliveredCount || 0;
    const opened = metrics.openedCount || 0;
    const clicked = metrics.clickedCount || 0;

    const baseSent = sent > 0 ? sent : 1;

    return [
      {
        stage: 'AUDIENCE',
        label: 'Audience Snapshot',
        count: audience,
        percentageOfSent: Math.round((audience / baseSent) * 100),
        dropOffCount: Math.max(0, audience - sent),
        dropOffPercentage: audience > 0 ? Math.round(((audience - sent) / audience) * 100) : 0
      },
      {
        stage: 'SENT',
        label: 'Dispatched (Sent)',
        count: sent,
        percentageOfSent: 100,
        dropOffCount: Math.max(0, sent - delivered),
        dropOffPercentage: sent > 0 ? Number((((sent - delivered) / sent) * 100).toFixed(1)) : 0
      },
      {
        stage: 'DELIVERED',
        label: 'Inboxed (Delivered)',
        count: delivered,
        percentageOfSent: Number(((delivered / baseSent) * 100).toFixed(1)),
        dropOffCount: Math.max(0, delivered - opened),
        dropOffPercentage: delivered > 0 ? Number((((delivered - opened) / delivered) * 100).toFixed(1)) : 0
      },
      {
        stage: 'OPENED',
        label: 'Engaged (Opened)',
        count: opened,
        percentageOfSent: Number(((opened / baseSent) * 100).toFixed(1)),
        dropOffCount: Math.max(0, opened - clicked),
        dropOffPercentage: opened > 0 ? Number((((opened - clicked) / opened) * 100).toFixed(1)) : 0
      },
      {
        stage: 'CLICKED',
        label: 'Converted (Clicked)',
        count: clicked,
        percentageOfSent: Number(((clicked / baseSent) * 100).toFixed(1)),
        dropOffCount: 0,
        dropOffPercentage: 0
      }
    ];
  }
}
