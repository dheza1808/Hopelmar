BEGIN;

CREATE TABLE IF NOT EXISTS public.customer_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_key TEXT NOT NULL,
  document_type TEXT NOT NULL
    CHECK (document_type IN ('npwp_company', 'ktp_pic', 'nib', 'siup', 'api_nik', 'other')),
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customer_documents_customer_key_created_at_idx
  ON public.customer_documents (customer_key, created_at DESC);

ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Internal users can access customer legal documents" ON public.customer_documents;
CREATE POLICY "Internal users can access customer legal documents"
  ON public.customer_documents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role::TEXT IN (
          'sales_marketing', 'sales_support', 'exim', 'admin_invoice', 'accounting',
          'sales', 'customer_service', 'finance', 'manager'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role::TEXT IN (
          'sales_marketing', 'sales_support', 'exim', 'admin_invoice', 'accounting',
          'sales', 'customer_service', 'finance', 'manager'
        )
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'customer-documents',
  'customer-documents',
  FALSE,
  20971520,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Internal users can access private customer documents" ON storage.objects;
CREATE POLICY "Internal users can access private customer documents"
  ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'customer-documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role::TEXT IN (
          'sales_marketing', 'sales_support', 'exim', 'admin_invoice', 'accounting',
          'sales', 'customer_service', 'finance', 'manager'
        )
    )
  )
  WITH CHECK (
    bucket_id = 'customer-documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role::TEXT IN (
          'sales_marketing', 'sales_support', 'exim', 'admin_invoice', 'accounting',
          'sales', 'customer_service', 'finance', 'manager'
        )
    )
  );

COMMIT;
