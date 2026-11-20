import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Quotation, QuotationStatus } from '../../types';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Modal } from '../../components/shared/Modal';
import { 
  FileText, 
  Search, 
  Plus, 
  CheckCircle, 
  Calendar, 
  DollarSign, 
  Building 
} from 'lucide-react';

export const QuotationList: React.FC = () => {
  const { quotations, customers, addQuotation } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Quotation Form
  const [formData, setFormData] = useState({
    customerId: customers[0]?.id || '',
    origin: 'Tanjung Priok, Jakarta',
    destination: 'Port of Rotterdam',
    serviceType: 'Sea Freight FCL (2x40HC)',
    cargoDescription: 'General Manufactured Goods',
    totalSellingEst: 65000000,
    totalCostEst: 52000000,
    status: 'sent' as QuotationStatus,
    validUntil: '2026-11-15',
  });

  const filtered = quotations.filter(q => 
    q.quotationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.cargoDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === formData.customerId);
    if (!cust) return;

    const seq = quotations.length + 1;
    const quoNo = `QUO-HPL-2026-${String(seq).padStart(3, '0')}`;

    addQuotation({
      quotationNo: quoNo,
      customerId: cust.id,
      customerName: cust.companyName,
      origin: formData.origin,
      destination: formData.destination,
      serviceType: formData.serviceType,
      cargoDescription: formData.cargoDescription,
      totalSellingEst: Number(formData.totalSellingEst),
      totalCostEst: Number(formData.totalCostEst),
      status: formData.status,
      validUntil: formData.validUntil,
    });

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quotation / Surat Penawaran</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              SKPL-WF-08
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan surat penawaran harga pengiriman freight forwarding kepada calon atau klien tetap.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-600/20 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Quotation Baru</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari No Quotation, Customer, atau deskripsi muatan kargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Quotation Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">No. Quotation</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Layanan & Muatan</th>
                <th className="py-3 px-4">Penawaran (Selling)</th>
                <th className="py-3 px-4">Est. Margin</th>
                <th className="py-3 px-4">Masa Berlaku</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                    {q.quotationNo}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {q.customerName}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-800 font-medium">{q.serviceType}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-xs">{q.cargoDescription}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    Rp {q.totalSellingEst.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-600">
                    +Rp {q.estimatedMargin.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    {q.validUntil}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedQuotation(q)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition"
                    >
                      Detail (WF-09)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL (SKPL-WF-09) */}
      <Modal
        isOpen={Boolean(selectedQuotation)}
        onClose={() => setSelectedQuotation(null)}
        title={`Detail Quotation: ${selectedQuotation?.quotationNo}`}
        maxWidth="lg"
      >
        {selectedQuotation && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Customer</p>
                <p className="font-bold text-slate-900 text-base">{selectedQuotation.customerName}</p>
              </div>
              <StatusBadge status={selectedQuotation.status} />
            </div>

            <div className="space-y-2 border border-slate-100 rounded-xl p-4">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Rute Pengiriman:</span>
                <span className="font-semibold text-slate-800">{selectedQuotation.origin} &rarr; {selectedQuotation.destination}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tipe Layanan:</span>
                <span className="font-semibold text-slate-800">{selectedQuotation.serviceType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Deskripsi Kargo:</span>
                <span className="font-semibold text-slate-800">{selectedQuotation.cargoDescription}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Validitas Penawaran:</span>
                <span className="font-semibold text-slate-800">{selectedQuotation.validUntil}</span>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Total Nilai Penawaran (Selling)</p>
                <p className="text-lg font-black text-slate-900">Rp {selectedQuotation.totalSellingEst.toLocaleString('id-ID')}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Margin Keuntungan</p>
                <p className="text-base font-bold text-emerald-600">+Rp {selectedQuotation.estimatedMargin.toLocaleString('id-ID')}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedQuotation(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE QUOTATION MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Buat Quotation Penawaran Baru"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Customer *
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer bg-white"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Jenis Layanan *
            </label>
            <input
              type="text"
              required
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Origin *
              </label>
              <input
                type="text"
                required
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Destination *
              </label>
              <input
                type="text"
                required
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Deskripsi Barang / Kargo *
            </label>
            <textarea
              required
              rows={2}
              value={formData.cargoDescription}
              onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Total Penawaran (Selling) Rp *
              </label>
              <input
                type="number"
                required
                value={formData.totalSellingEst}
                onChange={(e) => setFormData({ ...formData, totalSellingEst: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Estimasi Biaya (Cost) Rp *
              </label>
              <input
                type="number"
                required
                value={formData.totalCostEst}
                onChange={(e) => setFormData({ ...formData, totalCostEst: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Masa Berlaku Hingga *
            </label>
            <input
              type="date"
              required
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              Simpan & Kirim
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
