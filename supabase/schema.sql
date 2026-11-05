-- ==============================================================================
-- SISTEM INFORMASI MANAJEMEN FREIGHT FORWARDING PT HOPELMAR INTERNATIONAL
-- DATABASE SCHEMA & INITIAL SEED FOR SUPABASE (POSTGRESQL)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM (
  'sales',
  'sales_support',
  'customer_service',
  'finance',
  'manager'
);

CREATE TYPE job_status AS ENUM (
  'draft',
  'booking_confirmed',
  'in_transit',
  'customs_clearance',
  'delivered',
  'completed',
  'cancelled'
);

CREATE TYPE quotation_status AS ENUM (
  'draft',
  'sent_to_customer',
  'accepted',
  'rejected',
  'expired'
);

CREATE TYPE invoice_status AS ENUM (
  'draft',
  'unpaid',
  'partial',
  'paid',
  'overdue'
);

CREATE TYPE doc_type AS ENUM (
  'bill_of_lading',
  'packing_list',
  'commercial_invoice',
  'certificate_of_origin',
  'peb_pib',
  'delivery_order',
  'other'
);

-- 3. PROFILES TABLE (Linked with Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'sales',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  pic_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  tax_id TEXT, -- NPWP
  payment_term_days INT DEFAULT 30,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. QUOTATIONS TABLE
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_no TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  service_type TEXT NOT NULL, -- Sea Freight (FCL/LCL), Air Freight, Customs Brokerage
  cargo_description TEXT,
  total_selling_est NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_cost_est NUMERIC(15, 2) NOT NULL DEFAULT 0,
  estimated_margin NUMERIC(15, 2) GENERATED ALWAYS AS (total_selling_est - total_cost_est) STORED,
  status quotation_status DEFAULT 'draft',
  valid_until DATE NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. JOBS TABLE (Core operational entity)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_no TEXT UNIQUE NOT NULL, -- e.g. HPL-2026-089
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  quotation_id UUID REFERENCES public.quotations(id),
  service_type TEXT NOT NULL,
  status job_status DEFAULT 'draft',
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  assigned_support UUID REFERENCES public.profiles(id),
  assigned_cs UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SHIPMENTS TABLE
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID UNIQUE NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  vessel_or_flight TEXT,
  voyage_no TEXT,
  etd TIMESTAMPTZ, -- Estimated Time of Departure
  eta TIMESTAMPTZ, -- Estimated Time of Arrival
  master_bl_no TEXT,
  house_bl_no TEXT,
  container_no TEXT,
  seal_no TEXT,
  gross_weight_kg NUMERIC(10, 2) DEFAULT 0,
  measurement_cbm NUMERIC(10, 2) DEFAULT 0,
  shipper_name TEXT,
  consignee_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. JOB DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.job_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  doc_type doc_type NOT NULL,
  file_url TEXT NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Verified', 'Rejected')),
  uploaded_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. JOB COSTS TABLE (Actual vs Costing)
CREATE TABLE IF NOT EXISTS public.job_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- Ocean Freight, Trucking, THC, Customs Duty, Storage, Handling
  description TEXT NOT NULL,
  vendor_name TEXT,
  estimated_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  actual_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. INVOICES & BILLING TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_no TEXT UNIQUE NOT NULL, -- e.g. INV-HPL-2026-042
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_selling NUMERIC(15, 2) NOT NULL DEFAULT 0,
  status invoice_status DEFAULT 'unpaid',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount_paid NUMERIC(15, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL, -- Bank Transfer, Check, etc.
  reference_no TEXT,
  proof_file_url TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Read policy for authenticated users across operational tables
CREATE POLICY "Authenticated users can view operational data"
  ON public.customers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view jobs"
  ON public.jobs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view shipments"
  ON public.shipments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view job documents"
  ON public.job_documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view quotations"
  ON public.quotations FOR SELECT TO authenticated USING (true);

-- Finance & Manager only for financial records
CREATE POLICY "Finance & Manager can view costing"
  ON public.job_costs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('finance', 'manager')
    )
  );

CREATE POLICY "Finance & Manager can view invoices"
  ON public.invoices FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('finance', 'manager', 'sales')
    )
  );

-- ==============================================================================
-- 13. SEED DUMMY DATA FOR DEMO & TESTING
-- ==============================================================================
INSERT INTO public.customers (company_name, pic_name, email, phone, address, tax_id, payment_term_days)
VALUES 
  ('PT TOA Paint Indonesia', 'Budi Santoso', 'procurement@toapaint.co.id', '021-8934120', 'Kawasan Industri MM2100, Cikarang Barat, Bekasi', '01.345.678.9-411.000', 30),
  ('PT Riau Andalan Pulp & Paper', 'Siti Rahma', 'logistics@rapp.co.id', '0761-91234', 'Pangkalan Kerinci, Pelalawan, Riau', '02.456.789.1-216.000', 45),
  ('CV Sumber Makmur Ekspor', 'Hendra Wijaya', 'hendra@sumbermakmur.com', '0812-3456-7890', 'Jl. Pelabuhan No. 12, Tanjung Priok, Jakarta', '03.567.890.2-005.000', 14);

INSERT INTO public.jobs (job_no, customer_id, service_type, status, origin, destination)
SELECT 
  'HPL-2026-001', id, 'Ocean Freight FCL', 'in_transit', 'Jakarta Port (IDJKT)', 'Singapore Port (SGSIN)'
FROM public.customers WHERE company_name = 'PT TOA Paint Indonesia';

INSERT INTO public.jobs (job_no, customer_id, service_type, status, origin, destination)
SELECT 
  'HPL-2026-002', id, 'Customs Clearance & Trucking', 'customs_clearance', 'Port of Shanghai (CNSHA)', 'Pelabuhan Perawang, Riau'
FROM public.customers WHERE company_name = 'PT Riau Andalan Pulp & Paper';

INSERT INTO public.jobs (job_no, customer_id, service_type, status, origin, destination)
SELECT 
  'HPL-2026-003', id, 'Air Freight Express', 'delivered', 'Soekarno Hatta (CGK)', 'Kuala Lumpur Intl (KUL)'
FROM public.customers WHERE company_name = 'CV Sumber Makmur Ekspor';
