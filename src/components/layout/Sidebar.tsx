import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
<<<<<<< HEAD
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  BriefcaseBusiness,
  Coins,
  ContactRound,
  ClipboardList,
  FolderOpen,
  ReceiptText,
  CreditCard,
  ShoppingCart,
  Wallet,
  Scale,
  History,
  LogOut 
} from 'lucide-react';
import type { UserRole } from '../../types';
import hopelmarSymbol from '../../../assets/hopelmar-symbol.jpeg';

export const roleNavItems: Record<UserRole, { id: string; label: string; icon: typeof LayoutDashboard }[]> = {
  sales_marketing: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'job-history', label: 'Job Order History', icon: History },
    { id: 'customers', label: 'Master Customer', icon: Users },
    { id: 'quotations', label: 'Quotation', icon: FileText },
    { id: 'pnl-report', label: 'Report PNL', icon: BarChart3 },
  ],
  sales_support: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'job-history', label: 'Job Order History', icon: History },
    { id: 'job-orders', label: 'Job Order', icon: BriefcaseBusiness },
    { id: 'extra-costs', label: 'Biaya Tambahan', icon: Coins },
    { id: 'vendors', label: 'Data Vendor/Agent', icon: ContactRound },
  ],
  exim: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'job-history', label: 'Job Order History', icon: History },
    { id: 'field-tasks', label: 'Task Lapangan', icon: ClipboardList },
    { id: 'customs-documents', label: 'Dokumen Pabean', icon: FolderOpen },
  ],
  admin_invoice: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'job-history', label: 'Job Order History', icon: History },
    { id: 'billing', label: 'Billing/Invoice', icon: ReceiptText },
    { id: 'payments', label: 'Pembayaran Masuk', icon: CreditCard },
    { id: 'procurement', label: 'Pengadaan Internal', icon: ShoppingCart },
    { id: 'petty-cash', label: 'Petty Cash', icon: Wallet },
  ],
  accounting: [
    { id: 'dashboard', label: 'Dashboard Keuangan', icon: LayoutDashboard },
    { id: 'job-history', label: 'Job Order History', icon: History },
    { id: 'pnl-data', label: 'Data PNL', icon: BarChart3 },
    { id: 'margin-report', label: 'Laporan Margin', icon: Scale },
  ],
};
=======
  LayoutDashboard, 
  Users, 
  Truck, 
  FileSpreadsheet, 
  SlidersHorizontal, 
  LogOut 
} from 'lucide-react';
>>>>>>> 813a504b7d5a700a51412b1f909548bb936c32fe

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

<<<<<<< HEAD
const roleLabels: Record<UserRole, string> = {
  sales_marketing: 'Sales & Marketing',
  sales_support: 'Sales Support',
  exim: 'Exim',
  admin_invoice: 'Admin Invoice + Pengadaan',
  accounting: 'Accounting',
};

=======
>>>>>>> 813a504b7d5a700a51412b1f909548bb936c32fe
export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { logout, role, setSelectedCustomerId } = useAuth();

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
<<<<<<< HEAD
    if (tab !== 'customers') setSelectedCustomerId(null);
  };

  const navItems = role ? roleNavItems[role] : [];
=======
    if (tab !== 'customers') {
      setSelectedCustomerId(null);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'jobs', label: 'Jobs', icon: Truck },
    { id: 'quotations', label: 'Quotations', icon: FileSpreadsheet },
  ];
>>>>>>> 813a504b7d5a700a51412b1f909548bb936c32fe

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-3.5rem)] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Brand Header */}
<<<<<<< HEAD
      <div className="border-b border-slate-100 px-3 py-4">
        <div className="flex items-center gap-2.5">
          <img src={hopelmarSymbol} alt="" className="h-9 w-9 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold leading-tight text-slate-900">PT Hopelmar International</p>
            <p className="mt-0.5 text-[8px] leading-tight text-slate-600">Freight Forwarding &amp; Logistics</p>
          </div>
=======
      <div className="p-4 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-700 shrink-0">
          <svg className="w-4 h-4 text-[#b91c1c]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15 8H9L12 2Z" />
            <path d="M12 7L17 14H7L12 7Z" />
            <path d="M12 13L19 21H5L12 13Z" />
          </svg>
        </div>
        <div className="leading-tight">
          <h2 className="text-xs font-bold text-slate-900 tracking-tight">PT Hopelmar International</h2>
          <p className="text-[9px] text-slate-400 font-medium">Freight Forwarding & Logistics</p>
>>>>>>> 813a504b7d5a700a51412b1f909548bb936c32fe
        </div>
      </div>

      {/* Active Perspective Card */}
      <div className="p-3">
        <div className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">Active Perspective</div>
<<<<<<< HEAD
            <div className="text-xs font-bold text-slate-800">{role ? roleLabels[role] : 'Unknown'}</div>
          </div>
=======
            <div className="text-xs font-bold text-slate-800">
              Role: {role?.replace('_', ' ') || 'Unknown'}
            </div>
          </div>
          <button 
            title="Switch Perspective"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
>>>>>>> 813a504b7d5a700a51412b1f909548bb936c32fe
        </div>
      </div>

      {/* Nav links */}
<<<<<<< HEAD
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 space-y-1">
        <div className="space-y-1 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#fee2e2] text-[#b91c1c] font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#b91c1c]' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
=======
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#fee2e2] text-[#b91c1c] font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#b91c1c]' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
>>>>>>> 813a504b7d5a700a51412b1f909548bb936c32fe
      </nav>

      {/* Bottom Logout */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={logout}
          className="w-full py-2 px-3 rounded-lg border border-slate-200 text-[#b91c1c] hover:bg-red-50 text-xs font-bold flex items-center gap-2 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
