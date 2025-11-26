-- ============================================
-- CORREÇÃO: Foreign Keys de appointments com CASCADE
-- ============================================
-- Este script adiciona ON DELETE CASCADE nas foreign keys
-- que referenciam appointments, permitindo deletar agendamentos
-- mesmo quando há comissões ou outros dados relacionados

-- ============================================
-- 1. CORRIGIR: comissoes_agendamentos_detalhes
-- ============================================
-- Remover constraint antiga
ALTER TABLE IF EXISTS public.comissoes_agendamentos_detalhes
DROP CONSTRAINT IF EXISTS comissoes_agendamentos_detalhes_appointment_id_fkey;

-- Recriar com ON DELETE CASCADE
ALTER TABLE public.comissoes_agendamentos_detalhes
ADD CONSTRAINT comissoes_agendamentos_detalhes_appointment_id_fkey
FOREIGN KEY (appointment_id)
REFERENCES public.appointments(id)
ON DELETE CASCADE;

-- ============================================
-- 2. CORRIGIR: comissoes
-- ============================================
-- Remover constraint antiga
ALTER TABLE IF EXISTS public.comissoes
DROP CONSTRAINT IF EXISTS comissoes_appointment_id_fkey;

-- Recriar com ON DELETE CASCADE
ALTER TABLE public.comissoes
ADD CONSTRAINT comissoes_appointment_id_fkey
FOREIGN KEY (appointment_id)
REFERENCES public.appointments(id)
ON DELETE CASCADE;

-- ============================================
-- 3. CORRIGIR: appointment_photos
-- ============================================
-- Remover constraint antiga
ALTER TABLE IF EXISTS public.appointment_photos
DROP CONSTRAINT IF EXISTS appointment_photos_appointment_id_fkey;

-- Recriar com ON DELETE CASCADE
ALTER TABLE public.appointment_photos
ADD CONSTRAINT appointment_photos_appointment_id_fkey
FOREIGN KEY (appointment_id)
REFERENCES public.appointments(id)
ON DELETE CASCADE;

-- ============================================
-- 4. CORRIGIR: appointment_requests
-- ============================================
-- Remover constraint antiga
ALTER TABLE IF EXISTS public.appointment_requests
DROP CONSTRAINT IF EXISTS appointment_requests_appointment_id_fkey;

-- Recriar com ON DELETE SET NULL (mantém a request, mas remove referência)
ALTER TABLE public.appointment_requests
ADD CONSTRAINT appointment_requests_appointment_id_fkey
FOREIGN KEY (appointment_id)
REFERENCES public.appointments(id)
ON DELETE SET NULL;

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. ON DELETE CASCADE: Quando um appointment é deletado,
--    os registros relacionados também são deletados automaticamente
--    - comissoes_agendamentos_detalhes
--    - comissoes
--    - appointment_photos
--
-- 2. ON DELETE SET NULL: Quando um appointment é deletado,
--    a referência é removida mas o registro pai é mantido
--    - appointment_requests (mantém a solicitação, mas remove o link)
--
-- 3. Isso permite deletar agendamentos mesmo quando há
--    comissões calculadas, mantendo a integridade referencial
-- ============================================


