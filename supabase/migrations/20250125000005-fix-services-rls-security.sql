-- ============================================
-- CORREÇÃO DE SEGURANÇA: RLS para services
-- ============================================

-- Habilitar RLS na tabela services
ALTER TABLE IF EXISTS public.services ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view services in their salon" ON public.services;
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
DROP POLICY IF EXISTS "Admins can manage services in their salon" ON public.services;

-- ============================================
-- POLÍTICA 1: Usuários podem ver serviços do seu salão
-- ============================================
CREATE POLICY "Users can view services in their salon" 
ON public.services
FOR SELECT 
TO authenticated
USING (
  -- Usuários do mesmo salão podem ver serviços do salão
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = services.salao_id
    AND u.tipo IN ('admin', 'funcionario', 'system_admin')
  )
);

-- ============================================
-- POLÍTICA 2: Público pode ver serviços ativos (para agendamentos)
-- ============================================
CREATE POLICY "Public can view active services" 
ON public.services
FOR SELECT 
TO public
USING (
  -- Público pode ver apenas serviços ativos
  ativo = true
  AND salao_id IS NOT NULL
);

-- ============================================
-- POLÍTICA 3: Admins podem gerenciar serviços do salão
-- ============================================
CREATE POLICY "Admins can manage services in their salon" 
ON public.services
FOR ALL 
TO authenticated
USING (
  -- Admins do mesmo salão podem gerenciar serviços
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = services.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
)
WITH CHECK (
  -- Validação para INSERT/UPDATE
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = services.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
);


