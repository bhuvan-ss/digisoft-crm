/**
 * DIGISOFT CRM - Phase 9 Initial Email Events & Webhook Configurations
 * Realistic seed data for historical events, endpoints, and mock payloads.
 */

import { EmailEvent, WebhookEndpointConfig } from '../types';

export const INITIAL_WEBHOOK_CONFIGS: WebhookEndpointConfig[] = [
  {
    id: 'WH-SES-01',
    provider: 'amazon_ses',
    providerName: 'Amazon SES (AWS SNS Notification)',
    endpointUrl: 'https://crm.digisoft.internal/api/webhooks/ses',
    signingSecret: 'aws_sns_sig_key_live_2026_9941a',
    verificationToken: 'ses_token_v4_secret_auth',
    isActive: true,
    createdAt: '2026-08-01T08:00:00Z',
    lastEventReceivedAt: '2026-09-04T19:45:00Z',
    totalEventsProcessed: 1420,
    duplicateEventsSkipped: 38,
    rejectedSignaturesCount: 2
  },
  {
    id: 'WH-BREVO-02',
    provider: 'brevo',
    providerName: 'Brevo (Transactional & Marketing Webhooks)',
    endpointUrl: 'https://crm.digisoft.internal/api/webhooks/brevo',
    signingSecret: 'brevo_wh_sec_991823ab_c889f',
    verificationToken: 'brevo_bearer_auth_prod_token',
    isActive: true,
    createdAt: '2026-08-05T09:30:00Z',
    lastEventReceivedAt: '2026-09-04T18:10:00Z',
    totalEventsProcessed: 890,
    duplicateEventsSkipped: 19,
    rejectedSignaturesCount: 0
  },
  {
    id: 'WH-SG-03',
    provider: 'sendgrid',
    providerName: 'SendGrid Event Webhook (Twilio ECDSA)',
    endpointUrl: 'https://crm.digisoft.internal/api/webhooks/sendgrid',
    signingSecret: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE23_sendgrid_live_key',
    verificationToken: 'sg_event_webhook_token_7701',
    isActive: true,
    createdAt: '2026-08-10T12:00:00Z',
    lastEventReceivedAt: '2026-09-04T17:22:00Z',
    totalEventsProcessed: 640,
    duplicateEventsSkipped: 14,
    rejectedSignaturesCount: 1
  }
];

