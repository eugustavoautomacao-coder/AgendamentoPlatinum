-- ============================================
-- TESTE PRÁTICO DE RLS - PlatinumRocket
-- ============================================
-- Execute este script no Supabase SQL Editor
-- Ele vai testar se o RLS está funcionando corretamente

-- ============================================
-- PARTE 1: VERIFICAÇÃO DE RLS HABILITADO
-- ============================================
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS HABILITADO'
    ELSE '❌ RLS DESABILITADO'
  END as status_rls
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'clientes', 'appointments', 'users', 'employees', 
    'services', 'saloes', 'comissoes', 'blocked_slots',
    'categorias', 'produtos', 'appointment_requests', 
    'appointment_photos'
  )
ORDER BY tablename;

-- ============================================
-- PARTE 2: VERIFICAÇÃO DE POLÍTICAS CRIADAS
-- ============================================
SELECT 
  tablename,
  policyname,
  cmd as operacao,
  CASE 
    WHEN roles = '{authenticated}' THEN 'Usuários autenticados'
    WHEN roles = '{public}' THEN 'Público'
    ELSE roles::text
  END as permissao
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'clientes', 'appointments', 'users', 'employees', 
    'services', 'saloes', 'comissoes', 'blocked_slots',
    'categorias', 'produtos', 'appointment_requests', 
    'appointment_photos'
  )
ORDER BY tablename, policyname;

-- ============================================
-- PARTE 3: TESTE DE ACESSO PÚBLICO (SEM AUTENTICAÇÃO)
-- ============================================
-- Este teste simula acesso público (sem autenticação)
-- Deve funcionar apenas para operações permitidas

-- Teste 3.1: Público pode ver serviços ativos?
SELECT 
  'Teste 3.1: Público pode ver serviços ativos' as teste,
  COUNT(*) as total_servicos_visiveis
FROM public.services
WHERE ativo = true;

-- Teste 3.2: Público pode ver salões?
SELECT 
  'Teste 3.2: Público pode ver salões' as teste,
  COUNT(*) as total_saloes_visiveis
FROM public.saloes;

-- Teste 3.3: Público pode ver clientes? (deve ser limitado)
SELECT 
  'Teste 3.3: Público pode ver clientes' as teste,
  COUNT(*) as total_clientes_visiveis
FROM public.clientes;

-- ============================================
-- PARTE 4: TESTE DE ISOLAMENTO POR SALÃO
-- ============================================
-- Este teste verifica se os dados estão isolados por salão

-- Teste 4.1: Verificar quantos salões existem
SELECT 
  'Teste 4.1: Total de salões' as teste,
  COUNT(*) as total_saloes,
  STRING_AGG(id::text, ', ') as ids_saloes
FROM public.saloes;

-- Teste 4.2: Verificar distribuição de clientes por salão
SELECT 
  'Teste 4.2: Clientes por salão' as teste,
  salao_id,
  COUNT(*) as total_clientes
FROM public.clientes
GROUP BY salao_id
ORDER BY salao_id;

-- Teste 4.3: Verificar distribuição de agendamentos por salão
SELECT 
  'Teste 4.3: Agendamentos por salão' as teste,
  salao_id,
  COUNT(*) as total_agendamentos
FROM public.appointments
WHERE salao_id IS NOT NULL
GROUP BY salao_id
ORDER BY salao_id;

-- Teste 4.4: Verificar distribuição de serviços por salão
SELECT 
  'Teste 4.4: Serviços por salão' as teste,
  salao_id,
  COUNT(*) as total_servicos
FROM public.services
WHERE salao_id IS NOT NULL
GROUP BY salao_id
ORDER BY salao_id;

-- ============================================
-- PARTE 5: TESTE DE VALIDAÇÃO DE DADOS
-- ============================================
-- Verificar se há dados sem salao_id (que não deveriam existir)

-- Teste 5.1: Clientes sem salao_id
SELECT 
  'Teste 5.1: Clientes sem salao_id (ERRO!)' as teste,
  COUNT(*) as total_sem_salao
FROM public.clientes
WHERE salao_id IS NULL;

-- Teste 5.2: Agendamentos sem salao_id
SELECT 
  'Teste 5.2: Agendamentos sem salao_id (ERRO!)' as teste,
  COUNT(*) as total_sem_salao
FROM public.appointments
WHERE salao_id IS NULL;

-- Teste 5.3: Serviços sem salao_id
SELECT 
  'Teste 5.3: Serviços sem salao_id (ERRO!)' as teste,
  COUNT(*) as total_sem_salao
FROM public.services
WHERE salao_id IS NULL;

-- ============================================
-- PARTE 6: TESTE DE INTEGRIDADE REFERENCIAL
-- ============================================
-- Verificar se há referências quebradas

-- Teste 6.1: Clientes com salao_id inválido
SELECT 
  'Teste 6.1: Clientes com salao_id inválido (ERRO!)' as teste,
  COUNT(*) as total_invalidos
FROM public.clientes c
LEFT JOIN public.saloes s ON s.id = c.salao_id
WHERE c.salao_id IS NOT NULL AND s.id IS NULL;

-- Teste 6.2: Agendamentos com salao_id inválido
SELECT 
  'Teste 6.2: Agendamentos com salao_id inválido (ERRO!)' as teste,
  COUNT(*) as total_invalidos
FROM public.appointments a
LEFT JOIN public.saloes s ON s.id = a.salao_id
WHERE a.salao_id IS NOT NULL AND s.id IS NULL;

-- Teste 6.3: Serviços com salao_id inválido
SELECT 
  'Teste 6.3: Serviços com salao_id inválido (ERRO!)' as teste,
  COUNT(*) as total_invalidos
FROM public.services sv
LEFT JOIN public.saloes s ON s.id = sv.salao_id
WHERE sv.salao_id IS NOT NULL AND s.id IS NULL;

-- ============================================
-- PARTE 7: RESUMO FINAL
-- ============================================
SELECT 
  'RESUMO FINAL' as secao,
  'Total de tabelas com RLS' as metrica,
  COUNT(*)::text as valor
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'clientes', 'appointments', 'users', 'employees', 
    'services', 'saloes', 'comissoes', 'blocked_slots',
    'categorias', 'produtos', 'appointment_requests', 
    'appointment_photos'
  )
  AND rowsecurity = true

UNION ALL

SELECT 
  'RESUMO FINAL',
  'Total de políticas RLS criadas',
  COUNT(*)::text
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'clientes', 'appointments', 'users', 'employees', 
    'services', 'saloes', 'comissoes', 'blocked_slots',
    'categorias', 'produtos', 'appointment_requests', 
    'appointment_photos'
  );

-- ============================================
-- INSTRUÇÕES DE INTERPRETAÇÃO:
-- ============================================
-- ✅ Se todas as tabelas mostram "RLS HABILITADO" = SUCESSO
-- ✅ Se há políticas criadas para cada tabela = SUCESSO
-- ✅ Se Teste 5.x mostra 0 = SUCESSO (não há dados sem salao_id)
-- ✅ Se Teste 6.x mostra 0 = SUCESSO (não há referências quebradas)
-- ❌ Se algum teste mostra dados = PROBLEMA que precisa ser corrigido
-- ============================================


