# API REST para Evolution API + AlveX

## 🎯 Visão Geral

Esta API REST foi criada especificamente para integração com **Evolution API** (WhatsApp). Seu agente Evolution API pode consumir estes endpoints diretamente para realizar todas as operações de agendamento no sistema AlveX.

## 🚀 Funcionalidades Disponíveis

### **✅ Operações Completas**
- **Consultar informações do salão**
- **Listar serviços disponíveis**
- **Listar profissionais disponíveis**
- **Consultar disponibilidade de horários**
- **Criar agendamentos automaticamente**
- **Cancelar agendamentos**
- **Consultar histórico do cliente**
- **Buscar agendamento por código**

## 🔧 Configuração

### **Variáveis de Ambiente**
```bash
# Evolution API Integration
VITE_EVOLUTION_API_ENABLED=true
VITE_EVOLUTION_WEBHOOK_URL=https://seu-evolution-api.com/webhook/alvex
VITE_EVOLUTION_API_KEY=sua_api_key_evolution
VITE_EVOLUTION_BASE_URL=https://seu-evolution-api.com
```

### **Base URL da API**
```
https://seu-alvex-instance.com/api/evolution
```

## 📋 Endpoints da API

### **1. Informações do Salão**
```http
GET /api/evolution/salon/{salonId}/info
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-do-salao",
    "name": "Salão da Maria",
    "phone": "(11) 99999-9999",
    "address": "Rua das Flores, 123",
    "workingHours": {
      "segunda": { "ativo": true, "hora_inicio": "08:00", "hora_fim": "18:00" },
      "terca": { "ativo": true, "hora_inicio": "08:00", "hora_fim": "18:00" }
    }
  }
}
```

### **2. Listar Serviços**
```http
GET /api/evolution/salon/{salonId}/services
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-do-servico",
      "name": "Corte de Cabelo",
      "description": "Corte moderno e estiloso",
      "duration": 60,
      "price": 50.00,
      "category": "Cabelo"
    }
  ]
}
```

### **3. Listar Profissionais**
```http
GET /api/evolution/salon/{salonId}/professionals
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-do-profissional",
      "name": "Maria Santos",
      "specialties": ["Corte", "Coloração"],
      "avatar": "https://exemplo.com/avatar.jpg"
    }
  ]
}
```

### **4. Consultar Disponibilidade**
```http
GET /api/evolution/salon/{salonId}/availability?serviceId=xxx&professionalId=xxx&date=2024-01-15&clientPhone=11999999999
```

