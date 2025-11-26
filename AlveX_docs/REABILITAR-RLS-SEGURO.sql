-- REABILITAR RLS COM POLÍTICA SEGURA
-- Execute este script IMEDIATAMENTE para proteger o sistema

-- 1. Reabilitar RLS
ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas antigas
DROP POLICY IF EXISTS "Public can create appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Users can view appointment requests in their salon" ON public.appointment_requests;
DROP POLICY IF EXISTS "Admins can manage appointment requests in their salon" ON public.appointment_requests;

-- ============================================
-- POLÍTICA 1: Público pode APENAS CRIAR (INSERT)
-- ============================================
CREATE POLICY "Public can create appointment requests" 
ON public.appointment_requests
FOR INSERT 
TO public
WITH CHECK (
  -- Validação mínima: salao_id deve existir
  salao_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.saloes 
    WHERE id = appointment_requests.salao_id
  )
);

-- ============================================
-- POLÍTICA 2: Usuários autenticados podem VER (SELECT) do seu salão
-- ============================================
CREATE POLICY "Users can view appointment requests in their salon" 
ON public.appointment_requests
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = appointment_requests.salao_id
    AND u.tipo IN ('admin', 'funcionario', 'system_admin')
  )
);

-- ============================================
-- POLÍTICA 3: Apenas ADMINS podem EDITAR/DELETAR
-- ============================================
CREATE POLICY "Admins can manage appointment requests in their salon" 
ON public.appointment_requests
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = appointment_requests.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = appointment_requests.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
);

-- ============================================
-- VERIFICAR QUE AS POLÍTICAS FORAM CRIADAS
-- ============================================
SELECT 
  policyname,
  cmd,
  roles,
  permissive
FROM pg_policies 
WHERE tablename = 'appointment_requests'
ORDER BY policyname;

-- ✅ Sistema protegido!
-- Público pode: APENAS criar solicitações
-- Público NÃO pode: Ver, editar ou deletar
-- Admins/Funcionários: Podem ver as do seu salão
-- Admins: Podem aprovar/rejeitar


