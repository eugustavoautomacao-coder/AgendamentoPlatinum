-- Script de diagnóstico para appointment_requests
-- Este script ajuda a identificar o problema exato

-- 1. Verificar se a tabela existe
SELECT '=== VERIFICAÇÃO DA TABELA ===' as info;
SELECT 
  table_name,
  table_type,
  table_schema
FROM information_schema.tables 
WHERE table_name = 'appointment_requests';

-- 2. Verificar estrutura da tabela
SELECT '=== ESTRUTURA DA TABELA ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'appointment_requests'
ORDER BY ordinal_position;

-- 3. Verificar RLS
SELECT '=== STATUS DO RLS ===' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  forcerowsecurity as force_rls
FROM pg_tables 
WHERE tablename = 'appointment_requests';

-- 4. Verificar políticas existentes
SELECT '=== POLÍTICAS EXISTENTES ===' as info;
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'appointment_requests';

-- 5. Verificar permissões da tabela
SELECT '=== PERMISSÕES DA TABELA ===' as info;
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'appointment_requests';

-- 6. Verificar se há triggers
SELECT '=== TRIGGERS ===' as info;
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'appointment_requests';

-- 7. Verificar constraints
SELECT '=== CONSTRAINTS ===' as info;
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'appointment_requests';

-- 8. Verificar foreign keys
SELECT '=== FOREIGN KEYS ===' as info;
SELECT 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'appointment_requests';

SELECT '=== DIAGNÓSTICO CONCLUÍDO ===' as resultado;
