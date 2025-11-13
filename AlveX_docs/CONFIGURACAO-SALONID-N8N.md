# Configuração do SalonID no n8n

## 🎯 Resposta Rápida

**SIM!** Para cada salão/agente no n8n, você precisa apenas configurar **uma variável fixa de `salonID`** que será usada em todas as consultas da API.

---

## 📋 Como Configurar

### **Opção 1: Variável de Workflow (Recomendado)**

#### 1. Criar Variável de Workflow no n8n

1. No n8n, vá em **Settings** → **Variables**
2. Adicione uma nova variável:
   - **Name**: `SALON_ID` (ou `SALON_ID_VIRGINIA`, `SALON_ID_SALAO_1`, etc.)
   - **Value**: `seu-uuid-do-salao-aqui`
   - **Type**: `String`

#### 2. Usar a Variável nos HTTP Request Nodes

Em todos os HTTP Request nodes, use a variável assim:

**Exemplo de URL:**
```
https://seu-projeto.supabase.co/functions/v1/alvexapi/salon/{{$vars.SALON_ID}}/services
```

**Todos os endpoints ficam assim:**
- `{{$vars.SALON_ID}}` → Variável do workflow
- Substitui `SEU_SALON_ID` em todas as URLs

---

### **Opção 2: Node Set no Início do Workflow**

#### 1. Adicionar Node "Set" no Início

Logo após o Webhook Trigger, adicione um node **Set**:

**Node: "Configurar SalonID"**
```json
{
  "assignments": [
    {
      "name": "salonId",
      "value": "seu-uuid-do-salao-aqui",
      "type": "string"
    }
  ]
}
```

#### 2. Usar nos HTTP Request Nodes

Em todos os HTTP Request nodes, use:

**Exemplo de URL:**
```
https://seu-projeto.supabase.co/functions/v1/alvexapi/salon/{{$json.salonId}}/services
```

---

## 🔧 Configuração Completa dos HTTP Request Nodes

### **1. Buscar Serviços**
```
Method: GET
URL: https://seu-projeto.supabase.co/functions/v1/alvexapi/salon/{{$vars.SALON_ID}}/services
Headers:
  - Content-Type: application/json
  - Authorization: Bearer SEU_SUPABASE_ANON_KEY
```

### **2. Buscar Profissionais**
```
Method: GET
URL: https://seu-projeto.supabase.co/functions/v1/alvexapi/salon/{{$vars.SALON_ID}}/professionals
Headers:
  - Content-Type: application/json
  - Authorization: Bearer SEU_SUPABASE_ANON_KEY
```

### **3. Buscar Disponibilidade**
```
Method: GET
URL: https://seu-projeto.supabase.co/functions/v1/alvexapi/salon/{{$vars.SALON_ID}}/availability
Query Parameters:
  - serviceId: {{$json.serviceId}}
  - professionalId: {{$json.professionalId}}
  - date: {{$json.date}}
Headers:
  - Content-Type: application/json
  - Authorization: Bearer SEU_SUPABASE_ANON_KEY
```

### **4. Criar Agendamento**
```
Method: POST
URL: https://seu-projeto.supabase.co/functions/v1/alvexapi/salon/{{$vars.SALON_ID}}/booking
Headers:
  - Content-Type: application/json
  - Authorization: Bearer SEU_SUPABASE_ANON_KEY
Body:
{
  "serviceId": "{{$json.serviceId}}",
  "professionalId": "{{$json.professionalId}}",
  "dateTime": "{{$json.dateTime}}",
  "clientPhone": "{{$json.clientPhone}}",
  "clientName": "{{$json.clientName}}"
}
```

### **5. Cancelar Agendamento**
```
Method: DELETE
URL: https://seu-projeto.supabase.co/functions/v1/alvexapi/salon/{{$vars.SALON_ID}}/booking/{{$json.appointmentId}}
Headers:
  - Content-Type: application/json
  - Authorization: Bearer SEU_SUPABASE_ANON_KEY
Body:
{
  "reason": "{{$json.reason}}"
}
```

### **6. Listar Agendamentos do Cliente**
```
Method: GET
URL: https://seu-projeto.supabase.co/functions/v1/alvexapi/salon/{{$vars.SALON_ID}}/bookings
Query Parameters:
  - clientPhone: {{$json.clientPhone}}
Headers:
  - Content-Type: application/json
  - Authorization: Bearer SEU_SUPABASE_ANON_KEY
```

