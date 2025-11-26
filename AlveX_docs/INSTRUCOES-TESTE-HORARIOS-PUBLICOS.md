# 📋 Instruções - Testar Horários Públicos

## Problema Corrigido

O agendamento manual não estava bloqueando os horários na página pública porque o campo `employee_id` não estava sendo populado.

## Correções Aplicadas

1. **Código atualizado**: `src/hooks/useAppointments.tsx` - agora popula `employee_id` automaticamente
2. **Script SQL**: `fix-existing-appointments-employee-id.sql` - para corrigir agendamentos antigos

## Passos para Testar

### 1. Executar SQL para corrigir agendamentos antigos

No Supabase SQL Editor, execute:
```sql
UPDATE appointments 
SET employee_id = funcionario_id 
WHERE employee_id IS NULL 
  AND funcionario_id IS NOT NULL;
```

### 2. Criar um novo agendamento manual

1. Vá para a página de Agenda (admin ou profissional)
2. Crie um novo agendamento
3. Escolha um profissional, cliente, serviço, data e horário
4. Confirme o agendamento

### 3. Verificar na página pública

1. Abra a página pública de agendamento
2. Escolha o mesmo serviço
3. Escolha o mesmo profissional
4. Escolha a mesma data
5. **Verifique se o horário criado aparece como INDISPONÍVEL**

### 4. Verificar logs do console (F12)

Procure por:
```
🔍 Agendamentos encontrados para [data]:
  - total: X
  - doDia: Y
```

Deve mostrar:
- Agendamentos encontrados
- O campo `employee_id` preenchido
- A comparação de horários detectando sobreposição

### 5. Se ainda não funcionar

**Verifique se a query retorna agendamentos:**
```
🔍 Agendamentos encontrados para 2025-11-24:
  - total: 0  ← Se for 0, a RLS pode estar bloqueando
  - doDia: 0
```

**Possíveis causas:**
1. RLS bloqueando a query pública
2. Campo `employee_id` ainda vazio nos agendamentos antigos
3. Problema de timezone na comparação

**Solução:**
- Execute o script SQL novamente
- Limpe o cache do navegador (Ctrl+Shift+Del)
- Teste com um agendamento novo (criado após a correção)

## Status Esperado

✅ Horários ocupados aparecem como INDISPONÍVEIS
✅ Query retorna agendamentos
✅ Logs mostram a comparação correta
✅ Campo `employee_id` preenchido em novos agendamentos

## Se precisar de ajuda

Envie print/texto dos logs do console (F12).


