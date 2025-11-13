-- Script completo para configurar RLS da tabela appointment_requests
-- Este script resolve definitivamente o problema de inserção pública

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Salões podem gerenciar suas solicitações de agendamento" ON appointment_requests;
DROP POLICY IF EXISTS "Público pode criar solicitações de agendamento" ON appointment_requests;
DROP POLICY IF EXISTS "Público pode ler solicitações para validação" ON appointment_requests;

-- 2. Desabilitar RLS temporariamente
ALTER TABLE appointment_requests DISABLE ROW LEVEL SECURITY;

-- 3. Reabilitar RLS
ALTER TABLE appointment_requests ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas específicas e bem definidas

-- Política 1: Inserção pública (permite qualquer pessoa criar solicitações)
CREATE POLICY "allow_public_insert" ON appointment_requests
  FOR INSERT 
  TO public
  WITH CHECK (true);

-- Política 2: Leitura para usuários autenticados do salão
CREATE POLICY "allow_salon_read" ON appointment_requests
  FOR SELECT 
  TO authenticated
  USING (
    salao_id IN (
      SELECT salao_id FROM users WHERE id = auth.uid()
    )
  );

-- Política 3: Atualização para usuários autenticados do salão
CREATE POLICY "allow_salon_update" ON appointment_requests
  FOR UPDATE 
  TO authenticated
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

-- Política 4: Exclusão para usuários autenticados do salão
CREATE POLICY "allow_salon_delete" ON appointment_requests
  FOR DELETE 
  TO authenticated
  USING (
    salao_id IN (
      SELECT salao_id FROM users WHERE id = auth.uid()
    )
  );

-- 5. Verificar as políticas criadas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'appointment_requests'
ORDER BY policyname;

-- 6. Verificar se RLS está habilitado
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'appointment_requests';

-- Comentário final
COMMENT ON TABLE appointment_requests IS 'Solicitações de agendamento - RLS configurado com políticas específicas para inserção pública e gerenciamento por salões';
