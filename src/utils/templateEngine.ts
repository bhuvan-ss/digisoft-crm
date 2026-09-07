import { EmailTemplate, EmailTemplateId, StructuredEmailContent, Contact } from '../types';

export const EMAIL_TEMPLATES: Record<EmailTemplateId, EmailTemplate> = {
  tally_payment_reminder: {
    id: 'tally_payment_reminder',
    name: 'TallyPrime Ledger & Overdue Statement',
    category: 'Transactional / Finance',
    description: 'Finance-grade overdue payment reminder with ledger summary table and instant reconciliation CTA.',
    thumbnailColor: 'bg-amber-600',
    defaultContent: {
      subject: 'Account Statement & Outstanding Balance Update for {{company.name}}',
      preheader: 'Important financial ledger summary and payment settlement portal link.',
      headline: 'Account Reconciliation & Outstanding Notice',
      introduction: 'Dear {{contact.first_name}}, we value our continuing business association with {{company.name}}. This is a courteous reconciliation notice regarding pending ledger invoices synced directly from our TallyPrime financial ledger.',
      benefits: [
        'Total Verified Outstanding Balance: ₹{{tally.outstanding_balance}}',
        'Current Ageing Status: {{tally.overdue_days}} days past agreed credit terms',
        'Instant digital GST reconciliation credit receipt upon payment confirmation',
        'Direct automated ledger entry into TallyPrime within 15 minutes of clearance'
      ],
      ctaText: 'Review Ledger & Settle Now',
      ctaUrlSuggestion: 'https://portal.digisoft.com/finance/ledger?acc={{contact.id}}',
      secondaryText: 'If remittance has been made in the last 24 hours, kindly accept our thanks and ignore this message. For any invoice queries or TDS certificates, reply directly to accounts@digisoft.com.',
      deliverabilityAdvice: 'Uses neutral ledger reconciliation terminology that avoids financial spam blacklist filters.'
    },
    htmlGenerator: (content, preview) => generateTallyReminderHtml(content, preview)
  },

  product_announcement: {
    id: 'product_announcement',
    name: 'Product Launch & Feature Announcement',
    category: 'Marketing',
    description: 'High-impact enterprise product showcase with benefit cards, badges, and primary action button.',
    thumbnailColor: 'bg-indigo-600',
    defaultContent: {
      subject: 'Announcing DIGISOFT CRM 2.4: Real-time TallyPrime Sync & Campaign Automation',
      preheader: 'Discover how seamless financial sync and AI email automation will transform your workflow.',
      headline: 'Elevate Your Customer Operations to Enterprise Speed',
      introduction: 'Hello {{contact.first_name}}, we are thrilled to unveil the next generation of DIGISOFT CRM designed to empower teams at {{company.name}} with real-time financial synchronization and automated outreach.',
      benefits: [
        'Bi-directional TallyPrime synchronization with automatic ledger reconciliation',
        'AI-driven structured campaign drafting with responsive HTML generation',
        'Provider-independent ESP routing across Amazon SES, Brevo, and SendGrid',
        'Enterprise dynamic segmentation based on live customer revenue and overdue days'
      ],
      ctaText: 'Explore the Interactive Demo',
      ctaUrlSuggestion: 'https://portal.digisoft.com/platform/whats-new',
      secondaryText: 'Every account on DIGISOFT CRM now has full access to the new suite at no additional charge. Need a custom walkthrough? Our solution architects are ready to assist.',
      deliverabilityAdvice: 'Balanced 60:40 text-to-image ratio with verified SPF/DKIM headers ensures delivery to Primary tab.'
    },
    htmlGenerator: (content, preview) => generateProductLaunchHtml(content, preview)
  },

  customer_winback: {
    id: 'customer_winback',
    name: 'Customer Re-engagement & Winback',
    category: 'Retention',
    description: 'Personalized, consultative outreach to re-activate inactive leads and accounts with an exclusive incentive.',
    thumbnailColor: 'bg-emerald-600',
    defaultContent: {
      subject: 'We miss working with {{company.name}} – Here is an exclusive partnership update',
      preheader: 'A quick personal note and an exclusive renewal offer just for your team.',
      headline: 'Re-energize Your Business Partnership with Us',
      introduction: 'Hi {{contact.first_name}}, we noticed that {{company.name}} hasn’t connected with our team recently. Over the past few quarters, we’ve substantially upgraded our enterprise capabilities to deliver faster results with lower overhead.',
      benefits: [
        'Direct priority routing for all customer support and architectural advisory',
        'Complimentary 30-day premium feature upgrade upon account reactivation',
        'Updated bulk import with smart deduplication and GDPR consent management',
        'Dedicated onboarding specialist to align your TallyPrime sync requirements'
      ],
      ctaText: 'Reclaim Your Exclusive Upgrade',
      ctaUrlSuggestion: 'https://portal.digisoft.com/reactivate?client={{contact.id}}',
      secondaryText: 'We would love to schedule a brief 10-minute check-in call this Wednesday. Simply reply to this email with your preferred time slot.',
      deliverabilityAdvice: 'Warm conversational styling with low image dependency yields higher reply rates and inbox reputation.'
    },
    htmlGenerator: (content, preview) => generateWinbackHtml(content, preview)
  },

  monthly_newsletter: {
    id: 'monthly_newsletter',
    name: 'B2B Insights & Monthly Newsletter',
    category: 'Newsletter',
    description: 'Curated editorial template with market updates, tech tips, and company announcements.',
    thumbnailColor: 'bg-sky-600',
    defaultContent: {
      subject: 'The DIGISOFT Digest: Best Practices in Customer Deliverability & ERP Automation',
      preheader: 'Essential insights for modern B2B finance, CRM, and marketing leaders.',
      headline: 'Trends, Benchmarks & Insights for Industry Leaders',
      introduction: 'Welcome to this month’s edition of the DIGISOFT Digest! In this issue, we dive into how leading enterprises synchronize their ERP ledgers with automated outreach to cut overdue cycles by 40%.',
      benefits: [
        'Research Report: Why multi-ESP redundancy prevents 98% of deliverability blacklists',
        'Technical Blueprint: Zero-latency TallyPrime XML integration patterns',
        'Regulatory Checklist: Maintaining automated CAN-SPAM and GDPR consent trails in 2026',
        'Product Spotlight: Dynamic segmentation using live credit scores and balance ageing'
      ],
      ctaText: 'Read Full Insights Report',
      ctaUrlSuggestion: 'https://portal.digisoft.com/resources/digest-latest',
      secondaryText: 'Have a topic you want us to cover next month? Hit reply and let us know what your engineering or marketing teams are tackling.',
      deliverabilityAdvice: 'Consistent sending schedule and clear List-Unsubscribe headers foster trusted domain sender reputation.'
    },
    htmlGenerator: (content, preview) => generateNewsletterHtml(content, preview)
  },

  b2b_promotional_offer: {
    id: 'b2b_promotional_offer',
    name: 'Special B2B Campaign & Commercial Offer',
    category: 'Marketing',
    description: 'Conversion-driven promotional layout highlighting discounts, validity, and commercial benefits.',
    thumbnailColor: 'bg-rose-600',
    defaultContent: {
      subject: 'Exclusive Year-End Commercial Terms for {{company.name}}',
      preheader: 'Lock in 20% savings on enterprise licensing and dedicated cloud deployment.',
      headline: 'Special Commercial Terms Exclusively for {{company.name}}',
      introduction: 'Dear {{contact.first_name}}, as we approach our annual planning cycle, DIGISOFT is extending preferred commercial pricing to select strategic accounts including {{company.name}}.',
      benefits: [
        '20% savings on annual enterprise multi-user license renewal',
        'Free migration assistance for legacy customer databases up to 500,000 records',
        'Unlimited automated TallyPrime sync connectors and dedicated webhook channels',
        'Guaranteed 99.9% uptime SLA and 1-hour response priority support'
      ],
      ctaText: 'Claim Your Commercial Quote',
      ctaUrlSuggestion: 'https://portal.digisoft.com/offers/enterprise-q3?org={{contact.id}}',
      secondaryText: 'This exclusive rate card is valid for contracts finalized before the end of the current billing cycle. Reach out to our enterprise desk to customize your plan.',
      deliverabilityAdvice: 'Explicit opt-out link and prominent physical company address guarantee strict CAN-SPAM compliance.'
    },
    htmlGenerator: (content, preview) => generatePromoHtml(content, preview)
  }
};

