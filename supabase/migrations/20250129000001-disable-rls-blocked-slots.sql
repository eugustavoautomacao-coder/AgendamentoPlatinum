-- Desabilitar RLS na tabela blocked_slots
-- Isso permite que todos os usuários autenticados possam ler/escrever blocked_slots
-- Use com cuidado em produção!

ALTER TABLE public.blocked_slots DISABLE ROW LEVEL SECURITY;

-- Se quiser reabilitar depois, use:
-- ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

