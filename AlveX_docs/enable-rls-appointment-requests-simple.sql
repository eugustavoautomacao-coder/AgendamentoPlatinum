-- Script para reabilitar RLS com políticas simples e funcionais
-- Use este script APÓS executar o fix-rls-appointment-requests-final.sql

-- 1. Reabilitar RLS
ALTER TABLE appointment_requests ENABLE ROW LEVEL SECURITY;

-- 2. Criar política simples para inserção pública
CREATE POLICY "public_insert" ON appointment_requests
  FOR INSERT 
  WITH CHECK (true);

-- 3. Criar política para leitura por salão
CREATE POLICY "salon_read" ON appointment_requests
  FOR SELECT 
  USING (
    salao_id IN (
      SELECT salao_id FROM users WHERE id = auth.uid()
    )
  );

-- 4. Criar política para atualização por salão
CREATE POLICY "salon_update" ON appointment_requests
  FOR UPDATE 
  USING (
    salao_id IN (
      SELECT salao_id FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    salao_id IN (
      SELECT salao_id FROM users WHERE id = auth.uid()
    )
  );

-- 5. Criar política para exclusão por salão
CREATE POLICY "salon_delete" ON appointment_requests
  FOR DELETE 
  USING (
    salao_id IN (
      SELECT salao_id FROM users WHERE id = auth.uid()
    )
  );

-- 6. Verificar as políticas criadas
SELECT 'Políticas criadas:' as info;
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'appointment_requests';

-- 7. Verificar se RLS está habilitado
SELECT 'RLS habilitado:' as info;
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'appointment_requests';

-- 8. Comentário final
COMMENT ON TABLE appointment_requests IS 'Solicitações de agendamento - RLS habilitado com políticas simples';

SELECT 'RLS reabilitado com políticas simples!' as resultado;
