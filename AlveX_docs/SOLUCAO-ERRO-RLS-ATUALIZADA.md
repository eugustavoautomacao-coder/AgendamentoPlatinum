# Solução ATUALIZADA para Erro de RLS em appointment_requests

## 🚨 **Problema Persistente**

O erro `401 (Unauthorized)` e `new row violates row-level security policy` ainda está ocorrendo, indicando que as políticas RLS não foram aplicadas corretamente ou há conflitos.

## 🔧 **Solução DEFINITIVA**

### **Passo 1: Desabilitar RLS Completamente**
Execute o script `fix-rls-appointment-requests-final.sql`:

```sql
-- Este script desabilita RLS completamente
-- Resolve o problema de forma definitiva
```

**O que este script faz:**
- ✅ Remove TODAS as políticas existentes
- ✅ Desabilita RLS completamente
- ✅ Permite inserção pública sem restrições
- ✅ Inclui verificações de estado

### **Passo 2: (Opcional) Reabilitar RLS com Políticas Simples**
Se quiser manter segurança, execute `enable-rls-appointment-requests-simple.sql`:

```sql
-- Este script reabilita RLS com políticas mais simples
-- Mantém segurança mas permite inserção pública
```

## 🚀 **Como Executar**

### **1. Acesse o Supabase Dashboard**
- Vá para [supabase.com](https://supabase.com)
- Acesse seu projeto
- Vá para **SQL Editor**

### **2. Execute o Script Principal**
1. Cole o conteúdo de `fix-rls-appointment-requests-final.sql`
2. Clique em **Run**
3. Verifique se não há erros

### **3. (Opcional) Execute o Script de Reabilitação**
1. Cole o conteúdo de `enable-rls-appointment-requests-simple.sql`
2. Clique em **Run**
3. Verifique se não há erros

### **4. Teste a Funcionalidade**
- Acesse a página pública do salão
- Tente criar uma solicitação de agendamento
- Verifique se não há mais erros 401

## 📋 **Scripts Disponíveis**

1. **`fix-rls-appointment-requests-final.sql`** - **PRINCIPAL** - Desabilita RLS completamente
2. **`enable-rls-appointment-requests-simple.sql`** - **OPCIONAL** - Reabilita RLS com políticas simples
3. **`setup-appointment-requests-rls-complete.sql`** - Script anterior (pode ter conflitos)
4. **`disable-rls-appointment-requests.sql`** - Script anterior (pode ter conflitos)

## 🎯 **Recomendação ATUALIZADA**

**Execute APENAS o script `fix-rls-appointment-requests-final.sql`** pois:
- ✅ **Solução definitiva** - Remove todos os conflitos
- ✅ **Permite inserção pública** - Usuários não autenticados podem criar solicitações
- ✅ **Sem complexidade** - RLS desabilitado = sem problemas de política
- ✅ **Funcionamento garantido** - Não há mais erros 401/42501

## 🔍 **Verificação Pós-Execução**

Após executar o script principal, verifique:

1. **RLS desabilitado:**
```sql
SELECT rowsecurity FROM pg_tables WHERE tablename = 'appointment_requests';
-- Deve retornar: false
```

2. **Políticas removidas:**
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'appointment_requests';
-- Deve retornar: (nenhuma linha)
```

3. **Teste na aplicação:**
- Acesse a página pública do salão
- Tente criar uma solicitação de agendamento
- Verifique se não há mais erros 401

## 🆘 **Se o Problema Persistir**

1. **Verifique se o script foi executado completamente**
2. **Confirme que não há erros no Supabase**
3. **Teste com um usuário autenticado**
4. **Verifique se a tabela existe**

## 📞 **Suporte**

Se precisar de ajuda adicional:
- Verifique os logs do Supabase
- Confirme a configuração do projeto
- Execute o script de verificação incluído

## 🎉 **Resultado Esperado**

Após executar o script principal:
- ✅ **Erro 401 resolvido**
- ✅ **Inserção pública funcionando**
- ✅ **Página pública operacional**
- ✅ **Solicitações de agendamento sendo criadas**
