import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AssignedJob, ShipmentMode, JobCurrentStatus } from '../../types';
import { Modal } from '../../components/shared/Modal';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Clock, 
  Ship, 
  Plane, 
  X, 
  Calendar,
  RotateCcw
} from 'lucide-react';

interface JobListProps {
  isCreateModalOpen?: boolean;
  setIsCreateModalOpen?: (open: boolean) => void;
}

export const JobList: React.FC<JobListProps> = ({
  isCreateModalOpen = false,
  setIsCreateModalOpen,
}) => {
  const { jobs, addJob } = useAuth();
  const [searchJobNo, setSearchJobNo] = useState('');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [tradeFilter, setTradeFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilterActive, setDateFilterActive] = useState(true);
  const [selectedJob, setSelectedJob] = useState<AssignedJob | null>(null);

  const [localModalOpen, setLocalModalOpen] = useState(false);
  const isModalOpen = setIsCreateModalOpen ? isCreateModalOpen : localModalOpen;
  const setModalOpen = setIsCreateModalOpen || setLocalModalOpen;

  // New Job Modal Form
  const [formData, setFormData] = useState({
    jobNumber: `#JKT-2025-0${Math.floor(Math.random() * 90 + 900)}`,
    customer: 'PT Sumber Alfaria Tbk',
    shipmentType: 'Export' as const,
    mode: "Sea FCL 1×40'HC",
    etdEta: '01 Nov / 07 Nov',
    currentStatus: 'Customs Process' as JobCurrentStatus,
    runningDays: '1 Day',
  });

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.jobNumber.toLowerCase().includes(searchJobNo.toLowerCase()) ||
                          job.customer.toLowerCase().includes(searchJobNo.toLowerCase());
    const matchesTrade = tradeFilter === 'All' || job.shipmentType === tradeFilter;
    const matchesStatus = statusFilter === 'All' || job.currentStatus === statusFilter;
    return matchesSearch && matchesTrade && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addJob({
      ...formData,
      assignedPic: 'Farah'
    });
    setModalOpen(false);
  };

  const handleResetFilters = () => {
    setSearchJobNo('');
    setCustomerFilter('All');
    setTradeFilter('All');
    setModeFilter('All');
    setStatusFilter('All');
    setDateFilterActive(false);
  };

  return (
    <div className="space-y-5 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header & 2 KPI Cards */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Assigned Jobs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Live tracking of forwarder manifests, customs clearance milestones, and booking dispatch.
          </p>
        </div>

        {/* 2 KPI Cards */}
        <div className="flex items-center gap-3">
          {/* Card 1: TOTAL ACTIVE JOBS */}
          <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200/90 shadow-sm min-w-[150px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              TOTAL ACTIVE JOBS
            </span>
            <div className="text-2xl font-bold text-slate-900 leading-tight">28</div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> SEA: 19
              </span>
              <span>|</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> AIR: 9
              </span>
            </div>
          </div>

          {/* Card 2: CUSTOMS QUEUE */}
          <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200/90 shadow-sm min-w-[150px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              CUSTOMS QUEUE
            </span>
            <div className="text-2xl font-black text-[#b91c1c] leading-tight">07</div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>AVG DURATION: 3.4D</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action & Search Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New</span>
        </button>

        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchJobNo}
            onChange={(e) => setSearchJobNo(e.target.value)}
            placeholder="Search by Job Number (e.g. #JKT-2025...)"
            className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 shadow-sm"
          />
          <span className="absolute right-3 top-2.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-400 border border-slate-200">
            PRESS ↵
          </span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>FILTERS</span>
          </div>

          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none"
          >
            <option value="All">All Customers</option>
            <option value="Alfamart">PT Sumber Alfaria Tbk</option>
            <option value="Sritex">PT Sri Rejeki Isman</option>
            <option value="Chandra Asri">PT Chandra Asri Petrochemical</option>
            <option value="Polytron">PT Hartono Istana (Polytron)</option>
          </select>

          <select
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none"
          >
            <option value="All">Export / Import (All)</option>
            <option value="Export">Export</option>
            <option value="Import">Import</option>
          </select>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none"
          >
            <option value="All">Air / Sea (All)</option>
            <option value="Sea">Sea Freight</option>
            <option value="Air">Air Freight</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none"
            >
              <option value="All">All Status (Quotation, Documentation, Exim, Customs, Completed)</option>
              <option value="Customs Process">Customs Process</option>
              <option value="Documentation">Documentation</option>
              <option value="Exim">Exim</option>
              <option value="Quotation">Quotation</option>
              <option value="Completed">Completed</option>
            </select>

            {dateFilterActive && (
              <span className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Oct 01 - Oct 31, 2025</span>
                <button onClick={() => setDateFilterActive(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-[#b91c1c] hover:underline flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        </div>
      </div>

      {/* Main Jobs Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">JOB NUMBER</th>
                <th className="py-3 px-4">CUSTOMER</th>
                <th className="py-3 px-4">TYPE</th>
                <th className="py-3 px-4">MODE & SPEC</th>
                <th className="py-3 px-4">ETD / ETA</th>
                <th className="py-3 px-4">CURRENT STATUS</th>
                <th className="py-3 px-4">RUNNING DAYS</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.slice(0, 6).map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold">
                    <div className="inline-block p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[#b91c1c] mr-0.5">#</span>
                      <span className="text-slate-800">{job.jobNumber.replace('#', '')}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {job.customer}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      job.shipmentType === 'Export'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {job.shipmentType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      {job.mode.toLowerCase().includes('air') ? (
                        <Plane className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <Ship className="w-3.5 h-3.5 text-blue-500" />
                      )}
                      <span>{job.mode}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {job.etdEta || 'TBD'}
                  </td>
                  <td className="py-3.5 px-4">
                    {job.currentStatus === 'Customs Process' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Customs Process
                      </span>
                    )}
                    {job.currentStatus === 'Documentation' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        Documentation
                      </span>
                    )}
                    {job.currentStatus === 'Exim' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        Exim
                      </span>
                    )}
                    {job.currentStatus === 'Quotation' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center">
                        Quotation
                      </span>
                    )}
                    {job.currentStatus === 'Completed' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Completed
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">
                    {job.runningDays || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
                      >
                        Detail
                      </button>
                      <button className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <strong>1 - 6</strong> of <strong>28</strong> Sales Assigned Jobs
          </div>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 text-xs">
              Previous
            </button>
            <button className="px-2.5 py-1 rounded bg-[#b91c1c] text-white font-bold text-xs">
              1
            </button>
            <button className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs">
              2
            </button>
            <button className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs">
              3
            </button>
            <button className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Viewport Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
        <div>VIEWPORT: DESKTOP_LOGISTICS_RAIL (1440w)</div>
        <div>LAST SYNCED: 2025-10-31 16:42:19 UTC+7</div>
      </div>

      {/* CREATE NEW JOB MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Job"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Customer Account *
            </label>
            <input
              type="text"
              required
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Shipment Type *
              </label>
              <select
                value={formData.shipmentType}
                onChange={(e) => setFormData({ ...formData, shipmentType: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none"
              >
                <option value="Export">Export</option>
                <option value="Import">Import</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Mode & Spec *
              </label>
              <input
                type="text"
                required
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                ETD / ETA Dates
              </label>
              <input
                type="text"
                value={formData.etdEta}
                onChange={(e) => setFormData({ ...formData, etdEta: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Initial Status
              </label>
              <select
                value={formData.currentStatus}
                onChange={(e) => setFormData({ ...formData, currentStatus: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none"
              >
                <option value="Quotation">Quotation</option>
                <option value="Documentation">Documentation</option>
                <option value="Customs Process">Customs Process</option>
                <option value="Exim">Exim</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold"
            >
              Create Job Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Job Detail Modal */}
      <Modal
        isOpen={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
        title={`Job Information: ${selectedJob?.jobNumber}`}
        maxWidth="md"
      >
        {selectedJob && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-bold text-slate-900">{selectedJob.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mode:</span>
                <span className="font-medium text-slate-700">{selectedJob.mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ETD / ETA:</span>
                <span className="font-mono text-slate-700">{selectedJob.etdEta}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-bold text-slate-800">{selectedJob.currentStatus}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
