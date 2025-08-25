-- Desabilitar RLS na tabela saloes temporariamente
ALTER TABLE public.saloes DISABLE ROW LEVEL SECURITY;

-- Verificar se RLS foi desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'saloes';

-- Para reabilitar RLS depois (quando as políticas estiverem corretas):
-- ALTER TABLE public.saloes ENABLE ROW LEVEL SECURITY;
