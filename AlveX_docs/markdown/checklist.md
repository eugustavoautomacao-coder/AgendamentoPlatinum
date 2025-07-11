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
- [x] Listagem real de usuários (Supabase, cruzando autenticação e perfil)
- [x] Filtros por role e salão (query principal)
- [x] Busca local e instantânea (UX igual salões)
- [x] Redefinição de senha via Edge Function (Service Role Key, superadmin)
- [x] Modal de redefinição de senha limpa busca, senha e estado ao fechar
- [x] Correção: listagem nunca some após redefinir senha ou fechar modal
- [x] Remover debounce (busca local)
- [x] Mensagens de erro/sucesso aprimoradas
- [x] Alinhamento de UX com fluxo de salões
- [x] Corrigir problema do nome do salão aparecendo como 'AlveX' temporariamente durante navegação

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
- [x] Ajustar ProfissionalLayout e ProfissionalSidebar para responsividade total e botão de retração/expansão igual ao AdminSidebar 