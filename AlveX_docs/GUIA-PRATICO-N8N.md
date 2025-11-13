# Guia Prático: n8n + AlveX API

## 🎯 Como Funciona

Seu **n8n** vai consumir nossa API usando **HTTP Request nodes**. Simples assim!

## 🔧 Configuração Básica

### **1. Base URL da API**
```
https://seu-projeto.supabase.co/functions/v1/alvexapi
```

### **2. Headers Padrão**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer SEU_SUPABASE_ANON_KEY"
}
```

## 📋 Endpoints Essenciais

### **1. Consultar Serviços Disponíveis**
```http
GET /salon/{salonId}/services
```

**Configuração no n8n:**
- **Method**: GET
- **URL**: `https://seu-projeto.supabase.co/functions/v1/alvexapi/salon/SEU_SALON_ID/services`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer SEU_SUPABASE_ANON_KEY`

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-do-servico",
      "name": "Corte de Cabelo",
      "price": 50.00,
      "duration": 60
    }
  ]
}
```

### **2. Consultar Profissionais**
```http
GET /api/evolution/salon/{salonId}/professionals
```

**Configuração no n8n:**
- **Method**: GET
- **URL**: `https://seu-alvex-instance.com/api/evolution/salon/SEU_SALON_ID/professionals`

### **3. Consultar Disponibilidade**
```http
GET /api/evolution/salon/{salonId}/availability?serviceId=xxx&professionalId=xxx&date=2024-01-15
```

**Configuração no n8n:**
- **Method**: GET
- **URL**: `https://seu-alvex-instance.com/api/evolution/salon/SEU_SALON_ID/availability?serviceId={{$json.serviceId}}&professionalId={{$json.professionalId}}&date={{$json.date}}`

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "time": "09:00",
      "available": true,
      "professionalName": "Maria Santos"
    },
    {
      "time": "09:30",
      "available": false,
      "professionalName": "Maria Santos"
    }
  ]
}
```

### **4. Criar Agendamento**
```http
POST /api/evolution/salon/{salonId}/booking
```

**Configuração no n8n:**
- **Method**: POST
- **URL**: `https://seu-alvex-instance.com/api/evolution/salon/SEU_SALON_ID/booking`
- **Body**:
```json
{
  "serviceId": "{{$json.serviceId}}",
  "professionalId": "{{$json.professionalId}}",
  "dateTime": "{{$json.dateTime}}",
  "clientPhone": "{{$json.clientPhone}}",
  "clientName": "{{$json.clientName}}"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-do-agendamento",
    "confirmationCode": "WA123456",
    "message": "Agendamento confirmado! Código: WA123456"
  }
}
```

### **5. Cancelar Agendamento**
```http
DELETE /api/evolution/salon/{salonId}/booking/{appointmentId}
```

**Configuração no n8n:**
- **Method**: DELETE
- **URL**: `https://seu-alvex-instance.com/api/evolution/salon/SEU_SALON_ID/booking/{{$json.appointmentId}}`
- **Body**:
```json
{
  "reason": "Cliente solicitou cancelamento"
}
```

## 🎯 Fluxo Prático no n8n

### **Cenário: Cliente Quer Agendar**

1. **Webhook Trigger** (recebe mensagem do WhatsApp)
2. **AI Node** (processa: "quero agendar corte de cabelo")
3. **HTTP Request** → `GET /services` (lista serviços)
4. **HTTP Request** → `GET /professionals` (lista profissionais)
5. **HTTP Request** → `GET /availability` (consulta horários)
6. **AI Node** (formata resposta: "Temos às 09:00 com Maria")
7. **WhatsApp Send** (envia opções para cliente)
8. **Webhook Trigger** (cliente confirma: "sim, às 09:00")
9. **HTTP Request** → `POST /booking` (cria agendamento)
10. **WhatsApp Send** (confirma: "Agendado! Código: WA123456")

### **Exemplo de Workflow n8n:**

```
[Webhook] → [AI Process] → [HTTP Request: Services] → [HTTP Request: Availability] → [AI Format] → [WhatsApp Send]
```

## 🔧 Configuração Detalhada dos HTTP Request Nodes

