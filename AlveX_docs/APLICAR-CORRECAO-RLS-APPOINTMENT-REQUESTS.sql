-- Correção: Melhorar política RLS para appointment_requests
-- Execute este script no Supabase SQL Editor

-- 1. Verificar política atual
SELECT 
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'appointment_requests'
  AND policyname = 'Public can create appointment requests';

-- 2. Remover política antiga
DROP POLICY IF EXISTS "Public can create appointment requests" ON public.appointment_requests;

-- 3. Criar política melhorada
CREATE POLICY "Public can create appointment requests" 
ON public.appointment_requests
FOR INSERT 
TO public
WITH CHECK (
  -- Validar que o salao_id existe
  EXISTS (
    SELECT 1 FROM public.saloes 
    WHERE id = appointment_requests.salao_id
  )
  AND
  -- Validar que o serviço existe e pertence ao salão
  (
    appointment_requests.servico_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.services s
      WHERE s.id = appointment_requests.servico_id
      AND s.salao_id = appointment_requests.salao_id
      AND s.ativo = true
    )
  )
  AND
  -- Validar que o funcionário existe e pertence ao salão (se fornecido)
  (
    appointment_requests.funcionario_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = appointment_requests.funcionario_id
      AND e.salao_id = appointment_requests.salao_id
      AND e.ativo = true
    )
  )
);

-- 4. Verificar que a política foi criada
SELECT 
  policyname,
  roles,
  cmd,
  with_check
FROM pg_policies 
WHERE tablename = 'appointment_requests'
  AND policyname = 'Public can create appointment requests';

-- ✅ Política atualizada com sucesso!


