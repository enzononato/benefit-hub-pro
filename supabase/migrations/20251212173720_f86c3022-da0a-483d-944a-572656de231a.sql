-- Add DELETE policy for profiles table (admin can delete)
CREATE POLICY "Admin can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add temporary permissive DELETE policy for profiles (matching existing temporary policies)
CREATE POLICY "Temporary allow delete profiles" 
ON public.profiles 
FOR DELETE 
USING (true);

-- Add DELETE policy for user_roles table (matching existing admin policy pattern)
CREATE POLICY "Admin can delete user_roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add temporary permissive DELETE policy for user_roles
CREATE POLICY "Temporary allow delete user_roles" 
ON public.user_roles 
FOR DELETE 
USING (true);