-- Script FORÇADO para desabilitar RLS em appointment_requests
-- Este script resolve definitivamente o problema de RLS

-- 1. Verificar estado atual
SELECT '=== ESTADO ATUAL ===' as info;
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'appointment_requests';
SELECT 'Políticas existentes:' as info;
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'appointment_requests';

-- 2. Remover TODAS as políticas possíveis (incluindo as que podem ter nomes diferentes)
DROP POLICY IF EXISTS "Salões podem gerenciar suas solicitações de agendamento" ON appointment_requests;
DROP POLICY IF EXISTS "Público pode criar solicitações de agendamento" ON appointment_requests;
DROP POLICY IF EXISTS "Público pode ler solicitações para validação" ON appointment_requests;
DROP POLICY IF EXISTS "allow_public_insert" ON appointment_requests;
DROP POLICY IF EXISTS "allow_salon_read" ON appointment_requests;
DROP POLICY IF EXISTS "allow_salon_update" ON appointment_requests;
DROP POLICY IF EXISTS "allow_salon_delete" ON appointment_requests;
DROP POLICY IF EXISTS "public_insert" ON appointment_requests;
DROP POLICY IF EXISTS "salon_read" ON appointment_requests;
DROP POLICY IF EXISTS "salon_update" ON appointment_requests;
DROP POLICY IF EXISTS "salon_delete" ON appointment_requests;

-- 3. Desabilitar RLS FORÇADAMENTE
ALTER TABLE appointment_requests DISABLE ROW LEVEL SECURITY;

-- 4. Verificar se RLS foi desabilitado
SELECT '=== APÓS DESABILITAR RLS ===' as info;
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'appointment_requests';

-- 5. Verificar se não há políticas restantes
SELECT 'Políticas restantes:' as info;
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'appointment_requests';

-- 6. Comentário explicativo
COMMENT ON TABLE appointment_requests IS 'Solicitações de agendamento - RLS FORÇADAMENTE desabilitado para permitir inserção pública';

-- 7. Teste de inserção (descomente para testar)
-- INSERT INTO appointment_requests (salao_id, servico_id, funcionario_id, data_hora, cliente_nome, cliente_telefone, cliente_email, observacoes)
-- VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', NOW(), 'Teste', '11999999999', 'teste@teste.com', 'Teste de inserção');

SELECT '=== SCRIPT EXECUTADO COM SUCESSO ===' as resultado;
SELECT 'RLS FORÇADAMENTE desabilitado para appointment_requests!' as status;
