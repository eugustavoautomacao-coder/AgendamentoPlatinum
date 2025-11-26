-- ============================================
-- CORREÇÃO DE SEGURANÇA: RLS para saloes
-- ============================================

-- Habilitar RLS na tabela saloes
ALTER TABLE IF EXISTS public.saloes ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view their own salon" ON public.saloes;
DROP POLICY IF EXISTS "Public can view salons" ON public.saloes;
DROP POLICY IF EXISTS "Admins can manage their salon" ON public.saloes;
DROP POLICY IF EXISTS "Superadmins can manage all salons" ON public.saloes;

-- ============================================
-- POLÍTICA 1: Usuários podem ver seu próprio salão
-- ============================================
CREATE POLICY "Users can view their own salon" 
ON public.saloes
FOR SELECT 
TO authenticated
USING (
  -- Usuários podem ver o salão ao qual pertencem
  id IN (
    SELECT salao_id FROM public.users 
    WHERE id = auth.uid() AND salao_id IS NOT NULL
  )
);

-- ============================================
-- POLÍTICA 2: Público pode ver salões (para agendamentos)
-- ============================================
CREATE POLICY "Public can view salons" 
ON public.saloes
FOR SELECT 
TO public
USING (true); -- Público pode ver informações básicas dos salões

-- ============================================
-- POLÍTICA 3: Admins podem gerenciar seu salão
-- ============================================
CREATE POLICY "Admins can manage their salon" 
ON public.saloes
FOR UPDATE 
TO authenticated
USING (
  -- Admins podem atualizar seu próprio salão
  id IN (
    SELECT salao_id FROM public.users 
    WHERE id = auth.uid() 
    AND tipo IN ('admin', 'system_admin')
    AND salao_id IS NOT NULL
  )
)
WITH CHECK (
  -- Validação para UPDATE
  id IN (
    SELECT salao_id FROM public.users 
    WHERE id = auth.uid() 
    AND tipo IN ('admin', 'system_admin')
    AND salao_id IS NOT NULL
  )
);

-- ============================================
-- POLÍTICA 4: Superadmins podem gerenciar todos os salões
-- ============================================
CREATE POLICY "Superadmins can manage all salons" 
ON public.saloes
FOR ALL 
TO authenticated
USING (
  -- System admins podem gerenciar todos os salões
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.tipo = 'system_admin'
  )
)
WITH CHECK (
  -- Validação para INSERT/UPDATE
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.tipo = 'system_admin'
  )
);


