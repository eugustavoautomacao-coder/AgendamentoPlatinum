# Contexto do Chat - MVP Sistema de Agendamento Multitenant

## 📋 Resumo do Projeto
**Objetivo:** MVP multitenant para agendamento e gestão de salões de beleza
**Arquitetura:** Sistema compartilhado com isolamento total por tenant
**Público:** Salões de beleza (cada um como tenant independente)

## 🏗️ Arquitetura Técnica Decidida
- **Backend:** Node.js + Express + PostgreSQL
- **Frontend:** React + Vite + TypeScript
- **Autenticação:** JWT com roles (superadmin, admin, profissional, cliente)
- **Banco:** PostgreSQL com campo `tenantId` em todas as tabelas
- **UI:** Tailwind CSS com abordagem mobile-first

## 🔐 Regras Críticas de Segurança
1. **Isolamento Total:** Zero acesso cruzado entre tenants
2. **Middleware Obrigatório:** Toda query deve incluir `tenantId`
3. **Superadmin Único:** Apenas ele pode criar novos salões
4. **Logs Contextuais:** Prefixar logs com `[Auth/Admin]`, etc.

## 📱 Requisitos de UX/UI
- **Mobile-first:** Priorizar 375px
- **Breakpoints:** sm(640px), md(768px), lg(1024px), xl(1280px)
- **Estilo:** Clean, prático, inspirado em Zenbeauty/Trinks/Treatwell
- **Transições:** Suaves e responsivas

## 🎯 Módulos Principais
1. **Autenticação:** ✅ Login e roles funcionando
2. **Cadastros:** Clientes (auto), Profissionais (admin), Serviços (admin)
3. **Agendamento:** Interface cliente, agenda profissional, validações
4. **Relatórios:** Financeiro, serviços, ranking (admin)

## 📊 Modelos de Dados Principais
```typescript
User { id, name, email, role, tenantId }
Service { id, name, duration, basePrice, taxes, tenantId }
Appointment { id, clientId, professionalId, serviceId, startTime, endTime, status, tenantId }
```

## 🚀 Roadmap de Desenvolvimento
- **Sprint 1:** Fundação e Autenticação
- **Sprint 2:** Gestão de Salões e Usuários  
- **Sprint 3:** Serviços e Configurações
- **Sprint 4:** Sistema de Agendamento
- **Sprint 5:** Relatórios e Finalização

## ⚠️ Restrições Importantes
- Nenhuma regra de negócio deve ser assumida sem consulta
- Dados mockados apenas com autorização explícita
- Componentes específicos, não genéricos
- Estrutura de pastas definida por Pedro

## 📋 Sistema de Documentação Implementado

### Arquivos de Documentação
- **changelog.md** - Histórico detalhado de versões e mudanças
- **technical-notes.md** - Documentação técnica e arquitetural
- **development-log.md** - Log específico de cada mudança
- **atualizacoes.md** - Histórico incremental por sprint
- **checklist.md** - Tarefas e progresso organizados

### Processo de Documentação
1. **Registrar mudança** no development-log.md
2. **Atualizar changelog.md** com status
3. **Documentar decisões** no technical-notes.md
4. **Manter contexto** atualizado no chat-context.md

### Convenções Estabelecidas
- **Commits:** Conventional Commits (feat:, fix:, docs:)
- **Versões:** Semantic Versioning (v1.1.0)
- **Status:** Emojis padronizados (✅, 🟡, 🔴)
- **Estrutura:** Organização hierárquica clara

### [Sprint 1 – Gestão de Usuários]

- Decisão: Filtro de busca de usuários deve ser local e instantâneo, igual ao de salões, para melhor UX.
- Implementação: Busca todos os usuários conforme filtros principais (role/salão) e aplica busca local por nome/email/telefone.
- Redefinição de senha: Implementada via Supabase Edge Function, garantindo segurança (Service Role Key) e permissão de superadmin.
- Correção: Modal de redefinição de senha agora limpa campo de busca, senha e estado ao ser fechado, evitando sumiço da listagem.
- Refatoração: Input de senha do modal controlado por estado, eliminando bugs de referência nula.
- Removido debounce da busca, pois filtro agora é local.
- Mensagens de erro e sucesso aprimoradas.
- Alinhamento de UX: Fluxo de usuários agora idêntico ao de salões.
- Todos os ajustes revisados e validados com o usuário.

---

### v1.2.0 (Sprint 1, Etapa 2)

- Ajustado ProfissionalLayout e ProfissionalSidebar para responsividade total, evitando sobreposição do conteúdo com a sidebar.
- Sidebar do profissional agora conta com botão de retração/expansão sempre visível na versão desktop, igual ao AdminSidebar.
- Estrutura e props padronizadas para garantir experiência idêntica ao admin.

---

### v1.2.1 (Sprint 1, Etapa 2)

- Corrigido problema do nome do salão aparecendo como 'AlveX' temporariamente durante navegação.
- Implementado estado de loading adequado no useSalonInfo hook para AdminSidebar e ProfissionalSidebar.
- Fallback alterado de 'AlveX' para 'Salão' e adicionado indicador 'Carregando...' durante carregamento.

---

### v1.2.2 (Sprint 1, Etapa 2)

- Otimizado estado de loading do nome do salão nas sidebars.
- Implementado cache local (24h) para dados do salão no useSalonInfo hook.
- Nome do salão agora vem diretamente do perfil do usuário (disponível imediatamente).
- Eliminado estado de loading para exibição do nome do salão.

---

## Sprints e Etapas

### Sprint 1
- **v1.0.0**: Setup inicial do projeto, estrutura, autenticação e integração Supabase.
- **v1.1.0**: Cadastro real de usuários (admin, profissional, cliente), modal, validação de roles, triggers e constraints ajustadas.
- **v1.2.0**: Área do profissional criada (layout, sidebar, páginas, rotas protegidas), experiência idêntica ao admin, responsividade e dados reais.
- **v1.2.1**: Correção do nome do salão ('AlveX'), loading e fallback inteligente.
- **v1.2.2**: Otimização do nome do salão (cache local, perfil), sem loading visível.

---

*Este arquivo será atualizado continuamente com decisões e contexto do desenvolvimento.* 