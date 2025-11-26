-- ============================================
-- CORREÇÃO DE SEGURANÇA: RLS para users
-- ============================================

-- Habilitar RLS na tabela users
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view users in their salon" ON public.users;
DROP POLICY IF EXISTS "Users can view their own user" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users in their salon" ON public.users;
DROP POLICY IF EXISTS "Public can create users" ON public.users;

-- ============================================
-- FUNÇÕES AUXILIARES (criar antes das políticas)
-- ============================================
-- Funções com SECURITY DEFINER bypassam RLS para evitar recursão
CREATE OR REPLACE FUNCTION public.get_user_salao_id_from_auth()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT salao_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_tipo_from_auth()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tipo FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- ============================================
-- POLÍTICA 1: Usuários podem ver usuários do seu salão
-- ============================================
-- IMPORTANTE: Usar funções auxiliares para evitar recursão infinita
CREATE POLICY "Users can view users in their salon" 
ON public.users
FOR SELECT 
TO authenticated
USING (
  -- Usuários podem ver a si mesmos
  id = auth.uid() OR
  -- Ou usuários do mesmo salão (usando função auxiliar)
  (
    users.salao_id IS NOT NULL
    AND users.salao_id = public.get_user_salao_id_from_auth()
  )
);

-- ============================================
-- POLÍTICA 2: Usuários podem ver seus próprios dados
-- ============================================
CREATE POLICY "Users can view their own user" 
ON public.users
FOR SELECT 
TO authenticated
USING (id = auth.uid());

-- ============================================
-- POLÍTICA 3: Usuários podem atualizar seu próprio perfil
-- ============================================
CREATE POLICY "Users can update their own profile" 
ON public.users
FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============================================
-- POLÍTICA 4: Admins podem gerenciar usuários do salão
-- ============================================
-- IMPORTANTE: Usar funções auxiliares para evitar recursão
CREATE POLICY "Admins can manage users in their salon" 
ON public.users
FOR ALL 
TO authenticated
USING (
  -- Admins do mesmo salão podem gerenciar usuários
  -- Usar função SECURITY DEFINER para evitar recursão
  users.salao_id IS NOT NULL
  AND users.salao_id = public.get_user_salao_id_from_auth()
  AND public.get_user_tipo_from_auth() IN ('admin', 'system_admin')
)
WITH CHECK (
  -- Validação para INSERT/UPDATE
  users.salao_id IS NOT NULL
  AND users.salao_id = public.get_user_salao_id_from_auth()
  AND public.get_user_tipo_from_auth() IN ('admin', 'system_admin')
);

-- ============================================
-- POLÍTICA 5: Público pode criar usuários (para registro)
-- ============================================
CREATE POLICY "Public can create users" 
ON public.users
FOR INSERT 
TO public
WITH CHECK (
  -- Validar que o salao_id existe se fornecido
  (salao_id IS NULL) OR
  EXISTS (
    SELECT 1 FROM public.saloes 
    WHERE id = users.salao_id
  )
);

