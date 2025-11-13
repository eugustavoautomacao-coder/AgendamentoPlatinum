-- Script para criar o primeiro superadmin
-- Execute este SQL no Supabase Dashboard após criar as tabelas

-- IMPORTANTE: Substitua os valores abaixo antes de executar:
-- - 'admin@exemplo.com' pelo email desejado
-- - 'SenhaSegura123!' pela senha desejada
-- - 'Administrador' pelo nome desejado

-- 1. Criar usuário no Auth (usando função do Supabase)
-- Nota: Você precisará criar o usuário manualmente no Dashboard:
-- Dashboard → Authentication → Users → Add User
-- Ou usar a função create-superadmin via API

-- 2. Após criar o usuário no Auth, execute este SQL substituindo o UUID:
-- (O UUID será gerado quando você criar o usuário no Auth)

-- Exemplo de como obter o UUID:
-- 1. Crie o usuário no Dashboard → Authentication → Users
-- 2. Copie o UUID do usuário criado
-- 3. Execute o INSERT abaixo com o UUID correto

-- INSERT INTO public.users (id, email, nome, tipo, criado_em)
-- VALUES (
--   'UUID_DO_USUARIO_AQUI',  -- Substitua pelo UUID do usuário criado no Auth
--   'admin@exemplo.com',
--   'Administrador',
--   'system_admin',
--   now()
-- );

-- ALTERNATIVA: Criar via função SQL do Supabase
-- Esta função cria o usuário no Auth e na tabela users automaticamente

CREATE OR REPLACE FUNCTION create_superadmin(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Criar usuário no auth.users usando a extensão auth
  -- Nota: Isso requer permissões especiais
  -- A forma mais segura é criar via Dashboard ou Edge Function
  
  -- Por enquanto, vamos apenas inserir na tabela users
  -- O usuário deve ser criado primeiro no Auth Dashboard
  
  RAISE EXCEPTION 'Use o Dashboard do Supabase para criar o usuário no Auth primeiro, depois execute o INSERT na tabela users';
  
  RETURN v_result;
END;
$$;

-- INSTRUÇÕES PARA CRIAR O SUPERADMIN:
-- 
-- MÉTODO 1: Via Dashboard (Mais Fácil)
-- 1. Acesse: https://supabase.com/dashboard/project/buiqjpncuddpoamdcoco/auth/users
-- 2. Clique em "Add User" → "Create new user"
-- 3. Preencha:
--    - Email: admin@exemplo.com (ou o email desejado)
--    - Password: SenhaSegura123! (ou a senha desejada)
--    - Auto Confirm User: ✅ (marcar)
-- 4. Clique em "Create User"
-- 5. Copie o UUID do usuário criado
-- 6. Execute o INSERT abaixo substituindo o UUID:
--
-- INSERT INTO public.users (id, email, nome, tipo, criado_em)
-- VALUES (
--   'COLE_O_UUID_AQUI',
--   'admin@exemplo.com',
--   'Administrador',
--   'system_admin',
--   now()
-- );
--
-- MÉTODO 2: Via Edge Function (Requer ajuste)
-- Use a função create-superadmin, mas ela precisa ser ajustada para usar a tabela 'users' ao invés de 'profiles'

