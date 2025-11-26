-- 🌍 FIX: Problema de Timezone na Comissão

-- Execute isso para ver como as datas estão salvas:

-- 1. Ver a data de início da comissão (em UTC e convertida para Brasil)
SELECT 
  nome,
  percentual_comissao,
  data_inicio_comissao AT TIME ZONE 'UTC' as utc,
  data_inicio_comissao AT TIME ZONE 'America/Sao_Paulo' as horario_brasil,
  TO_CHAR(data_inicio_comissao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI:SS') as formatado_brasil
FROM employees
WHERE id = '5fb99bbf-bc40-48be-be03-3831fa22635c';

-- 2. Ver agendamentos e seus timezones
SELECT 
  id,
  cliente_nome,
  status,
  data_hora AT TIME ZONE 'UTC' as utc,
  data_hora AT TIME ZONE 'America/Sao_Paulo' as horario_brasil,
  TO_CHAR(data_hora AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI:SS') as formatado_brasil,
  funcionario_id,
  employee_id
FROM appointments
WHERE (funcionario_id = '5fb99bbf-bc40-48be-be03-3831fa22635c'
   OR employee_id = '5fb99bbf-bc40-48be-be03-3831fa22635c')
ORDER BY data_hora DESC;

-- 3. Comparar: agendamento DEPOIS da comissão?
SELECT 
  a.id,
  a.cliente_nome,
  TO_CHAR(a.data_hora AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI:SS') as agendamento_br,
  TO_CHAR(e.data_inicio_comissao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI:SS') as comissao_inicio_br,
  CASE 
    WHEN a.data_hora >= e.data_inicio_comissao THEN '✅ Conta para comissão'
    ELSE '❌ Anterior à comissão'
  END as validacao,
  a.status
FROM appointments a
CROSS JOIN employees e
WHERE (a.funcionario_id = '5fb99bbf-bc40-48be-be03-3831fa22635c'
   OR a.employee_id = '5fb99bbf-bc40-48be-be03-3831fa22635c')
  AND e.id = '5fb99bbf-bc40-48be-be03-3831fa22635c'
ORDER BY a.data_hora DESC;


