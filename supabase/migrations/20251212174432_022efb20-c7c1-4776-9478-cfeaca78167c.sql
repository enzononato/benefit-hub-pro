-- Delete all user_roles first (due to foreign key constraints)
DELETE FROM public.user_roles;

-- Delete all profiles
DELETE FROM public.profiles;