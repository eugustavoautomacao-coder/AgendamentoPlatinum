-- SOLUÇÃO TEMPORÁRIA: Política super permissiva para testar
-- Execute este script TEMPORARIAMENTE para desbloquear o sistema

-- 1. Remover política restritiva
DROP POLICY IF EXISTS "Public can create appointment requests" ON public.appointment_requests;

-- 2. Criar política TEMPORÁRIA super permissiva
CREATE POLICY "Public can create appointment requests" 
ON public.appointment_requests
FOR INSERT 
TO public
WITH CHECK (true); -- ATENÇÃO: Isso é TEMPORÁRIO!

-- ✅ Agora teste o sistema

-- IMPORTANTE: Após confirmar que funciona, aplique a política correta:
-- Execute o arquivo APLICAR-CORRECAO-RLS-APPOINTMENT-REQUESTS.sql


