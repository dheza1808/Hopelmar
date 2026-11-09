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

export const printDocument = (
  title: string,
  reference: string,
  rows: PrintDocumentRow[],
  table?: PrintDocumentTable,
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) throw new Error('Jendela cetak diblokir browser. Izinkan pop-up lalu coba lagi.');

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

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${escapeHtml(title)} - ${escapeHtml(reference)}</title>
        <style>
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
        </style>
      </head>
      <body>
        <header>
          <div class="company">PT Hopelmar International</div>
          <h1>${escapeHtml(title)}</h1>
          <div class="reference">${escapeHtml(reference)}</div>
        </header>
        ${tableMarkup}
        <table><tbody>${rowMarkup}</tbody></table>
        <footer>Dicetak dari Hopelmar Job Tracker · ${escapeHtml(new Date().toLocaleString('id-ID'))}</footer>
      </body>
    </html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
