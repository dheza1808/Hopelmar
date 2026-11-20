import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { 
  Building2, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Download, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Ship, 
  Plane, 
  FileText, 
  Headphones, 
  Edit3,
  Info,
  UploadCloud,
  ExternalLink,
  LoaderCircle,
} from 'lucide-react';

const customerDocumentTypes = [
  { value: 'npwp_company', label: 'NPWP perusahaan' },
  { value: 'ktp_pic', label: 'KTP PIC' },
  { value: 'nib', label: 'NIB' },
  { value: 'siup', label: 'SIUP' },
  { value: 'api_nik', label: 'API / NIK kepabeanan' },
  { value: 'other', label: 'Lainnya' },
] as const;

type CustomerDocumentType = typeof customerDocumentTypes[number]['value'];

interface CustomerLegalDocument {
  id: string;
  customer_key: string;
  document_type: CustomerDocumentType;
  document_name: string;
  file_path: string;
  created_at: string;
}

interface CustomerDetailProps {
  customerId: string;
  onBackToList: () => void;
  onCreateJobForCustomer: (customerId: string) => void;
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({
  customerId,
  onBackToList,
  onCreateJobForCustomer,
}) => {
  const { customers, jobs, user } = useAuth();
  const customer = customers.find(c => c.id === customerId) || customers[0];

  const [yearFilter, setYearFilter] = useState('2025');
  const [modeFilter, setModeFilter] = useState('All');
  const [tradeFilter, setTradeFilter] = useState('All');
  const [customerDocuments, setCustomerDocuments] = useState<CustomerLegalDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentType, setDocumentType] = useState<CustomerDocumentType>('npwp_company');
  const [otherDocumentName, setOtherDocumentName] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentError, setDocumentError] = useState('');

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured || !customer?.accountCode) {
      setCustomerDocuments([]);
      return () => { active = false; };
    }

    setDocumentsLoading(true);
    setDocumentError('');
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('customer_documents')
          .select('id, customer_key, document_type, document_name, file_path, created_at')
          .eq('customer_key', customer.accountCode)
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (active) setCustomerDocuments((data || []) as CustomerLegalDocument[]);
      } catch (error) {
        if (active) setDocumentError(error instanceof Error ? error.message : 'Dokumen customer gagal dimuat.');
      } finally {
        if (active) setDocumentsLoading(false);
      }
    })();

    return () => { active = false; };
  }, [customer?.accountCode]);

  const handleUploadCustomerDocument = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setDocumentError('');
    if (!isSupabaseConfigured) {
      setDocumentError('Supabase belum dikonfigurasi. Dokumen customer tidak dapat disimpan bersama.');
      return;
    }
    if (!user?.id) {
      setDocumentError('Sesi pengguna tidak tersedia. Silakan login kembali.');
      return;
    }
    if (!documentFile) {
      setDocumentError('Pilih file dokumen terlebih dahulu.');
      return;
    }
    if (documentFile.size > 20 * 1024 * 1024) {
      setDocumentError('Ukuran file maksimal 20 MB.');
      return;
    }
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(documentFile.type)) {
      setDocumentError('Format file harus PDF, JPG, atau PNG.');
      return;
    }
    if (documentType === 'other' && !otherDocumentName.trim()) {
      setDocumentError('Isi nama dokumen untuk kategori Lainnya.');
      return;
    }

    setDocumentUploading(true);
    const safeCustomerKey = customer.accountCode.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFileName = documentFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${safeCustomerKey}/${Date.now()}-${safeFileName}`;
    try {
      const { error: uploadError } = await supabase.storage
        .from('customer-documents')
        .upload(filePath, documentFile, { contentType: documentFile.type, upsert: false });
      if (uploadError) throw uploadError;

      const documentName = documentType === 'other'
        ? otherDocumentName.trim()
        : customerDocumentTypes.find((item) => item.value === documentType)?.label || documentType;
      const { data, error: recordError } = await supabase
        .from('customer_documents')
        .insert({
          customer_key: customer.accountCode,
          document_type: documentType,
          document_name: documentName,
          file_path: filePath,
          uploaded_by: user.id,
        })
        .select('id, customer_key, document_type, document_name, file_path, created_at')
        .single();
      if (recordError) {
        const { error: cleanupError } = await supabase.storage.from('customer-documents').remove([filePath]);
        if (cleanupError) console.error('Failed to remove an orphaned customer document.', cleanupError);
        throw recordError;
      }

      setCustomerDocuments((current) => [data as CustomerLegalDocument, ...current]);
      setDocumentFile(null);
      setOtherDocumentName('');
      form.reset();
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : 'Dokumen customer gagal diunggah.');
    } finally {
      setDocumentUploading(false);
    }
  };

  const handleOpenCustomerDocument = async (filePath: string) => {
    setDocumentError('');
    try {
      const { data, error } = await supabase.storage
        .from('customer-documents')
        .createSignedUrl(filePath, 60);
      if (error) throw error;
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    } catch (error) {
      setDocumentError(error instanceof Error ? `Dokumen tidak dapat dibuka: ${error.message}` : 'Dokumen tidak dapat dibuka.');
    }
  };

  // Specific job history for Alfamart as shown in Figma Image 4
  const alfamartJobs = [
    {
      id: 'j-1',
      jobNo: '#JKT-2025-0891',
      blNo: 'BL: HDMU-901192-01',
      date: '22 Oct 2025',
      trade: 'Export',
      mode: "Sea FCL (1×40'HC)",
      route: 'POL: Tanjung Priok → POD: Singapore',
      isSea: true,
      status: 'Customs Process',
      statusType: 'customs',
    },
    {
      id: 'j-7',
      jobNo: '#JKT-2025-0742',
      blNo: 'BL: MAEU-772910-18',
      date: '10 Sep 2025',
      trade: 'Export',
      mode: "Sea FCL (2×40'HC)",
      route: 'POL: Tanjung Priok → POD: Port Klang',
      isSea: true,
      status: 'Completed',
      statusType: 'completed',
    },
    {
      id: 'j-8',
      jobNo: '#JKT-2025-0618',
      blNo: 'BL: ONEY-440192-99',
      date: '15 Aug 2025',
      trade: 'Import',
      mode: 'Sea LCL (12 CBM)',
      route: 'POL: Shanghai → POD: Tanjung Priok',
      isSea: true,
      status: 'Completed',
      statusType: 'completed',
    },
    {
      id: 'j-9',
      jobNo: '#CGK-2025-0504',
      blNo: 'AWB: 126-89410291',
      date: '02 Jul 2025',
      trade: 'Import',
      mode: 'Air Freight (450 kg)',
      route: 'AOL: Incheon (ICN) → AOD: Soekarno-Hatta (CGK)',
      isSea: false,
      status: 'Completed',
      statusType: 'completed',
    },
    {
      id: 'j-10',
      jobNo: '#JKT-2025-0399',
      blNo: 'BL: COSU-881290-41',
      date: '18 May 2025',
      trade: 'Export',
      mode: "Sea FCL (1×20'GP)",
      route: 'POL: Tanjung Priok → POD: Bangkok (BKK)',
      isSea: true,
      status: 'Completed',
      statusType: 'completed',
    },
  ];

  return (
    <div className="space-y-5 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Main Account Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {customer.companyName} {customer.subName || ''}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Active Client
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
            <span>Account Code:</span>
            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
              {customer.accountCode}
            </span>
            <span>•</span>
            <span>{customer.category}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-sm hover:bg-slate-50 transition">
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Customer</span>
          </button>
          <button
            onClick={() => onCreateJobForCustomer(customer.id)}
            className="px-3.5 py-1.5 rounded-lg bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Job for Customer</span>
          </button>
        </div>
      </div>

      {/* Top 3 Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PRIMARY CONTACT */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              <span>PRIMARY CONTACT</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center shrink-0">
                BH
              </div>
              <div className="leading-tight">
                <div className="text-xs font-bold text-slate-900">{customer.contactPerson}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{customer.roleTitle}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-1.5">{customer.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* TELEPHONY LINES */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span>TELEPHONY LINES</span>
              <Headphones className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-500 text-[11px]">Direct Mobile:</span>
                <span className="font-bold text-slate-900">{customer.phone}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-500 text-[11px]">Alternate / HQ:</span>
                <span className="text-slate-700">{customer.altPhone || '+62 21-5573-0900'}</span>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
            Timezone: GMT+7 (WIB) &nbsp; Operating 08:30 - 17:30
          </div>
        </div>

        {/* BILLING & PHYSICAL ADDRESS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span>BILLING & PHYSICAL ADDRESS</span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-700">
              <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-relaxed">
                {customer.address}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>NPWP & Tax ID Document Verified</span>
          </div>
        </div>
      </div>

      {/* 4 Metric Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: TOTAL JOBS RUN */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL JOBS RUN</span>
          <div className="text-xl font-bold text-slate-900 mt-1">18 Jobs</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>1 Active / 17 Closed</span>
          </div>
        </div>

        {/* Metric 2: TOTAL VOLUME (TEU) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL VOLUME (TEU)</span>
          <div className="text-xl font-bold text-slate-900 mt-1">42 TEUs</div>
          <div className="text-[10px] text-slate-500 mt-1">Sea Freight Dominant</div>
        </div>

        {/* Metric 3: AIR CONSIGNMENTS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AIR CONSIGNMENTS</span>
          <div className="text-xl font-bold text-slate-900 mt-1">1,840 kg</div>
          <div className="text-[10px] text-slate-500 mt-1">High-Value / Spares</div>
        </div>

        {/* Metric 4: CREDIT TERMS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CREDIT TERMS</span>
          <div className="text-xl font-bold text-slate-900 mt-1">30 Days</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Status: Regular Standing</div>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-900">Dokumen legalitas customer</h3>
          <p className="mt-1 text-[11px] text-slate-500">
            Disimpan pada master customer untuk digunakan kembali pada quotation dan job berikutnya. File bersifat privat.
          </p>
        </div>
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
          <div className="space-y-2">
            {documentsLoading ? (
              <p className="flex items-center gap-2 text-xs text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Memuat dokumen...</p>
            ) : customerDocuments.length ? customerDocuments.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-800">{item.document_name}</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {customerDocumentTypes.find((type) => type.value === item.document_type)?.label || 'Lainnya'}
                    {' · '}{new Date(item.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleOpenCustomerDocument(item.file_path)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-blue-700 hover:bg-blue-50"
                >
                  <ExternalLink className="h-3 w-3" /> Buka
                </button>
              </div>
            )) : (
              <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                Belum ada dokumen legalitas tersimpan untuk customer ini.
              </p>
            )}
          </div>
          <form onSubmit={handleUploadCustomerDocument} className="space-y-3 rounded-lg bg-slate-50 p-3">
            <label className="block text-[11px] font-bold text-slate-700">
              Jenis dokumen
              <select
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value as CustomerDocumentType)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                {customerDocumentTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </label>
            {documentType === 'other' && (
              <label className="block text-[11px] font-bold text-slate-700">
                Nama dokumen
                <input
                  required
                  value={otherDocumentName}
                  onChange={(event) => setOtherDocumentName(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  placeholder="Contoh: Surat kuasa"
                />
              </label>
            )}
            <label className="block text-[11px] font-bold text-slate-700">
              File (PDF, JPG, PNG · maks. 20 MB)
              <input
                required
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(event) => setDocumentFile(event.target.files?.[0] || null)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-[10px]"
              />
            </label>
            <button
              type="submit"
              disabled={documentUploading || !isSupabaseConfigured}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {documentUploading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
              Simpan dokumen customer
            </button>
            {!isSupabaseConfigured && <p className="text-[10px] text-amber-700">Supabase belum dikonfigurasi.</p>}
          </form>
        </div>
        {documentError && <p role="alert" className="mx-4 mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">{documentError}</p>}
      </section>

      {/* Table: Freight Forwarding Job History */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900">Freight Forwarding Job History</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                18 Total Jobs
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Consolidated manifests, customs clearances, and multi-modal forwardings
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs"
            >
              <option value="2025">Filter: Year 2025</option>
              <option value="2026">Filter: Year 2026</option>
            </select>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs"
            >
              <option value="All">Mode: All</option>
              <option value="Sea">Sea Freight</option>
              <option value="Air">Air Freight</option>
            </select>
            <select
              value={tradeFilter}
              onChange={(e) => setTradeFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs"
            >
              <option value="All">Trade: All</option>
              <option value="Export">Export</option>
              <option value="Import">Import</option>
            </select>
            <button className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">JOB NUMBER</th>
                <th className="py-3 px-4">DATE</th>
                <th className="py-3 px-4">EXPORT / IMPORT</th>
                <th className="py-3 px-4">AIR / SEA</th>
                <th className="py-3 px-4">CURRENT STATUS</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alfamartJobs.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-slate-900">
                      <span className="text-[#b91c1c]">#</span>{item.jobNo.replace('#', '')}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{item.blNo}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {item.date}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                      {item.trade === 'Export' ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>{item.trade}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      {item.isSea ? (
                        <Ship className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <Plane className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>{item.mode}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.route}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {item.statusType === 'customs' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Customs Process
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Completed
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition">
                      View Job
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <strong>1 to 5</strong> of <strong>18</strong> jobs
          </div>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 text-xs">
              Previous
            </button>
            <button className="px-2.5 py-1 rounded bg-[#b91c1c] text-white font-bold text-xs">
              1
            </button>
            <button className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs">
              2
            </button>
            <button className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs">
              3
            </button>
            <button className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs">
              4
            </button>
            <button className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-red-600 shrink-0" />
          <span>
            Account Assigned to Sales Rep: <strong className="text-slate-800">Andi Pratama</strong> (Monthly Target: 4 FCL movements).
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a href="#contract" className="text-slate-700 hover:text-red-700 font-semibold underline text-xs">
            View Contract Agreement (PDF)
          </a>
          <span>•</span>
          <a href="#ledger" className="text-slate-700 hover:text-red-700 font-semibold underline text-xs">
            Customer Ledger
          </a>
        </div>
      </div>
    </div>
  );
};
