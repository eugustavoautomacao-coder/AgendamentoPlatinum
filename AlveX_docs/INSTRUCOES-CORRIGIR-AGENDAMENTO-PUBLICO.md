# 🔧 Instruções: Corrigir Agendamento Público

## ❌ **PROBLEMA**

Após implementar RLS, a página pública não consegue listar profissionais.

## ✅ **SOLUÇÃO EM 2 PASSOS**

### **PASSO 1: Aplicar Migration Corrigida**

1. Acesse o **Supabase Dashboard** → **SQL Editor**
2. Execute a migration:
   - Arquivo: `supabase/migrations/20250125000004-fix-employees-rls-security.sql`
3. Verifique se a política foi criada:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'employees' 
   AND policyname = 'Public can view active employees';
   ```

### **PASSO 2: Verificar Query no Frontend**

A query na página pública já foi corrigida para:
- ✅ Filtrar apenas funcionários ativos (`.eq('ativo', true)`)
- ✅ Filtrar por salão (`.eq('salao_id', salaoId)`)
- ✅ Selecionar apenas campos necessários (sem dados sensíveis)

## 🧪 **TESTE**

1. Acesse a página pública: `/salao/{salaoId}`
2. Selecione um serviço
3. Verifique se os profissionais aparecem na lista
4. Tente fazer um agendamento completo

## 🔒 **SEGURANÇA MANTIDA**

- ✅ Apenas funcionários **ativos** são visíveis
- ✅ Apenas campos básicos são expostos (id, nome, avatar_url)
- ✅ Dados sensíveis (comissões, etc.) não são acessíveis
- ✅ Filtro por `salao_id` garante isolamento

## ⚠️ **SE AINDA NÃO FUNCIONAR**

Verifique no console do navegador:
1. Abra DevTools (F12)
2. Vá para a aba "Network"
3. Procure pela requisição a `employees`
4. Verifique o erro retornado
5. Compartilhe o erro para análise


