# Checklist - AlveX

## Sprint Atual: Dark Mode Implementation

### ✅ Tarefas Concluídas
- [x] Sidebar e nome do salão otimizados
- [x] Gestão de usuários (Superadmin) - CRUD completo
- [x] Edição de perfil do usuário com upload de avatar
- [x] Supabase Storage e policies configuradas
- [x] Botão de sair nas sidebars (Admin/Profissional)

### 🎯 Sprint: Dark Mode System (v1.2.0)

#### 1. Configuração Base do Dark Mode ✅
- [x] Criar contexto de tema (ThemeProvider)
- [x] Implementar hook useTheme
- [x] Configurar persistência do tema (localStorage)
- [x] Adicionar toggle de tema no layout principal

#### 2. Configuração do Tailwind CSS ✅
- [x] Atualizar tailwind.config.ts com variáveis de tema
- [x] Definir cores para modo claro e escuro
- [x] Configurar CSS variables para transições suaves
- [x] Testar aplicação das classes dark:

#### 3. Componentes UI - Dark Mode 🚧
- [ ] Sidebar (Admin, Profissional, SuperAdmin)
- [ ] Header/Navigation
- [ ] Cards e containers
- [ ] Formulários e inputs
- [ ] Botões e elementos interativos
- [ ] Modais e dropdowns
- [ ] Tabelas e listagens

#### 4. Páginas Principais - Dark Mode 🚧
- [ ] Login e autenticação
- [ ] Dashboard (Admin, Profissional, SuperAdmin)
- [ ] Páginas de gestão (usuários, salões, etc.)
- [ ] Páginas de configurações
- [ ] Página de perfil

#### 5. Elementos Específicos 🚧
- [ ] Avatar e imagens
- [ ] Ícones e elementos gráficos
- [ ] Estados de loading e feedback
- [ ] Mensagens de erro e sucesso
- [ ] Tooltips e popovers

#### 6. Responsividade e Acessibilidade 🚧
- [ ] Testar em diferentes tamanhos de tela
- [ ] Verificar contraste de cores
- [ ] Testar transições suaves
- [ ] Validar acessibilidade (WCAG)

#### 7. Testes e Validação 🚧
- [ ] Testar toggle de tema
- [ ] Verificar persistência entre sessões
- [ ] Testar em todas as páginas
- [ ] Validar performance

#### 8. Documentação 🚧
- [ ] Atualizar README com instruções de tema
- [ ] Documentar variáveis CSS
- [ ] Registrar decisões de design no chat-context.md

### 📋 Próximas Sprints Planejadas
- Sprint v1.3.0: Melhorias de UX/UI
- Sprint v1.4.0: Funcionalidades avançadas
- Sprint v2.0.0: Release principal

### 🎯 Objetivos do Sprint Dark Mode
- Sistema de tema completo e consistente
- Transições suaves entre temas
- Persistência de preferência do usuário
- Acessibilidade e contraste adequados
- Performance otimizada

### 🚀 Progresso Atual
**Status:** Base implementada - Toggle funcionando
**Próximo:** Adaptar componentes UI para dark mode 