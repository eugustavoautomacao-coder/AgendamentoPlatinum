# 🔴 O que significa "Unrestricted" no Supabase?

## ⚠️ **DEFINIÇÃO CRÍTICA**

**"Unrestricted"** significa que a tabela **NÃO TEM Row Level Security (RLS) habilitado** ou **não tem políticas RLS configuradas**.

### 🚨 **O QUE ISSO SIGNIFICA:**

1. **Qualquer pessoa** com a chave anon do Supabase pode:
   - ✅ Ler TODOS os dados da tabela
   - ✅ Modificar TODOS os dados da tabela
   - ✅ Deletar TODOS os dados da tabela
   - ✅ Inserir dados sem validação

2. **Dados expostos:**
   - 📧 Emails de clientes
   - 🔐 Senhas (se não estiverem hasheadas)
   - 📞 Telefones
   - 💰 Informações financeiras (comissões, preços)
   - 📅 Agendamentos de todos os salões
   - 👤 Dados pessoais

3. **Risco de segurança:**
   - 🔴 **CRÍTICO** - Violação de privacidade
   - 🔴 **CRÍTICO** - Violação de LGPD/GDPR
   - 🔴 **CRÍTICO** - Acesso não autorizado a dados
   - 🔴 **CRÍTICO** - Possível vazamento de dados

---

## ✅ **SOLUÇÃO: Habilitar RLS**

### **Passo 1: Habilitar RLS nas Tabelas**

Execute a migration:
```sql
-- Arquivo: supabase/migrations/20250125000001-enable-rls-all-tables.sql
```

Isso habilita RLS em todas as tabelas, mas **ATENÇÃO**: Após habilitar RLS sem políticas, **NENHUM acesso será permitido** (nem mesmo para usuários autenticados).

### **Passo 2: Criar Políticas RLS**

Após habilitar RLS, você DEVE criar políticas para cada tabela. Exemplo:

```sql
-- Exemplo: Política para tabela clientes
CREATE POLICY "Users can view clients in their salon" 
ON public.clientes
FOR SELECT 
TO authenticated
USING (
  salao_id = (SELECT salao_id FROM public.users WHERE id = auth.uid())
);
```

---

## 📋 **STATUS ATUAL DAS TABELAS**

Com base na imagem que você compartilhou, estas tabelas estão **"Unrestricted"**:

- ❌ `appointment_photos` - **SEM RLS**
- ❌ `appointment_requests` - **SEM RLS**
- ❌ `appointments` - **SEM RLS**
- ❌ `blocked_slots` - **SEM RLS**
- ❌ `categorias` - **SEM RLS**
- ❌ `clientes` - **SEM RLS** (migration criada, mas não aplicada)
- ❌ `comissoes` - **SEM RLS**
- ❌ `comissoes_agendamentos_detalhes` - **SEM RLS**
- ❌ `comissoes_historico` - **SEM RLS**
- ❌ `comissoes_mensais` - **SEM RLS**
- ❌ `employees` - **SEM RLS**
- ❌ `pagamentos_comissoes` - **SEM RLS**
- ❌ `produtos` - **SEM RLS**
- ❌ `saloes` - **SEM RLS**
- ❌ `services` - **SEM RLS**
- ❌ `users` - **SEM RLS** (migration existe, mas pode não estar aplicada)

---

## 🚀 **AÇÃO IMEDIATA NECESSÁRIA**

### **1. Aplicar Migration de RLS**

Execute no Supabase SQL Editor:
```sql
-- Arquivo: supabase/migrations/20250125000001-enable-rls-all-tables.sql
```

### **2. Criar Políticas RLS**

Após habilitar RLS, você precisa criar políticas para cada tabela. Já criamos a migration para `clientes`:
- ✅ `supabase/migrations/20250125000000-fix-clientes-rls-security.sql`

### **3. Testar**

Após aplicar as migrations:
- ✅ Tentar acessar dados de outro salão (deve falhar)
- ✅ Validar que apenas dados do próprio salão são acessíveis
- ✅ Verificar que o status muda de "Unrestricted" para "Restricted" no dashboard

---

## 📝 **NOTAS IMPORTANTES**

1. **RLS é obrigatório** para aplicações multitenancy
2. **Sem RLS**, todos os dados estão expostos publicamente
3. **Habilitar RLS sem políticas** bloqueia TODOS os acessos
4. **Políticas devem ser criadas** imediatamente após habilitar RLS
5. **Teste sempre** após criar políticas

---

## 🔗 **PRÓXIMOS PASSOS**

1. ✅ Migration para habilitar RLS criada
2. ⏳ Aplicar migration no Supabase
3. ⏳ Criar políticas RLS para todas as tabelas
4. ⏳ Testar segurança
5. ⏳ Atualizar relatório de segurança


