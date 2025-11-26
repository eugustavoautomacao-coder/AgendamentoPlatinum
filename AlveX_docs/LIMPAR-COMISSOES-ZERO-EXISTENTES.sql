-- 🧹 Limpeza de Comissões Mensais com 0%
-- Execute este script se quiser remover comissões já criadas com 0% de comissão

-- ============================================
-- PASSO 1: VERIFICAR QUANTAS EXISTEM
-- ============================================
SELECT 
  cm.id,
  cm.funcionario_id,
  e.nome AS funcionario_nome,
  cm.mes,
  cm.ano,
  cm.percentual_comissao,
  cm.valor_comissao_total,
  cm.total_agendamentos,
  cm.status
FROM comissoes_mensais cm
JOIN employees e ON e.id = cm.funcionario_id
WHERE cm.percentual_comissao = 0 OR cm.valor_comissao_total = 0
ORDER BY cm.ano DESC, cm.mes DESC;

-- ============================================
-- PASSO 2: DELETAR DETALHES DOS AGENDAMENTOS
-- ============================================
-- ATENÇÃO: Isso é irreversível!
-- DELETE FROM comissoes_agendamentos_detalhes 
-- WHERE comissao_mensal_id IN (
--   SELECT id FROM comissoes_mensais 
--   WHERE percentual_comissao = 0 OR valor_comissao_total = 0
-- );

-- ============================================
-- PASSO 3: DELETAR PAGAMENTOS (se existirem)
-- ============================================
-- ATENÇÃO: Isso é irreversível!
-- DELETE FROM pagamentos_comissoes 
-- WHERE comissao_mensal_id IN (
--   SELECT id FROM comissoes_mensais 
--   WHERE percentual_comissao = 0 OR valor_comissao_total = 0
-- );

-- ============================================
-- PASSO 4: DELETAR COMISSÕES MENSAIS
-- ============================================
-- ATENÇÃO: Isso é irreversível!
-- DELETE FROM comissoes_mensais 
-- WHERE percentual_comissao = 0 OR valor_comissao_total = 0;

-- ============================================
-- VERIFICAR SE FOI DELETADO
-- ============================================
-- SELECT COUNT(*) as total_comissoes_zero
-- FROM comissoes_mensais 
-- WHERE percentual_comissao = 0 OR valor_comissao_total = 0;
-- -- Deve retornar 0

-- ============================================
-- NOTA IMPORTANTE
-- ============================================
-- ⚠️ As linhas de DELETE estão comentadas para segurança
-- ⚠️ Remova os comentários (--) APENAS se tiver certeza
-- ⚠️ Execute o PASSO 1 primeiro para ver o que será deletado
-- ⚠️ Faça backup antes de executar!

-- ✅ Agora, com as correções aplicadas no código:
--    1. Novas comissões com 0% não serão mais criadas
--    2. Comissões com 0% não aparecem mais na tela


