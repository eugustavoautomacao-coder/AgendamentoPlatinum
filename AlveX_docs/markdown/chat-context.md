# Chat Context - AlveX

## Sprint Atual: Dark Mode System (v1.2.0)

### 🎯 Decisão de Implementar Dark Mode
**Data:** Janeiro 2025
**Motivação:** Melhorar a experiência do usuário, reduzir fadiga visual e seguir tendências modernas de UI/UX.

### 🏗️ Arquitetura Técnica Decidida

#### 1. Context API + Hook Personalizado
- **ThemeProvider**: Contexto global para gerenciar estado do tema
- **useTheme**: Hook customizado para acessar e modificar tema
- **Persistência**: localStorage para manter preferência do usuário

#### 2. Tailwind CSS + CSS Variables
- **Configuração**: Variáveis CSS para cores de tema
- **Classes**: dark: para modo escuro
- **Transições**: Suaves entre temas
- **Performance**: Sem JavaScript adicional para cores

#### 3. Estratégia de Implementação
- **Top-down**: Começar pelos layouts principais
- **Componentes**: Adaptar todos os componentes UI
- **Páginas**: Implementar em todas as páginas
- **Testes**: Validação completa antes do deploy

### 🎨 Decisões de Design

#### Cores e Contraste
- **Modo Claro**: Manter cores atuais como base
- **Modo Escuro**: Fundo escuro (#0f0f0f), texto claro
- **Contraste**: Seguir WCAG 2.1 AA
- **Acessibilidade**: Cores com contraste adequado

#### Elementos Específicos
- **Sidebars**: Fundo escuro, bordas sutis
- **Cards**: Fundo escuro, sombras suaves
- **Botões**: Manter hierarquia visual
- **Formulários**: Inputs com fundo escuro
- **Tabelas**: Linhas alternadas sutis

### 🔧 Decisões Técnicas

#### Performance
- **CSS Variables**: Para transições suaves
- **Lazy Loading**: Tema aplicado no carregamento inicial
- **Bundle Size**: Minimizar impacto no tamanho

#### Compatibilidade
- **Browser Support**: Modern browsers (ES2020+)
- **Mobile**: Responsividade mantida
- **Acessibilidade**: Screen readers compatíveis

#### Persistência
- **localStorage**: Para preferência do usuário
- **Fallback**: Tema claro como padrão
- **Sincronização**: Entre abas do navegador

### 📋 Próximos Passos
1. Criar ThemeProvider e useTheme hook
2. Configurar Tailwind com variáveis de tema
3. Implementar toggle de tema no layout
4. Adaptar componentes principais
5. Testar em todas as páginas
6. Validar acessibilidade e performance

---

## Contexto Anterior

### Decisões de Arquitetura
- **Frontend**: React + Vite + TypeScript
- **UI**: Shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **Estado**: Context API + Hooks customizados

### Padrões Estabelecidos
- **Commits**: Inglês técnico, semântico
- **Documentação**: Incremental e detalhada
- **UX**: Mobile-first, responsivo
- **Performance**: Otimização contínua

### Estrutura de Sidebars
- **AdminSidebar**: Responsiva, colapsável
- **ProfissionalSidebar**: Padrão igual ao Admin
- **SuperAdminSidebar**: Usando shadcn/ui sidebar
- **Botão de Sair**: Padronizado em todas

### Sistema de Autenticação
- **Roles**: SuperAdmin, Admin, Profissional, Cliente
- **Proteção**: Rotas por role
- **Perfil**: Edição com upload de avatar
- **Contexto**: useAuth global

### Gestão de Usuários
- **CRUD**: Completo para SuperAdmin
- **Filtros**: Por role e salão
- **Busca**: Instantânea e local
- **Feedback**: Toasts consistentes 