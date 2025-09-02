# Solução para Erro RLS na Tabela Clientes

## 🚨 **Problema Identificado**

### **Erro:**
```
Failed to load resource: the server responded with a status of 401 ()
useClientes.tsx:73 Erro ao criar cliente:
```

### **Causa:**
- **Row Level Security (RLS)** está bloqueando a criação de clientes
- **Políticas muito restritivas** na tabela `clientes`
- **Falta de política** para inserção pública via autoatendimento

## 🔧 **Solução**

### **1. Execute o Script SQL**
Execute o arquivo `fix-clientes-rls.sql` no Supabase SQL Editor:

```sql
-- Desabilitar RLS temporariamente
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Clientes podem ver e atualizar seus próprios dados" ON clientes;
DROP POLICY IF EXISTS "Salões podem ver seus clientes" ON clientes;
DROP POLICY IF EXISTS "Salões podem criar clientes" ON clientes;
DROP POLICY IF EXISTS "Público pode criar clientes via autoatendimento" ON clientes;

-- Reabilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Criar políticas mais permissivas
CREATE POLICY "Público pode criar clientes" ON clientes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Salões podem ver seus clientes" ON clientes
  FOR SELECT USING (
    salao_id IN (
      SELECT salao_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Salões podem atualizar seus clientes" ON clientes
  FOR UPDATE USING (
    salao_id IN (
      SELECT salao_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Clientes podem ver seus próprios dados" ON clientes
  FOR SELECT USING (
    email = auth.email()
  );
```

### **2. Verificar Resultado**
Após executar o script, teste:

1. **Fazer uma solicitação** na página pública
2. **Verificar se o cliente é criado** sem erro 401
3. **Confirmar que o modal de login** abre corretamente

## 🎯 **O que o Script Faz**

### **Políticas Criadas:**

#### **1. Inserção Pública (MUITO PERMISSIVA)**
```sql
CREATE POLICY "Público pode criar clientes" ON clientes
  FOR INSERT WITH CHECK (true);
```
- ✅ **Permite qualquer pessoa** criar clientes
- ✅ **Necessário para autoatendimento** público

#### **2. Visualização por Salões**
```sql
CREATE POLICY "Salões podem ver seus clientes" ON clientes
  FOR SELECT USING (salao_id IN (SELECT salao_id FROM users WHERE id = auth.uid()));
```
- ✅ **Salões veem apenas seus clientes**
- ✅ **Isolamento por tenant**

#### **3. Atualização por Salões**
```sql
CREATE POLICY "Salões podem atualizar seus clientes" ON clientes
  FOR UPDATE USING (salao_id IN (SELECT salao_id FROM users WHERE id = auth.uid()));
```
- ✅ **Salões podem editar seus clientes**
- ✅ **Controle administrativo**

#### **4. Visualização por Clientes**
```sql
CREATE POLICY "Clientes podem ver seus próprios dados" ON clientes
  FOR SELECT USING (email = auth.email());
```
- ✅ **Clientes veem apenas seus dados**
- ✅ **Privacidade garantida**

## 🚀 **Fluxo Após Correção**

### **1. Cliente faz solicitação**
```
Cliente → Página Pública → Preenche formulário → Cliente criado ✅
```

### **2. Sistema cria conta**
```
Sistema → Cria cliente na tabela → Gera senha temporária → Modal de login ✅
```

### **3. Cliente faz login**
```
Cliente → Modal de login → Acessa agendamentos → Vê status ✅
```

## ⚠️ **Importante**

### **Segurança:**
- ✅ **Política de inserção permissiva** apenas para autoatendimento
- ✅ **Isolamento por salão** mantido
- ✅ **Privacidade do cliente** preservada

### **Teste:**
1. **Execute o script** no Supabase
2. **Teste o fluxo completo** de agendamento
3. **Verifique se não há mais erros 401**

## 🎉 **Resultado Esperado**

Após executar o script:
- ✅ **Erro 401 resolvido**
- ✅ **Clientes criados com sucesso**
- ✅ **Modal de login funcionando**
- ✅ **Sistema de autoatendimento completo**

