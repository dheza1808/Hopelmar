import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  FileSpreadsheet, 
  SlidersHorizontal, 
  LogOut 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { logout, role, setSelectedCustomerId } = useAuth();

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
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

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-3.5rem)] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Brand Header */}
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
        </div>
      </div>

      {/* Active Perspective Card */}
      <div className="p-3">
        <div className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">Active Perspective</div>
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
        </div>
      </div>

      {/* Nav links */}
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
