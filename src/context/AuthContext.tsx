import React, { createContext, useContext, useEffect, useState } from 'react';
import { AssignedJob, CustomerAccount, UserProfile, UserRole } from '../types';
import {
  initialCustomerAccounts,
  initialAssignedJobs,
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  // Data Collections
  customers: CustomerAccount[];
  jobs: AssignedJob[];
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;

  // Actions
  addCustomer: (customer: Omit<CustomerAccount, 'id' | 'code' | 'totalJobs' | 'activeJobs' | 'closedJobs'>) => void;
  addJob: (job: Omit<AssignedJob, 'id'>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerAccount[]>(initialCustomerAccounts);
  const [jobs, setJobs] = useState<AssignedJob[]>(initialAssignedJobs);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let profileRequest = 0;

    const syncSession = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) => {
      const requestId = ++profileRequest;
      setAuthError(null);

      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Ambil data profil (mendukung kolom 'name' atau 'full_name')
        const { data, error } = await supabase
          .from('profiles')
          .select('id, role, name, full_name')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Profil pengguna tidak ditemukan.');
        if (!active || requestId !== profileRequest) return;

        const role = data.role as UserRole;
        const roleTitles: Record<UserRole, string> = {
          sales_marketing: 'Sales & Marketing',
          sales_support: 'Sales Support',
          exim: 'Exim',
          admin_invoice: 'Admin Invoice + Pengadaan',
          accounting: 'Accounting',
        };

        const fullName = data.full_name || data.name || session.user.email?.split('@')[0] || 'User';

        setUser({
          id: data.id,
          email: session.user.email || '',
          fullName,
          role,
          avatarChar: fullName.trim().charAt(0).toUpperCase() || 'U',
          title: roleTitles[role] || role,
        });
      } catch (error) {
        if (!active || requestId !== profileRequest) return;
        setUser(null);
        setAuthError(error instanceof Error ? error.message : 'Gagal memuat profil pengguna.');
      } finally {
        if (active && requestId === profileRequest) setLoading(false);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => {
        if (active) void syncSession(session);
      });
    });

    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (active) await syncSession(data.session);
      } catch (error) {
        if (!active) return;
        setAuthError(error instanceof Error ? error.message : 'Gagal memeriksa sesi pengguna.');
        setLoading(false);
      }
    };

    void getSession();

    return () => {
      active = false;
      profileRequest += 1;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setAuthError(null);
    if (!isSupabaseConfigured) {
      const err = new Error('Supabase belum dikonfigurasi. Atur VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.');
      setAuthError(err.message);
      throw err;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      // PERBAIKAN UTAMA: Lempar error jika kata sandi/email salah
      if (error) {
        setAuthError(error.message);
        throw error;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login gagal. Silakan coba lagi.';
      setAuthError(message);
      throw error; // Memastikan komponen Login.tsx dapat menangkap kegagalan login
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) setAuthError(error.message);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Logout gagal. Silakan coba lagi.');
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
        role: user?.role ?? null,
        loading,
        authError,
        login,
        logout,
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