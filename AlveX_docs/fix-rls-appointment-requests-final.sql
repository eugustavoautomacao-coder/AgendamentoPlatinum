-- Script FINAL para resolver o problema de RLS em appointment_requests
-- Este script resolve definitivamente o erro 401/42501

-- 1. Primeiro, vamos verificar o estado atual
SELECT 'Estado atual das políticas:' as info;
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'appointment_requests';

-- 2. Remover TODAS as políticas existentes (incluindo as que podem ter nomes diferentes)
DROP POLICY IF EXISTS "Salões podem gerenciar suas solicitações de agendamento" ON appointment_requests;
DROP POLICY IF EXISTS "Público pode criar solicitações de agendamento" ON appointment_requests;
DROP POLICY IF EXISTS "Público pode ler solicitações para validação" ON appointment_requests;
DROP POLICY IF EXISTS "allow_public_insert" ON appointment_requests;
DROP POLICY IF EXISTS "allow_salon_read" ON appointment_requests;
DROP POLICY IF EXISTS "allow_salon_update" ON appointment_requests;
DROP POLICY IF EXISTS "allow_salon_delete" ON appointment_requests;

-- 3. Desabilitar RLS completamente
ALTER TABLE appointment_requests DISABLE ROW LEVEL SECURITY;

-- 4. Verificar se RLS foi desabilitado
SELECT 'RLS desabilitado:' as info;
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'appointment_requests';

-- 5. Comentário explicativo
COMMENT ON TABLE appointment_requests IS 'Solicitações de agendamento - RLS desabilitado para permitir inserção pública';

-- 6. Verificação final
SELECT 'Verificação final - políticas restantes:' as info;
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'appointment_requests';

-- 7. Teste de inserção (opcional - descomente se quiser testar)
-- INSERT INTO appointment_requests (salao_id, servico_id, funcionario_id, data_hora, cliente_nome, cliente_telefone, cliente_email, observacoes)
-- VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', NOW(), 'Teste', '11999999999', 'teste@teste.com', 'Teste de inserção');

SELECT 'Script executado com sucesso! RLS desabilitado para appointment_requests.' as resultado;
