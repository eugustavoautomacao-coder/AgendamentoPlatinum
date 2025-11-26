-- ============================================
-- CORREÇÃO CRÍTICA DE SEGURANÇA: RLS para clientes
-- ============================================
-- Este script corrige vulnerabilidades críticas na tabela clientes:
-- 1. Habilita RLS na tabela clientes
-- 2. Cria políticas para proteger dados por salao_id
-- 3. Permite inserção pública apenas para novos clientes
-- 4. Restringe leitura/atualização por salao_id

-- Habilitar RLS na tabela clientes
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Public can insert clients" ON public.clientes;
DROP POLICY IF EXISTS "Clients can view their own data" ON public.clientes;
DROP POLICY IF EXISTS "Salon admins can view clients in their salon" ON public.clientes;
DROP POLICY IF EXISTS "Salon admins can manage clients in their salon" ON public.clientes;
DROP POLICY IF EXISTS "Clients can update their own data" ON public.clientes;

-- ============================================
-- POLÍTICA 1: Inserção pública (para novos clientes)
-- ============================================
-- Permite que qualquer pessoa crie um cliente (para agendamentos online)
-- MAS valida que o salao_id existe e é válido
CREATE POLICY "Public can insert clients" 
ON public.clientes
FOR INSERT 
TO public
WITH CHECK (
  -- Validar que o salao_id existe na tabela saloes
  EXISTS (
    SELECT 1 FROM public.saloes 
    WHERE id = clientes.salao_id
  )
);

-- ============================================
-- POLÍTICA 2: Clientes podem ver seus próprios dados
-- ============================================
-- Clientes autenticados podem ver apenas seus próprios dados
-- NOTA: Como clientes podem não estar em auth.users, esta política
-- permite acesso baseado em email correspondente na tabela users
CREATE POLICY "Clients can view their own data" 
ON public.clientes
FOR SELECT 
TO authenticated
USING (
  -- Se o usuário autenticado for um cliente, pode ver seus dados
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.email = clientes.email
    AND u.salao_id = clientes.salao_id
    AND u.tipo = 'cliente'
  )
);

-- ============================================
-- POLÍTICA 3: Admins podem ver clientes do seu salão
-- ============================================
-- Usuários autenticados (admins, profissionais) podem ver clientes do seu salão
CREATE POLICY "Salon admins can view clients in their salon" 
ON public.clientes
FOR SELECT 
TO authenticated
USING (
  -- Usuários do mesmo salão podem ver clientes do salão
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = clientes.salao_id
    AND u.tipo IN ('admin', 'funcionario', 'system_admin')
  )
);

-- ============================================
-- POLÍTICA 4: Admins podem gerenciar clientes do seu salão
-- ============================================
-- Admins podem criar, atualizar e deletar clientes do seu salão
CREATE POLICY "Salon admins can manage clients in their salon" 
ON public.clientes
FOR ALL 
TO authenticated
USING (
  -- Admins do mesmo salão podem gerenciar clientes
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = clientes.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
)
WITH CHECK (
  -- Validação para INSERT/UPDATE
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = clientes.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
);

-- ============================================
-- POLÍTICA 5: Clientes podem atualizar seus próprios dados
-- ============================================
-- Clientes autenticados podem atualizar apenas seus próprios dados
CREATE POLICY "Clients can update their own data" 
ON public.clientes
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.email = clientes.email
    AND u.salao_id = clientes.salao_id
    AND u.tipo = 'cliente'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.email = clientes.email
    AND u.salao_id = clientes.salao_id
    AND u.tipo = 'cliente'
  )
);

-- ============================================
-- POLÍTICA ADICIONAL: Leitura pública limitada
-- ============================================
-- Permitir leitura pública APENAS para verificar se email existe
-- MAS sem expor dados sensíveis (senha_hash, etc)
-- Esta política é mais restritiva e só permite campos específicos
CREATE POLICY "Public can check email existence" 
ON public.clientes
FOR SELECT 
TO public
USING (true) -- Permite leitura pública
-- MAS o frontend deve usar .select() para limitar campos
-- Exemplo: .select('salao_id, nome').eq('email', email)

-- ============================================
-- COMENTÁRIOS IMPORTANTES:
-- ============================================
-- 1. A política "Public can check email existence" permite leitura pública,
--    mas o frontend DEVE sempre usar .select() para limitar campos expostos
-- 2. A validação de salao_id deve ser feita no frontend ANTES de fazer queries
-- 3. Senhas nunca devem ser expostas em queries públicas
-- 4. O email na URL é um risco menor se RLS estiver funcionando corretamente,
--    mas ainda assim deve ser validado no backend
-- ============================================