**Parâmetros:**
- `serviceId` (obrigatório): ID do serviço
- `professionalId` (obrigatório): ID do profissional
- `date` (opcional): Data no formato YYYY-MM-DD (padrão: hoje)
- `clientPhone` (opcional): Telefone do cliente
- `clientName` (opcional): Nome do cliente
- `clientEmail` (opcional): Email do cliente

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "time": "09:00",
      "available": true,
      "professionalId": "uuid-do-profissional",
      "professionalName": "Maria Santos"
    },
    {
      "time": "09:30",
      "available": false,
      "professionalId": "uuid-do-profissional",
      "professionalName": "Maria Santos"
    }
  ]
}
```

### **5. Criar Agendamento**
```http
POST /api/evolution/salon/{salonId}/booking
```

**Body:**
```json
{
  "serviceId": "uuid-do-servico",
  "professionalId": "uuid-do-profissional",
  "dateTime": "2024-01-15T09:00:00Z",
  "clientPhone": "11999999999",
  "clientName": "João Silva",
  "clientEmail": "joao@email.com",
  "notes": "Observações do cliente"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-do-agendamento",
    "serviceName": "Corte de Cabelo",
    "professionalName": "Maria Santos",
    "dateTime": "2024-01-15T09:00:00Z",
    "status": "confirmado",
    "price": 50.00,
    "confirmationCode": "WA123456"
  },
  "message": "Agendamento confirmado! Código: WA123456"
}
```

### **6. Cancelar Agendamento**
```http
DELETE /api/evolution/salon/{salonId}/booking/{appointmentId}
```

**Body:**
```json
{
  "reason": "Cliente solicitou cancelamento"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Agendamento cancelado com sucesso"
}
```

### **7. Consultar Agendamentos do Cliente**
```http
GET /api/evolution/salon/{salonId}/bookings?clientPhone=11999999999
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-do-agendamento",
      "serviceName": "Corte de Cabelo",
      "professionalName": "Maria Santos",
      "dateTime": "2024-01-15T09:00:00Z",
      "status": "confirmado",
      "price": 50.00,
      "confirmationCode": "WA123456"
    }
  ]
}
```

### **8. Buscar Agendamento por Código**
```http
GET /api/evolution/salon/{salonId}/booking/code/{confirmationCode}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-do-agendamento",
    "serviceName": "Corte de Cabelo",
    "professionalName": "Maria Santos",
    "dateTime": "2024-01-15T09:00:00Z",
    "status": "confirmado",
    "price": 50.00,
    "confirmationCode": "WA123456"
  }
}
```

### **9. Health Check**
```http
GET /api/evolution/health
```

**Resposta:**
```json
{
  "success": true,
  "message": "Evolution API está funcionando",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

## 🎯 Casos de Uso Práticos

### **Cenário 1: Cliente Quer Agendar**
```javascript
// 1. Cliente pergunta sobre serviços
const services = await fetch('/api/evolution/salon/salon-id/services');

// 2. Cliente escolhe serviço e profissional
const availability = await fetch('/api/evolution/salon/salon-id/availability?serviceId=xxx&professionalId=xxx&date=2024-01-15');

// 3. Cliente confirma horário
const booking = await fetch('/api/evolution/salon/salon-id/booking', {
  method: 'POST',
  body: JSON.stringify({
    serviceId: 'xxx',
    professionalId: 'xxx',
    dateTime: '2024-01-15T09:00:00Z',
    clientPhone: '11999999999',
    clientName: 'João Silva'
  })
});

// 4. Enviar confirmação para cliente
// booking.data.confirmationCode = "WA123456"
```

### **Cenário 2: Cliente Quer Cancelar**
```javascript
// 1. Buscar agendamentos do cliente
const bookings = await fetch('/api/evolution/salon/salon-id/bookings?clientPhone=11999999999');

// 2. Cliente escolhe qual cancelar
const cancel = await fetch('/api/evolution/salon/salon-id/booking/appointment-id', {
  method: 'DELETE',
  body: JSON.stringify({
    reason: 'Cliente solicitou cancelamento'
  })
});
```

### **Cenário 3: Consulta por Código**
```javascript
// Cliente informa código de confirmação
const booking = await fetch('/api/evolution/salon/salon-id/booking/code/WA123456');
```

## 🛠️ Implementação no Evolution API

### **Exemplo de Código (Node.js)**
```javascript
class AlveXEvolutionAPI {
  constructor(baseUrl, salonId) {
    this.baseUrl = baseUrl;
    this.salonId = salonId;
  }

  async getServices() {
    const response = await fetch(`${this.baseUrl}/api/evolution/salon/${this.salonId}/services`);
    return await response.json();
  }

  async getProfessionals() {
    const response = await fetch(`${this.baseUrl}/api/evolution/salon/${this.salonId}/professionals`);
    return await response.json();
  }

  async getAvailability(serviceId, professionalId, date) {
    const params = new URLSearchParams({
      serviceId,
      professionalId,
      date: date || new Date().toISOString().split('T')[0]
    });
    
    const response = await fetch(`${this.baseUrl}/api/evolution/salon/${this.salonId}/availability?${params}`);
    return await response.json();
  }

  async createBooking(serviceId, professionalId, dateTime, clientPhone, clientName) {
    const response = await fetch(`${this.baseUrl}/api/evolution/salon/${this.salonId}/booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        serviceId,
        professionalId,
        dateTime,
        clientPhone,
        clientName
      })
    });
    return await response.json();
  }

  async cancelBooking(appointmentId, reason) {
    const response = await fetch(`${this.baseUrl}/api/evolution/salon/${this.salonId}/booking/${appointmentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    return await response.json();
  }

  async getClientBookings(clientPhone) {
    const response = await fetch(`${this.baseUrl}/api/evolution/salon/${this.salonId}/bookings?clientPhone=${clientPhone}`);
    return await response.json();
  }

  async getBookingByCode(confirmationCode) {
    const response = await fetch(`${this.baseUrl}/api/evolution/salon/${this.salonId}/booking/code/${confirmationCode}`);
    return await response.json();
  }
}

// Uso
const alvex = new AlveXEvolutionAPI('https://seu-alvex-instance.com', 'salon-id');

// Exemplo de fluxo completo
async function handleBookingRequest(clientPhone, clientName) {
  try {
    // 1. Listar serviços
    const services = await alvex.getServices();
    
    // 2. Listar profissionais
    const professionals = await alvex.getProfessionals();
    
    // 3. Consultar disponibilidade
    const availability = await alvex.getAvailability(
      services.data[0].id,
      professionals.data[0].id,
      '2024-01-15'
    );
    
    // 4. Criar agendamento
    const booking = await alvex.createBooking(
      services.data[0].id,
      professionals.data[0].id,
      '2024-01-15T09:00:00Z',
      clientPhone,
      clientName
    );
    
    return booking;
  } catch (error) {
    console.error('Erro no agendamento:', error);
    return { success: false, error: error.message };
  }
}
```

### **Exemplo de Fluxo no Evolution API**
1. **Webhook Trigger**: Recebe mensagem do WhatsApp
2. **AI Processing**: Processa intenção do cliente
3. **API Call**: Consulta disponibilidade no AlveX
4. **Response Format**: Formata resposta com horários
5. **API Call**: Cria agendamento se cliente confirmar
6. **WhatsApp Send**: Envia confirmação para cliente

## 🔒 Segurança

### **Validações Implementadas**
- **Salon Validation**: Verifica se o salão existe
- **Slot Availability**: Confirma disponibilidade antes de agendar
- **Data Validation**: Valida formato de datas e horários
- **Phone Validation**: Valida formato de telefone
- **Error Handling**: Tratamento robusto de erros

### **Isolamento de Dados**
- **Salon ID**: Todos os dados incluem identificação do salão
- **RLS**: Row Level Security mantido no Supabase
- **Data Scope**: Cada endpoint só acessa dados do salão especificado

## 📊 Monitoramento

### **Logs Automáticos**
- ✅ Sucesso: `Agendamento confirmado! Código: WA123456`
- ⚠️ Aviso: `Horário não está mais disponível`
- ❌ Erro: `Serviço não encontrado`

### **Métricas Importantes**
- **Taxa de Sucesso**: % de agendamentos bem-sucedidos
- **Tempo de Resposta**: Latência da API
- **Volume**: Número de requisições por dia
- **Erros**: Tipos de erro mais comuns

## 🎯 Próximos Passos

### **Melhorias Futuras**
1. **Pagamento**: Integração com gateway de pagamento
2. **Confirmação**: SMS de confirmação automático
3. **Reagendamento**: Permitir mudança de horário via WhatsApp
4. **Avaliações**: Coletar feedback via WhatsApp
5. **Promoções**: Enviar ofertas personalizadas

### **Integrações Avançadas**
1. **CRM**: Sincronização com sistemas externos
2. **Analytics**: Dashboard com métricas de WhatsApp
3. **Multi-idioma**: Suporte a múltiplos idiomas
4. **Voice Messages**: Processamento de áudio
5. **Rich Media**: Envio de imagens e documentos

## 📞 Suporte

Para dúvidas sobre a API Evolution:
- **Documentação**: Este arquivo
- **Logs**: Console do servidor
- **Testes**: Use os endpoints de teste
- **Configuração**: Verifique variáveis de ambiente
- **Webhooks**: Monitore logs de webhook

## 🚀 Deploy

### **Checklist de Deploy**
- [ ] Variáveis de ambiente configuradas
- [ ] Endpoints testados
- [ ] Webhook URLs funcionando
- [ ] Testes de integração passando
- [ ] Monitoramento configurado
- [ ] Documentação atualizada

### **Teste de Integração**
```bash
# Testar health check
curl -X GET "https://seu-alvex.com/api/evolution/health"

# Testar serviços
curl -X GET "https://seu-alvex.com/api/evolution/salon/salon-id/services"

# Testar disponibilidade
curl -X GET "https://seu-alvex.com/api/evolution/salon/salon-id/availability?serviceId=xxx&professionalId=xxx&date=2024-01-15"

# Testar agendamento
curl -X POST "https://seu-alvex.com/api/evolution/salon/salon-id/booking" \
  -H "Content-Type: application/json" \
  -d '{"serviceId":"xxx","professionalId":"xxx","dateTime":"2024-01-15T09:00:00Z","clientPhone":"11999999999","clientName":"João Silva"}'
```

---

**🎉 API REST para Evolution API está pronta!**

Agora seu agente Evolution API pode consumir diretamente estes endpoints para realizar todas as operações de agendamento no sistema AlveX, proporcionando uma experiência completa e automatizada para seus clientes via WhatsApp.
