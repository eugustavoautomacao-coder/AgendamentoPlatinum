# Integração de API com Agente de IA no n8n

## 🎯 Resposta Direta

**SIM!** Para cada ação da API, você deve criar um **subworkflow** e adicioná-lo como **tool** no agente principal. Essa é a melhor prática e o padrão já usado no seu workflow atual.

---

## 📋 Estrutura Recomendada

### **Arquitetura:**
```
[Workflow Principal: Agente Virginia]
  ├── AI Agent (com várias tools)
  │   ├── Tool 1: Buscar Serviços (subworkflow)
  │   ├── Tool 2: Buscar Profissionais (subworkflow)
  │   ├── Tool 3: Consultar Disponibilidade (subworkflow)
  │   ├── Tool 4: Criar Agendamento (subworkflow)
  │   ├── Tool 5: Cancelar Agendamento (subworkflow)
  │   └── Tool 6: Listar Agendamentos (subworkflow)
```

---

## 🔧 Como Criar um Subworkflow Tool

### **Passo 1: Criar o Subworkflow**

Crie um novo workflow para cada ação da API:

**Exemplo: "Tool - Buscar Serviços"**

1. Criar novo workflow: `Tool - Buscar Serviços`
2. Adicionar nodes:
   ```
   [Webhook Trigger] (ou Input)
     ↓
   [HTTP Request: GET /salon/{salonId}/services]
     ↓
   [Return Output]
   ```

**Nodes do Subworkflow:**
- **Webhook/Input**: Recebe os parâmetros necessários
- **HTTP Request**: Faz a chamada da API
- **Return Output**: Retorna o resultado formatado

### **Passo 2: Configurar o HTTP Request Node**

**Node: "Buscar Serviços"**
```
Method: GET
URL: https://seu-projeto.supabase.co/functions/v1/alvexapi/salon/{{$vars.SALON_ID}}/services
Headers:
  - Content-Type: application/json
  - Authorization: Bearer {{$vars.SUPABASE_ANON_KEY}}
```

### **Passo 3: Configurar o Return Output**

**Node: "Return Output"**
```json
{
  "success": true,
  "services": "{{$json.data}}",
  "message": "Lista de serviços disponíveis"
}
```

### **Passo 4: Adicionar como Tool no AI Agent**

No workflow principal, adicione um node **"Tool Workflow"**:

**Node: "Tool - Buscar Serviços"**
```
Type: Tool Workflow
Workflow: Tool - Buscar Serviços
Description: Busca a lista de serviços disponíveis do salão

Inputs:
  - salonId (opcional, se não usar variável de workflow)
  - clientPhone (se necessário)
```

**Descrição para o AI (IMPORTANTE):**
```
Esta ferramenta é usada quando o cliente **pergunta sobre serviços disponíveis** ou quando o agente precisa **listar os serviços do salão**.

**Função:** busca automaticamente a lista completa de serviços disponíveis, incluindo preços e duração.

**Quando usar:**
- Cliente pergunta: "Quais serviços vocês oferecem?"
- Cliente pergunta: "Quanto custa um corte?"
- Cliente pergunta: "Quais tratamentos vocês fazem?"

O agente **deve usar esta ferramenta** sempre que precisar mostrar serviços ao cliente.
```

---

## 📝 Exemplos Completos de Subworkflows

### **1. Tool - Buscar Serviços**

**Subworkflow: "Tool - Buscar Serviços"**

```
[Webhook Trigger]
  ↓
[HTTP Request: GET /salon/{{$vars.SALON_ID}}/services]
  ↓
[Return Output]
```

**Return Output:**
```json
{
  "success": true,
  "data": "{{$json.data}}",
  "count": "={{ $json.data.length }}"
}
```

**Tool Description:**
```
Busca a lista de serviços disponíveis do salão com preços e duração.
Use quando o cliente perguntar sobre serviços, preços ou tratamentos.
```

---

### **2. Tool - Buscar Profissionais**

**Subworkflow: "Tool - Buscar Profissionais"**

```
[Webhook Trigger]
  ↓
[HTTP Request: GET /salon/{{$vars.SALON_ID}}/professionals]
  ↓
[Return Output]
```

**Tool Description:**
```
Lista todos os profissionais disponíveis do salão com suas informações.
Use quando o cliente perguntar sobre profissionais ou quiser escolher quem vai atendê-lo.
```

