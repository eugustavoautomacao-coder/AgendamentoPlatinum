# Sistema de Autoatendimento Público

## Visão Geral

O sistema de autoatendimento permite que clientes acessem uma página pública do salão, visualizem serviços disponíveis, escolham profissionais e horários, e solicitem agendamentos que serão aprovados pelo administrador do salão.

## Como Funciona

### 1. **Página Pública do Salão**
- **URL:** `/salao/{salaoId}`
- **Exemplo:** `https://seudominio.com/salao/123e4567-e89b-12d3-a456-426614174000`
- **Acesso:** Público (não requer login)

### 2. **Fluxo do Cliente**
1. **Seleção de Serviço:** Cliente visualiza todos os serviços do salão
2. **Escolha do Profissional:** Seleciona um profissional disponível
3. **Data e Horário:** Escolhe data e horário disponível
4. **Dados Pessoais:** Preenche nome, telefone, email e observações
5. **Solicitação:** Envia solicitação de agendamento

### 3. **Gestão pelo Admin**
- **Menu:** "Solicitações" na sidebar administrativa
- **Ações:** Aprovar, Rejeitar (com motivo), Visualizar detalhes, Excluir
- **Status:** Pendente → Aprovado/Rejeitado

## Estrutura do Banco de Dados

### Tabela `appointment_requests`
```sql
- id: UUID (chave primária)
- salao_id: UUID (referência ao salão)
- servico_id: UUID (serviço solicitado)
- funcionario_id: UUID (profissional escolhido)
- data_hora: TIMESTAMP (data e hora do agendamento)
- cliente_nome: VARCHAR(255) (nome do cliente)
- cliente_telefone: VARCHAR(20) (telefone do cliente)
- cliente_email: VARCHAR(255) (email do cliente - opcional)
- observacoes: TEXT (observações do cliente)
- status: VARCHAR(20) (pendente, aprovado, rejeitado, cancelado)
- motivo_rejeicao: TEXT (motivo da rejeição)
- aprovado_por: UUID (usuário que aprovou/rejeitou)
- aprovado_em: TIMESTAMP (quando foi aprovado/rejeitado)
- appointment_id: UUID (referência ao agendamento criado)
- criado_em: TIMESTAMP (data de criação)
- atualizado_em: TIMESTAMP (última atualização)
```

### Campos Adicionados em `appointments`
```sql
- cliente_nome: VARCHAR(255) (para agendamentos online)
- cliente_telefone: VARCHAR(20) (para agendamentos online)
- cliente_email: VARCHAR(255) (para agendamentos online)
```

## Configuração

### 1. **Executar Script SQL**
```bash
# Execute o script no Supabase
setup-public-booking-system.sql
```

### 2. **URLs Disponíveis**
- **Página Pública:** `/salao/{salaoId}`
- **Gestão Admin:** `/admin/solicitacoes-agendamento`

### 3. **Permissões RLS**
- **Salões:** Podem gerenciar suas próprias solicitações
- **Público:** Pode criar solicitações (sem autenticação)

## Funcionalidades

### **Página Pública (`SalaoPublico.tsx`)**
- ✅ Visualização de serviços com preços e duração
- ✅ Seleção de profissionais disponíveis
- ✅ Calendário de horários disponíveis
- ✅ Formulário de dados do cliente
- ✅ Validação de horários ocupados
- ✅ Interface responsiva e intuitiva

### **Gestão Admin (`SolicitacoesAgendamento.tsx`)**
- ✅ Listagem de todas as solicitações
- ✅ Filtros por status (Todas, Pendente, Aprovado, Rejeitado)
- ✅ Aprovação de solicitações (cria agendamento automaticamente)
- ✅ Rejeição com motivo personalizado
- ✅ Visualização detalhada de cada solicitação
- ✅ Exclusão de solicitações

### **Hook de Gerenciamento (`useAppointmentRequests.tsx`)**
- ✅ Buscar solicitações por salão
- ✅ Criar nova solicitação
- ✅ Aprovar solicitação (cria agendamento)
- ✅ Rejeitar solicitação (com motivo)
- ✅ Excluir solicitação

## Vantagens do Sistema

### **Para o Cliente**
- 🎯 **Acesso 24/7:** Pode solicitar agendamentos a qualquer hora
- 📱 **Interface Intuitiva:** Processo simples e claro
- ⏰ **Horários Reais:** Vê apenas horários disponíveis
- 💰 **Transparência:** Vê preços e duração dos serviços

### **Para o Salão**
- 📋 **Controle Total:** Aprova ou rejeita cada solicitação
- 📊 **Gestão Centralizada:** Todas as solicitações em um local
- 🔍 **Visibilidade:** Vê dados completos do cliente
- ⚡ **Automação:** Cria agendamentos automaticamente ao aprovar

## Exemplo de Uso

### **1. Cliente Acessa a Página**
```
https://seudominio.com/salao/123e4567-e89b-12d3-a456-426614174000
```

### **2. Cliente Faz Solicitação**
- Escolhe: "Corte Feminino" (R$ 50,00 - 60 min)
- Profissional: "Maria Silva"
- Data: "15/01/2024"
- Horário: "14:00"
- Dados: Nome, telefone, email, observações

### **3. Admin Recebe Notificação**
- Acessa: `/admin/solicitacoes-agendamento`
- Vê solicitação com status "Pendente"
- Pode aprovar ou rejeitar

### **4. Resultado**
- **Aprovado:** Cria agendamento automaticamente
- **Rejeitado:** Cliente recebe motivo da rejeição

## Próximos Passos

1. **Executar o script SQL** no Supabase
2. **Testar a página pública** com um salão existente
3. **Configurar notificações** (opcional)
4. **Personalizar design** da página pública (opcional)
5. **Adicionar integração com WhatsApp** (opcional)

## Suporte

Para dúvidas ou problemas:
- Verifique os logs do console
- Confirme se o script SQL foi executado
- Teste com dados reais de um salão
- Verifique permissões RLS no Supabase
