import React, { useMemo, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { roleNavItems } from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import { CustomerAccount, Job, JobDocumentType, JobWorkflowStage, PaymentMethod, Quotation, QuotationLineItem } from '../types';
import { ArrowUpRight, BriefcaseBusiness, Clock3, FileText, Printer, Search, Users } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { printDocument, printJobOrder, printQuotationDocument } from '../lib/printDocument';
import { CustomerLegalDocuments } from '../components/shared/CustomerLegalDocuments';
import type { WorkspaceNotification, WorkspaceSearchResult } from '../components/layout/Navbar';

const currency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

const roleTitles = {
  sales_marketing: 'Sales & Marketing',
  sales_support: 'Sales Support',
  exim: 'Exim',
  admin_invoice: 'Admin Invoice + Pengadaan',
  accounting: 'Accounting',
} as const;

const quotationStageLabels: Record<Quotation['workflowStage'], string> = {
  customer_review: 'Menunggu keputusan customer',
  revision_requested: 'Menunggu revisi quotation',
  legality_check: 'Perlu cek legalitas PT',
  ready_for_support: 'Siap diterima Sales Support',
  job_created: 'Job number sudah diterbitkan',
};

const jobStageLabels: Record<JobWorkflowStage, string> = {
  legacy: 'Job lama / belum dipetakan',
  exim_work: 'Sedang dikerjakan Exim',
  needs_extra_cost_decision: 'Menunggu keputusan biaya',
  support_extra_cost: 'Input biaya tambahan',
  ready_for_invoice: 'Selesai · menunggu invoice',
  invoiced: 'Invoice telah dibuat',
};

const jobNextStep = (job: Job, outstandingBalance: number | undefined) => {
  switch (job.workflowStage) {
    case 'legacy':
      return 'Lengkapi detail dan status job';
    case 'exim_work':
      return 'Exim melengkapi dokumen dan Incoterm';
    case 'needs_extra_cost_decision':
      return 'Sales Support konfirmasi biaya tambahan';
    case 'support_extra_cost':
      return 'Sales Support input nominal biaya tambahan';
    case 'ready_for_invoice':
      return 'Admin Invoice membuat invoice';
    case 'invoiced':
      return outstandingBalance && outstandingBalance > 0
        ? 'Pantau pembayaran invoice'
        : 'Accounting rekonsiliasi biaya dan laporan margin';
  }
};

const Panel: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({
  title,
  subtitle,
  children,
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
    {children}
  </section>
);

const EmptyState: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500">
    {children}
  </p>
);

const CustomerOption: React.FC<{ customer: CustomerAccount }> = ({ customer }) => (
  <option value={customer.id}>{customer.companyName}</option>
);

export const WorkflowWorkspace: React.FC = () => {
  const {
    user,
    role: userRole,
    authError,
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
    addQuotation,
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
    addCustomer,
    addVendor,
    addVendorBill,
    reconcileVendorBill,
    addFieldTask,
    completeFieldTask,
    addProcurementRequest,
    addPettyCashEntry,
    addDebitNote,
    addDocument,
    updateDocumentStatus,
    updateInvoiceStatus,
  } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [actionError, setActionError] = useState('');
  const [formError, setFormError] = useState('');
  const [jobHistorySearch, setJobHistorySearch] = useState('');
  const [jobHistoryStage, setJobHistoryStage] = useState<JobWorkflowStage | 'all'>('all');
  const [expandedCustomerDocuments, setExpandedCustomerDocuments] = useState<Set<string>>(new Set());
  const [globalSearch, setGlobalSearch] = useState('');
  const [salesJobFilter, setSalesJobFilter] = useState<'all' | 'sea' | 'air'>('all');
  const [salesJobSearch, setSalesJobSearch] = useState('');
  const [revisionId, setRevisionId] = useState<string | null>(null);
  const [revision, setRevision] = useState({
    serviceType: '',
    cargoDescription: '',
    totalSellingEst: 0,
    totalCostEst: 0,
    validUntil: '',
  });
  const [incoterms, setIncoterms] = useState<Record<string, string>>({});
  const [documentsConfirmed, setDocumentsConfirmed] = useState<Record<string, boolean>>({});
  const [extraCosts, setExtraCosts] = useState<Record<string, number>>({});
  const [documentForms, setDocumentForms] = useState<Record<string, { name: string; type: JobDocumentType }>>({});
  const [documentFiles, setDocumentFiles] = useState<Record<string, File>>({});
  const [documentUploading, setDocumentUploading] = useState<Record<string, boolean>>({});
  const [vendorForm, setVendorForm] = useState({ name: '', type: '', contact: '' });
  const [vendorBillForm, setVendorBillForm] = useState({ vendorId: '', jobId: '', invoiceNumber: '', amount: 0 });
  const [fieldTaskForm, setFieldTaskForm] = useState({ jobId: '', description: '' });
  const [prospectForm, setProspectForm] = useState({ companyName: '', contactPerson: '', email: '', phone: '' });
  const [procurementForm, setProcurementForm] = useState({ description: '', amount: 0 });
  const [cashForm, setCashForm] = useState({ description: '', amount: 0 });
  const [paymentForms, setPaymentForms] = useState<Record<string, number>>({});
  const [paymentMethodForms, setPaymentMethodForms] = useState<Record<string, PaymentMethod>>({});
  const [debitNoteForm, setDebitNoteForm] = useState({ jobId: '', amount: 0, reason: '' });
  const [quotationForm, setQuotationForm] = useState({
    customerId: customers[0]?.id || '',
    customerType: 'regular' as 'regular' | 'incidental',
    serviceType: '',
    cargoDescription: '',
    origin: '',
    destination: '',
    totalCostEst: 0,
    validUntil: '',
    paymentTerms: customers[0]?.creditTerms || '',
    notes: '',
    lineItems: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0 }] as QuotationLineItem[],
  });

  const role = userRole;
  const workspaceNotifications = useMemo<WorkspaceNotification[]>(() => {
    const items: WorkspaceNotification[] = [];
    const push = (id: string, title: string, message: string, tab: string) => {
      items.push({ id, title, message, tab });
    };

    if (role === 'sales_marketing') {
      quotations.filter((item) => item.workflowStage === 'customer_review'
        || item.workflowStage === 'revision_requested'
        || item.workflowStage === 'legality_check').forEach((item) => {
        push(`quotation-${item.id}-${item.workflowStage}`, 'Quotation perlu ditindaklanjuti', `${item.quotationNo} · ${item.customerName} · ${quotationStageLabels[item.workflowStage]}`, 'quotations');
      });
      customers.filter((item) => !item.npwpVerified).forEach((item) => {
        push(`customer-legal-${item.id}`, 'Legalitas customer belum lengkap', `${item.companyName} perlu pemeriksaan dokumen legalitas.`, 'customers');
      });
    }

    if (role === 'sales_support') {
      quotations.filter((item) => item.workflowStage === 'ready_for_support').forEach((item) => {
        push(`quotation-${item.id}-ready_for_support`, 'Quotation siap diproses', `${item.quotationNo} · ${item.customerName} siap dibuatkan Job Order.`, 'job-orders');
      });
      jobs.filter((item) => item.workflowStage === 'needs_extra_cost_decision'
        || item.workflowStage === 'support_extra_cost').forEach((item) => {
        push(`job-${item.id}-${item.workflowStage}`, 'Job perlu tindak lanjut Support', `${item.jobNo} · ${item.customerName} · ${jobStageLabels[item.workflowStage]}`, 'extra-costs');
      });
    }

    if (role === 'exim') {
      jobs.filter((item) => item.workflowStage === 'exim_work').forEach((item) => {
        push(`job-${item.id}-exim_work`, 'Dokumen job perlu dilengkapi', `${item.jobNo} · ${item.customerName} menunggu dokumen dan Incoterm.`, 'customs-documents');
      });
      documents.filter((item) => item.status === 'Rejected').forEach((item) => {
        push(`document-${item.id}-Rejected`, 'Dokumen perlu diperbaiki', `${item.jobNo} · ${item.documentName} ditolak. Perbaiki dan unggah ulang dari laptop/PC.`, 'customs-documents');
      });
    }

    if (role === 'admin_invoice') {
      jobs.filter((item) => item.workflowStage === 'ready_for_invoice').forEach((item) => {
        push(`job-${item.id}-ready_for_invoice`, 'Job siap dibuatkan invoice', `${item.jobNo} · ${item.customerName} menunggu invoice.`, 'billing');
      });
    }

    if (role === 'accounting' || role === 'admin_invoice') {
      invoices.filter((item) => item.outstandingBalance > 0
        && (item.status === 'unpaid' || item.status === 'partial' || item.status === 'overdue')).forEach((item) => {
        push(`invoice-${item.id}-${item.status}`, 'Invoice belum lunas', `${item.invoiceNo} · ${item.customerName} · Sisa ${currency(item.outstandingBalance)}.`, role === 'admin_invoice' ? 'payments' : 'pnl-data');
      });
    }

    if (role === 'sales_support') {
      documents.filter((item) => item.status === 'Pending').forEach((item) => {
        push(
          `document-${item.id}-Pending`,
          'Dokumen menunggu verifikasi',
          `${item.jobNo} · ${item.documentName} perlu diperiksa oleh Sales Support.`,
          'job-orders',
        );
      });
    }
    return items;
  }, [customers, documents, invoices, jobs, quotations, role]);

  const globalSearchResults = useMemo<WorkspaceSearchResult[]>(() => {
    const term = globalSearch.trim().toLowerCase();
    if (!term) return [];
    const results: WorkspaceSearchResult[] = [];
    jobs.forEach((job) => {
      if ([job.jobNo, job.customerName, job.blNumber || '', job.serviceType, job.origin, job.destination]
        .some((value) => value.toLowerCase().includes(term))) {
        results.push({ id: `job-${job.id}`, label: job.jobNo, detail: `${job.customerName} · ${job.serviceType} · ${job.blNumber || 'No. BL/AWB belum ada'}`, tab: 'job-history' });
      }
    });
    if (role === 'sales_marketing') {
      quotations.forEach((item) => {
        if ([item.quotationNo, item.customerName, item.serviceType].some((value) => value.toLowerCase().includes(term))) {
          results.push({ id: `quotation-${item.id}`, label: item.quotationNo, detail: `${item.customerName} · ${item.serviceType}`, tab: 'quotations' });
        }
      });
    }
    if (role === 'sales_marketing' || role === 'sales_support') {
      customers.forEach((item) => {
        if ([item.companyName, item.accountCode, item.contactPerson, item.email].some((value) => value.toLowerCase().includes(term))) {
          results.push({ id: `customer-${item.id}`, label: item.companyName, detail: `${item.accountCode} · ${item.contactPerson}`, tab: 'customers' });
        }
      });
    }
    return results.slice(0, 10);
  }, [customers, globalSearch, jobs, quotations, role]);
  if (!role) return null;

  const roleTitle = roleTitles[role];
  const activeLabel = roleNavItems[role].find((item) => item.id === activeTab)?.label || roleTitle;

  const runAction = (action: () => void): boolean => {
    setActionError('');
    setFormError('');
    try {
      action();
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Proses gagal. Silakan coba lagi.');
      return false;
    }
  };

  const handleCreateQuotation = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    const customer = customers.find((item) => item.id === quotationForm.customerId);
    if (!customer) {
      setFormError('Pilih customer sebelum membuat quotation.');
      return;
    }
    const invalidLine = quotationForm.lineItems.some((item) =>
      !item.description.trim() || item.quantity <= 0 || item.unitPrice < 0 || item.taxRate < 0 || item.taxRate > 100,
    );
    const subtotal = quotationForm.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = quotationForm.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice * item.taxRate / 100, 0);
    const totalSellingEst = subtotal + taxAmount;
    if (invalidLine) {
      setFormError('Lengkapi deskripsi dan pastikan qty, harga, serta tarif pajak pada setiap baris valid.');
      return;
    }
    if (totalSellingEst <= 0 || quotationForm.totalCostEst < 0) {
      setFormError('Total penawaran harus lebih dari nol dan estimasi biaya tidak boleh negatif.');
      return;
    }

    const saved = runAction(() => addQuotation({
      quotationNo: `QUO-HPL-${new Date().getFullYear()}-${String(quotations.length + 1).padStart(4, '0')}`,
      customerId: customer.id,
      customerName: customer.companyName,
      customerType: quotationForm.customerType,
      origin: quotationForm.origin,
      destination: quotationForm.destination,
      serviceType: quotationForm.serviceType,
      cargoDescription: quotationForm.cargoDescription,
      totalSellingEst,
      totalCostEst: Number(quotationForm.totalCostEst),
      issuedAt: new Date().toLocaleDateString('id-ID'),
      paymentTerms: quotationForm.paymentTerms,
      notes: quotationForm.notes,
      subtotal,
      taxAmount,
      lineItems: quotationForm.lineItems.map((item) => ({ ...item, description: item.description.trim() })),
      status: quotationForm.customerType === 'regular' ? 'Approved' : 'sent',
      validUntil: quotationForm.validUntil,
      workflowStage: quotationForm.customerType === 'regular' ? 'ready_for_support' : 'customer_review',
    }));
    if (saved) setQuotationForm((current) => ({
      ...current,
      serviceType: '',
      cargoDescription: '',
      totalCostEst: 0,
      notes: '',
      lineItems: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0 }],
    }));
  };

  const startRevision = (quotation: Quotation) => {
    setRevisionId(quotation.id);
    setRevision({
      serviceType: quotation.serviceType,
      cargoDescription: quotation.cargoDescription,
      totalSellingEst: quotation.totalSellingEst,
      totalCostEst: quotation.totalCostEst,
      validUntil: quotation.validUntil,
    });
  };

  const handleRevision = (event: React.FormEvent, quotationId: string) => {
    event.preventDefault();
    if (runAction(() => reviseQuotation(quotationId, revision))) setRevisionId(null);
  };

  const handleCreateProspect = (event: React.FormEvent) => {
    event.preventDefault();
    const companyName = prospectForm.companyName.trim();
    if (!companyName || !prospectForm.email.trim() || !prospectForm.phone.trim()) {
      setFormError('Nama perusahaan, email, dan nomor telepon wajib diisi.');
      return;
    }
    const saved = runAction(() => addCustomer({
      companyName,
      accountCode: `#PROSPECT-${String(customers.length + 1).padStart(4, '0')}`,
      category: 'Prospek',
      contactPerson: prospectForm.contactPerson.trim() || 'Belum diisi',
      roleTitle: 'PIC',
      phone: prospectForm.phone.trim(),
      email: prospectForm.email.trim(),
      address: 'Belum diisi',
      npwpVerified: false,
      totalTeu: 0,
      airWeightKg: 0,
      creditTerms: 'Belum ditentukan',
      creditStatus: 'Prospek',
      industry: 'Belum ditentukan',
      status: 'Inactive',
      region: 'Belum ditentukan',
    }));
    if (saved) {
      setProspectForm({ companyName: '', contactPerson: '', email: '', phone: '' });
      setFormError('');
    }
  };

  const handleAddVendor = (event: React.FormEvent) => {
    event.preventDefault();
    if (runAction(() => addVendor(vendorForm))) setVendorForm({ name: '', type: '', contact: '' });
  };

  const handleAddVendorBill = (event: React.FormEvent) => {
    event.preventDefault();
    const vendor = vendors.find((item) => item.id === vendorBillForm.vendorId);
    const job = jobs.find((item) => item.id === vendorBillForm.jobId);
    if (!vendor || !job) {
      setFormError('Pilih vendor dan job untuk invoice vendor.');
      return;
    }
    if (runAction(() => addVendorBill({
      vendorId: vendor.id,
      vendorName: vendor.name,
      jobNumber: job.jobNo,
      invoiceNumber: vendorBillForm.invoiceNumber,
      amount: Number(vendorBillForm.amount),
    }))) {
      setVendorBillForm({ vendorId: '', jobId: '', invoiceNumber: '', amount: 0 });
    }
  };

  const handleAddFieldTask = (event: React.FormEvent) => {
    event.preventDefault();
    const job = jobs.find((item) => item.id === fieldTaskForm.jobId);
    if (!job) {
      setFormError('Pilih job untuk task lapangan.');
      return;
    }
    if (runAction(() => addFieldTask({
      jobId: job.id,
      jobNumber: job.jobNo,
      description: fieldTaskForm.description,
    }))) setFieldTaskForm({ jobId: '', description: '' });
  };

  const handleUploadDocument = async (event: React.FormEvent, jobId: string) => {
    event.preventDefault();
    const job = jobs.find((item) => item.id === jobId);
    const form = documentForms[jobId];
    const file = documentFiles[jobId];
    if (!job || !form?.name || !file) {
      setFormError('Pilih file dokumen sebelum mencatat upload.');
      return;
    }
    if (!isSupabaseConfigured) {
      setActionError('Supabase belum dikonfigurasi. File tidak dapat diunggah sebelum VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY diatur.');
      return;
    }
    if (!user?.id) {
      setActionError('Sesi pengguna tidak tersedia. Silakan login kembali sebelum upload.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setActionError('Ukuran file maksimal 20 MB.');
      return;
    }

    setActionError('');
    setDocumentUploading({ ...documentUploading, [jobId]: true });
    try {
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${user.id}/${job.jobNo}/${Date.now()}-${safeFileName}`;
      const fileExtension = safeFileName.split('.').pop()?.toLowerCase();
      const mimeTypeByExtension: Record<string, string> = {
        pdf: 'application/pdf',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };
      const contentType = file.type || mimeTypeByExtension[fileExtension || ''];
      if (!contentType || !Object.values(mimeTypeByExtension).includes(contentType)) {
        throw new Error('Format file harus PDF, JPG, PNG, DOC, atau DOCX.');
      }
      const { error } = await supabase.storage
        .from('job-documents')
        .upload(storagePath, file, { contentType, upsert: false });
      if (error) throw error;

      addDocument({
        jobId: job.id,
        jobNo: job.jobNo,
        documentName: form.name,
        docType: form.type,
        fileUrl: storagePath,
        status: 'Pending',
        uploadedBy: user?.fullName || 'Exim',
      });
      documents.filter((document) => document.jobId === job.id
        && document.docType === form.type
        && document.status === 'Rejected').forEach((document) => {
        updateDocumentStatus(document.id, 'Replaced');
      });
      setDocumentForms({ ...documentForms, [jobId]: { ...form, name: '' } });
      setDocumentFiles((current) => {
        const next = { ...current };
        delete next[jobId];
        return next;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kesalahan tidak diketahui.';
      setActionError(message.toLowerCase().includes('bucket not found')
        ? 'Bucket "job-documents" belum ditemukan di project Supabase ini. Jalankan supabase/migrations/20261106_enable_job_document_storage.sql di SQL Editor project yang sama dengan VITE_SUPABASE_URL, lalu coba upload lagi.'
        : `Upload dokumen gagal: ${message}`);
    } finally {
      setDocumentUploading((current) => ({ ...current, [jobId]: false }));
    }
  };

  const handleDownloadDocument = async (storagePath: string) => {
    setActionError('');
    try {
      const { data, error } = await supabase.storage.from('job-documents').createSignedUrl(storagePath, 60);
      if (error) throw error;
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    } catch (error) {
      setActionError(error instanceof Error ? `Dokumen tidak dapat dibuka: ${error.message}` : 'Dokumen tidak dapat dibuka.');
    }
  };

  const handlePayment = (event: React.FormEvent, invoiceId: string) => {
    event.preventDefault();
    const invoice = invoices.find((item) => item.id === invoiceId);
    if (!invoice) {
      setFormError('Invoice tidak ditemukan.');
      return;
    }
    const paymentMethod = paymentMethodForms[invoiceId] || invoice.paymentMethod || 'Kredit';
    const amount = paymentMethod === 'COD' ? invoice.outstandingBalance : paymentForms[invoiceId] || 0;
    if (runAction(() => updateInvoiceStatus(invoiceId, amount, paymentMethod))) {
      setPaymentForms({ ...paymentForms, [invoiceId]: 0 });
    }
  };

  const handleProcurement = (event: React.FormEvent) => {
    event.preventDefault();
    if (runAction(() => addProcurementRequest(procurementForm.description, procurementForm.amount))) {
      setProcurementForm({ description: '', amount: 0 });
    }
  };

  const handlePettyCash = (event: React.FormEvent) => {
    event.preventDefault();
    if (runAction(() => addPettyCashEntry(cashForm.description, cashForm.amount))) {
      setCashForm({ description: '', amount: 0 });
    }
  };

  const handleDebitNote = (event: React.FormEvent) => {
    event.preventDefault();
    if (runAction(() => addDebitNote(debitNoteForm.jobId, debitNoteForm.amount, debitNoteForm.reason))) {
      setDebitNoteForm({ jobId: '', amount: 0, reason: '' });
    }
  };

  const renderSales = () => {
    const selectedQuotationCustomer = customers.find((customer) => customer.id === quotationForm.customerId);
    const quotationSubtotal = quotationForm.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const quotationTax = quotationForm.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice * item.taxRate / 100, 0);
    const quotationTotal = quotationSubtotal + quotationTax;
    const quotationNoPreview = `QUO-HPL-${new Date().getFullYear()}-${String(quotations.length + 1).padStart(4, '0')}`;
    const issueDate = new Date().toLocaleDateString('id-ID');

    return (
    <div className="space-y-5">
      <Panel title="Buat quotation" subtitle="Quotation customer regular langsung ke Sales Support; quotation insidental dikirim ke customer untuk disetujui atau direvisi.">
        <form id="quotation-form" onSubmit={handleCreateQuotation} className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-5 border-b-4 border-orange-500 pb-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-black text-blue-800">PT Hopelmar International</p>
              <p className="mt-1 text-xs text-slate-500">Freight Forwarding &amp; Logistics</p>
            </div>
            <div className="min-w-[220px] flex-1 text-right">
              <h3 className="text-2xl font-black text-slate-800">Logistics Quote</h3>
              <p className="mt-2 text-xs text-slate-500">Quote Number: <strong className="text-slate-800">{quotationNoPreview}</strong></p>
              <p className="mt-1 text-xs text-slate-500">Issue Date: <strong className="text-slate-800">{issueDate}</strong></p>
              <label className="mt-1 flex items-center justify-end gap-2 text-xs text-slate-500">
                Valid Through
                <input required type="date" value={quotationForm.validUntil} onChange={(event) => setQuotationForm({ ...quotationForm, validUntil: event.target.value })} className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-800" />
              </label>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <p className="border-b border-slate-300 pb-2 text-xs font-bold uppercase text-slate-700">Receiver</p>
              <label className="block space-y-1 text-xs font-semibold text-slate-600">
                Customer
                <select required value={quotationForm.customerId} onChange={(event) => {
                  const customer = customers.find((item) => item.id === event.target.value);
                  setQuotationForm({ ...quotationForm, customerId: event.target.value, paymentTerms: customer?.creditTerms || '' });
                }} className="w-full rounded border border-slate-300 px-3 py-2 text-sm">
                  <option value="">Pilih customer</option>
                  {customers.map((customer) => <CustomerOption key={customer.id} customer={customer} />)}
                </select>
              </label>
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                <p className="font-bold text-slate-800">{selectedQuotationCustomer?.companyName || 'Nama customer'}</p>
                <p className="mt-1">{selectedQuotationCustomer?.address || 'Alamat customer belum tersedia'}</p>
                {selectedQuotationCustomer && <p className="mt-1">{selectedQuotationCustomer.email} · {selectedQuotationCustomer.phone}</p>}
              </div>
              <label className="block space-y-1 text-xs font-semibold text-slate-600">
                Tipe customer
                <select value={quotationForm.customerType} onChange={(event) => setQuotationForm({ ...quotationForm, customerType: event.target.value as 'regular' | 'incidental' })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm">
                  <option value="regular">Regular</option>
                  <option value="incidental">Insidental / customer baru</option>
                </select>
              </label>
            </div>
            <div className="space-y-3">
              <p className="border-b border-slate-300 pb-2 text-xs font-bold uppercase text-slate-700">Payment Conditions</p>
              <label className="block space-y-1 text-xs font-semibold text-slate-600">
                Syarat pembayaran
                <textarea rows={3} value={quotationForm.paymentTerms} onChange={(event) => setQuotationForm({ ...quotationForm, paymentTerms: event.target.value })} placeholder="Contoh: 30 hari setelah invoice" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-semibold text-slate-600">
                  Jenis layanan
                  <input required value={quotationForm.serviceType} onChange={(event) => setQuotationForm({ ...quotationForm, serviceType: event.target.value })} placeholder="Sea Freight, Air Freight..." className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="space-y-1 text-xs font-semibold text-slate-600">
                  Estimasi biaya internal (Rp)
                  <input required min="0" type="number" value={quotationForm.totalCostEst} onChange={(event) => setQuotationForm({ ...quotationForm, totalCostEst: Number(event.target.value) })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="space-y-1 text-xs font-semibold text-slate-600">
                  Asal
                  <input required value={quotationForm.origin} onChange={(event) => setQuotationForm({ ...quotationForm, origin: event.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="space-y-1 text-xs font-semibold text-slate-600">
                  Tujuan
                  <input required value={quotationForm.destination} onChange={(event) => setQuotationForm({ ...quotationForm, destination: event.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
                </label>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Rincian layanan</h4>
                <p className="text-[11px] text-slate-500">Pajak dihitung per baris berdasarkan persentase yang diisi; tarif awal 0%.</p>
              </div>
              <button type="button" onClick={() => setQuotationForm((current) => ({ ...current, lineItems: [...current.lineItems, { description: '', quantity: 1, unitPrice: 0, taxRate: 0 }] }))} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                + Tambah baris
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-orange-600 text-white">
                  <tr>
                    <th className="px-3 py-2.5 font-bold">Description</th>
                    <th className="w-24 px-3 py-2.5 font-bold">Qty</th>
                    <th className="w-40 px-3 py-2.5 font-bold">Unit Price (Rp)</th>
                    <th className="w-36 px-3 py-2.5 font-bold">Subtotal</th>
                    <th className="w-32 px-3 py-2.5 font-bold">Tax (%)</th>
                    <th className="w-36 px-3 py-2.5 font-bold">Tax (Rp)</th>
                    <th className="w-16 px-3 py-2.5" aria-label="Aksi"></th>
                  </tr>
                </thead>
                <tbody>
                  {quotationForm.lineItems.map((item, index) => {
                    const lineSubtotal = item.quantity * item.unitPrice;
                    return (
                      <tr key={index} className="border-t border-slate-200">
                        <td className="p-2"><input required value={item.description} onChange={(event) => setQuotationForm((current) => ({ ...current, lineItems: current.lineItems.map((line, lineIndex) => lineIndex === index ? { ...line, description: event.target.value } : line) }))} placeholder="Deskripsi layanan / barang" className="w-full rounded border border-slate-300 px-2 py-2" /></td>
                        <td className="p-2"><input required min="0.01" step="any" type="number" value={item.quantity} onChange={(event) => setQuotationForm((current) => ({ ...current, lineItems: current.lineItems.map((line, lineIndex) => lineIndex === index ? { ...line, quantity: Number(event.target.value) } : line) }))} className="w-full rounded border border-slate-300 px-2 py-2" /></td>
                        <td className="p-2"><input required min="0" step="any" type="number" value={item.unitPrice || ''} onChange={(event) => setQuotationForm((current) => ({ ...current, lineItems: current.lineItems.map((line, lineIndex) => lineIndex === index ? { ...line, unitPrice: Number(event.target.value) } : line) }))} className="w-full rounded border border-slate-300 px-2 py-2" /></td>
                        <td className="whitespace-nowrap px-3 py-2 font-semibold">{currency(lineSubtotal)}</td>
                        <td className="p-2"><div className="flex items-center gap-1"><input required min="0" max="100" step="any" type="number" value={item.taxRate} onChange={(event) => setQuotationForm((current) => ({ ...current, lineItems: current.lineItems.map((line, lineIndex) => lineIndex === index ? { ...line, taxRate: Number(event.target.value) } : line) }))} className="w-full rounded border border-slate-300 px-2 py-2" /><span>%</span></div></td>
                        <td className="whitespace-nowrap px-3 py-2">{currency(lineSubtotal * item.taxRate / 100)}</td>
                        <td className="p-2"><button type="button" disabled={quotationForm.lineItems.length === 1} onClick={() => setQuotationForm((current) => ({ ...current, lineItems: current.lineItems.filter((_, lineIndex) => lineIndex !== index) }))} aria-label={`Hapus baris ${index + 1}`} className="rounded px-2 py-1 font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">×</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <label className="mt-3 block max-w-xs space-y-1 text-xs font-semibold text-slate-600">
              Deskripsi barang / catatan pengiriman
              <textarea value={quotationForm.cargoDescription} onChange={(event) => setQuotationForm({ ...quotationForm, cargoDescription: event.target.value })} rows={2} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
            </label>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-slate-200 pt-4">
            <label className="min-w-[240px] flex-1 space-y-1 text-xs font-semibold text-slate-600">
              Notes
              <textarea rows={2} value={quotationForm.notes} onChange={(event) => setQuotationForm({ ...quotationForm, notes: event.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <div className="w-full max-w-sm space-y-2 text-xs">
              <div className="flex justify-between"><span>Subtotal</span><strong>{currency(quotationSubtotal)}</strong></div>
              <div className="flex justify-between"><span>Total pajak</span><strong>{currency(quotationTax)}</strong></div>
              <div className="flex justify-between border-t-2 border-orange-500 bg-orange-600 px-3 py-2 text-sm text-white"><span className="font-bold">Total</span><strong>{currency(quotationTotal)}</strong></div>
              <button type="submit" className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800">
                Buat &amp; kirim quotation
              </button>
            </div>
          </div>
        </form>
        {formError && <p role="alert" className="mt-3 text-xs text-red-700">{formError}</p>}
      </Panel>

      <Panel title="Quotations" subtitle="Catat persetujuan atau permintaan revisi dari customer.">
        <div className="space-y-3">
          {quotations.length === 0 && <EmptyState>Belum ada quotation.</EmptyState>}
          {quotations.map((quotation) => (
            <article key={quotation.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{quotation.quotationNo} · {quotation.customerName}</p>
                  <p className="mt-1 text-xs text-slate-500">{quotation.customerType === 'regular' ? 'Regular' : 'Insidental'} · {quotation.serviceType} · {quotation.origin} → {quotation.destination}</p>
                  <p className="mt-1 text-xs text-slate-600">{quotationStageLabels[quotation.workflowStage]} · Revisi {quotation.revisionNumber}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-700">{currency(quotation.totalSellingEst)} · Estimasi margin {currency(quotation.estimatedMargin)}</p>
                </div>
                <button
                  onClick={() => runAction(() => printQuotationDocument(
                    quotation,
                    customers.find((customer) => customer.id === quotation.customerId),
                  ))}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Printer className="h-3.5 w-3.5" /> Cetak / Simpan PDF
                </button>
                {quotation.workflowStage === 'customer_review' && (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => runAction(() => recordCustomerApproval(quotation.id))} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Customer setuju</button>
                    <button onClick={() => runAction(() => requestQuotationRevision(quotation.id))} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800">Minta revisi</button>
                  </div>
                )}
                {quotation.workflowStage === 'legality_check' && (
                  <button onClick={() => setActiveTab('customers')} className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-bold text-white">
                    Periksa status di Master Customer
                  </button>
                )}
                {quotation.workflowStage === 'revision_requested' && (
                  <button onClick={() => startRevision(quotation)} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white">Revisi & kirim ulang</button>
                )}
              </div>
              {revisionId === quotation.id && (
                <form onSubmit={(event) => handleRevision(event, quotation.id)} className="mt-4 grid gap-2 border-t border-slate-100 pt-4 md:grid-cols-2">
                  <input aria-label="Jenis layanan revisi" required value={revision.serviceType} onChange={(event) => setRevision({ ...revision, serviceType: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <input aria-label="Deskripsi barang revisi" required value={revision.cargoDescription} onChange={(event) => setRevision({ ...revision, cargoDescription: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <input aria-label="Harga penawaran revisi" required min="1" type="number" value={revision.totalSellingEst} onChange={(event) => setRevision({ ...revision, totalSellingEst: Number(event.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <input aria-label="Estimasi biaya revisi" required min="0" type="number" value={revision.totalCostEst} onChange={(event) => setRevision({ ...revision, totalCostEst: Number(event.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <input aria-label="Berlaku sampai revisi" required type="date" value={revision.validUntil} onChange={(event) => setRevision({ ...revision, validUntil: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <div className="flex gap-2">
                    <button type="submit" className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white">Simpan & kirim ulang</button>
                    <button type="button" onClick={() => setRevisionId(null)} className="rounded-lg border px-3 py-2 text-xs">Batal</button>
                  </div>
                </form>
              )}
            </article>
          ))}
        </div>
      </Panel>
      {renderReports()}
    </div>
    );
  };

  const renderSupport = (section: 'job-orders' | 'extra-costs' | 'all' = 'all') => {
    const readyQuotes = quotations.filter((quotation) => quotation.workflowStage === 'ready_for_support');
    const jobsAwaitingDecision = jobs.filter((job) => job.workflowStage === 'needs_extra_cost_decision');
    const jobsNeedingExtraCost = jobs.filter((job) => job.workflowStage === 'support_extra_cost');
    return (
      <div className="space-y-5">
        {(section === 'job-orders' || section === 'all') && <Panel title="Pemeriksaan dokumen job" subtitle="Sales Support dapat memeriksa dokumen unggahan Exim dan memberi tahu bila perlu diperbaiki.">
          <div className="space-y-2">
            {documents.length === 0 && <EmptyState>Belum ada dokumen job untuk diperiksa.</EmptyState>}
            {documents.map((document) => (
              <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 text-xs">
                <div>
                  <p className="font-bold text-slate-800">{document.jobNo} · {document.documentName}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{document.docType} · Status: {document.status} · Diunggah oleh {document.uploadedBy}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!document.fileUrl.startsWith('local://') && (
                    <button type="button" onClick={() => void handleDownloadDocument(document.fileUrl)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-50">
                      Buka dokumen
                    </button>
                  )}
                  {document.status === 'Pending' && (
                    <>
                      <button type="button" onClick={() => runAction(() => updateDocumentStatus(document.id, 'Verified'))} className="rounded-lg bg-emerald-700 px-2.5 py-1.5 font-bold text-white hover:bg-emerald-800">
                        Tandai sesuai
                      </button>
                      <button type="button" onClick={() => runAction(() => updateDocumentStatus(document.id, 'Rejected'))} className="rounded-lg bg-amber-600 px-2.5 py-1.5 font-bold text-white hover:bg-amber-700">
                        Minta perbaikan
                      </button>
                    </>
                  )}
                  {document.status === 'Rejected' && <span className="rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-800">Menunggu upload ulang Exim</span>}
                </div>
              </div>
            ))}
          </div>
        </Panel>}
        {(section === 'job-orders' || section === 'all') && <Panel title="Quotation final" subtitle="Terbitkan satu Job Number untuk quotation yang sudah disetujui dan lolos legalitas bila customer insidental.">
          <div className="space-y-3">
            {readyQuotes.length === 0 && <EmptyState>Tidak ada quotation yang menunggu Sales Support.</EmptyState>}
            {readyQuotes.map((quotation) => (
              <div key={quotation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                <div>
                  <p className="text-sm font-bold">{quotation.quotationNo} · {quotation.customerName}</p>
                  <p className="mt-1 text-xs text-slate-500">{quotation.serviceType} · {quotation.origin} → {quotation.destination}</p>
                  <p className="mt-1 text-xs">Biaya auto-fill: {currency(quotation.totalCostEst)} · Harga: {currency(quotation.totalSellingEst)}</p>
                </div>
                <button onClick={() => runAction(() => createJobFromQuotation(quotation.id))} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white">Terbitkan Job Number</button>
              </div>
            ))}
          </div>
        </Panel>}
        {(section === 'extra-costs' || section === 'all') && <Panel title="Konfirmasi biaya di luar penawaran">
          <div className="space-y-3">
            {jobsAwaitingDecision.length === 0 && jobsNeedingExtraCost.length === 0 && <EmptyState>Tidak ada job yang menunggu keputusan biaya tambahan.</EmptyState>}
            {jobsAwaitingDecision.map((job) => (
              <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                <div><p className="text-sm font-bold">{job.jobNo} · {job.customerName}</p><p className="text-xs text-slate-500">Exim menyelesaikan job dengan Incoterm {job.incoterm}.</p></div>
                <div className="flex gap-2">
                  <button onClick={() => runAction(() => decideAdditionalCost(job.id, false))} className="rounded-lg border px-3 py-2 text-xs font-bold">Tidak ada biaya tambahan</button>
                  <button onClick={() => runAction(() => decideAdditionalCost(job.id, true))} className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white">Ada biaya tambahan</button>
                </div>
              </div>
            ))}
            {jobsNeedingExtraCost.map((job) => (
              <form key={job.id} onSubmit={(event) => { event.preventDefault(); runAction(() => saveAdditionalCost(job.id, extraCosts[job.id] || 0)); }} className="flex flex-wrap items-end justify-between gap-3 rounded-xl border p-4">
                <div><p className="text-sm font-bold">{job.jobNo} · {job.customerName}</p><label className="mt-2 block text-xs font-semibold">Biaya tambahan (Rp)<input required min="1" type="number" value={extraCosts[job.id] || ''} onChange={(event) => setExtraCosts({ ...extraCosts, [job.id]: Number(event.target.value) })} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label></div>
                <button type="submit" className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white">Simpan biaya tambahan</button>
              </form>
            ))}
          </div>
        </Panel>}
      </div>
    );
  };

  const renderDashboard = () => {
    if (role === 'sales_marketing') {
      const activeJobs = jobs.filter((job) => job.currentStatus !== 'Completed' && job.workflowStage !== 'invoiced');
      const jobsInProgress = jobs.filter((job) => job.workflowStage !== 'legacy' && job.workflowStage !== 'invoiced');
      const pendingQuotations = quotations.filter((quotation) =>
        ['customer_review', 'revision_requested', 'legality_check'].includes(quotation.workflowStage),
      );
      const quotationPipeline = [
        {
          label: 'Draft',
          description: 'Estimasi internal & routing',
          count: quotations.filter((item) => ['Draft', 'draft'].includes(item.status)).length,
          tone: 'border-slate-200 bg-slate-50 text-slate-700',
        },
        {
          label: 'Menunggu konfirmasi',
          description: 'Dikirim ke customer',
          count: quotations.filter((item) => ['customer_review', 'revision_requested', 'legality_check'].includes(item.workflowStage)).length,
          tone: 'border-amber-200 bg-amber-50 text-amber-800',
        },
        {
          label: 'Approved',
          description: 'Siap menjadi Job Order',
          count: quotations.filter((item) => ['ready_for_support', 'job_created'].includes(item.workflowStage)).length,
          tone: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        },
      ];
      const filteredSalesJobs = jobs.filter((job) => {
        const matchesMode = salesJobFilter === 'all'
          || (salesJobFilter === 'sea' ? job.mode.toLowerCase().includes('sea') : job.mode.toLowerCase().includes('air'));
        const searchTerm = salesJobSearch.trim().toLowerCase();
        const matchesSearch = !searchTerm || [job.jobNo, job.customerName, job.serviceType, job.origin, job.destination]
          .some((value) => value.toLowerCase().includes(searchTerm));
        return matchesMode && matchesSearch;
      });
      const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
      const periodLabel = `Q${currentQuarter} ${new Date().getFullYear()} · berjalan`;

      const metricCards = [
        {
          label: 'Active Jobs',
          value: activeJobs.length,
          caption: 'Shipment yang belum selesai',
          detail: `${activeJobs.filter((job) => job.status === 'in_transit').length} in transit`,
          icon: BriefcaseBusiness,
          tone: 'bg-rose-50 text-rose-600',
        },
        {
          label: 'Pending Quotations',
          value: pendingQuotations.length,
          caption: 'Menunggu tindak lanjut',
          detail: `${quotations.filter((item) => item.workflowStage === 'customer_review').length} menunggu customer`,
          icon: FileText,
          tone: 'bg-orange-50 text-orange-600',
        },
        {
          label: 'Total Customers',
          value: customers.length,
          caption: 'Akun customer terdaftar',
          detail: `${customers.filter((customer) => customer.status === 'Active Client').length} akun aktif`,
          icon: Users,
          tone: 'bg-slate-100 text-slate-600',
        },
        {
          label: 'Jobs in Progress',
          value: jobsInProgress.length,
          caption: 'Job yang sudah masuk workflow',
          detail: `${jobs.filter((job) => job.workflowStage === 'exim_work').length} sedang ditangani Exim`,
          icon: Clock3,
          tone: 'bg-blue-50 text-blue-600',
        },
      ];

      return (
        <div className="space-y-5">
          <section className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Commercial workspace</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Sales Operations Overview</h2>
              <p className="mt-1 text-sm text-slate-500">
                Commercial pipeline & active consignments assigned to Sales PIC: <strong className="font-semibold text-slate-700">{user?.fullName || 'Tim Sales'}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
              <Clock3 className="h-4 w-4 text-slate-400" />
              Periode: {periodLabel}
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4" aria-label="Sales performance indicators">
            {metricCards.map((metric) => {
              const Icon = metric.icon;
              return (
                <article key={metric.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{metric.label}</p>
                    <span className={`rounded-lg p-2 ${metric.tone}`}><Icon className="h-4 w-4" /></span>
                  </div>
                  <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{metric.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{metric.caption}</p>
                  <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-600">{metric.detail}</p>
                </article>
              );
            })}
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
            <Panel title="Quotation Pipeline Status" subtitle={`Total: ${quotations.length}`}>
              <div className="space-y-2">
                {quotationPipeline.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setActiveTab('quotations')}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left ${item.tone}`}
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-bold uppercase">{item.label}</span>
                      <span className="mt-1 block text-[11px] opacity-80">{item.description}</span>
                    </span>
                    <span className="shrink-0 text-lg font-black">{item.count}<span className="ml-1 text-[10px] font-medium">items</span></span>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-500">Conversion Rate: <strong className="text-slate-800">{quotations.length ? `${((quotationPipeline[2].count / quotations.length) * 100).toFixed(1)}%` : '0%'}</strong></span>
                <button onClick={() => setActiveTab('quotations')} className="inline-flex items-center gap-1 font-bold text-red-700 hover:text-red-800">
                  Kelola Quotation <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </Panel>

            <Panel title="Customer & Quotation Follow-ups" subtitle="Daftar quotation yang memerlukan tindak lanjut dari Sales.">
              {pendingQuotations.length === 0 ? <EmptyState>Tidak ada quotation yang menunggu tindak lanjut.</EmptyState> : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {pendingQuotations.slice(0, 5).map((quotation) => (
                    <article key={quotation.id} className="flex min-h-36 flex-col justify-between rounded-lg border border-slate-200 p-3">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Quotation #{quotation.quotationNo}</p>
                          <span className="rounded bg-amber-100 px-2 py-1 text-[9px] font-bold text-amber-800">Tindak lanjut</span>
                        </div>
                        <p className="mt-2 text-xs font-bold text-slate-900">{quotation.customerName}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                          {quotationStageLabels[quotation.workflowStage]} · {quotation.serviceType}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">Rute: {quotation.origin} → {quotation.destination}</p>
                      </div>
                      <button onClick={() => setActiveTab('quotations')} className="mt-3 self-end rounded-md border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50">
                        Tindak lanjuti
                      </button>
                    </article>
                  ))}
                </div>
              )}
              {pendingQuotations.length > 5 && <button onClick={() => setActiveTab('quotations')} className="mt-3 text-xs font-bold text-blue-700 hover:text-blue-900">Lihat {pendingQuotations.length - 5} follow-up lainnya</button>}
            </Panel>
          </section>

          <Panel title="Recent Jobs Under PIC Care" subtitle={`Menampilkan ${filteredSalesJobs.length} shipment yang tercatat${user?.fullName ? ` · PIC ${user.fullName}` : ''}.`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <Search className="h-4 w-4 text-slate-400" />
                <input value={salesJobSearch} onChange={(event) => setSalesJobSearch(event.target.value)} placeholder="Cari Job, BL, customer..." className="w-full text-xs outline-none" />
              </label>
              <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 p-1">
                {([
                  ['all', `All (${jobs.length})`],
                  ['sea', 'Sea Freight'],
                  ['air', 'Air Freight'],
                ] as const).map(([filter, label]) => (
                  <button key={filter} onClick={() => setSalesJobFilter(filter)} className={`rounded-md px-3 py-1.5 text-[10px] font-bold ${salesJobFilter === filter ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <button onClick={() => setActiveTab('job-history')} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                <Search className="h-3.5 w-3.5" /> Filter / Riwayat
              </button>
            </div>
            {filteredSalesJobs.length === 0 ? <EmptyState>Tidak ada job yang cocok dengan pencarian atau filter.</EmptyState> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                      <th className="pb-3 pr-4 font-bold">Job Number</th>
                      <th className="pb-3 pr-4 font-bold">Customer</th>
                      <th className="pb-3 pr-4 font-bold">Shipment Type</th>
                      <th className="pb-3 pr-4 font-bold">Mode</th>
                      <th className="pb-3 pr-4 font-bold">Current Status</th>
                      <th className="pb-3 pr-4 font-bold">Quotation Status</th>
                      <th className="pb-3 font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalesJobs.map((job) => {
                      const quotation = quotations.find((item) => item.id === job.quotationId);
                      const jobStatus = job.workflowStage === 'legacy' ? job.currentStatus : jobStageLabels[job.workflowStage];
                      return (
                        <tr key={job.id} className="border-b border-slate-50 last:border-0">
                          <td className="py-3 pr-4 font-bold text-red-700">{job.jobNo}</td>
                          <td className="py-3 pr-4 font-medium text-slate-800">{job.customerName}</td>
                          <td className="py-3 pr-4"><span className="rounded bg-slate-100 px-2 py-1 text-[10px]">{job.shipmentType}</span></td>
                          <td className="py-3 pr-4 text-slate-600">{job.mode}</td>
                          <td className="py-3 pr-4"><span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">{jobStatus}</span></td>
                          <td className="py-3 pr-4 text-slate-700">{quotation ? quotationStageLabels[quotation.workflowStage] : job.quotationStatus || '—'}</td>
                          <td className="py-3">
                            <button onClick={() => { setJobHistorySearch(job.jobNo); setActiveTab('job-history'); }} className="rounded border border-slate-200 px-3 py-1.5 text-[10px] font-semibold hover:bg-slate-50">View</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      );
    }

    const stats = (() => {
      switch (role) {
        case 'sales_support':
          return [
            ['Quotation final', quotations.filter((item) => item.workflowStage === 'ready_for_support').length],
            ['Total Job Order', jobs.filter((item) => item.workflowStage !== 'legacy').length],
            ['Keputusan biaya', jobs.filter((item) => item.workflowStage === 'needs_extra_cost_decision').length],
            ['Vendor/Agent', vendors.length],
          ];
        case 'exim':
          return [
            ['Task lapangan', fieldTasks.filter((item) => !item.completed).length],
            ['Pekerjaan Exim', jobs.filter((item) => item.workflowStage === 'exim_work').length],
            ['Dokumen pabean', documents.length],
            ['Flag biaya tambahan', jobs.filter((item) => item.workflowStage === 'needs_extra_cost_decision').length],
          ];
        case 'admin_invoice':
          return [
            ['Job Done', jobs.filter((item) => ['ready_for_invoice', 'invoiced'].includes(item.workflowStage)).length],
            ['Invoice', invoices.length],
            ['Belum lunas', invoices.filter((item) => item.outstandingBalance > 0).length],
            ['Pengadaan', procurementRequests.length],
          ];
        case 'accounting':
          return [
            ['Data PNL', pnlReports.length],
            ['Invoice vendor', vendorBills.length],
            ['Belum rekonsiliasi', vendorBills.filter((item) => !item.reconciled).length],
            ['Margin terkini', currency(jobs.reduce((sum, item) => sum + item.sellingPrice + item.additionalCost - item.costingTotal, 0))],
          ];
      }
    })();

    return (
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-2 text-xl font-black text-slate-900">{value}</p>
            </div>
          ))}
        </div>
        <Panel title="Ringkasan pekerjaan" subtitle="Status alur Job Tracker untuk role Anda.">
          {jobs.length === 0 ? <EmptyState>Belum ada job.</EmptyState> : (
            <div className="space-y-2">
              {jobs.slice(0, 8).map((job) => (
                <div key={job.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-100 p-3 text-xs">
                  <span className="font-bold text-slate-800">{job.jobNo} · {job.customerName}</span>
                  <span className="text-slate-500">{job.workflowStage.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
        {role === 'accounting' && renderReports()}
      </div>
    );
  };

  const renderCustomers = () => (
    <div className="space-y-5">
      <Panel title="Input prospek" subtitle="Prospek akan masuk ke master customer dengan status legalitas belum diverifikasi. Periksa dokumen perusahaan, lalu perbarui statusnya pada daftar customer.">
        <form onSubmit={handleCreateProspect} className="grid gap-3 md:grid-cols-2">
          <input required placeholder="Nama perusahaan" value={prospectForm.companyName} onChange={(event) => setProspectForm({ ...prospectForm, companyName: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="Nama PIC" value={prospectForm.contactPerson} onChange={(event) => setProspectForm({ ...prospectForm, contactPerson: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input required type="email" placeholder="Email" value={prospectForm.email} onChange={(event) => setProspectForm({ ...prospectForm, email: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input required placeholder="Nomor telepon" value={prospectForm.phone} onChange={(event) => setProspectForm({ ...prospectForm, phone: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="w-fit rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white">Simpan prospek</button>
        </form>
        {formError && <p role="alert" className="mt-3 text-xs text-red-700">{formError}</p>}
      </Panel>
      <Panel title="Master customer" subtitle="Pemeriksaan dan pembaruan status legalitas dilakukan oleh Sales & Marketing.">
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Legalitas OK</p>
            <p className="mt-1 text-xl font-black text-emerald-800">{customers.filter((customer) => customer.npwpVerified).length}</p>
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Belum OK</p>
            <p className="mt-1 text-xl font-black text-amber-800">{customers.filter((customer) => !customer.npwpVerified).length}</p>
          </div>
        </div>
        <div className="space-y-2">
          {customers.length === 0 && <EmptyState>Belum ada customer di master data. Tambahkan prospek terlebih dahulu.</EmptyState>}
          {customers.map((customer) => (
            <div key={customer.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 text-xs">
              <div className="min-w-[220px] flex-1">
                <p className="font-bold text-slate-800">{customer.companyName}</p>
                <p className="mt-1 text-slate-500">{customer.contactPerson} · {customer.email} · {customer.phone}</p>
              </div>
              <span className={`h-fit rounded-full px-2.5 py-1 font-bold ${customer.npwpVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                {customer.npwpVerified ? 'Legalitas OK' : 'Legalitas belum OK'}
              </span>
              {customer.npwpVerified ? (
                <button onClick={() => runAction(() => updateCustomerLegalStatus(customer.id, false))} className="rounded-lg border border-amber-200 px-3 py-2 font-bold text-amber-800 hover:bg-amber-50">
                  Tandai belum OK
                </button>
              ) : (
                <button onClick={() => runAction(() => updateCustomerLegalStatus(customer.id, true))} className="rounded-lg bg-emerald-700 px-3 py-2 font-bold text-white hover:bg-emerald-800">
                  Tandai legalitas OK
                </button>
              )}
              <button
                type="button"
                onClick={() => setExpandedCustomerDocuments((current) => {
                  const next = new Set(current);
                  if (next.has(customer.id)) next.delete(customer.id);
                  else next.add(customer.id);
                  return next;
                })}
                className="rounded-lg border border-blue-200 px-3 py-2 font-bold text-blue-700 hover:bg-blue-50"
              >
                {expandedCustomerDocuments.has(customer.id) ? 'Tutup dokumen' : 'Dokumen legalitas'}
              </button>
              {expandedCustomerDocuments.has(customer.id) && (
                <div className="w-full">
                  <CustomerLegalDocuments customerKey={customer.accountCode} user={user} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );

  const renderVendors = () => (
    <div className="space-y-5">
      <Panel title="Data vendor / agent">
        <form onSubmit={handleAddVendor} className="grid gap-3 md:grid-cols-4">
          <input required placeholder="Nama vendor/agent" value={vendorForm.name} onChange={(event) => setVendorForm({ ...vendorForm, name: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input required placeholder="Jenis layanan" value={vendorForm.type} onChange={(event) => setVendorForm({ ...vendorForm, type: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="Kontak" value={vendorForm.contact} onChange={(event) => setVendorForm({ ...vendorForm, contact: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white">Tambah vendor</button>
        </form>
        {vendors.length === 0 ? <EmptyState>Belum ada vendor/agent.</EmptyState> : (
          <div className="mt-4 space-y-2">{vendors.map((vendor) => <div key={vendor.id} className="rounded-lg border p-3 text-xs"><strong>{vendor.name}</strong> · {vendor.type} · {vendor.contact || 'Kontak belum diisi'}</div>)}</div>
        )}
      </Panel>
      <Panel title="Biaya dasar vendor untuk rekonsiliasi">
        {vendors.length === 0 ? <EmptyState>Tambahkan vendor sebelum mencatat invoice vendor.</EmptyState> : (
          <form onSubmit={handleAddVendorBill} className="grid gap-3 md:grid-cols-2">
            <select required value={vendorBillForm.vendorId} onChange={(event) => setVendorBillForm({ ...vendorBillForm, vendorId: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Pilih vendor</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
            </select>
            <select required value={vendorBillForm.jobId} onChange={(event) => setVendorBillForm({ ...vendorBillForm, jobId: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Pilih Job Order</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.jobNo} · {job.customerName}</option>)}
            </select>
            <input required placeholder="Nomor invoice vendor" value={vendorBillForm.invoiceNumber} onChange={(event) => setVendorBillForm({ ...vendorBillForm, invoiceNumber: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input required min="1" type="number" placeholder="Nominal (Rp)" value={vendorBillForm.amount || ''} onChange={(event) => setVendorBillForm({ ...vendorBillForm, amount: Number(event.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" className="w-fit rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white">Catat biaya vendor</button>
          </form>
        )}
      </Panel>
    </div>
  );

  const renderFieldTasks = () => (
    <div className="space-y-5">
      <Panel title="Task lapangan">
        <form onSubmit={handleAddFieldTask} className="grid gap-3 md:grid-cols-3">
          <select required value={fieldTaskForm.jobId} onChange={(event) => setFieldTaskForm({ ...fieldTaskForm, jobId: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Pilih Job Order</option>{jobs.filter((job) => job.workflowStage === 'exim_work').map((job) => <option key={job.id} value={job.id}>{job.jobNo} · {job.customerName}</option>)}
          </select>
          <input required placeholder="Deskripsi task lapangan" value={fieldTaskForm.description} onChange={(event) => setFieldTaskForm({ ...fieldTaskForm, description: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white">Tambah task</button>
        </form>
        <div className="mt-4 space-y-2">
          {fieldTasks.length === 0 && <EmptyState>Belum ada task lapangan.</EmptyState>}
          {fieldTasks.map((task) => (
            <div key={task.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-xs">
              <span><strong>{task.jobNumber}</strong> · {task.description} · {task.completed ? 'Selesai' : 'Berjalan'}</span>
              {!task.completed && <button onClick={() => runAction(() => completeFieldTask(task.id))} className="rounded bg-emerald-700 px-3 py-1.5 font-bold text-white">Selesaikan</button>}
            </div>
          ))}
        </div>
      </Panel>
      {renderExim()}
    </div>
  );

  const renderCustomsDocuments = () => (
    <div className="space-y-5">
      {jobs.filter((job) => job.workflowStage === 'exim_work').map((job) => {
        const form = documentForms[job.id] || { name: '', type: 'PIB' as JobDocumentType };
        return (
          <Panel key={job.id} title={`${job.jobNo} · ${job.customerName}`} subtitle="Exim mengelola dokumen kepabeanan dan pengiriman. PIB untuk impor, PEB untuk ekspor. File disimpan privat di Supabase Storage (maksimal 20 MB).">
            <form onSubmit={(event) => handleUploadDocument(event, job.id)} className="grid gap-3 md:grid-cols-3">
              <input required type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(event) => {
                const file = event.target.files?.[0];
                setDocumentForms({ ...documentForms, [job.id]: { ...form, name: file?.name || '' } });
                if (file) setDocumentFiles({ ...documentFiles, [job.id]: file });
              }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <select value={form.type} onChange={(event) => setDocumentForms({ ...documentForms, [job.id]: { ...form, type: event.target.value as JobDocumentType } })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {(['PIB', 'PEB', 'SPPB', 'MBL', 'HBL', 'B/L', 'AWB', 'COO', 'Delivery Order', 'Packing List', 'Invoice'] as JobDocumentType[]).map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <button disabled={documentUploading[job.id]} type="submit" className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">
                {documentUploading[job.id] ? 'Mengunggah...' : 'Upload dokumen'}
              </button>
            </form>
          </Panel>
        );
      })}
      <Panel title="Dokumen terdaftar">
        {documents.length === 0 ? <EmptyState>Belum ada dokumen.</EmptyState> : <div className="space-y-2">{documents.map((document) => (
          <div key={document.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-xs">
            <span><strong>{document.jobNo}</strong> · {document.documentName} · {document.docType} · {document.status}</span>
            {document.fileUrl.startsWith('local://')
              ? <span className="text-[11px] font-semibold text-amber-700">File lama belum tersedia untuk diunduh</span>
              : <button onClick={() => handleDownloadDocument(document.fileUrl)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50">Buka / cetak dokumen</button>}
          </div>
        ))}</div>}
      </Panel>
    </div>
  );

  const renderExim = () => {
    const eximJobs = jobs.filter((job) => job.workflowStage === 'exim_work');
    const jobsAwaitingCostReview = jobs.filter((job) => job.workflowStage === 'needs_extra_cost_decision');
    return (
      <div className="space-y-4">
      {jobsAwaitingCostReview.length > 0 && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">Job Done · menunggu pemeriksaan biaya</p>
          <p className="mt-1 text-xs text-amber-800">Pekerjaan sudah diteruskan ke Sales Support untuk konfirmasi apakah ada biaya tambahan lapangan.</p>
          <ul className="mt-2 space-y-1 text-xs font-semibold text-amber-900">
            {jobsAwaitingCostReview.map((job) => <li key={job.id}>{job.jobNo} · {job.customerName}</li>)}
          </ul>
        </div>
      )}
      <Panel title="Dokumen & Incoterm" subtitle="Lengkapi dokumen pengiriman (misalnya MBL, HBL, atau SPPB) dan Incoterm, lalu tandai pekerjaan sebagai Job Done.">
        <div className="space-y-3">
          {eximJobs.length === 0 && <EmptyState>Tidak ada job yang menunggu Exim.</EmptyState>}
          {eximJobs.map((job) => (
            <form key={job.id} onSubmit={(event) => {
              event.preventDefault();
              runAction(() => completeEximWork(job.id, incoterms[job.id] || '', documentsConfirmed[job.id] || false));
            }} className="rounded-xl border p-4">
              <p className="text-sm font-bold">{job.jobNo} · {job.customerName}</p>
              <p className="mt-1 text-xs text-slate-500">{job.serviceType} · {job.origin} → {job.destination}</p>
              <div className="mt-3 flex flex-wrap items-end gap-4">
                <label className="text-xs font-semibold">Incoterm
                  <select required value={incoterms[job.id] || ''} onChange={(event) => setIncoterms({ ...incoterms, [job.id]: event.target.value })} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm">
                    <option value="">Pilih Incoterm</option>
                    {['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF'].map((term) => <option key={term} value={term}>{term}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input type="checkbox" checked={documentsConfirmed[job.id] || false} onChange={(event) => setDocumentsConfirmed({ ...documentsConfirmed, [job.id]: event.target.checked })} />
                  Dokumen pengiriman lengkap
                </label>
                <button type="submit" className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Job Done</button>
              </div>
            </form>
          ))}
        </div>
      </Panel>
      </div>
    );
  };

  const renderAdmin = () => {
    const readyJobs = jobs.filter((job) => job.workflowStage === 'ready_for_invoice');
    const invoiceJobs = invoices.map((invoice) => ({ invoice, job: jobs.find((job) => job.id === invoice.jobId) }));
    return (
      <div className="space-y-5">
        <form onSubmit={handleDebitNote} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-4">
          <strong className="self-center text-sm">Buat Debit Note</strong>
          <select required value={debitNoteForm.jobId} onChange={(event) => setDebitNoteForm({ ...debitNoteForm, jobId: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Pilih job</option>{jobs.filter((job) => job.workflowStage === 'invoiced').map((job) => <option key={job.id} value={job.id}>{job.jobNo} · {job.customerName}</option>)}
          </select>
          <input required min="1" type="number" placeholder="Nominal (Rp)" value={debitNoteForm.amount || ''} onChange={(event) => setDebitNoteForm({ ...debitNoteForm, amount: Number(event.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input required placeholder="Alasan" value={debitNoteForm.reason} onChange={(event) => setDebitNoteForm({ ...debitNoteForm, reason: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="w-fit rounded-lg bg-amber-700 px-3 py-2 text-xs font-bold text-white md:col-start-2">Simpan debit note</button>
        </form>
        <Panel title="Daftar pekerjaan selesai (Job Done)" subtitle="Pekerjaan Exim yang sudah selesai, baik yang belum maupun yang sudah dibuatkan invoice.">
          {jobs.filter((job) => ['ready_for_invoice', 'invoiced'].includes(job.workflowStage)).length === 0
            ? <EmptyState>Belum ada pekerjaan selesai.</EmptyState>
            : <div className="space-y-2">{jobs.filter((job) => ['ready_for_invoice', 'invoiced'].includes(job.workflowStage)).map((job) => (
              <div key={job.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-xs">
                <span><strong>{job.jobNo} · {job.customerName}</strong> · {job.incoterm || 'Incoterm belum tersedia'}</span>
                <span className={`rounded-full px-2 py-1 font-bold ${job.workflowStage === 'invoiced' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {job.workflowStage === 'invoiced' ? 'Invoice dibuat' : 'Menunggu invoice'}
                </span>
              </div>
            ))}</div>}
        </Panel>
        <Panel title="Job Done · Buat invoice">
          <div className="space-y-3">
            {readyJobs.length === 0 && <EmptyState>Tidak ada Job Done yang menunggu invoice.</EmptyState>}
            {readyJobs.map((job) => (
              <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                <div><p className="text-sm font-bold">{job.jobNo} · {job.customerName}</p><p className="mt-1 text-xs text-slate-500">Harga quotation {currency(job.sellingPrice)} + biaya tambahan {currency(job.additionalCost)}</p></div>
                <button onClick={() => runAction(() => createInvoiceForJob(job.id))} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white">Buat invoice</button>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Kirim invoice ke customer">
          <div className="space-y-3">
            {invoiceJobs.length === 0 && <EmptyState>Belum ada invoice.</EmptyState>}
            {invoiceJobs.map(({ invoice }) => (
              <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                <div><p className="text-sm font-bold">{invoice.invoiceNo} · {invoice.customerName}</p><p className="mt-1 text-xs text-slate-500">{invoice.jobNo} · {currency(invoice.totalSelling)} · Jatuh tempo {invoice.dueDate}</p><p className="mt-1 text-xs">{invoice.deliveryStatus === 'sent' ? 'Invoice terkirim ke customer' : 'Belum dikirim'}</p></div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => runAction(() => printDocument('Invoice', invoice.invoiceNo, [
                      { label: 'Customer', value: invoice.customerName },
                      { label: 'Job Number', value: invoice.jobNo },
                      { label: 'Tanggal terbit', value: invoice.issueDate },
                      { label: 'Jatuh tempo', value: invoice.dueDate },
                      { label: 'Subtotal', value: currency(invoice.subtotal) },
                      { label: 'Pajak', value: currency(invoice.taxAmount) },
                      { label: 'Total tagihan', value: currency(invoice.totalSelling) },
                      { label: 'Pembayaran diterima', value: currency(invoice.totalPaid) },
                      { label: 'Sisa tagihan', value: currency(invoice.outstandingBalance) },
                      { label: 'Metode pembayaran', value: invoice.paymentMethod || 'Kredit' },
                      { label: 'Status', value: invoice.status },
                    ]))}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Printer className="h-3.5 w-3.5" /> Cetak / Simpan PDF
                  </button>
                  {invoice.deliveryStatus === 'draft' && <button onClick={() => runAction(() => sendInvoiceToCustomer(invoice.id))} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Kirim invoice</button>}
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Debit note">
          {debitNotes.length === 0 ? <EmptyState>Belum ada debit note.</EmptyState> : <div className="space-y-2">{debitNotes.map((note) => <div key={note.id} className="rounded-lg border p-3 text-xs"><strong>{note.invoiceNumber} · {note.jobNumber} · {note.customerName}</strong> · {currency(note.amount)} · {note.reason} · {note.createdAt}</div>)}</div>}
        </Panel>
      </div>
    );
  };

  const renderPayments = () => (
    <Panel title="Pembayaran masuk">
      {invoices.filter((invoice) => invoice.deliveryStatus === 'sent' && invoice.outstandingBalance > 0).length === 0
        ? <EmptyState>Tidak ada invoice terkirim dengan saldo tertunggak.</EmptyState>
        : <div className="space-y-3">{invoices.filter((invoice) => invoice.deliveryStatus === 'sent' && invoice.outstandingBalance > 0).map((invoice) => (
          <form key={invoice.id} onSubmit={(event) => handlePayment(event, invoice.id)} className="flex flex-wrap items-end justify-between gap-3 rounded-xl border p-4">
            <div><p className="text-sm font-bold">{invoice.invoiceNo} · {invoice.customerName}</p><p className="mt-1 text-xs text-slate-500">Sisa {currency(invoice.outstandingBalance)} · Status {invoice.status} · Metode {invoice.paymentMethod || 'Kredit'}</p></div>
            <label className="text-xs font-semibold">Metode pembayaran
              <select value={paymentMethodForms[invoice.id] || invoice.paymentMethod || 'Kredit'} onChange={(event) => {
                const paymentMethod = event.target.value as PaymentMethod;
                setPaymentMethodForms({ ...paymentMethodForms, [invoice.id]: paymentMethod });
                if (paymentMethod === 'COD') setPaymentForms({ ...paymentForms, [invoice.id]: invoice.outstandingBalance });
              }} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="Kredit">Kredit</option><option value="COD">COD (lunas)</option>
              </select>
            </label>
            <label className="text-xs font-semibold">Nominal diterima (Rp)<input required min="1" max={invoice.outstandingBalance} type="number" value={(paymentMethodForms[invoice.id] || invoice.paymentMethod) === 'COD' ? invoice.outstandingBalance : paymentForms[invoice.id] || ''} onChange={(event) => setPaymentForms({ ...paymentForms, [invoice.id]: Number(event.target.value) })} readOnly={(paymentMethodForms[invoice.id] || invoice.paymentMethod) === 'COD'} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm read-only:bg-slate-50" /></label>
            <button type="submit" className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Catat pembayaran</button>
          </form>
        ))}</div>}
    </Panel>
  );

  const renderAccountingInvoices = () => (
    <Panel title="Invoice" subtitle="Invoice yang diterbitkan Admin Invoice dan tersinkron dari workflow bersama.">
      {invoices.length === 0
        ? <EmptyState>Belum ada invoice.</EmptyState>
        : <div className="space-y-2">{invoices.map((invoice) => (
          <div key={invoice.id} className="rounded-lg border p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong>{invoice.invoiceNo} · {invoice.customerName}</strong>
              <span className="rounded-full bg-blue-50 px-2 py-1 font-bold text-blue-700">{invoice.status}</span>
            </div>
            <p className="mt-1 text-slate-600">
              {invoice.jobNo} · Total {currency(invoice.totalSelling)} · Sisa {currency(invoice.outstandingBalance)}
            </p>
            <p className="mt-1 text-slate-500">
              Terbit {invoice.issueDate} · Jatuh tempo {invoice.dueDate} · {invoice.deliveryStatus === 'sent' ? 'Terkirim ke customer' : 'Belum dikirim'}
            </p>
          </div>
        ))}</div>}
    </Panel>
  );

  const renderProcurement = () => (
    <div className="space-y-5">
      <Panel title="Pengadaan internal">
        <form onSubmit={handleProcurement} className="grid gap-3 md:grid-cols-3">
          <input required placeholder="Deskripsi kebutuhan" value={procurementForm.description} onChange={(event) => setProcurementForm({ ...procurementForm, description: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input required min="1" type="number" placeholder="Estimasi nominal (Rp)" value={procurementForm.amount || ''} onChange={(event) => setProcurementForm({ ...procurementForm, amount: Number(event.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white">Ajukan pengadaan</button>
        </form>
      </Panel>
      <Panel title="Daftar pengadaan">
        {procurementRequests.length === 0 ? <EmptyState>Belum ada permintaan pengadaan.</EmptyState> : <div className="space-y-2">{procurementRequests.map((item) => <div key={item.id} className="rounded-lg border p-3 text-xs"><strong>{item.description}</strong> · {currency(item.amount)} · {item.status} · {item.createdAt}</div>)}</div>}
      </Panel>
    </div>
  );

  const renderPettyCash = () => (
    <Panel title="Pencatatan petty cash (ATK, kas kecil)">
      <form onSubmit={handlePettyCash} className="mb-4 grid gap-3 md:grid-cols-3">
        <input required placeholder="Keterangan pengeluaran" value={cashForm.description} onChange={(event) => setCashForm({ ...cashForm, description: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input required min="1" type="number" placeholder="Nominal (Rp)" value={cashForm.amount || ''} onChange={(event) => setCashForm({ ...cashForm, amount: Number(event.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white">Catat petty cash</button>
      </form>
      {pettyCashEntries.length === 0 ? <EmptyState>Belum ada transaksi petty cash.</EmptyState> : <div className="space-y-2">{pettyCashEntries.map((item) => <div key={item.id} className="rounded-lg border p-3 text-xs"><strong>{item.description}</strong> · {currency(item.amount)} · {item.createdAt}</div>)}</div>}
    </Panel>
  );

  const renderReconciliation = () => (
    <Panel title="Rekonsiliasi vendor vs invoice">
      {vendorBills.length === 0 ? <EmptyState>Belum ada invoice vendor. Sales Support dapat mencatat vendor dan invoice biayanya.</EmptyState> : (
        <div className="space-y-2">{vendorBills.map((bill) => (
          <div key={bill.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-xs">
            <span>
              <strong>{bill.vendorName}</strong> · {bill.invoiceNumber} · {bill.jobNumber} · Aktual {currency(bill.amount)}
              {(() => {
                const job = jobs.find((item) => item.jobNo === bill.jobNumber);
                const actualJobCost = vendorBills
                  .filter((item) => item.jobNumber === bill.jobNumber)
                  .reduce((total, item) => total + item.amount, 0);
                return job ? <span className="block mt-1 text-slate-500">Estimasi job {currency(job.costingTotal)} · Total aktual vendor {currency(actualJobCost)} · Selisih {currency(actualJobCost - job.costingTotal)}</span> : null;
              })()}
            </span>
            {bill.reconciled ? <span className="font-bold text-emerald-700">Rekonsiliasi selesai</span> : <button onClick={() => runAction(() => reconcileVendorBill(bill.id))} className="rounded-lg bg-blue-700 px-3 py-2 font-bold text-white">Tandai cocok</button>}
          </div>
        ))}</div>
      )}
    </Panel>
  );

  const renderReports = () => (
    <Panel title="Laporan margin & PNL" subtitle="Accounting membuat snapshot laporan; Sales & Marketing dapat melihat laporan yang sudah dibuat.">
      {role === 'accounting' && (
        <button onClick={() => runAction(createPnlReport)} className="mb-4 rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white">Buat report margin dan PNL</button>
      )}
      {pnlReports.length === 0 ? <EmptyState>Belum ada report PNL.</EmptyState> : (
        <div className="space-y-2">
          {pnlReports.map((report) => (
            <div key={report.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-xs">
              <div className="grid flex-1 gap-2 sm:grid-cols-5">
              <span>{report.createdAt}</span><span>{report.jobCount} job</span>
              <span>Revenue: {currency(report.totalRevenue)}</span><span>Cost: {currency(report.totalCost)}</span>
              <strong>Margin: {currency(report.margin)}</strong>
              </div>
              <button
                onClick={() => runAction(() => printDocument('Laporan Margin & PNL', report.createdAt, [
                  { label: 'Tanggal laporan', value: report.createdAt },
                  { label: 'Jumlah job', value: String(report.jobCount) },
                  { label: 'Revenue', value: currency(report.totalRevenue) },
                  { label: 'Cost', value: currency(report.totalCost) },
                  { label: 'Margin', value: currency(report.margin) },
                ]))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 font-bold text-slate-700 hover:bg-slate-50"
              >
                <Printer className="h-3.5 w-3.5" /> Cetak / Simpan PDF
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 border-t pt-4">
        <h3 className="mb-2 text-xs font-bold text-slate-800">Margin per job (read-only)</h3>
        {jobs.filter((job) => job.workflowStage !== 'legacy').length === 0
          ? <p className="text-xs text-slate-500">Belum ada job baru untuk dihitung.</p>
          : <div className="space-y-2">{jobs.filter((job) => job.workflowStage !== 'legacy').map((job) => {
            const revenue = job.sellingPrice + job.additionalCost + debitNotes
              .filter((note) => note.jobNumber === job.jobNo)
              .reduce((total, note) => total + note.amount, 0);
            const vendorCost = vendorBills
              .filter((bill) => bill.jobNumber === job.jobNo)
              .reduce((total, bill) => total + bill.amount, 0);
            const cost = vendorCost || job.costingTotal;
            return (
              <div key={job.id} className="flex flex-wrap justify-between gap-2 rounded-lg border p-3 text-xs">
                <span><strong>{job.jobNo}</strong> · {job.customerName}</span>
                <span>Revenue {currency(revenue)} · Cost {currency(cost)}{vendorCost ? ' (aktual)' : ' (estimasi)'} · <strong>Margin {currency(revenue - cost)}</strong></span>
              </div>
            );
          })}</div>}
      </div>
    </Panel>
  );

  const renderJobOrderHistory = () => {
    const searchTerm = jobHistorySearch.trim().toLowerCase();
    const historyJobs = jobs.filter((job) => {
      const matchesSearch = !searchTerm || [
        job.jobNo,
        job.customerName,
        job.serviceType,
        job.origin,
        job.destination,
        job.blNumber || '',
      ].some((value) => value.toLowerCase().includes(searchTerm));
      const matchesStage = jobHistoryStage === 'all' || job.workflowStage === jobHistoryStage;
      return matchesSearch && matchesStage;
    });
    const activeCount = jobs.filter((job) => !['legacy', 'invoiced'].includes(job.workflowStage)).length;
    const completedCount = jobs.filter((job) => ['ready_for_invoice', 'invoiced'].includes(job.workflowStage)).length;
    const waitingCount = jobs.filter((job) => ['needs_extra_cost_decision', 'support_extra_cost', 'ready_for_invoice'].includes(job.workflowStage)).length;

    return (
      <div className="space-y-5">
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Freight forwarding workflow</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Job Order History</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Shared job history for Sales, Sales Support, Exim, Admin Invoice, and Accounting.
            Every role sees the same status, and next steps follow the job workflow.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Total Job Order', value: jobs.length },
            { label: 'Dalam proses', value: activeCount },
            { label: 'Menunggu tindak lanjut', value: waitingCount },
          ].map((item) => (
            <article key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{item.value}</p>
            </article>
          ))}
        </section>

        <Panel title="Semua Job Order" subtitle={`${completedCount} job sudah selesai Exim atau sudah masuk tahap invoice.`}>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <label className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={jobHistorySearch}
                onChange={(event) => setJobHistorySearch(event.target.value)}
                placeholder="Cari Job Number, customer, BL, layanan, atau rute"
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
              />
            </label>
            <select
              aria-label="Filter status Job Order"
              value={jobHistoryStage}
              onChange={(event) => setJobHistoryStage(event.target.value as JobWorkflowStage | 'all')}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">Semua status workflow</option>
              {(Object.keys(jobStageLabels) as JobWorkflowStage[]).map((stage) => (
                <option key={stage} value={stage}>{jobStageLabels[stage]}</option>
              ))}
            </select>
          </div>

          {historyJobs.length === 0 ? (
            <EmptyState>{jobs.length ? 'Tidak ada Job Order yang cocok dengan pencarian atau filter.' : 'Belum ada Job Order dalam riwayat.'}</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                    <th className="pb-3 pr-4 font-bold">Job Number / Tanggal</th>
                    <th className="pb-3 pr-4 font-bold">Customer</th>
                    <th className="pb-3 pr-4 font-bold">Layanan / Rute</th>
                    <th className="pb-3 pr-4 font-bold">Status</th>
                    <th className="pb-3 pr-4 font-bold">PIC / Tahap berikutnya</th>
                    <th className="pb-3 font-bold">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {historyJobs.map((job) => {
                    const invoice = invoices.find((item) => item.jobId === job.id);
                    const owner = job.workflowStage === 'legacy' ? job.assignedPic || 'Belum ditentukan'
                      : ['exim_work', 'needs_extra_cost_decision', 'support_extra_cost'].includes(job.workflowStage) ? 'Exim / Sales Support'
                        : job.workflowStage === 'ready_for_invoice' ? 'Admin Invoice'
                          : 'Accounting / Admin Invoice';
                    return (
                      <tr key={job.id} className="border-b border-slate-50 align-top last:border-0">
                        <td className="py-3 pr-4">
                          <p className="font-bold text-slate-900">{job.jobNo}</p>
                          <p className="mt-1 text-[10px] text-slate-500">{job.date || 'Tanggal belum dicatat'}</p>
                          <button
                            onClick={() => runAction(() => printJobOrder(job))}
                            className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 hover:text-blue-900"
                          >
                            <Printer className="h-3 w-3" /> Cetak Job Order
                          </button>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-slate-800">{job.customerName}</p>
                          {job.blNumber && <p className="mt-1 text-[10px] text-slate-500">BL/AWB: {job.blNumber}</p>}
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-medium text-slate-700">{job.serviceType}</p>
                          <p className="mt-1 text-[10px] text-slate-500">{job.origin} → {job.destination}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                            {jobStageLabels[job.workflowStage]}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-slate-700">{owner}</p>
                          <p className="mt-1 max-w-[220px] text-[10px] leading-relaxed text-slate-500">{jobNextStep(job, invoice?.outstandingBalance)}</p>
                        </td>
                        <td className="py-3">
                          {invoice ? (
                            <>
                              <p className="font-semibold text-slate-800">{invoice.invoiceNo}</p>
                              <p className="mt-1 text-[10px] capitalize text-slate-500">{invoice.status}</p>
                            </>
                          ) : <span className="text-slate-400">Belum dibuat</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        <p className="text-[11px] text-slate-400">
          Riwayat ini memakai data workflow yang tersedia di aplikasi. Aktivitas belum menjadi audit trail per pengguna dan belum tersinkron antarperangkat.
        </p>
      </div>
    );
  };

  const pageContent = (() => {
    if (activeTab === 'job-history') return renderJobOrderHistory();
    switch (role) {
      case 'sales_marketing':
        if (activeTab === 'customers') return renderCustomers();
        if (activeTab === 'quotations') return renderSales();
        if (activeTab === 'pnl-report') return renderReports();
        return renderDashboard();
      case 'sales_support':
        if (activeTab === 'customers') return renderCustomers();
        if (activeTab === 'job-orders') return renderSupport('job-orders');
        if (activeTab === 'extra-costs') return renderSupport('extra-costs');
        if (activeTab === 'vendors') return renderVendors();
        return renderDashboard();
      case 'exim':
        if (activeTab === 'field-tasks') return renderFieldTasks();
        if (activeTab === 'customs-documents') return <div className="space-y-5">{renderCustomsDocuments()}{renderExim()}</div>;
        return <div className="space-y-5">{renderDashboard()}{renderExim()}</div>;
      case 'admin_invoice':
        if (activeTab === 'payments') return renderPayments();
        if (activeTab === 'procurement') return renderProcurement();
        if (activeTab === 'petty-cash') return renderPettyCash();
        return renderAdmin();
      case 'accounting':
        if (activeTab === 'billing') return renderAccountingInvoices();
        if (activeTab === 'pnl-data') return <div className="space-y-5">{renderReports()}{renderReconciliation()}</div>;
        if (activeTab === 'margin-report') return renderReports();
        return <div className="space-y-5">{renderDashboard()}{renderReconciliation()}</div>;
    }
  })();

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      breadcrumb={['PT Hopelmar MIS', activeLabel]}
      onNewQuotation={role === 'sales_marketing' ? () => setActiveTab('quotations') : undefined}
      onNavigateHome={() => setActiveTab('dashboard')}
      notifications={workspaceNotifications}
      onSelectNotification={(notification) => setActiveTab(notification.tab)}
      searchValue={globalSearch}
      onSearchChange={setGlobalSearch}
      searchResults={globalSearchResults}
      onSelectSearchResult={(result) => setActiveTab(result.tab)}
    >
      {activeTab !== 'job-history' && !(role === 'sales_marketing' && activeTab === 'dashboard') && (
        <div className="mb-5">
          <h1 className="text-xl font-black text-slate-900">{activeLabel}</h1>
          <p className="mt-1 text-xs text-slate-500">{roleTitle} · Website Job Tracker Freight Forwarding</p>
        </div>
      )}
      {authError && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{authError}</p>}
      {actionError && <p role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{actionError}</p>}
      {!user && <p role="alert" className="mb-4 text-xs text-red-700">Sesi pengguna tidak tersedia.</p>}
      {pageContent}
    </DashboardLayout>
  );
};
