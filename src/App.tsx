import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Pages
import { SalesDashboard } from './pages/sales/SalesDashboard';
import { CustomerList } from './pages/sales/CustomerList';
import { CustomerDetail } from './pages/sales/CustomerDetail';
import { JobList } from './pages/sales/JobList';
import { QuotationList } from './pages/sales/QuotationList';

export const AppContent: React.FC = () => {
  const { user, customers, selectedCustomerId, setSelectedCustomerId } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);

  if (!user) {
    return <Login />;
  }

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Dynamic Breadcrumbs matching Figma wireframes
  const getBreadcrumb = () => {
    if (activeTab === 'dashboard') {
      return ['PT Hopelmar MIS', 'Sales Dashboard'];
    }
    if (activeTab === 'customers') {
      if (selectedCustomer) {
        return ['Customers', selectedCustomer.companyName];
      }
      return ['PT Hopelmar MIS', 'Customer List'];
    }
    if (activeTab === 'jobs') {
      return ['PT Hopelmar MIS', 'Job List'];
    }
    if (activeTab === 'quotations') {
      return ['PT Hopelmar MIS', 'Quotations'];
    }
    return ['PT Hopelmar MIS', 'Sales Dashboard'];
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <SalesDashboard
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              if (tab !== 'customers') setSelectedCustomerId(null);
            }}
          />
        );

      case 'customers':
        if (selectedCustomerId) {
          return (
            <CustomerDetail
              customerId={selectedCustomerId}
              onBackToList={() => setSelectedCustomerId(null)}
              onCreateJobForCustomer={(cId) => {
                setActiveTab('jobs');
                setIsCreateJobOpen(true);
              }}
            />
          );
        }
        return (
          <CustomerList
            onSelectCustomer={(cId) => setSelectedCustomerId(cId)}
          />
        );

      case 'jobs':
        return (
          <JobList
            isCreateModalOpen={isCreateJobOpen}
            setIsCreateModalOpen={setIsCreateJobOpen}
          />
        );

      case 'quotations':
        return <QuotationList />;

      default:
        return (
          <SalesDashboard
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        );
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      breadcrumb={getBreadcrumb()}
      onNewQuotation={() => setActiveTab('quotations')}
      onNavigateHome={() => {
        setActiveTab('dashboard');
        setSelectedCustomerId(null);
      }}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default function App() {
  return <AppContent />;
}