/**
 * Replace merge tags with sample or actual contact data
 */
export function replaceMergeTags(templateText: string, contact?: Partial<Contact>): string {
  if (!templateText) return '';
  
  const firstName = contact?.firstName || 'Bhuvan';
  const lastName = contact?.lastName || 'Gupta';
  const companyName = contact?.companyName || 'Apex Technologies Ltd';
  const email = contact?.email || 'bhuvangupta.1711@gmail.com';
  const contactId = contact?.id || 'CNT-84920';
  const outstandingBalance = contact?.tallyOutstandingBalance !== undefined 
    ? contact.tallyOutstandingBalance.toLocaleString('en-IN') 
    : '78,450';
  const overdueDays = contact?.tallyOverdueDays !== undefined 
    ? String(contact.tallyOverdueDays) 
    : '42';

  return templateText
    .replace(/\{\{\s*contact\.first_name\s*\}\}/gi, firstName)
    .replace(/\{\{\s*contact\.last_name\s*\}\}/gi, lastName)
    .replace(/\{\{\s*contact\.email\s*\}\}/gi, email)
    .replace(/\{\{\s*contact\.id\s*\}\}/gi, contactId)
    .replace(/\{\{\s*company\.name\s*\}\}/gi, companyName)
    .replace(/\{\{\s*tally\.outstanding_balance\s*\}\}/gi, outstandingBalance)
    .replace(/\{\{\s*tally\.overdue_days\s*\}\}/gi, overdueDays)
    .replace(/\{\{\s*unsubscribe_url\s*\}\}/gi, 'https://crm.digisoft.com/unsubscribe?token=d9f48a17c')
    .replace(/\{\{\s*view_in_browser_url\s*\}\}/gi, 'https://crm.digisoft.com/view/c789104');
}

