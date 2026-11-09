-- ==============================================================================
-- SISTEM INFORMASI MANAJEMEN FREIGHT FORWARDING PT HOPELMAR INTERNATIONAL
-- DATABASE SCHEMA & INITIAL SEED FOR SUPABASE (POSTGRESQL)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM (

  'sales_marketing',
  'sales_support',
  'exim',
  'admin_invoice',
  'accounting'
=======
  'sales',
  'sales_support',
  'customer_service',
  'finance',
  'manager'
>>>>>>> 813a504b7d5a700a51412b1f909548bb936c32fe
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
<<<<<<< HEAD
  'revision_requested',
=======
>>>>>>> 813a504b7d5a700a51412b1f909548bb936c32fe
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
<<<<<<< HEAD
  username TEXT,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'sales_marketing',
=======
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'sales',
>>>>>>> 813a504b7d5a700a51412b1f909548bb936c32fe
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

<<<<<<< HEAD
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (LOWER(username))
  WHERE username IS NOT NULL;

=======
>>>>>>> 813a504b7d5a700a51412b1f909548bb936c32fe
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
<<<<<<< HEAD
  customer_type TEXT NOT NULL DEFAULT 'regular' CHECK (customer_type IN ('regular', 'incidental')),
  workflow_stage TEXT NOT NULL DEFAULT 'customer_review'
    CHECK (workflow_stage IN ('customer_review', 'revision_requested', 'legality_check', 'ready_for_support', 'job_created')),
  revision_number INT NOT NULL DEFAULT 0 CHECK (revision_number >= 0),
=======
>>>>>>> 813a504b7d5a700a51412b1f909548bb936c32fe
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
<<<<<<< HEAD
  workflow_stage TEXT NOT NULL DEFAULT 'legacy'
    CHECK (workflow_stage IN ('legacy', 'exim_work', 'needs_extra_cost_decision', 'support_extra_cost', 'ready_for_invoice', 'invoiced')),
  incoterm TEXT,
  documents_complete BOOLEAN NOT NULL DEFAULT FALSE,
  additional_cost NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (additional_cost >= 0),
  selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  costing_total NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (costing_total >= 0),
=======
>>>>>>> 813a504b7d5a700a51412b1f909548bb936c32fe
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
<<<<<<< HEAD
  delivery_status TEXT NOT NULL DEFAULT 'draft' CHECK (delivery_status IN ('draft', 'sent')),
=======
>>>>>>> 813a504b7d5a700a51412b1f909548bb936c32fe
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

<<<<<<< HEAD
CREATE TABLE IF NOT EXISTS public.pnl_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_count INT NOT NULL DEFAULT 0,
  total_revenue NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  margin NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

=======
>>>>>>> 813a504b7d5a700a51412b1f909548bb936c32fe
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
<<<<<<< HEAD
ALTER TABLE public.pnl_reports ENABLE ROW LEVEL SECURITY;
=======
>>>>>>> 813a504b7d5a700a51412b1f909548bb936c32fe

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

<<<<<<< HEAD
-- Accounting owns PNL and costing reports.
CREATE POLICY "Accounting can view costing"
=======
-- Finance & Manager only for financial records
CREATE POLICY "Finance & Manager can view costing"
>>>>>>> 813a504b7d5a700a51412b1f909548bb936c32fe
  ON public.job_costs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
<<<<<<< HEAD
      AND profiles.role IN ('accounting')
    )
  );

CREATE POLICY "Finance roles can view invoices"
=======
      AND profiles.role IN ('finance', 'manager')
    )
  );

CREATE POLICY "Finance & Manager can view invoices"
>>>>>>> 813a504b7d5a700a51412b1f909548bb936c32fe
  ON public.invoices FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
<<<<<<< HEAD
      AND profiles.role IN ('admin_invoice', 'accounting', 'sales_marketing')
    )
  );

CREATE POLICY "Accounting and Sales can view PNL reports"
  ON public.pnl_reports FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('accounting', 'sales_marketing')
    )
  );

-- Private document storage for Exim workflow. Upload is open to authenticated
-- demo users but restricted to each user's own folder.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-documents',
  'job-documents',
  FALSE,
  20971520,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Authenticated users can read job documents" ON storage.objects;
CREATE POLICY "Authenticated users can read job documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'job-documents');

DROP POLICY IF EXISTS "Exim can upload job documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload job documents for demo" ON storage.objects;
CREATE POLICY "Authenticated users can upload job documents for demo"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'job-documents'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

=======
      AND profiles.role IN ('finance', 'manager', 'sales')
    )
  );

>>>>>>> 813a504b7d5a700a51412b1f909548bb936c32fe
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
