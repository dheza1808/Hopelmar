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
  | 'Operational' 
  | 'Quotation' 
  | 'Completed';

export type QuotationStatus = 
  | 'Approved' 
  | 'Waiting Confirmation' 
  | 'Draft' 
  | 'Rejected';

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
