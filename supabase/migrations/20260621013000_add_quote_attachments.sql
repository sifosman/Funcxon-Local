-- Add attachments JSONB column to quote_revisions
ALTER TABLE public.quote_revisions
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT NULL;

-- Create storage bucket for quote attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-attachments', 'quote-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for quote-attachments bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to quote-attachments" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to quote-attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'quote-attachments');

DROP POLICY IF EXISTS "Allow authenticated select from quote-attachments" ON storage.objects;
CREATE POLICY "Allow authenticated select from quote-attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'quote-attachments');

DROP POLICY IF EXISTS "Allow public select from quote-attachments" ON storage.objects;
CREATE POLICY "Allow public select from quote-attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'quote-attachments');

DROP POLICY IF EXISTS "Allow authenticated delete own from quote-attachments" ON storage.objects;
CREATE POLICY "Allow authenticated delete own from quote-attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'quote-attachments' AND owner = auth.uid());
