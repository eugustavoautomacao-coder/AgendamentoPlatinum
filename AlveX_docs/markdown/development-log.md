# Log de Desenvolvimento - AlveX

## 📝 Registro de Mudanças

### 2025-07-11 - v1.1.0 - Setup Inicial

#### 🔧 **Configuração de Dependências**
**Arquivo:** `package.json`  
**Mudança:** Downgrade date-fns de v4.1.0 para v3.6.0  
**Motivo:** Conflito com react-day-picker@8.10.1  
**Status:** ✅ Resolvido

```json
// Antes
"date-fns": "^4.1.0"

// Depois  
"date-fns": "^3.6.0"
```

#### 📁 **Sistema de Documentação**
**Arquivos Criados:**
- `changelog.md` - Registro detalhado de mudanças
- `technical-notes.md` - Notas técnicas e arquiteturais
- `development-log.md` - Log específico de desenvolvimento

**Estrutura Implementada:**
```
AlveX_docs/markdown/
├── changelog.md          # Histórico de versões
├── technical-notes.md    # Documentação técnica
├── development-log.md    # Log de desenvolvimento
├── chat-context.md       # Contexto do chat
├── atualizacoes.md       # Atualizações por sprint
└── checklist.md          # Checklist de tarefas
```

#### 🔐 **Decisão sobre Autenticação**
**Data:** 11/07/2025  
**Decisão:** Manter sistema de autenticação básico atual  
**Motivo:** Login e roles já funcionando conforme esperado  
**Status:** ✅ Confirmado

**Funcionalidades que funcionam:**
- ✅ Login com email/senha
- ✅ Redirecionamento por role (superadmin/admin)
- ✅ Proteção de rotas
- ✅ Contexto de autenticação

**Funcionalidades adiadas:**
- 🔄 Recuperação de senha (para versão futura)
- 🔄 Confirmação de email (para versão futura)

#### 🎯 **Próximas Implementações Planejadas**

##### Sprint 1.1 - Autenticação e Isolamento
- [x] **Sistema de login** - ✅ Funcionando conforme esperado
- [ ] **Middleware de tenant** - Isolamento automático
- [ ] **Logs contextuais** - Sistema de logging
- [ ] **Validação de permissões** - Por role e tenant

##### Sprint 1.2 - Gestão de Salões
- [ ] **CRUD de salões** - Interface SuperAdmin
- [ ] **Provisionamento** - Criação de admin inicial
- [ ] **Configurações** - Dados do salão

##### Sprint 1.3 - Usuários e Permissões
- [ ] **Gestão de profissionais** - CRUD completo
- [ ] **Auto-cadastro de clientes** - Link público
- [ ] **Perfis e avatares** - Upload de imagens

---

## 🔄 Processo de Documentação

### Para Cada Mudança:
1. **Registrar no development-log.md**
   - Data e hora
   - Arquivos modificados
   - Motivo da mudança
   - Código antes/depois (se relevante)

2. **Atualizar changelog.md**
   - Adicionar à versão atual
   - Marcar como concluído
   - Atualizar status

3. **Documentar decisões técnicas**
   - Adicionar ao technical-notes.md
   - Explicar escolhas arquiteturais
   - Registrar trade-offs

### Convenções de Nomenclatura:
- **Arquivos:** kebab-case (ex: `development-log.md`)
- **Commits:** Conventional Commits (ex: `feat: add password recovery`)
- **Versões:** Semantic Versioning (ex: `v1.1.0`)

### Tags de Status:
- ✅ **Concluído**
- 🟡 **Em Desenvolvimento**
- 🔴 **Bloqueado**
- 📝 **Documentação**
- 🐛 **Bug Fix**
- ✨ **Nova Funcionalidade**
- 🔧 **Configuração**
- 📁 **Estrutura** 

### 2025-07-11 - v1.1.0 - Ajuste Visual Login

#### ✨ **Centralização do Texto na Imagem de Login**
**Arquivo:** `src/components/auth/AuthLayout.tsx`
**Mudança:** Texto 'Transforme seu Salão' e descrição centralizados verticalmente na imagem ao lado do formulário de login.
**Motivo:** Melhorar a estética e legibilidade do texto na tela de login, conforme solicitado pelo usuário.
**Status:** ✅ Concluído

```diff
- <div className="absolute inset-0 flex items-end p-8">
+ <div className="absolute inset-0 flex items-center p-8">
``` 