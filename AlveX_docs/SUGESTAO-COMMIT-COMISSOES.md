# 📋 Sugestão de Commit - Melhorias em Comissões

## Mensagem de Commit

```bash
feat: melhora sistema de comissões e exportação de relatórios

BREAKING CHANGES:
- Comissões com 0% não são mais criadas automaticamente
- Funcionários com 0% não aparecem em Comissões Mensais

FEATURES:
- Exportação PDF profissional com jspdf-autotable
- Logs detalhados para debug de comissões
- Validação para não criar comissões vazias
- Filtro de comissão > 0% na query e frontend
- Separação de INSERT/SELECT no RLS de appointment_requests

FIXES:
- Corrige erro "Invalid time value" na exportação PDF de Faturamento
- Corrige RLS recursivo na tabela users
- Corrige foreign key cascade em appointments
- Remove logs sensíveis (apenas em dev mode)

DOCS:
- Adiciona guia completo de recálculo de comissões
- Adiciona documentação de debug com logs
- Adiciona SQL para limpar comissões antigas com 0%
- Adiciona explicação de correções de RLS
```

## Arquivos Alterados

### Frontend
```
src/utils/exportUtils.ts              - Refatoração completa do exportToPDF
src/utils/commissionUtils.ts          - Validações e logs detalhados
src/pages/admin/ComissoesMensais.tsx  - Filtro de comissão > 0% e logs
src/pages/admin/relatorios/Faturamento.tsx - Correção de data no PDF
src/hooks/useAppointmentRequests.tsx  - Separação INSERT/SELECT para RLS
src/hooks/useAuth.tsx                  - Logs condicionados ao dev mode
```

### Documentação (AlveX_docs/)
```
MELHORIAS-EXPORTACAO-PDF.md
CORRECAO-ERRO-PDF-DATA-INVALIDA.md
CORRECAO-COMISSAO-ZERO-PORCENTO.md
COMO-RECALCULAR-COMISSOES.md
DEBUG-COMISSOES-LOGS.md
LIMPAR-COMISSOES-ZERO-EXISTENTES.sql
CORRECAO-FINAL-RLS.sql
SOLUCAO-ALTERNATIVA-CODIGO.md
CORRECAO-LOGS-SEGURANCA.md
VULNERABILIDADES-CORRIGIDAS-RLS.md
```

## Impacto

### Quebra Compatibilidade? NÃO
- Comissões antigas com 0% continuam no banco
- Apenas não aparecem mais na tela
- Novas comissões com 0% não serão criadas

### Requer Migração? NÃO
- Tudo funciona sem migração
- SQL de limpeza é opcional

### Requer Deploy? SIM
- Frontend precisa ser atualizado
- RLS precisa ser aplicado manualmente no Supabase

## Checklist Pré-Commit

- [x] Código formatado
- [x] Sem erros de lint
- [x] Logs de segurança removidos/condicionados
- [x] Documentação criada
- [x] Validações adicionadas
- [x] RLS documentado (mas não aplicado automaticamente)

## Pós-Commit

### 1. Deploy Frontend
```bash
git push origin main
# Vercel fará deploy automaticamente
```

### 2. Aplicar RLS Manualmente (IMPORTANTE!)
```sql
-- Execute no Supabase SQL Editor:
-- Arquivo: AlveX_docs/CORRECAO-FINAL-RLS.sql

-- Opção Recomendada (Mais Segura):
DROP POLICY IF EXISTS "Public can create appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Public can view appointment requests" ON public.appointment_requests;

CREATE POLICY "Public can create appointment requests" 
ON public.appointment_requests
FOR INSERT TO public WITH CHECK (salao_id IS NOT NULL);

CREATE POLICY "Public can view recent appointment requests" 
ON public.appointment_requests
FOR SELECT TO public
USING (criado_em > NOW() - INTERVAL '5 minutes');
```

### 3. Testar

- [ ] Exportação PDF funciona em todos os relatórios
- [ ] Comissões com 0% não aparecem
- [ ] Botão "Atualizar" exibe logs detalhados
- [ ] Agendamento público funciona
- [ ] RLS não bloqueia operações normais

## Notas

- Logs detalhados são temporários para debug
- Podem ser removidos/reduzidos após verificação
- RLS de `appointment_requests` é crítico para segurança


