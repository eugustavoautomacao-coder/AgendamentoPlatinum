# 🔍 Investigação: Por Que Não Encontra Agendamentos?

## Situação

A query está sendo executada corretamente, mas retorna **array vazio** `[]`.

**Critérios da query:**
- `funcionario_id = '5fb99bbf-bc40-48be-be03-3831fa22635c'`
- `status = 'concluido'`
- `data_hora >= '2025-11-24T19:52:12.182Z'`
- `data_hora < '2025-12-01'`

## Possíveis Causas

### 1. ❌ Status NÃO é "concluido"

O agendamento pode estar com outro status:
- "confirmado" ❌
- "pendente" ❌
- "Concluido" (maiúscula) ❌
- "Concluído" (com acento) ❌

### 2. ❌ Data ANTES da ativação da comissão

O agendamento foi criado/concluído ANTES de **24/11/2025 19:52:12**.

### 3. ❌ Campo employee_id ao invés de funcionario_id

O agendamento pode ter sido criado com `employee_id` preenchido mas `funcionario_id = NULL`.

### 4. ❌ RLS bloqueando a query

As políticas RLS podem estar impedindo a leitura dos agendamentos.

## Como Investigar

Execute estas queries no **SQL Editor do Supabase**:

### Query 1: Ver TODOS os agendamentos do Guilherme (qualquer status)

```sql
SELECT 
  id,
  TO_CHAR(data_hora, 'DD/MM/YYYY HH24:MI:SS') as data_formatada,
  status,
  cliente_nome,
  funcionario_id,
  employee_id,
  servico_id,
  CASE 
    WHEN status = 'concluido' THEN '✅ Status OK'
    ELSE '❌ Status: ' || status
  END as validacao_status,
  CASE 
    WHEN data_hora >= '2025-11-24 19:52:12' THEN '✅ Data OK (após comissão)'
    ELSE '❌ Data ANTES da comissão'
  END as validacao_data
FROM appointments
WHERE funcionario_id = '5fb99bbf-bc40-48be-be03-3831fa22635c'
   OR employee_id = '5fb99bbf-bc40-48be-be03-3831fa22635c'
ORDER BY data_hora DESC;
```

**O que esperar:**
- Se retornar **vazio**: Não há NENHUM agendamento para o Guilherme
- Se retornar dados: Veja as colunas `validacao_status` e `validacao_data`

### Query 2: Contar agendamentos por status

```sql
SELECT 
  status,
  COUNT(*) as quantidade
FROM appointments
WHERE (funcionario_id = '5fb99bbf-bc40-48be-be03-3831fa22635c'
   OR employee_id = '5fb99bbf-bc40-48be-be03-3831fa22635c')
GROUP BY status
ORDER BY quantidade DESC;
```

### Query 3: Ver se RLS está bloqueando

```sql
-- Desabilitar RLS temporariamente para testar
SET ROLE postgres; -- Assume papel de superuser

SELECT 
  id,
  TO_CHAR(data_hora, 'DD/MM/YYYY HH24:MI:SS') as data_formatada,
  status,
  cliente_nome
FROM appointments
WHERE funcionario_id = '5fb99bbf-bc40-48be-be03-3831fa22635c'
  AND status = 'concluido'
  AND data_hora >= '2025-11-24 19:52:12'
ORDER BY data_hora DESC;

RESET ROLE; -- Volta ao papel normal
```

## Solução Rápida: Criar Agendamento de Teste

Se não há agendamentos, vamos criar um manualmente:

```sql
-- 1. Buscar um serviço válido
SELECT id, nome, preco 
FROM services 
WHERE salao_id = 'f86c606d-7107-4a3e-b917-61d924b00ae9'
  AND ativo = true
LIMIT 1;
-- Anote o ID do serviço

-- 2. Criar agendamento de teste
INSERT INTO appointments (
  salao_id,
  cliente_nome,
  cliente_telefone,
  funcionario_id,
  employee_id,
  servico_id,
  data_hora,
  status,
  criado_em
) VALUES (
  'f86c606d-7107-4a3e-b917-61d924b00ae9',
  'Cliente Teste Comissão',
  '11999999999',
  '5fb99bbf-bc40-48be-be03-3831fa22635c', -- Guilherme
  '5fb99bbf-bc40-48be-be03-3831fa22635c', -- Guilherme
  'COLE_ID_DO_SERVICO_AQUI', -- ⚠️ Substituir
  NOW(), -- Agora
  'concluido', -- ✅ Status concluído
  NOW()
) RETURNING 
  id,
  TO_CHAR(data_hora, 'DD/MM/YYYY HH24:MI:SS') as data_formatada,
  status,
  cliente_nome;
```

## Resultados Esperados

### Se a Query 1 retornar vazio:
**Diagnóstico:** Não há agendamentos para o Guilherme
**Solução:** Criar agendamento via interface ou SQL

### Se a Query 1 retornar dados com "❌ Status: confirmado":
**Diagnóstico:** Agendamento existe mas não está concluído
**Solução:** Alterar status para "concluido" (sem acento, minúscula)

```sql
UPDATE appointments 
SET status = 'concluido'
WHERE funcionario_id = '5fb99bbf-bc40-48be-be03-3831fa22635c'
  AND status != 'concluido';
```

### Se a Query 1 retornar dados com "❌ Data ANTES da comissão":
**Diagnóstico:** Agendamentos são antigos
**Solução:** Criar novo agendamento ou ajustar `data_inicio_comissao`

```sql
-- Ajustar data de início para incluir agendamentos antigos
UPDATE employees 
SET data_inicio_comissao = '2025-11-01 00:00:00'
WHERE id = '5fb99bbf-bc40-48be-be03-3831fa22635c';
```

### Se a Query 3 (com ROLE postgres) retornar dados:
**Diagnóstico:** RLS está bloqueando
**Solução:** Ajustar políticas RLS de appointments

## Próximos Passos

1. Execute a **Query 1** e me envie o resultado
2. Execute a **Query 2** e me envie o resultado
3. Com base nos resultados, aplicamos a solução apropriada


