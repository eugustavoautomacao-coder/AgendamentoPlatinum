-- Correção: Permitir acesso público aos agendamentos para verificação de disponibilidade
-- Execute este script no Supabase SQL Editor

-- 1. Verificar políticas atuais
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'appointments'
ORDER BY policyname;

-- 2. Adicionar política pública para verificação de disponibilidade
-- Se a política já existir, ela será recriada
DROP POLICY IF EXISTS "Public can view appointments for availability check" ON public.appointments;

CREATE POLICY "Public can view appointments for availability check" 
ON public.appointments
FOR SELECT 
TO public
USING (
  salao_id IS NOT NULL
  AND status IN ('confirmado', 'pendente', 'concluido')
);

-- 3. Verificar que a política foi criada
SELECT 
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'appointments'
  AND policyname = 'Public can view appointments for availability check';

-- 4. Testar se a query pública funciona (simular acesso público)
-- Esta query deve retornar agendamentos SEM precisar de autenticação
SET LOCAL ROLE anon; -- Simula usuário não autenticado

SELECT 
  COUNT(*) as total_agendamentos,
  COUNT(DISTINCT funcionario_id) as total_profissionais,
  COUNT(DISTINCT DATE(data_hora)) as total_datas
FROM appointments
WHERE status IN ('confirmado', 'pendente', 'concluido');

RESET ROLE; -- Volta ao usuário normal

-- ✅ Se a query acima retornar dados, a correção está funcionando!


