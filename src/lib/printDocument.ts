import hopelmarLogo from '../../assets/hopelmar-logo.jpeg';
import type { CustomerAccount, Job, Quotation } from '../types';

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
          <tr><th>RFQ No.</th><td>-</td><th>Incoterm</th><td>-</td></tr>
          <tr><th>To</th><td>${escapeHtml(quotation.customerName)}${customer?.address ? `<br>${escapeHtml(customer.address)}` : ''}</td><th>Attn</th><td>${escapeHtml(customer?.contactPerson || '-')}</td></tr>
          <tr><th>Phone</th><td>${escapeHtml(customer?.phone || '-')}</td><th>Services</th><td>${escapeHtml(quotation.serviceType)}</td></tr>
          <tr><th>POL</th><td>${escapeHtml(quotation.origin)}</td><th>POD</th><td>${escapeHtml(quotation.destination)}</td></tr>
          <tr><th>Valid Through</th><td colspan="3">${escapeHtml(formatDate(quotation.validUntil))}</td></tr>
        </tbody>
      </table>

      <p class="intro">In response to your inquiry, we are pleased to submit our offer as below for your review and perusal:</p>

      <table class="charges">
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
      </table>

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
        <header>
          <div class="company">PT Hopelmar International</div>
          <h1>${escapeHtml(title)}</h1>
          <div class="reference">${escapeHtml(reference)}</div>
        </header>
        ${tableMarkup}
        <table><tbody>${rowMarkup}</tbody></table>
        <footer>Dicetak dari Hopelmar Job Tracker · ${escapeHtml(new Date().toLocaleString('id-ID'))}</footer>
      `;
  openPrintWindow(`${title} - ${reference}`, content, styles);
};