export const INITIAL_EMAIL_EVENTS: EmailEvent[] = [
  // CMP-2026-01 (SES) events
  {
    id: 'EVT-1001',
    provider: 'amazon_ses',
    provider_event_id: 'ses-msg-0100018f4a-9b11-4a21-9d2a-431889a7101',
    campaign_id: 'CMP-2026-01',
    contact_id: 'CNT-801',
    campaign_recipient_id: 'RECIP-CNT-801',
    event_type: 'CLICKED',
    event_timestamp: '2026-09-04T19:45:12Z',
    metadata: {
      recipient_email: 'bhuvangupta.1711@gmail.com',
      sender_email: 'billing@notifications.digisoft.com',
      subject: 'Urgent: Account Ledger Reconciliation Required for Apex Infotech',
      ip: '103.21.144.12',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128',
      geo_city: 'Bengaluru',
      geo_country: 'IN',
      link_url: 'https://crm.digisoft.internal/portal/reconcile?invoice=INV-2026-901',
      link_id: 'btn-reconcile-portal',
      signature_verified: true
    },
    created_at: '2026-09-04T19:45:12Z'
  },
  {
    id: 'EVT-1002',
    provider: 'amazon_ses',
    provider_event_id: 'ses-msg-0100018f4a-9b11-4a21-9d2a-431889a7102',
    campaign_id: 'CMP-2026-01',
    contact_id: 'CNT-801',
    campaign_recipient_id: 'RECIP-CNT-801',
    event_type: 'OPENED',
    event_timestamp: '2026-09-04T19:42:05Z',
    metadata: {
      recipient_email: 'bhuvangupta.1711@gmail.com',
      sender_email: 'billing@notifications.digisoft.com',
      subject: 'Urgent: Account Ledger Reconciliation Required for Apex Infotech',
      ip: '103.21.144.12',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128',
      geo_city: 'Bengaluru',
      geo_country: 'IN',
      signature_verified: true
    },
    created_at: '2026-09-04T19:42:05Z'
  },
  {
    id: 'EVT-1003',
    provider: 'amazon_ses',
    provider_event_id: 'ses-msg-0100018f4a-9b11-4a21-9d2a-431889a7103',
    campaign_id: 'CMP-2026-01',
    contact_id: 'CNT-801',
    campaign_recipient_id: 'RECIP-CNT-801',
    event_type: 'DELIVERED',
    event_timestamp: '2026-09-04T19:40:02Z',
    metadata: {
      recipient_email: 'bhuvangupta.1711@gmail.com',
      sender_email: 'billing@notifications.digisoft.com',
      subject: 'Urgent: Account Ledger Reconciliation Required for Apex Infotech',
      ip: '157.240.241.35',
      latency_ms: 380,
      signature_verified: true
    },
    created_at: '2026-09-04T19:40:02Z'
  },
  {
    id: 'EVT-1004',
    provider: 'amazon_ses',
    provider_event_id: 'ses-msg-0100018f4a-9b11-4a21-9d2a-431889a7104',
    campaign_id: 'CMP-2026-01',
    contact_id: 'CNT-802',
    campaign_recipient_id: 'RECIP-CNT-802',
    event_type: 'OPENED',
    event_timestamp: '2026-09-04T19:20:10Z',
    metadata: {
      recipient_email: 'priya.sharma@apexinfotech.in',
      sender_email: 'billing@notifications.digisoft.com',
      subject: 'Urgent: Account Ledger Reconciliation Required for Apex Infotech',
      ip: '49.206.12.98',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      geo_city: 'Bengaluru',
      geo_country: 'IN',
      signature_verified: true
    },
    created_at: '2026-09-04T19:20:10Z'
  },
  {
    id: 'EVT-1005',
    provider: 'amazon_ses',
    provider_event_id: 'ses-msg-0100018f4a-9b11-4a21-9d2a-431889a7105',
    campaign_id: 'CMP-2026-01',
    contact_id: 'CNT-804',
    campaign_recipient_id: 'RECIP-CNT-804',
    event_type: 'BOUNCED',
    event_timestamp: '2026-09-04T18:50:30Z',
    metadata: {
      recipient_email: 'accounts@bharatlogix.com',
      sender_email: 'billing@notifications.digisoft.com',
      subject: 'Urgent: Account Ledger Reconciliation Required',
      bounce_type: 'HARD',
      bounce_code: '5.1.1',
      bounce_reason: 'smtp; 550 5.1.1 <accounts@bharatlogix.com>: Recipient address rejected: User unknown in virtual mailbox table',
      diagnostic_code: 'Amazon SES 550 Mailbox does not exist',
      signature_verified: true
    },
    created_at: '2026-09-04T18:50:30Z'
  },
  {
    id: 'EVT-1006',
    provider: 'brevo',
    provider_event_id: 'brevo-evt-88291039-441a',
    campaign_id: 'CMP-2026-02',
    contact_id: 'CNT-803',
    campaign_recipient_id: 'RECIP-CNT-803',
    event_type: 'CLICKED',
    event_timestamp: '2026-09-04T18:10:45Z',
    metadata: {
      recipient_email: 'contact@bharatlogix.com',
      sender_email: 'product@updates.digisoft.com',
      subject: 'Introducing Real-time TallyPrime Bi-Directional Synchronization in CRM 2.4',
      ip: '115.112.89.44',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5) Mobile/15E148',
      geo_city: 'Mumbai',
      geo_country: 'IN',
      link_url: 'https://digisoft.in/demo/tally-sync-v24',
      signature_verified: true
    },
    created_at: '2026-09-04T18:10:45Z'
  },
  {
    id: 'EVT-1007',
    provider: 'brevo',
    provider_event_id: 'brevo-evt-88291039-441b',
    campaign_id: 'CMP-2026-02',
    contact_id: 'CNT-805',
    campaign_recipient_id: 'RECIP-CNT-805',
    event_type: 'UNSUBSCRIBED',
    event_timestamp: '2026-09-04T17:40:00Z',
    metadata: {
      recipient_email: 'dr.srinivas@zenithpharma.org',
      sender_email: 'product@updates.digisoft.com',
      subject: 'Introducing Real-time TallyPrime Bi-Directional Synchronization in CRM 2.4',
      ip: '14.139.60.2',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      geo_city: 'Hyderabad',
      geo_country: 'IN',
      signature_verified: true
    },
    created_at: '2026-09-04T17:40:00Z'
  },
  {
    id: 'EVT-1008',
    provider: 'sendgrid',
    provider_event_id: 'sg-evt-881920-aa91',
    campaign_id: 'CMP-2026-01',
    contact_id: 'CNT-806',
    campaign_recipient_id: 'RECIP-CNT-806',
    event_type: 'COMPLAINED',
    event_timestamp: '2026-09-04T17:22:15Z',
    metadata: {
      recipient_email: 'r.natarajan@kaveriengg.in',
      sender_email: 'billing@notifications.digisoft.com',
      subject: 'Urgent: Account Ledger Reconciliation Required',
      complaint_feedback_type: 'abuse',
      ip: '122.164.240.10',
      geo_city: 'Chennai',
      geo_country: 'IN',
      signature_verified: true
    },
    created_at: '2026-09-04T17:22:15Z'
  },
  {
    id: 'EVT-1009',
    provider: 'amazon_ses',
    provider_event_id: 'ses-msg-0100018f4a-9b11-4a21-9d2a-431889a7109',
    campaign_id: 'CMP-2026-01',
    contact_id: 'CNT-807',
    campaign_recipient_id: 'RECIP-CNT-807',
    event_type: 'BOUNCED',
    event_timestamp: '2026-09-04T16:15:00Z',
    metadata: {
      recipient_email: 'finance@skylinecloud.io',
      sender_email: 'billing@notifications.digisoft.com',
      subject: 'Urgent: Account Ledger Reconciliation Required',
      bounce_type: 'SOFT',
      bounce_code: '4.2.2',
      bounce_reason: 'smtp; 452 4.2.2 Mailbox full / quota exceeded temporary backoff',
      signature_verified: true
    },
    created_at: '2026-09-04T16:15:00Z'
  },
  {
    id: 'EVT-1010',
    provider: 'amazon_ses',
    provider_event_id: 'ses-msg-0100018f4a-9b11-4a21-9d2a-431889a7110',
    campaign_id: 'CMP-2026-01',
    contact_id: 'CNT-802',
    campaign_recipient_id: 'RECIP-CNT-802',
    event_type: 'CLICKED',
    event_timestamp: '2026-09-04T16:05:00Z',
    metadata: {
      recipient_email: 'priya.sharma@apexinfotech.in',
      sender_email: 'billing@notifications.digisoft.com',
      subject: 'Urgent: Account Ledger Reconciliation Required for Apex Infotech',
      ip: '49.206.12.98',
      link_url: 'https://crm.digisoft.internal/portal/reconcile?invoice=INV-2026-901',
      link_id: 'btn-reconcile-portal',
      signature_verified: true
    },
    created_at: '2026-09-04T16:05:00Z'
  }
];

