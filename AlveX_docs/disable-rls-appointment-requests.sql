-- Script alternativo: Desabilitar RLS temporariamente para appointment_requests
-- Use este script se o anterior não funcionar

-- Desabilitar RLS para permitir inserções públicas
ALTER TABLE appointment_requests DISABLE ROW LEVEL SECURITY;

-- Comentário explicativo
COMMENT ON TABLE appointment_requests IS 'Solicitações de agendamento - RLS desabilitado para permitir inserção pública';

-- Verificar se RLS foi desabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'appointment_requests';
