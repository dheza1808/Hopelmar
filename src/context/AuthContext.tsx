import React, { createContext, Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import {
  AssignedJob,
  CustomerAccount,
  DebitNote,
  FieldTask,
  Invoice,
  Job,
  JobDocument,
  JobStatus,
  PnlReport,
  PaymentMethod,
  PettyCashEntry,
  ProcurementRequest,
  Quotation,
  QuotationWorkflowStage,
  JobWorkflowStage,
  Vendor,
  VendorBill,
  UserProfile,
  UserRole,
} from '../types';
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
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  // Data Collections
  customers: CustomerAccount[];
  jobs: Job[];
  documents: JobDocument[];
  invoices: Invoice[];
  quotations: Quotation[];
  pnlReports: PnlReport[];
  vendors: Vendor[];
  vendorBills: VendorBill[];
  fieldTasks: FieldTask[];
  procurementRequests: ProcurementRequest[];
  pettyCashEntries: PettyCashEntry[];
  debitNotes: DebitNote[];
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;

  // Actions
  addCustomer: (customer: Omit<CustomerAccount, 'id' | 'code' | 'totalJobs' | 'activeJobs' | 'closedJobs'>) => void;
  addJob: (job: Omit<AssignedJob, 'id'>) => void;
  updateJobStatus: (jobId: string, status: JobStatus) => void;
  addDocument: (document: Omit<JobDocument, 'id' | 'uploadedAt'>) => void;
  updateDocumentStatus: (documentId: string, status: JobDocument['status']) => void;
  addQuotation: (quotation: Omit<Quotation, 'id' | 'estimatedMargin' | 'workflowStage' | 'revisionNumber' | 'customerType'> & Partial<Pick<Quotation, 'workflowStage' | 'revisionNumber' | 'customerType'>>) => void;
  updateInvoiceStatus: (invoiceId: string, amountPaid: number, paymentMethod: PaymentMethod) => void;
  recordCustomerApproval: (quotationId: string) => void;
  requestQuotationRevision: (quotationId: string) => void;
  reviseQuotation: (quotationId: string, revision: Pick<Quotation, 'serviceType' | 'cargoDescription' | 'totalSellingEst' | 'totalCostEst' | 'validUntil'>) => void;
  updateCustomerLegalStatus: (customerId: string, verified: boolean) => void;
  createJobFromQuotation: (quotationId: string) => void;
  completeEximWork: (jobId: string, incoterm: string, documentsComplete: boolean) => void;
  decideAdditionalCost: (jobId: string, hasAdditionalCost: boolean) => void;
  saveAdditionalCost: (jobId: string, amount: number) => void;
  createInvoiceForJob: (jobId: string) => void;
  sendInvoiceToCustomer: (invoiceId: string) => void;
  createPnlReport: () => void;
  addVendor: (vendor: Omit<Vendor, 'id'>) => void;
  addVendorBill: (bill: Omit<VendorBill, 'id' | 'reconciled'>) => void;
  reconcileVendorBill: (billId: string) => void;
  addFieldTask: (task: Omit<FieldTask, 'id' | 'completed'>) => void;
  completeFieldTask: (taskId: string) => void;
  addProcurementRequest: (description: string, amount: number) => void;
  addPettyCashEntry: (description: string, amount: number) => void;
  addDebitNote: (jobId: string, amount: number, reason: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function usePersistentState<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = window.localStorage.getItem(`hopelmar.${key}`);
      return saved ? JSON.parse(saved) as T : initialValue;
    } catch (error) {
      console.error(`Failed to load local workflow data "${key}".`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(`hopelmar.${key}`, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save local workflow data "${key}".`, error);
    }
  }, [key, value]);

  return [value, setValue];
}

const normalizeUserRole = (value: unknown): UserRole | null => {
  switch (value) {
    case 'sales':
    case 'sales_marketing':
      return 'sales_marketing';
    case 'sales_support':
      return 'sales_support';
    case 'customer_service':
    case 'exim':
      return 'exim';
    case 'finance':
    case 'admin_invoice':
      return 'admin_invoice';
    case 'manager':
    case 'accounting':
      return 'accounting';
    default:
      return null;
  }
};

const toJob = (job: AssignedJob): Job => {
  const [etd = 'TBD', eta = 'TBD'] = (job.etdEta || '').split('/').map((date) => date.trim());
  const statusByCurrentStatus: Record<AssignedJob['currentStatus'], JobStatus> = {
    'Customs Process': 'customs_clearance',
    Documentation: 'booking_confirmed',
    Exim: 'in_transit',
    Quotation: 'draft',
    Completed: 'delivered',
  };

  return {
    ...job,
    jobNo: job.jobNumber,
    customerName: job.customer,
    serviceType: job.mode,
    origin: job.pol || 'Belum diisi',
    destination: job.pod || 'Belum diisi',
    vesselOrFlight: '',
    containerNo: '',
    assignedSupport: job.assignedPic || 'Belum ditentukan',
    etd,
    eta,
    status: statusByCurrentStatus[job.currentStatus],
    sellingPrice: 0,
    costingTotal: 0,
    margin: 0,
    quotationId: null,
    workflowStage: 'legacy',
    incoterm: '',
    documentsComplete: false,
    additionalCost: 0,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [customers, setCustomers] = usePersistentState<CustomerAccount[]>('customers', initialCustomerAccounts);
  const [jobs, setJobs] = usePersistentState<Job[]>('jobs', initialAssignedJobs.map(toJob));
  const [documents, setDocuments] = usePersistentState<JobDocument[]>('documents', []);
  const [invoices, setInvoices] = usePersistentState<Invoice[]>('invoices', []);
  const [quotations, setQuotations] = usePersistentState<Quotation[]>('quotations', []);
  const [pnlReports, setPnlReports] = usePersistentState<PnlReport[]>('pnl-reports', []);
  const [vendors, setVendors] = usePersistentState<Vendor[]>('vendors', []);
  const [vendorBills, setVendorBills] = usePersistentState<VendorBill[]>('vendor-bills', []);
  const [fieldTasks, setFieldTasks] = usePersistentState<FieldTask[]>('field-tasks', []);
  const [procurementRequests, setProcurementRequests] = usePersistentState<ProcurementRequest[]>('procurement-requests', []);
  const [pettyCashEntries, setPettyCashEntries] = usePersistentState<PettyCashEntry[]>('petty-cash', []);
  const [debitNotes, setDebitNotes] = usePersistentState<DebitNote[]>('debit-notes', []);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const workflowReady = useRef(false);
  const workflowSnapshot = useRef(new Map<string, string>());
  const localWorkflowState = useRef({ customers, quotations, jobs, invoices });
  localWorkflowState.current = { customers, quotations, jobs, invoices };

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
        // Load the profile role and display name from the profiles table.
        const { data, error } = await supabase
          .from('profiles')
          .select('id, role, full_name')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Profil pengguna tidak ditemukan.');
        if (!active || requestId !== profileRequest) return;

        const role = normalizeUserRole(data.role);
        if (!role) {
          throw new Error(`Role profil "${data.role}" tidak dikenal. Periksa role pada tabel profiles.`);
        }
        const roleTitles: Record<UserRole, string> = {
          sales_marketing: 'Sales & Marketing',
          sales_support: 'Sales Support',
          exim: 'Exim',
          admin_invoice: 'Admin Invoice + Pengadaan',
          accounting: 'Accounting',
        };

        const fullName = data.full_name || session.user.email?.split('@')[0] || 'User';

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

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) {
      workflowReady.current = false;
      workflowSnapshot.current.clear();
      setWorkflowLoading(false);
      return;
    }

    let active = true;
    workflowReady.current = false;
    setWorkflowLoading(true);
    setAuthError(null);
    const userId = user.id;
    const userRole = user.role;
    const recordKey = (type: string, id: string) => `${type}:${id}`;
    const canWrite = (type: string) => (
      type === 'customer'
        ? userRole === 'sales_marketing'
        : type === 'quotation'
          ? userRole === 'sales_marketing' || userRole === 'sales_support'
          : type === 'invoice'
            ? userRole === 'admin_invoice' || userRole === 'accounting'
          : true
    );

    const syncWorkflow = async () => {
      try {
        const { data: currentRecords, error: loadError } = await supabase
          .from('workflow_records')
          .select('record_type, record_id');
        if (loadError) throw loadError;

        const remoteKeys = new Set((currentRecords || []).map((record) => recordKey(record.record_type, record.record_id)));
        const local = localWorkflowState.current;
        const seedRows = [
          ...local.customers.filter((item) => canWrite('customer') && !remoteKeys.has(recordKey('customer', item.id)))
            .map((item) => ({ record_type: 'customer', record_id: item.id, payload: item })),
          ...local.quotations.filter((item) => canWrite('quotation') && !remoteKeys.has(recordKey('quotation', item.id)))
            .map((item) => ({ record_type: 'quotation', record_id: item.id, payload: item })),
          ...local.jobs.filter((item) => canWrite('job') && !remoteKeys.has(recordKey('job', item.id)))
            .map((item) => ({ record_type: 'job', record_id: item.id, payload: item })),
          ...local.invoices.filter((item) => canWrite('invoice') && !remoteKeys.has(recordKey('invoice', item.id)))
            .map((item) => ({ record_type: 'invoice', record_id: item.id, payload: item })),
        ];

        if (seedRows.length) {
          const { error: seedError } = await supabase.from('workflow_records').upsert(
            seedRows.map((record) => ({
              ...record,
              updated_by: userId,
              should_notify: true,
            })),
            { onConflict: 'record_type,record_id', ignoreDuplicates: true },
          );
          if (seedError) throw seedError;
        }

        const { data, error } = await supabase
          .from('workflow_records')
          .select('record_type, record_id, payload');
        if (error) throw error;
        if (!active) return;

        const cloudCustomers = (data || [])
          .filter((record) => record.record_type === 'customer')
          .map((record) => record.payload as CustomerAccount);
        const cloudQuotations = (data || [])
          .filter((record) => record.record_type === 'quotation')
          .map((record) => record.payload as Quotation);
        const cloudJobs = (data || [])
          .filter((record) => record.record_type === 'job')
          .map((record) => record.payload as Job);
        const cloudInvoices = (data || [])
          .filter((record) => record.record_type === 'invoice')
          .map((record) => record.payload as Invoice);

        const mergeById = <T extends { id: string }>(localItems: T[], cloudItems: T[]) => {
          const merged = new Map(localItems.map((item) => [item.id, item]));
          cloudItems.forEach((item) => merged.set(item.id, item));
          return [...merged.values()];
        };
        const mergedCustomers = mergeById(local.customers, cloudCustomers);
        const mergedQuotations = mergeById(local.quotations, cloudQuotations);
        const mergedJobs = mergeById(local.jobs, cloudJobs);
        const mergedInvoices = mergeById(local.invoices, cloudInvoices);

        workflowSnapshot.current.clear();
        mergedCustomers.forEach((item) => workflowSnapshot.current.set(recordKey('customer', item.id), JSON.stringify(item)));
        mergedQuotations.forEach((item) => workflowSnapshot.current.set(recordKey('quotation', item.id), JSON.stringify(item)));
        mergedJobs.forEach((item) => workflowSnapshot.current.set(recordKey('job', item.id), JSON.stringify(item)));
        mergedInvoices.forEach((item) => workflowSnapshot.current.set(recordKey('invoice', item.id), JSON.stringify(item)));
        setCustomers(mergedCustomers);
        setQuotations(mergedQuotations);
        setJobs(mergedJobs);
        setInvoices(mergedInvoices);
        workflowReady.current = true;
        setAuthError(null);
        setWorkflowLoading(false);

        const channel = supabase.channel(`workflow-records-${userId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'workflow_records' }, (change) => {
            if (change.eventType === 'DELETE') return;
            const record = change.new as { record_type?: string; record_id?: string; payload?: unknown };
            if (
              typeof record.record_type !== 'string'
              || typeof record.record_id !== 'string'
              || !record.payload
              || typeof record.payload !== 'object'
            ) return;
            const payload = record.payload as { id?: string };
            if (payload.id !== record.record_id) return;

            workflowSnapshot.current.set(recordKey(record.record_type, record.record_id), JSON.stringify(payload));
            if (record.record_type === 'customer') {
              setCustomers((items) => mergeById(items, [payload as CustomerAccount]));
            } else if (record.record_type === 'quotation') {
              setQuotations((items) => mergeById(items, [payload as Quotation]));
            } else if (record.record_type === 'job') {
              setJobs((items) => mergeById(items, [payload as Job]));
            } else if (record.record_type === 'invoice') {
              setInvoices((items) => mergeById(items, [payload as Invoice]));
            }
          })
          .subscribe((status) => {
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.error('Shared workflow updates could not be received.', status);
              if (active) setAuthError('Pembaruan workflow langsung terputus. Muat ulang aplikasi untuk menyinkronkan ulang.');
            }
          });

        const channelCleanup = () => { void supabase.removeChannel(channel); };
        cleanupRealtime = channelCleanup;
      } catch (error) {
        console.error('Failed to sync shared workflow data.', error);
        if (active) {
          setAuthError('Data workflow bersama gagal dimuat. Pastikan migration shared workflow sudah dijalankan.');
          setWorkflowLoading(false);
        }
      }
    };

    let cleanupRealtime = () => {};
    void syncWorkflow();
    return () => {
      active = false;
      cleanupRealtime();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured || !workflowReady.current) return;
    const records = [
      ...customers.map((item) => ({ type: 'customer', id: item.id, payload: item })),
      ...quotations.map((item) => ({ type: 'quotation', id: item.id, payload: item })),
      ...jobs.map((item) => ({ type: 'job', id: item.id, payload: item })),
      ...invoices.map((item) => ({ type: 'invoice', id: item.id, payload: item })),
    ];
    const changed = records.filter((record) => (
      workflowSnapshot.current.get(`${record.type}:${record.id}`) !== JSON.stringify(record.payload)
    ));
    if (!changed.length) return;

    changed.forEach((record) => {
      workflowSnapshot.current.set(`${record.type}:${record.id}`, JSON.stringify(record.payload));
    });
    const syncRecords = async () => {
      for (const type of ['customer', 'quotation', 'job', 'invoice']) {
        const batch = changed.filter((record) => record.type === type);
        if (!batch.length) continue;
        const { error } = await supabase.from('workflow_records').upsert(
          batch.map((record) => ({
            record_type: record.type,
            record_id: record.id,
            payload: record.payload,
            updated_by: user.id,
            should_notify: true,
          })),
          { onConflict: 'record_type,record_id' },
        );
        if (error) {
          console.error(`Failed to sync ${type} workflow records.`, error);
          setAuthError(`Perubahan ${type} gagal disimpan ke server. Periksa koneksi dan izin akun.`);
          return;
        }
      }
    };
    void syncRecords();
  }, [customers, invoices, jobs, quotations, user?.id]);

  const login = async (username: string, password: string) => {
    setAuthError(null);
    if (!isSupabaseConfigured) {
      const err = new Error('Supabase belum dikonfigurasi. Atur VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.');
      setAuthError(err.message);
      throw err;
    }

    try {
      const { data, error } = await supabase.functions.invoke('login-with-username', {
        body: { username: username.trim(), password },
      });
      if (error) throw new Error('Tidak dapat menghubungi layanan login username. Pastikan Edge Function sudah di-deploy dan konfigurasi Supabase benar.');
      if (data?.error) throw new Error(data.error);
      if (!data?.access_token || !data?.refresh_token) {
        throw new Error('Username atau password salah. Silakan coba lagi.');
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (sessionError) throw sessionError;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login gagal. Silakan coba lagi.';
      setAuthError(message);
      throw error;
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
    const newJob = toJob({
      ...data,
      id: `j-${Date.now()}`,
    });
    setJobs(prev => [newJob, ...prev]);
  };

  const updateJobStatus = (jobId: string, status: JobStatus) => {
    const currentStatusByJobStatus: Record<JobStatus, AssignedJob['currentStatus']> = {
      draft: 'Quotation',
      booking_confirmed: 'Documentation',
      in_transit: 'Exim',
      customs_clearance: 'Customs Process',
      delivered: 'Completed',
    };
    setJobs((prev) => prev.map((job) => (
      job.id === jobId
        ? { ...job, status, currentStatus: currentStatusByJobStatus[status] }
        : job
    )));
  };

  const addDocument = (data: Omit<JobDocument, 'id' | 'uploadedAt'>) => {
    const newDocument: JobDocument = {
      ...data,
      id: `doc-${Date.now()}`,
      uploadedAt: new Date().toLocaleDateString('id-ID'),
    };
    setDocuments((prev) => [newDocument, ...prev]);
  };

  const updateDocumentStatus: AuthContextType['updateDocumentStatus'] = (documentId, status) => {
    if (!documents.some((document) => document.id === documentId)) {
      throw new Error('Dokumen tidak ditemukan.');
    }
    setDocuments((prev) => prev.map((document) => (
      document.id === documentId ? { ...document, status } : document
    )));
  };

  const addQuotation: AuthContextType['addQuotation'] = (data) => {
    const newQuotation: Quotation = {
      ...data,
      id: `quo-${Date.now()}`,
      estimatedMargin: data.totalSellingEst - data.totalCostEst,
      customerType: data.customerType || 'regular',
      workflowStage: data.workflowStage || 'customer_review',
      revisionNumber: data.revisionNumber || 0,
    };
    setQuotations((prev) => [newQuotation, ...prev]);
  };

  const updateQuotationStage = (quotationId: string, workflowStage: QuotationWorkflowStage, status: Quotation['status']) => {
    if (!quotations.some((quotation) => quotation.id === quotationId)) {
      throw new Error('Quotation tidak ditemukan.');
    }
    setQuotations((prev) => prev.map((quotation) => (
      quotation.id === quotationId ? { ...quotation, workflowStage, status } : quotation
    )));
  };

  const recordCustomerApproval = (quotationId: string) => {
    const quotation = quotations.find((item) => item.id === quotationId);
    if (!quotation || quotation.workflowStage !== 'customer_review') {
      throw new Error('Quotation tidak tersedia untuk persetujuan pelanggan.');
    }
    const customer = customers.find((item) => item.id === quotation.customerId);
    const requiresLegalCheck = quotation.customerType === 'incidental' && !customer?.npwpVerified;

    updateQuotationStage(
      quotationId,
      requiresLegalCheck ? 'legality_check' : 'ready_for_support',
      'Approved',
    );
  };

  const requestQuotationRevision = (quotationId: string) => {
    const quotation = quotations.find((item) => item.id === quotationId);
    if (!quotation || quotation.workflowStage !== 'customer_review') {
      throw new Error('Quotation tidak tersedia untuk permintaan revisi.');
    }
    updateQuotationStage(quotationId, 'revision_requested', 'revision_requested');
  };

  const reviseQuotation = (
    quotationId: string,
    revision: Pick<Quotation, 'serviceType' | 'cargoDescription' | 'totalSellingEst' | 'totalCostEst' | 'validUntil'>,
  ) => {
    const quotation = quotations.find((item) => item.id === quotationId);
    if (!quotation || quotation.workflowStage !== 'revision_requested') {
      throw new Error('Quotation tidak berada dalam tahap revisi.');
    }
    setQuotations((prev) => prev.map((item) => item.id === quotationId
      ? {
          ...item,
          ...revision,
          estimatedMargin: revision.totalSellingEst - revision.totalCostEst,
          subtotal: revision.totalSellingEst,
          taxAmount: 0,
          lineItems: [{
            description: `${revision.serviceType}${revision.cargoDescription ? ` · ${revision.cargoDescription}` : ''}`,
            quantity: 1,
            unitPrice: revision.totalSellingEst,
            taxRate: 0,
          }],
          revisionNumber: item.revisionNumber + 1,
          workflowStage: 'customer_review',
          status: 'sent',
        }
      : item));
  };

  const updateCustomerLegalStatus = (customerId: string, verified: boolean) => {
    if (!customers.some((customer) => customer.id === customerId)) {
      throw new Error('Customer tidak ditemukan.');
    }

    setCustomers((prev) => prev.map((customer) => customer.id === customerId
      ? { ...customer, npwpVerified: verified }
      : customer));

    if (verified) {
      const legalCheckQuotes = quotations.filter((quotation) =>
        quotation.customerId === customerId && quotation.workflowStage === 'legality_check',
      );
      setQuotations((prev) => prev.map((quotation) => (
        quotation.customerId === customerId && quotation.workflowStage === 'legality_check'
          ? { ...quotation, workflowStage: 'ready_for_support', status: 'Approved' }
          : quotation
      )));
      if (legalCheckQuotes.length > 0) {
        console.info(`Customer legalitas verified; ${legalCheckQuotes.length} quotation moved to Sales Support.`);
      }
    }
  };

  const createJobFromQuotation = (quotationId: string) => {
    const quotation = quotations.find((item) => item.id === quotationId);
    if (!quotation || quotation.workflowStage !== 'ready_for_support') {
      throw new Error('Quotation belum siap diterima Sales Support.');
    }
    const customer = customers.find((item) => item.id === quotation.customerId);
    if (quotation.customerType === 'incidental' && !customer?.npwpVerified) {
      throw new Error('Legalitas customer insidental belum terverifikasi di Master Customer.');
    }

    const sequence = jobs.filter((job) => job.workflowStage !== 'legacy').length + 1;
    const jobNumber = `HPL-${new Date().getFullYear()}-${String(sequence).padStart(4, '0')}`;
    const job = toJob({
      id: `j-${Date.now()}`,
      jobNumber,
      customer: quotation.customerName,
      customerId: quotation.customerId,
      shipmentType: 'Export',
      mode: quotation.serviceType,
      date: new Date().toLocaleDateString('id-ID'),
      currentStatus: 'Exim',
      quotationStatus: 'Approved',
      assignedPic: 'Sales Support',
    });

    setJobs((prev) => [{
      ...job,
      quotationId: quotation.id,
      workflowStage: 'exim_work',
      sellingPrice: quotation.totalSellingEst,
      costingTotal: quotation.totalCostEst,
      margin: quotation.estimatedMargin,
    }, ...prev]);
    updateQuotationStage(quotationId, 'job_created', 'Approved');
  };

  const completeEximWork = (jobId: string, incoterm: string, documentsComplete: boolean) => {
    const job = jobs.find((item) => item.id === jobId);
    if (!job || job.workflowStage !== 'exim_work') {
      throw new Error('Job tidak tersedia untuk diselesaikan oleh Exim.');
    }
    if (!incoterm.trim()) throw new Error('Incoterm wajib diisi sebelum job diselesaikan.');
    if (!documentsComplete) throw new Error('Dokumen pengiriman harus lengkap sebelum job diselesaikan.');

    setJobs((prev) => prev.map((item) => item.id === jobId
      ? {
          ...item,
          incoterm: incoterm.trim(),
          documentsComplete,
          workflowStage: 'needs_extra_cost_decision',
          currentStatus: 'Completed',
          status: 'delivered',
        }
      : item));
  };

  const decideAdditionalCost = (jobId: string, hasAdditionalCost: boolean) => {
    const currentStage: JobWorkflowStage = hasAdditionalCost ? 'support_extra_cost' : 'ready_for_invoice';
    const job = jobs.find((item) => item.id === jobId);
    if (!job || job.workflowStage !== 'needs_extra_cost_decision') {
      throw new Error('Job belum menunggu keputusan biaya tambahan.');
    }
    setJobs((prev) => prev.map((item) => item.id === jobId
      ? { ...item, workflowStage: currentStage }
      : item));
  };

  const saveAdditionalCost = (jobId: string, amount: number) => {
    const job = jobs.find((item) => item.id === jobId);
    if (!job || job.workflowStage !== 'support_extra_cost') {
      throw new Error('Job tidak menunggu input biaya tambahan.');
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Biaya tambahan harus lebih besar dari nol.');
    }
    setJobs((prev) => prev.map((item) => item.id === jobId
      ? { ...item, additionalCost: amount, workflowStage: 'ready_for_invoice' }
      : item));
  };

  const createInvoiceForJob = (jobId: string) => {
    const job = jobs.find((item) => item.id === jobId);
    if (!job || job.workflowStage !== 'ready_for_invoice') {
      throw new Error('Job belum siap dibuatkan invoice.');
    }
    if (invoices.some((invoice) => invoice.jobId === jobId)) {
      throw new Error('Invoice untuk job ini sudah dibuat.');
    }

    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 30);
    const totalSelling = job.sellingPrice + job.additionalCost;
    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      jobId,
      invoiceNo: `INV-HPL-${today.getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`,
      jobNo: job.jobNo,
      customerName: job.customerName,
      totalSelling,
      totalPaid: 0,
      outstandingBalance: totalSelling,
      issueDate: today.toLocaleDateString('id-ID'),
      dueDate: dueDate.toLocaleDateString('id-ID'),
      subtotal: totalSelling,
      taxAmount: 0,
      status: 'unpaid',
      deliveryStatus: 'draft',
      paymentMethod: customers.find((customer) => customer.id === job.customerId)?.creditTerms.toLowerCase().includes('cod')
        ? 'COD'
        : 'Kredit',
    };

    setInvoices((prev) => [invoice, ...prev]);
    setJobs((prev) => prev.map((item) => item.id === jobId
      ? { ...item, workflowStage: 'invoiced' }
      : item));
  };

  const sendInvoiceToCustomer = (invoiceId: string) => {
    const invoice = invoices.find((item) => item.id === invoiceId);
    if (!invoice || invoice.deliveryStatus !== 'draft') {
      throw new Error('Invoice tidak ditemukan atau sudah dikirim.');
    }
    setInvoices((prev) => prev.map((item) => item.id === invoiceId
      ? { ...item, deliveryStatus: 'sent' }
      : item));
  };

  const createPnlReport = () => {
    const completedJobs = jobs.filter((job) => job.workflowStage === 'invoiced');
    const totalRevenue = completedJobs.reduce((total, job) => {
      const debitNoteRevenue = debitNotes
        .filter((note) => note.jobNumber === job.jobNo)
        .reduce((jobTotal, note) => jobTotal + note.amount, 0);
      return total + job.sellingPrice + job.additionalCost + debitNoteRevenue;
    }, 0);
    const totalCost = completedJobs.reduce((total, job) => {
      const actualVendorCost = vendorBills
        .filter((bill) => bill.jobNumber === job.jobNo)
        .reduce((jobTotal, bill) => jobTotal + bill.amount, 0);
      return total + (actualVendorCost || job.costingTotal);
    }, 0);

    setPnlReports((prev) => [{
      id: `pnl-${Date.now()}`,
      createdAt: new Date().toLocaleString('id-ID'),
      jobCount: completedJobs.length,
      totalRevenue,
      totalCost,
      margin: totalRevenue - totalCost,
    }, ...prev]);
  };

  const addVendor = (data: Omit<Vendor, 'id'>) => {
    if (!data.name.trim()) throw new Error('Nama vendor wajib diisi.');
    setVendors((prev) => [{ ...data, id: `vendor-${Date.now()}` }, ...prev]);
  };

  const addVendorBill = (data: Omit<VendorBill, 'id' | 'reconciled'>) => {
    if (!Number.isFinite(data.amount) || data.amount <= 0) throw new Error('Nilai invoice vendor harus lebih dari nol.');
    setVendorBills((prev) => [{ ...data, id: `vendor-bill-${Date.now()}`, reconciled: false }, ...prev]);
  };

  const reconcileVendorBill = (billId: string) => {
    const bill = vendorBills.find((item) => item.id === billId);
    if (!bill) throw new Error('Invoice vendor tidak ditemukan.');
    setVendorBills((prev) => prev.map((item) => item.id === billId ? { ...item, reconciled: true } : item));
  };

  const addFieldTask = (data: Omit<FieldTask, 'id' | 'completed'>) => {
    if (!jobs.some((job) => job.id === data.jobId)) throw new Error('Pilih job yang valid.');
    setFieldTasks((prev) => [{ ...data, id: `task-${Date.now()}`, completed: false }, ...prev]);
  };

  const completeFieldTask = (taskId: string) => {
    setFieldTasks((prev) => prev.map((task) => task.id === taskId ? { ...task, completed: true } : task));
  };

  const addProcurementRequest = (description: string, amount: number) => {
    if (!description.trim() || !Number.isFinite(amount) || amount <= 0) {
      throw new Error('Isi kebutuhan dan nominal pengadaan dengan benar.');
    }
    setProcurementRequests((prev) => [{
      id: `proc-${Date.now()}`,
      description: description.trim(),
      amount,
      status: 'Diajukan',
      createdAt: new Date().toLocaleString('id-ID'),
    }, ...prev]);
  };

  const addPettyCashEntry = (description: string, amount: number) => {
    if (!description.trim() || !Number.isFinite(amount) || amount <= 0) {
      throw new Error('Isi deskripsi dan nominal petty cash dengan benar.');
    }
    setPettyCashEntries((prev) => [{
      id: `cash-${Date.now()}`,
      description: description.trim(),
      amount,
      createdAt: new Date().toLocaleString('id-ID'),
    }, ...prev]);
  };

  const addDebitNote = (jobId: string, amount: number, reason: string) => {
    const job = jobs.find((item) => item.id === jobId);
    const invoice = invoices.find((item) => item.jobId === jobId);
    if (!job || job.workflowStage !== 'invoiced' || !invoice) {
      throw new Error('Debit note hanya dapat dibuat untuk job yang sudah memiliki invoice.');
    }
    if (!Number.isFinite(amount) || amount <= 0 || !reason.trim()) throw new Error('Isi alasan dan nominal debit note.');
    setDebitNotes((prev) => [{
      id: `debit-${Date.now()}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNo,
      jobNumber: job.jobNo,
      customerName: job.customerName,
      amount,
      reason: reason.trim(),
      createdAt: new Date().toLocaleString('id-ID'),
    }, ...prev]);
    setInvoices((prev) => prev.map((item) => item.id === invoice.id
      ? {
          ...item,
          totalSelling: item.totalSelling + amount,
          subtotal: item.subtotal + amount,
          outstandingBalance: item.outstandingBalance + amount,
          status: item.totalPaid > 0 ? 'partial' : 'unpaid',
        }
      : item));
  };

  const updateInvoiceStatus = (invoiceId: string, amountPaid: number, paymentMethod: PaymentMethod) => {
    const invoice = invoices.find((item) => item.id === invoiceId);
    if (!invoice) throw new Error('Invoice tidak ditemukan.');
    if (!Number.isFinite(amountPaid) || amountPaid <= 0 || amountPaid > invoice.outstandingBalance) {
      throw new Error('Nominal pembayaran harus lebih dari nol dan tidak boleh melebihi saldo invoice.');
    }
    if (paymentMethod === 'COD' && amountPaid !== invoice.outstandingBalance) {
      throw new Error('Pembayaran COD harus melunasi seluruh saldo invoice.');
    }
    setInvoices((prev) => prev.map((invoice) => {
      if (invoice.id !== invoiceId) return invoice;

      const totalPaid = invoice.totalPaid + amountPaid;
      const outstandingBalance = invoice.totalSelling - totalPaid;

      return {
        ...invoice,
        totalPaid,
        outstandingBalance,
        paymentMethod,
        status: outstandingBalance === 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid',
      };
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        loading: loading || workflowLoading,
        authError,
        login,
        logout,
        customers,
        jobs,
        documents,
        invoices,
        quotations,
        pnlReports,
        vendors,
        vendorBills,
        fieldTasks,
        procurementRequests,
        pettyCashEntries,
        debitNotes,
        selectedCustomerId,
        setSelectedCustomerId,
        addCustomer,
        addJob,
        updateJobStatus,
        addDocument,
        updateDocumentStatus,
        addQuotation,
        updateInvoiceStatus,
        recordCustomerApproval,
        requestQuotationRevision,
        reviseQuotation,
        updateCustomerLegalStatus,
        createJobFromQuotation,
        completeEximWork,
        decideAdditionalCost,
        saveAdditionalCost,
        createInvoiceForJob,
        sendInvoiceToCustomer,
        createPnlReport,
        addVendor,
        addVendorBill,
        reconcileVendorBill,
        addFieldTask,
        completeFieldTask,
        addProcurementRequest,
        addPettyCashEntry,
        addDebitNote,
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