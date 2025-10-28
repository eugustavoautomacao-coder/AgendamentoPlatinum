# Deploy da Edge Function alvexapi

## 🚀 Como Subir a API

### **1. Deploy da Edge Function**
```bash
# No terminal, na pasta do projeto
supabase functions deploy alvexapi
```

### **2. URL da API**
Após o deploy, sua API estará disponível em:
```
https://SEU_PROJETO.supabase.co/functions/v1/alvexapi
```

### **3. Teste da API**
```bash
# Teste básico
curl -X GET "https://SEU_PROJETO.supabase.co/functions/v1/alvexapi/health" \
  -H "Authorization: Bearer SEU_SUPABASE_ANON_KEY"
```

## 📋 Endpoints Disponíveis

### **Base URL:**
```
https://SEU_PROJETO.supabase.co/functions/v1/alvexapi
```

### **Endpoints:**
- `GET /salon/{salonId}/info` - Informações do salão
- `GET /salon/{salonId}/services` - Lista serviços
- `GET /salon/{salonId}/professionals` - Lista profissionais
- `GET /salon/{salonId}/availability` - Consulta disponibilidade
- `POST /salon/{salonId}/booking` - Cria agendamento
- `DELETE /salon/{salonId}/booking/{appointmentId}` - Cancela agendamento
- `GET /salon/{salonId}/bookings` - Lista agendamentos do cliente
- `GET /salon/{salonId}/booking/code/{confirmationCode}` - Busca por código
- `GET /health` - Health check

## 🔧 Configuração no n8n

### **Headers Obrigatórios:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer SEU_SUPABASE_ANON_KEY"
}
```

### **Exemplo de HTTP Request Node:**
```json
{
  "method": "GET",
  "url": "https://SEU_PROJETO.supabase.co/functions/v1/alvexapi/salon/SEU_SALON_ID/services",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer SEU_SUPABASE_ANON_KEY"
  }
}
```

## ✅ Vantagens da Edge Function

- ✅ **Sem servidor** - Supabase gerencia tudo
- ✅ **Escalável** - Auto-scaling automático
- ✅ **Seguro** - RLS já configurado
- ✅ **Rápido** - Edge Functions são otimizadas
- ✅ **Simples** - Um comando para deploy
- ✅ **Monitoramento** - Logs automáticos no Supabase

## 🎯 Próximos Passos

1. **Deploy**: `supabase functions deploy alvexapi`
2. **Teste**: Use o endpoint `/health`
3. **Configure n8n**: Use a URL da Edge Function
4. **Teste integração**: Faça chamadas reais
5. **Monitore**: Acompanhe logs no Supabase Dashboard

---

**🎉 Pronto! Sua API está no ar via Supabase Edge Function!**
