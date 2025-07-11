Para fazer login como SuperAdmin, você precisa primeiro criar um usuário com role 'superadmin' no banco de dados. Vou criar uma migração para inserir um usuário SuperAdmin:


-- Inserir usuário SuperAdmin
-- Primeiro, você precisa se registrar normalmente no sistema com um email/senha
-- Depois esta migração vai alterar seu role para superadmin

-- Para criar o primeiro SuperAdmin, você pode:
-- 1. Registrar-se normalmente no sistema (será criado como 'cliente')
-- 2. Executar esta migração para alterar o role

-- Exemplo: alterar o role do primeiro usuário registrado para superadmin
-- IMPORTANTE: Substitua o email abaixo pelo email que você usará para se registrar

-- Função para promover um usuário a superadmin pelo email
CREATE OR REPLACE FUNCTION promote_user_to_superadmin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Busca o usuário pelo email e atualiza o role para superadmin
  UPDATE public.profiles 
  SET role = 'superadmin',
      salon_id = NULL  -- SuperAdmin não pertence a nenhum salão específico
  WHERE id = (
    SELECT id 
    FROM auth.users 
    WHERE email = user_email
  );
  
  -- Verifica se o usuário foi encontrado e atualizado
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', user_email;
  END IF;
  
  RAISE NOTICE 'Usuário % promovido a SuperAdmin com sucesso', user_email;
END;
$$;

-- Exemplo de como usar a função (descomente e substitua o email):
-- SELECT promote_user_to_superadmin('seu-email@example.com');