### **Node 1: Buscar Serviços**
```json
{
  "method": "GET",
  "url": "https://seu-alvex-instance.com/api/evolution/salon/SEU_SALON_ID/services",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

### **Node 2: Buscar Disponibilidade**
```json
{
  "method": "GET",
  "url": "https://seu-alvex-instance.com/api/evolution/salon/SEU_SALON_ID/availability",
  "qs": {
    "serviceId": "{{$json.serviceId}}",
    "professionalId": "{{$json.professionalId}}",
    "date": "{{$json.date}}"
  }
}
```

### **Node 3: Criar Agendamento**
```json
{
  "method": "POST",
  "url": "https://seu-alvex-instance.com/api/evolution/salon/SEU_SALON_ID/booking",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "serviceId": "{{$json.serviceId}}",
    "professionalId": "{{$json.professionalId}}",
    "dateTime": "{{$json.dateTime}}",
    "clientPhone": "{{$json.clientPhone}}",
    "clientName": "{{$json.clientName}}"
  }
}
```

## 📱 Exemplo Prático de Uso

### **Cliente**: "Oi, quero agendar um corte de cabelo"

**n8n faz:**
1. **AI**: Identifica intenção = "agendar corte"
2. **HTTP Request**: `GET /services` → Retorna lista de serviços
3. **AI**: "Encontrei o serviço 'Corte de Cabelo'"
4. **HTTP Request**: `GET /professionals` → Retorna profissionais
5. **HTTP Request**: `GET /availability?serviceId=corte&professionalId=maria&date=hoje`
6. **AI**: Formata resposta com horários disponíveis
7. **WhatsApp**: "Temos disponibilidade hoje às 09:00, 10:30, 14:00 com Maria. Qual prefere?"

### **Cliente**: "14:00 está bom"

**n8n faz:**
1. **AI**: Identifica confirmação = "14:00"
2. **HTTP Request**: `POST /booking` com dados do agendamento
3. **WhatsApp**: "Perfeito! Agendado para hoje às 14:00. Código: WA123456"

## 🚨 Pontos Importantes

### **1. Substitua SEU_SALON_ID**
- Cada salão tem um ID único
- Use o ID correto nas URLs

### **2. Formato de Data**
- **Entrada**: `2024-01-15` (YYYY-MM-DD)
- **DateTime**: `2024-01-15T14:00:00Z` (ISO string)

### **3. Telefone**
- **Formato**: `11999999999` (sem formatação)
- **Obrigatório**: Para identificar o cliente

### **4. Tratamento de Erros**
- Sempre verifique `success: true` na resposta
- Se `success: false`, use `error` para informar o cliente

## 📚 Documentação Detalhada

Para informações completas sobre cancelamento de agendamentos, consulte:
- [API de Cancelamento](./API-CANCELAMENTO.md) - Guia completo com exemplos e casos de uso

### **5. Cancelar Agendamento**

```json
{
  "url": "https://lbpqmdcmoybuuthzezmj.supabase.co/functions/v1/alvexapi/salon/SEU_SALON_ID/booking/APPOINTMENT_ID",
  "method": "DELETE",
  "headers": {
    "Authorization": "Bearer eyJhbGc...",
    "Content-Type": "application/json"
  },
  "body": {
    "reason": "Cliente solicitou cancelamento"
  }
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Agendamento cancelado com sucesso",
  "data": {
    "appointmentId": "uuid-do-agendamento",
    "cancelReason": "Cliente solicitou cancelamento",
    "cancelledAt": "2024-01-15T14:30:00.000Z"
  }
}
```

**Resposta de Erro (já cancelado):**
```json
{
  "success": false,
  "error": "Agendamento já está cancelado"
}
```

**Resposta de Erro (concluído):**
```json
{
  "success": false,
  "error": "Não é possível cancelar um agendamento já concluído"
}
```

## 🔍 Testando a API

### **Teste Manual (Postman/Insomnia):**
```bash
# 1. Testar serviços
GET https://seu-alvex-instance.com/api/evolution/salon/SEU_SALON_ID/services

# 2. Testar disponibilidade
GET https://seu-alvex-instance.com/api/evolution/salon/SEU_SALON_ID/availability?serviceId=xxx&professionalId=xxx&date=2024-01-15

# 3. Testar agendamento
POST https://seu-alvex-instance.com/api/evolution/salon/SEU_SALON_ID/booking
Content-Type: application/json

{
  "serviceId": "xxx",
  "professionalId": "xxx", 
  "dateTime": "2024-01-15T14:00:00Z",
  "clientPhone": "11999999999",
  "clientName": "João Silva"
}

# 4. Testar cancelamento
DELETE https://seu-alvex-instance.com/api/evolution/salon/SEU_SALON_ID/booking/APPOINTMENT_ID
Content-Type: application/json

{
  "reason": "Motivo do cancelamento"
}
```

## 🎯 Próximos Passos

1. **Configure o SEU_SALON_ID** nas URLs
2. **Teste os endpoints** manualmente primeiro
3. **Crie o workflow no n8n** com HTTP Request nodes
4. **Teste com mensagens reais** do WhatsApp
5. **Ajuste conforme necessário**

---

**🎉 É isso! Simples e direto.**

Seu n8n vai usar HTTP Request nodes para consumir nossa API. Cada operação é um endpoint diferente. Foque nos 5 endpoints principais e você terá tudo funcionando! 🚀
