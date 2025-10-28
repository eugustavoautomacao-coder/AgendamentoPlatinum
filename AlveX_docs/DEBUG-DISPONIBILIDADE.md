# 🔍 Debug da Disponibilidade - Guia de Teste

## 🚨 **Problema Identificado:**

Baseado na agenda visual e na resposta da API, há uma inconsistência:

### **📅 Agenda Visual (29/10):**
- ✅ **08:00** - Agendamento confirmado (Zap - Alongamento de Unha)
- ✅ **09:00-12:00** - Horários livres (cinza)
- ✅ **13:00** - Agendamento confirmado (Cliente - Alongamento de Unha)
- ✅ **14:00-18:00** - Horários livres (cinza)

### **🔍 Resposta da API:**
```json
{
  "time": "15:30", "available": false,  // ❌ Deveria ser true
  "time": "16:00", "available": false,  // ❌ Deveria ser true  
  "time": "16:30", "available": false,  // ❌ Deveria ser true
  "time": "17:00", "available": false,  // ❌ Deveria ser true
  "time": "17:30", "available": true    // ✅ Correto
}
```

---

## 🧪 **Teste com Logs de Debug:**

### **1. Fazer Chamada da API:**
```bash
curl -X GET "https://lbpqmdcmoybuuthzezmj.supabase.co/functions/v1/alvexapi/salon/5d0bf181-ed3a-4b8b-b508-2f1432e0b824/availability?serviceId=0ce540df-f34a-4d8c-b018-19008e615914&professionalId=475498d3-7885-4288-9fa5-d3fdcd502d64&date=2025-10-29" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxicHFtZGNtb3lidXV0aHplem1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTY1OTcsImV4cCI6MjA2NzAzMjU5N30.y4NXpFVhJIRlZLDKXYAFTHj9IcvP5Gm6wuHbJxjZDQI"
```

### **2. Verificar Logs no Supabase Dashboard:**
1. Acesse [supabase.com](https://supabase.com)
2. Vá para o projeto `lbpqmdcmoybuuthzezmj`
3. Clique em **Edge Functions** → **alvexapi**
4. Clique em **Logs**
5. Procure pelos logs de debug:

**Logs esperados:**
```
🔍 Consultando disponibilidade para 2025-10-29
📅 Agendamentos encontrados: 2
  - 2025-10-29T08:00:00.000Z (duração: 60min)
  - 2025-10-29T13:00:00.000Z (duração: 60min)

✅ Slot 08:00: OCUPADO
✅ Slot 08:30: DISPONÍVEL
✅ Slot 09:00: DISPONÍVEL
...
✅ Slot 15:30: DISPONÍVEL  // ❌ Se aparecer OCUPADO, há problema
✅ Slot 16:00: DISPONÍVEL  // ❌ Se aparecer OCUPADO, há problema
✅ Slot 16:30: DISPONÍVEL  // ❌ Se aparecer OCUPADO, há problema
✅ Slot 17:00: DISPONÍVEL  // ❌ Se aparecer OCUPADO, há problema
✅ Slot 17:30: DISPONÍVEL
```

---

## 🔍 **Possíveis Causas do Problema:**

### **1. 🕐 Problema de Timezone:**
- Agendamentos podem estar sendo salvos em UTC
- Consulta pode estar usando timezone local
- Conversão pode estar incorreta

### **2. 📊 Problema de Duração:**
- Duração do serviço pode estar incorreta
- Cálculo de fim do agendamento pode estar errado
- Sobreposição pode estar sendo calculada incorretamente

### **3. 🗃️ Problema de Dados:**
- Agendamentos podem ter duração muito longa
- Pode haver agendamentos "fantasma" no banco
- Filtros de data podem estar incorretos

---

## 🛠️ **Correções Implementadas:**

### **✅ Logs de Debug Adicionados:**
```typescript
console.log(`🔍 Consultando disponibilidade para ${date}`)
console.log(`📅 Agendamentos encontrados:`, appointments?.length || 0)
appointments.forEach(apt => {
  console.log(`  - ${apt.data_hora} (duração: ${apt.services.duracao_minutos}min)`)
})

// Para cada slot:
console.log(`⚠️ Conflito detectado para ${timeString}:`)
console.log(`  Slot: ${slotDateTime.toISOString()} - ${slotEndTime.toISOString()}`)
console.log(`  Agendamento: ${aptTime.toISOString()} - ${aptEndTime.toISOString()}`)

console.log(`✅ Slot ${timeString}: ${isAvailable ? 'DISPONÍVEL' : 'OCUPADO'}`)
```

---

## 📋 **Próximos Passos:**

1. **Testar** a API com os logs de debug
2. **Analisar** os logs no Supabase Dashboard
3. **Identificar** a causa raiz do problema
4. **Corrigir** a lógica baseada nos logs
5. **Validar** com a agenda visual

---

## 🎯 **Resultado Esperado:**

Após análise dos logs, devemos identificar:
- ✅ Quantos agendamentos estão sendo encontrados
- ✅ Quais horários estão sendo considerados
- ✅ Por que horários livres estão aparecendo como ocupados
- ✅ Se há problema de timezone ou duração

**Com os logs, poderemos corrigir definitivamente a lógica de disponibilidade!** 🔧
