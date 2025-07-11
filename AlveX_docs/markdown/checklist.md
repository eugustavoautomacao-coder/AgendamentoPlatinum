# Checklist - MVP Sistema de Agendamento Multitenant

## Sprint 1 - Fundação e Autenticação (v1.0)
- [ ] Setup inicial do projeto (backend + frontend)
- [ ] Configuração do banco de dados com suporte multitenant
- [ ] Sistema de autenticação com roles (superadmin, admin, profissional, cliente)
- [ ] Middleware de isolamento por tenant
- [ ] Recuperação de senha via email

## Sprint 2 - Gestão de Salões e Usuários (v2.0)
- [ ] CRUD de salões (apenas superadmin)
- [ ] Provisionamento de admin inicial por salão
- [ ] Cadastro de profissionais (admin)
- [ ] Auto-cadastro de clientes (link público)
- [ ] Gestão de perfis e permissões

## Sprint 3 - Serviços e Configurações (v3.0)
- [ ] CRUD de serviços com taxas configuráveis
- [ ] Configuração de horários dos profissionais
- [ ] Gestão de especialidades
- [ ] Configurações de preços e duração

## Sprint 4 - Sistema de Agendamento (v4.0)
- [ ] Interface de agendamento para clientes
- [ ] Visualização de agenda disponível
- [ ] Confirmação e remarcação de horários
- [ ] Dashboard do profissional
- [ ] Validações de disponibilidade

## Sprint 5 - Relatórios e Finalização (v5.0)
- [ ] Relatórios financeiros (admin)
- [ ] Relatórios de serviços realizados
- [ ] Ranking de serviços
- [ ] Testes de isolamento multitenant
- [ ] Responsividade mobile-first
- [ ] Deploy e documentação final

## Critérios de Qualidade
- [ ] Zero vazamento de dados entre tenants
- [ ] Interface intuitiva e responsiva
- [ ] Performance otimizada
- [ ] Segurança implementada
- [ ] Testes de todos os fluxos críticos 