### **7. Buscar por Código**
```
Method: GET
URL: https://seu-projeto.supabase.co/functions/v1/alvexapi/salon/{{$vars.SALON_ID}}/booking/code/{{$json.confirmationCode}}
Headers:
  - Content-Type: application/json
  - Authorization: Bearer SEU_SUPABASE_ANON_KEY
```

---

## 🎯 Para Múltiplos Salões/Agentes

### **Cenário: Cada Salão tem seu Próprio Workflow**

**Solução:** Cada workflow tem sua própria variável `SALON_ID`

**Workflow "Agente Virginia" (Salão 1):**
- Variável: `SALON_ID_VIRGINIA = "uuid-salao-1"`
- URLs: `.../salon/{{$vars.SALON_ID_VIRGINIA}}/...`

**Workflow "Agente João" (Salão 2):**
- Variável: `SALON_ID_JOAO = "uuid-salao-2"`
- URLs: `.../salon/{{$vars.SALON_ID_JOAO}}/...`

### **Cenário: Um Workflow para Múltiplos Salões**

**Solução:** Identificar o salão pela conversa/WhatsApp

1. Criar um node **Set** que identifica o salão baseado no número do WhatsApp:
```json
{
  "assignments": [
    {
      "name": "salonId",
      "value": "={{ $('Identificar Salão').item.json.salonId }}",
      "type": "string"
    }
  ]
}
```

2. Node **Identificar Salão** (Code ou Function):
```javascript
// Mapear número do WhatsApp para salonID
const phoneNumber = $input.item.json.body.data.key.remoteJid;
const salonMapping = {
  '5511999999999': 'uuid-salao-1',
  '5511888888888': 'uuid-salao-2',
  // ... mais mapeamentos
};

return {
  salonId: salonMapping[phoneNumber] || 'uuid-padrao'
};
```

---

## ✅ Checklist de Configuração

- [ ] Variável `SALON_ID` criada no workflow (ou node Set configurado)
- [ ] Todas as URLs dos HTTP Request nodes usam `{{$vars.SALON_ID}}` (ou `{{$json.salonId}}`)
- [ ] Headers configurados com `Authorization: Bearer SEU_SUPABASE_ANON_KEY`
- [ ] Testado com um endpoint (ex: `/services`)
- [ ] Verificado que o salonID está correto nas requisições

---

## 🚨 Pontos Importantes

### **1. O salonID é FIXO por Workflow**
- Uma vez configurado, o mesmo `salonID` é usado em todas as consultas
- Não precisa passar novamente em cada requisição
- Apenas configure uma vez no início do workflow

### **2. Formato do salonID**
- É um UUID (ex: `550e8400-e29b-41d4-a716-446655440000`)
- Deve ser o ID exato do salão no banco de dados
- Pode ser encontrado na tabela `salons` do Supabase

### **3. Segurança**
- O `salonID` garante que cada agendamento seja do salão correto
- A API valida automaticamente que os dados pertencem ao `salonID` especificado
- Não é possível acessar dados de outros salões

---

## 📚 Exemplo Prático Completo

### **Workflow Simplificado:**

```
[Webhook WhatsApp] 
  ↓
[Set: Configurar SalonID] → salonId = "uuid-salao-fixo"
  ↓
[AI Agent: Processar Mensagem]
  ↓
[HTTP Request: GET /salon/{{$json.salonId}}/services]
  ↓
[HTTP Request: GET /salon/{{$json.salonId}}/availability]
  ↓
[AI Agent: Formatar Resposta]
  ↓
[WhatsApp: Enviar Mensagem]
```

---

## 🎉 Resumo

**Para cada salão/agente:**
1. ✅ Configure **UMA variável fixa** de `salonID`
2. ✅ Use essa variável em **TODAS as URLs** dos HTTP Request nodes
3. ✅ Pronto! Todas as consultas já vão usar o `salonID` correto

**Não precisa:**
- ❌ Passar `salonID` no body das requisições
- ❌ Configurar em cada node individualmente
- ❌ Fazer lógica complexa para identificar o salão (a menos que seja um workflow compartilhado)

---

**Simples assim! 🚀**


