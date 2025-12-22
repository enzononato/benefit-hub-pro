-- Primeiro, vamos verificar se já existe um usuário admin e criar se não existir
-- Este script será executado manualmente ou precisará de um setup específico

-- Nota: O usuário admin@sistema.com precisa ser criado através do sistema de autenticação do Supabase
-- Após a criação do usuário, o trigger handle_new_user vai criar o profile automaticamente
-- E inserir o role 'colaborador' por padrão

-- O que precisamos fazer é:
-- 1. Após o usuário se registrar, atualizar o role para 'admin'
-- 2. Atualizar o nome no perfil

-- Criando o tipo 'gestor' se não existir (para o usuário DP)
-- O enum app_role já tem: admin, gestor, colaborador

-- Vamos criar uma função para promover um usuário a admin depois que ele se registrar
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Buscar o user_id pelo email no profiles
    SELECT user_id INTO target_user_id FROM profiles WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado com email: %', user_email;
    END IF;
    
    -- Atualizar ou inserir o role admin
    INSERT INTO user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Atualizar o nome no perfil
    UPDATE profiles 
    SET full_name = 'Administrador Geral'
    WHERE user_id = target_user_id;
END;
$$;