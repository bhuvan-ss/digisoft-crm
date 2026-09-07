import { Contact, Company, TemplateValidationResult, TemplateValidationError } from '../types';

export interface TemplateVariableDef {
  key: string;
  name: string;
  category: 'Contact' | 'Company' | 'Compliance & Brand';
  sampleValue: string;
  description: string;
  required?: boolean;
}

export const SUPPORTED_TEMPLATE_VARIABLES: TemplateVariableDef[] = [
  {
    key: '{{CONTACT_NAME}}',
    name: 'Contact Full Name',
    category: 'Contact',
    sampleValue: 'Bhuvan Gupta',
    description: 'Full display name of the primary contact recipient.'
  },
  {
    key: '{{FIRST_NAME}}',
    name: 'First Name',
    category: 'Contact',
    sampleValue: 'Bhuvan',
    description: 'Recipient given first name for personal greetings.'
  },
  {
    key: '{{LAST_NAME}}',
    name: 'Last Name',
    category: 'Contact',
    sampleValue: 'Gupta',
    description: 'Recipient family or surname.'
  },
  {
    key: '{{COMPANY_NAME}}',
    name: 'Company Name',
    category: 'Company',
    sampleValue: 'Apex Infotech Solutions Pvt Ltd',
    description: 'Corporate client account or ledger party name.'
  },
  {
    key: '{{EMAIL}}',
    name: 'Email Address',
    category: 'Contact',
    sampleValue: 'bhuvan@apexinfotech.in',
    description: 'Verified recipient email destination.'
  },
  {
    key: '{{CITY}}',
    name: 'City',
    category: 'Contact',
    sampleValue: 'Bengaluru',
    description: 'Registered city / municipality.'
  },
  {
    key: '{{STATE}}',
    name: 'State',
    category: 'Contact',
    sampleValue: 'Karnataka',
    description: 'State / Province for regional targeting.'
  },
  {
    key: '{{UNSUBSCRIBE_URL}}',
    name: 'Unsubscribe Link URL',
    category: 'Compliance & Brand',
    sampleValue: 'https://mail.digisoft.com/unsubscribe?token=unsub-801-b7f2-990a',
    description: 'CAN-SPAM & GDPR compliant one-click opt-out URL (MANDATORY).',
    required: true
  },
  {
    key: '{{COMPANY_LOGO}}',
    name: 'Company Logo Image URL',
    category: 'Compliance & Brand',
    sampleValue: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80',
    description: 'Hosted brand logo for the email header.'
  },
  {
    key: '{{COMPANY_ADDRESS}}',
    name: 'Company Postal Address',
    category: 'Compliance & Brand',
    sampleValue: 'DIGISOFT Tower, Plot 42, Electronics City Phase 1, Bengaluru, Karnataka 560100, India',
    description: 'Physical registered address required by international spam laws (MANDATORY).',
    required: true
  },
  {
    key: '{{PRIVACY_POLICY_URL}}',
    name: 'Privacy Policy Link URL',
    category: 'Compliance & Brand',
    sampleValue: 'https://digisoft.com/privacy-policy',
    description: 'Link to corporate privacy & data security declaration.'
  }
];

