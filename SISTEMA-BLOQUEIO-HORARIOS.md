# Sistema de Bloqueio de Horários

## Visão Geral

O sistema de bloqueio de horários permite que administradores bloqueiem horários específicos para profissionais, impedindo que sejam agendados tanto na agenda interna quanto no agendamento público.

## Funcionalidades

### 1. Bloqueio na Agenda
- **Localização**: Página de Agenda (Admin)
- **Como funciona**: Clique no ícone de cadeado (🔒) em qualquer slot vazio
- **Persistência**: Os bloqueios são salvos no banco de dados e persistem entre sessões
- **Visualização**: Slots bloqueados são marcados visualmente

### 2. Respeito no Agendamento Público
- **Localização**: Página SalaoPublico
- **Como funciona**: Horários bloqueados não aparecem como disponíveis
- **Integração**: Sistema consulta automaticamente a tabela `blocked_slots`

## Estrutura do Banco

### Tabela: blocked_slots
```sql
CREATE TABLE blocked_slots (
  id UUID PRIMARY KEY,
  salao_id UUID REFERENCES saloes(id),
  funcionario_id UUID REFERENCES employees(id),
  data DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  motivo TEXT,
  criado_por UUID REFERENCES users(id),
  criado_em TIMESTAMP WITH TIME ZONE,
  atualizado_em TIMESTAMP WITH TIME ZONE
);
```

## Como Usar

### 1. Bloquear um Horário
1. Acesse a página de Agenda
2. Selecione a data desejada
3. Clique no ícone de cadeado (🔒) no slot desejado
4. O horário será bloqueado e salvo no banco

### 2. Desbloquear um Horário
1. Clique novamente no ícone de cadeado (🔒) no slot bloqueado
2. O horário será liberado e removido do banco

### 3. Verificar Bloqueios
- Slots bloqueados são marcados visualmente na agenda
- Horários bloqueados não aparecem no agendamento público
- Sistema mantém sincronização automática

## Benefícios

1. **Persistência**: Bloqueios não são perdidos ao recarregar a página
2. **Sincronização**: Agenda e agendamento público sempre sincronizados
3. **Flexibilidade**: Pode bloquear horários específicos por profissional
4. **Auditoria**: Registra quem criou cada bloqueio e quando

## Implementação Técnica

### Agenda (Admin)
- Estado local `lockedSlots` para UI responsiva
- Função `loadBlockedSlots()` carrega bloqueios do banco
- Função `handleSlotLock()` persiste mudanças no banco
- useEffect sincroniza estado local com banco

### Agendamento Público
- Função `fetchAvailableSlots()` consulta `blocked_slots`
- Filtra horários disponíveis removendo bloqueios
- Mantém compatibilidade se tabela não existir

## Troubleshooting

### Problema: Horários bloqueados aparecem desbloqueados
**Solução**: Verificar se a tabela `blocked_slots` foi criada corretamente

### Problema: Erro ao bloquear horário
**Solução**: Verificar permissões RLS e se o usuário tem acesso ao salão

### Problema: Bloqueios não persistem
**Solução**: Verificar se o banco está funcionando e se as políticas RLS estão corretas

## Scripts SQL

Execute o arquivo `create-blocked-slots-table.sql` para criar a tabela necessária:

```bash
# No Supabase SQL Editor
\i create-blocked-slots-table.sql
```

## Notas Importantes

1. **RLS**: A tabela tem Row Level Security habilitado
2. **Performance**: Índices criados para consultas eficientes
3. **Compatibilidade**: Sistema funciona mesmo se tabela não existir
4. **Auditoria**: Todos os bloqueios são registrados com timestamp e usuário
