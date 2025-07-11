# Histórico de Atualizações - MVP Sistema de Agendamento Multitenant

## v1.0.0 - Início do Projeto
**Data:** [Data atual]
**Status:** 🟡 Em Planejamento

### O que foi feito:
- ✅ Análise completa do README.md
- ✅ Criação da estrutura de documentação interna
- ✅ Definição do roadmap de desenvolvimento em 5 sprints
- ✅ Checklist detalhado de tarefas por módulo

### Próximos passos:
- Setup inicial do projeto (backend + frontend)
- Configuração do banco de dados multitenant
- Sistema de autenticação base

### Decisões técnicas:
- Stack: Backend Node.js + Frontend React/Vite
- Banco: PostgreSQL com isolamento por tenant
- Autenticação: JWT com roles
- UI: Mobile-first com Tailwind CSS

---

## Estrutura de Versionamento
- **vX.0** → Início de Sprint X
- **vX.Y.0** → Etapa Y da Sprint X  
- **release = 1** → Versão com entrega/publicação 

## v1.1.0 – Etapa 1 da Sprint 1 (Gestão de Usuários)

- Implementação da listagem real de usuários, cruzando dados de autenticação e perfil (Supabase).
- Filtros por role e salão aplicados diretamente na query principal.
- Busca de usuários agora é local e instantânea, igual ao filtro de salões (UX otimizada).
- Redefinição de senha segura via Supabase Edge Function, com validação de superadmin e uso de Service Role Key.
- Correção de múltiplos carregamentos e loops de fetch.
- Refatoração do input de senha do modal para estado controlado (evita bugs de referência nula).
- Modal de redefinição de senha agora limpa campo de busca, senha e estado ao ser fechado (X ou fora do modal).
- Ajuste para garantir que a listagem de usuários nunca suma após redefinir senha ou fechar o modal.
- Remoção do debounce na busca (agora filtro local, sem delay).
- Mensagens de erro e sucesso aprimoradas.
- Estrutura e fluxo alinhados ao padrão de UX do filtro de salões. 

---

### v1.2.0

- ProfissionalLayout e ProfissionalSidebar ajustados para responsividade total e compatibilidade com botão de retração/expansão, igual ao AdminSidebar.
- Corrigido problema de sobreposição dos cards com a sidebar. 

---

### v1.2.1

- Corrigido problema do nome do salão aparecendo como 'AlveX' temporariamente durante navegação.
- Implementado estado de loading adequado para exibição do nome do salão nas sidebars. 