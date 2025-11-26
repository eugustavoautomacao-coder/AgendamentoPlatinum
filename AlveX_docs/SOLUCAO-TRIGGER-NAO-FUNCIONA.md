# 🔧 Solução: Trigger Não Está Funcionando

## Problema

Você alterou a comissão de 0% para 10%, mas o campo `data_inicio_comissao` não foi preenchido automaticamente.

## Causa

A **migration ainda não foi aplicada no banco de dados**. O trigger só existe no código, mas não no banco.

## Solução: Aplicar a Migration

### Passo 1: Verificar se já foi aplicado

Execute no **SQL Editor do Supabase**:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'employees' 
  AND column_name = 'data_inicio_comissao';
```

**Resultado esperado:**
```
column_name
data_inicio_comissao
```

**Se retornar vazio:** A migration NÃO foi aplicada ainda. Siga para o Passo 2.

### Passo 2: Aplicar a Migration Completa

Cole e execute no **SQL Editor do Supabase**:

```sql
-- ============================================
-- MIGRATION: Adicionar Data de Início de Comissão
-- ============================================

-- 1. Adicionar coluna
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS data_inicio_comissao timestamp with time zone;

COMMENT ON COLUMN public.employees.data_inicio_comissao IS 
'Data em que a comissão foi ativada para este funcionário. Usado para calcular comissões apenas de agendamentos a partir desta data.';

-- 2. Para funcionários que já têm comissão > 0, setar a data como agora
UPDATE public.employees 
SET data_inicio_comissao = NOW()
WHERE percentual_comissao > 0 
  AND data_inicio_comissao IS NULL;

-- 3. Criar função do trigger
CREATE OR REPLACE FUNCTION public.atualizar_data_inicio_comissao()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a comissão mudou de 0 (ou NULL) para > 0, registrar a data
  IF (OLD.percentual_comissao IS NULL OR OLD.percentual_comissao = 0) 
     AND NEW.percentual_comissao > 0 
     AND NEW.data_inicio_comissao IS NULL THEN
    NEW.data_inicio_comissao := NOW();
    RAISE NOTICE 'Comissão ativada para funcionário %. Data início: %', NEW.nome, NEW.data_inicio_comissao;
  END IF;
  
  -- Se a comissão foi zerada, limpar a data
  IF (OLD.percentual_comissao > 0) 
     AND (NEW.percentual_comissao IS NULL OR NEW.percentual_comissao = 0) THEN
    NEW.data_inicio_comissao := NULL;
    RAISE NOTICE 'Comissão desativada para funcionário %', NEW.nome;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger
DROP TRIGGER IF EXISTS trigger_atualizar_data_inicio_comissao ON public.employees;
CREATE TRIGGER trigger_atualizar_data_inicio_comissao
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_data_inicio_comissao();

-- 5. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_employees_data_inicio_comissao 
ON public.employees(data_inicio_comissao) 
WHERE data_inicio_comissao IS NOT NULL;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
  '✅ Coluna criada' as status,
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'employees' 
  AND column_name = 'data_inicio_comissao'

UNION ALL

SELECT 
  '✅ Trigger criado' as status,
  trigger_name,
  'OK'
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_atualizar_data_inicio_comissao';
```

**Resultado esperado:**
```
✅ Coluna criada | data_inicio_comissao | timestamp with time zone
✅ Trigger criado | trigger_atualizar_data_inicio_comissao | OK
```

### Passo 3: Testar o Trigger

Execute no **SQL Editor**:

```sql
-- Buscar um funcionário específico (substitua o nome)
SELECT id, nome, percentual_comissao, data_inicio_comissao 
FROM employees 
WHERE nome ILIKE '%guilherme%';

-- Anotar o ID e testar:
-- Alterar para 0%
UPDATE employees 
SET percentual_comissao = 0
WHERE id = 'ID_DO_FUNCIONARIO'::uuid
RETURNING nome, percentual_comissao, data_inicio_comissao;
-- data_inicio_comissao deve ficar NULL

-- Alterar para 10%
UPDATE employees 
SET percentual_comissao = 10
WHERE id = 'ID_DO_FUNCIONARIO'::uuid
RETURNING nome, percentual_comissao, data_inicio_comissao;
-- data_inicio_comissao deve ser preenchido com NOW()
```

### Passo 4: Testar no Sistema

1. Recarregue a página do sistema (F5)
2. Vá em **Profissionais**
3. Edite um funcionário
4. Altere de **0% para 10%**
5. Salve
6. Abra o **Console** (F12)
7. Vá em **Comissões Mensais**
8. Clique em **"Atualizar"**

**Você DEVE ver:**
```
📊 Dados do funcionário: {..., data_inicio_comissao: "2025-11-24T..."}
✅ Guilherme - Comissão: 10%
✅ TRIGGER FUNCIONOU! data_inicio_comissao existe
📅 Comissão ativa desde: 24/11/2025, 16:30:00
```

**Se ver:**
```
⚠️ TRIGGER NÃO FUNCIONOU! data_inicio_comissao é NULL
```
**Significa:** A migration ainda não foi aplicada ou falhou.

## Solução Temporária: Setar Manualmente

Se precisar urgente e o trigger não funcionar, você pode setar manualmente:

```sql
-- Para UM funcionário específico
UPDATE employees 
SET data_inicio_comissao = NOW()
WHERE id = 'ID_DO_FUNCIONARIO'::uuid;

-- Para TODOS com comissão > 0
UPDATE employees 
SET data_inicio_comissao = NOW()
WHERE percentual_comissao > 0 
  AND data_inicio_comissao IS NULL;
```

## Checklist de Verificação

- [ ] Executei a query de verificação (Passo 1)
- [ ] Apliquei a migration completa (Passo 2)
- [ ] Testei o trigger via SQL (Passo 3)
- [ ] Testei no sistema (Passo 4)
- [ ] Logs mostram "✅ TRIGGER FUNCIONOU!"

## Se Ainda Não Funcionar

Execute este diagnóstico e me envie o resultado:

```sql
-- 1. Verificar estrutura
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
  AND column_name IN ('percentual_comissao', 'data_inicio_comissao');

-- 2. Verificar trigger
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'employees';

-- 3. Ver valor atual de um funcionário
SELECT 
  nome,
  percentual_comissao,
  data_inicio_comissao,
  criado_em,
  atualizado_em
FROM employees 
WHERE nome ILIKE '%guilherme%';
```

Me envie o resultado dessas 3 queries e posso te ajudar melhor! 🔍


