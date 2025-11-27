# ⚙️ Guia de Configuração

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# ============================================
# CONFIGURAÇÕES DO SUPABASE (Obrigatório)
# ============================================
# Obtidas em: https://supabase.com/dashboard/project/[seu-projeto]/settings/api

VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui

# ============================================
# CONFIGURAÇÕES DE EMAIL (Opcional)
# ============================================
# Para envio de notificações por email
# Use uma "App Password" do Gmail ou outro provedor

EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
```

## Configuração do Supabase

### 1. Criar Projeto

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e a chave anônima (Settings → API)

### 2. Executar Migrations

As migrations estão em `supabase/migrations/`. Execute na ordem:

1. Tabelas base (saloes, users, employees, services, appointments, etc.)
2. RLS policies (arquivos com `-rls-` no nome)
3. Foreign keys (arquivos com `-cascade` no nome)

### 3. Deploy das Edge Functions

```bash
# Instalar CLI do Supabase
npm install -g supabase

# Login
supabase login

# Deploy das functions
supabase functions deploy create-client
supabase functions deploy create-professional
supabase functions deploy send-email
# ... outras functions em supabase/functions/
```

### 4. Configurar Autenticação

No painel do Supabase:

1. Authentication → Settings
2. Configure "Site URL" para sua URL de produção
3. Configure "Redirect URLs" permitidas

## Configuração de Email

### Gmail

1. Ative a verificação em duas etapas
2. Gere uma "Senha de App" em [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use essa senha no `EMAIL_PASS`

### Outros Provedores

Configure as credenciais SMTP do seu provedor de preferência.

## Primeiro Acesso

### Criar Super Admin

Execute no SQL Editor do Supabase:

```sql
-- Criar usuário super admin
INSERT INTO public.users (email, nome, tipo, senha)
VALUES ('admin@seudominio.com', 'Super Admin', 'system_admin', 'senha-temporaria');
```

Ou use a Edge Function `create-superadmin`.

### Criar Salão e Admin

1. Acesse o sistema como Super Admin
2. Vá em "Gestão de Salões"
3. Crie um novo salão
4. O admin do salão será criado automaticamente

## Troubleshooting

### Erro de CORS

Verifique se a URL do frontend está nas configurações de CORS do Supabase.

### Erro de RLS

Verifique se as políticas RLS estão corretamente configuradas para cada tabela.

### Erro de Autenticação

1. Limpe o localStorage do navegador
2. Verifique se as chaves do Supabase estão corretas
3. Verifique se o usuário existe no banco

---

Para mais informações, consulte o [README.md](../README.md).

