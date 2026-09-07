export interface TallyParsedLedger {
  name: string;
  group: string;
  closingBalance: number;
  contactPerson: string;
  email: string;
  phone: string;
  gstin: string;
  city: string;
  state: string;
  creditDays: number;
  overdueDays: number;
}

/**
 * Builds standard TallyPrime XML Request Envelope for Ledger Export
 */
export function buildTallyExportXml(companyName: string, ledgerGroup = 'Sundry Debtors'): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>List of Accounts</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          <SVCURRENTCOMPANY>${escapeXml(companyName)}</SVCURRENTCOMPANY>
          <GROUPNAME>${escapeXml(ledgerGroup)}</GROUPNAME>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Returns realistic simulated TallyPrime XML response payload
 */
export function getSimulatedTallyXmlResponse(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <STATUS>1</STATUS>
  </HEADER>
  <BODY>
    <DATA>
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
        <LEDGER NAME="Apex Infotech Solutions Pvt Ltd" RESERVEDNAME="">
          <PARENT>Sundry Debtors</PARENT>
          <CLOSINGBALANCE>145200.00</CLOSINGBALANCE>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <PARTYGSTIN>29AAACA1234F1Z5</PARTYGSTIN>
          <LEDGERCONTACT>Bhuvan Gupta</LEDGERCONTACT>
          <EMAIL>bhuvangupta.1711@gmail.com</EMAIL>
          <LEDGERPHONE>+919876543210</LEDGERPHONE>
          <CITY>Bengaluru</CITY>
          <STATE>Karnataka</STATE>
          <BILLCREDITPERIOD>30 Days</BILLCREDITPERIOD>
          <OVERDUEDAYS>48</OVERDUEDAYS>
        </LEDGER>
        <LEDGER NAME="Bharat Logistics &amp; ColdChain Ltd" RESERVEDNAME="">
          <PARENT>Sundry Debtors</PARENT>
          <CLOSINGBALANCE>84300.00</CLOSINGBALANCE>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <PARTYGSTIN>27AABCB9876Q1Z2</PARTYGSTIN>
          <LEDGERCONTACT>Rajesh Nair</LEDGERCONTACT>
          <EMAIL>rajesh.nair@bharatlogix.com</EMAIL>
          <LEDGERPHONE>+919820011223</LEDGERPHONE>
          <CITY>Mumbai</CITY>
          <STATE>Maharashtra</STATE>
          <BILLCREDITPERIOD>30 Days</BILLCREDITPERIOD>
          <OVERDUEDAYS>32</OVERDUEDAYS>
        </LEDGER>
        <LEDGER NAME="Zenith Pharma &amp; Biotech Corp" RESERVEDNAME="">
          <PARENT>Sundry Debtors</PARENT>
          <CLOSINGBALANCE>298000.00</CLOSINGBALANCE>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <PARTYGSTIN>36AAACZ5544R1Z0</PARTYGSTIN>
          <LEDGERCONTACT>Ananya Deshmukh</LEDGERCONTACT>
          <EMAIL>ananya.d@zenithpharma.org</EMAIL>
          <LEDGERPHONE>+919949112233</LEDGERPHONE>
          <CITY>Hyderabad</CITY>
          <STATE>Telangana</STATE>
          <BILLCREDITPERIOD>30 Days</BILLCREDITPERIOD>
          <OVERDUEDAYS>64</OVERDUEDAYS>
        </LEDGER>
        <LEDGER NAME="Matrix Precision Components Pvt Ltd" RESERVEDNAME="">
          <PARENT>Sundry Debtors</PARENT>
          <CLOSINGBALANCE>62500.00</CLOSINGBALANCE>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <PARTYGSTIN>24AAACM3311J1Z8</PARTYGSTIN>
          <LEDGERCONTACT>Manoj Trivedi</LEDGERCONTACT>
          <EMAIL>manoj.t@matrixcomponents.com</EMAIL>
          <LEDGERPHONE>+919825044332</LEDGERPHONE>
          <CITY>Vadodara</CITY>
          <STATE>Gujarat</STATE>
          <BILLCREDITPERIOD>45 Days</BILLCREDITPERIOD>
          <OVERDUEDAYS>42</OVERDUEDAYS>
        </LEDGER>
      </TALLYMESSAGE>
    </DATA>
  </BODY>
</ENVELOPE>`;
}

/**
 * Parses Tally XML string to extract ledgers
 */
export function parseTallyXml(xmlString: string): TallyParsedLedger[] {
  const ledgers: TallyParsedLedger[] = [];
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    const ledgerNodes = xmlDoc.getElementsByTagName("LEDGER");

    for (let i = 0; i < ledgerNodes.length; i++) {
      const node = ledgerNodes[i];
      const name = node.getAttribute("NAME") || "Unknown Ledger";
      const group = getXmlTagValue(node, "PARENT") || "Sundry Debtors";
      const balanceStr = getXmlTagValue(node, "CLOSINGBALANCE") || "0";
      const closingBalance = Math.abs(parseFloat(balanceStr) || 0);
      const contactPerson = getXmlTagValue(node, "LEDGERCONTACT") || "";
      const email = getXmlTagValue(node, "EMAIL") || "";
      const phone = getXmlTagValue(node, "LEDGERPHONE") || "";
      const gstin = getXmlTagValue(node, "PARTYGSTIN") || "";
      const city = getXmlTagValue(node, "CITY") || "";
      const state = getXmlTagValue(node, "STATE") || "";
      const overdueDays = parseInt(getXmlTagValue(node, "OVERDUEDAYS") || "0", 10);

      ledgers.push({
        name,
        group,
        closingBalance,
        contactPerson,
        email,
        phone,
        gstin,
        city,
        state,
        creditDays: 30,
        overdueDays
      });
    }
  } catch (err) {
    console.error("Error parsing Tally XML:", err);
  }
  return ledgers;
}

function getXmlTagValue(parent: Element, tagName: string): string {
  const elements = parent.getElementsByTagName(tagName);
  if (elements.length > 0 && elements[0].textContent) {
    return elements[0].textContent.trim();
  }
  return "";
}