export const SAMPLE_WEBHOOK_PAYLOADS = {
  amazon_ses: {
    delivery: {
      Type: "Notification",
      MessageId: "22b80bf7-4e2a-4cd3-8f0a-1123456789ab",
      TopicArn: "arn:aws:sns:ap-south-1:123456789012:ses-delivery-events",
      SigningCertURL: "https://sns.ap-south-1.amazonaws.com/SimpleNotificationService-f3ecfb7224c7233fe7bb5f59f96de52f.pem",
      Signature: "kL9d8X2A1b==MOCK_VALID_SES_SIGNATURE",
      Timestamp: new Date().toISOString(),
      Message: JSON.stringify({
        eventType: "Delivery",
        mail: {
          timestamp: new Date().toISOString(),
          messageId: `ses-msg-delivery-${Date.now()}`,
          source: "billing@notifications.digisoft.com",
          destination: ["bhuvangupta.1711@gmail.com"],
          headers: [{ name: "X-Campaign-ID", value: "CMP-2026-01" }]
        },
        delivery: {
          timestamp: new Date().toISOString(),
          processingTimeMillis: 342,
          recipients: ["bhuvangupta.1711@gmail.com"],
          smtpResponse: "250 2.0.0 OK 1725480000 d20si4129995pgr.112 - gsmtp"
        }
      })
    },
    open: {
      Type: "Notification",
      MessageId: "77a80bf7-4e2a-4cd3-8f0a-9988776655aa",
      TopicArn: "arn:aws:sns:ap-south-1:123456789012:ses-delivery-events",
      SigningCertURL: "https://sns.ap-south-1.amazonaws.com/SimpleNotificationService-f3ecfb7224c7233fe7bb5f59f96de52f.pem",
      Signature: "OPEN_VALID_SES_SIGNATURE_2026==",
      Timestamp: new Date().toISOString(),
      Message: JSON.stringify({
        eventType: "Open",
        mail: {
          timestamp: new Date().toISOString(),
          messageId: `ses-msg-open-${Date.now()}`,
          source: "billing@notifications.digisoft.com",
          destination: ["bhuvangupta.1711@gmail.com"],
          headers: [{ name: "X-Campaign-ID", value: "CMP-2026-01" }]
        },
        open: {
          timestamp: new Date().toISOString(),
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128",
          ipAddress: "103.21.144.12"
        }
      })
    },
    click: {
      Type: "Notification",
      MessageId: "99c80bf7-4e2a-4cd3-8f0a-4455667788bb",
      TopicArn: "arn:aws:sns:ap-south-1:123456789012:ses-delivery-events",
      SigningCertURL: "https://sns.ap-south-1.amazonaws.com/SimpleNotificationService-f3ecfb7224c7233fe7bb5f59f96de52f.pem",
      Signature: "CLICK_VALID_SES_SIGNATURE==",
      Timestamp: new Date().toISOString(),
      Message: JSON.stringify({
        eventType: "Click",
        mail: {
          timestamp: new Date().toISOString(),
          messageId: `ses-msg-click-${Date.now()}`,
          source: "billing@notifications.digisoft.com",
          destination: ["bhuvangupta.1711@gmail.com"],
          headers: [{ name: "X-Campaign-ID", value: "CMP-2026-01" }]
        },
        click: {
          timestamp: new Date().toISOString(),
          ipAddress: "103.21.144.12",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          link: "https://crm.digisoft.internal/portal/reconcile?ref=statement_btn"
        }
      })
    },
    hard_bounce: {
      Type: "Notification",
      MessageId: "44d80bf7-4e2a-4cd3-8f0a-0011223344cc",
      TopicArn: "arn:aws:sns:ap-south-1:123456789012:ses-delivery-events",
      SigningCertURL: "https://sns.ap-south-1.amazonaws.com/SimpleNotificationService-f3ecfb7224c7233fe7bb5f59f96de52f.pem",
      Signature: "BOUNCE_VALID_SES_SIGNATURE==",
      Timestamp: new Date().toISOString(),
      Message: JSON.stringify({
        eventType: "Bounce",
        bounce: {
          bounceType: "Permanent",
          bounceSubType: "General",
          bouncedRecipients: [{
            emailAddress: "accounts@bharatlogix.com",
            action: "failed",
            status: "5.1.1",
            diagnosticCode: "smtp; 550 5.1.1 User unknown / mailbox destroyed"
          }],
          timestamp: new Date().toISOString()
        },
        mail: {
          timestamp: new Date().toISOString(),
          messageId: `ses-msg-bounce-${Date.now()}`,
          source: "billing@notifications.digisoft.com",
          destination: ["accounts@bharatlogix.com"],
          headers: [{ name: "X-Campaign-ID", value: "CMP-2026-01" }]
        }
      })
    },
    complaint: {
      Type: "Notification",
      MessageId: "55e80bf7-4e2a-4cd3-8f0a-5566778899dd",
      TopicArn: "arn:aws:sns:ap-south-1:123456789012:ses-delivery-events",
      SigningCertURL: "https://sns.ap-south-1.amazonaws.com/SimpleNotificationService-f3ecfb7224c7233fe7bb5f59f96de52f.pem",
      Signature: "COMPLAINT_VALID_SES_SIGNATURE==",
      Timestamp: new Date().toISOString(),
      Message: JSON.stringify({
        eventType: "Complaint",
        complaint: {
          complainedRecipients: [{ emailAddress: "r.natarajan@kaveriengg.in" }],
          timestamp: new Date().toISOString(),
          feedbackId: "0100018f-complaint-feedback-90",
          complaintFeedbackType: "abuse"
        },
        mail: {
          timestamp: new Date().toISOString(),
          messageId: `ses-msg-complaint-${Date.now()}`,
          source: "billing@notifications.digisoft.com",
          destination: ["r.natarajan@kaveriengg.in"],
          headers: [{ name: "X-Campaign-ID", value: "CMP-2026-01" }]
        }
      })
    }
  },
  brevo: {
    delivered: {
      event: "delivered",
      email: "priya.sharma@apexinfotech.in",
      id: `brevo-${Date.now()}`,
      date: new Date().toISOString(),
      "message-id": `<202609041234.brevo.msg.${Date.now()}@smtp-relay.brevo.com>`,
      subject: "Introducing Real-time TallyPrime Bi-Directional Synchronization in CRM 2.4",
      tag: "CMP-2026-02"
    },
    open: {
      event: "opened",
      email: "priya.sharma@apexinfotech.in",
      id: `brevo-open-${Date.now()}`,
      date: new Date().toISOString(),
      "message-id": `<202609041234.brevo.open.${Date.now()}@smtp-relay.brevo.com>`,
      ip: "49.206.12.98",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      tag: "CMP-2026-02"
    },
    click: {
      event: "click",
      email: "contact@bharatlogix.com",
      id: `brevo-click-${Date.now()}`,
      date: new Date().toISOString(),
      "message-id": `<202609041234.brevo.click.${Date.now()}@smtp-relay.brevo.com>`,
      link: "https://digisoft.in/demo/tally-sync-v24",
      ip: "115.112.89.44",
      tag: "CMP-2026-02"
    },
    hard_bounce: {
      event: "hard_bounce",
      email: "dr.srinivas@zenithpharma.org",
      id: `brevo-bounce-${Date.now()}`,
      date: new Date().toISOString(),
      "message-id": `<202609041234.brevo.bounce.${Date.now()}@smtp-relay.brevo.com>`,
      reason: "550 5.1.1 Recipient mailbox rejected by remote server",
      tag: "CMP-2026-02"
    },
    unsubscribe: {
      event: "unsubscribe",
      email: "dr.srinivas@zenithpharma.org",
      id: `brevo-unsub-${Date.now()}`,
      date: new Date().toISOString(),
      "message-id": `<202609041234.brevo.unsub.${Date.now()}@smtp-relay.brevo.com>`,
      reason: "Recipient clicked one-click list unsubscribe header",
      tag: "CMP-2026-02"
    }
  },
  sendgrid: {
    batch: [
      {
        email: "bhuvangupta.1711@gmail.com",
        timestamp: Math.floor(Date.now() / 1000),
        event: "delivered",
        sg_event_id: `sg_evt_del_${Date.now()}`,
        sg_message_id: `sg_msg_id_${Date.now()}`,
        response: "250 2.0.0 OK",
        campaign_id: "CMP-2026-01"
      },
      {
        email: "bhuvangupta.1711@gmail.com",
        timestamp: Math.floor(Date.now() / 1000),
        event: "open",
        sg_event_id: `sg_evt_open_${Date.now()}`,
        sg_message_id: `sg_msg_id_${Date.now()}`,
        ip: "103.21.144.12",
        useragent: "Mozilla/5.0 Chrome/128",
        campaign_id: "CMP-2026-01"
      },
      {
        email: "bhuvangupta.1711@gmail.com",
        timestamp: Math.floor(Date.now() / 1000),
        event: "click",
        sg_event_id: `sg_evt_click_${Date.now()}`,
        sg_message_id: `sg_msg_id_${Date.now()}`,
        url: "https://crm.digisoft.internal/reconcile",
        ip: "103.21.144.12",
        campaign_id: "CMP-2026-01"
      }
    ]
  }
};
