-- Reabilitar RLS em todas as tabelas principais do sistema
-- Execute este script quando for para produção

-- Reabilitar RLS na tabela users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Reabilitar RLS na tabela saloes
ALTER TABLE public.saloes ENABLE ROW LEVEL SECURITY;

-- Reabilitar RLS na tabela employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Reabilitar RLS na tabela services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Reabilitar RLS na tabela appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Verificar status do RLS em todas as tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'saloes', 'employees', 'services', 'appointments')
ORDER BY tablename;

-- IMPORTANTE: Após reabilitar RLS, você precisará criar as políticas adequadas
-- para cada tabela baseado nos roles dos usuários
