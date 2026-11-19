import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
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

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const roleLabels: Record<UserRole, string> = {
  sales_marketing: 'Sales & Marketing',
  sales_support: 'Sales Support',
  exim: 'Exim',
  admin_invoice: 'Admin Invoice + Pengadaan',
  accounting: 'Accounting',
};

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { logout, role, setSelectedCustomerId } = useAuth();

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'customers') setSelectedCustomerId(null);
  };

  const navItems = role ? roleNavItems[role] : [];

  return (
    <aside className="w-[240px] bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-60px)] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Active Perspective Card */}
      <div className="px-2.5 pb-0.5 pt-px">
       <div className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">Active Perspective</div>
            <div className="text-xs font-bold text-slate-800">Role: {role ? roleLabels[role] : 'Unknown'}</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
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