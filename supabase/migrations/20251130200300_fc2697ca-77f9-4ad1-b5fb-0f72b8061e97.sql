-- Update RLS policies for units to allow authenticated users to manage
DROP POLICY IF EXISTS "Admins can manage units" ON units;

-- Allow authenticated users to manage units
CREATE POLICY "Authenticated users can manage units"
ON units
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);