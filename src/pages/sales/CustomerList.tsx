import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CustomerAccount } from '../../types';
import { Modal } from '../../components/shared/Modal';
import { 
  Download, 
  Plus, 
  Search, 
  RotateCcw, 
  BookOpen, 
  Ship, 
  FileText, 
  ShieldCheck, 
  Columns,
  RotateCw
} from 'lucide-react';

interface CustomerListProps {
  onSelectCustomer: (customerId: string) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ onSelectCustomer }) => {
  const { customers, addCustomer } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Customer Form
  const [formData, setFormData] = useState({
    companyName: '',
    category: 'FMCG & Logistics Account',
    contactPerson: '',
    roleTitle: '',
    phone: '',
    email: '',
    address: '',
    npwpVerified: true,
    totalTeu: 20,
    airWeightKg: 500,
    creditTerms: '30 Days',
    creditStatus: 'Regular Standing',
    industry: 'FMCG & Retail',
    status: 'Active Client' as const,
    region: 'Greater Jakarta',
  });

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName) return;

    addCustomer({
      ...formData,
      accountCode: `#ACC-ID-${formData.companyName.substring(0, 4).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`
    });

    setIsAddModalOpen(false);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedIndustry('All');
    setSelectedStatus('All');
    setSelectedRegion('All');
  };

  return (
    <div className="space-y-5 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Directory & Accounts</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Central commercial master data and trade account management for ocean & air forwarding operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-sm hover:bg-slate-50 transition">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* 4 Top-Bordered Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL MANAGED ACCOUNTS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 border-t-2 border-t-red-600 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span>TOTAL MANAGED ACCOUNTS</span>
            <BookOpen className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex items-baseline gap-3 mt-1.5">
            <span className="text-2xl font-bold text-slate-900">38</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              +3 this month
            </span>
          </div>
        </div>

        {/* Card 2: ACTIVE FREIGHT JOBS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 border-t-2 border-t-blue-500 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span>ACTIVE FREIGHT JOBS</span>
            <Ship className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-3 mt-1.5">
            <span className="text-2xl font-bold text-slate-900">105</span>
            <span className="text-xs text-slate-500 font-medium">Across 6 clients</span>
          </div>
        </div>

        {/* Card 3: OPEN QUOTATIONS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 border-t-2 border-t-amber-500 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span>OPEN QUOTATIONS</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-3 mt-1.5">
            <span className="text-2xl font-bold text-slate-900">22</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              Pending sign-off
            </span>
          </div>
        </div>

        {/* Card 4: CREDIT STATUS REVIEW */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 border-t-2 border-t-emerald-500 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span>CREDIT STATUS REVIEW</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-3 mt-1.5">
            <span className="text-2xl font-bold text-slate-900">94%</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Clean payment terms
            </span>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer name, contact person, email..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium text-[11px]">Industry:</span>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none"
            >
              <option value="All">All Industries / Categories</option>
              <option value="FMCG">FMCG & Retail</option>
              <option value="Textile">Textile & Garment</option>
              <option value="Chemical">Chemical & Petrochemical</option>
              <option value="Electronics">Electronics</option>
              <option value="Automotive">Automotive</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium text-[11px]">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Client</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium text-[11px]">Region:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none"
            >
              <option value="All">All Cities / Regions</option>
              <option value="Jakarta">Greater Jakarta (Jabodetabek)</option>
              <option value="Central Java">Central Java</option>
              <option value="East Java">East Java</option>
            </select>
          </div>

          <button
            onClick={handleResetFilters}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 ml-auto font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Table: ENTERPRISE ACCOUNTS REGISTER */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase">
              ENTERPRISE ACCOUNTS REGISTER
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
              6 OF 38 LOADED
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Density: Compact</span>
            <button className="text-slate-400 hover:text-slate-700">
              <Columns className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">CUSTOMER NAME</th>
                <th className="py-3 px-4">CONTACT PERSON</th>
                <th className="py-3 px-4">PHONE</th>
                <th className="py-3 px-4">EMAIL</th>
                <th className="py-3 px-4 text-center">TOTAL JOBS</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <span className="font-bold text-slate-900">{cust.companyName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        {cust.code}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800">{cust.contactPerson}</div>
                    <div className="text-[10px] text-slate-400">{cust.roleTitle}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">
                    {cust.phone}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                    {cust.email}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-[#e0f2fe] text-[#0369a1]">
                      {cust.totalJobs} Jobs
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => onSelectCustomer(cust.id)}
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
            Showing <strong>1 - 6</strong> of <strong>38</strong> Customers
          </div>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-50 text-xs">
              &lt; Previous
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
              Next &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sync Banner */}
      <div className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <RotateCw className="w-3.5 h-3.5 text-red-600" />
          <span>Customer records sync with Indonesian Customs INSW system and PT Hopelmar Quotation Engine.</span>
        </div>
        <div className="font-mono text-[10px] text-slate-400">
          Last Sync: 14:02:11 WIB
        </div>
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Enterprise Trade Account"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Company Name (PT / CV) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. PT Mayora Indah Tbk"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Contact Person *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Budi Hendrawan"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Role / Title
              </label>
              <input
                type="text"
                placeholder="e.g. Procurement Mgr"
                value={formData.roleTitle}
                onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Direct Phone / WhatsApp *
              </label>
              <input
                type="text"
                required
                placeholder="+62 811-xxxx-xxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Corporate Email *
              </label>
              <input
                type="email"
                required
                placeholder="procurement@company.co.id"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Billing & Physical Address *
            </label>
            <textarea
              required
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
