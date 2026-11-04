import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Invoice, InvoiceStatus } from '../../types';
import { StatCard } from '../../components/shared/StatCard';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Modal } from '../../components/shared/Modal';
import { 
  DollarSign, 
  Receipt, 
  AlertCircle, 
  CreditCard, 
  CheckCircle, 
  FileText, 
  Calendar,
  Building2,
  Plus
} from 'lucide-react';

export const FinanceDashboard: React.FC = () => {
  const { invoices, jobs, customers, updateInvoiceStatus } = useAuth();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    invoiceId: invoices[0]?.id || '',
    amount: 10000000,
    paymentMethod: 'Bank Mandiri Virtual Account',
  });

  const totalInvoiced = invoices.reduce((acc, curr) => acc + curr.totalSelling, 0);
  const totalReceived = invoices.reduce((acc, curr) => acc + curr.totalPaid, 0);
  const totalOutstanding = invoices.reduce((acc, curr) => acc + curr.outstandingBalance, 0);

  const overdueInvoices = invoices.filter(i => i.status === 'overdue');

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inv = invoices.find(i => i.id === paymentForm.invoiceId);
    if (!inv) return;

    updateInvoiceStatus(inv.id, 'paid', Number(paymentForm.amount));
    setIsRecordPaymentOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Finance & Accounting Dashboard</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              SKPL-WF-19
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan Billing pekerjaan, penerbitan Invoice customer, pencatatan pembayaran, dan pemantauan Outstanding (SOA).
          </p>
        </div>

        <button
          onClick={() => setIsRecordPaymentOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white shadow-md shadow-amber-600/20 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <CreditCard className="w-4 h-4" />
          <span>+ Catat Pembayaran Masuk (WF-23)</span>
        </button>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Penagihan (Billing)"
          value={`Rp ${(totalInvoiced / 1000000).toFixed(1)} Jt`}
          subtitle="Akumulasi seluruh invoice"
          icon={Receipt}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Total Pembayaran Diterima"
          value={`Rp ${(totalReceived / 1000000).toFixed(1)} Jt`}
          subtitle="Sudah masuk ke rekening PT"
          icon={CheckCircle}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Outstanding & Piutang (SOA)"
          value={`Rp ${(totalOutstanding / 1000000).toFixed(1)} Jt`}
          subtitle={`${overdueInvoices.length} invoice melewati jatuh tempo`}
          icon={AlertCircle}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-600"
          trend={{ value: `${overdueInvoices.length} Jatuh Tempo`, isPositive: false }}
        />
      </div>

      {/* SECTION 1: INVOICE LIST (SKPL-WF-21) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Daftar Invoice Penagihan (SKPL-WF-21)</h3>
            <p className="text-xs text-slate-500">Tagihan freight forwarding yang telah diterbitkan kepada klien</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">No. Invoice</th>
                <th className="py-3 px-4">No. Job</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4">Total Tagihan</th>
                <th className="py-3 px-4">Sisa Outstanding</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                    {inv.invoiceNo}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                    {inv.jobNo}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {inv.customerName}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {inv.dueDate}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    Rp {inv.totalSelling.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-rose-600">
                    Rp {inv.outstandingBalance.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs transition"
                    >
                      Detail (WF-22)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: OUTSTANDING / SOA AGING (SKPL-WF-24) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Statement of Account (SOA) & Outstanding (SKPL-WF-24)</h3>
            <p className="text-xs text-slate-500">Monitoring umur piutang dan tagihan yang belum dibayar lunas oleh customer</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">No. Invoice Terkait</th>
                <th className="py-3 px-4">Tanggal Invoice</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4">Sudah Dibayar</th>
                <th className="py-3 px-4">Sisa Belum Bayar</th>
                <th className="py-3 px-4">Kondisi SOA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.filter(i => i.outstandingBalance > 0).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {inv.customerName}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">
                    {inv.invoiceNo}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    {inv.issueDate}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                    {inv.dueDate}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-emerald-600">
                    Rp {inv.totalPaid.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4 font-black text-rose-600">
                    Rp {inv.outstandingBalance.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      Tagihan Terbuka (Unpaid)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVOICE DETAIL MODAL (SKPL-WF-22) */}
      <Modal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        title={`Detail Invoice: ${selectedInvoice?.invoiceNo}`}
        maxWidth="lg"
      >
        {selectedInvoice && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Customer</p>
                <p className="font-bold text-slate-900 text-base">{selectedInvoice.customerName}</p>
                <p className="text-[11px] text-slate-500">Nomor Job: {selectedInvoice.jobNo}</p>
              </div>
              <StatusBadge status={selectedInvoice.status} />
            </div>

            <div className="p-4 border border-slate-100 rounded-xl space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tanggal Terbit:</span>
                <span className="font-semibold text-slate-800">{selectedInvoice.issueDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Jatuh Tempo Pembayaran:</span>
                <span className="font-semibold text-rose-600">{selectedInvoice.dueDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Subtotal Layanan:</span>
                <span className="font-semibold text-slate-800">Rp {selectedInvoice.subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">PPN (1.1% Ekspedisi/Freight):</span>
                <span className="font-semibold text-slate-800">Rp {selectedInvoice.taxAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-700 font-bold">Total Nilai Tagihan:</span>
                <span className="font-black text-slate-900 text-sm">Rp {selectedInvoice.totalSelling.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-emerald-700 font-semibold">Total Terbayar:</span>
                <span className="font-bold text-emerald-600">Rp {selectedInvoice.totalPaid.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-rose-700 font-bold">Sisa Piutang (Outstanding):</span>
                <span className="font-black text-rose-600 text-sm">Rp {selectedInvoice.outstandingBalance.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* RECORD PAYMENT MODAL (SKPL-WF-23) */}
      <Modal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        title="Catat Pembayaran Masuk (Payment List - WF-23)"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Pilih Invoice Tagihan *
            </label>
            <select
              value={paymentForm.invoiceId}
              onChange={(e) => setPaymentForm({ ...paymentForm, invoiceId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer bg-white"
            >
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNo} - {inv.customerName} (Sisa: Rp {inv.outstandingBalance.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Nominal yang Dibayarkan (Rp) *
            </label>
            <input
              type="number"
              required
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Metode Pembayaran *
            </label>
            <select
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer bg-white"
            >
              <option value="Bank Mandiri Transfer">Bank Mandiri Transfer</option>
              <option value="BCA Virtual Account">BCA Virtual Account</option>
              <option value="Bank BNI Giro">Bank BNI Giro / Cek</option>
              <option value="Telegraphic Transfer (USD)">Telegraphic Transfer (TT / Valas)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRecordPaymentOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Simpan Pembayaran
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
