import hopelmarLogo from '../../assets/hopelmar-logo.jpeg';
import type { CustomerAccount, Job, PnlReport, Quotation, QuotationRateLine } from '../types';

export interface PrintDocumentRow {
  label: string;
  value: string;
}

export interface PrintDocumentTable {
  headers: string[];
  rows: string[][];
}

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const openPrintWindow = (title: string, content: string, styles: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) throw new Error('Jendela cetak diblokir browser. Izinkan pop-up lalu coba lagi.');

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${escapeHtml(title)}</title>
        <style>${styles}</style>
      </head>
      <body>${content}</body>
    </html>`);
  printWindow.document.close();
};

const formatDate = (value: string) => {
  if (!value) return '-';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('id-ID');
};

const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

const renderQuotationRateTable = (
  title: string,
  lines: QuotationRateLine[],
  rateColumns: Array<{ field: 'rate20ft' | 'rate40ft' | 'rateLcl' | 'rateOthers'; label: string }>,
) => {
  const headers = rateColumns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('');
  const rows = lines.map((line) => {
    const rates = rateColumns.map(({ field }) => {
      const value = field === 'rateOthers'
        ? line.rateOthers
        : line[field] === null ? '' : line[field]?.toLocaleString('id-ID');
      return `<td${field === 'rateOthers' ? '' : ' class="number"'}>${escapeHtml(value || '')}</td>`;
    }).join('');
    return `<tr>
      <td>${escapeHtml(line.description)}</td>
      <td>${escapeHtml(line.currency)}</td>
      ${rates}
      <td>${escapeHtml(line.uom)}</td>
      <td>${escapeHtml(line.remarks)}</td>
    </tr>`;
  }).join('');
  const columnCount = rateColumns.length + 4;
  return `<table class="charges rate-table">
    <thead>
      <tr><th colspan="${columnCount}" class="section-title">${escapeHtml(title)}</th></tr>
      <tr><th>Description</th><th>Currency</th>${headers}<th>UOM</th><th>Remarks</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
};

