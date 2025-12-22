-- Add phone, gender and position fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN phone TEXT,
ADD COLUMN gender TEXT CHECK (gender IN ('masculino', 'feminino')),
ADD COLUMN position TEXT;