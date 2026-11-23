import React from 'react';
import type { QuotationRateLine, QuotationRateSections } from '../../types';

type QuotationRateSectionKey = keyof QuotationRateSections;
type QuotationRateField = 'rate20ft' | 'rate40ft' | 'rateLcl' | 'rateOthers';

const createRateLine = (description = '', uom = '', remarks = ''): QuotationRateLine => ({
  description,
  currency: '',
  rate20ft: null,
  rate40ft: null,
  rateLcl: null,
  rateOthers: '',
  uom,
  remarks,
});

export const createDefaultQuotationRateSections = (): QuotationRateSections => ({
  oceanFreight: [createRateLine('Ocean Freight Ningbo')],
  exw: [
    createRateLine('BOOKING CHARGES', 'Per container'),
    createRateLine('THC', 'Per container'),
    createRateLine('ISPL, SEAL', 'Per container'),
    createRateLine('HANDLING', 'Per B/L'),
    createRateLine('CUS', 'Per B/L'),
    createRateLine('DOC', 'Per B/L'),
    createRateLine('VGM', 'Per B/L'),
    createRateLine('MANIFEST', 'Per Container'),
    createRateLine('Trucking', 'Per Container', 'From Ningbo'),
    createRateLine('AGENCY FEE', 'Per Shipment'),
  ],
  oceanImportHandling: [
    createRateLine('Handling', 'CBM/ Container'),
    createRateLine('Inland Trucking', 'Per Container'),
    createRateLine('Red Line Inspection', 'Per Container'),
    createRateLine('EDI', 'Per Doc'),
    createRateLine('Additional Item', 'Next/Item'),
    createRateLine('Document Fee', 'Per Doc'),
    createRateLine('Admin Fee', 'Per Doc'),
    createRateLine('Agency Fee', 'Per Shipment'),
    {
      ...createRateLine('Import Tax and Duty'),
      rateOthers: 'At Cost/PIB, paid by importer',
    },
    {
      ...createRateLine('Other Charges (if any)'),
      rateOthers: 'At Cost (D/O, CFS, THC, storage, mechanic, lift on/off, demurrage, stamp fee, extra cost, etc)',
    },
  ],
});

interface QuotationRateEditorProps {
  value: QuotationRateSections;
  onChange: (value: QuotationRateSections) => void;
}

const sections: Array<{
  key: QuotationRateSectionKey;
  title: string;
  rateColumns: Array<{ field: QuotationRateField; label: string }>;
}> = [
  {
    key: 'oceanFreight',
    title: 'OCEAN FREIGHT',
    rateColumns: [
      { field: 'rate20ft', label: "20'" },
      { field: 'rate40ft', label: "40'" },
      { field: 'rateLcl', label: 'LCL' },
    ],
  },
  {
    key: 'exw',
    title: 'EXW',
    rateColumns: [
      { field: 'rate20ft', label: "20'" },
      { field: 'rate40ft', label: "40'" },
    ],
  },
  {
    key: 'oceanImportHandling',
    title: 'OCEAN IMPORT HANDLING CHARGES',
    rateColumns: [
      { field: 'rateLcl', label: 'LCL' },
      { field: 'rate20ft', label: "20'" },
      { field: 'rate40ft', label: "40'" },
      { field: 'rateOthers', label: 'OTHERS' },
    ],
  },
];

export const QuotationRateEditor: React.FC<QuotationRateEditorProps> = ({ value, onChange }) => {
  const updateLine = (
    section: QuotationRateSectionKey,
    lineIndex: number,
    update: Partial<QuotationRateLine>,
  ) => {
    onChange({
      ...value,
      [section]: value[section].map((line, index) => (
        index === lineIndex ? { ...line, ...update } : line
      )),
    });
  };

  return (
    <div className="space-y-5">
      {sections.map(({ key, title, rateColumns }) => (
        <section key={key} className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-xs font-black tracking-wide text-slate-800">{title}</h4>
            <button
              type="button"
              onClick={() => onChange({
                ...value,
                [key]: [...value[key], createRateLine()],
              })}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
            >
              + Tambah baris
            </button>
          </div>
          {key === 'exw' && (
            <p className="text-[11px] text-slate-500">POL: diisi dari kolom Asal di bagian informasi quotation.</p>
          )}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[980px] text-left text-[11px]">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-2 py-2">Description</th>
                  <th className="w-24 px-2 py-2">Currency</th>
                  {rateColumns.map((column) => <th key={column.field} className="w-24 px-2 py-2">{column.label}</th>)}
                  <th className="w-32 px-2 py-2">UOM</th>
                  <th className="px-2 py-2">Remarks</th>
                  <th className="w-12 px-2 py-2" aria-label="Aksi" />
                </tr>
              </thead>
              <tbody>
                {value[key].map((line, lineIndex) => (
                  <tr key={`${key}-${lineIndex}`} className="border-t border-slate-200">
                    <td className="p-1.5">
                      <input
                        aria-label={`${title} description ${lineIndex + 1}`}
                        value={line.description}
                        onChange={(event) => updateLine(key, lineIndex, { description: event.target.value })}
                        className="w-full rounded border border-slate-300 px-2 py-1.5"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        aria-label={`${title} currency ${lineIndex + 1}`}
                        value={line.currency}
                        onChange={(event) => updateLine(key, lineIndex, { currency: event.target.value.toUpperCase() })}
                        placeholder="USD"
                        className="w-full rounded border border-slate-300 px-2 py-1.5"
                      />
                    </td>
                    {rateColumns.map((column) => (
                      <td key={column.field} className="p-1.5">
                        {column.field === 'rateOthers' ? (
                          <input
                            aria-label={`${title} others ${lineIndex + 1}`}
                            value={line.rateOthers}
                            onChange={(event) => updateLine(key, lineIndex, { rateOthers: event.target.value })}
                            className="w-full rounded border border-slate-300 px-2 py-1.5"
                          />
                        ) : (
                          <input
                            aria-label={`${title} ${column.label} ${lineIndex + 1}`}
                            type="number"
                            min="0"
                            step="any"
                            value={line[column.field] ?? ''}
                            onChange={(event) => updateLine(key, lineIndex, {
                              [column.field]: event.target.value === '' ? null : Number(event.target.value),
                            })}
                            className="w-full rounded border border-slate-300 px-2 py-1.5"
                          />
                        )}
                      </td>
                    ))}
                    <td className="p-1.5">
                      <input
                        aria-label={`${title} unit ${lineIndex + 1}`}
                        value={line.uom}
                        onChange={(event) => updateLine(key, lineIndex, { uom: event.target.value })}
                        className="w-full rounded border border-slate-300 px-2 py-1.5"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        aria-label={`${title} remarks ${lineIndex + 1}`}
                        value={line.remarks}
                        onChange={(event) => updateLine(key, lineIndex, { remarks: event.target.value })}
                        className="w-full rounded border border-slate-300 px-2 py-1.5"
                      />
                    </td>
                    <td className="p-1.5">
                      <button
                        type="button"
                        aria-label={`Hapus ${title} baris ${lineIndex + 1}`}
                        onClick={() => onChange({
                          ...value,
                          [key]: value[key].filter((_, index) => index !== lineIndex),
                        })}
                        className="rounded px-2 py-1 font-bold text-red-700 hover:bg-red-50"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
};
