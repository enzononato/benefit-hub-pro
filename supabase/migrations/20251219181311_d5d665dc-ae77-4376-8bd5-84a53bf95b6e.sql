-- Allow gestor and agente_dp to view user_roles (needed to filter out system users from colaboradores list)
CREATE POLICY "Gestor can view all user_roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Agente DP can view all user_roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'agente_dp'::app_role));