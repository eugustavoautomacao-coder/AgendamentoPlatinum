-- 🔍 DEBUG: Por que não encontra agendamentos?

-- SUBSTITUA OS VALORES ABAIXO:
-- funcionario_id: 5fb99bbf-bc40-48be-be03-3831fa22635c (do log)
-- data_minima: 2025-11-24T16:52:12 (do log)

-- ============================================
-- 1. Ver TODOS os agendamentos do funcionário
-- ============================================
SELECT 
  id,
  data_hora,
  status,
  cliente_nome,
  funcionario_id,
  employee_id,
  servico_id,
  TO_CHAR(data_hora, 'DD/MM/YYYY HH24:MI:SS') as data_formatada
FROM appointments
WHERE funcionario_id = '5fb99bbf-bc40-48be-be03-3831fa22635c'
ORDER BY data_hora DESC;

-- ============================================
-- 2. Ver agendamentos NO PERÍODO (novembro 2025)
-- ============================================
SELECT 
  id,
  data_hora,
  status,
  cliente_nome,
  funcionario_id,
  TO_CHAR(data_hora, 'DD/MM/YYYY HH24:MI:SS') as data_formatada
FROM appointments
WHERE funcionario_id = '5fb99bbf-bc40-48be-be03-3831fa22635c'
  AND data_hora >= '2025-11-01'
  AND data_hora < '2025-12-01'
ORDER BY data_hora DESC;

-- ============================================
-- 3. Ver agendamentos APÓS a data de início da comissão
-- ============================================
SELECT 
  id,
  data_hora,
  status,
  cliente_nome,
  funcionario_id,
  TO_CHAR(data_hora, 'DD/MM/YYYY HH24:MI:SS') as data_formatada,
  CASE 
    WHEN data_hora >= '2025-11-24T16:52:12' THEN '✅ APÓS início comissão'
    ELSE '❌ ANTES início comissão'
  END as validacao_data
FROM appointments
WHERE funcionario_id = '5fb99bbf-bc40-48be-be03-3831fa22635c'
  AND data_hora >= '2025-11-01'
  AND data_hora < '2025-12-01'
ORDER BY data_hora DESC;

-- ============================================
-- 4. Verificar STATUS dos agendamentos
-- ============================================
SELECT 
  status,
  COUNT(*) as quantidade,
  CASE 
    WHEN status = 'concluido' THEN '✅ Conta para comissão'
    ELSE '❌ Não conta'
  END as conta_comissao
FROM appointments
WHERE funcionario_id = '5fb99bbf-bc40-48be-be03-3831fa22635c'
  AND data_hora >= '2025-11-01'
  AND data_hora < '2025-12-01'
GROUP BY status
ORDER BY quantidade DESC;

-- ============================================
-- 5. Query EXATA que o sistema usa
-- ============================================
SELECT 
  a.id,
  a.data_hora,
  a.status,
  a.cliente_nome,
  a.funcionario_id,
  s.nome as servico_nome,
  s.preco as servico_preco,
  TO_CHAR(a.data_hora, 'DD/MM/YYYY HH24:MI:SS') as data_formatada
FROM appointments a
INNER JOIN services s ON s.id = a.servico_id
WHERE a.funcionario_id = '5fb99bbf-bc40-48be-be03-3831fa22635c'
  AND a.status = 'concluido'
  AND a.data_hora >= '2025-11-24T16:52:12'
  AND a.data_hora < '2025-12-01'
ORDER BY a.data_hora DESC;

-- ============================================
-- 6. Verificar se tem employee_id ao invés de funcionario_id
-- ============================================
SELECT 
  id,
  data_hora,
  status,
  cliente_nome,
  funcionario_id,
  employee_id,
  TO_CHAR(data_hora, 'DD/MM/YYYY HH24:MI:SS') as data_formatada,
  CASE 
    WHEN funcionario_id IS NULL THEN '⚠️ funcionario_id está NULL'
    WHEN employee_id IS NULL THEN '⚠️ employee_id está NULL'
    ELSE '✅ IDs preenchidos'
  END as status_ids
FROM appointments
WHERE (funcionario_id = '5fb99bbf-bc40-48be-be03-3831fa22635c' 
   OR employee_id = '5fb99bbf-bc40-48be-be03-3831fa22635c')
  AND data_hora >= '2025-11-24T16:52:12'
  AND data_hora < '2025-12-01'
ORDER BY data_hora DESC;

-- ============================================
-- 7. Criar agendamento de teste MANUALMENTE
-- ============================================
-- ATENÇÃO: Substitua os IDs pelos seus
/*
INSERT INTO appointments (
  salao_id,
  cliente_nome,
  cliente_telefone,
  cliente_email,
  funcionario_id,
  employee_id,
  servico_id,
  data_hora,
  status,
  criado_em
) VALUES (
  'f86c606d-7107-4a3e-b917-61d924b00ae9', -- ID do salão
  'Cliente Teste Comissão',
  '11999999999',
  'teste@test.com',
  '5fb99bbf-bc40-48be-be03-3831fa22635c', -- ID do Guilherme
  '5fb99bbf-bc40-48be-be03-3831fa22635c', -- ID do Guilherme
  'ID_DO_SERVICO', -- ⚠️ SUBSTITUA pelo ID de um serviço válido
  NOW(), -- Data/hora atual
  'concluido', -- ✅ Status concluído
  NOW()
) RETURNING *;
*/

-- ============================================
-- 8. Ver serviços disponíveis
-- ============================================
SELECT 
  id,
  nome,
  preco,
  ativo
FROM services
WHERE salao_id = 'f86c606d-7107-4a3e-b917-61d924b00ae9'
  AND ativo = true
ORDER BY nome;


