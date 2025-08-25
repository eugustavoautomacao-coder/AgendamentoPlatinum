-- Desabilitar RLS em todas as tabelas principais do sistema
-- Isso acelera muito o desenvolvimento e evita problemas de permissões

-- Desabilitar RLS na tabela users
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS na tabela saloes
ALTER TABLE public.saloes DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS na tabela employees
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS na tabela services
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS na tabela appointments
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;

-- Verificar status do RLS em todas as tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'saloes', 'employees', 'services', 'appointments')
ORDER BY tablename;

-- Para reabilitar RLS depois (quando estiver em produção):
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.saloes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
