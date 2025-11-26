-- Script para corrigir agendamentos existentes que não têm employee_id
-- Execute este script no Supabase SQL Editor

-- 1. Verificar quantos agendamentos precisam ser corrigidos
SELECT 
  COUNT(*) as total_sem_employee_id,
  COUNT(DISTINCT funcionario_id) as profissionais_afetados
FROM appointments 
WHERE employee_id IS NULL 
  AND funcionario_id IS NOT NULL;

-- 2. Atualizar todos os agendamentos que não têm employee_id
UPDATE appointments 
SET employee_id = funcionario_id 
WHERE employee_id IS NULL 
  AND funcionario_id IS NOT NULL;

-- 3. Verificar resultado
SELECT 
  COUNT(*) as total_com_employee_id,
  COUNT(*) FILTER (WHERE employee_id = funcionario_id) as total_corretos
FROM appointments 
WHERE funcionario_id IS NOT NULL;

-- 4. Mostrar alguns exemplos para validação
SELECT 
  id,
  funcionario_id,
  employee_id,
  data_hora,
  status
FROM appointments
WHERE funcionario_id IS NOT NULL
LIMIT 10;


