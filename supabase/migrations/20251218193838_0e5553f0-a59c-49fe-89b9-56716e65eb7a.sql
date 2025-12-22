-- Remove foreign key constraint from logs table
-- Logs should work even when user_id is NULL (system operations) or when user is deleted

ALTER TABLE public.logs DROP CONSTRAINT IF EXISTS logs_user_id_fkey;

-- Also update the trigger to handle bot context (no authenticated user)
CREATE OR REPLACE FUNCTION public.log_benefit_request_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- For bot-created requests, use the request owner's user_id
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
        COALESCE(auth.uid(), NEW.reviewed_by, NEW.closed_by)
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