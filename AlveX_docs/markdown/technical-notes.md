# Notas Técnicas - AlveX

## 🏗️ Arquitetura do Sistema

### Stack Tecnológica
- **Frontend:** React 18 + Vite + TypeScript
- **Backend:** Supabase (PostgreSQL + Auth + Real-time)
- **UI:** shadcn/ui + Tailwind CSS
- **Estado:** React Query (TanStack Query)
- **Roteamento:** React Router DOM v6

### Estrutura de Dados
```typescript
// Modelo principal de tenant
interface Salon {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

// Perfil de usuário com isolamento
interface Profile {
  id: string;
  salon_id: string | null; // null para superadmin
  name: string;
  role: 'superadmin' | 'admin' | 'profissional' | 'cliente';
  phone?: string;
  avatar_url?: string;
}
```

## 🔐 Segurança Multitenant

### Row Level Security (RLS)
- Todas as tabelas têm RLS habilitado
- Funções helper: `get_user_salon_id()` e `get_user_role()`
- Políticas específicas por role e tenant

### Isolamento de Dados
- Campo `salon_id` obrigatório em todas as tabelas
- Superadmin pode acessar todos os dados
- Usuários só acessam dados do seu salão

## 📱 Responsividade

### Breakpoints
- **Mobile-first:** 375px (base)
- **sm:** 640px
- **md:** 768px
- **lg:** 1024px
- **xl:** 1280px

### Design System
- **Cores:** Sistema de cores do Tailwind com variáveis CSS
- **Tipografia:** Inter como fonte principal
- **Espaçamentos:** Sistema de 4px (0.25rem)

## 🚀 Performance

### Otimizações Implementadas
- **Code Splitting:** Vite com lazy loading
- **Bundle Analysis:** Análise automática de tamanho
- **Caching:** React Query para cache de dados
- **Images:** Otimização automática com Vite

### Monitoramento
- **Logs:** Prefixos contextuais `[Auth/Admin]`
- **Errors:** Toast notifications para erros
- **Loading States:** Estados de carregamento em todas as operações

## 📂 Estrutura de Pastas

```
src/
├── components/          # Componentes reutilizáveis
│   ├── auth/           # Componentes de autenticação
│   ├── layout/         # Layouts e sidebars
│   └── ui/             # Componentes base (shadcn/ui)
├── hooks/              # Custom hooks
├── integrations/       # Integrações externas (Supabase)
├── pages/              # Páginas da aplicação
│   ├── admin/          # Páginas do admin
│   └── superadmin/     # Páginas do superadmin
└── lib/                # Utilitários e configurações
```

## 🔄 Fluxo de Desenvolvimento

### 1. Análise de Requisitos
- Documentar funcionalidade no changelog
- Definir estrutura de dados
- Planejar componentes necessários

### 2. Implementação
- Criar/atualizar componentes
- Implementar lógica de negócio
- Adicionar validações e tratamento de erros

### 3. Testes
- Testar isolamento multitenant
- Verificar responsividade
- Validar fluxos de usuário

### 4. Documentação
- Atualizar changelog
- Documentar decisões técnicas
- Registrar mudanças no chat-context

## ⚠️ Regras Críticas

### Segurança
- **NUNCA** permitir acesso cruzado entre tenants
- **SEMPRE** incluir `salon_id` em queries
- **SEMPRE** validar permissões por role

### Performance
- **SEMPRE** implementar loading states
- **SEMPRE** tratar erros graciosamente
- **SEMPRE** otimizar para mobile

### Código
- **SEMPRE** usar TypeScript strict mode
- **SEMPRE** documentar funções complexas
- **SEMPRE** seguir padrões estabelecidos 