/**
 * Analyzes copy for deliverability score (0-100) and spam triggers
 */
export function analyzeDeliverability(subject: string, preheaderOrHtml: string, contentText: string = ''): {
  score: number;
  warnings: string[];
  recommendations: string[];
  spamTriggersFound: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const spamTriggersFound: string[] = [];
  let score = 95;

  const combined = (subject + ' ' + preheaderOrHtml + ' ' + contentText).toLowerCase();

  const spamTriggers = [
    '100% free', 'act now', 'make money', 'free money', 'risk free',
    'buy direct', 'lowest price', 'cheap', 'congratulations', 'urgent alert',
    'million dollars', 'no catch', 'click here now'
  ];

  for (const trigger of spamTriggers) {
    if (combined.includes(trigger)) {
      warnings.push(`Contains spam-trigger phrase: "${trigger}"`);
      spamTriggersFound.push(trigger);
      score -= 10;
    }
  }

  if (subject.length > 70) {
    warnings.push(`Subject line is ${subject.length} characters (ideal is under 60).`);
    score -= 5;
  } else {
    recommendations.push('Subject line length is optimal for mobile inboxes.');
  }

  if (subject === subject.toUpperCase() && subject.length > 10) {
    warnings.push('Subject line is written in ALL CAPS, which triggers ISP spam filters.');
    score -= 20;
  }

  if (preheaderOrHtml.length < 20 && !preheaderOrHtml.includes('<html')) {
    warnings.push('Preheader text is very short. Add 40-70 characters of preview text.');
    score -= 5;
  } else {
    recommendations.push('Preheader effectively reinforces subject line open intent.');
  }

  if (!combined.includes('unsubscribe')) {
    warnings.push('Explicit unsubscribe link is missing (required by CAN-SPAM and GDPR).');
    score -= 15;
  }

  score = Math.max(25, Math.min(100, score));

  return { score, warnings, recommendations, spamTriggersFound };
}

