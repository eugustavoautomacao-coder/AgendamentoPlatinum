# 📅 Sistema de Data de Início de Comissão

## Regra de Negócio

**Problema:** Quando um funcionário começa a usar comissão (ex: muda de 0% para 10%), não queremos calcular comissão sobre agendamentos antigos, apenas sobre os novos.

**Solução:** Campo `data_inicio_comissao` que registra quando a comissão foi ativada.

## Como Funciona

### 1. Quando a Comissão é Ativada

```sql
-- Funcionário tem 0% ou NULL
UPDATE employees SET percentual_comissao = 10 WHERE id = 'abc123';

-- Trigger automático seta:
data_inicio_comissao = NOW()
```

### 2. Cálculo de Comissões

Quando calcular comissões mensais:
```sql
-- SEM data_inicio_comissao (comportamento antigo):
SELECT * FROM appointments 
WHERE funcionario_id = 'abc123'
  AND data_hora >= '2025-11-01'  -- Início do mês
  AND data_hora < '2025-12-01'   -- Fim do mês
  AND status = 'concluido';

-- COM data_inicio_comissao (novo comportamento):
SELECT * FROM appointments 
WHERE funcionario_id = 'abc123'
  AND data_hora >= GREATEST('2025-11-01', data_inicio_comissao) -- Maior data
  AND data_hora < '2025-12-01'
  AND status = 'concluido';
```

## Cenários de Uso

### Cenário 1: Ativar Comissão Meio do Mês

**Situação:**
- Data: 15/11/2025
- Funcionário tinha 0% desde sempre
- Alterou para 10% hoje

**Resultado:**
- `data_inicio_comissao = 15/11/2025 10:30:00`
- Agendamentos de 01/11 a 14/11: ❌ NÃO geram comissão
- Agendamentos de 15/11 em diante: ✅ Geram comissão

### Cenário 2: Ativar Comissão Início do Mês

**Situação:**
- Data: 01/11/2025
- Funcionário tinha 0% desde sempre
- Alterou para 10% hoje

**Resultado:**
- `data_inicio_comissao = 01/11/2025 09:00:00`
- Todos agendamentos de novembro: ✅ Geram comissão

### Cenário 3: Funcionário Já Tinha Comissão

**Situação:**
- Funcionário já tinha 10% desde outubro
- Alterou para 15% em novembro

**Resultado:**
- `data_inicio_comissao` NÃO muda (mantém data de quando ativou originalmente)
- Todos agendamentos desde a ativação original: ✅ Geram comissão

### Cenário 4: Desativar e Reativar Comissão

**Situação:**
- Funcionário tinha 10% (data_inicio: 01/10/2025)
- Alterou para 0% em 15/11/2025
- Alterou para 12% em 20/11/2025

**Resultado:**
```
15/11/2025: percentual_comissao = 0, data_inicio_comissao = NULL
20/11/2025: percentual_comissao = 12, data_inicio_comissao = 20/11/2025 (NOVA DATA)
```
- Agendamentos de 01/10 a 14/11: ✅ Geraram comissão (10%)
- Agendamentos de 15/11 a 19/11: ❌ NÃO geram comissão (estava 0%)
- Agendamentos de 20/11 em diante: ✅ Geram comissão (12%)

## Implementação Técnica

### Migration SQL

```sql
-- Adicionar coluna
ALTER TABLE employees ADD COLUMN data_inicio_comissao timestamp with time zone;

-- Trigger automático
CREATE OR REPLACE FUNCTION atualizar_data_inicio_comissao()
RETURNS TRIGGER AS $$
BEGIN
  -- Comissão foi ativada (de 0 para > 0)
  IF (OLD.percentual_comissao = 0 OR OLD.percentual_comissao IS NULL)
     AND NEW.percentual_comissao > 0 
     AND NEW.data_inicio_comissao IS NULL THEN
    NEW.data_inicio_comissao := NOW();
  END IF;
  
  -- Comissão foi desativada (de > 0 para 0)
  IF OLD.percentual_comissao > 0 
     AND (NEW.percentual_comissao = 0 OR NEW.percentual_comissao IS NULL) THEN
    NEW.data_inicio_comissao := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_data_inicio_comissao
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_inicio_comissao();
```

### Frontend (commissionUtils.ts)

```typescript
// Buscar funcionário com data_inicio_comissao
const { data: funcionario } = await supabase
  .from('employees')
  .select('salao_id, percentual_comissao, nome, data_inicio_comissao')
  .eq('id', funcionarioId)
  .single();

// Definir data mínima
let dataMinima = startDate; // Início do mês
if (funcionario.data_inicio_comissao) {
  const dataInicioComissao = new Date(funcionario.data_inicio_comissao).toISOString();
  dataMinima = dataInicioComissao > startDate ? dataInicioComissao : startDate;
}

// Buscar agendamentos >= dataMinima
const { data: agendamentos } = await supabase
  .from('appointments')
  .select('*')
  .eq('funcionario_id', funcionarioId)
  .eq('status', 'concluido')
  .gte('data_hora', dataMinima)  // ✅ Usando data mínima
  .lt('data_hora', endDate);
```

## Logs de Debug

Os logs agora mostram:

```
📊 Dados do funcionário: {nome: "João", percentual_comissao: 10, data_inicio_comissao: "2025-11-15T10:30:00"}
✅ João - Comissão: 10%
📅 Comissão ativa desde: 15/11/2025, 10:30:00
🔍 Buscando agendamentos de 15/11/2025, 10:30:00 até 01/12/2025, 00:00:00
📋 Agendamentos encontrados: 5
```

## Migração de Dados Existentes

Para funcionários que já têm comissão > 0:

```sql
-- Opção 1: Setar como hoje (conservador)
UPDATE employees 
SET data_inicio_comissao = NOW()
WHERE percentual_comissao > 0 
  AND data_inicio_comissao IS NULL;

-- Opção 2: Setar como data do primeiro agendamento (liberal)
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

## Interface (Futuro - Opcional)

Adicionar campo no formulário de edição de funcionário:

```tsx
<Label>Data de Início da Comissão</Label>
<Input 
  type="datetime-local"
  value={dataInicioComissao}
  onChange={(e) => setDataInicioComissao(e.target.value)}
  disabled={percentualComissao === 0}
/>
<p className="text-sm text-gray-500">
  Comissões serão calculadas apenas para agendamentos a partir desta data
</p>
```

## Status

✅ **Implementado**
- Migration criada
- Trigger automático
- Lógica de cálculo atualizada
- Logs de debug

⚠️ **Pendente**
- Aplicar migration no banco
- Testar em produção
- Interface visual (opcional)

## Como Aplicar

1. Execute a migration:
```bash
supabase migration up
```

Ou no SQL Editor do Supabase:
```sql
-- Cole o conteúdo de:
-- supabase/migrations/20250125000009-add-data-inicio-comissao.sql
```

2. Teste alterando comissão de 0% para 10%

3. Verifique os logs no console

4. ✅ Pronto!


