import { ManagedEmailTemplate } from '../types';

export const INITIAL_MANAGED_TEMPLATES: ManagedEmailTemplate[] = [
  // 1. Corporate
  {
    id: 'TMPL-CORP-01',
    name: 'Corporate Quarterly Governance & Business Review',
    category: 'Corporate',
    description: 'Formal executive letter format with key milestones, financial updates, and scheduled review CTA.',
    subjectDefault: 'Executive Briefing & Q3 Business Review for {{COMPANY_NAME}}',
    preheaderDefault: 'Key operational updates, strategic growth milestones, and our scheduled leadership check-in.',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    version: 2,
    createdBy: 'Bhuvan Gupta',
    approvedBy: 'Director of Corporate Communications',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-08-20T14:30:00Z',
    versions: [
      {
        id: 'VER-CORP-01-1',
        templateId: 'TMPL-CORP-01',
        versionNumber: 1,
        name: 'Corporate Quarterly Governance Review (Initial Draft)',
        subjectDefault: 'Quarterly Business Review for {{COMPANY_NAME}}',
        preheaderDefault: 'Operational updates and leadership meeting scheduling.',
        htmlContent: '<!-- Version 1 HTML -->',
        plainTextContent: 'Initial draft version of corporate quarterly update.',
        changeSummary: 'Initial template creation with table structure.',
        createdBy: 'Bhuvan Gupta',
        createdAt: '2026-01-15T09:00:00Z'
      },
      {
        id: 'VER-CORP-01-2',
        templateId: 'TMPL-CORP-01',
        versionNumber: 2,
        name: 'Corporate Quarterly Governance & Business Review',
        subjectDefault: 'Executive Briefing & Q3 Business Review for {{COMPANY_NAME}}',
        preheaderDefault: 'Key operational updates, strategic growth milestones, and our scheduled leadership check-in.',
        htmlContent: '', // Will be set to current htmlContent
        plainTextContent: '',
        changeSummary: 'Updated executive typography, polished mobile responsive table, and added MSO button fallbacks.',
        createdBy: 'Bhuvan Gupta',
        createdAt: '2026-08-20T14:30:00Z'
      }
    ],
    htmlContent: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Corporate Executive Briefing</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f1f5f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    @media screen and (max-width: 600px) {
      .mobile-fluid { width: 100% !important; max-width: 100% !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">

  <!-- 1. HIDDEN PREHEADER -->
  <div style="display: none; font-size: 1px; color: #f1f5f9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Key operational updates, strategic growth milestones, and our scheduled leadership check-in.
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <!-- MAIN WRAPPER TABLE -->
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f1f5f9">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        
        <!-- 600PX CONTENT CONTAINER -->
        <table role="presentation" class="mobile-fluid" width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
          
          <!-- 2. HEADER & 3. LOGO -->
          <tr>
            <td align="center" style="padding: 28px 40px 20px; background-color: #0f172a; border-bottom: 3px solid #3b82f6;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" valign="middle">
                    <img src="{{COMPANY_LOGO}}" alt="Company Logo" width="140" style="display: block; width: 140px; max-width: 140px; height: auto;" />
                  </td>
                  <td align="right" valign="middle" style="font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    Executive Briefing &bull; Q3
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 4. HERO SECTION -->
          <tr>
            <td class="mobile-padding" style="padding: 36px 40px 20px; background-color: #ffffff;">
              <p style="margin: 0 0 8px; font-size: 13px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1px;">
                Strategic Enterprise Partnership
              </p>
              <h1 style="margin: 0; font-size: 24px; line-height: 32px; font-weight: 800; color: #0f172a;">
                Quarterly Business & Performance Review for {{COMPANY_NAME}}
              </h1>
            </td>
          </tr>

          <!-- 5. MAIN CONTENT -->
          <tr>
            <td class="mobile-padding" style="padding: 10px 40px 24px; font-size: 15px; line-height: 24px; color: #334155;">
              <p style="margin: 0 0 16px;">
                Dear {{FIRST_NAME}},
              </p>
              <p style="margin: 0 0 16px;">
                As we conclude the current operating quarter, our executive leadership team has prepared a consolidated overview of our joint initiatives, system SLAs, and upcoming technological roadmaps for {{COMPANY_NAME}} in {{CITY}}.
              </p>
              <p style="margin: 0 0 20px;">
                Your dedicated partnership has enabled both our teams to achieve 99.98% operational uptime and streamlined workflow automation across departments.
              </p>
            </td>
          </tr>

          <!-- 6. BENEFITS / FEATURE SECTION -->
          <tr>
            <td class="mobile-padding" style="padding: 0 40px 28px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #0f172a;">
                      Key Milestone Highlights & Deliverables:
                    </p>
                    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="24" valign="top" style="font-size: 16px; color: #10b981; line-height: 22px;">&#10003;</td>
                        <td style="font-size: 14px; color: #475569; line-height: 22px; padding-bottom: 8px;">
                          <strong>Financial Reconciliation:</strong> Zero discrepancy records maintained across all TallyPrime ledger accounts.
                        </td>
                      </tr>
                      <tr>
                        <td width="24" valign="top" style="font-size: 16px; color: #10b981; line-height: 22px;">&#10003;</td>
                        <td style="font-size: 14px; color: #475569; line-height: 22px; padding-bottom: 8px;">
                          <strong>Platform Reliability:</strong> Sub-second query latency delivered across 100,000+ contact records.
                        </td>
                      </tr>
                      <tr>
                        <td width="24" valign="top" style="font-size: 16px; color: #10b981; line-height: 22px;">&#10003;</td>
                        <td style="font-size: 14px; color: #475569; line-height: 22px;">
                          <strong>Compliance Adherence:</strong> Full CAN-SPAM and GDPR consent timestamps logged for audit readiness.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 7. CTA (BULLETPROOF TABLE BUTTON) -->
          <tr>
            <td align="center" class="mobile-padding" style="padding: 8px 40px 36px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #2563eb;">
                    <a href="https://portal.digisoft.com/executive/review?org={{COMPANY_NAME}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 6px; border: 1px solid #2563eb;">
                      Access Executive Review Report &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 8. CONTACT INFORMATION -->
          <tr>
            <td class="mobile-padding" style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; line-height: 20px;">
              <p style="margin: 0 0 4px; font-weight: 700; color: #1e293b;">Executive Relations & Advisory Desk</p>
              <p style="margin: 0;">Direct Phone: +91 80 4123 4567 | Executive Email: executive@digisoft.com</p>
              <p style="margin: 4px 0 0;">Dedicated Account Advisor for {{CONTACT_NAME}} at {{COMPANY_NAME}}</p>
            </td>
          </tr>

          <!-- 9. FOOTER & 10. UNSUBSCRIBE LINK -->
          <tr>
            <td class="mobile-padding" style="padding: 24px 40px 32px; background-color: #0f172a; color: #94a3b8; font-size: 12px; line-height: 18px; text-align: center;">
              <p style="margin: 0 0 8px; color: #cbd5e1;">
                &copy; 2026 DIGISOFT Technologies (P) Ltd. All rights reserved.
              </p>
              <p style="margin: 0 0 12px;">
                Registered Corporate Office: {{COMPANY_ADDRESS}}
              </p>
              <p style="margin: 0; font-size: 11px;">
                You received this message because you are a designated account officer for {{EMAIL}}. 
                <br />
                <a href="{{PRIVACY_POLICY_URL}}" style="color: #60a5fa; text-decoration: underline;">Privacy Policy</a>
                &nbsp;&bull;&nbsp;
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #60a5fa; text-decoration: underline;">Unsubscribe from Quarterly Briefings</a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`,
    plainTextContent: `EXECUTIVE BRIEFING & Q3 BUSINESS REVIEW FOR {{COMPANY_NAME}}

Dear {{FIRST_NAME}},

As we conclude the current operating quarter, our executive leadership team has prepared a consolidated overview of our joint initiatives, system SLAs, and upcoming technological roadmaps for {{COMPANY_NAME}} in {{CITY}}.

KEY MILESTONE HIGHLIGHTS:
- Financial Reconciliation: Zero discrepancy records maintained across all TallyPrime ledger accounts.
- Platform Reliability: Sub-second query latency delivered across 100,000+ contact records.
- Compliance Adherence: Full CAN-SPAM and GDPR consent timestamps logged for audit readiness.

ACCESS EXECUTIVE REPORT:
https://portal.digisoft.com/executive/review?org={{COMPANY_NAME}}

CONTACT INFORMATION:
Direct Phone: +91 80 4123 4567 | Executive Email: executive@digisoft.com
Dedicated Account Advisor for {{CONTACT_NAME}} at {{COMPANY_NAME}}

Corporate Address: {{COMPANY_ADDRESS}}
Privacy Policy: {{PRIVACY_POLICY_URL}}
Unsubscribe: {{UNSUBSCRIBE_URL}}`
  },

  // 2. Promotional
  {
    id: 'TMPL-PROM-02',
    name: 'Promotional Enterprise Upgrade Incentive',
    category: 'Promotional',
    description: 'High conversion B2B promotion with promotional badge, feature list, and prominent discount callout.',
    subjectDefault: 'Special 30% Enterprise Credit for {{COMPANY_NAME}} This Month',
    preheaderDefault: 'Upgrade your customer automation workflow with verified Tally synchronization and dedicated throughput.',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    version: 1,
    createdBy: 'Bhuvan Gupta',
    createdAt: '2026-02-10T11:00:00Z',
    updatedAt: '2026-08-15T16:00:00Z',
    versions: [
      {
        id: 'VER-PROM-02-1',
        templateId: 'TMPL-PROM-02',
        versionNumber: 1,
        name: 'Promotional Enterprise Upgrade Incentive',
        subjectDefault: 'Special 30% Enterprise Credit for {{COMPANY_NAME}} This Month',
        preheaderDefault: 'Upgrade your customer automation workflow with verified Tally synchronization.',
        htmlContent: '',
        plainTextContent: '',
        changeSummary: 'Initial production release.',
        createdBy: 'Bhuvan Gupta',
        createdAt: '2026-02-10T11:00:00Z'
      }
    ],
    htmlContent: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Special Enterprise Promotion</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; }
    table { border-collapse: collapse !important; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #f8fafc; font-family: Arial, sans-serif; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">

  <!-- 1. HIDDEN PREHEADER -->
  <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Upgrade your customer automation workflow with verified Tally synchronization and dedicated throughput.
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f8fafc">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
          
          <!-- 2. HEADER & 3. LOGO -->
          <tr>
            <td align="center" style="padding: 24px 36px; background-color: #4338ca;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left">
                    <img src="{{COMPANY_LOGO}}" alt="Company Logo" width="130" style="display: block; width: 130px; height: auto;" />
                  </td>
                  <td align="right" style="color: #c7d2fe; font-size: 12px; font-weight: bold;">
                    LIMITED PROMOTIONAL OFFER
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 4. HERO SECTION -->
          <tr>
            <td align="center" style="padding: 36px 36px 20px; background-color: #ffffff;">
              <span style="background-color: #e0e7ff; color: #4338ca; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 12px; text-transform: uppercase;">
                Exclusive Tier-1 Discount
              </span>
              <h1 style="margin: 16px 0 8px; font-size: 26px; line-height: 34px; font-weight: 800; color: #1e1b4b;">
                Unlock 30% Off DIGISOFT High-Volume Automation
              </h1>
              <p style="margin: 0; font-size: 15px; color: #475569;">
                Prepared exclusively for {{FIRST_NAME}} and the team at {{COMPANY_NAME}}
              </p>
            </td>
          </tr>

          <!-- 5. MAIN CONTENT -->
          <tr>
            <td style="padding: 10px 36px 20px; font-size: 15px; line-height: 24px; color: #334155;">
              <p style="margin: 0 0 16px;">
                Hello {{CONTACT_NAME}},
              </p>
              <p style="margin: 0 0 16px;">
                To accelerate your regional sales pipeline across {{STATE}}, we are providing {{COMPANY_NAME}} with a preferential 30% commercial credit on our Enterprise Automation Suite.
              </p>
            </td>
          </tr>

          <!-- 6. BENEFITS / FEATURE SECTION -->
          <tr>
            <td style="padding: 0 36px 28px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 6px; padding: 16px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px; font-size: 14px; font-weight: bold; color: #4338ca;">Included in Your Enterprise Bundle:</p>
                    <p style="margin: 0 0 6px; font-size: 13px; color: #3730a3;">&bull; <strong>Multi-ESP Failover:</strong> Seamless failover across Amazon SES and Brevo</p>
                    <p style="margin: 0 0 6px; font-size: 13px; color: #3730a3;">&bull; <strong>TallyPrime XML Connector:</strong> Automatic synchronization every 15 minutes</p>
                    <p style="margin: 0; font-size: 13px; color: #3730a3;">&bull; <strong>AI Copy Studio:</strong> Real-time conversion scoring with Gemini models</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 7. CTA -->
          <tr>
            <td align="center" style="padding: 0 36px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #4f46e5;">
                    <a href="https://portal.digisoft.com/offers/enterprise-30?cid={{EMAIL}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 6px;">
                      Claim 30% Upgrade Credit &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 8. CONTACT INFORMATION -->
          <tr>
            <td style="padding: 20px 36px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
              <p style="margin: 0; font-weight: bold; color: #1e293b;">Questions regarding this offer?</p>
              <p style="margin: 4px 0 0;">Reach our Solutions Desk at +91 80 4123 4567 or reply directly to sales@digisoft.com</p>
            </td>
          </tr>

          <!-- 9. FOOTER & 10. UNSUBSCRIBE LINK -->
          <tr>
            <td style="padding: 24px 36px; background-color: #1e1b4b; color: #a5b4fc; font-size: 12px; line-height: 18px; text-align: center;">
              <p style="margin: 0 0 8px;">&copy; 2026 DIGISOFT CRM. All rights reserved.</p>
              <p style="margin: 0 0 8px;">Registered Office: {{COMPANY_ADDRESS}}</p>
              <p style="margin: 0; font-size: 11px;">
                <a href="{{PRIVACY_POLICY_URL}}" style="color: #818cf8;">Privacy Policy</a> &bull; 
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #818cf8;">Unsubscribe from Promotional Emails</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`,
    plainTextContent: `SPECIAL 30% ENTERPRISE CREDIT FOR {{COMPANY_NAME}}

Hello {{CONTACT_NAME}},

To accelerate your regional sales pipeline across {{STATE}}, we are providing {{COMPANY_NAME}} with a preferential 30% commercial credit on our Enterprise Automation Suite.

INCLUDED IN YOUR BUNDLE:
- Multi-ESP Failover across Amazon SES and Brevo
- TallyPrime XML Connector with 15-minute auto-sync
- AI Copy Studio with Gemini models

CLAIM YOUR CREDIT:
https://portal.digisoft.com/offers/enterprise-30?cid={{EMAIL}}

CONTACT:
Phone: +91 80 4123 4567 | Email: sales@digisoft.com
Address: {{COMPANY_ADDRESS}}
Unsubscribe: {{UNSUBSCRIBE_URL}}`
  },

  // 3. Newsletter
  {
    id: 'TMPL-NEWS-03',
    name: 'B2B Tech Digest & Monthly Newsletter',
    category: 'Newsletter',
    description: 'Curated multi-article editorial format with tech headlines, engineering blueprints, and stats.',
    subjectDefault: 'The Ledger Digest: Deliverability Benchmarks & ERP Automation',
    preheaderDefault: 'Top technical insights for B2B financial and marketing automation architects.',
    thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    version: 1,
    createdBy: 'Bhuvan Gupta',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    versions: [],
    htmlContent: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>The Ledger Digest</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    table { border-collapse: collapse !important; }
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">

  <!-- 1. HIDDEN PREHEADER -->
  <div style="display: none; font-size: 1px; color: #f1f5f9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Top technical insights for B2B financial and marketing automation architects.
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f1f5f9">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #cbd5e1;">
          
          <!-- 2. HEADER & 3. LOGO -->
          <tr>
            <td style="padding: 20px 36px; background-color: #0369a1; border-bottom: 2px solid #0284c7;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td><img src="{{COMPANY_LOGO}}" alt="Logo" width="120" style="display: block;" /></td>
                  <td align="right" style="color: #e0f2fe; font-size: 12px; font-weight: 600;">ISSUE #48 &bull; SEPTEMBER 2026</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 4. HERO SECTION -->
          <tr>
            <td style="padding: 32px 36px 16px;">
              <h1 style="margin: 0 0 10px; font-size: 24px; line-height: 32px; color: #0c4a6e; font-weight: 800;">
                The Ledger Digest: Zero-Latency ERP Synced Automation
              </h1>
              <p style="margin: 0; font-size: 14px; color: #64748b;">
                Curated intelligence for {{CONTACT_NAME}} at {{COMPANY_NAME}}
              </p>
            </td>
          </tr>

          <!-- 5. MAIN CONTENT -->
          <tr>
            <td style="padding: 10px 36px 20px; font-size: 15px; line-height: 24px; color: #334155;">
              <p style="margin: 0 0 16px;">
                Welcome to this month's technical digest. In this issue, we explore how enterprise software architectures are moving toward distributed event-driven syncing to eliminate overdue accounts receivable in {{CITY}}.
              </p>
            </td>
          </tr>

          <!-- 6. BENEFITS / ARTICLES SECTION -->
          <tr>
            <td style="padding: 0 36px 24px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 16px; background-color: #f0f9ff; border-left: 4px solid #0284c7; margin-bottom: 12px; display: block; border-radius: 4px;">
                    <h3 style="margin: 0 0 6px; font-size: 15px; color: #0369a1;">1. Multi-ESP Driver Redundancy</h3>
                    <p style="margin: 0; font-size: 13px; color: #334155; line-height: 20px;">Why decoupling your email dispatch pipeline between Amazon SES and Brevo reduces IP blacklisting by 94%.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; background-color: #f0f9ff; border-left: 4px solid #0284c7; margin-top: 10px; display: block; border-radius: 4px;">
                    <h3 style="margin: 0 0 6px; font-size: 15px; color: #0369a1;">2. 2026 E-Invoicing Regulatory Checklist</h3>
                    <p style="margin: 0; font-size: 13px; color: #334155; line-height: 20px;">Automating digital invoice delivery with double opt-in consent logs under updated GST rules.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 7. CTA -->
          <tr>
            <td align="center" style="padding: 8px 36px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #0284c7;">
                    <a href="https://portal.digisoft.com/resources/digest-latest" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 6px;">
                      Read Complete Technical Digest &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 8. CONTACT INFORMATION -->
          <tr>
            <td style="padding: 18px 36px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0;">Editorial Office: editorial@digisoft.com | Phone: +91 80 4123 4567</p>
            </td>
          </tr>

          <!-- 9. FOOTER & 10. UNSUBSCRIBE LINK -->
          <tr>
            <td style="padding: 24px 36px; background-color: #0c4a6e; color: #bae6fd; font-size: 11px; line-height: 18px; text-align: center;">
              <p style="margin: 0 0 6px;">&copy; 2026 DIGISOFT CRM Digest. Corporate Headquarters: {{COMPANY_ADDRESS}}</p>
              <p style="margin: 0;">
                <a href="{{PRIVACY_POLICY_URL}}" style="color: #7dd3fc;">Privacy Notice</a> &bull; 
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #7dd3fc;">Manage Preferences or Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`,
    plainTextContent: `THE LEDGER DIGEST - ISSUE #48

Curated for {{CONTACT_NAME}} at {{COMPANY_NAME}}

TOP INSIGHTS:
1. Multi-ESP Driver Redundancy: Prevent IP blacklisting by balancing Amazon SES and Brevo.
2. 2026 E-Invoicing Regulatory Checklist: Double opt-in consent for automated GST dispatch.

READ ONLINE:
https://portal.digisoft.com/resources/digest-latest

Address: {{COMPANY_ADDRESS}}
Unsubscribe: {{UNSUBSCRIBE_URL}}`
  },

  // 4. Product Launch
  {
    id: 'TMPL-PROD-04',
    name: 'Product Launch & Feature Announcement',
    category: 'Product Launch',
    description: 'Modern product debut layout with visual badges, bulletproof button, and interactive walkthrough invitation.',
    subjectDefault: 'Announcing DIGISOFT CRM 3.0: Real-Time TallyPrime Sync & AI Studio',
    preheaderDefault: 'Explore our next-generation customer automation platform built for enterprise scale.',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    version: 1,
    createdBy: 'Bhuvan Gupta',
    createdAt: '2026-04-12T10:00:00Z',
    updatedAt: '2026-08-30T12:00:00Z',
    versions: [],
    htmlContent: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Product Launch</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    table { border-collapse: collapse !important; }
    body { margin: 0; padding: 0; background-color: #0f172a; font-family: Arial, sans-serif; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a;">

  <!-- 1. HIDDEN PREHEADER -->
  <div style="display: none; font-size: 1px; color: #0f172a; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Explore our next-generation customer automation platform built for enterprise scale.
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#0f172a">
    <tr>
      <td align="center" style="padding: 30px 12px;">
        <table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          
          <!-- 2. HEADER & 3. LOGO -->
          <tr>
            <td style="padding: 24px 36px; background-color: #1e293b; border-bottom: 2px solid #6366f1;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td><img src="{{COMPANY_LOGO}}" alt="Company Logo" width="130" style="display: block;" /></td>
                  <td align="right" style="color: #a5b4fc; font-size: 12px; font-weight: bold;">MAJOR RELEASE &bull; V3.0</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 4. HERO SECTION -->
          <tr>
            <td align="center" style="padding: 40px 36px 16px;">
              <span style="background-color: #ede9fe; color: #6d28d9; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 12px; text-transform: uppercase;">
                Now Live Worldwide
              </span>
              <h1 style="margin: 16px 0 10px; font-size: 28px; line-height: 36px; font-weight: 800; color: #0f172a;">
                Say Hello to DIGISOFT 3.0
              </h1>
              <p style="margin: 0; font-size: 16px; color: #64748b; line-height: 24px;">
                Designed to give {{COMPANY_NAME}} effortless automation from Tally ledger sync to multi-ESP deliverability.
              </p>
            </td>
          </tr>

          <!-- 5. MAIN CONTENT -->
          <tr>
            <td style="padding: 10px 36px 20px; font-size: 15px; line-height: 24px; color: #334155;">
              <p style="margin: 0 0 14px;">Hi {{FIRST_NAME}},</p>
              <p style="margin: 0;">
                Today marks our biggest technological upgrade yet. We have re-engineered the core data pipeline to execute dynamic Boolean segment filters across 100,000+ contacts with sub-second response times.
              </p>
            </td>
          </tr>

          <!-- 6. BENEFITS SECTION -->
          <tr>
            <td style="padding: 0 36px 28px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px; font-size: 14px; font-weight: bold; color: #1e293b;">What's New in Version 3.0:</p>
                    <p style="margin: 0 0 8px; font-size: 13px; color: #475569;">&bull; <strong>Dynamic Segmentation Studio:</strong> Build recursive Boolean rule trees without writing SQL.</p>
                    <p style="margin: 0 0 8px; font-size: 13px; color: #475569;">&bull; <strong>Redis Cached Counts:</strong> Zero performance impact on your primary production database.</p>
                    <p style="margin: 0; font-size: 13px; color: #475569;">&bull; <strong>Multi-ESP Failover:</strong> Dynamic routing across Amazon SES, Brevo, and SendGrid.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 7. CTA -->
          <tr>
            <td align="center" style="padding: 0 36px 36px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #4f46e5;">
                    <a href="https://portal.digisoft.com/launch?org={{COMPANY_NAME}}" target="_blank" style="display: inline-block; padding: 14px 34px; font-size: 15px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 6px;">
                      Launch Interactive Walkthrough &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 8. CONTACT INFORMATION -->
          <tr>
            <td style="padding: 20px 36px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0;">Assistance: support@digisoft.com | Direct Line: +91 80 4123 4567</p>
            </td>
          </tr>

          <!-- 9. FOOTER & 10. UNSUBSCRIBE LINK -->
          <tr>
            <td style="padding: 24px 36px; background-color: #0f172a; color: #94a3b8; font-size: 11px; line-height: 18px; text-align: center;">
              <p style="margin: 0 0 6px;">&copy; 2026 DIGISOFT Platform. Registered Address: {{COMPANY_ADDRESS}}</p>
              <p style="margin: 0;">
                <a href="{{PRIVACY_POLICY_URL}}" style="color: #818cf8;">Privacy Policy</a> &bull; 
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #818cf8;">Unsubscribe from Product Announcements</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`,
    plainTextContent: `ANNOUNCING DIGISOFT CRM 3.0

Hello {{FIRST_NAME}},

Today marks our biggest technological upgrade yet. We have re-engineered the core data pipeline for {{COMPANY_NAME}} in {{CITY}}.

KEY HIGHLIGHTS:
- Dynamic Segmentation Studio: Recursive Boolean rule trees
- Redis Cached Counts: Zero database strain
- Multi-ESP Driver Failover: SES, Brevo, SendGrid

EXPLORE NOW:
https://portal.digisoft.com/launch?org={{COMPANY_NAME}}

Corporate Office: {{COMPANY_ADDRESS}}
Unsubscribe: {{UNSUBSCRIBE_URL}}`
  },

  // 5. Festival
  {
    id: 'TMPL-FEST-05',
    name: 'Festival & Seasonal Corporate Greetings',
    category: 'Festival',
    description: 'Warm, respectful corporate festive greeting with operational holiday schedule and support contacts.',
    subjectDefault: 'Warm Festive Greetings & Best Wishes to {{COMPANY_NAME}}',
    preheaderDefault: 'Wishing you continued prosperity, success, and sharing our festival support schedule.',
    thumbnail: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=400&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    version: 1,
    createdBy: 'Bhuvan Gupta',
    createdAt: '2026-05-01T09:00:00Z',
    updatedAt: '2026-08-10T11:00:00Z',
    versions: [],
    htmlContent: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Warm Festive Greetings</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    table { border-collapse: collapse !important; }
    body { margin: 0; padding: 0; background-color: #fefce8; font-family: Arial, sans-serif; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #fefce8;">

  <!-- 1. HIDDEN PREHEADER -->
  <div style="display: none; font-size: 1px; color: #fefce8; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Wishing you continued prosperity, success, and sharing our festival support schedule.
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#fefce8">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #fef08a;">
          
          <!-- 2. HEADER & 3. LOGO -->
          <tr>
            <td align="center" style="padding: 24px 36px; background-color: #713f12;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td><img src="{{COMPANY_LOGO}}" alt="Company Logo" width="130" style="display: block;" /></td>
                  <td align="right" style="color: #fef08a; font-size: 12px; font-weight: bold;">SEASONAL GREETINGS</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 4. HERO SECTION -->
          <tr>
            <td align="center" style="padding: 36px 36px 16px;">
              <h1 style="margin: 0 0 8px; font-size: 26px; color: #854d0e; font-weight: 800;">
                Warm Festive Greetings!
              </h1>
              <p style="margin: 0; font-size: 15px; color: #713f12;">
                Wishing peace, growth, and joy to {{CONTACT_NAME}} &amp; the entire {{COMPANY_NAME}} team.
              </p>
            </td>
          </tr>

          <!-- 5. MAIN CONTENT -->
          <tr>
            <td style="padding: 12px 36px 20px; font-size: 15px; line-height: 24px; color: #44403c;">
              <p style="margin: 0 0 14px;">Dear {{FIRST_NAME}},</p>
              <p style="margin: 0 0 14px;">
                As we celebrate this joyous festive season, we extend our heartfelt gratitude for our valued business association with {{COMPANY_NAME}} in {{CITY}}, {{STATE}}.
              </p>
              <p style="margin: 0;">
                Our mutual dedication to excellence and trust continues to inspire our collaborative achievements.
              </p>
            </td>
          </tr>

          <!-- 6. HOLIDAY SCHEDULE / BENEFITS -->
          <tr>
            <td style="padding: 0 36px 24px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 6px; padding: 14px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 6px; font-size: 13px; font-weight: bold; color: #854d0e;">Holiday Operational Support Notice:</p>
                    <p style="margin: 0; font-size: 13px; color: #713f12; line-height: 20px;">
                      Our automated cloud services remain 100% active 24/7. Critical escalation support is on standby for all enterprise partners.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 7. CTA -->
          <tr>
            <td align="center" style="padding: 0 36px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #ca8a04;">
                    <a href="https://portal.digisoft.com/greetings" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 6px;">
                      View Interactive Holiday Message &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 8. CONTACT INFORMATION -->
          <tr>
            <td style="padding: 16px 36px; background-color: #fafaf9; border-top: 1px solid #e7e5e4; font-size: 12px; color: #78716c;">
              <p style="margin: 0;">Emergency Hotline: +91 80 4123 4567 | Desk: greetings@digisoft.com</p>
            </td>
          </tr>

          <!-- 9. FOOTER & 10. UNSUBSCRIBE LINK -->
          <tr>
            <td style="padding: 24px 36px; background-color: #292524; color: #d6d3d1; font-size: 11px; line-height: 18px; text-align: center;">
              <p style="margin: 0 0 6px;">&copy; 2026 DIGISOFT. Registered Address: {{COMPANY_ADDRESS}}</p>
              <p style="margin: 0;">
                <a href="{{PRIVACY_POLICY_URL}}" style="color: #fde047;">Privacy Policy</a> &bull; 
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #fde047;">Unsubscribe from Seasonal Messages</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`,
    plainTextContent: `WARM FESTIVE GREETINGS TO {{COMPANY_NAME}}

Dear {{FIRST_NAME}},

Wishing peace, growth, and joy to {{CONTACT_NAME}} & the entire {{COMPANY_NAME}} team in {{CITY}}, {{STATE}}.

SUPPORT SCHEDULE:
Our automated cloud services remain 100% active 24/7. Critical escalation support is on standby.

Emergency Hotline: +91 80 4123 4567
Corporate Office: {{COMPANY_ADDRESS}}
Unsubscribe: {{UNSUBSCRIBE_URL}}`
  },

  // 6. Offer
  {
    id: 'TMPL-OFFR-06',
    name: 'Early Settlement & Commercial Discount Offer',
    category: 'Offer',
    description: 'Finance-grade settlement offer for sundry debtor accounts with instant credit voucher confirmation.',
    subjectDefault: 'Commercial Ledger Update: Early Payment Discount for {{COMPANY_NAME}}',
    preheaderDefault: 'Avail an immediate 5% early settlement concession on pending ledger invoices.',
    thumbnail: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    version: 1,
    createdBy: 'Bhuvan Gupta',
    createdAt: '2026-06-15T14:00:00Z',
    updatedAt: '2026-08-25T15:00:00Z',
    versions: [],
    htmlContent: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Early Settlement Concession</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    table { border-collapse: collapse !important; }
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: Arial, sans-serif; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">

  <!-- 1. HIDDEN PREHEADER -->
  <div style="display: none; font-size: 1px; color: #f1f5f9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Avail an immediate 5% early settlement concession on pending ledger invoices.
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f1f5f9">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #cbd5e1;">
          
          <!-- 2. HEADER & 3. LOGO -->
          <tr>
            <td style="padding: 20px 36px; background-color: #047857;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td><img src="{{COMPANY_LOGO}}" alt="Company Logo" width="130" style="display: block;" /></td>
                  <td align="right" style="color: #a7f3d0; font-size: 12px; font-weight: bold;">COMMERCIAL CONCESSION</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 4. HERO SECTION -->
          <tr>
            <td style="padding: 32px 36px 14px;">
              <span style="background-color: #d1fae5; color: #065f46; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 10px; text-transform: uppercase;">
                Prompt Settlement Rebate
              </span>
              <h1 style="margin: 14px 0 8px; font-size: 24px; color: #064e3b; font-weight: 800;">
                5% Early Settlement Discount for {{COMPANY_NAME}}
              </h1>
            </td>
          </tr>

          <!-- 5. MAIN CONTENT -->
          <tr>
            <td style="padding: 10px 36px 18px; font-size: 15px; line-height: 24px; color: #334155;">
              <p style="margin: 0 0 14px;">Attention: {{CONTACT_NAME}}, Accounts Division</p>
              <p style="margin: 0;">
                We are pleased to extend a direct 5% cash settlement concession on your current TallyPrime reconciled statement. Remittances cleared within the next 7 business days qualify for automated credit note issuance.
              </p>
            </td>
          </tr>

          <!-- 6. BENEFITS SECTION -->
          <tr>
            <td style="padding: 0 36px 24px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 14px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 6px; font-size: 13px; font-weight: bold; color: #065f46;">Settlement Concession Terms:</p>
                    <p style="margin: 0 0 4px; font-size: 13px; color: #047857;">&bull; Direct automated credit memo generated in Tally upon receipt</p>
                    <p style="margin: 0; font-size: 13px; color: #047857;">&bull; Immediate restoration of full credit ceiling for future procurements</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 7. CTA -->
          <tr>
            <td align="center" style="padding: 0 36px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #059669;">
                    <a href="https://portal.digisoft.com/finance/settlement?account={{EMAIL}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 6px;">
                      Claim 5% Concession &amp; Review Invoices &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 8. CONTACT INFORMATION -->
          <tr>
            <td style="padding: 16px 36px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0;">Accounts Receivable Desk: billing@digisoft.com | Phone: +91 80 4123 4567</p>
            </td>
          </tr>

          <!-- 9. FOOTER & 10. UNSUBSCRIBE LINK -->
          <tr>
            <td style="padding: 24px 36px; background-color: #064e3b; color: #a7f3d0; font-size: 11px; line-height: 18px; text-align: center;">
              <p style="margin: 0 0 6px;">&copy; 2026 DIGISOFT Financial Services. Registered Office: {{COMPANY_ADDRESS}}</p>
              <p style="margin: 0;">
                <a href="{{PRIVACY_POLICY_URL}}" style="color: #6ee7b7;">Privacy Policy</a> &bull; 
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #6ee7b7;">Unsubscribe from Financial Notices</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`,
    plainTextContent: `5% EARLY SETTLEMENT DISCOUNT FOR {{COMPANY_NAME}}

Attention: {{CONTACT_NAME}}, Accounts Division

We are pleased to extend a direct 5% cash settlement concession on your current TallyPrime reconciled statement. Remittances cleared within the next 7 business days qualify for automated credit note issuance.

CLAIM CONCESSION:
https://portal.digisoft.com/finance/settlement?account={{EMAIL}}

Accounts Desk: billing@digisoft.com | Phone: +91 80 4123 4567
Registered Office: {{COMPANY_ADDRESS}}
Unsubscribe: {{UNSUBSCRIBE_URL}}`
  },

  // 7. Informational
  {
    id: 'TMPL-INFO-07',
    name: 'Compliance & Technical Advisory Notice',
    category: 'Informational',
    description: 'Advisory template for GST updates, server maintenance schedules, or compliance requirements.',
    subjectDefault: 'Mandatory Technical Advisory: GST E-Invoicing & Security Update',
    preheaderDefault: 'Important information regarding upcoming technical mandates affecting your integration.',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    version: 1,
    createdBy: 'Lead Integration Architect',
    createdAt: '2026-07-01T08:30:00Z',
    updatedAt: '2026-08-18T10:00:00Z',
    versions: [],
    htmlContent: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Technical Advisory Notice</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    table { border-collapse: collapse !important; }
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: Arial, sans-serif; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">

  <!-- 1. HIDDEN PREHEADER -->
  <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Important information regarding upcoming technical mandates affecting your integration.
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f8fafc">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
          
          <!-- 2. HEADER & 3. LOGO -->
          <tr>
            <td style="padding: 20px 36px; background-color: #334155;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td><img src="{{COMPANY_LOGO}}" alt="Company Logo" width="120" style="display: block;" /></td>
                  <td align="right" style="color: #cbd5e1; font-size: 12px; font-weight: bold;">SYSTEM ADVISORY</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 4. HERO SECTION -->
          <tr>
            <td style="padding: 32px 36px 14px;">
              <h1 style="margin: 0 0 8px; font-size: 22px; color: #0f172a; font-weight: 800;">
                GST E-Invoicing &amp; Security Compliance Notice
              </h1>
              <p style="margin: 0; font-size: 14px; color: #64748b;">
                Notice for Technical &amp; Compliance Officers at {{COMPANY_NAME}}
              </p>
            </td>
          </tr>

          <!-- 5. MAIN CONTENT -->
          <tr>
            <td style="padding: 10px 36px 18px; font-size: 15px; line-height: 24px; color: #334155;">
              <p style="margin: 0 0 14px;">Hello {{FIRST_NAME}},</p>
              <p style="margin: 0 0 14px;">
                Please be advised that in accordance with the latest statutory directives from the GST portal, our automated XML connectors are implementing stricter TLS 1.3 encryption and mandatory HSN validation.
              </p>
            </td>
          </tr>

          <!-- 6. ACTION STEPS -->
          <tr>
            <td style="padding: 0 36px 24px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; border-left: 4px solid #475569; padding: 14px; border-radius: 4px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 6px; font-size: 13px; font-weight: bold; color: #0f172a;">Required Action Checklist:</p>
                    <p style="margin: 0 0 4px; font-size: 13px; color: #334155;">1. Verify your company GSTIN matches registered records in {{STATE}}.</p>
                    <p style="margin: 0; font-size: 13px; color: #334155;">2. Confirm outbound firewall access on port 9000 for TallyPrime integration.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 7. CTA -->
          <tr>
            <td align="center" style="padding: 0 36px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #334155;">
                    <a href="https://portal.digisoft.com/advisory/compliance" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 6px;">
                      Review Full Technical Documentation &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 8. CONTACT INFORMATION -->
          <tr>
            <td style="padding: 16px 36px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0;">Compliance Helpdesk: compliance@digisoft.com | Phone: +91 80 4123 4567</p>
            </td>
          </tr>

          <!-- 9. FOOTER & 10. UNSUBSCRIBE LINK -->
          <tr>
            <td style="padding: 24px 36px; background-color: #1e293b; color: #94a3b8; font-size: 11px; line-height: 18px; text-align: center;">
              <p style="margin: 0 0 6px;">&copy; 2026 DIGISOFT Platform. Corporate Address: {{COMPANY_ADDRESS}}</p>
              <p style="margin: 0;">
                <a href="{{PRIVACY_POLICY_URL}}" style="color: #cbd5e1;">Privacy Policy</a> &bull; 
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #cbd5e1;">Unsubscribe from Advisory Notices</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`,
    plainTextContent: `MANDATORY TECHNICAL ADVISORY FOR {{COMPANY_NAME}}

Hello {{FIRST_NAME}},

Please be advised that in accordance with statutory GST directives, our automated XML connectors are implementing stricter TLS 1.3 encryption.

REQUIRED ACTION:
1. Verify company GSTIN for {{CITY}}, {{STATE}}.
2. Confirm firewall port 9000 access for TallyPrime integration.

FULL DOCUMENTATION:
https://portal.digisoft.com/advisory/compliance

Helpdesk: compliance@digisoft.com | Phone: +91 80 4123 4567
Address: {{COMPANY_ADDRESS}}
Unsubscribe: {{UNSUBSCRIBE_URL}}`
  },

  // 8. Renewal Reminder
  {
    id: 'TMPL-RENW-08',
    name: 'Enterprise Service Agreement Renewal Reminder',
    category: 'Renewal Reminder',
    description: 'Timely license and annual SLA renewal notice with automated renewal link and dedicated manager contact.',
    subjectDefault: 'Annual SLA & Cloud License Renewal Notice for {{COMPANY_NAME}}',
    preheaderDefault: 'Your annual enterprise service contract is approaching renewal on October 31, 2026.',
    thumbnail: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=400&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    version: 1,
    createdBy: 'Bhuvan Gupta',
    createdAt: '2026-07-20T11:00:00Z',
    updatedAt: '2026-09-02T16:00:00Z',
    versions: [],
    htmlContent: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Service Agreement Renewal</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    table { border-collapse: collapse !important; }
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: Arial, sans-serif; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">

  <!-- 1. HIDDEN PREHEADER -->
  <div style="display: none; font-size: 1px; color: #f1f5f9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Your annual enterprise service contract is approaching renewal on October 31, 2026.
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f1f5f9">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #cbd5e1;">
          
          <!-- 2. HEADER & 3. LOGO -->
          <tr>
            <td style="padding: 20px 36px; background-color: #b45309;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td><img src="{{COMPANY_LOGO}}" alt="Company Logo" width="130" style="display: block;" /></td>
                  <td align="right" style="color: #fef3c7; font-size: 12px; font-weight: bold;">LICENSE RENEWAL</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 4. HERO SECTION -->
          <tr>
            <td style="padding: 32px 36px 14px;">
              <span style="background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 10px; text-transform: uppercase;">
                Annual SLA Notice
              </span>
              <h1 style="margin: 14px 0 8px; font-size: 24px; color: #78350f; font-weight: 800;">
                Enterprise License Renewal for {{COMPANY_NAME}}
              </h1>
            </td>
          </tr>

          <!-- 5. MAIN CONTENT -->
          <tr>
            <td style="padding: 10px 36px 18px; font-size: 15px; line-height: 24px; color: #334155;">
              <p style="margin: 0 0 14px;">Dear {{FIRST_NAME}},</p>
              <p style="margin: 0;">
                We would like to remind you that the annual enterprise software maintenance and cloud sync SLA for {{COMPANY_NAME}} is scheduled for renewal on October 31, 2026. Early confirmation ensures uninterrupted Tally synchronization and dedicated support throughput.
              </p>
            </td>
          </tr>

          <!-- 6. BENEFITS SECTION -->
          <tr>
            <td style="padding: 0 36px 24px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 14px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 6px; font-size: 13px; font-weight: bold; color: #92400e;">Renewal Guarantee Privileges:</p>
                    <p style="margin: 0 0 4px; font-size: 13px; color: #b45309;">&bull; Guaranteed 2026-2027 price protection with zero inflationary increases</p>
                    <p style="margin: 0; font-size: 13px; color: #b45309;">&bull; Continued 24/7 mission-critical architectural uptime coverage</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 7. CTA -->
          <tr>
            <td align="center" style="padding: 0 36px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #d97706;">
                    <a href="https://portal.digisoft.com/renewals?org={{COMPANY_NAME}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 6px;">
                      Confirm 1-Click Contract Renewal &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 8. CONTACT INFORMATION -->
          <tr>
            <td style="padding: 16px 36px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0;">Dedicated Account Executive: renewals@digisoft.com | Phone: +91 80 4123 4567</p>
            </td>
          </tr>

          <!-- 9. FOOTER & 10. UNSUBSCRIBE LINK -->
          <tr>
            <td style="padding: 24px 36px; background-color: #451a03; color: #fde68a; font-size: 11px; line-height: 18px; text-align: center;">
              <p style="margin: 0 0 6px;">&copy; 2026 DIGISOFT Platform. Registered Headquarters: {{COMPANY_ADDRESS}}</p>
              <p style="margin: 0;">
                <a href="{{PRIVACY_POLICY_URL}}" style="color: #fef3c7;">Privacy Policy</a> &bull; 
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #fef3c7;">Unsubscribe from Renewal Reminders</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`,
    plainTextContent: `ANNUAL ENTERPRISE LICENSE RENEWAL FOR {{COMPANY_NAME}}

Dear {{FIRST_NAME}},

The annual enterprise software maintenance and cloud sync SLA for {{COMPANY_NAME}} is scheduled for renewal on October 31, 2026.

RENEWAL PRIVILEGES:
- Guaranteed price protection with zero inflationary increases
- Continued 24/7 mission-critical architectural uptime coverage

RENEW ONLINE:
https://portal.digisoft.com/renewals?org={{COMPANY_NAME}}

Dedicated Account Executive: renewals@digisoft.com | Phone: +91 80 4123 4567
Registered Address: {{COMPANY_ADDRESS}}
Unsubscribe: {{UNSUBSCRIBE_URL}}`
  }
];
