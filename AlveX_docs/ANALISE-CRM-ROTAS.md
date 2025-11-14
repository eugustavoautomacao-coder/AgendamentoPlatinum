# Análise: Rotas API para Alimentar CRM

## ✅ Rotas Atuais Funcionais

### 1. Informações do Salão
- `GET /salon/{salonId}/info` ✅
  - Retorna: nome, telefone, endereço, horários

### 2. Serviços
- `GET /salon/{salonId}/services` ✅
  - Retorna: lista de serviços ativos com preços e duração

### 3. Profissionais
- `GET /salon/{salonId}/professionals` ✅
  - Retorna: lista de profissionais com nome e foto

### 4. Disponibilidade
- `GET /salon/{salonId}/availability` ✅
  - Retorna: horários disponíveis para uma data específica

### 5. Agendamentos
- `POST /salon/{salonId}/booking` ✅ (Criar)
- `DELETE /salon/{salonId}/booking/{appointmentId}` ✅ (Cancelar)
- `GET /salon/{salonId}/bookings?clientPhone=xxx` ✅ (Por telefone do cliente)
- `GET /salon/{salonId}/booking/code/{code}` ✅ (Por código)

---

## ❌ O Que Está Faltando para um CRM Completo

### 🎯 Prioridade ALTA (Essencial para CRM)

#### 1. **Lista Completa de Clientes**
```
GET /salon/{salonId}/clients
```
**Funcionalidade:**
- Listar TODOS os clientes cadastrados
- Paginação (page, limit)
- Filtros: nome, email, telefone
- Ordenação: nome, data cadastro, último agendamento

**Retorno sugerido:**
```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": "uuid",
        "name": "João Silva",
        "email": "joao@email.com",
        "phone": "11999999999",
        "createdAt": "2024-01-15T10:00:00Z",
        "lastAppointment": "2024-10-28T14:00:00Z",
        "totalAppointments": 5,
        "status": "ativo"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "totalPages": 3
    }
  }
}
```

**Por que é necessário:**
- CRM precisa visualizar base completa de clientes
- Segmentação de clientes
- Relatórios de fidelidade
- Identificar clientes inativos

---

#### 2. **Detalhes Completo de um Cliente**
```
GET /salon/{salonId}/client/{clientId}
```
**Funcionalidade:**
- Histórico completo de agendamentos
- Dados pessoais completos
- Preferências (serviços mais solicitados)
- Estatísticas (frequência, ticket médio)

**Retorno sugerido:**
```json
{
  "success": true,
  "data": {
    "client": {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@email.com",
      "phone": "11999999999",
      "address": "Rua X, 123",
      "birthDate": "1990-05-15",
      "createdAt": "2024-01-15T10:00:00Z",
      "status": "ativo"
    },
    "statistics": {
      "totalAppointments": 12,
      "completedAppointments": 10,
      "cancelledAppointments": 2,
      "averageTicket": 85.50,
      "favoriteServices": ["Corte", "Barba"],
      "favoriteProfessional": "Maria Santos",
      "lastAppointment": "2024-10-28T14:00:00Z"
    },
    "appointments": [
      {
        "id": "uuid",
        "dateTime": "2024-10-28T14:00:00Z",
        "service": "Corte de Cabelo",
        "professional": "Maria Santos",
        "status": "confirmado",
        "price": 50.00
      }
    ]
  }
}
```

---

#### 3. **Lista Completa de Agendamentos (Histórico)**
```
GET /salon/{salonId}/appointments
```
**Funcionalidade:**
- Listar TODOS os agendamentos (não apenas de um cliente)
- Filtros: data (range), status, profissional, serviço
- Paginação
- Ordenação por data

**Query Parameters:**
- `startDate`: Data início (YYYY-MM-DD)
- `endDate`: Data fim (YYYY-MM-DD)
- `status`: pendente|confirmado|cancelado|concluido
- `professionalId`: UUID do profissional
- `serviceId`: UUID do serviço
- `page`: Número da página (default: 1)
- `limit`: Itens por página (default: 50)

