# 🚀 Como Aplicar o Sistema de Data de Início de Comissão

## O Que Foi Implementado?

Um sistema que registra **quando** a comissão foi ativada para cada funcionário, calculando comissões **apenas** para agendamentos a partir dessa data.

### Exemplo Prático:

**Antes:**
- Funcionário tinha 0% desde janeiro
- Em 15/11/2025 você muda para 10%
- Sistema calculava comissão de TODOS os agendamentos de novembro ❌

**Depois:**
- Funcionário tinha 0% desde janeiro  
- Em 15/11/2025, 14:30 você muda para 10%
- `data_inicio_comissao = 15/11/2025 14:30:00` é registrado automaticamente
- Sistema calcula comissão APENAS de agendamentos >= 15/11/2025 14:30 ✅

## Passo a Passo para Aplicar

### 1. Aplicar Migration no Supabase

**Opção A: Via SQL Editor (Recomendado)**

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Clique em **"+ New query"**
4. Cole o conteúdo do arquivo:
   ```
   supabase/migrations/20250125000009-add-data-inicio-comissao.sql
   ```
5. Clique em **"Run"**
6. ✅ Deve mostrar "Success. No rows returned"

**Opção B: Via Linha de Comando**

```bash
# Se você tem o Supabase CLI instalado
supabase db push
```

### 2. Verificar se Aplicou Corretamente

Execute no SQL Editor:

```sql
-- Verificar se a coluna foi criada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employees' 
  AND column_name = 'data_inicio_comissao';

-- Deve retornar:
-- column_name: data_inicio_comissao
-- data_type: timestamp with time zone

-- Verificar se o trigger foi criado
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'employees' 
  AND trigger_name = 'trigger_atualizar_data_inicio_comissao';

-- Deve retornar:
-- trigger_name: trigger_atualizar_data_inicio_comissao
```

### 3. Migração de Dados Existentes

Para funcionários que **já têm comissão > 0**, você tem 2 opções:

#### Opção A: Setar como HOJE (Conservador) ✅ Recomendado

```sql
-- Funcionários que já têm comissão passam a calcular apenas novos agendamentos
UPDATE employees 
SET data_inicio_comissao = NOW()
WHERE percentual_comissao > 0 
  AND data_inicio_comissao IS NULL;
```

**Vantagem:** Evita recalcular comissões antigas
**Desvantagem:** Agendamentos antigos não terão comissão retroativa

#### Opção B: Setar como Primeiro Agendamento (Liberal)

```sql
-- Funcionários que já têm comissão calculam desde sempre
UPDATE employees e
SET data_inicio_comissao = (
  SELECT MIN(data_hora) 
  FROM appointments a 
  WHERE a.funcionario_id = e.id 
    AND a.status = 'concluido'
)
WHERE e.percentual_comissao > 0 
  AND e.data_inicio_comissao IS NULL;
```

**Vantagem:** Mantém comissões retroativas
**Desvantagem:** Pode gerar valores inesperados

**👉 Recomendação:** Use a **Opção A** (conservador)

### 4. Testar o Sistema

#### Teste 1: Ativar Comissão Nova

1. Crie um funcionário com **0% de comissão**
2. Crie alguns agendamentos para ele e marque como **"Concluído"**
3. Vá em **Profissionais** e edite o funcionário
4. Altere a comissão para **10%** e salve
5. Abra o **Console do Navegador** (F12)
6. Vá em **Comissões Mensais** e clique em **"Atualizar"**

**O que você deve ver nos logs:**

```
📊 Dados do funcionário: {nome: "João", percentual_comissao: 10, data_inicio_comissao: "2025-11-24T15:30:00"}
✅ João - Comissão: 10%
📅 Comissão ativa desde: 24/11/2025, 15:30:00
🔍 Buscando agendamentos de 24/11/2025, 15:30:00 até 01/12/2025, 00:00:00
📋 Agendamentos encontrados: 0 ou apenas os POSTERIORES
```

#### Teste 2: Verificar no Banco

```sql
-- Ver funcionários com comissão ativa
SELECT 
  nome,
  percentual_comissao,
  data_inicio_comissao,
  TO_CHAR(data_inicio_comissao, 'DD/MM/YYYY HH24:MI:SS') as data_formatada
FROM employees 
WHERE percentual_comissao > 0
ORDER BY data_inicio_comissao DESC;
```

#### Teste 3: Desativar e Reativar

1. Edite um funcionário com 10%
2. Altere para **0%** e salve
3. Veja no banco: `data_inicio_comissao = NULL`
4. Altere novamente para **15%** e salve
5. Veja no banco: `data_inicio_comissao = NOW()` (nova data!)

### 5. Comportamento Após Aplicação

#### Criar Novo Funcionário:
```
- Comissão = 0% → data_inicio_comissao = NULL
- Comissão = 10% → data_inicio_comissao = NOW() (automático)
```

#### Editar Funcionário:
```
- 0% → 10% → data_inicio_comissao = NOW() (automático)
- 10% → 15% → data_inicio_comissao mantém a mesma
- 10% → 0% → data_inicio_comissao = NULL (limpa)
- 0% → 10% (denovo) → data_inicio_comissao = NOW() (nova data)
```

#### Calcular Comissões:
```
SEM data_inicio_comissao:
  ✅ Considera todos agendamentos do mês

COM data_inicio_comissao:
  ✅ Considera apenas agendamentos >= data_inicio_comissao
```

## Rollback (Se Precisar Desfazer)

```sql
-- Remover trigger
DROP TRIGGER IF EXISTS trigger_atualizar_data_inicio_comissao ON employees;

-- Remover função
DROP FUNCTION IF EXISTS atualizar_data_inicio_comissao();

-- Remover coluna
ALTER TABLE employees DROP COLUMN IF EXISTS data_inicio_comissao;

-- Remover índice
DROP INDEX IF EXISTS idx_employees_data_inicio_comissao;
```

## Checklist de Aplicação

- [ ] Migration aplicada no Supabase
- [ ] Coluna `data_inicio_comissao` criada
- [ ] Trigger criado e funcionando
- [ ] Dados existentes migrados (Opção A ou B)
- [ ] Teste 1 realizado (ativar comissão)
- [ ] Teste 2 realizado (verificar banco)
- [ ] Teste 3 realizado (desativar/reativar)
- [ ] Logs aparecem corretamente
- [ ] Frontend atualizado e funcionando

## Dúvidas?

**P: E se eu quiser que um funcionário específico tenha comissões retroativas?**

R: Você pode setar manualmente a `data_inicio_comissao`:
```sql
UPDATE employees 
SET data_inicio_comissao = '2025-01-01 00:00:00'
WHERE id = 'ID_DO_FUNCIONARIO';
```

**P: Posso editar a data de início manualmente?**

R: Sim! Basta fazer um UPDATE no banco:
```sql
UPDATE employees 
SET data_inicio_comissao = '2025-11-15 08:00:00'
WHERE id = 'ID_DO_FUNCIONARIO';
```

**P: O que acontece se eu deletar a `data_inicio_comissao`?**

R: O sistema volta ao comportamento antigo (considera todos agendamentos do mês)

## Status

✅ **Pronto para Aplicar**
- Migration criada
- Código frontend atualizado
- Documentação completa
- Testes definidos

📄 **Arquivos Relacionados:**
- `supabase/migrations/20250125000009-add-data-inicio-comissao.sql`
- `src/utils/commissionUtils.ts`
- `AlveX_docs/COMISSAO-DATA-INICIO.md`


