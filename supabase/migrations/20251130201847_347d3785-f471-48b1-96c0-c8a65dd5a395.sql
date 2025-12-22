-- Remove foreign key constraint from profiles that references auth.users
-- since we're not using Supabase auth
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Also remove foreign key constraint from user_roles
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;