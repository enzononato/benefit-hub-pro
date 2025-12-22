-- Remove temporary RLS policies from benefit_requests
DROP POLICY IF EXISTS "Temporary allow insert benefit_requests" ON public.benefit_requests;
DROP POLICY IF EXISTS "Temporary allow read benefit_requests" ON public.benefit_requests;
DROP POLICY IF EXISTS "Temporary allow update benefit_requests" ON public.benefit_requests;

-- Remove temporary RLS policies from logs
DROP POLICY IF EXISTS "Temporary allow read logs" ON public.logs;

-- Remove temporary RLS policies from notifications
DROP POLICY IF EXISTS "Temporary allow read notifications" ON public.notifications;

-- Remove temporary RLS policies from profiles
DROP POLICY IF EXISTS "Temporary allow delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Temporary allow insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Temporary allow read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Temporary allow update profiles" ON public.profiles;

-- Remove temporary RLS policies from units
DROP POLICY IF EXISTS "Temporary allow read units" ON public.units;

-- Remove temporary RLS policies from user_roles
DROP POLICY IF EXISTS "Temporary allow delete user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Temporary allow insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Temporary allow read user_roles" ON public.user_roles;