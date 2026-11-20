import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/shared/StatCard';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Modal } from '../../components/shared/Modal';
import { 
  TrendingUp, 
  Briefcase, 
  Users, 
  DollarSign, 
  PieChart, 
  FileSpreadsheet, 
  Download, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const { jobs, customers, invoices } = useAuth();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Financial aggregates
  const totalSelling = jobs.reduce((acc, curr) => acc + curr.sellingPrice, 0);
  const totalCost = jobs.reduce((acc, curr) => acc + curr.costingTotal, 0);
  const totalNetMargin = totalSelling - totalCost;
  const marginPercentage = totalSelling > 0 ? ((totalNetMargin / totalSelling) * 100).toFixed(1) : '0';

  const totalOutstanding = invoices.reduce((acc, curr) => acc + curr.outstandingBalance, 0);

  const handleDownloadReport = () => {
    // Generate simple CSV download for Management Report (SKPL-WF-31)
    const headers = ['No Job', 'Customer', 'Layanan', 'Selling (IDR)', 'Costing (IDR)', 'Margin (IDR)', 'Status'];
    const rows = jobs.map(j => [
      j.jobNo,
      `"${j.customerName}"`,
      `"${j.serviceType}"`,
      j.sellingPrice,
      j.costingTotal,
      j.margin,
      j.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Hopelmar_Management_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Manager Dashboard</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              SKPL-WF-25 s/d WF-31
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pemantauan performa operasional, analisis Costing vs Selling, Margin keuntungan, dan evaluasi PNL perusahaan.
          </p>
        </div>

        <button
          onClick={handleDownloadReport}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-md shadow-purple-600/20 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Download Laporan Manajemen (WF-31)</span>
        </button>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Laporan berhasil diunduh dalam format data spreadsheet (CSV) untuk evaluasi manajemen.</span>
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Pendapatan (Selling)"
          value={`Rp ${(totalSelling / 1000000).toFixed(1)} Jt`}
          subtitle="Total nilai pesanan job"
          icon={DollarSign}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          trend={{ value: '15.4%', isPositive: true }}
        />
        <StatCard
          title="Total Biaya (Costing)"
          value={`Rp ${(totalCost / 1000000).toFixed(1)} Jt`}
          subtitle="Actual cost vendor & pelayaran"
          icon={Briefcase}
          iconBgColor="bg-slate-100"
          iconColor="text-slate-600"
        />
        <StatCard
          title="Profit / Margin Bersih"
          value={`Rp ${(totalNetMargin / 1000000).toFixed(1)} Jt`}
          subtitle={`Margin rata-rata: ${marginPercentage}%`}
          icon={TrendingUp}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          trend={{ value: `${marginPercentage}%`, isPositive: true }}
        />
        <StatCard
          title="Outstanding Piutang (SOA)"
          value={`Rp ${(totalOutstanding / 1000000).toFixed(1)} Jt`}
          subtitle="Tagihan belum tertagih"
          icon={AlertCircle}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-600"
        />
      </div>

      {/* PNL & COSTING OVERVIEW TABLE (SKPL-WF-30) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Costing, Selling & PNL Per Job (SKPL-WF-30)</h3>
            <p className="text-xs text-slate-500">Evaluasi efisiensi biaya vendor dan tingkat profitabilitas setiap proyek pengiriman</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">No. Job</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Layanan Pengiriman</th>
                <th className="py-3 px-4">Nilai Jual (Selling)</th>
                <th className="py-3 px-4">Biaya Operasional (Cost)</th>
                <th className="py-3 px-4">Margin Laba (PNL)</th>
                <th className="py-3 px-4">Persentase Margin</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => {
                const jobMarginPct = job.sellingPrice > 0 ? ((job.margin / job.sellingPrice) * 100).toFixed(1) : '0';
                return (
                  <tr key={job.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {job.jobNo}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {job.customerName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {job.serviceType}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      Rp {job.sellingPrice.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                      Rp {job.costingTotal.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-600">
                      +Rp {job.margin.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">
                      {jobMarginPct}%
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={job.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMER CONTRIBUTION OVERVIEW (SKPL-WF-26) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Customer Performance Overview (SKPL-WF-26)</h3>
        <p className="text-xs text-slate-500 mb-4">Kontribusi volume order dan total revenue dari masing-masing klien utama</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {customers.slice(0, 3).map((cust) => (
            <div key={cust.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
              <p className="font-bold text-slate-900 text-sm truncate">{cust.companyName}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">PIC: {cust.picName}</p>
              
              <div className="mt-3 pt-3 border-t border-slate-200/60 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Total Jobs</span>
                  <span className="font-bold text-slate-800">{cust.totalJobs || 0} Jobs</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Total Omzet</span>
                  <span className="font-bold text-blue-600">Rp {((cust.totalRevenue || 0) / 1000000).toFixed(0)} Jt</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
