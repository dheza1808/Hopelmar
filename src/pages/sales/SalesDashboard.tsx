import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, 
  RotateCw, 
  Truck, 
  FileText, 
  Users, 
  ClipboardCheck, 
  ArrowRight, 
  CheckSquare, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Anchor,
  Plane
} from 'lucide-react';

interface SalesDashboardProps {
  onNavigateTab: (tab: string) => void;
  onViewJobDetail?: (jobId: string) => void;
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({ 
  onNavigateTab,
  onViewJobDetail 
}) => {
  const { jobs } = useAuth();
  const [filterMode, setFilterMode] = useState<'All' | 'Sea' | 'Air'>('All');

  const recentJobs = [
    {
      id: 'j-1',
      jobNo: '#JKT-2025-0891',
      customer: 'PT Sumber Alfaria Tbk',
      type: 'Export',
      mode: "Sea FCL (1×40'HC)",
      currentStatus: 'Customs Process',
      statusDotColor: 'text-blue-600',
      quotationStatus: 'Approved',
    },
    {
      id: 'j-2',
      jobNo: '#JKT-2025-0892',
      customer: 'PT Sri Rejeki Isman (Sritex)',
      type: 'Export',
      mode: 'Air Express',
      currentStatus: 'Documentation',
      statusDotColor: 'text-slate-500',
      quotationStatus: 'Approved',
    },
    {
      id: 'j-3',
      jobNo: '#SUB-2025-0419',
      customer: 'PT Chandra Asri Petrochemical',
      type: 'Import',
      mode: 'Sea LCL',
      currentStatus: 'Operational',
      statusDotColor: 'text-blue-500',
      quotationStatus: 'Waiting Confirmation',
    },
    {
      id: 'j-4',
      jobNo: '#JKT-2025-0895',
      customer: 'PT Hartono Istana (Polytron)',
      type: 'Import',
      mode: 'Air Freight',
      currentStatus: 'Quotation',
      statusDotColor: 'text-slate-400',
      quotationStatus: 'Draft',
    },
    {
      id: 'j-5',
      jobNo: '#JKT-2025-0870',
      customer: 'PT Indofood Sukses Makmur',
      type: 'Export',
      mode: 'Sea FCL',
      currentStatus: 'Completed',
      statusDotColor: 'text-emerald-600',
      quotationStatus: 'Approved',
    },
  ];

  const filteredJobs = recentJobs.filter(job => {
    if (filterMode === 'Sea') return job.mode.includes('Sea');
    if (filterMode === 'Air') return job.mode.includes('Air');
    return true;
  });

  return (
    <div className="space-y-5 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sales Operations Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Commercial pipeline & active consignments assigned to Sales PIC: <strong className="text-slate-800">Farah</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50 transition">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Period: Q1 2026 (MTD)</span>
          </button>
          <button className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-sm hover:bg-slate-50 transition">
            <RotateCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Row of 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ACTIVE JOBS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ACTIVE JOBS</span>
            <div className="p-1 rounded text-red-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">28</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Running freight consignments handled</p>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span>Sea: 19 | Air: 9</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> In Transit
            </span>
          </div>
        </div>

        {/* PENDING QUOTATIONS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">PENDING QUOTATIONS</span>
            <div className="p-1 rounded text-amber-500">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">11</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Awaiting customer review / confirmation</p>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span>Expiring soon: 3</span>
            <span className="flex items-center gap-1 text-amber-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Action Req.
            </span>
          </div>
        </div>

        {/* TOTAL CUSTOMERS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TOTAL CUSTOMERS</span>
            <div className="p-1 rounded text-slate-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">38</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Active corporate accounts assigned</p>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span>Key Accounts: 12</span>
            <span className="text-slate-700 font-semibold">Growth: +3 MTD</span>
          </div>
        </div>

        {/* JOBS IN PROGRESS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">JOBS IN PROGRESS</span>
            <div className="p-1 rounded text-slate-400">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">23</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Consignments moving through pipeline</p>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span>Booking & Routing: 14</span>
            <span className="text-slate-700 font-semibold">In Transit: 9</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Pipeline & Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Quotation Pipeline Status (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-slate-800 border-t-transparent animate-spin-slow"></div>
                <h3 className="text-xs font-bold text-slate-900">Quotation Pipeline Status</h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Total: 21</span>
            </div>

            <div className="space-y-2.5">
              <div className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-800 font-mono">DRAFT</div>
                  <div className="text-[10px] text-slate-500">Internal estimation & routing</div>
                </div>
                <div className="text-xs font-bold text-slate-900 font-mono">
                  4 <span className="text-[10px] font-normal text-slate-500 font-sans">items</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/40 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-amber-900 font-mono">WAITING CONFIRMATION</div>
                  <div className="text-[10px] text-amber-800">Dispatched to client</div>
                </div>
                <div className="text-xs font-bold text-amber-900 font-mono">
                  5 <span className="text-[10px] font-normal text-amber-700 font-sans">items</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-emerald-900 font-mono">APPROVED</div>
                  <div className="text-[10px] text-emerald-800">Ready for Job Order creation</div>
                </div>
                <div className="text-xs font-bold text-emerald-900 font-mono">
                  12 <span className="text-[10px] font-normal text-emerald-700 font-sans">items</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Conversion Rate: <strong className="text-slate-900">57.1%</strong>
            </span>
            <button
              onClick={() => onNavigateTab('quotations')}
              className="text-[#b91c1c] font-bold hover:underline flex items-center gap-1 text-xs"
            >
              <span>Manage Quotations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Customer & Quotation Follow-ups (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-900">Customer & Quotation Follow-ups</h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">PIC: Andi Pratama</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Inner card 1 Polytron */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-mono text-slate-400 font-semibold">QUOTATION #QUO-2025-0104</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9px]">2d old</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1.5">PT Hartono Istana (Polytron)</h4>
                  <p className="text-[10px] text-slate-600 leading-relaxed mb-3">
                    Awaiting final air freight tariff agreement from procurement team. Valid until Friday.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-mono">Route: SIN &rarr; CGK</span>
                  <button className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 text-[10px]">
                    Send Reminder
                  </button>
                </div>
              </div>

              {/* Inner card 2 Alfamart */}
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-mono text-amber-800 font-bold uppercase text-[9px]">CUSTOMER CONFIRMATION</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold text-[9px]">Action Req</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1.5">PT Sumber Alfaria Tbk</h4>
                  <p className="text-[10px] text-slate-600 leading-relaxed mb-3">
                    Quotation #QUO-2025-0102 approved by client. Awaiting formal purchase order / booking sign-off to proceed.
                  </p>
                </div>
                <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-mono">Consignment: #JKT-2025-0891</span>
                  <button 
                    onClick={() => onNavigateTab('jobs')}
                    className="px-2.5 py-1 rounded-md bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold text-[10px] shadow-sm"
                  >
                    Confirm Booking
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500">
            <span>Primary Sea Port: <strong className="text-slate-700">Tanjung Priok (IDJKT)</strong></span>
            <span>Primary Airport: <strong className="text-slate-700">Soekarno-Hatta (WIII/CGK)</strong></span>
            <span>Sales Territory: <strong className="text-slate-700">West Java / Greater JKT</strong></span>
          </div>
        </div>
      </div>

      {/* Bottom Table: Recent Jobs Under PIC Care */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold text-slate-900">Recent Jobs Under PIC Care</h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Showing active and recently finalized shipments managed by Andi Pratama
            </p>
          </div>

          {/* Filter options */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs">
              <button
                onClick={() => setFilterMode('All')}
                className={`px-3 py-1 rounded-md font-semibold text-xs transition ${
                  filterMode === 'All' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All (5)
              </button>
              <button
                onClick={() => setFilterMode('Sea')}
                className={`px-3 py-1 rounded-md font-semibold text-xs transition ${
                  filterMode === 'Sea' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sea Freight
              </button>
              <button
                onClick={() => setFilterMode('Air')}
                className={`px-3 py-1 rounded-md font-semibold text-xs transition ${
                  filterMode === 'Air' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Air Freight
              </button>
            </div>

            <button className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Job Number</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Shipment Type</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Quotation Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold">
                    <span className="text-[#b91c1c] font-bold">#</span>
                    <span className="text-slate-800">{job.jobNo.replace('#', '')}</span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {job.customer}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {job.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {job.mode}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                      <span className={`w-1.5 h-1.5 rounded-full ${job.statusDotColor} bg-current`}></span>
                      {job.currentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {job.quotationStatus}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onNavigateTab('jobs')}
                      className="px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <strong>5</strong> of <strong>28</strong> running consignments for Sales PIC Andi Pratama
          </div>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-50 text-xs">
              Previous
            </button>
            <button className="px-2.5 py-1 rounded bg-[#b91c1c] text-white font-bold text-xs">
              1
            </button>
            <button className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs">
              2
            </button>
            <span className="px-1 text-slate-400">...</span>
            <button className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs">
              6
            </button>
            <button className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 text-center">
        <p className="text-[10px] text-slate-400 font-mono tracking-wider">
          PT HOPELMAR INTERNATIONAL © 2026 • FREIGHT MANAGEMENT INFORMATION SYSTEM
        </p>
      </div>
    </div>
  );
};
