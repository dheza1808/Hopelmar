BEGIN;

CREATE TABLE IF NOT EXISTS public.workflow_records (
  record_type TEXT NOT NULL CHECK (record_type IN ('customer', 'quotation', 'job', 'invoice')),
  record_id TEXT NOT NULL,
  payload JSONB NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  updated_by UUID NOT NULL REFERENCES public.profiles(id),
  should_notify BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (record_type, record_id)
);

ALTER TABLE public.workflow_records
  DROP CONSTRAINT IF EXISTS workflow_records_record_type_check;
ALTER TABLE public.workflow_records
  ADD CONSTRAINT workflow_records_record_type_check
  CHECK (record_type IN ('customer', 'quotation', 'job', 'invoice'));

CREATE INDEX IF NOT EXISTS workflow_records_updated_at_idx
  ON public.workflow_records (updated_at DESC);

ALTER TABLE public.workflow_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Internal users read shared workflow records" ON public.workflow_records;
CREATE POLICY "Internal users read shared workflow records"
  ON public.workflow_records
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('sales_marketing', 'sales_support', 'exim', 'admin_invoice', 'accounting')
    )
  );

DROP POLICY IF EXISTS "Sales manage shared customers" ON public.workflow_records;
DROP POLICY IF EXISTS "Sales insert shared customers" ON public.workflow_records;
DROP POLICY IF EXISTS "Sales update shared customers" ON public.workflow_records;
CREATE POLICY "Sales insert shared customers"
  ON public.workflow_records
  FOR INSERT TO authenticated
  WITH CHECK (
    record_type = 'customer'
    AND updated_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'sales_marketing'
    )
  );
CREATE POLICY "Sales update shared customers"
  ON public.workflow_records
  FOR UPDATE TO authenticated
  USING (
    record_type = 'customer'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'sales_marketing'
    )
  )
  WITH CHECK (
    record_type = 'customer'
    AND updated_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'sales_marketing'
    )
  );

DROP POLICY IF EXISTS "Sales and support manage quotations" ON public.workflow_records;
DROP POLICY IF EXISTS "Sales and support insert quotations" ON public.workflow_records;
DROP POLICY IF EXISTS "Sales and support update quotations" ON public.workflow_records;
CREATE POLICY "Sales and support insert quotations"
  ON public.workflow_records
  FOR INSERT TO authenticated
  WITH CHECK (
    record_type = 'quotation'
    AND updated_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('sales_marketing', 'sales_support')
    )
  );
CREATE POLICY "Sales and support update quotations"
  ON public.workflow_records
  FOR UPDATE TO authenticated
  USING (
    record_type = 'quotation'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('sales_marketing', 'sales_support')
    )
  )
  WITH CHECK (
    record_type = 'quotation'
    AND updated_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('sales_marketing', 'sales_support')
    )
  );

DROP POLICY IF EXISTS "Operations manage shared jobs" ON public.workflow_records;
DROP POLICY IF EXISTS "Operations insert shared jobs" ON public.workflow_records;
DROP POLICY IF EXISTS "Operations update shared jobs" ON public.workflow_records;
CREATE POLICY "Operations insert shared jobs"
  ON public.workflow_records
  FOR INSERT TO authenticated
  WITH CHECK (
    record_type = 'job'
    AND updated_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('sales_marketing', 'sales_support', 'exim', 'admin_invoice', 'accounting')
    )
  );
CREATE POLICY "Operations update shared jobs"
  ON public.workflow_records
  FOR UPDATE TO authenticated
  USING (
    record_type = 'job'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('sales_marketing', 'sales_support', 'exim', 'admin_invoice', 'accounting')
    )
  )
  WITH CHECK (
    record_type = 'job'
    AND updated_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('sales_marketing', 'sales_support', 'exim', 'admin_invoice', 'accounting')
    )
  );

DROP POLICY IF EXISTS "Finance insert shared invoices" ON public.workflow_records;
DROP POLICY IF EXISTS "Finance update shared invoices" ON public.workflow_records;
CREATE POLICY "Finance insert shared invoices"
  ON public.workflow_records
  FOR INSERT TO authenticated
  WITH CHECK (
    record_type = 'invoice'
    AND updated_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin_invoice', 'accounting')
    )
  );
