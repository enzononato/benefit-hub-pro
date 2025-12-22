-- Adicionar campos necessários para o fluxo de benefícios
ALTER TABLE benefit_requests 
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS pdf_url text,
ADD COLUMN IF NOT EXISTS pdf_file_name text,
ADD COLUMN IF NOT EXISTS closed_by uuid,
ADD COLUMN IF NOT EXISTS closed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS closing_message text;

-- Criar bucket para armazenar PDFs de benefícios
INSERT INTO storage.buckets (id, name, public)
VALUES ('benefit-pdfs', 'benefit-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao bucket
CREATE POLICY "Permitir visualização pública de PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'benefit-pdfs');

CREATE POLICY "Permitir upload de PDFs para usuários autenticados"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'benefit-pdfs' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização de PDFs para usuários autenticados"
ON storage.objects FOR UPDATE
USING (bucket_id = 'benefit-pdfs' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão de PDFs para usuários autenticados"
ON storage.objects FOR DELETE
USING (bucket_id = 'benefit-pdfs' AND auth.role() = 'authenticated');