export const printQuotationDocument = (quotation: Quotation, customer?: CustomerAccount) => {
  const lineItems = quotation.lineItems?.length
    ? quotation.lineItems
    : [{
      description: quotation.cargoDescription || quotation.serviceType,
      quantity: 1,
      unitPrice: quotation.totalSellingEst,
      taxRate: 0,
    }];
  const rows = lineItems.map((item) => {
    const subtotal = item.quantity * item.unitPrice;
    const tax = subtotal * item.taxRate / 100;
    return `<tr>
      <td>${escapeHtml(item.description)}</td>
      <td class="number">${escapeHtml(String(item.quantity))}</td>
      <td class="number">${escapeHtml(formatCurrency(item.unitPrice))}</td>
      <td class="number">${escapeHtml(`${item.taxRate}% · ${formatCurrency(tax)}`)}</td>
      <td class="number">${escapeHtml(formatCurrency(subtotal + tax))}</td>
      <td>${escapeHtml(quotation.cargoDescription || quotation.notes || '-')}</td>
    </tr>`;
  }).join('');
  const subtotal = quotation.subtotal ?? lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = quotation.taxAmount ?? lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice * item.taxRate / 100,
    0,
  );
  const pricingContent = quotation.rateSections
    ? [
        renderQuotationRateTable('OCEAN FREIGHT', quotation.rateSections.oceanFreight, [
          { field: 'rate20ft', label: "20'" },
          { field: 'rate40ft', label: "40'" },
          { field: 'rateLcl', label: 'LCL' },
        ]),
        renderQuotationRateTable(`EXW · POL: ${quotation.origin}`, quotation.rateSections.exw, [
          { field: 'rate20ft', label: "20'" },
          { field: 'rate40ft', label: "40'" },
        ]),
        renderQuotationRateTable('OCEAN IMPORT HANDLING CHARGES', quotation.rateSections.oceanImportHandling, [
          { field: 'rateLcl', label: 'LCL' },
          { field: 'rate20ft', label: "20'" },
          { field: 'rate40ft', label: "40'" },
          { field: 'rateOthers', label: 'OTHERS' },
        ]),
      ].join('')
    : `<table class="charges">
        <thead>
          <tr><th colspan="6" class="section-title">OFFERED SERVICES</th></tr>
          <tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Tax</th><th>Amount</th><th>Remarks</th></tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><th colspan="4">Subtotal</th><td class="number">${escapeHtml(formatCurrency(subtotal))}</td><td></td></tr>
          <tr><th colspan="4">Tax</th><td class="number">${escapeHtml(formatCurrency(taxAmount))}</td><td></td></tr>
          <tr class="total"><th colspan="4">TOTAL</th><td class="number">${escapeHtml(formatCurrency(quotation.totalSellingEst))}</td><td></td></tr>
        </tfoot>
      </table>`;
  const content = `
    <main class="quotation">
      <header class="letterhead">
        <div class="brand">
          <img src="${hopelmarLogo}" alt="Hopelmar Logistics">
          <address>
            Komplek Perkantoran Permata Executive Apartment, Lantai 2 R.5<br>
            Jl. Raya Pos Pengumben, Jakarta Barat 11550<br>
            Telp. 021.53667775 · Email. info@hopelmarlogistics.com<br>
            www.hopelmarlogistics.com
          </address>
        </div>
        <div class="title">
          <h1>QUOTATION</h1>
          <p>Freight Forwarding &amp; Logistics</p>
        </div>
      </header>

      <table class="details">
        <tbody>
          <tr><th>Date</th><td>${escapeHtml(formatDate(quotation.issuedAt || new Date().toISOString()))}</td><th>Quotation No.</th><td>${escapeHtml(quotation.quotationNo)}</td></tr>
          <tr><th>RFQ No.</th><td>${escapeHtml(quotation.rfqNo || '-')}</td><th>Incoterm</th><td>${escapeHtml(quotation.incoterm || '-')}</td></tr>
          <tr><th>To</th><td>${escapeHtml(quotation.customerName)}${customer?.address ? `<br>${escapeHtml(customer.address)}` : ''}</td><th>Attn</th><td>${escapeHtml(customer?.contactPerson || '-')}</td></tr>
          <tr><th>Phone</th><td>${escapeHtml(customer?.phone || '-')}</td><th>Services</th><td>${escapeHtml(quotation.serviceType)}</td></tr>
          <tr><th>POL</th><td>${escapeHtml(quotation.origin)}</td><th>POD</th><td>${escapeHtml(quotation.destination)}</td></tr>
          <tr><th>Valid Through</th><td colspan="3">${escapeHtml(formatDate(quotation.validUntil))}</td></tr>
        </tbody>
      </table>

      <p class="intro">In response to your inquiry, we are pleased to submit our offer as below for your review and perusal:</p>

      ${pricingContent}

      ${quotation.paymentTerms ? `<p class="payment"><strong>Payment Conditions:</strong> ${escapeHtml(quotation.paymentTerms)}</p>` : ''}
      ${quotation.cargoDescription ? `<p class="payment"><strong>Cargo Description:</strong> ${escapeHtml(quotation.cargoDescription)}</p>` : ''}
      <section class="terms">
        <strong>Remarks:</strong>
        <ol>
          <li>Above rates are valid for general cargo only.</li>
          <li>Above rates are subject to change with prior notice.</li>
          <li>Above rates are subject to VAT 11%.</li>
          <li>Above rates are excluding Marine Insurance (0.18% x TSI) + Adm USD 5 (Min USD 35).</li>
          <li>We charged based on CBM or Weight (Ton), whichever is bigger.</li>
          <li>Every Importer must have: Import License, NPWP (Tax ID), NIK (Customs Identification Number), and other Import Permits (if needed).</li>
          <li>All transactions are subject to ILFA Terms and Conditions.</li>
        </ol>
      </section>
      <p class="closing">Should you need further information or assistance, please feel free to contact us.</p>
      <footer class="signatures">
        <div><p>Sincerely yours,</p><strong>YUNITA AMALIA</strong></div>
        <div><p>Approved by,</p><span></span></div>
      </footer>
    </main>`;
  const styles = `
    @page { size: A4 portrait; margin: 12mm 13mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #222; font: 10px Arial, sans-serif; }
    .quotation { width: 100%; }
    .letterhead { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #8a171a; padding-bottom: 8px; margin-bottom: 12px; }
    .brand img { display: block; width: 185px; height: auto; margin-bottom: 5px; }
    address { font-size: 8px; font-style: normal; line-height: 1.45; }
    .title { text-align: right; padding-top: 10px; }
    h1 { margin: 0; color: #8a171a; font-size: 21px; letter-spacing: 1.5px; }
    .title p { margin: 4px 0 0; font-size: 9px; color: #555; }
    table { width: 100%; border-collapse: collapse; }
    .details th, .details td { border: 1px solid #777; padding: 5px 6px; text-align: left; vertical-align: top; }
    .details th { width: 15%; background: #f1f1f1; font-weight: 700; }
    .details td { width: 35%; }
    .intro { margin: 12px 0 9px; line-height: 1.4; }
    .charges { table-layout: fixed; font-size: 8px; }
    .charges th, .charges td { border: 1px solid #777; padding: 5px 4px; vertical-align: top; }
    .charges thead tr:not(:first-child) { background: #eee; }
    .charges thead th { text-align: center; }
    .charges .section-title { background: #8a171a; color: #fff; font-size: 9px; letter-spacing: .5px; }
    .charges th:nth-child(1) { width: 26%; }
    .charges th:nth-child(2) { width: 7%; }
    .charges th:nth-child(3) { width: 17%; }
    .charges th:nth-child(4) { width: 12%; }
    .charges th:nth-child(5) { width: 18%; }
    .charges th:nth-child(6) { width: 20%; }
    .rate-table { margin-bottom: 8px; font-size: 7.5px; }
    .rate-table th:nth-child(1) { width: 24%; }
    .rate-table th:nth-child(2) { width: 8%; }
    .rate-table th:nth-child(3), .rate-table th:nth-child(4), .rate-table th:nth-child(5), .rate-table th:nth-child(6) { width: 10%; }
    .rate-table th:nth-child(7) { width: 12%; }
    .rate-table th:nth-child(8) { width: 16%; }
    .number { text-align: right; white-space: nowrap; }
    .charges tfoot th { text-align: right; }
    .charges .total { background: #f5e8e8; font-weight: 700; }
    .payment { margin: 8px 0 0; line-height: 1.4; }
    .terms { margin-top: 10px; line-height: 1.35; }
    .terms ol { margin: 4px 0 0; padding-left: 18px; }
    .terms li { margin: 2px 0; }
    .closing { margin-top: 9px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 18px; page-break-inside: avoid; }
    .signatures div { width: 42%; min-height: 47px; }
    .signatures p { margin: 0 0 28px; }
    .signatures strong { text-decoration: underline; }
    .signatures span { display: block; height: 38px; }
    @media print { tr, .signatures { page-break-inside: avoid; } }
  `;
  openPrintWindow(`Quotation - ${quotation.quotationNo}`, content, styles);
};

