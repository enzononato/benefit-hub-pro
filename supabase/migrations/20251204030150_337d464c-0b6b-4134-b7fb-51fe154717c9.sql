-- Add temporary UPDATE policy for profiles
-- This is temporary until proper Supabase Auth is implemented

CREATE POLICY "Temporary allow update profiles"
ON public.profiles FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);