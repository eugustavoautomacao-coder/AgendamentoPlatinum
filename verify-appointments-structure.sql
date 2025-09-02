-- Script para verificar a estrutura atual das tabelas
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura da tabela appointments
SELECT '=== ESTRUTURA APPOINTMENTS ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
ORDER BY ordinal_position;

-- 2. Verificar estrutura da tabela appointment_requests
SELECT '=== ESTRUTURA APPOINTMENT_REQUESTS ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'appointment_requests' 
ORDER BY ordinal_position;

-- 3. Verificar relacionamentos entre as tabelas
SELECT '=== RELACIONAMENTOS ===' as info;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (tc.table_name = 'appointments' OR tc.table_name = 'appointment_requests');

-- 4. Verificar dados existentes
SELECT '=== DADOS APPOINTMENT_REQUESTS ===' as info;
SELECT id, status, salao_id, servico_id, funcionario_id, data_hora, cliente_nome
FROM appointment_requests 
ORDER BY criado_em DESC 
LIMIT 5;

-- 5. Verificar dados existentes em appointments
SELECT '=== DADOS APPOINTMENTS ===' as info;
SELECT id, salao_id, funcionario_id, servico_id, data_hora, status, cliente_nome
FROM appointments 
ORDER BY data_hora DESC 
LIMIT 5;

-- 6. Verificar se há solicitações pendentes
SELECT '=== SOLICITAÇÕES PENDENTES ===' as info;
SELECT COUNT(*) as total_pendentes, 
       COUNT(CASE WHEN funcionario_id IS NOT NULL THEN 1 END) as com_funcionario,
       COUNT(CASE WHEN funcionario_id IS NULL THEN 1 END) as sem_funcionario
FROM appointment_requests 
WHERE status = 'pendente';
