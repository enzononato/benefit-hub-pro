-- Primeiro, criar o novo enum com os tipos corretos
CREATE TYPE public.benefit_type_new AS ENUM ('autoescola', 'farmacia', 'oficina', 'vale_gas', 'papelaria', 'otica', 'outros');

-- Atualizar a coluna para usar o novo tipo
ALTER TABLE public.benefit_requests 
  ALTER COLUMN benefit_type TYPE benefit_type_new 
  USING (
    CASE benefit_type::text
      WHEN 'outros' THEN 'outros'::benefit_type_new
      ELSE 'outros'::benefit_type_new
    END
  );

-- Remover o enum antigo e renomear o novo
DROP TYPE public.benefit_type;
ALTER TYPE public.benefit_type_new RENAME TO benefit_type;