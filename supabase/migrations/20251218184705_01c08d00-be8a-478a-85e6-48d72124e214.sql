-- 1. Remover a política temporária perigosa de payment_receipts
DROP POLICY IF EXISTS "Temporary allow read payment_receipts" ON payment_receipts;

-- 2. Adicionar política explícita negando acesso anônimo à tabela profiles
-- (garante que apenas usuários autenticados podem acessar)
CREATE POLICY "Deny anonymous access to profiles"
ON profiles
FOR SELECT
TO anon
USING (false);

-- 3. Adicionar política explícita negando acesso anônimo à tabela payment_receipts
CREATE POLICY "Deny anonymous access to payment_receipts"
ON payment_receipts
FOR SELECT
TO anon
USING (false);