# Otimizações e Deploy — Projeto AlveX

## Checklist de Otimizações

- [ ] **Lazy loading** para páginas grandes (React.lazy/Suspense)
- [ ] **React Query/SWR** para cache e revalidação de dados do Supabase
- [ ] **Purge do Tailwind** ativo para remover CSS não utilizado
- [ ] **Imagens otimizadas** (WebP, SVG, compressão)
- [ ] **Skeletons/loaders** em todas as telas com carregamento de dados
- [ ] **Paginação/limite** nas queries do Supabase
- [ ] **Revisão de policies (RLS)** no Supabase para segurança
- [ ] **Testes de responsividade** em dispositivos reais e Lighthouse
- [ ] **Acessibilidade**: aria-label, roles, navegação por teclado
- [ ] **Lint/Prettier** sempre ativos
- [ ] **Testes unitários** para hooks e componentes críticos
- [ ] **SEO/PWA** se o sistema for público

---

## Orientações de Deploy

### 1. **Frontend (Vite/React)**
- Deploy recomendado: **Vercel** ou **Netlify**
- Integração automática com GitHub
- Configurar variáveis de ambiente:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Build: `vite build`  
  Output: `dist`
- CDN global, SSL automático, preview de PRs

### 2. **Backend**
- Se usar apenas Supabase (auth, banco, storage, edge functions): **não precisa backend próprio**
- Se tiver backend customizado (Node.js, FastAPI): deploy em **Railway**, **Render**, **Fly.io** ou similar
- Configurar variáveis de ambiente e apontar frontend para a URL do backend

### 3. **Supabase**
- Já está em produção na nuvem
- Gerencie banco, autenticação, storage e funções pelo painel
- Atenção às policies de segurança (RLS)

### 4. **Fluxo Resumido**
```mermaid
flowchart TD
    A[Usuário] -->|Acessa| B(Frontend Vercel/Netlify)
    B -->|Chama| C[Supabase (API, Auth, Storage, DB)]
    B -->|Opcional| D(Backend customizado - Railway/Render)
    D -->|Chama| C
```

---

## Dicas Finais
- Use sempre as chaves públicas do Supabase no frontend
- Teste o sistema em produção (login, cadastro, uploads)
- Monitore performance e uso do banco
- Escale planos conforme o crescimento do sistema

---

*Este documento deve ser revisado a cada sprint ou release importante.* 