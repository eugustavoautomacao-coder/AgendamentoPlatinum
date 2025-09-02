# Sistema de Aprovação de Agendamentos - Implementação Completa

## 🎯 **Funcionalidade Implementada**

### **Fluxo de Aprovação de Solicitações**
1. ✅ **Cliente faz solicitação** na página pública
2. ✅ **Admin/Profissional aprova** na página de "Solicitações de Agendamento"
3. ✅ **Agendamento é criado automaticamente** na agenda do profissional
4. ✅ **Card aparece no horário correto** na agenda

## 🔧 **Como Funciona**

### **1. Aprovação de Solicitação**
Quando um admin ou profissional clica em "Aprovar" na página de solicitações:

```typescript
const handleApprove = async (requestId: string) => {
  const success = await approveAppointmentRequest(requestId, user.id);
  if (success) {
    toast.success('Solicitação aprovada com sucesso!');
    loadRequests(); // Recarrega a lista
  }
};
```

### **2. Criação Automática do Agendamento**
A função `approveAppointmentRequest` faz:

1. **Busca os dados da solicitação**
2. **Cria um agendamento na tabela `appointments`**
3. **Marca a solicitação como aprovada**
4. **Vincula o agendamento à solicitação**

```typescript
// Criar agendamento
const { data: appointment, error: appointmentError } = await supabase
  .from('appointments')
  .insert([{
    salao_id: request.salao_id,
    servico_id: request.servico_id,
    funcionario_id: request.funcionario_id,
    data_hora: request.data_hora,
    status: 'confirmado',
    observacoes: request.observacoes,
    cliente_nome: request.cliente_nome,
    cliente_telefone: request.cliente_telefone,
    cliente_email: request.cliente_email
  }])
  .select()
  .single();
```

### **3. Exibição na Agenda**
O hook `useAppointments` foi atualizado para:

1. **Detectar agendamentos de solicitações** (que têm `cliente_nome`)
2. **Usar os dados diretos** do agendamento
3. **Buscar apenas o nome do profissional** na tabela `employees`

```typescript
// Se já tem dados do cliente (agendamentos de solicitações), usa eles
if (apt.cliente_nome) {
  const professionalData = await supabase
    .from('employees')
    .select('nome')
    .eq('id', apt.funcionario_id)
    .single();
  
  return {
    ...apt,
    funcionario_nome: professionalData.data?.nome,
    servico_nome: apt.servico?.nome,
    servico_duracao: apt.servico?.duracao_minutos,
    servico_preco: apt.servico?.preco
  };
}
```

## 🗄️ **Estrutura do Banco de Dados**

### **Tabela: appointments**
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  salao_id UUID REFERENCES saloes(id),
  cliente_id UUID REFERENCES users(id), -- Para agendamentos manuais
  funcionario_id UUID REFERENCES employees(id),
  servico_id UUID REFERENCES services(id),
  data_hora TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'confirmado',
  observacoes TEXT,
  
  -- Campos para agendamentos de solicitações
  cliente_nome VARCHAR(255),
  cliente_telefone VARCHAR(20),
  cliente_email VARCHAR(255),
  
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Tabela: appointment_requests**
```sql
CREATE TABLE appointment_requests (
  id UUID PRIMARY KEY,
  salao_id UUID REFERENCES saloes(id),
  servico_id UUID REFERENCES services(id),
  funcionario_id UUID REFERENCES employees(id),
  data_hora TIMESTAMP WITH TIME ZONE,
  cliente_nome VARCHAR(255),
  cliente_telefone VARCHAR(20),
  cliente_email VARCHAR(255),
  observacoes TEXT,
  status VARCHAR(20) DEFAULT 'pendente',
  appointment_id UUID REFERENCES appointments(id), -- Vinculação
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 **Scripts Necessários**

### **1. Atualizar Tabela Appointments**
Execute o script `update-appointments-table.sql`:

```sql
-- Adicionar campos para dados do cliente
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS cliente_nome VARCHAR(255),
ADD COLUMN IF NOT EXISTS cliente_telefone VARCHAR(20),
ADD COLUMN IF NOT EXISTS cliente_email VARCHAR(255);

