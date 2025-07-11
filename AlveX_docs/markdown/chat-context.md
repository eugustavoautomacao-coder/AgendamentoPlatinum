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
1. **Autenticação:** Login, roles, recuperação de senha
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

---
*Este arquivo será atualizado continuamente com decisões e contexto do desenvolvimento.* 