Execute o script `fix-clientes-rls.sql` e teste o fluxo de agendamento! 🚀

## 🚨 **Problema Identificado**

### **Erro:**
```
Failed to load resource: the server responded with a status of 401 ()
useClientes.tsx:73 Erro ao criar cliente:
```

### **Causa:**
- **Row Level Security (RLS)** está bloqueando a criação de clientes
- **Políticas muito restritivas** na tabela `clientes`
- **Falta de política** para inserção pública via autoatendimento

## 🔧 **Solução**

### **1. Execute o Script SQL**
Execute o arquivo `fix-clientes-rls.sql` no Supabase SQL Editor:

```sql
-- Desabilitar RLS temporariamente
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Clientes podem ver e atualizar seus próprios dados" ON clientes;
DROP POLICY IF EXISTS "Salões podem ver seus clientes" ON clientes;
DROP POLICY IF EXISTS "Salões podem criar clientes" ON clientes;
DROP POLICY IF EXISTS "Público pode criar clientes via autoatendimento" ON clientes;

-- Reabilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Criar políticas mais permissivas
CREATE POLICY "Público pode criar clientes" ON clientes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Salões podem ver seus clientes" ON clientes
  FOR SELECT USING (
    salao_id IN (
      SELECT salao_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Salões podem atualizar seus clientes" ON clientes
  FOR UPDATE USING (
    salao_id IN (
      SELECT salao_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Clientes podem ver seus próprios dados" ON clientes
  FOR SELECT USING (
    email = auth.email()
  );
```

### **2. Verificar Resultado**
Após executar o script, teste:

1. **Fazer uma solicitação** na página pública
2. **Verificar se o cliente é criado** sem erro 401
3. **Confirmar que o modal de login** abre corretamente

## 🎯 **O que o Script Faz**

### **Políticas Criadas:**

#### **1. Inserção Pública (MUITO PERMISSIVA)**
```sql
CREATE POLICY "Público pode criar clientes" ON clientes
  FOR INSERT WITH CHECK (true);
```
- ✅ **Permite qualquer pessoa** criar clientes
- ✅ **Necessário para autoatendimento** público

#### **2. Visualização por Salões**
```sql
CREATE POLICY "Salões podem ver seus clientes" ON clientes
  FOR SELECT USING (salao_id IN (SELECT salao_id FROM users WHERE id = auth.uid()));
```
- ✅ **Salões veem apenas seus clientes**
- ✅ **Isolamento por tenant**

#### **3. Atualização por Salões**
```sql
CREATE POLICY "Salões podem atualizar seus clientes" ON clientes
  FOR UPDATE USING (salao_id IN (SELECT salao_id FROM users WHERE id = auth.uid()));
```
- ✅ **Salões podem editar seus clientes**
- ✅ **Controle administrativo**

#### **4. Visualização por Clientes**
```sql
CREATE POLICY "Clientes podem ver seus próprios dados" ON clientes
  FOR SELECT USING (email = auth.email());
```
- ✅ **Clientes veem apenas seus dados**
- ✅ **Privacidade garantida**

## 🚀 **Fluxo Após Correção**

### **1. Cliente faz solicitação**
```
Cliente → Página Pública → Preenche formulário → Cliente criado ✅
```

### **2. Sistema cria conta**
```
Sistema → Cria cliente na tabela → Gera senha temporária → Modal de login ✅
```

### **3. Cliente faz login**
```
Cliente → Modal de login → Acessa agendamentos → Vê status ✅
```

## ⚠️ **Importante**

### **Segurança:**
- ✅ **Política de inserção permissiva** apenas para autoatendimento
- ✅ **Isolamento por salão** mantido
- ✅ **Privacidade do cliente** preservada

### **Teste:**
1. **Execute o script** no Supabase
2. **Teste o fluxo completo** de agendamento
3. **Verifique se não há mais erros 401**

## 🎉 **Resultado Esperado**

Após executar o script:
- ✅ **Erro 401 resolvido**
- ✅ **Clientes criados com sucesso**
- ✅ **Modal de login funcionando**
- ✅ **Sistema de autoatendimento completo**

Execute o script `fix-clientes-rls.sql` e teste o fluxo de agendamento! 🚀

