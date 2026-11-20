import React from 'react';
import { Navbar, WorkspaceNotification, WorkspaceSearchResult } from './Navbar';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  breadcrumb: string[];
  onNewQuotation?: () => void;
  onNavigateHome?: () => void;
  notifications?: WorkspaceNotification[];
  onSelectNotification?: (notification: WorkspaceNotification) => void;
  searchResults?: WorkspaceSearchResult[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSelectSearchResult?: (result: WorkspaceSearchResult) => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activeTab,
  setActiveTab,
  breadcrumb,
  onNewQuotation,
  onNavigateHome,
  notifications,
  onSelectNotification,
  searchResults,
  searchValue,
  onSearchChange,
  onSelectSearchResult,
  children,
}) => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] antialiased">
      <Navbar 
        breadcrumb={breadcrumb}  
        onNewQuotation={onNewQuotation}
        onNavigateHome={onNavigateHome}
        notifications={notifications}
        onSelectNotification={onSelectNotification}
        searchResults={searchResults}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        onSelectSearchResult={onSelectSearchResult}
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
