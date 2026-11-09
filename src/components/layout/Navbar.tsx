import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, Bell, HelpCircle, ChevronRight } from 'lucide-react';

interface NavbarProps {
  breadcrumb: string[];
  onNewQuotation?: () => void;
  onNavigateHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  breadcrumb, 
  onNewQuotation,
  onNavigateHome 
}) => {
  const { user } = useAuth();

  return (
    <header className="h-14 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Left Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs">
        {breadcrumb.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="text-slate-400">/</span>}
            <span 
              onClick={idx === 0 && onNavigateHome ? onNavigateHome : undefined}
              className={`${
                idx === breadcrumb.length - 1 
                  ? 'font-bold text-slate-800' 
                  : 'text-slate-500 font-medium cursor-pointer hover:text-slate-800'
              }`}
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Center Search Input */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search Job, BL, Quotation, Client..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition"
          />
        </div>
      </div>

      {/* Right User & Actions */}
      <div className="flex items-center gap-3">
        {onNewQuotation && (
          <button
            onClick={onNewQuotation}
            className="px-3 py-1.5 rounded-lg bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Quotation</span>
          </button>
        )}

        <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* Notifications */}
        <button 
          title="Notifications"
          className="relative p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white"></span>
        </button>

        {/* Help */}
        <button 
          title="Help & Guidelines"
          className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Card */}
        <div className="flex items-center gap-2 pl-2">
          <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-800">
            {user?.avatarChar || 'F'}
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <div className="text-xs font-bold text-slate-800">{user?.fullName || 'Farah'}</div>
            <div className="text-[10px] text-slate-400 font-medium">{user?.title || 'Sales'}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
