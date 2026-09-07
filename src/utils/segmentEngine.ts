import { 
  SegmentOperator, 
  RuleFieldCategory, 
  SegmentRuleGroup, 
  SegmentRuleCondition, 
  Contact, 
  Company 
} from '../types';

export interface FieldDefinition {
  id: string;
  name: string;
  category: RuleFieldCategory;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'tags';
  options?: string[];
  placeholder?: string;
  defaultOperator: SegmentOperator;
  allowedOperators: SegmentOperator[];
  column: string; // Database table.column
}

export const OPERATOR_LABELS: Record<SegmentOperator, string> = {
  equals: 'Equals (=)',
  not_equals: 'Not Equals (≠)',
  contains: 'Contains',
  starts_with: 'Starts With',
  ends_with: 'Ends With',
  in: 'In (Any of)',
  not_in: 'Not In (None of)',
  greater_than: 'Greater Than (>)',
  less_than: 'Less Than (<)',
  between: 'Between (Range)',
  is_empty: 'Is Empty / Null',
  is_not_empty: 'Is Not Empty',
};

export const AVAILABLE_FILTER_FIELDS: FieldDefinition[] = [
  // --- Contact Category ---
  {
    id: 'name',
    name: 'Contact Full Name',
    category: 'contact',
    type: 'text',
    placeholder: 'e.g. Bhuvan Gupta',
    defaultOperator: 'contains',
    allowedOperators: ['equals', 'not_equals', 'contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
    column: 'contacts.full_name',
  },
  {
    id: 'email',
    name: 'Email Address',
    category: 'contact',
    type: 'text',
    placeholder: 'e.g. @gmail.com or domain.com',
    defaultOperator: 'contains',
    allowedOperators: ['equals', 'not_equals', 'contains', 'ends_with', 'is_empty', 'is_not_empty'],
    column: 'contacts.email',
  },
  {
    id: 'mobile',
    name: 'Mobile / Phone Number',
    category: 'contact',
    type: 'text',
    placeholder: 'e.g. +91 or 9876',
    defaultOperator: 'starts_with',
    allowedOperators: ['equals', 'not_equals', 'contains', 'starts_with', 'is_empty', 'is_not_empty'],
    column: 'contacts.mobile',
  },
  {
    id: 'city',
    name: 'City',
    category: 'contact',
    type: 'select',
    options: ['Delhi', 'Noida', 'Gurgaon', 'Ghaziabad', 'Mumbai', 'Bengaluru', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Chandigarh'],
    defaultOperator: 'in',
    allowedOperators: ['equals', 'not_equals', 'in', 'not_in', 'contains', 'is_empty', 'is_not_empty'],
    column: 'contacts.city',
  },
  {
    id: 'state',
    name: 'State',
    category: 'contact',
    type: 'select',
    options: ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Haryana', 'Uttar Pradesh', 'Telangana', 'West Bengal', 'Rajasthan'],
    defaultOperator: 'equals',
    allowedOperators: ['equals', 'not_equals', 'in', 'not_in', 'is_empty', 'is_not_empty'],
    column: 'contacts.state',
  },
  {
    id: 'country',
    name: 'Country',
    category: 'contact',
    type: 'select',
    options: ['India', 'United States', 'United Arab Emirates', 'Singapore', 'United Kingdom'],
    defaultOperator: 'equals',
    allowedOperators: ['equals', 'not_equals', 'is_empty', 'is_not_empty'],
    column: 'contacts.country',
  },
  {
    id: 'source',
    name: 'Lead / Contact Source',
    category: 'contact',
    type: 'select',
    options: ['TALLY', 'IMPORT', 'CSV_IMPORT', 'WEBSITE', 'MANUAL'],
    defaultOperator: 'equals',
    allowedOperators: ['equals', 'not_equals', 'in', 'not_in'],
    column: 'contacts.source',
  },
  {
    id: 'marketing_status',
    name: 'Marketing Status',
    category: 'contact',
    type: 'select',
    options: ['ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED'],
    defaultOperator: 'equals',
    allowedOperators: ['equals', 'not_equals', 'in', 'not_in'],
    column: 'contacts.marketing_status',
  },
  {
    id: 'tags',
    name: 'Contact Tags',
    category: 'contact',
    type: 'tags',
    options: ['TallyPrime Customer', 'Sundry Debtor', 'Decision Maker', 'High Value', 'GST Customer', 'Prospect', 'Dealer', 'VIP'],
    defaultOperator: 'contains',
    allowedOperators: ['contains', 'not_equals', 'in', 'is_empty', 'is_not_empty'],
    column: 'contacts.tags',
  },
  {
    id: 'created_at',
    name: 'Created Date',
    category: 'contact',
    type: 'date',
    defaultOperator: 'greater_than',
    allowedOperators: ['greater_than', 'less_than', 'between', 'equals'],
    column: 'contacts.created_at',
  },

  // --- Company Category ---
  {
    id: 'industry',
    name: 'Company Industry',
    category: 'company',
    type: 'select',
    options: ['Manufacturing', 'Trading', 'Enterprise Software & IT', 'Retail & Distribution', 'Automotive', 'Textiles & Apparel', 'Cloud Infrastructure', 'Healthcare & Pharma'],
    defaultOperator: 'equals',
    allowedOperators: ['equals', 'not_equals', 'in', 'not_in', 'is_empty', 'is_not_empty'],
    column: 'companies.industry',
  },
  {
    id: 'gstin',
    name: 'Company GSTIN',
    category: 'company',
    type: 'text',
    placeholder: 'e.g. 07 or 27 (15 chars)',
    defaultOperator: 'starts_with',
    allowedOperators: ['equals', 'not_equals', 'starts_with', 'contains', 'is_empty', 'is_not_empty'],
    column: 'companies.gstin',
  },
  {
    id: 'company_type',
    name: 'Company Type / Structure',
    category: 'company',
    type: 'select',
    options: ['Private Limited', 'Public Limited', 'LLP', 'Partnership', 'Proprietorship'],
    defaultOperator: 'equals',
    allowedOperators: ['equals', 'not_equals', 'in', 'not_in', 'is_empty', 'is_not_empty'],
    column: 'companies.company_type',
  },

  // --- Tally Financial Category ---
  {
    id: 'tally_ledger_group',
    name: 'Tally Ledger Group',
    category: 'tally',
    type: 'select',
    options: ['Sundry Debtors', 'Customers', 'Dealers', 'Distributors', 'Sundry Creditors'],
    defaultOperator: 'equals',
    allowedOperators: ['equals', 'not_equals', 'in', 'not_in', 'is_empty', 'is_not_empty'],
    column: 'contacts.tally_ledger_group',
  },
  {
    id: 'tally_outstanding_balance',
    name: 'Tally Outstanding Amount (₹)',
    category: 'tally',
    type: 'number',
    placeholder: 'e.g. 50000',
    defaultOperator: 'greater_than',
    allowedOperators: ['equals', 'not_equals', 'greater_than', 'less_than', 'between'],
    column: 'contacts.tally_outstanding_balance',
  },
  {
    id: 'last_transaction_date',
    name: 'Last Transaction Date (Days Ago / Date)',
    category: 'tally',
    type: 'number',
    placeholder: 'e.g. 180 (days ago)',
    defaultOperator: 'greater_than',
    allowedOperators: ['greater_than', 'less_than', 'between', 'equals', 'is_empty', 'is_not_empty'],
    column: 'contacts.last_transaction_date',
  },

  // --- Email Activity Category ---
  {
    id: 'last_email_sent_at',
    name: 'Last Email Sent Date',
    category: 'activity',
    type: 'date',
    defaultOperator: 'greater_than',
    allowedOperators: ['greater_than', 'less_than', 'between', 'is_empty', 'is_not_empty'],
    column: 'contacts.last_email_sent_at',
  },
  {
    id: 'last_email_opened_at',
    name: 'Last Email Opened Date',
    category: 'activity',
    type: 'date',
    defaultOperator: 'greater_than',
    allowedOperators: ['greater_than', 'less_than', 'between', 'is_empty', 'is_not_empty'],
    column: 'contacts.last_email_opened_at',
  },
  {
    id: 'total_emails_opened',
    name: 'Opened Campaign Count',
    category: 'activity',
    type: 'number',
    placeholder: 'e.g. 1',
    defaultOperator: 'greater_than',
    allowedOperators: ['equals', 'greater_than', 'less_than', 'between'],
    column: 'contacts.total_emails_opened',
  },
  {
    id: 'total_emails_clicked',
    name: 'Clicked Campaign Count',
    category: 'activity',
    type: 'number',
    placeholder: 'e.g. 1',
    defaultOperator: 'greater_than',
    allowedOperators: ['equals', 'greater_than', 'less_than', 'between'],
    column: 'contacts.total_emails_clicked',
  },
];

// Presets from User Prompt Examples
export const PRESET_SEGMENT_TEMPLATES: {
  name: string;
  description: string;
  group: SegmentRuleGroup;
}[] = [
  {
    name: 'TallyPrime Customers in Delhi NCR',
    description: 'Source = TALLY AND (State = Delhi OR City IN Noida, Ghaziabad, Gurgaon) AND Marketing Status = ACTIVE',
    group: {
      id: 'grp-delhi-ncr',
      type: 'group',
      logicalOperator: 'AND',
      children: [
        {
          id: 'c1',
          type: 'condition',
          field: 'source',
          category: 'contact',
          operator: 'equals',
          value: 'TALLY',
        },
        {
          id: 'grp-nested-geo',
          type: 'group',
          logicalOperator: 'OR',
          children: [
            {
              id: 'c2',
              type: 'condition',
              field: 'state',
              category: 'contact',
              operator: 'equals',
              value: 'Delhi',
            },
            {
              id: 'c3',
              type: 'condition',
              field: 'city',
              category: 'contact',
              operator: 'in',
              value: ['Noida', 'Ghaziabad', 'Gurgaon'],
            },
          ],
        },
        {
          id: 'c4',
          type: 'condition',
          field: 'marketing_status',
          category: 'contact',
          operator: 'equals',
          value: 'ACTIVE',
        },
      ],
    },
  },
  {
    name: 'Inactive Customers (> 180 Days Inactivity)',
    description: 'Last Transaction Date > 180 Days AND Marketing Status = ACTIVE',
    group: {
      id: 'grp-inactive',
      type: 'group',
      logicalOperator: 'AND',
      children: [
        {
          id: 'c-inact-1',
          type: 'condition',
          field: 'last_transaction_date',
          category: 'tally',
          operator: 'greater_than',
          value: 180,
        },
        {
          id: 'c-inact-2',
          type: 'condition',
          field: 'marketing_status',
          category: 'contact',
          operator: 'equals',
          value: 'ACTIVE',
        },
      ],
    },
  },
  {
    name: 'Manufacturing & Trading Sundry Debtors',
    description: '(Industry = Manufacturing OR Industry = Trading) AND State = Delhi AND Marketing Status = ACTIVE',
    group: {
      id: 'grp-mfg-trading',
      type: 'group',
      logicalOperator: 'AND',
      children: [
        {
          id: 'grp-ind-nested',
          type: 'group',
          logicalOperator: 'OR',
          children: [
            {
              id: 'c-ind-1',
              type: 'condition',
              field: 'industry',
              category: 'company',
              operator: 'equals',
              value: 'Manufacturing',
            },
            {
              id: 'c-ind-2',
              type: 'condition',
              field: 'industry',
              category: 'company',
              operator: 'equals',
              value: 'Trading',
            },
          ],
        },
        {
          id: 'c-state-1',
          type: 'condition',
          field: 'state',
          category: 'contact',
          operator: 'equals',
          value: 'Delhi',
        },
        {
          id: 'c-status-1',
          type: 'condition',
          field: 'marketing_status',
          category: 'contact',
          operator: 'equals',
          value: 'ACTIVE',
        },
      ],
    },
  },
  {
    name: 'High Value Sundry Debtors (> ₹50,000 Overdue)',
    description: 'Tally Outstanding > ₹50,000 AND Ledger Group = Sundry Debtors AND Marketing Status = ACTIVE',
    group: {
      id: 'grp-high-value',
      type: 'group',
      logicalOperator: 'AND',
      children: [
        {
          id: 'c-bal-1',
          type: 'condition',
          field: 'tally_outstanding_balance',
          category: 'tally',
          operator: 'greater_than',
          value: 50000,
        },
        {
          id: 'c-grp-1',
          type: 'condition',
          field: 'tally_ledger_group',
          category: 'tally',
          operator: 'equals',
          value: 'Sundry Debtors',
        },
        {
          id: 'c-stat-1',
          type: 'condition',
          field: 'marketing_status',
          category: 'contact',
          operator: 'equals',
          value: 'ACTIVE',
        },
      ],
    },
  },
];

/**
 * Extracts a normalized field value from a Contact / Company record.
 */
export function getContactFieldValue(contact: Contact, company: Company | undefined, fieldId: string): any {
  switch (fieldId) {
    case 'name':
      return contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
    case 'email':
      return contact.email;
    case 'mobile':
      return contact.mobile || contact.phone;
    case 'city':
      return contact.city;
    case 'state':
      return contact.state;
    case 'country':
      return contact.country || 'India';
    case 'source':
      return contact.source;
    case 'marketing_status':
      return contact.marketingStatus;
    case 'tags':
      return contact.tags || [];
    case 'created_at':
      return contact.createdAt;
    case 'industry':
      return contact.industry || company?.industry || '';
    case 'gstin':
      return company?.gstin || '';
    case 'company_type':
      return company?.status || 'Private Limited';
    case 'tally_ledger_group':
      return company?.tallyLedgerGroup || 'Sundry Debtors';
    case 'tally_outstanding_balance':
      return contact.tallyOutstandingBalance ?? company?.outstandingBalance ?? 0;
    case 'last_transaction_date':
      // Return simulated days ago for inactivity rules
      return contact.tallyOverdueDays || 45;
    case 'last_email_sent_at':
      return contact.lastEmailSentAt;
    case 'last_email_opened_at':
      return contact.lastEmailOpenedAt;
    case 'total_emails_opened':
      return contact.totalEmailsOpened || 0;
    case 'total_emails_clicked':
      return contact.totalEmailsClicked || 0;
    default:
      return (contact as any)[fieldId];
  }
}

/**
 * Evaluates a single rule condition against a Contact.
 */
export function evaluateCondition(condition: SegmentRuleCondition, contact: Contact, company?: Company): boolean {
  const rawValue = getContactFieldValue(contact, company, condition.field);
  const operator = condition.operator;
  const target = condition.value;

  // Handle empty operators first
  if (operator === 'is_empty') {
    return rawValue === null || rawValue === undefined || rawValue === '' || (Array.isArray(rawValue) && rawValue.length === 0);
  }
  if (operator === 'is_not_empty') {
    return rawValue !== null && rawValue !== undefined && rawValue !== '' && (!Array.isArray(rawValue) || rawValue.length > 0);
  }

  if (rawValue === null || rawValue === undefined) {
    return false;
  }

  switch (operator) {
    case 'equals':
      if (typeof rawValue === 'number' || typeof target === 'number') {
        return Number(rawValue) === Number(target);
      }
      return String(rawValue).trim().toLowerCase() === String(target).trim().toLowerCase();

    case 'not_equals':
      if (typeof rawValue === 'number' || typeof target === 'number') {
        return Number(rawValue) !== Number(target);
      }
      return String(rawValue).trim().toLowerCase() !== String(target).trim().toLowerCase();

    case 'contains':
      if (Array.isArray(rawValue)) {
        return rawValue.some(item => String(item).toLowerCase().includes(String(target).toLowerCase()));
      }
      return String(rawValue).toLowerCase().includes(String(target).toLowerCase());

    case 'starts_with':
      return String(rawValue).toLowerCase().startsWith(String(target).toLowerCase());

    case 'ends_with':
      return String(rawValue).toLowerCase().endsWith(String(target).toLowerCase());

    case 'in': {
      const allowed = Array.isArray(target) 
        ? target.map(t => String(t).toLowerCase().trim()) 
        : String(target).split(',').map(t => t.toLowerCase().trim());
      return allowed.includes(String(rawValue).toLowerCase().trim());
    }

    case 'not_in': {
      const forbidden = Array.isArray(target) 
        ? target.map(t => String(t).toLowerCase().trim()) 
        : String(target).split(',').map(t => t.toLowerCase().trim());
      return !forbidden.includes(String(rawValue).toLowerCase().trim());
    }

    case 'greater_than':
      return (Number(rawValue) || 0) > (Number(target) || 0);

    case 'less_than':
      return (Number(rawValue) || 0) < (Number(target) || 0);

    case 'between': {
      const val = Number(rawValue) || 0;
      if (Array.isArray(target) && target.length >= 2) {
        return val >= Number(target[0]) && val <= Number(target[1]);
      }
      if (typeof target === 'string' && target.includes('-')) {
        const [min, max] = target.split('-').map(Number);
        return val >= min && val <= max;
      }
      return true;
    }

    default:
      return true;
  }
}

/**
 * Recursively evaluates a SegmentRuleGroup across all conditions and nested child groups.
 */
export function evaluateRuleTree(
  group: SegmentRuleGroup, 
  contact: Contact, 
  companyMap: Map<string, Company>
): boolean {
  // If contact is suppressed, they must NOT be included in active email marketing segments
  if (contact.isSuppressed && contact.marketingStatus === 'UNSUBSCRIBED') {
    return false;
  }

  if (!group || !group.children || group.children.length === 0) {
    return true;
  }

  const company = contact.companyId ? companyMap.get(contact.companyId) : undefined;
  const isAnd = group.logicalOperator === 'AND';

  for (const child of group.children) {
    let result = false;
    if (child.type === 'condition') {
      result = evaluateCondition(child, contact, company);
    } else if (child.type === 'group') {
      result = evaluateRuleTree(child, contact, companyMap);
    }

    if (isAnd && !result) {
      return false; // Short circuit AND
    }
    if (!isAnd && result) {
      return true; // Short circuit OR
    }
  }

  return isAnd ? true : false;
}

/**
 * Compiles a SegmentRuleGroup into an optimized, parameterized SQL statement with table JOINs.
 */
export function compileSegmentToSql(group: SegmentRuleGroup): { sql: string; indexesUsed: string[] } {
  const indexes: string[] = ['idx_contacts_marketing_status', 'idx_contacts_email_source'];

  function compileNode(node: SegmentRuleGroup | SegmentRuleCondition): string {
    if (node.type === 'condition') {
      const fieldDef = AVAILABLE_FILTER_FIELDS.find(f => f.id === node.field);
      const col = fieldDef?.column || `contacts.${node.field}`;

      if (col.startsWith('companies.') && !indexes.includes('idx_companies_industry_gstin')) {
        indexes.push('idx_companies_industry_gstin');
      }
      if (col.includes('city') || col.includes('state')) {
        if (!indexes.includes('idx_contacts_state_city')) indexes.push('idx_contacts_state_city');
      }
      if (col.includes('tally_outstanding_balance')) {
        if (!indexes.includes('idx_contacts_tally_balance')) indexes.push('idx_contacts_tally_balance');
      }

      switch (node.operator) {
        case 'equals':
          return typeof node.value === 'number' ? `${col} = ${node.value}` : `${col} = '${String(node.value).replace(/'/g, "''")}'`;
        case 'not_equals':
          return typeof node.value === 'number' ? `${col} != ${node.value}` : `${col} != '${String(node.value).replace(/'/g, "''")}'`;
        case 'contains':
          return `${col} ILIKE '%${String(node.value).replace(/'/g, "''")}%'`;
        case 'starts_with':
          return `${col} ILIKE '${String(node.value).replace(/'/g, "''")}%'`;
        case 'ends_with':
          return `${col} ILIKE '%${String(node.value).replace(/'/g, "''")}'`;
        case 'in': {
          const list = Array.isArray(node.value) ? node.value : String(node.value).split(',');
          const inVals = list.map(v => `'${String(v).trim().replace(/'/g, "''")}'`).join(', ');
          return `${col} IN (${inVals})`;
        }
        case 'not_in': {
          const list = Array.isArray(node.value) ? node.value : String(node.value).split(',');
          const inVals = list.map(v => `'${String(v).trim().replace(/'/g, "''")}'`).join(', ');
          return `${col} NOT IN (${inVals})`;
        }
        case 'greater_than':
          return `${col} > ${node.value}`;
        case 'less_than':
          return `${col} < ${node.value}`;
        case 'between': {
          const [min, max] = Array.isArray(node.value) ? node.value : [0, 100000];
          return `${col} BETWEEN ${min} AND ${max}`;
        }
        case 'is_empty':
          return `(${col} IS NULL OR ${col} = '')`;
        case 'is_not_empty':
          return `(${col} IS NOT NULL AND ${col} != '')`;
        default:
          return '1=1';
      }
    } else {
      if (!node.children || node.children.length === 0) return '1=1';
      const childSql = node.children.map(compileNode).filter(Boolean);
      if (childSql.length === 0) return '1=1';
      if (childSql.length === 1) return childSql[0];
      return `(${childSql.join(` ${node.logicalOperator} `)})`;
    }
  }

  const whereClause = compileNode(group);

  const formattedSql = `-- DIGISOFT Optimized Keyset Query for Dynamic Segment Execution
SELECT 
    contacts.id,
    contacts.email,
    contacts.first_name,
    contacts.last_name,
    contacts.city,
    contacts.state,
    contacts.marketing_status,
    contacts.tally_outstanding_balance,
    companies.name AS company_name,
    companies.industry
FROM contacts
LEFT JOIN companies ON contacts.company_id = companies.id
WHERE contacts.deleted_at IS NULL
  AND contacts.marketing_status != 'UNSUBSCRIBED'
  AND ${whereClause}
ORDER BY contacts.id ASC
LIMIT 1000;`;

  return { sql: formattedSql, indexesUsed: indexes };
}
