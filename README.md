# 💈 Platinum Rocket - Sistema de Gestão para Salões de Beleza

Sistema completo de gestão para salões de beleza desenvolvido com React, TypeScript, Supabase e Tailwind CSS.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Módulos do Sistema](#módulos-do-sistema)
- [API e Integrações](#api-e-integrações)
- [Segurança](#segurança)

## 🎯 Sobre o Projeto

O Platinum Rocket é um sistema de gestão completo para salões de beleza, permitindo o gerenciamento de:

- **Agendamentos** - Criação, edição e acompanhamento de agendamentos
- **Clientes** - Cadastro e histórico de atendimentos
- **Profissionais** - Gestão de funcionários e suas agendas
- **Serviços** - Catálogo de serviços oferecidos
- **Comissões** - Cálculo automático de comissões por profissional
- **Relatórios** - Análises de faturamento, agendamentos e performance
- **Produtos** - Controle de estoque e vendas

## ✨ Funcionalidades

### 👤 Perfis de Usuário

| Perfil | Descrição |
|--------|-----------|
| **Super Admin** | Gestão de múltiplos salões e configurações globais |
| **Admin** | Gestão completa do salão (agendamentos, funcionários, relatórios) |
| **Profissional** | Visualização da própria agenda e comissões |
| **Cliente** | Agendamento online e histórico de atendimentos |

### 📅 Sistema de Agendamentos

- Agenda visual drag-and-drop
- Múltiplas visualizações (dia, semana, mês)
- Bloqueio de horários
- Confirmação automática
- Notificações por email

### 💰 Sistema de Comissões

- Cálculo automático baseado em percentual
- Relatório mensal por profissional
- Controle de pagamentos
- Histórico detalhado

### 📊 Relatórios

- Faturamento diário/mensal
- Performance por profissional
- Serviços mais realizados
- Exportação em PDF e Excel

### 🌐 Agendamento Público

- Página pública para clientes agendarem
- Seleção de serviço e profissional
- Verificação de horários disponíveis
- Confirmação por email

## 🛠️ Tecnologias

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Shadcn/ui** - Componentes UI
- **React Query** - Gerenciamento de estado servidor
- **React Router** - Roteamento
- **React Hook Form** - Formulários
- **Recharts** - Gráficos
- **date-fns** - Manipulação de datas

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL (banco de dados)
  - Row Level Security (segurança)
  - Edge Functions (lógica servidor)
  - Autenticação
  - Storage (arquivos)

### Bibliotecas Adicionais
- **jsPDF** - Geração de PDFs
- **xlsx** - Exportação Excel
- **Zod** - Validação de schemas
- **Sonner** - Notificações toast

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │  Pages  │  │  Hooks  │  │  Utils  │  │   Components    │ │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘ │
│       │            │            │                 │          │
│       └────────────┴────────────┴─────────────────┘          │
│                            │                                  │
└────────────────────────────┼──────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Supabase JS   │
                    │     Client      │
                    └────────┬────────┘
                             │
┌────────────────────────────┼──────────────────────────────────┐
│                      Supabase Backend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐│
│  │  PostgreSQL  │  │Edge Functions│  │   Authentication     ││
│  │     + RLS    │  │              │  │                      ││
│  └──────────────┘  └──────────────┘  └──────────────────────┘│
└───────────────────────────────────────────────────────────────┘
```


## 📁 Estrutura do Projeto

```
src/
├── components/           # Componentes reutilizáveis
│   ├── layout/          # Layouts (Admin, Profissional, etc)
│   ├── ui/              # Componentes UI (Shadcn)
│   └── auth/            # Componentes de autenticação
├── hooks/               # Custom hooks
│   ├── useAuth.tsx      # Autenticação
│   ├── useAppointments.tsx
│   ├── useClients.tsx
│   └── ...
├── pages/               # Páginas da aplicação
│   ├── admin/           # Páginas do admin
│   ├── profissional/    # Páginas do profissional
│   ├── superadmin/      # Páginas do super admin
│   └── ...
├── utils/               # Funções utilitárias
│   ├── commissionUtils.ts
│   ├── exportUtils.ts
│   └── dateUtils.ts
├── integrations/        # Integrações externas
│   └── supabase/
└── styles/              # Estilos globais
```

## 📦 Módulos do Sistema

### 1. Autenticação (`useAuth`)
- Login com email/senha
- Recuperação de senha
- Controle de sessão
- Perfis de usuário

### 2. Agendamentos (`useAppointments`)
- CRUD de agendamentos
- Validação de conflitos
- Notificações automáticas

### 3. Comissões (`commissionUtils`)
- Cálculo automático mensal
- Baseado em agendamentos concluídos
- Relatório detalhado por profissional

### 4. Relatórios (`exportUtils`)
- Exportação PDF com formatação
- Exportação Excel
- Filtros por período

## 🔒 Segurança

### Row Level Security (RLS)

O sistema utiliza RLS do PostgreSQL para garantir que:

- Usuários só acessam dados do seu salão
- Clientes só veem seus próprios agendamentos
- Profissionais só veem sua própria agenda
- Admins têm acesso total ao seu salão

### Políticas Implementadas

- `clientes` - Acesso por salão
- `appointments` - Acesso por salão/cliente/profissional
- `employees` - Acesso por salão
- `services` - Acesso público para leitura, escrita por admin
- `comissoes_mensais` - Acesso por salão

## 📱 Responsividade

O sistema é totalmente responsivo, adaptando-se a:

- 📱 Mobile (320px - 768px)
- 💻 Tablet (768px - 1024px)
- 🖥️ Desktop (1024px+)

## 🧪 Testes Recomendados

### Fluxos Críticos

1. **Agendamento Público**
   - Selecionar serviço → profissional → data → horário → confirmar

2. **Criação de Agendamento (Admin)**
   - Criar agendamento → editar → concluir → verificar comissão

3. **Sistema de Comissões**
   - Configurar % → criar agendamento → concluir → atualizar comissões

4. **Exportação de Relatórios**
   - Filtrar período → exportar PDF/Excel

## 👥 Equipe

- **Desenvolvedor**: Luís Guilherme Hisse Rampaso
- **Instituição**: UGB - Universidade Geraldo DiBiase

## 📄 Licença

Este projeto foi desenvolvido como Trabalho de Conclusão de Curso (TCC).

---

**Versão**: 1.0.0  
**Última atualização**: Novembro 2025

