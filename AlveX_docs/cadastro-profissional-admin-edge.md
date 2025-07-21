# Cadastro de Profissional pelo Admin via Edge Function (Supabase)

## Visão Geral
Este documento descreve o fluxo seguro e funcional para cadastro de profissionais pelo painel do admin, usando uma função Edge no Supabase. Serve como referência para futuras implementações de cadastro de usuários via backend seguro.

---

## 1. Requisitos
- Projeto Supabase configurado (Cloud)
- Tabelas: `profiles`, `professionals`, `salons` (ver documentação de schema)
- Função Edge publicada no Supabase Cloud
- Frontend (React/Vite) com autenticação via Supabase

---

## 2. Função Edge (create-professional)
- **Importação:**
  - Use o ESM do supabase-js: `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';`
- **CORS:**
  - Responda ao método OPTIONS com headers:
    ```js
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
    };
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }
    ```
  - Todos os retornos (inclusive erros) devem incluir esses headers.
- **Autenticação:**
  - Exija o header `Authorization: Bearer <token>`
  - Valide se o usuário é `admin` ou `superadmin` no banco (`profiles`)
- **Criação:**
  - Gere senha aleatória para o profissional
  - Use a service key para criar o usuário via `auth.admin.createUser`
  - Atualize o perfil e insira em `professionals` (aguarde o profile existir)
  - Faça rollback em caso de erro

---

## 3. Frontend (React/Vite)
- **Chamada da função:**
  - Use a variável de ambiente `VITE_SUPABASE_FUNCTIONS_URL` apontando para o endpoint cloud:
    ```env
    VITE_SUPABASE_FUNCTIONS_URL=https://<project-ref>.functions.supabase.co
    ```
  - No fetch, envie o token JWT do usuário logado:
    ```js
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${baseUrl}/create-professional`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ ... })
    });
    ```
- **Feedback:**
  - Trate erros de autenticação, CORS e resposta da função Edge
  - Exiba toasts para sucesso/erro

---

## 4. Dicas e Cuidados
- Sempre reinicie o Vite após alterar o `.env`
- Nunca exponha a service key no frontend
- Teste o endpoint da função Edge manualmente para garantir deploy
- Garanta que o admin/superadmin está autenticado ao chamar a função
- Mantenha o schema das tabelas atualizado conforme o fluxo

---

## 5. Resumo do fluxo
1. Admin logado preenche o formulário
2. Frontend envia POST para função Edge com token JWT
3. Função Edge valida permissão, cria usuário, atualiza perfil e insere em professionals
4. Frontend atualiza a lista e exibe feedback

---

*Este documento deve ser revisado e atualizado sempre que houver mudanças no fluxo de cadastro ou autenticação de profissionais.* 