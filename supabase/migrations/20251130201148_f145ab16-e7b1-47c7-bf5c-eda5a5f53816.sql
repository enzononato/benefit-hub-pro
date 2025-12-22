-- Update RLS for units to allow anon access (since we're not using Supabase auth)
DROP POLICY IF EXISTS "Authenticated users can manage units" ON units;
DROP POLICY IF EXISTS "Units are viewable by authenticated users" ON units;

-- Allow anonymous users to manage units
CREATE POLICY "Allow all access to units"
ON units
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Also insert the default units if they don't exist
INSERT INTO units (name, code) VALUES
  ('Revalle Juazeiro', '04690106000115'),
  ('Revalle Bonfim', '04690106000387'),
  ('Revalle Petrolina', '07717961000160'),
  ('Revalle Ribeira do Pombal', '28098474000137'),
  ('Revalle Paulo Afonso', '28098474000218'),
  ('Revalle Alagoinhas', '54677520000162'),
  ('Revalle Serrinha', '54677520000243')
ON CONFLICT (code) DO NOTHING;