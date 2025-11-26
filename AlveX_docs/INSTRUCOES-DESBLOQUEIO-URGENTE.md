# 🚨 Instruções de Desbloqueio Urgente

## O problema

A política RLS continua bloqueando mesmo com a política temporária aplicada.

## Solução: Desabilitar RLS completamente (TEMPORÁRIO!)

### Passo 1: Execute este SQL

```sql
-- Remover TODAS as políticas
DROP POLICY IF EXISTS "Public can create appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "TEMP_DEBUG_Public_create_requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Users can view appointment requests in their salon" ON public.appointment_requests;
DROP POLICY IF EXISTS "Admins can manage appointment requests in their salon" ON public.appointment_requests;

-- Desabilitar RLS COMPLETAMENTE
ALTER TABLE public.appointment_requests DISABLE ROW LEVEL SECURITY;
```

### Passo 2: Teste

Tente criar uma solicitação na página pública. **Deve funcionar agora.**

### Passo 3: Verificar dados

Execute `VERIFICAR-ESTRUTURA-TABELA.sql` para confirmar que os IDs existem nas tabelas relacionadas.

### Passo 4: Reabilitar RLS (depois de testar)

```sql
-- Reabilitar RLS
ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;

-- Aplicar política super permissiva primeiro
CREATE POLICY "Public can create appointment requests" 
ON public.appointment_requests
FOR INSERT 
TO public
WITH CHECK (true);

-- Teste novamente. Se funcionar, aplicar política mais restritiva depois.
```

## Por que isso é necessário?

Pode haver:
1. Políticas antigas conflitantes
2. Problema nas foreign keys
3. Alguma configuração do Supabase bloqueando

## ⚠️ IMPORTANTE

Com RLS desabilitado, **QUALQUER UM** pode criar solicitações. Use apenas para:
- ✅ Testar se é realmente a RLS bloqueando
- ✅ Desbloquear o sistema urgentemente
- ❌ **NÃO deixe assim em produção!**

Após confirmar que funciona, reabilite e aplique políticas corretas.

## Arquivos de referência

- 📄 `FORCAR-DESBLOQUEIO-RLS.sql` - Script completo
- 📄 `VERIFICAR-ESTRUTURA-TABELA.sql` - Validar estrutura


