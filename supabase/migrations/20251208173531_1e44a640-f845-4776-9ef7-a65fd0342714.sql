-- Adicionar política para permitir uploads no bucket benefit-pdfs
CREATE POLICY "Allow anonymous uploads to benefit-pdfs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'benefit-pdfs');

-- Adicionar política para permitir leitura no bucket benefit-pdfs
CREATE POLICY "Allow anonymous reads from benefit-pdfs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'benefit-pdfs');

-- Adicionar política temporária para permitir updates no benefit_requests
DROP POLICY IF EXISTS "Temporary allow update benefit_requests" ON public.benefit_requests;
CREATE POLICY "Temporary allow update benefit_requests"
ON public.benefit_requests
FOR UPDATE
USING (true)
WITH CHECK (true);