/* ==========================================================================
   HTML EMAIL GENERATORS (TABLE-BASED, INLINE CSS FOR MAXIMUM CLIENT COMPATIBILITY)
   ========================================================================== */

function generateTallyReminderHtml(content: StructuredEmailContent, contact?: Partial<Contact>): string {
  const subject = replaceMergeTags(content.subject, contact);
  const preheader = replaceMergeTags(content.preheader, contact);
  const headline = replaceMergeTags(content.headline, contact);
  const intro = replaceMergeTags(content.introduction, contact);
  const ctaText = replaceMergeTags(content.ctaText, contact);
  const ctaUrl = replaceMergeTags(content.ctaUrlSuggestion, contact);
  const secondary = replaceMergeTags(content.secondaryText || '', contact);
  const company = contact?.companyName || 'Apex Technologies Ltd';
  const balance = contact?.tallyOutstandingBalance !== undefined 
    ? contact.tallyOutstandingBalance.toLocaleString('en-IN') 
    : '78,450';
  const overdueDays = contact?.tallyOverdueDays || 42;

  const benefitsList = content.benefits.map(b => {
    const item = replaceMergeTags(b, contact);
    return `
      <tr>
        <td width="24" valign="top" style="padding-bottom: 12px; font-size: 16px; color: #d97706;">&#10003;</td>
        <td valign="top" style="padding-bottom: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; color: #334155;">
          ${item}
        </td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
  <!-- Hidden Preheader Text -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: #f8fafc;">
    ${preheader} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <!-- Container Card -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          
          <!-- Header Bar -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px 32px; border-bottom: 3px solid #d97706;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
                      DIGISOFT <span style="color: #fbbf24;">FINANCE</span>
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size: 12px; color: #94a3b8; font-family: monospace; background-color: #1e293b; padding: 4px 8px; border-radius: 4px;">
                      TALLY-SYNCED
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 4px; margin-bottom: 16px;">
                LEDGER STATUS STATEMENT
              </span>

              <h1 style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 700; color: #0f172a; line-height: 28px;">
                ${headline}
              </h1>

              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #475569;">
                ${intro}
              </p>

              <!-- Account Balance Callout Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="50%" align="left">
                          <span style="font-size: 11px; font-weight: 700; color: #92400e; text-transform: uppercase;">Account / Party</span><br>
                          <strong style="font-size: 15px; color: #1e293b;">${company}</strong>
                        </td>
                        <td width="50%" align="right">
                          <span style="font-size: 11px; font-weight: 700; color: #92400e; text-transform: uppercase;">Outstanding Amount</span><br>
                          <strong style="font-size: 18px; color: #b45309;">₹${balance}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 8px; font-size: 12px; color: #78350f; border-top: 1px dashed #fcd34d; margin-top: 8px;">
                          Overdue Timeline: <strong>${overdueDays} Days Past Due</strong> &bull; Tally Ledger ID: <strong>TL-2026-8841</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Points -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                ${benefitsList}
              </table>

              <!-- CTA Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 6px; box-shadow: 0 2px 4px rgba(217, 119, 6, 0.3);">
                      ${ctaText} &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              ${secondary ? `
              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 20px; color: #64748b; background-color: #f1f5f9; padding: 12px 16px; border-radius: 6px;">
                ${secondary}
              </p>` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 18px;">
              <p style="margin: 0 0 8px 0;">
                Sent via <strong>DIGISOFT CRM</strong> Enterprise Financial Messaging Engine.<br>
                DIGISOFT Technologies Ltd., Sector 62, Electronic City, Bengaluru, Karnataka, India.
              </p>
              <p style="margin: 0;">
                To update your billing notification preferences or unsubscribe, <a href="{{unsubscribe_url}}" style="color: #64748b; text-decoration: underline;">click here</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generateProductLaunchHtml(content: StructuredEmailContent, contact?: Partial<Contact>): string {
  const subject = replaceMergeTags(content.subject, contact);
  const preheader = replaceMergeTags(content.preheader, contact);
  const headline = replaceMergeTags(content.headline, contact);
  const intro = replaceMergeTags(content.introduction, contact);
  const ctaText = replaceMergeTags(content.ctaText, contact);
  const ctaUrl = replaceMergeTags(content.ctaUrlSuggestion, contact);
  const secondary = replaceMergeTags(content.secondaryText || '', contact);

  const benefitsList = content.benefits.map(b => {
    const item = replaceMergeTags(b, contact);
    return `
      <tr>
        <td width="28" valign="top" style="padding-bottom: 12px;">
          <div style="width: 20px; height: 20px; background-color: #e0e7ff; color: #4338ca; border-radius: 50%; text-align: center; font-size: 12px; font-weight: bold; line-height: 20px;">&bull;</div>
        </td>
        <td valign="top" style="padding-bottom: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 20px; color: #334155;">
          ${item}
        </td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; color: #f1f5f9;">
    ${preheader}
  </div>
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; overflow: hidden;">
          
          <!-- Banner Hero -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 36px 32px; text-align: center; color: #ffffff;">
              <span style="display: inline-block; background-color: rgba(255,255,255,0.15); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;">
                PRODUCT UPDATE &bull; V2.4 RELEASE
              </span>
              <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 800; line-height: 32px; color: #ffffff;">
                ${headline}
              </h1>
              <p style="margin: 0; font-size: 14px; line-height: 22px; color: #c7d2fe;">
                DIGISOFT CRM Platform Suite
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 24px; color: #334155;">
                ${intro}
              </p>

              <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
                Key Release Highlights
              </h3>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                ${benefitsList}
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 36px; border-radius: 6px;">
                      ${ctaText} &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              ${secondary ? `<p style="margin: 0; font-size: 13px; line-height: 20px; color: #64748b; text-align: center;">${secondary}</p>` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
              DIGISOFT Technologies &bull; Enterprise CRM &bull; <a href="{{unsubscribe_url}}" style="color: #64748b;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generateWinbackHtml(content: StructuredEmailContent, contact?: Partial<Contact>): string {
  const subject = replaceMergeTags(content.subject, contact);
  const headline = replaceMergeTags(content.headline, contact);
  const intro = replaceMergeTags(content.introduction, contact);
  const ctaText = replaceMergeTags(content.ctaText, contact);
  const ctaUrl = replaceMergeTags(content.ctaUrlSuggestion, contact);
  const secondary = replaceMergeTags(content.secondaryText || '', contact);

  const benefitsList = content.benefits.map(b => {
    const item = replaceMergeTags(b, contact);
    return `<li style="margin-bottom: 8px; color: #334155; font-size: 14px; line-height: 20px;">${item}</li>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 32px;">
          <tr>
            <td>
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #065f46;">
                ${headline}
              </h2>
              <p style="font-size: 15px; line-height: 24px; color: #334155; margin: 0 0 16px 0;">
                ${intro}
              </p>
              <ul style="padding-left: 20px; margin: 0 0 20px 0;">
                ${benefitsList}
              </ul>
              <div style="background-color: #ecfdf5; border: 1px dashed #34d399; border-radius: 6px; padding: 16px; margin-bottom: 24px; text-align: center;">
                <span style="font-size: 12px; font-weight: 700; color: #065f46; text-transform: uppercase;">Exclusive Reactivation Perk</span><br>
                <strong style="font-size: 16px; color: #047857;">Complimentary 30-Day Tally Automation Add-on</strong>
              </div>
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${ctaUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 700; display: inline-block;">
                  ${ctaText}
                </a>
              </div>
              <p style="font-size: 13px; color: #64748b; line-height: 20px; margin: 0 0 16px 0;">
                ${secondary}
              </p>
              <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
                DIGISOFT CRM Customer Success Team &bull; <a href="{{unsubscribe_url}}" style="color: #64748b;">Manage Preferences</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generateNewsletterHtml(content: StructuredEmailContent, contact?: Partial<Contact>): string {
  const subject = replaceMergeTags(content.subject, contact);
  const headline = replaceMergeTags(content.headline, contact);
  const intro = replaceMergeTags(content.introduction, contact);
  const ctaText = replaceMergeTags(content.ctaText, contact);
  const ctaUrl = replaceMergeTags(content.ctaUrlSuggestion, contact);

  const items = content.benefits.map((b, i) => {
    const text = replaceMergeTags(b, contact);
    return `
      <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px;">
        <span style="font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase;">INSIGHT #${i + 1}</span>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #334155; line-height: 20px;">${text}</p>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin: 0; padding: 0; background-color: #f0fdf4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; overflow: hidden;">
          <tr>
            <td style="background-color: #0369a1; padding: 24px; text-align: center; color: #ffffff;">
              <h2 style="margin: 0 0 4px 0; font-size: 22px;">THE DIGISOFT DISPATCH</h2>
              <span style="font-size: 12px; color: #bae6fd;">Monthly B2B Growth & Automation Digest</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px;">
              <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #0f172a;">${headline}</h3>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 22px;">${intro}</p>
              ${items}
              <div style="text-align: center; margin: 24px 0;">
                <a href="${ctaUrl}" style="background-color: #0284c7; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 700; display: inline-block;">
                  ${ctaText}
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
              DIGISOFT CRM Digest &bull; <a href="{{unsubscribe_url}}" style="color: #64748b;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generatePromoHtml(content: StructuredEmailContent, contact?: Partial<Contact>): string {
  const subject = replaceMergeTags(content.subject, contact);
  const headline = replaceMergeTags(content.headline, contact);
  const intro = replaceMergeTags(content.introduction, contact);
  const ctaText = replaceMergeTags(content.ctaText, contact);
  const ctaUrl = replaceMergeTags(content.ctaUrlSuggestion, contact);
  const secondary = replaceMergeTags(content.secondaryText || '', contact);

  const benefitsList = content.benefits.map(b => {
    return `<li style="margin-bottom: 6px; font-size: 14px; color: #334155;">${replaceMergeTags(b, contact)}</li>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin: 0; padding: 0; background-color: #fff1f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 8px; border: 1px solid #fecdd3; padding: 32px;">
          <tr>
            <td>
              <span style="background-color: #ffe4e6; color: #be123c; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 4px; text-transform: uppercase;">
                SPECIAL COMMERCIAL PROPOSAL
              </span>
              <h2 style="margin: 12px 0 12px 0; font-size: 22px; color: #881337;">${headline}</h2>
              <p style="font-size: 14px; color: #475569; line-height: 22px; margin: 0 0 16px 0;">${intro}</p>
              <ul style="padding-left: 20px; margin: 0 0 20px 0;">${benefitsList}</ul>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${ctaUrl}" style="background-color: #e11d48; color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 700; display: inline-block;">
                  ${ctaText}
                </a>
              </div>
              <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">${secondary}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const EMAIL_TEMPLATES_LIST: EmailTemplate[] = Object.values(EMAIL_TEMPLATES);

/**
 * High-level template renderer
 */
export function renderEmailTemplate(
  templateId: string,
  content: StructuredEmailContent,
  contact?: Partial<Contact>
): string {
  const template = EMAIL_TEMPLATES[templateId as EmailTemplateId] || EMAIL_TEMPLATES.tally_payment_reminder;
  const normalizedContent: StructuredEmailContent = {
    ...content,
    introduction: content.introduction || (content.bodyParagraphs ? content.bodyParagraphs.join(' ') : ''),
    benefits: content.benefits || content.bulletPoints || []
  };
  return template.htmlGenerator(normalizedContent, contact);
}
