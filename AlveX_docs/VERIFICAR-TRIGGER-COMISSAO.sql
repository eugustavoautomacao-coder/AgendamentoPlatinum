-- 🔍 VERIFICAR SE O TRIGGER FOI APLICADO

-- 1. Verificar se a coluna existe
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
  AND column_name = 'data_inicio_comissao';
-- Deve retornar: data_inicio_comissao | timestamp with time zone | YES

-- 2. Verificar se a função existe
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'atualizar_data_inicio_comissao';
-- Deve retornar: atualizar_data_inicio_comissao | FUNCTION

-- 3. Verificar se o trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_atualizar_data_inicio_comissao';
-- Deve retornar: trigger_atualizar_data_inicio_comissao | UPDATE | employees | ...

-- 4. Ver o código da função
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'atualizar_data_inicio_comissao';

-- 5. Testar manualmente
-- Criar funcionário de teste com 0%
INSERT INTO employees (
  salao_id, 
  nome, 
  email, 
  percentual_comissao, 
  ativo
) VALUES (
  'SEU_SALAO_ID'::uuid, -- ⚠️ Substitua pelo ID do seu salão
  'Teste Trigger',
  'teste.trigger@test.com',
  0,
  true
) RETURNING id, nome, percentual_comissao, data_inicio_comissao;
-- data_inicio_comissao deve estar NULL

-- 6. Alterar para 10% e ver se o trigger dispara
UPDATE employees 
SET percentual_comissao = 10
WHERE email = 'teste.trigger@test.com'
RETURNING id, nome, percentual_comissao, data_inicio_comissao;
-- data_inicio_comissao deve ser NOW()

-- 7. Alterar para 0% novamente
UPDATE employees 
SET percentual_comissao = 0
WHERE email = 'teste.trigger@test.com'
RETURNING id, nome, percentual_comissao, data_inicio_comissao;
-- data_inicio_comissao deve voltar para NULL

-- 8. Limpar teste
DELETE FROM employees WHERE email = 'teste.trigger@test.com';

-- ============================================
-- SE NADA FOI RETORNADO NAS QUERIES 1, 2, 3:
-- Execute a migration completa abaixo
-- ============================================


