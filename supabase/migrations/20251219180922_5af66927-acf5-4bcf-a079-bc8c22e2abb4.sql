-- Drop existing restrictive policies for gestor
DROP POLICY IF EXISTS "Gestor can view unit requests" ON public.benefit_requests;
DROP POLICY IF EXISTS "Gestor can update unit requests" ON public.benefit_requests;
DROP POLICY IF EXISTS "Gestor can view unit profiles" ON public.profiles;
DROP POLICY IF EXISTS "Gestor can view unit receipts" ON public.payment_receipts;

-- Create new policies for gestor to see ALL data
CREATE POLICY "Gestor can view all requests" 
ON public.benefit_requests 
FOR SELECT 
USING (has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Gestor can update all requests" 
ON public.benefit_requests 
FOR UPDATE 
USING (has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Gestor can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Gestor can view all receipts" 
ON public.payment_receipts 
FOR SELECT 
USING (has_role(auth.uid(), 'gestor'::app_role));

-- Create policies for agente_dp to see benefit_requests and payment_receipts
CREATE POLICY "Agente DP can view all requests" 
ON public.benefit_requests 
FOR SELECT 
USING (has_role(auth.uid(), 'agente_dp'::app_role));

CREATE POLICY "Agente DP can update all requests" 
ON public.benefit_requests 
FOR UPDATE 
USING (has_role(auth.uid(), 'agente_dp'::app_role));

CREATE POLICY "Agente DP can view all receipts" 
ON public.payment_receipts 
FOR SELECT 
USING (has_role(auth.uid(), 'agente_dp'::app_role));

-- Agente DP needs to see profiles to display collaborator names in requests
CREATE POLICY "Agente DP can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'agente_dp'::app_role));