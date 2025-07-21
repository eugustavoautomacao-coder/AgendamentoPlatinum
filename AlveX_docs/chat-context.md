# Contexto e Requisitos — Módulo de Agendamento (Sprint futura)

## Contexto
- O sistema já possui estrutura de profissionais, clientes e dashboard.
- O número de "Serviços Realizados" exibido atualmente é mockado; será integrado ao módulo de agendamento.
- O ambiente Supabase já possui (ou terá) tabela de agendamentos (`appointments`) com os campos necessários.

## Requisitos para a Sprint de Agendamento
- **CRUD de Agendamentos:**
  - Criação, edição, cancelamento e conclusão de agendamentos.
  - Relacionamento com profissionais, clientes e serviços.
- **Contagem real de serviços realizados:**
  - Dashboard deve exibir o total de agendamentos concluídos no mês atual (por salão e, opcionalmente, por profissional).
  - Consulta ao Supabase filtrando por `status = 'concluido'` e data do mês.
- **Indicadores e Relatórios:**
  - Exibir indicadores reais no dashboard (serviços realizados, receita, etc).
  - Possibilidade de relatórios por período, profissional, serviço.
- **Integração visual:**
  - Atualização automática dos cards e indicadores após agendamento/conclusão.
- **Escalabilidade:**
  - Estrutura pronta para múltiplos salões, profissionais e clientes.

## Observações
- O ambiente já está preparado para integrar esses dados.
- Quando a sprint for iniciada, priorizar performance e UX na manipulação dos agendamentos.
- Registrar qualquer regra de negócio específica antes de iniciar a implementação.

---

*Este registro serve como referência para a futura sprint de agendamento e integração de dados reais no dashboard.* 