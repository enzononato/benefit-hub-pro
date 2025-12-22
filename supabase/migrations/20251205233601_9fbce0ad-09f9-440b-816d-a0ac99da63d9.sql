-- Add temporary INSERT policy for benefit_requests
-- This is temporary until proper Supabase Auth is implemented

CREATE POLICY "Temporary allow insert benefit_requests"
ON public.benefit_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);