-- Adicionar campos de compatibilidade
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS funcionario_id UUID REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS servico_id UUID REFERENCES services(id),
ADD COLUMN IF NOT EXISTS data_hora TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS observacoes TEXT;
```

## 🎨 **Interface do Usuário**

### **Página de Solicitações**
- ✅ **Botão "Aprovar"** em cada solicitação pendente
- ✅ **Confirmação visual** após aprovação
- ✅ **Atualização automática** da lista

### **Página da Agenda**
- ✅ **Cards de agendamentos** aparecem no horário correto
- ✅ **Dados do cliente** exibidos corretamente
- ✅ **Status "Confirmado"** para agendamentos aprovados
- ✅ **Informações completas** (serviço, profissional, cliente)

## 🔄 **Fluxo Completo**

### **1. Cliente faz solicitação**
```
Cliente → Página Pública → Preenche formulário → Solicitação criada
```

### **2. Admin aprova solicitação**
```
Admin → Solicitações → Clica "Aprovar" → Agendamento criado
```

### **3. Agendamento aparece na agenda**
```
Agenda → Carrega agendamentos → Card aparece no horário correto
```

## 🎯 **Benefícios**

### **Para o Salão**
- ✅ **Controle total** sobre agendamentos
- ✅ **Aprovação manual** de solicitações
- ✅ **Agenda organizada** com todos os agendamentos
- ✅ **Dados completos** do cliente

### **Para o Cliente**
- ✅ **Solicitação fácil** na página pública
- ✅ **Acompanhamento** do status
- ✅ **Confirmação** quando aprovado

### **Para o Sistema**
- ✅ **Integração completa** entre solicitações e agenda
- ✅ **Dados consistentes** em ambas as tabelas
- ✅ **Rastreabilidade** completa do processo

## 🚀 **Próximos Passos**

1. **Execute o script** `update-appointments-table.sql`
2. **Teste o fluxo** completo de aprovação
3. **Verifique** se os agendamentos aparecem na agenda
4. **Confirme** que os dados estão corretos

O sistema agora permite que admins e profissionais aprovem solicitações e vejam os agendamentos criados automaticamente na agenda! 🎉

## 🎯 **Funcionalidade Implementada**

### **Fluxo de Aprovação de Solicitações**
1. ✅ **Cliente faz solicitação** na página pública
2. ✅ **Admin/Profissional aprova** na página de "Solicitações de Agendamento"
3. ✅ **Agendamento é criado automaticamente** na agenda do profissional
4. ✅ **Card aparece no horário correto** na agenda

## 🔧 **Como Funciona**

### **1. Aprovação de Solicitação**
Quando um admin ou profissional clica em "Aprovar" na página de solicitações:

```typescript
const handleApprove = async (requestId: string) => {
  const success = await approveAppointmentRequest(requestId, user.id);
  if (success) {
    toast.success('Solicitação aprovada com sucesso!');
    loadRequests(); // Recarrega a lista
  }
};
```

### **2. Criação Automática do Agendamento**
A função `approveAppointmentRequest` faz:

1. **Busca os dados da solicitação**
2. **Cria um agendamento na tabela `appointments`**
3. **Marca a solicitação como aprovada**
4. **Vincula o agendamento à solicitação**

```typescript
// Criar agendamento
const { data: appointment, error: appointmentError } = await supabase
  .from('appointments')
  .insert([{
    salao_id: request.salao_id,
    servico_id: request.servico_id,
    funcionario_id: request.funcionario_id,
    data_hora: request.data_hora,
    status: 'confirmado',
    observacoes: request.observacoes,
    cliente_nome: request.cliente_nome,
    cliente_telefone: request.cliente_telefone,
    cliente_email: request.cliente_email
  }])
  .select()
  .single();
