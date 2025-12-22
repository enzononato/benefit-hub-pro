-- Add permissive SELECT policies to allow data visibility
-- These are temporary until proper Supabase Auth is implemented

-- Profiles: Allow all authenticated or anon to read (for display purposes)
CREATE POLICY "Temporary allow read profiles"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (true);

-- Benefit requests: Allow all to read
CREATE POLICY "Temporary allow read benefit_requests"
ON public.benefit_requests FOR SELECT
TO anon, authenticated
USING (true);

-- Units: Allow all to read
CREATE POLICY "Temporary allow read units"
ON public.units FOR SELECT
TO anon, authenticated
USING (true);

-- User roles: Allow all to read
CREATE POLICY "Temporary allow read user_roles"
ON public.user_roles FOR SELECT
TO anon, authenticated
USING (true);

-- Notifications: Allow all to read (temporary)
CREATE POLICY "Temporary allow read notifications"
ON public.notifications FOR SELECT
TO anon, authenticated
USING (true);

-- Payment receipts: Allow all to read
CREATE POLICY "Temporary allow read payment_receipts"
ON public.payment_receipts FOR SELECT
TO anon, authenticated
USING (true);

-- Logs: Allow all to read
CREATE POLICY "Temporary allow read logs"
ON public.logs FOR SELECT
TO anon, authenticated
USING (true);