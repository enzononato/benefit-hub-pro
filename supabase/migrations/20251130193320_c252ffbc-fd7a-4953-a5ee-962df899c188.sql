-- Inserir as 7 unidades fixas da Revalle
INSERT INTO public.units (name, code) VALUES
  ('Revalle Juazeiro', 'RVL-JUA'),
  ('Revalle Bonfim', 'RVL-BON'),
  ('Revalle Petrolina', 'RVL-PET'),
  ('Revalle Ribeira do Pombal', 'RVL-RIB'),
  ('Revalle Paulo Afonso', 'RVL-PAU'),
  ('Revalle Alagoinhas', 'RVL-ALA'),
  ('Revalle Serrinha', 'RVL-SER')
ON CONFLICT DO NOTHING;