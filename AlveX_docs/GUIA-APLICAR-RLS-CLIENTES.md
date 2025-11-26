# 📋 Guia: Aplicar RLS na Tabela `clientes`

## ⚠️ **IMPORTANTE: TESTE INCREMENTAL**

Este guia vai te ajudar a aplicar RLS na tabela `clientes` de forma segura, testando cada passo.

---

## 📝 **PRÉ-REQUISITOS**

1. ✅ Acesso ao Supabase Dashboard
2. ✅ Acesso ao SQL Editor do Supabase
3. ✅ Backup do banco de dados (recomendado)
4. ✅ Tempo para testar após aplicar

---

## 🚀 **PASSO A PASSO**

### **PASSO 1: Verificar Estado Atual**

1. Acesse o Supabase Dashboard
2. Vá em **Table Editor** → **clientes**
3. Verifique se está marcado como **"Unrestricted"**
4. Anote quantos registros existem na tabela

### **PASSO 2: Aplicar Migration**

1. Acesse o **SQL Editor** no Supabase Dashboard
2. Abra o arquivo: `supabase/migrations/20250125000000-fix-clientes-rls-security.sql`
3. Copie TODO o conteúdo do arquivo
4. Cole no SQL Editor
5. Clique em **RUN** ou pressione `Ctrl+Enter`

### **PASSO 3: Verificar Aplicação**

1. Volte para **Table Editor** → **clientes**
2. Verifique se o status mudou de **"Unrestricted"** para **"Restricted"**
3. Se ainda estiver "Unrestricted", verifique se há erros no SQL Editor

### **PASSO 4: Testar Funcionalidades**

Teste cada funcionalidade abaixo:

#### ✅ **Teste 1: Login de Cliente (Público)**
- Acesse a página de login de cliente
- Tente fazer login com um email de cliente existente
- **Esperado:** Login deve funcionar normalmente

#### ✅ **Teste 2: Login de Admin**
- Faça login como admin
- Acesse a página de clientes
- **Esperado:** Deve listar clientes do salão

#### ✅ **Teste 3: Criar Novo Cliente**
- Como admin, tente criar um novo cliente
- **Esperado:** Deve criar com sucesso

#### ✅ **Teste 4: Atualizar Cliente**
- Como admin, tente atualizar um cliente
- **Esperado:** Deve atualizar com sucesso

#### ✅ **Teste 5: Verificar Agendamentos Online**
- Tente criar um agendamento online (como público)
- **Esperado:** Deve criar cliente automaticamente se não existir

---

## 🔍 **VERIFICAÇÃO DE POLÍTICAS**

Após aplicar a migration, verifique as políticas criadas:

```sql
-- Execute no SQL Editor para ver todas as políticas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'clientes'
ORDER BY policyname;
```

Você deve ver 6 políticas:
1. ✅ `Public can insert clients`
2. ✅ `Clients can view their own data`
3. ✅ `Salon admins can view clients in their salon`
4. ✅ `Salon admins can manage clients in their salon`
5. ✅ `Clients can update their own data`
6. ✅ `Public can check email existence`

---

## ⚠️ **SE ALGO DER ERRADO**

### **Problema: Login de cliente não funciona**

**Solução:**
```sql
-- Verificar se a política pública está funcionando
SELECT * FROM pg_policies WHERE tablename = 'clientes' AND policyname = 'Public can check email existence';

-- Se não existir, recriar:
CREATE POLICY "Public can check email existence" 
ON public.clientes
FOR SELECT 
TO public
USING (true);
```

### **Problema: Admin não consegue ver clientes**

**Solução:**
```sql
-- Verificar se o usuário tem o tipo correto
SELECT id, email, tipo, salao_id FROM public.users WHERE email = 'seu-email@exemplo.com';

-- Verificar política de admins
SELECT * FROM pg_policies WHERE tablename = 'clientes' AND policyname = 'Salon admins can view clients in their salon';
```

### **Problema: Não consegue criar cliente**

**Solução:**
```sql
-- Verificar política de inserção pública
SELECT * FROM pg_policies WHERE tablename = 'clientes' AND policyname = 'Public can insert clients';

-- Verificar se salao_id existe
SELECT id, nome FROM public.saloes WHERE id = 'salao-id-aqui';
```

### **Problema: Desabilitar RLS temporariamente**

**⚠️ ATENÇÃO: Isso remove toda a segurança!**

```sql
-- Apenas para testes/debug
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
```

---

## 📊 **CHECKLIST PÓS-APLICAÇÃO**

- [ ] RLS habilitado na tabela `clientes`
- [ ] Status mudou de "Unrestricted" para "Restricted"
- [ ] Login de cliente funciona
- [ ] Login de admin funciona
- [ ] Admin consegue ver clientes
- [ ] Admin consegue criar clientes
- [ ] Admin consegue atualizar clientes
- [ ] Agendamentos online funcionam
- [ ] Cliente consegue atualizar próprio perfil
- [ ] Não há erros no console do navegador

---

## 🎯 **PRÓXIMOS PASSOS**

Após confirmar que tudo funciona:

1. ✅ Documentar qualquer ajuste necessário
2. ✅ Aplicar RLS em outras tabelas (incrementalmente)
3. ✅ Monitorar logs por alguns dias
4. ✅ Atualizar documentação de segurança

---

## 📞 **SUPORTE**

Se encontrar problemas:
1. Verifique os logs do Supabase
2. Verifique o console do navegador
3. Execute as queries de verificação acima
4. Documente o erro encontrado


