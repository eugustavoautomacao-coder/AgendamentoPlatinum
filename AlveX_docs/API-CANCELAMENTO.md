# API de Cancelamento de Agendamentos

## 📋 Endpoint

```
DELETE /salon/{salonId}/booking/{appointmentId}
```

## 🔑 Autenticação

Todas as requisições devem incluir o header de autorização:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Use a `SUPABASE_ANON_KEY` do seu projeto.

## 📥 Request

### URL Parameters

- `salonId` (UUID): ID do salão
- `appointmentId` (UUID): ID do agendamento a ser cancelado

### Body (JSON - Opcional)

```json
{
  "reason": "Motivo do cancelamento"
}
```

**Campos:**
- `reason` (string, opcional): Motivo do cancelamento. Se não informado, usa "Cancelado via WhatsApp (Evolution API)"

## 📤 Respostas

### ✅ Sucesso (200)

```json
{
  "success": true,
  "message": "Agendamento cancelado com sucesso",
  "data": {
    "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
    "cancelReason": "Cliente solicitou cancelamento",
    "cancelledAt": "2024-10-29T14:30:00.000Z"
  }
}
```

### ❌ Erros

#### Agendamento não encontrado (404)

```json
{
  "success": false,
  "error": "Agendamento não encontrado"
}
```

#### Agendamento já cancelado (400)

```json
{
  "success": false,
  "error": "Agendamento já está cancelado"
}
```

#### Agendamento concluído (400)

```json
{
  "success": false,
  "error": "Não é possível cancelar um agendamento já concluído"
}
```

#### Erro interno (500)

```json
{
  "success": false,
  "error": "Erro ao cancelar agendamento",
  "debug": "Mensagem técnica do erro"
}
```

## 🧪 Exemplos de Uso

### cURL

```bash
curl -X DELETE \
  "https://lbpqmdcmoybuuthzezmj.supabase.co/functions/v1/alvexapi/salon/5d0bf181-ed3a-4b8b-b508-2f1432e0b824/booking/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Cliente solicitou reagendamento"
  }'
```

### JavaScript/TypeScript

```typescript
const cancelBooking = async (salonId: string, appointmentId: string, reason?: string) => {
  const response = await fetch(
    `https://lbpqmdcmoybuuthzezmj.supabase.co/functions/v1/alvexapi/salon/${salonId}/booking/${appointmentId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: reason || 'Cliente solicitou cancelamento'
      })
    }
  );

  const data = await response.json();
  
  if (data.success) {
    console.log('✅ Agendamento cancelado:', data.data);
    return data.data;
  } else {
    console.error('❌ Erro ao cancelar:', data.error);
    throw new Error(data.error);
  }
};

// Uso
await cancelBooking(
  '5d0bf181-ed3a-4b8b-b508-2f1432e0b824',
  '550e8400-e29b-41d4-a716-446655440000',
  'Cliente solicitou cancelamento'
);
```

### n8n HTTP Request Node

**Configuração:**

```json
{
  "method": "DELETE",
  "url": "https://lbpqmdcmoybuuthzezmj.supabase.co/functions/v1/alvexapi/salon/={{$json.salonId}}/booking/={{$json.appointmentId}}",
  "authentication": "none",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "Authorization",
        "value": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      },
      {
        "name": "Content-Type",
        "value": "application/json"
      }
    ]
  },
  "sendBody": true,
  "bodyParameters": {
    "parameters": [
      {
        "name": "reason",
        "value": "={{$json.cancelReason}}"
      }
    ]
  }
}
```

## 🔄 Integração com WhatsApp (Evolution API)

### Fluxo de Cancelamento

1. **Cliente envia mensagem**: "Quero cancelar meu agendamento"
2. **n8n identifica intenção**: Cancelamento
3. **n8n busca agendamentos**: `GET /bookings?clientPhone=11999999999`
4. **n8n lista opções**: "Você tem 2 agendamentos: 1) Corte (29/10 às 14h), 2) Barba (30/10 às 10h)"
5. **Cliente escolhe**: "Cancelar o 1"
6. **n8n cancela**: `DELETE /booking/{appointmentId}` com reason
7. **n8n confirma**: "Agendamento de Corte cancelado com sucesso!"

### Exemplo de Workflow n8n

```
[Webhook WhatsApp] 
  ↓
[AI Agent - Identifica intenção: cancelar]
  ↓
[HTTP Request - GET /bookings?clientPhone=...] → Lista agendamentos
  ↓
[AI Agent - Apresenta opções]
  ↓
[Aguarda escolha do cliente]
  ↓
[HTTP Request - DELETE /booking/{appointmentId}]
  ↓
[Envia confirmação via WhatsApp]
```

## 🔐 Validações da API

A API valida automaticamente:

1. ✅ **Agendamento existe** no salão especificado
2. ✅ **Status não é "cancelado"** (evita duplicação)
3. ✅ **Status não é "concluido"** (evita cancelar serviços já realizados)
4. ✅ **salonId corresponde** ao agendamento (segurança multitenancy)

## 📊 Campos Atualizados

Ao cancelar, a API atualiza na tabela `appointments`:

```sql
UPDATE appointments SET
  status = 'cancelado',
  motivo_cancelamento = 'Razão fornecida ou default'
WHERE id = appointmentId AND salao_id = salonId
```

## 💡 Dicas

### Para Desenvolvedores
- Sempre trate o campo `success` da resposta
- Use o `appointmentId` retornado para confirmar a operação
- O campo `cancelledAt` pode ser usado para auditoria

### Para n8n
- Armazene o `appointmentId` quando criar o agendamento
- Use variáveis de workflow para passar o ID entre nodes
- Implemente tratamento de erros para cada status code

### Para WhatsApp
- Sempre confirme o cancelamento com o cliente
- Ofereça opção de reagendamento imediato
- Envie mensagem amigável com os dados do agendamento cancelado

## 🚨 Importante

⚠️ **Cancelamento é irreversível** - Uma vez cancelado, o agendamento não pode ser reativado. O cliente precisará criar um novo agendamento.

⚠️ **Horário liberado** - Ao cancelar, o horário fica disponível novamente para outros clientes.

⚠️ **Notificações** - Considere enviar notificações ao profissional quando um agendamento for cancelado via WhatsApp.