---

### **3. Tool - Consultar Disponibilidade**

**Subworkflow: "Tool - Consultar Disponibilidade"**

```
[Webhook Trigger]
  ↓
[Set: Formatar Data]
  ↓
[HTTP Request: GET /salon/{{$vars.SALON_ID}}/availability]
  ↓
[Return Output]
```

**Webhook Input:**
```json
{
  "serviceId": "uuid-do-servico",
  "professionalId": "uuid-do-profissional",
  "date": "2024-01-15"
}
```

**Tool Description:**
```
Consulta os horários disponíveis para um serviço, profissional e data específicos.
Use quando o cliente quiser agendar e precisar ver horários disponíveis.

Parâmetros obrigatórios:
- serviceId (string) → ID do serviço desejado
- professionalId (string) → ID do profissional (pode ser opcional)
- date (string) → Data no formato YYYY-MM-DD

O agente deve sempre extrair essas informações da conversa antes de chamar esta ferramenta.
```

---

### **4. Tool - Criar Agendamento**

**Subworkflow: "Tool - Criar Agendamento"**

```
[Webhook Trigger]
  ↓
[Set: Formatar DateTime]
  ↓
[HTTP Request: POST /salon/{{$vars.SALON_ID}}/booking]
  ↓
[Return Output]
```

**Webhook Input:**
```json
{
  "serviceId": "uuid-do-servico",
  "professionalId": "uuid-do-profissional",
  "dateTime": "2024-01-15T14:00:00Z",
  "clientPhone": "11999999999",
  "clientName": "João Silva"
}
```

**Tool Description:**
```
Cria um novo agendamento no sistema após o cliente confirmar o horário.

Parâmetros obrigatórios:
- serviceId (string) → ID do serviço
- professionalId (string) → ID do profissional
- dateTime (string) → Data e hora no formato ISO (YYYY-MM-DDTHH:mm:ssZ)
- clientPhone (string) → Telefone do cliente (formato: 11999999999)
- clientName (string) → Nome do cliente

O agente deve usar esta ferramenta APENAS quando o cliente confirmar explicitamente o agendamento.
```

---

### **5. Tool - Cancelar Agendamento**

**Subworkflow: "Tool - Cancelar Agendamento"**

```
[Webhook Trigger]
  ↓
[HTTP Request: DELETE /salon/{{$vars.SALON_ID}}/booking/{{$json.appointmentId}}]
  ↓
[Return Output]
```

**Webhook Input:**
```json
{
  "appointmentId": "uuid-do-agendamento",
  "reason": "Cliente solicitou cancelamento"
}
```

**Tool Description:**
```
Cancela um agendamento existente.

Parâmetros obrigatórios:
- appointmentId (string) → ID do agendamento a ser cancelado
- reason (string) → Motivo do cancelamento

O agente deve primeiro listar os agendamentos do cliente, depois cancelar o escolhido.
```

---

### **6. Tool - Listar Agendamentos do Cliente**

**Subworkflow: "Tool - Listar Agendamentos"**

```
[Webhook Trigger]
  ↓
[HTTP Request: GET /salon/{{$vars.SALON_ID}}/bookings?clientPhone={{$json.clientPhone}}]
  ↓
[Return Output]
```

**Webhook Input:**
```json
{
  "clientPhone": "11999999999"
}
```

**Tool Description:**
```
Lista todos os agendamentos de um cliente específico.

Parâmetros obrigatórios:
- clientPhone (string) → Telefone do cliente no formato 11999999999

Use quando o cliente quiser ver seus agendamentos ou cancelar algum.
```

---

## 🔗 Como Conectar no AI Agent

### **No Workflow Principal:**

1. **Adicionar Tool Workflow Node:**
   - Node Type: `Tool Workflow`
   - Selecionar o subworkflow criado
   - Configurar descrição detalhada

2. **Conectar ao AI Agent:**
   - Conectar a saída do Tool Workflow ao AI Agent
   - Tipo de conexão: `ai_tool`

3. **Configurar o AI Agent:**
   - O AI Agent automaticamente reconhece as tools conectadas
   - O agente decide quando usar cada tool baseado na descrição

---

## 📊 Exemplo de Workflow Principal