export class EmailTemplateValidator {
  /**
   * Evaluates the template HTML for HTML structural standards, email client compatibility,
   * CAN-SPAM / GDPR mandatory variables, dangerous scripts, and broken tags.
   */
  public static validate(
    html: string,
    subjectDefault: string = '',
    preheaderDefault: string = ''
  ): TemplateValidationResult {
    const errors: TemplateValidationError[] = [];
    const warnings: TemplateValidationError[] = [];

    if (!html || html.trim().length === 0) {
      return {
        isValid: false,
        score: 0,
        errors: [{
          type: 'error',
          code: 'EMPTY_HTML',
          message: 'Template HTML content cannot be empty.',
          suggestion: 'Provide table-based email HTML.'
        }],
        warnings: [],
        detectedVariables: [],
        missingRequiredVariables: ['{{UNSUBSCRIBE_URL}}', '{{COMPANY_ADDRESS}}'],
        hasDangerousContent: false,
        hasUnsubscribeUrl: false,
        hasCompanyAddress: false,
        hasPreheader: false,
        isTableBased: false
      };
    }

    const lower = html.toLowerCase();

    // 1. Dangerous Content & Script Injection Checks
    const scriptTagRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    const dangerousTagsRegex = /<(iframe|object|embed|applet|meta|form|input|button)\b/gi;
    const inlineEventsRegex = /\bon[a-z]+\s*=\s*(['"]).*?\1/gi;
    const javascriptProtocolRegex = /href\s*=\s*(['"])javascript:.*?\1/gi;

    let hasDangerous = false;

    if (scriptTagRegex.test(html)) {
      hasDangerous = true;
      errors.push({
        type: 'error',
        code: 'SECURITY_SCRIPT_TAG',
        message: 'Security Violation: <script> tags are strictly forbidden in email HTML.',
        suggestion: 'Remove all executable JavaScript; email clients block scripts automatically.'
      });
    }

    if (dangerousTagsRegex.test(html)) {
      hasDangerous = true;
      errors.push({
        type: 'error',
        code: 'SECURITY_FORBIDDEN_TAG',
        message: 'Unsupported or risky HTML elements found (<iframe, <object, <embed, etc.).',
        suggestion: 'Remove embedding tags to ensure inbox delivery.'
      });
    }

    if (inlineEventsRegex.test(html)) {
      hasDangerous = true;
      errors.push({
        type: 'error',
        code: 'SECURITY_INLINE_EVENT',
        message: 'Inline JavaScript handlers (e.g. onload, onclick, onerror) are prohibited.',
        suggestion: 'Remove all DOM event listeners.'
      });
    }

    if (javascriptProtocolRegex.test(html)) {
      hasDangerous = true;
      errors.push({
        type: 'error',
        code: 'SECURITY_JAVASCRIPT_URI',
        message: 'Hyperlinks using "javascript:" protocol detected.',
        suggestion: 'Replace with valid https:// links.'
      });
    }

    // 2. Mandatory Compliance Variables Check
    const hasUnsubscribeUrl = html.includes('{{UNSUBSCRIBE_URL}}');
    const hasCompanyAddress = html.includes('{{COMPANY_ADDRESS}}');

    const missingRequired: string[] = [];
    if (!hasUnsubscribeUrl) {
      missingRequired.push('{{UNSUBSCRIBE_URL}}');
      errors.push({
        type: 'error',
        code: 'COMPLIANCE_UNSUBSCRIBE_MISSING',
        message: 'Mandatory {{UNSUBSCRIBE_URL}} tag missing from template.',
        suggestion: 'Include {{UNSUBSCRIBE_URL}} in the footer to comply with CAN-SPAM and avoid spam traps.'
      });
    }

    if (!hasCompanyAddress) {
      missingRequired.push('{{COMPANY_ADDRESS}}');
      warnings.push({
        type: 'warning',
        code: 'COMPLIANCE_COMPANY_ADDRESS_MISSING',
        message: 'Physical postal address variable {{COMPANY_ADDRESS}} is recommended.',
        suggestion: 'Include {{COMPANY_ADDRESS}} in the footer to avoid email provider filtering.'
      });
    }

    // 3. Variable Detection & Broken Syntax Checks
    const allowedKeys = new Set(SUPPORTED_TEMPLATE_VARIABLES.map(v => v.key));
    const allVariableMatches = html.match(/\{\{[^}]+\}\}/g) || [];
    const detectedVariables = Array.from(new Set(allVariableMatches));

    // Check for broken open/close braces e.g. {{CONTACT_NAME without closing }}
    const unclosedMatches = html.match(/\{\{[A-Z0-9_]+(?!\}\})/g);
    if (unclosedMatches && unclosedMatches.length > 0) {
      errors.push({
        type: 'error',
        code: 'SYNTAX_UNCLOSED_VARIABLE',
        message: `Broken merge variable syntax detected: ${unclosedMatches.slice(0, 3).join(', ')}`,
        suggestion: 'Ensure all variables are closed with double curly braces (e.g. {{FIRST_NAME}}).'
      });
    }

    // Check for unrecognized variables
    for (const token of detectedVariables) {
      if (!allowedKeys.has(token)) {
        warnings.push({
          type: 'warning',
          code: 'UNRECOGNIZED_VARIABLE',
          message: `Variable "${token}" is not in the standard system dictionary.`,
          suggestion: 'Check spelling against supported list or confirm custom data mapping.'
        });
      }
    }

    // 4. HTML Table-based Layout & Email Standards
    const isTableBased = lower.includes('<table') && lower.includes('cellpadding') && lower.includes('cellspacing');
    if (!isTableBased) {
      warnings.push({
        type: 'warning',
        code: 'CLIENT_COMPAT_NOT_TABLE',
        message: 'Modern table-based layout structure (<table cellpadding="0" cellspacing="0" border="0">) recommended for Outlook & desktop clients.',
        suggestion: 'Wrap layout sections in tables to prevent broken layouts in Microsoft Outlook.'
      });
    }

    // Max width check (600px standard)
    if (!html.includes('600') && !html.includes('max-width: 600px') && !html.includes('width: 600')) {
      warnings.push({
        type: 'warning',
        code: 'DESIGN_WIDTH_EXCEEDED',
        message: 'Standard 600px maximum width container not explicitly detected.',
        suggestion: 'Set container style to max-width: 600px for optimal desktop and mobile rendering.'
      });
    }

    // Check for Hidden Preheader
    const hasPreheader = preheaderDefault.trim().length > 0 || 
      lower.includes('display:none') || 
      lower.includes('display: none') || 
      lower.includes('preheader') ||
      lower.includes('mso-hide:all');

    if (!hasPreheader) {
      warnings.push({
        type: 'warning',
        code: 'DELIVERABILITY_NO_PREHEADER',
        message: 'Hidden preheader snippet not found.',
        suggestion: 'Add a hidden preheader in the first table row to control preview text in inbox list.'
      });
    }

    // Check for External CSS link tag (unsupported by Gmail)
    if (/<link\s+[^>]*rel=["']stylesheet["']/i.test(html)) {
      warnings.push({
        type: 'warning',
        code: 'CLIENT_EXTERNAL_STYLESHEET',
        message: 'External <link rel="stylesheet"> detected. Most clients (e.g. Gmail) strip external CSS.',
        suggestion: 'Inline your CSS styles using HTML style attributes.'
      });
    }

    // Calculate quality score (0 to 100)
    let score = 100;
    score -= errors.length * 25;
    score -= warnings.length * 7;
    if (!hasUnsubscribeUrl) score -= 30;
    if (!isTableBased) score -= 10;
    if (score < 0) score = 0;

    const isValid = errors.length === 0;

    return {
      isValid,
      score: Math.max(0, Math.min(100, score)),
      errors,
      warnings,
      detectedVariables,
      missingRequiredVariables: missingRequired,
      hasDangerousContent: hasDangerous,
      hasUnsubscribeUrl,
      hasCompanyAddress,
      hasPreheader,
      isTableBased
    };
  }

  /**
   * Sanitizes HTML by stripping out <script>, inline event listeners, and dangerous schemes.
   */
  public static sanitize(html: string): string {
    if (!html) return '';

    return html
      // Strip script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Strip dangerous tags
      .replace(/<(iframe|object|embed|applet|meta)\b[^>]*>(?:.*?<\/\1>)?/gi, '')
      // Strip inline event listeners
      .replace(/\s+on[a-z]+\s*=\s*(['"]).*?\1/gi, '')
      // Strip javascript: links
      .replace(/href\s*=\s*(['"])javascript:[^'"]*\1/gi, 'href="#"');
  }

  /**
   * Converts HTML into clean readable Plain Text for multi-part MIME email delivery.
   */
  public static generatePlainText(html: string): string {
    if (!html) return '';

    let text = html;

    // Remove head, style, script sections
    text = text.replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Format links: [Anchor Text] (https://url)
    text = text.replace(/<a\s+[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '$2 ($1)');

    // Line breaks for block elements
    text = text.replace(/<\/(p|div|tr|h1|h2|h3|h4|table|li)>/gi, '\n');
    text = text.replace(/<br\s*[\/]?>/gi, '\n');

    // Strip remaining tags
    text = text.replace(/<[^>]+>/gi, '');

    // Decode common entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&bull;/g, '•');

    // Consolidate whitespace
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
    return text.trim();
  }
}

export class TemplateVariableEngine {
  /**
   * Replaces all template variables with values from contact, company, or defaults.
   */
  public static replace(
    text: string,
    contact?: Partial<Contact> | null,
    company?: Partial<Company> | null,
    customOverrides?: Record<string, string>
  ): string {
    if (!text) return '';

    const contactName = contact 
      ? (contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Valued Partner')
      : 'Bhuvan Gupta';

    const firstName = contact?.firstName || (contactName.split(' ')[0] || 'Valued');
    const lastName = contact?.lastName || (contactName.split(' ').slice(1).join(' ') || 'Partner');
    const companyName = contact?.companyName || company?.name || company?.companyName || 'Apex Infotech Solutions Pvt Ltd';
    const email = contact?.email || 'bhuvan@apexinfotech.in';
    const city = contact?.city || company?.city || 'Bengaluru';
    const state = contact?.state || company?.state || 'Karnataka';

    const unsubToken = contact?.unsubscribeToken || 'unsub-801-sample';
    const unsubUrl = `https://mail.digisoft.com/unsubscribe?token=${encodeURIComponent(unsubToken)}`;
    const companyLogo = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80';
    const companyAddress = 'DIGISOFT Tower, Plot 42, Electronics City Phase 1, Bengaluru, Karnataka 560100, India';
    const privacyPolicyUrl = 'https://digisoft.com/privacy-policy';

    const dictionary: Record<string, string> = {
      '{{CONTACT_NAME}}': contactName,
      '{{FIRST_NAME}}': firstName,
      '{{LAST_NAME}}': lastName,
      '{{COMPANY_NAME}}': companyName,
      '{{EMAIL}}': email,
      '{{CITY}}': city,
      '{{STATE}}': state,
      '{{UNSUBSCRIBE_URL}}': unsubUrl,
      '{{COMPANY_LOGO}}': companyLogo,
      '{{COMPANY_ADDRESS}}': companyAddress,
      '{{PRIVACY_POLICY_URL}}': privacyPolicyUrl,
      ...(customOverrides || {})
    };

    let result = text;
    for (const [key, val] of Object.entries(dictionary)) {
      result = result.split(key).join(val);
    }

    return result;
  }

  /**
   * Returns a map of variables and their preview values for the given contact.
   */
  public static getPreviewDictionary(
    contact?: Partial<Contact> | null,
    company?: Partial<Company> | null
  ): Record<string, string> {
    const contactName = contact 
      ? (contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Valued Partner')
      : 'Bhuvan Gupta';

    return {
      '{{CONTACT_NAME}}': contactName,
      '{{FIRST_NAME}}': contact?.firstName || (contactName.split(' ')[0] || 'Valued'),
      '{{LAST_NAME}}': contact?.lastName || (contactName.split(' ').slice(1).join(' ') || 'Partner'),
      '{{COMPANY_NAME}}': contact?.companyName || company?.name || company?.companyName || 'Apex Infotech Solutions Pvt Ltd',
      '{{EMAIL}}': contact?.email || 'bhuvan@apexinfotech.in',
      '{{CITY}}': contact?.city || company?.city || 'Bengaluru',
      '{{STATE}}': contact?.state || company?.state || 'Karnataka',
      '{{UNSUBSCRIBE_URL}}': `https://mail.digisoft.com/unsubscribe?token=${contact?.unsubscribeToken || 'demo-sample-token'}`,
      '{{COMPANY_LOGO}}': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80',
      '{{COMPANY_ADDRESS}}': 'DIGISOFT Tower, Plot 42, Electronics City Phase 1, Bengaluru, Karnataka 560100, India',
      '{{PRIVACY_POLICY_URL}}': 'https://digisoft.com/privacy-policy'
    };
  }
}
