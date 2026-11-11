import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Job, JobDocument, JobStatus } from '../../types';
import { StatCard } from '../../components/shared/StatCard';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Modal } from '../../components/shared/Modal';
import { 
  Ship, 
  Anchor, 
  FileText, 
  CheckCircle, 
  Clock, 
  Upload, 
  ArrowRight, 
  Eye, 
  FileCheck 
} from 'lucide-react';

export const CSDashboard: React.FC = () => {
  const { jobs, documents, updateJobStatus, addDocument } = useAuth();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<JobDocument | null>(null);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);

  // New Document Upload State
  const [docForm, setDocForm] = useState({
    jobId: jobs[0]?.id || '',
    documentName: '',
    docType: 'B/L' as JobDocument['docType'],
  });

  const inTransitJobs = jobs.filter(j => j.status === 'in_transit');
  const customsJobs = jobs.filter(j => j.status === 'customs_clearance');

  const handleUpdateStatus = (jobId: string, newStatus: JobStatus) => {
    updateJobStatus(jobId, newStatus);
    if (selectedJob && selectedJob.id === jobId) {
      setSelectedJob({ ...selectedJob, status: newStatus });
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const j = jobs.find(job => job.id === docForm.jobId);
    if (!j) return;

    addDocument({
      jobId: j.id,
      jobNo: j.jobNo,
      documentName: docForm.documentName,
      docType: docForm.docType,
      fileUrl: 'https://example.com/docs/uploaded.pdf',
      status: 'Verified',
      uploadedBy: 'Rian (CS & Documentation)',
    });

    setIsUploadDocOpen(false);
    setDocForm({
      jobId: jobs[0]?.id || '',
      documentName: '',
      docType: 'B/L',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Service & Documentation</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
              SKPL-WF-14
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking jadwal pelayaran/penerbangan, dokumen kepabeanan (PEB/PIB), B/L, dan konfirmasi ke customer.
          </p>
        </div>

        <button
          onClick={() => setIsUploadDocOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-xs font-bold text-white shadow-md shadow-cyan-600/20 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Dokumen Shipping (B/L, PIB/PEB)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Kapal Dalam Pelayaran"
          value={inTransitJobs.length}
          subtitle="Shipment dalam perjalanan laut/udara"
          icon={Ship}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Customs Clearance (PPJK)"
          value={customsJobs.length}
          subtitle="Proses dokumen kepabeanan"
          icon={Anchor}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Total Dokumen Terverifikasi"
          value={documents.filter(d => d.status === 'Verified').length}
          subtitle="B/L, Packing List, Invoice lengkap"
          icon={CheckCircle}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* JOB LIST CS (SKPL-WF-15) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Job Tracking & Status Shipment (SKPL-WF-15)</h3>
            <p className="text-xs text-slate-500">Update tahapan pengiriman dari In-Transit hingga Delivered</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">No. Job</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Kapal / Carrier</th>
                <th className="py-3 px-4">ETD & ETA</th>
                <th className="py-3 px-4">Status Milestone</th>
                <th className="py-3 px-4 text-right">Kelola (WF-16)</th>
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
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    {job.vesselOrFlight || '-'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    {job.etd || 'TBD'} &rarr; {job.eta || 'TBD'}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-bold text-xs transition"
                    >
                      Update Milestone
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DOCUMENTS LIST CS (SKPL-WF-17) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Dokumen Pengiriman & Kepabeanan (SKPL-WF-17)</h3>
            <p className="text-xs text-slate-500">Semua file manifest, B/L, dan perizinan bea cukai yang terdaftar</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Nama Dokumen</th>
                <th className="py-3 px-4">No. Job</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Diupload Oleh</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-600" />
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
                  <td className="py-3.5 px-4">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                    >
                      Detail (WF-18)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* JOB DETAIL CS MODAL (SKPL-WF-16) */}
      <Modal
        isOpen={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
        title={`Update Status Pengiriman: ${selectedJob?.jobNo}`}
        maxWidth="lg"
      >
        {selectedJob && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Customer</p>
                <p className="font-bold text-slate-900 text-base">{selectedJob.customerName}</p>
                <p className="text-[11px] text-slate-500">{selectedJob.serviceType}</p>
              </div>
              <StatusBadge status={selectedJob.status} />
            </div>

            <div className="p-4 border border-slate-100 rounded-xl space-y-3">
              <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Ubah Milestone Pekerjaan:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedJob.id, 'booking_confirmed')}
                  className={`p-2.5 rounded-xl border text-left font-medium transition ${
                    selectedJob.status === 'booking_confirmed'
                      ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  1. Booking Confirmed
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedJob.id, 'in_transit')}
                  className={`p-2.5 rounded-xl border text-left font-medium transition ${
                    selectedJob.status === 'in_transit'
                      ? 'bg-amber-50 border-amber-300 text-amber-700 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  2. In Transit (Pelayaran)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedJob.id, 'customs_clearance')}
                  className={`p-2.5 rounded-xl border text-left font-medium transition ${
                    selectedJob.status === 'customs_clearance'
                      ? 'bg-purple-50 border-purple-300 text-purple-700 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  3. Customs Clearance (PPJK)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedJob.id, 'delivered')}
                  className={`p-2.5 rounded-xl border text-left font-medium transition ${
                    selectedJob.status === 'delivered'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  4. Delivered (Selesai Kirim)
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* DOCUMENT DETAIL CS MODAL (SKPL-WF-18) */}
      <Modal
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        title={`Detail Dokumen: ${selectedDoc?.documentName}`}
        maxWidth="md"
      >
        {selectedDoc && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor Job:</span>
                <span className="font-mono font-bold text-blue-600">{selectedDoc.jobNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kategori:</span>
                <span className="font-semibold text-slate-800">{selectedDoc.docType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Diupload Oleh:</span>
                <span className="font-semibold text-slate-800">{selectedDoc.uploadedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal Upload:</span>
                <span className="font-mono text-slate-600">{selectedDoc.uploadedAt}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500">Status Validasi:</span>
                <StatusBadge status={selectedDoc.status} />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* UPLOAD CS DOCUMENT MODAL */}
      <Modal
        isOpen={isUploadDocOpen}
        onClose={() => setIsUploadDocOpen(false)}
        title="Upload Dokumen Kepabeanan / B/L"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Nomor Job *
            </label>
            <select
              value={docForm.jobId}
              onChange={(e) => setDocForm({ ...docForm, jobId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none cursor-pointer bg-white"
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
              placeholder="Contoh: Original Master BL WHLU98421.pdf"
              value={docForm.documentName}
              onChange={(e) => setDocForm({ ...docForm, documentName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Jenis Dokumen *
            </label>
            <select
              value={docForm.docType}
              onChange={(e) => setDocForm({ ...docForm, docType: e.target.value as JobDocument['docType'] })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none cursor-pointer bg-white"
            >
              <option value="B/L">Bill of Lading (B/L)</option>
              <option value="AWB">Air Waybill (AWB)</option>
              <option value="PEB/PIB">PEB / PIB Bea Cukai</option>
              <option value="COO">Certificate of Origin</option>
              <option value="Delivery Order">Delivery Order (D/O)</option>
              <option value="Invoice">Commercial Invoice / Packing List</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsUploadDocOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
            >
              Upload Dokumen
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
