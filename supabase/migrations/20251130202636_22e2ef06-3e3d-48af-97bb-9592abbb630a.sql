-- Fix RLS for benefit_requests to allow anon access
DROP POLICY IF EXISTS "Users can view own requests" ON benefit_requests;
DROP POLICY IF EXISTS "Users can create own requests" ON benefit_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON benefit_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON benefit_requests;
DROP POLICY IF EXISTS "Gestores can view all requests" ON benefit_requests;
DROP POLICY IF EXISTS "Gestores can update requests" ON benefit_requests;

-- Allow anonymous users to manage benefit_requests
CREATE POLICY "Allow all access to benefit_requests"
ON benefit_requests
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Add birthday field to profiles (DD/MM format)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday TEXT;