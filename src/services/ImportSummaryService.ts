import { ImportErrorItem, ImportSummaryStats } from '../types';

export class ImportSummaryService {
  /**
   * Group errors by field name for analytics breakdown
   */
  public static summarizeErrors(errors: ImportErrorItem[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const err of errors) {
      const field = err.fieldName || 'general';
      counts[field] = (counts[field] || 0) + 1;
    }
    return counts;
  }

  /**
   * Generate downloadable CSV for error rows
   */
  public static generateErrorCsv(errors: ImportErrorItem[]): string {
    const headers = ['Row Number', 'Field Name', 'Error Reason', 'Raw Data Payload'];
    const rows = errors.map((e) => [
      e.rowNumber,
      `"${(e.fieldName || '').replace(/"/g, '""')}"`,
      `"${(e.errorMessage || '').replace(/"/g, '""')}"`,
      `"${JSON.stringify(e.rawData).replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Download CSV directly in browser
   */
  public static triggerDownload(csvContent: string, fileName: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate scalable enterprise benchmark dataset with specified row count
   * Contains realistic Indian corporate leads, valid emails, phones, GSTINs, 
   * duplicate records, and invalid formatting to test chunk engine thoroughly.
   */
  public static generateBenchmarkDataset(rowCount: number): Array<Record<string, any>> {
    const firstNames = ['Aarav', 'Vihaan', 'Aditi', 'Priya', 'Rohan', 'Ananya', 'Kavita', 'Vikram', 'Rajesh', 'Sunita', 'Rahul', 'Deepak', 'Suresh', 'Sneha', 'Meera'];
    const lastNames = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Reddy', 'Mehta', 'Iyer', 'Nair', 'Singh', 'Chopra', 'Deshmukh', 'Bansal', 'Joshi', 'Aggarwal'];
    const companies = ['Tata Consultancy', 'Infosys Tech', 'Reliance Retail', 'HDFC Enterprise', 'Wipro Digital', 'Mahindra Logistics', 'Zomato Operations', 'Swiggy Fleet', 'Bajaj Auto', 'Titan Industries'];
    const cities = ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Ahmedabad', 'Kolkata', 'Jaipur', 'Surat'];
    const designations = ['Procurement Head', 'Finance Director', 'Supply Chain VP', 'Operations Manager', 'VP of Marketing', 'Chief Technology Officer', 'General Counsel'];

    const dataset: Array<Record<string, any>> = [];

    for (let i = 0; i < rowCount; i++) {
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[(i * 3) % lastNames.length];
      const comp = companies[(i * 7) % companies.length];
      const city = cities[(i * 2) % cities.length];
      const role = designations[i % designations.length];
      const mobileNum = 9800000000 + (i % 89999999);
      const balance = (i % 4 === 0) ? (i * 1250) % 450000 : 0;

      // Introduce controlled edge cases:
      // ~2% missing both identifiers (will fail validation)
      // ~3% invalid email syntax
      // ~5% invalid GSTIN
      const isMissingIdentifier = i > 10 && i % 47 === 0;
      const isMalformedEmail = i > 15 && i % 31 === 0;
      const isDuplicate = i > 20 && i % 5 === 0;

      let email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@${comp.toLowerCase().replace(/\s+/g, '')}.in`;
      let mobile = `+91 ${mobileNum}`;

      if (isDuplicate) {
        // Reuse email from early records to trigger duplicate logic
        const dupIndex = i % 15;
        email = `${firstNames[dupIndex].toLowerCase()}.${lastNames[(dupIndex * 3) % lastNames.length].toLowerCase()}${dupIndex}@${companies[(dupIndex * 7) % companies.length].toLowerCase().replace(/\s+/g, '')}.in`;
      }

      if (isMalformedEmail) {
        email = `invalid@@${comp.toLowerCase()}.com`;
      }

      if (isMissingIdentifier) {
        email = '';
        mobile = '';
      }

      const gstin = (i % 2 === 0) 
        ? `29${fn.slice(0, 2).toUpperCase()}PA${1000 + (i % 8999)}F1Z5`
        : (i % 37 === 0 ? 'MALFORMED_GSTIN' : '');

      dataset.push({
        'Full Name': `${fn} ${ln}`,
        'Email ID': email,
        'Mobile No': mobile,
        'Company Name': comp,
        'GST No': gstin,
        'Designation': role,
        'City': city,
        'State': 'Karnataka',
        'Outstanding Balance': balance > 0 ? `INR ${balance.toLocaleString('en-IN')}` : '0.00',
        'Tags': i % 3 === 0 ? 'Enterprise, High Value' : 'Lead, Inbound',
      });
    }

    return dataset;
  }
}
