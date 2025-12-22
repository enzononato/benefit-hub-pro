-- Update RLS for profiles to allow anon access (since we're not using Supabase auth)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Gestores can view profiles in their unit" ON profiles;

-- Allow anonymous users to manage profiles
CREATE POLICY "Allow all access to profiles"
ON profiles
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Update RLS for user_roles to allow anon access
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Allow anonymous users to manage user_roles
CREATE POLICY "Allow all access to user_roles"
ON user_roles
FOR ALL
TO anon
USING (true)
WITH CHECK (true);