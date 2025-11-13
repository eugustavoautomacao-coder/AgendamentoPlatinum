# Templates de Email do Supabase

Este diretório contém os templates customizados de email para o sistema AlveX.

## 📧 Template de Reset de Senha

### Arquivos:
- `password-reset.html` - Template HTML completo
- `config.json` - Configuração das variáveis

### Variáveis Disponíveis do Supabase:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{.Email}}` | Email do usuário | `usuario@email.com` |
| `{{.ConfirmationURL}}` | URL completa de confirmação | `http://localhost:8080/reset-password?access_token=...` |
| `{{.Token}}` | Token de acesso | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `{{.TokenHash}}` | Hash do token | `a1b2c3d4e5f6...` |
| `{{.SiteURL}}` | URL base do site | `http://localhost:8080` |
| `{{.RedirectTo}}` | URL de redirecionamento | `http://localhost:8080/reset-password` |
| `{{.Data}}` | Dados adicionais | `2025-09-02T14:30:00Z` |

## 🔧 Como Configurar no Supabase Cloud:

### 1. Acesse o Painel do Supabase:
1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto

### 2. Configure o Template de Reset de Senha:
1. Vá em **Authentication** → **Email Templates**
2. Selecione **Reset Password**
3. Cole o conteúdo do arquivo `password-reset.html`
4. Configure o **Subject**: `Redefinir Senha - AlveX`

### 3. Configurações de URL:
1. Em **Authentication** → **URL Configuration**
2. **Site URL**: `http://localhost:8080`
3. **Redirect URLs**: 
   - `http://localhost:8080/reset-password`
   - `http://127.0.0.1:8080/reset-password`

## 🎨 Características do Template:

- ✅ **Design responsivo** (mobile-first)
- ✅ **Gradiente rosa** do sistema AlveX
- ✅ **Instruções passo a passo** claras
- ✅ **Avisos de segurança** importantes
- ✅ **Link alternativo** para problemas
- ✅ **Compatibilidade** com clientes de email
- ✅ **CSS inline** para máxima compatibilidade

## 📱 Preview:

O template inclui:
- Header com logo AlveX e gradiente rosa
- Ícone de cadeado (🔐) centralizado
- Informações do usuário (email, site)
- Passos numerados para redefinição
- Botão CTA com link de confirmação
- Avisos de segurança
- Footer com informações do sistema

## 🔄 Atualizações:

Para atualizar o template:
1. Modifique o arquivo `password-reset.html`
2. Cole o novo conteúdo no painel do Supabase
3. Teste o envio de email

## 🧪 Teste:

Para testar o template:
1. Configure as URLs no Supabase
2. Acesse a tela de login
3. Clique em "Esqueci minha senha"
4. Digite um email válido
5. Verifique o email recebido
6. Teste o link de reset