export const printJobOrder = (job: Job) => {
  const fields = [
    job.customerName,
    job.shipmentType,
    job.incoterm,
    job.serviceType || job.mode,
    '-',
    job.vesselOrFlight,
    job.pol,
    job.pod,
    job.etd,
    job.eta,
    '-',
    job.blNumber,
    job.jobNo,
  ];
  const headers = [
    'COMPANY NAME',
    'DIRECTION OF TRADE',
    'INCOTERM',
    'LINE OF SERVICES',
    'QUANTITY',
    'CARRIER',
    'POL',
    'POD',
    'ETD',
    'ETA',
    'AJU PIB',
    'NO. BL/AWB',
    'NO. JOB',
  ];
  const content = `
    <header class="heading">
      <img src="${hopelmarLogo}" alt="Hopelmar Logistics">
      <div><h1>JOB ORDER</h1><p>CUSTOMS DECLARATION MANIFEST</p></div>
    </header>
    <p class="date">Tanggal: ${escapeHtml(formatDate(job.date || new Date().toISOString()))}</p>
    <table>
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
      <tbody><tr>${fields.map((field) => `<td>${escapeHtml(field || '-')}</td>`).join('')}</tr></tbody>
    </table>
    <footer>PT Hopelmar International · ${escapeHtml(job.jobNo)}</footer>`;
  const styles = `
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #222; font: 8px Arial, sans-serif; }
    .heading { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #8a171a; padding-bottom: 8px; }
    .heading img { width: 155px; height: auto; }
    .heading div { text-align: right; }
    h1 { margin: 0; color: #8a171a; font-size: 18px; letter-spacing: 1px; }
    .heading p { margin: 3px 0 0; font-size: 9px; }
    .date { margin: 12px 0 7px; text-align: right; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #555; padding: 6px 3px; text-align: center; vertical-align: middle; overflow-wrap: anywhere; }
    th { background: #eee; font-size: 7px; }
    td { min-height: 36px; font-size: 8px; }
    footer { border-top: 1px solid #777; margin-top: 12px; padding-top: 5px; color: #555; text-align: right; font-size: 7px; }
  `;
  openPrintWindow(`Job Order - ${job.jobNo}`, content, styles);
};

