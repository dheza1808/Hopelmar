import React, { createContext, useContext, useState } from 'react';
import { 
  UserRole, 
  UserProfile, 
  CustomerAccount, 
  AssignedJob 
} from '../types';
import { 
  initialCustomerAccounts, 
  initialAssignedJobs 
} from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  login: (role: UserRole, email?: string) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;

  // Data Collections
  customers: CustomerAccount[];
  jobs: AssignedJob[];
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;

  // Actions
  addCustomer: (customer: Omit<CustomerAccount, 'id' | 'code' | 'totalJobs' | 'activeJobs' | 'closedJobs'>) => void;
  addJob: (job: Omit<AssignedJob, 'id'>) => void;
}

const defaultUser: UserProfile = {
  id: 'u-farah',
  email: 'farah@hopelmar.co.id',
  fullName: 'Farah',
  role: 'sales',
  avatarChar: 'F',
  title: 'Sales'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(defaultUser);
  const [customers, setCustomers] = useState<CustomerAccount[]>(initialCustomerAccounts);
  const [jobs, setJobs] = useState<AssignedJob[]>(initialAssignedJobs);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const login = (role: UserRole, email?: string) => {
    setUser({
      id: `u-${Date.now()}`,
      email: email || 'farah@hopelmar.co.id',
      fullName: 'Farah',
      role,
      avatarChar: 'F',
      title: 'Sales'
    });
  };

  const logout = () => {
    setUser(null);
  };

  const setRole = (newRole: UserRole) => {
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  const addCustomer = (data: Omit<CustomerAccount, 'id' | 'code' | 'totalJobs' | 'activeJobs' | 'closedJobs'>) => {
    const nextSeq = String(customers.length + 1).padStart(4, '0');
    const newCust: CustomerAccount = {
      ...data,
      id: `c-${Date.now()}`,
      code: `CUS-${nextSeq}`,
      totalJobs: 0,
      activeJobs: 0,
      closedJobs: 0,
    };
    setCustomers(prev => [newCust, ...prev]);
  };

  const addJob = (data: Omit<AssignedJob, 'id'>) => {
    const newJob: AssignedJob = {
      ...data,
      id: `j-${Date.now()}`,
    };
    setJobs(prev => [newJob, ...prev]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'sales',
        login,
        logout,
        setRole,
        customers,
        jobs,
        selectedCustomerId,
        setSelectedCustomerId,
        addCustomer,
        addJob,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
