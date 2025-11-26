# 🔍 Debug - Horários Públicos

## Problema
Os horários ainda aparecem como disponíveis mesmo após criar agendamento manual.

## Verificações necessárias

### 1. Abrir Console do Navegador
- Pressione F12 (ou Ctrl+Shift+I)
- Vá na aba "Console"
- Procure por logs com emoji 🔍 ou 🚫

### 2. Informações esperadas nos logs

#### Log de agendamentos encontrados:
```
🔍 Agendamentos encontrados para 2025-11-24:
  - total: X
  - doDia: Y
  - detalhes: [...]
```

**Verificar:**
- Quantos agendamentos foram encontrados?
- O campo `funcionario_id` ou `employee_id` está correto?
- A data está correta?

#### Log de verificação de slots:
```
🔍 Verificando slot 8:00:
  - slotStart_UTC: "08:00 UTC"
  - aptStart_UTC: "XX:XX UTC"
  - hasOverlap: true/false
```

**Verificar:**
- O horário do slot está em UTC?
- O horário do agendamento está em UTC?
- A comparação está detectando sobreposição?

### 3. Possíveis causas

1. **Query não retorna agendamentos**
   - RLS pode estar bloqueando
   - Campo `funcionario_id` vs `employee_id`

2. **Comparação de horários incorreta**
   - Timezone ainda está causando problema
   - Duracao do serviço não está sendo lida corretamente

3. **Agendamento foi criado com campo errado**
   - Verificar qual campo foi populado: `funcionario_id` ou `employee_id`

## Próximos passos

Envie as informações do console para análise.


