-- SCRIPT PARA FORÇAR DESBLOQUEIO TOTAL DA TABELA appointment_requests
-- Execute este script linha por linha no Supabase SQL Editor

-- 1. LISTAR TODAS AS POLÍTICAS EXISTENTES
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'appointment_requests';

-- 2. REMOVER **TODAS** AS POLÍTICAS EXISTENTES
-- Execute cada linha individualmente se necessário
DROP POLICY IF EXISTS "Public can create appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "TEMP_DEBUG_Public_create_requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Users can view appointment requests in their salon" ON public.appointment_requests;
DROP POLICY IF EXISTS "Admins can manage appointment requests in their salon" ON public.appointment_requests;
DROP POLICY IF EXISTS "Clients can create appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Public can create requests" ON public.appointment_requests;

-- 3. DESABILITAR RLS COMPLETAMENTE (TEMPORÁRIO!)
ALTER TABLE public.appointment_requests DISABLE ROW LEVEL SECURITY;

-- 4. VERIFICAR QUE RLS FOI DESABILITADO
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'appointment_requests';
-- Deve mostrar rowsecurity = false

-- ✅ AGORA TESTE A CRIAÇÃO DE SOLICITAÇÃO

-- Após confirmar que funciona, você pode reabilitar RLS e aplicar políticas corretas:
-- ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;
-- E então execute APLICAR-CORRECAO-RLS-APPOINTMENT-REQUESTS.sql