```
[Webhook WhatsApp]
  ↓
[Set: Configurar SalonID]
  ↓
[AI Agent]
  ├── Tool: Buscar Serviços (subworkflow)
  ├── Tool: Buscar Profissionais (subworkflow)
  ├── Tool: Consultar Disponibilidade (subworkflow)
  ├── Tool: Criar Agendamento (subworkflow)
  ├── Tool: Cancelar Agendamento (subworkflow)
  └── Tool: Listar Agendamentos (subworkflow)
  ↓
[Formatar Resposta]
  ↓
[Enviar WhatsApp]
```

---

## 🎯 Vantagens de Usar Subworkflows

### ✅ **Organização**
- Cada ação fica isolada e testável
- Fácil manutenção e debug
- Reutilizável em outros workflows

### ✅ **Flexibilidade**
- Pode reusar o mesmo subworkflow em múltiplos workflows
- Mudanças no subworkflow afetam todos os lugares que usam

### ✅ **Testabilidade**
- Pode testar cada tool individualmente
- Debug mais fácil

### ✅ **Descrição Clara**
- Cada tool tem sua própria descrição para o AI
- O agente entende melhor quando usar cada tool

---

## ⚠️ Alternativa: HTTP Request Direto (Não Recomendado)

### **Pode fazer direto no workflow principal?**

Tecnicamente sim, mas **NÃO é recomendado** porque:

❌ **Desorganizado**: Muitos nodes HTTP Request no workflow principal
❌ **Difícil manutenção**: Mudanças são mais complexas
❌ **Sem reutilização**: Não pode reusar em outros workflows
❌ **AI não entende bem**: O agente não tem contexto claro sobre quando usar

### **Quando usar HTTP Request direto?**

Apenas para casos muito simples que não precisam de lógica complexa, mas mesmo assim, subworkflow é melhor.

---

## 📋 Checklist de Implementação

Para cada ação da API:

- [ ] Criar subworkflow separado
- [ ] Configurar HTTP Request com salonID
- [ ] Adicionar Return Output formatado
- [ ] Criar Tool Workflow node no workflow principal
- [ ] Adicionar descrição detalhada para o AI
- [ ] Conectar ao AI Agent como `ai_tool`
- [ ] Testar a tool individualmente
- [ ] Testar o fluxo completo no agente

---

## 🎯 Exemplo Prático: Fluxo Completo

### **Cliente:** "Quero agendar um corte de cabelo"

**O que acontece:**

1. **AI Agent** analisa a mensagem
2. **AI Agent** decide usar: `Tool - Buscar Serviços`
3. **Subworkflow** executa → Retorna lista de serviços
4. **AI Agent** recebe os serviços
5. **AI Agent** decide usar: `Tool - Buscar Profissionais`
6. **Subworkflow** executa → Retorna profissionais
7. **AI Agent** formata resposta: "Temos Corte de Cabelo por R$ 50. Profissionais: Maria, João..."
8. **AI Agent** envia resposta para o cliente

### **Cliente:** "Quero agendar para amanhã às 14h"

**O que acontece:**

1. **AI Agent** analisa a mensagem
2. **AI Agent** extrai: data = "amanhã", hora = "14h"
3. **AI Agent** decide usar: `Tool - Consultar Disponibilidade`
4. **Subworkflow** executa com serviceId, professionalId, date
5. **Subworkflow** retorna horários disponíveis
6. **AI Agent** verifica se "14h" está disponível
7. **AI Agent** decide usar: `Tool - Criar Agendamento`
8. **Subworkflow** executa → Cria agendamento
9. **AI Agent** formata resposta: "Agendado! Código: WA123456"
10. **AI Agent** envia confirmação

---

## 🚀 Resumo

**Para cada ação da API:**
1. ✅ Criar **subworkflow** separado
2. ✅ Adicionar como **Tool Workflow** no AI Agent
3. ✅ Escrever **descrição detalhada** para o AI entender quando usar
4. ✅ Conectar ao AI Agent como `ai_tool`
5. ✅ Testar e ajustar

**Não precisa:**
- ❌ Criar lógica complexa no workflow principal
- ❌ Fazer múltiplos HTTP Request no mesmo workflow
- ❌ Configurar manualmente quando usar cada ação (o AI decide)

---

**Simples, organizado e escalável! 🎉**


