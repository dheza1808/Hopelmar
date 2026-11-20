import React, { useEffect, useState } from 'react';
import { ExternalLink, LoaderCircle, UploadCloud } from 'lucide-react';
import type { UserProfile } from '../../types';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

const documentTypes = [
  { value: 'npwp_company', label: 'NPWP perusahaan' },
  { value: 'ktp_pic', label: 'KTP PIC' },
  { value: 'nib', label: 'NIB' },
  { value: 'siup', label: 'SIUP' },
  { value: 'api_nik', label: 'API / NIK kepabeanan' },
  { value: 'other', label: 'Lainnya' },
] as const;

type CustomerDocumentType = typeof documentTypes[number]['value'];

interface CustomerLegalDocument {
  id: string;
  document_type: CustomerDocumentType;
  document_name: string;
  file_path: string;
  created_at: string;
}

interface CustomerLegalDocumentsProps {
  customerKey: string;
  user: UserProfile | null;
}

export const CustomerLegalDocuments: React.FC<CustomerLegalDocumentsProps> = ({ customerKey, user }) => {
  const [documents, setDocuments] = useState<CustomerLegalDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState<CustomerDocumentType>('npwp_company');
  const [otherDocumentName, setOtherDocumentName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured) {
      setDocuments([]);
      return () => { active = false; };
    }

    setLoading(true);
    setErrorMessage('');
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('customer_documents')
          .select('id, document_type, document_name, file_path, created_at')
          .eq('customer_key', customerKey)
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (active) setDocuments((data || []) as CustomerLegalDocument[]);
      } catch (error) {
        if (active) setErrorMessage(error instanceof Error ? error.message : 'Dokumen customer gagal dimuat.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [customerKey]);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setErrorMessage('');
    if (!isSupabaseConfigured) {
      setErrorMessage('Supabase belum dikonfigurasi. Dokumen customer tidak dapat disimpan.');
      return;
    }
    if (!user?.id) {
      setErrorMessage('Sesi pengguna tidak tersedia. Silakan login kembali.');
      return;
    }
    if (!file) {
      setErrorMessage('Pilih file dokumen terlebih dahulu.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('Ukuran file maksimal 20 MB.');
      return;
    }
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      setErrorMessage('Format file harus PDF, JPG, atau PNG.');
      return;
    }
    if (documentType === 'other' && !otherDocumentName.trim()) {
      setErrorMessage('Isi nama dokumen untuk kategori Lainnya.');
      return;
    }

    setUploading(true);
    const safeCustomerKey = customerKey.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${safeCustomerKey}/${Date.now()}-${safeFileName}`;
    try {
      const { error: uploadError } = await supabase.storage
        .from('customer-documents')
        .upload(filePath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const name = documentType === 'other'
        ? otherDocumentName.trim()
        : documentTypes.find((item) => item.value === documentType)?.label || documentType;
      const { data, error: recordError } = await supabase
        .from('customer_documents')
        .insert({
          customer_key: customerKey,
          document_type: documentType,
          document_name: name,
          file_path: filePath,
          uploaded_by: user.id,
        })
        .select('id, document_type, document_name, file_path, created_at')
        .single();
      if (recordError) {
        const { error: cleanupError } = await supabase.storage.from('customer-documents').remove([filePath]);
        if (cleanupError) console.error('Failed to remove an orphaned customer document.', cleanupError);
        throw recordError;
      }

      setDocuments((current) => [data as CustomerLegalDocument, ...current]);
      setFile(null);
      setOtherDocumentName('');
      form.reset();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Dokumen customer gagal diunggah.');
    } finally {
      setUploading(false);
    }
  };

  const openDocument = async (filePath: string) => {
    setErrorMessage('');
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
      setErrorMessage(error instanceof Error ? `Dokumen tidak dapat dibuka: ${error.message}` : 'Dokumen tidak dapat dibuka.');
    }
  };

  return (
    <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)]">
      <div className="space-y-2">
        {loading ? (
          <p className="flex items-center gap-2 text-[10px] text-slate-500"><LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Memuat dokumen...</p>
        ) : documents.length ? documents.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-2.5">
            <div>
              <p className="text-[11px] font-bold text-slate-800">{item.document_name}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                {documentTypes.find((type) => type.value === item.document_type)?.label || 'Lainnya'}
                {' · '}{new Date(item.created_at).toLocaleDateString('id-ID')}
              </p>
            </div>
            <button type="button" onClick={() => void openDocument(item.file_path)} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-50">
              <ExternalLink className="h-3 w-3" /> Buka
            </button>
          </div>
        )) : (
          <p className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-[10px] text-slate-500">
            Belum ada dokumen legalitas untuk customer ini.
          </p>
        )}
      </div>
      <form onSubmit={handleUpload} className="grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-1">
        <label className="text-[10px] font-bold text-slate-700">
          Jenis dokumen
          <select value={documentType} onChange={(event) => setDocumentType(event.target.value as CustomerDocumentType)} className="mt-1 block w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-[11px]">
            {documentTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </label>
        {documentType === 'other' && (
          <label className="text-[10px] font-bold text-slate-700">
            Nama dokumen
            <input required value={otherDocumentName} onChange={(event) => setOtherDocumentName(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5 text-[11px]" />
          </label>
        )}
        <label className="text-[10px] font-bold text-slate-700">
          File (PDF/JPG/PNG, maks. 20 MB)
          <input required type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mt-1 block w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-[10px]" />
        </label>
        <button type="submit" disabled={uploading || !isSupabaseConfigured} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-[10px] font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
          {uploading ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <UploadCloud className="h-3 w-3" />}
          Simpan dokumen
        </button>
        {!isSupabaseConfigured && <p className="text-[10px] text-amber-700">Supabase belum dikonfigurasi.</p>}
      </form>
      {errorMessage && <p role="alert" className="rounded bg-red-50 p-2 text-[10px] text-red-700 lg:col-span-2">{errorMessage}</p>}
    </div>
  );
};
