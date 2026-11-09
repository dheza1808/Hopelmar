BEGIN;

ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.profiles
  ALTER COLUMN role TYPE TEXT USING role::TEXT;

UPDATE public.profiles
SET role = CASE role
  WHEN 'sales' THEN 'sales_marketing'
  WHEN 'customer_service' THEN 'exim'
  WHEN 'finance' THEN 'admin_invoice'
  WHEN 'manager' THEN 'accounting'
  ELSE role
END;

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'sales_marketing';
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_bpmn_check
  CHECK (role IN ('sales_marketing', 'sales_support', 'exim', 'admin_invoice', 'accounting'));

ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS customer_type TEXT NOT NULL DEFAULT 'regular',
  ADD COLUMN IF NOT EXISTS workflow_stage TEXT NOT NULL DEFAULT 'customer_review',
  ADD COLUMN IF NOT EXISTS revision_number INT NOT NULL DEFAULT 0;
ALTER TABLE public.quotations
  ADD CONSTRAINT quotations_customer_type_bpmn_check
    CHECK (customer_type IN ('regular', 'incidental')),
  ADD CONSTRAINT quotations_workflow_stage_bpmn_check
    CHECK (workflow_stage IN ('customer_review', 'revision_requested', 'legality_check', 'ready_for_support', 'job_created')),
  ADD CONSTRAINT quotations_revision_number_bpmn_check
    CHECK (revision_number >= 0);

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS workflow_stage TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS incoterm TEXT,
  ADD COLUMN IF NOT EXISTS documents_complete BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS additional_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS costing_total NUMERIC(15, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_workflow_stage_bpmn_check
    CHECK (workflow_stage IN ('legacy', 'exim_work', 'needs_extra_cost_decision', 'support_extra_cost', 'ready_for_invoice', 'invoiced')),
  ADD CONSTRAINT jobs_additional_cost_bpmn_check CHECK (additional_cost >= 0),
  ADD CONSTRAINT jobs_selling_price_bpmn_check CHECK (selling_price >= 0),
  ADD CONSTRAINT jobs_costing_total_bpmn_check CHECK (costing_total >= 0);

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS delivery_status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_delivery_status_bpmn_check
    CHECK (delivery_status IN ('draft', 'sent'));

CREATE TABLE IF NOT EXISTS public.pnl_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_count INT NOT NULL DEFAULT 0,
  total_revenue NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  margin NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.pnl_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Finance & Manager can view costing" ON public.job_costs;
DROP POLICY IF EXISTS "Finance & Manager can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Accounting can view costing" ON public.job_costs;
DROP POLICY IF EXISTS "Finance roles can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Accounting and Sales can view PNL reports" ON public.pnl_reports;

CREATE POLICY "Accounting can view costing"
  ON public.job_costs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'accounting'
    )
  );

CREATE POLICY "Finance roles can view invoices"
  ON public.invoices FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
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

COMMIT;
