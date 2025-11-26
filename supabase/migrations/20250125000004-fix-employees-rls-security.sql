-- ============================================
-- CORREÇÃO DE SEGURANÇA: RLS para employees
-- ============================================

-- Habilitar RLS na tabela employees
ALTER TABLE IF EXISTS public.employees ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view employees in their salon" ON public.employees;
DROP POLICY IF EXISTS "Employees can view their own data" ON public.employees;
DROP POLICY IF EXISTS "Admins can manage employees in their salon" ON public.employees;
DROP POLICY IF EXISTS "Public can view active employees" ON public.employees;
DROP POLICY IF EXISTS "Public can create employees" ON public.employees;

-- ============================================
-- POLÍTICA 1: Usuários podem ver funcionários do seu salão
-- ============================================
CREATE POLICY "Users can view employees in their salon" 
ON public.employees
FOR SELECT 
TO authenticated
USING (
  -- Usuários do mesmo salão podem ver funcionários do salão
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = employees.salao_id
    AND u.tipo IN ('admin', 'funcionario', 'system_admin')
  )
);

-- ============================================
-- POLÍTICA 2: Funcionários podem ver seus próprios dados
-- ============================================
CREATE POLICY "Employees can view their own data" 
ON public.employees
FOR SELECT 
TO authenticated
USING (
  -- Funcionário pode ver seus próprios dados
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.id = employees.user_id
  )
);

-- ============================================
-- POLÍTICA 3: Admins podem gerenciar funcionários do salão
-- ============================================
CREATE POLICY "Admins can manage employees in their salon" 
ON public.employees
FOR ALL 
TO authenticated
USING (
  -- Admins do mesmo salão podem gerenciar funcionários
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = employees.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
)
WITH CHECK (
  -- Validação para INSERT/UPDATE
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = employees.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
);

-- ============================================
-- POLÍTICA 4: Público pode ver funcionários ativos (para agendamentos)
-- ============================================
CREATE POLICY "Public can view active employees" 
ON public.employees
FOR SELECT 
TO public
USING (
  -- Público pode ver apenas funcionários ativos
  ativo = true
  AND salao_id IS NOT NULL
);

-- ============================================
-- POLÍTICA 5: Público pode criar funcionários (via Edge Function)
-- ============================================
CREATE POLICY "Public can create employees" 
ON public.employees
FOR INSERT 
TO public
WITH CHECK (
  -- Validar que o salao_id existe
  EXISTS (
    SELECT 1 FROM public.saloes 
    WHERE id = employees.salao_id
  )
);

