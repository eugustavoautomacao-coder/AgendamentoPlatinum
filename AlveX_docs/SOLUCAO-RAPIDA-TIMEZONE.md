# ⚡ Solução Rápida: Ajustar Data de Início da Comissão

## Problema

A comissão foi ativada às **16:52** (horário Brasil), mas como o banco salva em UTC, está registrada como **19:52 UTC**.

Agendamentos criados entre **16:52 e 19:52** (horário Brasil) podem não ser contabilizados devido a inconsistências de timezone.

## Solução Temporária: Ajustar Manualmente

### Opção 1: Definir início da comissão como INÍCIO DO MÊS

```sql
-- Setar início da comissão para 01/11/2025 00:00
UPDATE employees 
SET data_inicio_comissao = '2025-11-01 00:00:00+00'
WHERE id = '5fb99bbf-bc40-48be-be03-3831fa22635c';

-- Verificar
SELECT 
  nome,
  TO_CHAR(data_inicio_comissao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI:SS') as comissao_desde
FROM employees
WHERE id = '5fb99bbf-bc40-48be-be03-3831fa22635c';
```

**Resultado:** Todos os agendamentos de novembro contarão para comissão.

### Opção 2: Definir como AGORA (hora atual)

```sql
-- Setar início da comissão para agora
UPDATE employees 
SET data_inicio_comissao = NOW()
WHERE id = '5fb99bbf-bc40-48be-be03-3831fa22635c';
```

**Resultado:** Apenas agendamentos daqui pra frente contarão.

### Opção 3: Definir hora específica (horário Brasil)

```sql
-- Setar para 24/11/2025 às 16:00 (horário de Brasília)
UPDATE employees 
SET data_inicio_comissao = '2025-11-24 16:00:00-03'
WHERE id = '5fb99bbf-bc40-48be-be03-3831fa22635c';
```

## Recomendação

Para teste rápido, use a **Opção 1** (início do mês):

```sql
UPDATE employees 
SET data_inicio_comissao = '2025-11-01 00:00:00+00'
WHERE id = '5fb99bbf-bc40-48be-be03-3831fa22635c';
```

Depois execute no sistema:
1. Vá em **Comissões Mensais**
2. Clique em **"Atualizar"**
3. Deve encontrar os agendamentos agora! ✅

## Fix Permanente no Trigger

Para corrigir o trigger e considerar timezone corretamente:

```sql
CREATE OR REPLACE FUNCTION public.atualizar_data_inicio_comissao()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.percentual_comissao IS NULL OR OLD.percentual_comissao = 0) 
     AND NEW.percentual_comissao > 0 
     AND NEW.data_inicio_comissao IS NULL THEN
    -- Usar timezone do Brasil ao invés de UTC puro
    NEW.data_inicio_comissao := (NOW() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'UTC';
  END IF;
  
  IF (OLD.percentual_comissao > 0) 
     AND (NEW.percentual_comissao IS NULL OR NEW.percentual_comissao = 0) THEN
    NEW.data_inicio_comissao := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Porém, NOW() já retorna em UTC corretamente, o problema não é o trigger.**

## Causa Real

O problema é que:
1. Trigger salva corretamente em UTC ✅
2. Frontend mostra corretamente no horário local ✅
3. Mas agendamentos podem estar sendo criados com hora local sem conversão ❌

## Teste Definitivo

Execute no SQL e me envie o resultado:

```sql
SELECT 
  'Comissão' as tipo,
  TO_CHAR(data_inicio_comissao, 'YYYY-MM-DD HH24:MI:SS TZ') as data_completa,
  TO_CHAR(data_inicio_comissao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI:SS') as horario_brasil
FROM employees
WHERE id = '5fb99bbf-bc40-48be-be03-3831fa22635c'

UNION ALL

SELECT 
  'Agendamento' as tipo,
  TO_CHAR(data_hora, 'YYYY-MM-DD HH24:MI:SS TZ') as data_completa,
  TO_CHAR(data_hora AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI:SS') as horario_brasil
FROM appointments
WHERE (funcionario_id = '5fb99bbf-bc40-48be-be03-3831fa22635c'
   OR employee_id = '5fb99bbf-bc40-48be-be03-3831fa22635c')
ORDER BY tipo, data_completa DESC;
```


