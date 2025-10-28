# 🔧 Correção do Erro 500 - Edge Function

## ❌ **Problema Identificado:**

O erro 500 "Erro interno do servidor" foi causado por **variáveis não definidas** na Edge Function:

### **Erros Corrigidos:**
- ❌ `serviceDuration` não estava definida
- ❌ `slots` array não estava definido
- ❌ Variáveis estavam sendo usadas antes da declaração

## ✅ **Correções Implementadas:**

### **1. Variáveis Definidas Corretamente:**
```typescript
// ✅ ANTES (ERRADO)
for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + 30)) {
  const slotEndTime = new Date(slotDateTime.getTime() + serviceDuration * 60000) // ❌ serviceDuration não definida
  // ...
  slots.push({ // ❌ slots não definido
    // ...
  })
}

// ✅ AGORA (CORRETO)
const slots: Array<{
  time: string;
  available: boolean;
  professionalId: string;
  professionalName: string;
}> = []
const serviceDuration = service.duracao_minutos

for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + 30)) {
  const slotEndTime = new Date(slotDateTime.getTime() + serviceDuration * 60000) // ✅ serviceDuration definida
  // ...
  slots.push({ // ✅ slots definido
    // ...
  })
}
```

### **2. Logs de Debug Mantidos:**
```typescript
console.log(`🔍 Consultando disponibilidade para ${date}`)
console.log(`📅 Agendamentos encontrados:`, appointments?.length || 0)
appointments.forEach(apt => {
  console.log(`  - ${apt.data_hora} (duração: ${apt.services.duracao_minutos}min)`)
})

// Para cada conflito:
console.log(`⚠️ Conflito detectado para ${timeString}:`)
console.log(`  Slot: ${slotDateTime.toISOString()} - ${slotEndTime.toISOString()}`)
console.log(`  Agendamento: ${aptTime.toISOString()} - ${aptEndTime.toISOString()}`)

// Resultado final:
console.log(`✅ Slot ${timeString}: ${isAvailable ? 'DISPONÍVEL' : 'OCUPADO'}`)
```

---

## 🚀 **Deploy da Edge Function:**

### **Opção 1: Deploy Manual (Recomendado)**
1. Acesse: https://supabase.com/dashboard/project/lbpqmdcmoybuuthzezmj/functions
2. Clique em **"Create a new function"**
3. Nome: `alvexapi`
4. Copie o conteúdo do arquivo: `supabase/functions/alvexapi/index.ts`
5. Cole no editor e clique em **"Deploy"**

### **Opção 2: Supabase CLI**
```bash
# Instalar CLI
npm install -g supabase

# Deploy
supabase functions deploy alvexapi
```

---

## 🧪 **Teste Após Deploy:**

### **Chamada da API:**
```bash
curl -X GET "https://lbpqmdcmoybuuthzezmj.supabase.co/functions/v1/alvexapi/salon/5d0bf181-ed3a-4b8b-b508-2f1432e0b824/availability?serviceId=0ce540df-f34a-4d8c-b018-19008e615914&professionalId=475498d3-7885-4288-9fa5-d3fdcd502d64&date=2025-10-29" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxicHFtZGNtb3lidXV0aHplem1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTY1OTcsImV4cCI6MjA2NzAzMjU5N30.y4NXpFVhJIRlZLDKXYAFTHj9IcvP5Gm6wuHbJxjZDQI"
```

### **Verificar Logs:**
1. Supabase Dashboard → Edge Functions → alvexapi → Logs
2. Procurar pelos logs de debug:
   ```
   🔍 Consultando disponibilidade para 2025-10-29
   📅 Agendamentos encontrados: 2
     - 2025-10-29T08:00:00.000Z (duração: 60min)
     - 2025-10-29T13:00:00.000Z (duração: 60min)
   
   ✅ Slot 08:00: OCUPADO
   ✅ Slot 08:30: DISPONÍVEL
   ✅ Slot 09:00: DISPONÍVEL
   ...
   ✅ Slot 15:30: DISPONÍVEL  // Deve aparecer DISPONÍVEL
   ✅ Slot 16:00: DISPONÍVEL  // Deve aparecer DISPONÍVEL
   ✅ Slot 16:30: DISPONÍVEL  // Deve aparecer DISPONÍVEL
   ✅ Slot 17:00: DISPONÍVEL  // Deve aparecer DISPONÍVEL
   ✅ Slot 17:30: DISPONÍVEL
   ```

---

## 🎯 **Resultado Esperado:**

Após o deploy, a API deve:
- ✅ **Não mais retornar erro 500**
- ✅ **Mostrar logs detalhados** no Supabase Dashboard
- ✅ **Identificar a causa** dos horários aparecendo como ocupados
- ✅ **Permitir correção** da lógica baseada nos logs

**Com os logs de debug, poderemos finalmente identificar e corrigir o problema de disponibilidade!** 🔧