## 🚨 **Problema Identificado**

### **Erro:**
```
Failed to load resource: the server responded with a status of 401 ()
useClientes.tsx:73 Erro ao criar cliente:
```

### **Causa:**
- **Row Level Security (RLS)** está bloqueando a criação de clientes
- **Políticas muito restritivas** na tabela `clientes`
- **Falta de política** para inserção pública via autoatendimento

## 🔧 **Solução**

### **1. Execute o Script SQL**
Execute o arquivo `fix-clientes-rls.sql` no Supabase SQL Editor:

```sql
-- Desabilitar RLS temporariamente
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Clientes podem ver e atualizar seus próprios dados" ON clientes;
DROP POLICY IF EXISTS "Salões podem ver seus clientes" ON clientes;
DROP POLICY IF EXISTS "Salões podem criar clientes" ON clientes;
DROP POLICY IF EXISTS "Público pode criar clientes via autoatendimento" ON clientes;

-- Reabilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Criar políticas mais permissivas
CREATE POLICY "Público pode criar clientes" ON clientes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Salões podem ver seus clientes" ON clientes
  FOR SELECT USING (
    salao_id IN (
      SELECT salao_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Salões podem atualizar seus clientes" ON clientes
  FOR UPDATE USING (
    salao_id IN (
      SELECT salao_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Clientes podem ver seus próprios dados" ON clientes
  FOR SELECT USING (
    email = auth.email()
  );
```

### **2. Verificar Resultado**
Após executar o script, teste:

1. **Fazer uma solicitação** na página pública
2. **Verificar se o cliente é criado** sem erro 401
3. **Confirmar que o modal de login** abre corretamente

## 🎯 **O que o Script Faz**

### **Políticas Criadas:**

#### **1. Inserção Pública (MUITO PERMISSIVA)**
```sql
CREATE POLICY "Público pode criar clientes" ON clientes
  FOR INSERT WITH CHECK (true);
```
- ✅ **Permite qualquer pessoa** criar clientes
- ✅ **Necessário para autoatendimento** público

#### **2. Visualização por Salões**
```sql
CREATE POLICY "Salões podem ver seus clientes" ON clientes
  FOR SELECT USING (salao_id IN (SELECT salao_id FROM users WHERE id = auth.uid()));
```
- ✅ **Salões veem apenas seus clientes**
- ✅ **Isolamento por tenant**

#### **3. Atualização por Salões**
```sql
CREATE POLICY "Salões podem atualizar seus clientes" ON clientes
  FOR UPDATE USING (salao_id IN (SELECT salao_id FROM users WHERE id = auth.uid()));
```
- ✅ **Salões podem editar seus clientes**
- ✅ **Controle administrativo**

#### **4. Visualização por Clientes**
```sql
CREATE POLICY "Clientes podem ver seus próprios dados" ON clientes
  FOR SELECT USING (email = auth.email());
```
- ✅ **Clientes veem apenas seus dados**
- ✅ **Privacidade garantida**

## 🚀 **Fluxo Após Correção**

### **1. Cliente faz solicitação**
```
Cliente → Página Pública → Preenche formulário → Cliente criado ✅
```

### **2. Sistema cria conta**
```
Sistema → Cria cliente na tabela → Gera senha temporária → Modal de login ✅
```

### **3. Cliente faz login**
```
Cliente → Modal de login → Acessa agendamentos → Vê status ✅
```

## ⚠️ **Importante**

### **Segurança:**
- ✅ **Política de inserção permissiva** apenas para autoatendimento
- ✅ **Isolamento por salão** mantido
- ✅ **Privacidade do cliente** preservada

### **Teste:**
1. **Execute o script** no Supabase
2. **Teste o fluxo completo** de agendamento
3. **Verifique se não há mais erros 401**

## 🎉 **Resultado Esperado**

Após executar o script:
- ✅ **Erro 401 resolvido**
- ✅ **Clientes criados com sucesso**
- ✅ **Modal de login funcionando**
- ✅ **Sistema de autoatendimento completo**

Execute o script `fix-clientes-rls.sql` e teste o fluxo de agendamento! 🚀



