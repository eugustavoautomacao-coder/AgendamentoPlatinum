-- Script de Debug para identificar por que a RLS está bloqueando

-- 1. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'appointment_requests';

-- 2. Listar todas as políticas atuais
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'appointment_requests'
ORDER BY policyname;

-- 3. TEMPORARIAMENTE desabilitar RLS para testar se é esse o problema
-- ATENÇÃO: Execute apenas para teste, depois reabilite!
-- ALTER TABLE public.appointment_requests DISABLE ROW LEVEL SECURITY;

-- 4. OU criar política SUPER PERMISSIVA temporária para debug
DROP POLICY IF EXISTS "TEMP_DEBUG_Public_create_requests" ON public.appointment_requests;

CREATE POLICY "TEMP_DEBUG_Public_create_requests" 
ON public.appointment_requests
FOR INSERT 
TO public
WITH CHECK (true); -- SUPER PERMISSIVO - APENAS PARA DEBUG!

-- 5. Testar criação de solicitação
-- Se funcionar com a política permissiva, o problema é alguma validação específica

-- 6. Depois de testar, REMOVER a política de debug e aplicar a correta:
-- DROP POLICY IF EXISTS "TEMP_DEBUG_Public_create_requests" ON public.appointment_requests;

-- E então aplicar a política correta do arquivo APLICAR-CORRECAO-RLS-APPOINTMENT-REQUESTS.sql


