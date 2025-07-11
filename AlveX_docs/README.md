## Lovable Instruction Block – MVP Sistema de Agendamento e Gestão para Salão de Beleza (Multitenant com Criação Centralizada)

**Objetivo:**  
Construir um MVP multitenant compartilhado para agendamento, gestão de serviços e relatórios operacionais de salões de beleza. Cada salão (tenant) é criado manualmente pelo dono da plataforma, que provisiona um usuário Administrador com login e senha.

---

### Localização

- **Arquivo/Componente:** Estrutura inicial modular em `/app`, com subpastas por domínio: `auth/`, `admin/`, `profissional/`, `cliente/`, `agenda/`, `relatorios/`
- **Não modificar:** Qualquer lógica futura como pagamentos, avaliações, notificações, etc.

---

### Especificações

#### GESTÃO MULTITENANT
- Cada salão representa um `tenant` com `salonId` único
- Apenas o **superadmin** da plataforma pode criar um novo salão e provisionar o admin inicial
- Os dados de cada tenant (clientes, serviços, agendamentos) devem estar **100% isolados**
- `auth.users` e todas as tabelas relacionadas devem ter campo obrigatório `tenantId` (ex: `salonId`)

#### Módulo 1 – Autenticação e Acesso
- Usuários (Admin, Profissional, Cliente) se autenticam via e-mail e senha
- Painel direcionado automaticamente conforme o perfil (`role`: `'admin' | 'profissional' | 'cliente'`)
- Recuperação de senha via e-mail

#### Módulo 2 – Cadastros
- **Cliente:**
  - Auto-cadastro (link público por salão)
  - Campos: `nome`, `email`, `telefone`
- **Profissional:**
  - Cadastrado apenas pelo Admin
  - Campos: `nome`, `foto`, `especialidades`, `horários semanais`
- **Serviços:**
  - Criados apenas pelo Admin
  - Campos: `nome`, `duração (min)`, `preço base`
  - Taxas configuráveis (% ou R$): `máquina`, `produto`, `impostos`

#### Módulo 3 – Agendamento e Agenda
- **Cliente:**
  - Seleciona serviço e profissional (opcional)
  - Visualiza agenda disponível e confirma agendamento
  - Acompanha agendamentos futuros e passados
- **Profissional:**
  - Visualiza apenas sua própria agenda
  - Ações: confirmar / sugerir novo horário

#### Módulo 4 – Relatórios (Admin)
- **Serviços Realizados:** filtrável por período
- **Financeiro:**
  - Receita Bruta = soma dos valores brutos dos serviços
  - Total de Taxas
  - Receita Líquida = Bruta - Taxas
- **Ranking de Serviços:** ordenado por volume

---

### Modelos de Dados (resumo)

```ts
User {
  id: string
  name: string
  email: string
  role: 'admin' | 'profissional' | 'cliente'
  tenantId: string
}

Service {
  id: string
  name: string
  duration: number
  basePrice: number
  taxes: { maquina: number, produto: number, impostos: number }
  tenantId: string
}

Appointment {
  id: string
  clientId: string
  professionalId: string
  serviceId: string
  startTime: Date
  endTime: Date
  status: 'pendente' | 'confirmado' | 'remarcado'
  tenantId: string
}


### 🔐 Restrições Críticas

- Nunca permitir acesso cruzado entre tenants (`cross-tenant access`)
- Toda query (SELECT/UPDATE/DELETE) **deve** incluir `tenantId`
- Testar todos os fluxos usando contas de salões diferentes
- Prefixar todos os logs relevantes com contexto, ex:  
  `console.log('[Auth/Admin]', ...)`
- Implementar estados de **loading** e **erro** em todas as operações críticas
- Manter os padrões visuais e reutilizar componentes existentes da base do projeto

---

### 📱 Responsividade

- Abordagem **Mobile-first**: priorizar testes em 375px
- Utilizar **breakpoints padrão do Tailwind**:
  - `sm` → 640px
  - `md` → 768px
  - `lg` → 1024px
  - `xl` → 1280px

---

### 🎨 Design

- Estilo: `clean`, `prático`, voltado para o setor de beleza
- Referências visuais: **Zenbeauty**, **Trinks**, **Treatwell**
- Aplicar:
  - Transições suaves (hover, interações)
  - Hierarquia visual clara e acessível
  - Layouts que favorecem usabilidade mesmo em telas pequenas

---

### ✅ Critérios de Sucesso

- [ ] Criação de salões controlada exclusivamente via **superadmin**
- [ ] Cada **Administrador** acessa e gerencia **apenas seu próprio salão**
- [ ] Dados de cada tenant **isolados e seguros**
- [ ] Regras de disponibilidade corretamente aplicadas nos agendamentos
- [ ] Interface clara e intuitiva para o **cliente final**
- [ ] Layout adaptado e funcional em dispositivos móveis
- [ ] **Zero vazamentos de dados ou permissões indevidas entre tenants**

