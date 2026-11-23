BEGIN;

ALTER TABLE public.workflow_records
  DROP CONSTRAINT IF EXISTS workflow_records_record_type_check;
ALTER TABLE public.workflow_records
  ADD CONSTRAINT workflow_records_record_type_check
  CHECK (record_type IN (
    'customer',
    'quotation',
    'job',
    'invoice',
    'job_document',
    'pnl_report',
    'vendor',
    'vendor_bill',
    'field_task',
    'procurement_request',
    'petty_cash',
    'debit_note'
  ));

DROP POLICY IF EXISTS "Role based visibility for shared operational records" ON public.workflow_records;
CREATE POLICY "Role based visibility for shared operational records"
  ON public.workflow_records
  AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING (
    record_type NOT IN (
      'job_document',
      'pnl_report',
      'vendor',
      'vendor_bill',
      'field_task',
      'procurement_request',
      'petty_cash',
      'debit_note'
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND (
          (record_type = 'job_document' AND profiles.role::TEXT IN ('exim', 'sales_support', 'customer_service'))
          OR (record_type = 'pnl_report' AND profiles.role::TEXT IN ('accounting', 'manager', 'sales_marketing', 'sales'))
          OR (record_type IN ('vendor', 'vendor_bill')
            AND profiles.role::TEXT IN ('sales_support', 'admin_invoice', 'accounting', 'finance'))
          OR (record_type = 'field_task' AND profiles.role::TEXT IN ('exim', 'sales_support', 'customer_service'))
          OR (record_type IN ('procurement_request', 'petty_cash', 'debit_note')
            AND profiles.role::TEXT IN ('admin_invoice', 'accounting', 'finance', 'manager'))
        )
    )
  );

DROP POLICY IF EXISTS "Internal users insert shared operational records" ON public.workflow_records;
CREATE POLICY "Internal users insert shared operational records"
  ON public.workflow_records
  FOR INSERT TO authenticated
  WITH CHECK (
    updated_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND (
          (record_type = 'job_document' AND profiles.role::TEXT IN ('exim', 'sales_support', 'customer_service'))
          OR (record_type = 'pnl_report' AND profiles.role::TEXT IN ('accounting', 'manager'))
          OR (record_type IN ('vendor', 'vendor_bill') AND profiles.role::TEXT = 'sales_support')
          OR (record_type = 'field_task' AND profiles.role::TEXT IN ('exim', 'customer_service'))
          OR (record_type IN ('procurement_request', 'petty_cash', 'debit_note')
            AND profiles.role::TEXT IN ('admin_invoice', 'finance'))
        )
    )
  );

DROP POLICY IF EXISTS "Internal users update shared operational records" ON public.workflow_records;
CREATE POLICY "Internal users update shared operational records"
  ON public.workflow_records
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND (
          (record_type = 'job_document' AND profiles.role::TEXT IN ('exim', 'sales_support', 'customer_service'))
          OR (record_type = 'pnl_report' AND profiles.role::TEXT IN ('accounting', 'manager'))
          OR (record_type IN ('vendor', 'vendor_bill') AND profiles.role::TEXT = 'sales_support')
          OR (record_type = 'field_task' AND profiles.role::TEXT IN ('exim', 'customer_service'))
          OR (record_type IN ('procurement_request', 'petty_cash', 'debit_note')
            AND profiles.role::TEXT IN ('admin_invoice', 'finance'))
        )
    )
  )
  WITH CHECK (
    updated_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND (
          (record_type = 'job_document' AND profiles.role::TEXT IN ('exim', 'sales_support', 'customer_service'))
          OR (record_type = 'pnl_report' AND profiles.role::TEXT IN ('accounting', 'manager'))
          OR (record_type IN ('vendor', 'vendor_bill') AND profiles.role::TEXT = 'sales_support')
          OR (record_type = 'field_task' AND profiles.role::TEXT IN ('exim', 'customer_service'))
          OR (record_type IN ('procurement_request', 'petty_cash', 'debit_note')
            AND profiles.role::TEXT IN ('admin_invoice', 'finance'))
        )
    )
  );

COMMIT;