```

### **3. Exibição na Agenda**
O hook `useAppointments` foi atualizado para:

1. **Detectar agendamentos de solicitações** (que têm `cliente_nome`)
2. **Usar os dados diretos** do agendamento
3. **Buscar apenas o nome do profissional** na tabela `employees`

```typescript
// Se já tem dados do cliente (agendamentos de solicitações), usa eles
if (apt.cliente_nome) {
  const professionalData = await supabase
    .from('employees')
    .select('nome')
    .eq('id', apt.funcionario_id)
    .single();
  
  return {
    ...apt,
    funcionario_nome: professionalData.data?.nome,
    servico_nome: apt.servico?.nome,
    servico_duracao: apt.servico?.duracao_minutos,
    servico_preco: apt.servico?.preco
  };
}
```

## 🗄️ **Estrutura do Banco de Dados**

### **Tabela: appointments**
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  salao_id UUID REFERENCES saloes(id),
  cliente_id UUID REFERENCES users(id), -- Para agendamentos manuais
  funcionario_id UUID REFERENCES employees(id),
  servico_id UUID REFERENCES services(id),
  data_hora TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'confirmado',
  observacoes TEXT,
  
  -- Campos para agendamentos de solicitações
  cliente_nome VARCHAR(255),
  cliente_telefone VARCHAR(20),
  cliente_email VARCHAR(255),
  
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Tabela: appointment_requests**
```sql
CREATE TABLE appointment_requests (
  id UUID PRIMARY KEY,
  salao_id UUID REFERENCES saloes(id),
  servico_id UUID REFERENCES services(id),
  funcionario_id UUID REFERENCES employees(id),
  data_hora TIMESTAMP WITH TIME ZONE,
  cliente_nome VARCHAR(255),
  cliente_telefone VARCHAR(20),
  cliente_email VARCHAR(255),
  observacoes TEXT,
  status VARCHAR(20) DEFAULT 'pendente',
  appointment_id UUID REFERENCES appointments(id), -- Vinculação
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 **Scripts Necessários**

### **1. Atualizar Tabela Appointments**
Execute o script `update-appointments-table.sql`:

```sql
-- Adicionar campos para dados do cliente
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS cliente_nome VARCHAR(255),
ADD COLUMN IF NOT EXISTS cliente_telefone VARCHAR(20),
ADD COLUMN IF NOT EXISTS cliente_email VARCHAR(255);

-- Adicionar campos de compatibilidade
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS funcionario_id UUID REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS servico_id UUID REFERENCES services(id),
ADD COLUMN IF NOT EXISTS data_hora TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS observacoes TEXT;
```

## 🎨 **Interface do Usuário**

### **Página de Solicitações**
- ✅ **Botão "Aprovar"** em cada solicitação pendente
- ✅ **Confirmação visual** após aprovação
- ✅ **Atualização automática** da lista

### **Página da Agenda**
- ✅ **Cards de agendamentos** aparecem no horário correto
- ✅ **Dados do cliente** exibidos corretamente
- ✅ **Status "Confirmado"** para agendamentos aprovados
- ✅ **Informações completas** (serviço, profissional, cliente)

## 🔄 **Fluxo Completo**

### **1. Cliente faz solicitação**
```
Cliente → Página Pública → Preenche formulário → Solicitação criada
```

### **2. Admin aprova solicitação**
```
Admin → Solicitações → Clica "Aprovar" → Agendamento criado
```

### **3. Agendamento aparece na agenda**
```
Agenda → Carrega agendamentos → Card aparece no horário correto
```

## 🎯 **Benefícios**

### **Para o Salão**
- ✅ **Controle total** sobre agendamentos
- ✅ **Aprovação manual** de solicitações
- ✅ **Agenda organizada** com todos os agendamentos
- ✅ **Dados completos** do cliente

### **Para o Cliente**
- ✅ **Solicitação fácil** na página pública
- ✅ **Acompanhamento** do status
- ✅ **Confirmação** quando aprovado

### **Para o Sistema**
- ✅ **Integração completa** entre solicitações e agenda
- ✅ **Dados consistentes** em ambas as tabelas
- ✅ **Rastreabilidade** completa do processo

## 🚀 **Próximos Passos**

1. **Execute o script** `update-appointments-table.sql`
2. **Teste o fluxo** completo de aprovação
3. **Verifique** se os agendamentos aparecem na agenda
4. **Confirme** que os dados estão corretos

O sistema agora permite que admins e profissionais aprovem solicitações e vejam os agendamentos criados automaticamente na agenda! 🎉

## 🎯 **Funcionalidade Implementada**

### **Fluxo de Aprovação de Solicitações**
1. ✅ **Cliente faz solicitação** na página pública
2. ✅ **Admin/Profissional aprova** na página de "Solicitações de Agendamento"
3. ✅ **Agendamento é criado automaticamente** na agenda do profissional
4. ✅ **Card aparece no horário correto** na agenda

## 🔧 **Como Funciona**

### **1. Aprovação de Solicitação**
Quando um admin ou profissional clica em "Aprovar" na página de solicitações:

```typescript
const handleApprove = async (requestId: string) => {
  const success = await approveAppointmentRequest(requestId, user.id);
  if (success) {
    toast.success('Solicitação aprovada com sucesso!');
    loadRequests(); // Recarrega a lista
  }
};
```

### **2. Criação Automática do Agendamento**
A função `approveAppointmentRequest` faz:

1. **Busca os dados da solicitação**
2. **Cria um agendamento na tabela `appointments`**
3. **Marca a solicitação como aprovada**
4. **Vincula o agendamento à solicitação**

```typescript
// Criar agendamento
const { data: appointment, error: appointmentError } = await supabase
  .from('appointments')
  .insert([{
    salao_id: request.salao_id,
    servico_id: request.servico_id,
    funcionario_id: request.funcionario_id,
    data_hora: request.data_hora,
    status: 'confirmado',
    observacoes: request.observacoes,
    cliente_nome: request.cliente_nome,
    cliente_telefone: request.cliente_telefone,
    cliente_email: request.cliente_email
  }])
  .select()
  .single();
```

### **3. Exibição na Agenda**
O hook `useAppointments` foi atualizado para:

1. **Detectar agendamentos de solicitações** (que têm `cliente_nome`)
2. **Usar os dados diretos** do agendamento
3. **Buscar apenas o nome do profissional** na tabela `employees`

```typescript
// Se já tem dados do cliente (agendamentos de solicitações), usa eles
if (apt.cliente_nome) {
  const professionalData = await supabase
    .from('employees')
    .select('nome')
    .eq('id', apt.funcionario_id)
    .single();
  
  return {
    ...apt,
    funcionario_nome: professionalData.data?.nome,
    servico_nome: apt.servico?.nome,
    servico_duracao: apt.servico?.duracao_minutos,
    servico_preco: apt.servico?.preco
  };
}
```

## 🗄️ **Estrutura do Banco de Dados**

### **Tabela: appointments**
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  salao_id UUID REFERENCES saloes(id),
  cliente_id UUID REFERENCES users(id), -- Para agendamentos manuais
  funcionario_id UUID REFERENCES employees(id),
  servico_id UUID REFERENCES services(id),
  data_hora TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'confirmado',
  observacoes TEXT,
  
  -- Campos para agendamentos de solicitações
  cliente_nome VARCHAR(255),
  cliente_telefone VARCHAR(20),
  cliente_email VARCHAR(255),
  
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Tabela: appointment_requests**
```sql
CREATE TABLE appointment_requests (
  id UUID PRIMARY KEY,
  salao_id UUID REFERENCES saloes(id),
  servico_id UUID REFERENCES services(id),
  funcionario_id UUID REFERENCES employees(id),
  data_hora TIMESTAMP WITH TIME ZONE,
  cliente_nome VARCHAR(255),
  cliente_telefone VARCHAR(20),
  cliente_email VARCHAR(255),
  observacoes TEXT,
  status VARCHAR(20) DEFAULT 'pendente',
  appointment_id UUID REFERENCES appointments(id), -- Vinculação
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 **Scripts Necessários**

### **1. Atualizar Tabela Appointments**
Execute o script `update-appointments-table.sql`:

```sql
-- Adicionar campos para dados do cliente
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS cliente_nome VARCHAR(255),
ADD COLUMN IF NOT EXISTS cliente_telefone VARCHAR(20),
ADD COLUMN IF NOT EXISTS cliente_email VARCHAR(255);

-- Adicionar campos de compatibilidade
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS funcionario_id UUID REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS servico_id UUID REFERENCES services(id),
ADD COLUMN IF NOT EXISTS data_hora TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS observacoes TEXT;
```

## 🎨 **Interface do Usuário**

### **Página de Solicitações**
- ✅ **Botão "Aprovar"** em cada solicitação pendente
- ✅ **Confirmação visual** após aprovação
- ✅ **Atualização automática** da lista

### **Página da Agenda**
- ✅ **Cards de agendamentos** aparecem no horário correto
- ✅ **Dados do cliente** exibidos corretamente
- ✅ **Status "Confirmado"** para agendamentos aprovados
- ✅ **Informações completas** (serviço, profissional, cliente)

## 🔄 **Fluxo Completo**

### **1. Cliente faz solicitação**
```
Cliente → Página Pública → Preenche formulário → Solicitação criada
```

### **2. Admin aprova solicitação**
```
Admin → Solicitações → Clica "Aprovar" → Agendamento criado
```

### **3. Agendamento aparece na agenda**
```
Agenda → Carrega agendamentos → Card aparece no horário correto
```

## 🎯 **Benefícios**

### **Para o Salão**
- ✅ **Controle total** sobre agendamentos
- ✅ **Aprovação manual** de solicitações
- ✅ **Agenda organizada** com todos os agendamentos
- ✅ **Dados completos** do cliente

### **Para o Cliente**
- ✅ **Solicitação fácil** na página pública
- ✅ **Acompanhamento** do status
- ✅ **Confirmação** quando aprovado

### **Para o Sistema**
- ✅ **Integração completa** entre solicitações e agenda
- ✅ **Dados consistentes** em ambas as tabelas
- ✅ **Rastreabilidade** completa do processo

## 🚀 **Próximos Passos**

1. **Execute o script** `update-appointments-table.sql`
2. **Teste o fluxo** completo de aprovação
3. **Verifique** se os agendamentos aparecem na agenda
4. **Confirme** que os dados estão corretos

O sistema agora permite que admins e profissionais aprovem solicitações e vejam os agendamentos criados automaticamente na agenda! 🎉



