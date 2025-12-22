-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to notify on benefit request changes
CREATE OR REPLACE FUNCTION public.notify_benefit_request_change()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT;
  target_user_id UUID;
BEGIN
  -- For new requests, notify admins/gestors (we'll handle this differently via application logic)
  IF TG_OP = 'INSERT' THEN
    notification_title := 'Nova Solicitação';
    notification_message := 'Novo pedido de benefício criado: ' || NEW.protocol;
    notification_type := 'new_request';
    
    -- Insert notification for all admins
    INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id)
    SELECT ur.user_id, notification_title, notification_message, notification_type, 'benefit_request', NEW.id
    FROM user_roles ur
    WHERE ur.role = 'admin';
    
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Notify the request owner about status change
    CASE NEW.status
      WHEN 'em_analise' THEN
        notification_title := 'Solicitação em Análise';
        notification_message := 'Sua solicitação ' || NEW.protocol || ' está sendo analisada.';
        notification_type := 'status_update';
      WHEN 'aprovada' THEN
        notification_title := 'Solicitação Aprovada';
        notification_message := 'Sua solicitação ' || NEW.protocol || ' foi aprovada!';
        notification_type := 'approved';
      WHEN 'recusada' THEN
        notification_title := 'Solicitação Recusada';
        notification_message := 'Sua solicitação ' || NEW.protocol || ' foi recusada.';
        notification_type := 'rejected';
      WHEN 'concluida' THEN
        notification_title := 'Solicitação Concluída';
        notification_message := 'Sua solicitação ' || NEW.protocol || ' foi concluída.';
        notification_type := 'completed';
      ELSE
        RETURN NEW;
    END CASE;
    
    INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id)
    VALUES (NEW.user_id, notification_title, notification_message, notification_type, 'benefit_request', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER on_benefit_request_change
AFTER INSERT OR UPDATE ON public.benefit_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_benefit_request_change();