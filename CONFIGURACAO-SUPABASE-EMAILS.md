# 🔧 Configuração do Supabase para Emails de Recuperação

## **Problema Atual**
O link do email está redirecionando para `http://localhost:8080/redefinir-senha` mas sem os parâmetros necessários, causando "Acesso Negado".

## **Solução: Configurar URLs no Supabase Dashboard**

### **1. Acesse o Supabase Dashboard**
- Vá para: https://supabase.com/dashboard
- Selecione seu projeto
- Navegue para: **Authentication** → **URL Configuration**

### **2. Configure as URLs**

#### **Site URL:**
```
http://localhost:8080
```

#### **Redirect URLs (adicione TODAS estas):**
```
http://localhost:8080/redefinir-senha
http://localhost:8080/**
http://localhost:8080
http://127.0.0.1:8080/redefinir-senha
http://127.0.0.1:8080/**
http://127.0.0.1:8080
```

### **3. Verificar Configurações de Email**

#### **Authentication → Settings:**
- ✅ **Enable email confirmations**: Habilitado
- ✅ **Enable email change confirmations**: Habilitado  
- ✅ **Enable password recovery**: Habilitado

#### **Authentication → Email Templates:**
- ✅ **Reset Password**: Configurado com template personalizado
- ✅ Cole o conteúdo de `supabase/templates/password-reset.html`

### **4. Testar a Configuração**

#### **Após configurar as URLs:**
1. **Solicite novo email** de recuperação
2. **Verifique se o link** contém os parâmetros corretos
3. **Teste o redirecionamento** para a página de redefinição

#### **Link esperado após configuração:**
```
https://lbpqmdcmoybuuthzezmj.supabase.co/auth/v1/verify?token=...&type=recovery&redirect_to=http://localhost:8080/redefinir-senha
```

#### **URL de destino esperada:**
```
http://localhost:8080/redefinir-senha#access_token=...&refresh_token=...&type=recovery
```

### **5. Troubleshooting**

#### **Se ainda não funcionar:**

1. **Verificar logs do Supabase:**
   - Authentication → Logs
   - Procurar por erros relacionados ao redirecionamento

2. **Testar com URL diferente:**
   - Tente `http://127.0.0.1:8080` em vez de `localhost`

3. **Verificar se o servidor está rodando:**
   - Confirme que `http://localhost:8080` está acessível

4. **Limpar cache do navegador:**
   - Use o botão "Limpar Cache" na página de erro

### **6. Configuração para Produção**

#### **Quando for para produção, altere para:**
```
Site URL: https://seudominio.com
Redirect URLs: 
- https://seudominio.com/redefinir-senha
- https://seudominio.com/**
```

### **7. Verificação Final**

#### **Checklist:**
- [ ] Site URL configurado corretamente
- [ ] Redirect URLs adicionadas
- [ ] Password recovery habilitado
- [ ] Template de email configurado
- [ ] Servidor local rodando na porta 8080
- [ ] Teste de envio de email funcionando

### **8. Comandos de Teste**

#### **Para testar no console do navegador:**
```javascript
// Verificar configurações
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('URL atual:', window.location.origin);

// Testar envio de email
async function testEmail() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
  
  const email = prompt('Digite um email para testar:');
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/redefinir-senha`
  });
  
  console.log('Resultado:', { data, error });
}

testEmail();
```

## **Resultado Esperado**

Após configurar corretamente:
- ✅ Email enviado com sucesso
- ✅ Link contém parâmetros corretos
- ✅ Redirecionamento funciona
- ✅ Página de redefinição carrega
- ✅ Usuário pode alterar senha
- ✅ Redirecionamento para login após sucesso


