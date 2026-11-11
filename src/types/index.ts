export type UserRole = 
  | 'sales_marketing' 
  | 'sales_support' 
  | 'exim' 
  | 'admin_invoice' 
  | 'accounting';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarChar: string;
  title: string;
}

export interface CustomerAccount {
  id: string;
  code: string; // e.g. CUS-0012
  accountCode: string; // e.g. #ACC-ID-ALFA-901
  companyName: string;
  subName?: string; // e.g. (Alfamart Group)
  category: string; // e.g. FMCG / Retail Logistics Key Account
  contactPerson: string;
  roleTitle: string;
  phone: string;
  altPhone?: string;
  email: string;
  address: string;
  npwpVerified: boolean;
  totalJobs: number;
  activeJobs: number;
  closedJobs: number;
  totalTeu: number;
  airWeightKg: number;
  creditTerms: string; // e.g. 30 Days
  creditStatus: string; // e.g. Regular Standing
  industry: string;
  status: 'Active Client' | 'Inactive';
  region: string;
  picName?: string;
  totalRevenue?: number;
}

export type ShipmentMode = 
  | "Sea FCL (1×40'HC)" 
  | "Sea FCL (2×40'HC)" 
  | "Sea FCL (1×20'GP)" 
  | "Sea FCL 4×40'FR"
  | "Sea FCL 6×40'GP"
  | "Sea LCL (12 CBM)" 
  | "Sea LCL (18 CBM)" 
  | "Sea LCL"
  | "Air Express" 
  | "Air Freight (450 kg)"
  | "Air Freight";

export type JobCurrentStatus = 
  | 'Customs Process' 
  | 'Documentation' 
  | 'Exim' 
  | 'Quotation' 
  | 'Completed';

export type QuotationStatus = 
  | 'Approved' 
  | 'Waiting Confirmation' 
  | 'Draft' 
  | 'Rejected'
  | 'sent'
  | 'draft'
  | 'accepted'
  | 'rejected'
  | 'revision_requested';

export interface AssignedJob {
  id: string;
  jobNumber: string; // e.g. #JKT-2025-0891
  customer: string;
  customerId?: string;
  shipmentType: 'Export' | 'Import';
  mode: ShipmentMode | string;
  pol?: string;
  pod?: string;
  blNumber?: string;
  etdEta?: string; // e.g. 28 Oct / 02 Nov
  date?: string; // e.g. 22 Oct 2025
  currentStatus: JobCurrentStatus;
  quotationStatus?: QuotationStatus;
  runningDays?: string; // e.g. 4 Days
  assignedPic?: string;
}

export type JobStatus =
  | 'draft'
  | 'booking_confirmed'
  | 'in_transit'
  | 'customs_clearance'
  | 'delivered';

export interface Job extends AssignedJob {
  jobNo: string;
  customerName: string;
  serviceType: string;
  origin: string;
  destination: string;
  vesselOrFlight: string;
  containerNo: string;
  assignedSupport: string;
  etd: string;
  eta: string;
  status: JobStatus;
  sellingPrice: number;
  costingTotal: number;
  margin: number;
  quotationId: string | null;
  workflowStage: JobWorkflowStage;
  incoterm: string;
  documentsComplete: boolean;
  additionalCost: number;
}

export type QuotationWorkflowStage =
  | 'customer_review'
  | 'revision_requested'
  | 'legality_check'
  | 'ready_for_support'
  | 'job_created';

export type JobWorkflowStage =
  | 'legacy'
  | 'exim_work'
  | 'needs_extra_cost_decision'
  | 'support_extra_cost'
  | 'ready_for_invoice'
  | 'invoiced';

export type JobDocumentType =
  | 'B/L'
  | 'AWB'
  | 'MBL'
  | 'HBL'
  | 'SPPB'
  | 'PEB'
  | 'PIB'
  | 'PEB/PIB'
  | 'COO'
  | 'Delivery Order'
  | 'Invoice'
  | 'Packing List';

export interface JobDocument {
  id: string;
  jobId: string;
  jobNo: string;
  documentName: string;
  docType: JobDocumentType;
  fileUrl: string;
  status: 'Verified' | 'Pending' | 'Rejected';
  uploadedBy: string;
  uploadedAt: string;
}

export interface Quotation {
  id: string;
  quotationNo: string;
  customerId: string;
  customerName: string;
  origin: string;
  destination: string;
  serviceType: string;
  cargoDescription: string;
  totalSellingEst: number;
  totalCostEst: number;
  estimatedMargin: number;
  status: QuotationStatus;
  validUntil: string;
  issuedAt?: string;
  paymentTerms?: string;
  notes?: string;
  subtotal?: number;
  taxAmount?: number;
  lineItems?: QuotationLineItem[];
  customerType: 'regular' | 'incidental';
  workflowStage: QuotationWorkflowStage;
  revisionNumber: number;
}

export interface QuotationLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';
export type PaymentMethod = 'Kredit' | 'COD';

export interface Invoice {
  id: string;
  jobId: string;
  invoiceNo: string;
  jobNo: string;
  customerName: string;
  totalSelling: number;
  totalPaid: number;
  outstandingBalance: number;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  status: InvoiceStatus;
  deliveryStatus: 'draft' | 'sent';
  paymentMethod: PaymentMethod;
}

export interface PnlReport {
  id: string;
  createdAt: string;
  jobCount: number;
  totalRevenue: number;
  totalCost: number;
  margin: number;
}

export interface Vendor {
  id: string;
  name: string;
  type: string;
  contact: string;
}

export interface VendorBill {
  id: string;
  vendorId: string;
  vendorName: string;
  jobNumber: string;
  amount: number;
  invoiceNumber: string;
  reconciled: boolean;
}

export interface FieldTask {
  id: string;
  jobId: string;
  jobNumber: string;
  description: string;
  completed: boolean;
}

export interface ProcurementRequest {
  id: string;
  description: string;
  amount: number;
  status: 'Diajukan' | 'Disetujui' | 'Ditolak';
  createdAt: string;
}

export interface PettyCashEntry {
  id: string;
  description: string;
  amount: number;
  createdAt: string;
}

export interface DebitNote {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  jobNumber: string;
  customerName: string;
  amount: number;
  reason: string;
  createdAt: string;
}
