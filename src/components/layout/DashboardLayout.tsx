import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  breadcrumb: string[];
  onNewQuotation?: () => void;
  onNavigateHome?: () => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activeTab,
  setActiveTab,
  breadcrumb,
  onNewQuotation,
  onNavigateHome,
  children,
}) => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] antialiased">
      <Navbar 
        breadcrumb={breadcrumb}  
        
        onNewQuotation={onNewQuotation}
        onNavigateHome={onNavigateHome}
      />
      <div className="flex-1 flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-6 overflow-y-auto max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