export const printPnlReport = (report: PnlReport) => {
  const content = `
    <main class="report">
      <header class="letterhead">
        <div class="brand">
          <img src="${hopelmarLogo}" alt="Hopelmar Logistics">
          <div>
            <strong>PT HOPELMAR INTERNATIONAL</strong>
            <p>Freight Forwarding &amp; Logistics</p>
            <address>
              Komplek Perkantoran Permata Executive Apartment, Lantai 2 R.5<br>
              Jl. Raya Pos Pengumben, Jakarta Barat 11550<br>
              Telp. 021.53667775 · info@hopelmarlogistics.com · www.hopelmarlogistics.com
            </address>
          </div>
        </div>
        <div class="heading">
          <p class="eyebrow">LAPORAN KEUANGAN</p>
          <h1>Laporan Margin &amp; PNL</h1>
          <p class="report-date">Tanggal laporan: ${escapeHtml(report.createdAt)}</p>
        </div>
      </header>
      <section class="summary" aria-label="Ringkasan PNL">
        <article class="metric jobs">
          <span>Jumlah Job</span>
          <strong>${escapeHtml(String(report.jobCount))}</strong>
          <small>job selesai</small>
        </article>
        <article class="metric">
          <span>Revenue</span>
          <strong>${escapeHtml(formatCurrency(report.totalRevenue))}</strong>
        </article>
        <article class="metric">
          <span>Cost</span>
          <strong>${escapeHtml(formatCurrency(report.totalCost))}</strong>
        </article>
        <article class="metric margin">
          <span>Margin</span>
          <strong>${escapeHtml(formatCurrency(report.margin))}</strong>
          <small>Revenue dikurangi Cost</small>
        </article>
      </section>
      <p class="method">Ringkasan ini berdasarkan snapshot laporan saat dibuat.</p>
      <footer>Dicetak dari Hopelmar Job Tracker · ${escapeHtml(new Date().toLocaleString('id-ID'))}</footer>
    </main>`;
  const styles = `
    @page { size: A4 portrait; margin: 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #1f2937; font: 10px Arial, sans-serif; }
    .letterhead { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; border-bottom: 3px solid #8a171a; padding-bottom: 14px; }
    .brand { display: flex; align-items: flex-start; gap: 14px; max-width: 58%; }
    .brand img { display: block; width: 175px; height: auto; }
    .brand strong { display: block; margin: 2px 0 3px; color: #8a171a; font-size: 9px; letter-spacing: .06em; }
    .brand p { margin: 0 0 5px; color: #4b5563; font-size: 8px; }
    address { color: #6b7280; font-size: 7px; font-style: normal; line-height: 1.5; }
    .heading { max-width: 42%; text-align: right; }
    .eyebrow { margin: 0 0 6px; color: #8a171a; font-size: 8px; font-weight: 700; letter-spacing: .16em; }
    h1 { margin: 0; color: #111827; font-size: 19px; line-height: 1.2; }
    .report-date { margin: 8px 0 0; color: #6b7280; font-size: 9px; }
    .summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 24px; }
    .metric { min-height: 92px; padding: 15px 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; }
    .metric span, .metric small { display: block; color: #6b7280; font-size: 9px; }
    .metric strong { display: block; margin: 10px 0 3px; color: #111827; font-size: 18px; }
    .metric.jobs strong { font-size: 22px; }
    .metric.margin { border-color: #e8c5c6; background: #fbf5f5; }
    .metric.margin strong { color: #8a171a; }
    .method { margin-top: 18px; color: #6b7280; font-size: 8px; }
    footer { margin-top: 36px; border-top: 1px solid #e5e7eb; padding-top: 8px; color: #9ca3af; font-size: 8px; }
    @media print { .metric { break-inside: avoid; } }
  `;
  openPrintWindow(`Laporan Margin & PNL - ${report.createdAt}`, content, styles);
};

