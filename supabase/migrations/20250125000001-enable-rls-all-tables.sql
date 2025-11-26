-- ============================================
-- HABILITAR RLS EM TODAS AS TABELAS CRÍTICAS
-- ============================================
-- Este script habilita Row Level Security em todas as tabelas
-- que estão aparecendo como "Unrestricted" no Supabase Dashboard

-- ============================================
-- 1. TABELA: clientes
-- ============================================
ALTER TABLE IF EXISTS public.clientes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. TABELA: appointments
-- ============================================
ALTER TABLE IF EXISTS public.appointments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. TABELA: users
-- ============================================
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. TABELA: employees
-- ============================================
ALTER TABLE IF EXISTS public.employees ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. TABELA: services
-- ============================================
ALTER TABLE IF EXISTS public.services ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. TABELA: saloes
-- ============================================
ALTER TABLE IF EXISTS public.saloes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. TABELA: comissoes
-- ============================================
ALTER TABLE IF EXISTS public.comissoes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. TABELA: comissoes_mensais
-- ============================================
ALTER TABLE IF EXISTS public.comissoes_mensais ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. TABELA: comissoes_agendamentos_detalhes
-- ============================================
ALTER TABLE IF EXISTS public.comissoes_agendamentos_detalhes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 10. TABELA: comissoes_historico
-- ============================================
ALTER TABLE IF EXISTS public.comissoes_historico ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 11. TABELA: pagamentos_comissoes
-- ============================================
ALTER TABLE IF EXISTS public.pagamentos_comissoes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 12. TABELA: blocked_slots
-- ============================================
ALTER TABLE IF EXISTS public.blocked_slots ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 13. TABELA: categorias
-- ============================================
ALTER TABLE IF EXISTS public.categorias ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 14. TABELA: produtos
-- ============================================
ALTER TABLE IF EXISTS public.produtos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 15. TABELA: appointment_requests
-- ============================================
ALTER TABLE IF EXISTS public.appointment_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 16. TABELA: appointment_photos
-- ============================================
ALTER TABLE IF EXISTS public.appointment_photos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTA IMPORTANTE:
-- ============================================
-- Habilitar RLS é apenas o PRIMEIRO PASSO!
-- 
-- Após habilitar RLS, você DEVE criar políticas (policies) para cada tabela.
-- Sem políticas, nenhum acesso será permitido (nem mesmo para usuários autenticados).
--
-- As políticas devem ser criadas em migrations separadas para cada tabela,
-- seguindo o padrão de multitenancy baseado em salao_id.
--
-- Exemplo de política básica:
-- CREATE POLICY "Users can view data in their salon" 
-- ON public.tabela
-- FOR SELECT 
-- TO authenticated
-- USING (
--   salao_id = (SELECT salao_id FROM public.users WHERE id = auth.uid())
-- );
-- ============================================


