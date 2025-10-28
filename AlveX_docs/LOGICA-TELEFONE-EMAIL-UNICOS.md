# 🔄 Lógica Atualizada - Telefone e Email Únicos

## 📋 **Nova Lógica Implementada:**

### **🔍 Identificação Única:**
- ✅ **Telefone:** Único por salão
- ✅ **Email:** Único por salão  
- ✅ **Nome:** Pode ser duplicado (não é identificador único)

### **🔄 Fluxo de Validação:**

1. **📞 Telefone:** Sempre obrigatório (mínimo 10 dígitos)
2. **🔍 Busca:** Verifica se cliente já existe por telefone OU email
3. **✅ Cliente Existente:** Usa dados do cadastro
4. **➕ Cliente Novo:** Nome obrigatório, email opcional

---

## 🧪 **Testes para Validar:**

### **Teste 1: Cliente Existente por Telefone**
```bash
curl -X POST "https://lbpqmdcmoybuuthzezmj.supabase.co/functions/v1/alvexapi/salon/5d0bf181-ed3a-4b8b-b508-2f1432e0b824/booking" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "ID_DO_SERVICO",
    "professionalId": "ID_DO_PROFISSIONAL",
    "dateTime": "2024-01-20T10:00:00",
    "clientPhone": "11999999999",
    "clientName": "Nome Diferente",
    "clientEmail": "email@diferente.com",
    "notes": "Cliente existe por telefone"
  }'
```

**Resultado:** Usa dados do cadastro existente (telefone 11999999999)

### **Teste 2: Cliente Existente por Email**
```bash
curl -X POST "https://lbpqmdcmoybuuthzezmj.supabase.co/functions/v1/alvexapi/salon/5d0bf181-ed3a-4b8b-b508-2f1432e0b824/booking" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "ID_DO_SERVICO",
    "professionalId": "ID_DO_PROFISSIONAL",
    "dateTime": "2024-01-20T11:00:00",
    "clientPhone": "11888888888",
    "clientName": "Nome Diferente",
    "clientEmail": "joao@cadastro.com",
    "notes": "Cliente existe por email"
  }'
```

**Resultado:** Usa dados do cadastro existente (email joao@cadastro.com)

### **Teste 3: Cliente Novo - Com Email**
```bash
curl -X POST "https://lbpqmdcmoybuuthzezmj.supabase.co/functions/v1/alvexapi/salon/5d0bf181-ed3a-4b8b-b508-2f1432e0b824/booking" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "ID_DO_SERVICO",
    "professionalId": "ID_DO_PROFISSIONAL",
    "dateTime": "2024-01-20T12:00:00",
    "clientPhone": "11777777777",
    "clientName": "Maria Santos",
    "clientEmail": "maria@email.com",
    "notes": "Novo cliente com email"
  }'
```

**Resultado:** Cria novo cliente com dados fornecidos

### **Teste 4: Cliente Novo - Sem Email**
```bash
curl -X POST "https://lbpqmdcmoybuuthzezmj.supabase.co/functions/v1/alvexapi/salon/5d0bf181-ed3a-4b8b-b508-2f1432e0b824/booking" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "ID_DO_SERVICO",
    "professionalId": "ID_DO_PROFISSIONAL",
    "dateTime": "2024-01-20T13:00:00",
    "clientPhone": "11666666666",
    "clientName": "João Silva",
    "clientEmail": "",
    "notes": "Novo cliente sem email"
  }'
```

**Resultado:** Cria novo cliente com email automático (11666666666@whatsapp.com)

### **Teste 5: Cliente Novo - Sem Nome (Deve Falhar)**
```bash
curl -X POST "https://lbpqmdcmoybuuthzezmj.supabase.co/functions/v1/alvexapi/salon/5d0bf181-ed3a-4b8b-b508-2f1432e0b824/booking" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "ID_DO_SERVICO",
    "professionalId": "ID_DO_PROFISSIONAL",
    "dateTime": "2024-01-20T14:00:00",
    "clientPhone": "11555555555",
    "clientName": "",
    "clientEmail": "teste@email.com",
    "notes": "Sem nome"
  }'
```

**Resultado:** Erro 400 - "Nome do cliente é obrigatório para novos cadastros"

---

## 📊 **Logs de Debug Esperados:**

### **Cliente Existente por Telefone:**
```
🔍 Validando dados do cliente...
✅ Cliente existente encontrado: João Silva (11999999999)
✅ Usando cliente existente: João Silva (11999999999)
```

### **Cliente Existente por Email:**
```
🔍 Validando dados do cliente...
✅ Cliente existente encontrado: João Silva (11999999999)
✅ Usando cliente existente: João Silva (11999999999)
```

### **Cliente Novo com Email:**
```
🔍 Validando dados do cliente...
➕ Cliente não existe - validando campos obrigatórios para novo cadastro
✅ Validações dos campos do cliente aprovadas
➕ Criando novo cliente: Maria Santos - 11777777777
✅ Novo cliente criado: Maria Santos (11777777777)
```

### **Cliente Novo sem Email:**
```
🔍 Validando dados do cliente...
➕ Cliente não existe - validando campos obrigatórios para novo cadastro
✅ Validações dos campos do cliente aprovadas
➕ Criando novo cliente: João Silva - 11666666666
✅ Novo cliente criado: João Silva (11666666666)
```

---

## 🎯 **Resposta da API:**

### **Sucesso (Cliente Existente):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-do-agendamento",
    "serviceName": "Nome do Serviço",
    "professionalName": "Nome do Profissional",
    "clientName": "João Silva", // Nome do cadastro
    "clientPhone": "11999999999",
    "clientEmail": "joao@cadastro.com", // Email do cadastro
    "dateTime": "2024-01-20T10:00:00",
    "status": "confirmado",
    "price": 50.00,
    "confirmationCode": "WA123456"
  },
  "message": "Agendamento confirmado! Código: WA123456"
}
```

### **Sucesso (Cliente Novo):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-do-agendamento",
    "serviceName": "Nome do Serviço",
    "professionalName": "Nome do Profissional",
    "clientName": "Maria Santos", // Nome fornecido
    "clientPhone": "11777777777",
    "clientEmail": "maria@email.com", // Email fornecido ou automático
    "dateTime": "2024-01-20T12:00:00",
    "status": "confirmado",
    "price": 50.00,
    "confirmationCode": "WA789012"
  },
  "message": "Agendamento confirmado! Código: WA789012"
}
```

---

## ✅ **Resumo da Lógica Atualizada:**

| Situação | Telefone | Nome | Email | Identificação | Ação |
|----------|----------|------|-------|---------------|------|
| **Cliente Existente** | ✅ Obrigatório | ❌ Opcional | ❌ Opcional | Telefone OU Email | Usa dados do cadastro |
| **Cliente Novo** | ✅ Obrigatório | ✅ Obrigatório | ❌ Opcional | - | Cria novo cadastro |

### **🔍 Identificadores Únicos:**
- ✅ **Telefone:** Único por salão
- ✅ **Email:** Único por salão
- ❌ **Nome:** Pode ser duplicado

### **📋 Validações:**
- ✅ **Telefone:** Sempre obrigatório (min. 10 dígitos)
- ✅ **Nome:** Obrigatório apenas para novos clientes (min. 2 caracteres)
- ✅ **Email:** Opcional para novos clientes (formato válido se fornecido)

**Lógica atualizada com sucesso! Agora telefone e email são identificadores únicos! 🎯**
