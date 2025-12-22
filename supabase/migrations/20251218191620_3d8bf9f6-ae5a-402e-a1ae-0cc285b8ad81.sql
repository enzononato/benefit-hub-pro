-- 1. Remover a política de INSERT permissiva
DROP POLICY IF EXISTS "Authenticated can create logs" ON logs;

-- 2. Criar função SECURITY DEFINER para inserir logs (apenas o sistema pode usar)
CREATE OR REPLACE FUNCTION public.create_system_log(
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO logs (action, entity_type, entity_id, details, user_id)
  VALUES (p_action, p_entity_type, p_entity_id, p_details, COALESCE(p_user_id, auth.uid()))
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 3. Trigger para logar mudanças em benefit_requests
CREATE OR REPLACE FUNCTION public.log_benefit_request_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_system_log(
      'benefit_request_created',
      'benefit_request',
      NEW.id,
      jsonb_build_object('protocol', NEW.protocol, 'benefit_type', NEW.benefit_type, 'status', NEW.status),
      NEW.user_id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log apenas mudanças de status
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM create_system_log(
        'benefit_request_status_changed',
        'benefit_request',
        NEW.id,
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'protocol', NEW.protocol),
        auth.uid()
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_system_log(
      'benefit_request_deleted',
      'benefit_request',
      OLD.id,
      jsonb_build_object('protocol', OLD.protocol),
      auth.uid()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Criar o trigger
DROP TRIGGER IF EXISTS trg_log_benefit_requests ON benefit_requests;
CREATE TRIGGER trg_log_benefit_requests
AFTER INSERT OR UPDATE OR DELETE ON benefit_requests
FOR EACH ROW
EXECUTE FUNCTION log_benefit_request_changes();

-- 4. Trigger para logar mudanças em profiles (apenas para admins editando outros)
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND auth.uid() IS DISTINCT FROM NEW.user_id THEN
    -- Admin editando perfil de outro usuário
    PERFORM create_system_log(
      'profile_updated_by_admin',
      'profile',
      NEW.id,
      jsonb_build_object('target_user_id', NEW.user_id, 'full_name', NEW.full_name),
      auth.uid()
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_system_log(
      'profile_deleted',
      'profile',
      OLD.id,
      jsonb_build_object('user_id', OLD.user_id, 'full_name', OLD.full_name),
      auth.uid()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_log_profiles ON profiles;
CREATE TRIGGER trg_log_profiles
AFTER UPDATE OR DELETE ON profiles
FOR EACH ROW
EXECUTE FUNCTION log_profile_changes();

-- 5. Trigger para logar mudanças em user_roles
CREATE OR REPLACE FUNCTION public.log_user_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_system_log(
      'user_role_assigned',
      'user_role',
      NEW.id,
      jsonb_build_object('target_user_id', NEW.user_id, 'role', NEW.role),
      auth.uid()
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM create_system_log(
      'user_role_changed',
      'user_role',
      NEW.id,
      jsonb_build_object('target_user_id', NEW.user_id, 'old_role', OLD.role, 'new_role', NEW.role),
      auth.uid()
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_system_log(
      'user_role_removed',
      'user_role',
      OLD.id,
      jsonb_build_object('target_user_id', OLD.user_id, 'role', OLD.role),
      auth.uid()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_log_user_roles ON user_roles;
CREATE TRIGGER trg_log_user_roles
AFTER INSERT OR UPDATE OR DELETE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION log_user_role_changes();