 
 import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Job, JobDocument } from '../../types';
import { StatCard } from '../../components/shared/StatCard';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Modal } from '../../components/shared/Modal';
import { 
  CheckCircle2, 
  Clock, 
  FileCheck, 
  FolderOpen, 
  ArrowRight, 
  UploadCloud, 
  Search, 
  ShieldCheck, 
  FileText 
} from 'lucide-react';

interface SupportDashboardProps {
  currentSubTab?: string;
}

export const SupportDashboard: React.FC<SupportDashboardProps> = ({
  currentSubTab = 'dashboard'
}) => {
  const { jobs, documents, addDocument, updateJobStatus } = useAuth();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Upload Doc Form
  const [docForm, setDocForm] = useState({
    jobId: jobs[0]?.id || '',
    documentName: '',
    docType: 'Packing List' as JobDocument['docType'],
  });

  const pendingVerificationJobs = jobs.filter(j => j.status === 'booking_confirmed' || j.status === 'draft');
  const verifiedJobs = jobs.filter(j => j.status !== 'booking_confirmed' && j.status !== 'draft');

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const j = jobs.find(job => job.id === docForm.jobId);
    if (!j) return;

    addDocument({
      jobId: j.id,
      jobNo: j.jobNo,
      documentName: docForm.documentName,
      docType: docForm.docType,
      fileUrl: 'https://example.com/uploads/doc.pdf',
      status: 'Verified',
      uploadedBy: 'Salsabila (Sales Support)',
    });

    setIsUploadOpen(false);
    setDocForm({
      jobId: jobs[0]?.id || '',
      documentName: '',
      docType: 'Packing List',
    });
  };

  const handleApproveJob = (jobId: string) => {
    updateJobStatus(jobId, 'in_transit');
    setSelectedJob(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales Support Dashboard</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              SKPL-WF-10
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Verifikasi kelengkapan informasi job dan dokumen awal sebelum diserahkan ke tim CS & Dokumentasi.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-600/20 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Dokumen Pendukung</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Menunggu Pemeriksaan"
          value={pendingVerificationJobs.length}
          subtitle="Job perlu diperiksa & verifikasi"
          icon={Clock}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Job Terverifikasi"
          value={verifiedJobs.length}
          subtitle="Diteruskan ke CS & Dokumentasi"
          icon={CheckCircle2}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Total Dokumen Terdaftar"
          value={documents.length}
          subtitle="Dokumen pengiriman tersimpan"
          icon={FileCheck}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
      </div>

      {/* SECTION 1: JOB LIST SALES SUPPORT (SKPL-WF-11) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Job Verification Queue (SKPL-WF-11)</h3>
            <p className="text-xs text-slate-500">Periksa detail rute, kapal/maskapai, dan kontainer untuk proses handover</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">No. Job</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Layanan</th>
                <th className="py-3 px-4">Rute Pengiriman</th>
                <th className="py-3 px-4">Status Saat Ini</th>
                <th className="py-3 px-4 text-right">Pemeriksaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                    {job.jobNo}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {job.customerName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {job.serviceType}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {job.origin} &rarr; {job.destination}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition"
                    >
                      Periksa (WF-13)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: DOCUMENT LIST (SKPL-WF-12) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Daftar Dokumen Masuk (SKPL-WF-12)</h3>
            <p className="text-xs text-slate-500">Arsip dokumen awal: B/L, Commercial Invoice, Packing List, dsb.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Nama Dokumen</th>
                <th className="py-3 px-4">No. Job Terkait</th>
                <th className="py-3 px-4">Tipe Dokumen</th>
                <th className="py-3 px-4">Diupload Oleh</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>{doc.documentName}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                    {doc.jobNo}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    {doc.docType}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {doc.uploadedBy}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    {doc.uploadedAt}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={doc.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* JOB DETAIL SALES SUPPORT MODAL (SKPL-WF-13) */}
      <Modal
        isOpen={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
        title={`Pemeriksaan Job Support: ${selectedJob?.jobNo}`}
        maxWidth="lg"
      >
        {selectedJob && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Customer</p>
                <p className="font-bold text-slate-900 text-base">{selectedJob.customerName}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{selectedJob.serviceType}</p>
              </div>
              <StatusBadge status={selectedJob.status} />
            </div>

            <div className="p-4 border border-slate-100 rounded-xl space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Rute Pengiriman:</span>
                <span className="font-bold text-slate-800">{selectedJob.origin} &rarr; {selectedJob.destination}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Kapal / Maskapai:</span>
                <span className="font-bold text-slate-800">{selectedJob.vesselOrFlight || 'Belum diisi'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">No. Container / Seal:</span>
                <span className="font-mono text-slate-800">{selectedJob.containerNo || 'Belum diisi'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Petugas Support:</span>
                <span className="font-semibold text-blue-600">{selectedJob.assignedSupport}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Tutup
              </button>
              
              <button
                type="button"
                onClick={() => handleApproveJob(selectedJob.id)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verifikasi & Teruskan ke CS</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* UPLOAD DOCUMENT MODAL */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Dokumen Awal Pekerjaan"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Pilih No. Job *
            </label>
            <select
              value={docForm.jobId}
              onChange={(e) => setDocForm({ ...docForm, jobId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer bg-white"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.jobNo} - {j.customerName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Nama Dokumen *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Packing List TOA Paint 40HC.pdf"
              value={docForm.documentName}
              onChange={(e) => setDocForm({ ...docForm, documentName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Kategori Dokumen *
            </label>
            <select
              value={docForm.docType}
              onChange={(e) => setDocForm({ ...docForm, docType: e.target.value as JobDocument['docType'] })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer bg-white"
            >
              <option value="Packing List">Packing List</option>
              <option value="Invoice">Commercial Invoice</option>
              <option value="B/L">Bill of Lading (B/L)</option>
              <option value="AWB">Air Waybill (AWB)</option>
              <option value="COO">Certificate of Origin (COO)</option>
              <option value="PEB/PIB">PEB / PIB (Pabean)</option>
              <option value="Other">Lainnya</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              Simpan Dokumen
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
