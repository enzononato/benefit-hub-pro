-- Passo 1: Criar Funções Helper de Segurança

-- Função para obter o unit_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_my_unit_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unit_id FROM profiles WHERE user_id = auth.uid()
$$;

-- Função para verificar se um usuário está na mesma unidade
CREATE OR REPLACE FUNCTION public.is_same_unit(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.unit_id = p2.unit_id
    WHERE p1.user_id = auth.uid()
    AND p2.user_id = _user_id
  )
$$;

-- Função para verificar se é admin ou gestor
CREATE OR REPLACE FUNCTION public.is_admin_or_gestor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'gestor')
  )
$$;

-- Passo 2: Remover Políticas Antigas
DROP POLICY IF EXISTS "Allow all access to benefit_requests" ON benefit_requests;
DROP POLICY IF EXISTS "Allow all access to profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all access to units" ON units;
DROP POLICY IF EXISTS "Allow all access to user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow all access to logs" ON logs;
DROP POLICY IF EXISTS "Allow all access to payment_receipts" ON payment_receipts;

-- Passo 3: Políticas para profiles
CREATE POLICY "Admin can do all on profiles"
ON profiles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gestor can view unit profiles"
ON profiles FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'gestor') 
  AND unit_id = public.get_my_unit_id()
);

CREATE POLICY "User can view own profile"
ON profiles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "User can update own profile"
ON profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Passo 4: Políticas para benefit_requests
CREATE POLICY "Admin can do all on benefit_requests"
ON benefit_requests FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gestor can view unit requests"
ON benefit_requests FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'gestor') 
  AND public.is_same_unit(user_id)
);

CREATE POLICY "Gestor can update unit requests"
ON benefit_requests FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'gestor') 
  AND public.is_same_unit(user_id)
);

CREATE POLICY "User can view own requests"
ON benefit_requests FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "User can create own requests"
ON benefit_requests FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Passo 5: Políticas para units
CREATE POLICY "Admin can do all on units"
ON units FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gestor can view all units"
ON units FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "User can view own unit"
ON units FOR SELECT TO authenticated
USING (id = public.get_my_unit_id());

-- Passo 6: Políticas para user_roles
CREATE POLICY "Admin can do all on user_roles"
ON user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "User can view own role"
ON user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Passo 7: Políticas para logs
CREATE POLICY "Admin can view all logs"
ON logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can create logs"
ON logs FOR INSERT TO authenticated
WITH CHECK (true);

-- Passo 8: Políticas para payment_receipts
CREATE POLICY "Admin can do all on payment_receipts"
ON payment_receipts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gestor can view unit receipts"
ON payment_receipts FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'gestor') 
  AND EXISTS (
    SELECT 1 FROM benefit_requests br
    WHERE br.id = benefit_request_id
    AND public.is_same_unit(br.user_id)
  )
);

CREATE POLICY "User can view own receipts"
ON payment_receipts FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM benefit_requests br
    WHERE br.id = benefit_request_id
    AND br.user_id = auth.uid()
  )
);