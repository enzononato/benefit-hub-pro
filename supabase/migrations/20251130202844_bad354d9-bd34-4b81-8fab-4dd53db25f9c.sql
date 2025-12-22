-- Fix RLS for payment_receipts and logs to allow anon access
DROP POLICY IF EXISTS "Users can view own receipts" ON payment_receipts;
DROP POLICY IF EXISTS "Users can upload own receipts" ON payment_receipts;
DROP POLICY IF EXISTS "Admins can view all receipts" ON payment_receipts;

CREATE POLICY "Allow all access to payment_receipts"
ON payment_receipts
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view logs" ON logs;
DROP POLICY IF EXISTS "Authenticated can insert logs" ON logs;

CREATE POLICY "Allow all access to logs"
ON logs
FOR ALL
TO anon
USING (true)
WITH CHECK (true);