**Retorno sugerido:**
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "uuid",
        "dateTime": "2024-10-28T14:00:00Z",
        "client": {
          "id": "uuid",
          "name": "João Silva",
          "phone": "11999999999",
          "email": "joao@email.com"
        },
        "service": {
          "id": "uuid",
          "name": "Corte de Cabelo",
          "price": 50.00
        },
        "professional": {
          "id": "uuid",
          "name": "Maria Santos"
        },
        "status": "confirmado",
        "observations": "Prefere cabelo curto"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 250,
      "totalPages": 5
    }
  }
}
```

---

#### 4. **Detalhes de um Agendamento Específico**
```
GET /salon/{salonId}/appointment/{appointmentId}
```
**Funcionalidade:**
- Todas as informações completas de um agendamento
- Cliente, serviço, profissional, status, histórico

---

#### 5. **Estatísticas e Métricas do Salão**
```
GET /salon/{salonId}/stats
```
**Retorno sugerido:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-10-01",
      "end": "2024-10-31"
    },
    "clients": {
      "total": 250,
      "active": 180,
      "newThisMonth": 15
    },
    "appointments": {
      "total": 450,
      "confirmed": 420,
      "cancelled": 20,
      "completed": 400,
      "pending": 10
    },
    "revenue": {
      "total": 35000.00,
      "averageTicket": 87.50,
      "thisMonth": 12500.00
    },
    "professionals": {
      "mostBooked": {
        "id": "uuid",
        "name": "Maria Santos",
        "totalAppointments": 120
      }
    },
    "services": {
      "mostRequested": {
        "id": "uuid",
        "name": "Corte de Cabelo",
        "totalBookings": 180
      }
    }
  }
}
```

**Variação com período:**
```
GET /salon/{salonId}/stats?startDate=2024-10-01&endDate=2024-10-31
```

---

### 📊 Prioridade MÉDIA (Melhorias para CRM)

#### 6. **Atualizar Cliente**
```
PUT /salon/{salonId}/client/{clientId}
PATCH /salon/{salonId}/client/{clientId}
```
**Body:**
```json
{
  "name": "João Silva",
  "email": "novo-email@email.com",
  "phone": "11999999999",
  "address": "Rua X, 123",
  "birthDate": "1990-05-15"
}
```

#### 7. **Atualizar Agendamento**
```
PUT /salon/{salonId}/appointment/{appointmentId}
PATCH /salon/{salonId}/appointment/{appointmentId}
```
**Body:**
```json
{
  "dateTime": "2024-10-29T15:00:00Z",
  "serviceId": "uuid",
  "professionalId": "uuid",
  "observations": "Observações atualizadas"
}
```

---

### 🔔 Prioridade BAIXA (Funcionalidades Avançadas)

#### 8. **Buscar Cliente por Qualquer Campo**
```
GET /salon/{salonId}/clients/search?q=João
```
- Busca em nome, email, telefone

#### 9. **Histórico de Interações**
```
GET /salon/{salonId}/client/{clientId}/history
```
- Timeline de agendamentos, cancelamentos, alterações

#### 10. **Exportar Dados (CSV/JSON)**
```
GET /salon/{salonId}/export/clients?format=csv
GET /salon/{salonId}/export/appointments?format=json
```

---

## 📋 Resumo: O Que Implementar AGORA

### 🚀 MVP para CRM (Essencial)

1. ✅ **GET /clients** - Lista completa de clientes com paginação
2. ✅ **GET /client/{clientId}** - Detalhes completos do cliente
3. ✅ **GET /appointments** - Lista completa de agendamentos com filtros
4. ✅ **GET /appointment/{appointmentId}** - Detalhes do agendamento
5. ✅ **GET /stats** - Estatísticas gerais do salão

### 📊 Ordem de Implementação Sugerida

**Fase 1 (Crítico):**
1. GET /appointments - Histórico completo (mais usado no CRM)
2. GET /clients - Lista de clientes

**Fase 2:**
3. GET /client/{clientId} - Perfil completo do cliente
4. GET /stats - Dashboard com métricas

**Fase 3:**
5. GET /appointment/{appointmentId} - Detalhes específicos
6. PUT/PATCH /client/{clientId} - Atualizar cliente
7. PUT/PATCH /appointment/{appointmentId} - Atualizar agendamento

---

## 💡 Casos de Uso do CRM

### Cenário 1: Visualizar Base de Clientes
```
Cliente do n8n: "Quais são meus clientes mais frequentes?"
→ GET /clients (ordenado por totalAppointments)
→ Resposta: "Você tem 10 clientes que já agendaram 5+ vezes..."
```

### Cenário 2: Análise de Performance
```
Cliente do n8n: "Como está minha receita este mês?"
→ GET /stats?startDate=2024-10-01&endDate=2024-10-31
→ Resposta: "Receita de R$ 12.500,00 em outubro com 400 agendamentos..."
```

### Cenário 3: Histórico do Cliente
```
Cliente do n8n: "Me mostre o histórico do João Silva"
→ GET /client/{clientId}
→ Resposta: "João tem 12 agendamentos, preferência por Corte de Cabelo..."
```

### Cenário 4: Relatório de Agendamentos
```
Cliente do n8n: "Quais agendamentos tenho hoje?"
→ GET /appointments?startDate=2024-10-29&endDate=2024-10-29
→ Resposta: "Você tem 8 agendamentos hoje às..."
```

---

## 🎯 Próximos Passos

**Implementar as 5 rotas essenciais** para que o agente n8n tenha dados completos para alimentar qualquer CRM.

**Sugestão:** Começar por `GET /appointments` que é a mais importante para visualização geral.