export const printDocument = (
  title: string,
  reference: string,
  rows: PrintDocumentRow[],
  table?: PrintDocumentTable,
) => {
  const rowMarkup = rows.map(({ label, value }) => `
    <tr>
      <th>${escapeHtml(label)}</th>
      <td>${escapeHtml(value || '-')}</td>
    </tr>
  `).join('');
  const tableMarkup = table ? `
    <table class="items">
      <thead><tr>${table.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
      <tbody>${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell || '-')}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  ` : '';

  const styles = `
          @page { size: A4; margin: 18mm; }
          body { color: #0f172a; font: 14px Arial, sans-serif; margin: 0; }
          header { border-bottom: 2px solid #1d4ed8; margin-bottom: 28px; padding-bottom: 16px; }
          .company { color: #1d4ed8; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
          h1 { font-size: 24px; margin: 10px 0 4px; }
          .reference { color: #475569; font-size: 13px; }
          .document-header { align-items: flex-start; border-bottom: 3px solid #8a171a; display: flex; gap: 18px; justify-content: space-between; padding-bottom: 14px; }
          .brand { align-items: flex-start; display: flex; gap: 12px; max-width: 58%; }
          .brand img { display: block; height: auto; width: 155px; }
          .brand .company { color: #8a171a; font-size: 9px; letter-spacing: .08em; }
          .address { color: #6b7280; font-size: 7px; line-height: 1.5; margin-top: 5px; }
          .document-title { max-width: 42%; text-align: right; }
          .document-title h1 { color: #111827; font-size: 19px; margin: 0 0 6px; }
          .document-title .reference { color: #6b7280; font-size: 9px; overflow-wrap: anywhere; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border-bottom: 1px solid #e2e8f0; padding: 12px 10px; text-align: left; vertical-align: top; }
          th { color: #475569; font-size: 12px; font-weight: 600; width: 32%; }
          td { font-size: 13px; white-space: pre-wrap; overflow-wrap: anywhere; }
          .items { margin: 24px 0; }
          .items th { background: #ea580c; color: white; text-align: center; width: auto; }
          .items td { border: 1px solid #cbd5e1; }
          footer { border-top: 1px solid #cbd5e1; color: #64748b; font-size: 10px; margin-top: 36px; padding-top: 10px; }
        `;
  const content = `
        <header class="document-header">
          <div class="brand">
            <img src="${hopelmarLogo}" alt="Hopelmar Logistics">
            <div>
              <div class="company">PT HOPELMAR INTERNATIONAL</div>
              <div class="address">Freight Forwarding &amp; Logistics<br>Jakarta Barat 11550 · 021.53667775<br>info@hopelmarlogistics.com</div>
            </div>
          </div>
          <div class="document-title">
            <h1>${escapeHtml(title)}</h1>
            <div class="reference">${escapeHtml(reference)}</div>
          </div>
        </header>
        ${tableMarkup}
        <table><tbody>${rowMarkup}</tbody></table>
        <footer>Dicetak dari Hopelmar Job Tracker · ${escapeHtml(new Date().toLocaleString('id-ID'))}</footer>
      `;
  openPrintWindow(`${title} - ${reference}`, content, styles);
};