CREATE POLICY "Finance update shared invoices"
  ON public.workflow_records
  FOR UPDATE TO authenticated
  USING (
    record_type = 'invoice'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin_invoice', 'accounting')
    )
  )
  WITH CHECK (
    record_type = 'invoice'
    AND updated_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin_invoice', 'accounting')
    )
  );

CREATE OR REPLACE FUNCTION public.set_workflow_record_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS workflow_records_set_updated_at ON public.workflow_records;
CREATE TRIGGER workflow_records_set_updated_at
  BEFORE UPDATE ON public.workflow_records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_workflow_record_updated_at();

CREATE OR REPLACE FUNCTION public.create_workflow_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  workflow_stage TEXT;
  recipient_role TEXT;
  notification_title TEXT;
  notification_message TEXT;
  notification_tab TEXT;
  source_key TEXT;
  item_label TEXT;
  customer_label TEXT;
BEGIN
  IF NOT NEW.should_notify THEN
    RETURN NEW;
  END IF;

  workflow_stage := NEW.payload ->> 'workflowStage';
  IF TG_OP = 'UPDATE' AND OLD.payload ->> 'workflowStage' IS NOT DISTINCT FROM workflow_stage THEN
    RETURN NEW;
  END IF;

  item_label := COALESCE(
    NEW.payload ->> 'invoiceNo',
    NEW.payload ->> 'quotationNo',
    NEW.payload ->> 'jobNo',
    NEW.payload ->> 'jobNumber',
    NEW.record_id
  );
  customer_label := COALESCE(NEW.payload ->> 'customerName', NEW.payload ->> 'customer', 'Customer');

  IF NEW.record_type = 'quotation' AND workflow_stage = 'ready_for_support' THEN
    recipient_role := 'sales_support';
    notification_title := 'Quotation siap diproses';
    notification_message := item_label || ' · ' || customer_label || ' siap dibuatkan Job Order.';
    notification_tab := 'job-orders';
  ELSIF NEW.record_type = 'job' AND workflow_stage = 'exim_work' THEN
    recipient_role := 'exim';
    notification_title := 'Job baru menunggu Exim';
    notification_message := item_label || ' · ' || customer_label || ' perlu dilengkapi dokumen dan Incoterm.';
    notification_tab := 'customs-documents';
  ELSIF NEW.record_type = 'job' AND workflow_stage IN ('needs_extra_cost_decision', 'support_extra_cost') THEN
    recipient_role := 'sales_support';
    notification_title := 'Job perlu tindak lanjut Support';
    notification_message := item_label || ' · ' || customer_label || ' menunggu keputusan atau input biaya tambahan.';
    notification_tab := 'extra-costs';
  ELSIF NEW.record_type = 'job' AND workflow_stage = 'ready_for_invoice' THEN
    recipient_role := 'admin_invoice';
    notification_title := 'Job siap dibuatkan invoice';
    notification_message := item_label || ' · ' || customer_label || ' menunggu invoice.';
    notification_tab := 'billing';
  ELSIF NEW.record_type = 'invoice' AND TG_OP = 'INSERT' THEN
    recipient_role := 'accounting';
    notification_title := 'Invoice baru masuk';
    notification_message := item_label || ' · ' || customer_label || ' perlu diperiksa.';
    notification_tab := 'billing';
  ELSE
    RETURN NEW;
  END IF;

  source_key := NEW.record_type || ':' || NEW.record_id || ':'
    || COALESCE(workflow_stage, NEW.payload ->> 'status', 'created')
    || ':' || NEW.updated_at::TEXT;

  INSERT INTO public.notifications (user_id, source_key, title, message, target_tab)
  SELECT profiles.id, source_key, notification_title, notification_message, notification_tab
  FROM public.profiles
  WHERE profiles.role = recipient_role
  ON CONFLICT (user_id, source_key) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS workflow_records_create_notifications ON public.workflow_records;
CREATE TRIGGER workflow_records_create_notifications
  AFTER INSERT OR UPDATE OF payload ON public.workflow_records
  FOR EACH ROW
  EXECUTE FUNCTION public.create_workflow_notifications();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'workflow_records'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.workflow_records';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'notifications'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
    END IF;
  END IF;
END;
$$;

COMMIT;
