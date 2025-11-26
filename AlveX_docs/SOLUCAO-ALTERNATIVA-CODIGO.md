# 🔧 Solução Alternativa - Separar INSERT e SELECT

## O Problema

O código fazia:
```typescript
.insert([data])
.select(`
  *,
  servico:services(...),
  funcionario:employees!inner(...)
`)
```

Isso exige política de SELECT público, o que é arriscado.

## Solução Implementada

Separar em duas operações:

### 1. INSERT simples (retorna apenas ID)
```typescript
const { data: insertedRequest, error: insertError } = await supabase
  .from('appointment_requests')
  .insert([data])
  .select('id')  // Retorna apenas o ID
  .single();
```

### 2. SELECT separado (busca dados completos)
```typescript
const { data: request, error } = await supabase
  .from('appointment_requests')
  .select(`
    *,
    servico:services(nome, duracao_minutos, preco),
    funcionario:employees(nome, email, telefone)
  `)
  .eq('id', insertedRequest.id)
  .single();
```

## Vantagens

✅ INSERT precisa apenas de política INSERT
✅ SELECT pode ter política mais restritiva
✅ Mais seguro
✅ Mais flexível

## RLS Necessário

Com essa abordagem, precisa apenas:

1. **INSERT público:**
```sql
FOR INSERT TO public WITH CHECK (salao_id IS NOT NULL)
```

2. **SELECT restrito** (não precisa ser público):
```sql
-- Opção 1: SELECT público limitado
FOR SELECT TO public USING (criado_em > NOW() - INTERVAL '5 minutes')

-- Opção 2: SELECT apenas para autenticados
FOR SELECT TO authenticated USING (...)
```

## Status

✅ Código atualizado em `src/hooks/useAppointmentRequests.tsx`
⚠️ Testar após aplicar RLS correto


