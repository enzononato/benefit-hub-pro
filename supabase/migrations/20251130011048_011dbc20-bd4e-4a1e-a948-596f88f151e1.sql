-- Insert the 7 Revalle business units
INSERT INTO public.units (code, name) VALUES
  ('JUA', 'Revalle Juazeiro'),
  ('BON', 'Revalle Bonfim'),
  ('PET', 'Revalle Petrolina'),
  ('RIB', 'Revalle Ribeira do Pombal'),
  ('PAF', 'Revalle Paulo Afonso'),
  ('ALA', 'Revalle Alagoinhas'),
  ('SER', 'Revalle Serrinha')
ON CONFLICT DO NOTHING;