-- Adicionar colunas para integração com Chatwoot
ALTER TABLE public.benefit_requests
ADD COLUMN account_id BIGINT,
ADD COLUMN conversation_id BIGINT;

-- Atualizar a função RPC para incluir os novos parâmetros
CREATE OR REPLACE FUNCTION public.create_request_from_bot(
  p_cpf text, 
  p_protocol text, 
  p_name text, 
  p_benefit_text text,
  p_account_id bigint DEFAULT NULL,
  p_conversation_id bigint DEFAULT NULL
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_clean_cpf TEXT;
  v_user_id UUID;
  v_full_name TEXT;
  v_benefit_type benefit_type;
  v_benefit_text_lower TEXT;
  v_new_request_id UUID;
BEGIN
  -- 1. Limpar o CPF (remover tudo que não é número)
  v_clean_cpf := regexp_replace(p_cpf, '[^0-9]', '', 'g');
  
  -- 2. Buscar usuário pelo CPF na tabela profiles (incluindo full_name)
  SELECT user_id, full_name INTO v_user_id, v_full_name
  FROM profiles
  WHERE regexp_replace(cpf, '[^0-9]', '', 'g') = v_clean_cpf
  LIMIT 1;
  
  -- 3. Mapear benefit_text para o enum benefit_type
  v_benefit_text_lower := lower(trim(p_benefit_text));
  
  CASE
    WHEN v_benefit_text_lower IN ('autoescola', 'auto escola', 'auto-escola', 'cnh', 'habilitação') THEN
      v_benefit_type := 'autoescola';
    WHEN v_benefit_text_lower IN ('farmacia', 'farmácia', 'remédio', 'remedio', 'medicamento') THEN
      v_benefit_type := 'farmacia';
    WHEN v_benefit_text_lower IN ('oficina', 'mecânico', 'mecanico', 'carro', 'moto', 'veículo', 'veiculo') THEN
      v_benefit_type := 'oficina';
    WHEN v_benefit_text_lower IN ('vale gas', 'vale gás', 'vale-gas', 'vale-gás', 'gás', 'gas', 'botijão', 'botijao') THEN
      v_benefit_type := 'vale_gas';
    WHEN v_benefit_text_lower IN ('papelaria', 'material escolar', 'escola', 'escolar', 'caderno', 'livro') THEN
      v_benefit_type := 'papelaria';
    WHEN v_benefit_text_lower IN ('otica', 'ótica', 'óculos', 'oculos', 'lente', 'lentes') THEN
      v_benefit_type := 'otica';
    ELSE
      v_benefit_type := 'outros';
  END CASE;
  
  -- 4. Verificar se encontrou o usuário
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'user_not_found',
      'message', 'Usuário não encontrado com o CPF informado: ' || p_cpf
    );
  END IF;
  
  -- 5. Inserir a solicitação (incluindo account_id e conversation_id)
  INSERT INTO benefit_requests (
    user_id,
    protocol,
    benefit_type,
    status,
    details,
    account_id,
    conversation_id
  ) VALUES (
    v_user_id,
    p_protocol,
    v_benefit_type,
    'aberta',
    'Solicitação criada via WhatsApp Bot. Colaborador: ' || v_full_name,
    p_account_id,
    p_conversation_id
  )
  RETURNING id INTO v_new_request_id;
  
  -- 6. Retornar sucesso (incluindo collaborator_name)
  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_new_request_id,
    'user_id', v_user_id,
    'protocol', p_protocol,
    'benefit_type', v_benefit_type::text,
    'collaborator_name', v_full_name
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'database_error',
      'message', SQLERRM
    );
END;
$function$;