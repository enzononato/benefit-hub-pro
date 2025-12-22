-- 1. FIX: Logs table - only system (via security definer functions) should insert
-- The logs are created via create_system_log function which is SECURITY DEFINER
-- Adding explicit deny for authenticated users trying to insert directly
CREATE POLICY "Deny direct inserts to logs" 
ON public.logs 
FOR INSERT 
TO authenticated
WITH CHECK (false);

-- 2. FIX: Notifications - restrict insert to service role / system only
-- First drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a restrictive policy - only allow inserts from triggers/functions (no user_id context)
-- Notifications are created by database triggers, not directly by users
CREATE POLICY "Only system can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() IS NULL);

-- 3. FIX: Benefit requests - users should NOT be able to update their own requests
-- They can only create and view
CREATE POLICY "Users cannot update own requests" 
ON public.benefit_requests 
FOR UPDATE 
TO authenticated
USING (
  -- Only admin, gestor, or agente_dp can update
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'gestor'::app_role) OR 
  has_role(auth.uid(), 'agente_dp'::app_role)
);

-- 4. FIX: Payment receipts - only admin can insert (receipts are uploaded by admin after payment)
CREATE POLICY "Only admin can insert receipts" 
ON public.payment_receipts 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. FIX: Profiles - INSERT is handled by the handle_new_user trigger (SECURITY DEFINER)
-- Deny direct inserts from users
CREATE POLICY "Deny direct profile inserts" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (false);

-- 6. FIX: User roles - ensure only admin can insert (already covered by "Admin can do all" but let's be explicit)
-- The existing policy should cover this, but adding explicit deny for non-admins
CREATE POLICY "Only admin can insert roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));