-- Add temporary INSERT policies for profiles and user_roles
-- These are temporary until proper Supabase Auth is implemented

-- Profiles: Allow insert for anyone (temporary)
CREATE POLICY "Temporary allow insert profiles"
ON public.profiles FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- User roles: Allow insert for anyone (temporary)
CREATE POLICY "Temporary allow insert user_roles"
ON public.user_roles FOR INSERT
TO anon, authenticated
WITH CHECK (true);