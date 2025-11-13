# Solução para Erro de RLS em appointment_requests

## 🚨 **Problema Identificado**

O erro `401 (Unauthorized)` e `new row violates row-level security policy` indica que as políticas de Row Level Security (RLS) da tabela `appointment_requests` não estão permitindo inserções para usuários não autenticados (página pública).

## 🔧 **Soluções Disponíveis**

### **Opção 1: Corrigir Políticas RLS (Recomendado)**
Execute o script `setup-appointment-requests-rls-complete.sql`:

```sql
-- Este script configura corretamente as políticas RLS
-- Permitindo inserção pública e gerenciamento por salões
```

**Vantagens:**
- ✅ Mantém segurança
- ✅ Permite inserção pública
- ✅ Controla acesso por salão

### **Opção 2: Desabilitar RLS Temporariamente**
Execute o script `disable-rls-appointment-requests.sql`:

```sql
-- Desabilita RLS para permitir inserções públicas
ALTER TABLE appointment_requests DISABLE ROW LEVEL SECURITY;
```

**Vantagens:**
- ✅ Solução rápida
- ✅ Permite inserção pública

**Desvantagens:**
- ❌ Remove controle de acesso
- ❌ Menos seguro

### **Opção 3: Corrigir Políticas Existentes**
Execute o script `fix-appointment-requests-rls.sql`:

```sql
-- Remove e recria as políticas existentes
```

## 🚀 **Como Executar**

### **1. Acesse o Supabase Dashboard**
- Vá para [supabase.com](https://supabase.com)
- Acesse seu projeto
- Vá para **SQL Editor**

### **2. Execute o Script Escolhido**
- Cole o conteúdo do script escolhido
- Clique em **Run**

### **3. Verifique o Resultado**
- Confirme que não há erros
- Teste a funcionalidade na página pública

## 📋 **Scripts Disponíveis**

1. **`setup-appointment-requests-rls-complete.sql`** - Solução completa e segura
2. **`disable-rls-appointment-requests.sql`** - Solução rápida (menos segura)
3. **`fix-appointment-requests-rls.sql`** - Correção das políticas existentes

## 🎯 **Recomendação**

**Use o script `setup-appointment-requests-rls-complete.sql`** pois:
- ✅ Mantém a segurança
- ✅ Permite inserção pública
- ✅ Controla acesso por salão
- ✅ Configuração robusta e bem definida

## 🔍 **Verificação Pós-Execução**

Após executar o script, verifique:

1. **Políticas criadas:**
```sql
SELECT policyname, cmd, roles FROM pg_policies 
WHERE tablename = 'appointment_requests';
```

2. **RLS habilitado:**
```sql
SELECT rowsecurity FROM pg_tables 
WHERE tablename = 'appointment_requests';
```

3. **Teste na aplicação:**
- Acesse a página pública do salão
- Tente criar uma solicitação de agendamento
- Verifique se não há mais erros 401

## 🆘 **Se o Problema Persistir**

1. **Verifique as credenciais do Supabase**
2. **Confirme se a tabela existe**
3. **Verifique se as políticas foram aplicadas**
4. **Teste com um usuário autenticado**

## 📞 **Suporte**

Se precisar de ajuda adicional:
- Verifique os logs do Supabase
- Confirme a configuração do projeto
- Teste as políticas individualmente
