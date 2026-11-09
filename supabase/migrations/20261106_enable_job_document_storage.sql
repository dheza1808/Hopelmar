BEGIN;

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

COMMIT;
