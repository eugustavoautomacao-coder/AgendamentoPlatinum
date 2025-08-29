-- Script para corrigir as políticas RLS da tabela appointment_requests
-- Este script resolve o problema de inserção para usuários não autenticados

-- Primeiro, vamos remover as políticas existentes
DROP POLICY IF EXISTS "Salões podem gerenciar suas solicitações de agendamento" ON appointment_requests;
DROP POLICY IF EXISTS "Público pode criar solicitações de agendamento" ON appointment_requests;

-- Recriar as políticas com configurações corretas

-- 1. Política para salões acessarem suas solicitações (SELECT, UPDATE, DELETE)
CREATE POLICY "Salões podem gerenciar suas solicitações de agendamento" ON appointment_requests
  FOR ALL USING (
    salao_id IN (
      SELECT salao_id FROM users WHERE id = auth.uid()
    )
  );

-- 2. Política para inserção pública (INSERT) - permite inserção sem autenticação
CREATE POLICY "Público pode criar solicitações de agendamento" ON appointment_requests
  FOR INSERT WITH CHECK (true);

-- 3. Política adicional para leitura pública (caso necessário para validações)
CREATE POLICY "Público pode ler solicitações para validação" ON appointment_requests
  FOR SELECT USING (true);

-- Verificar se as políticas foram criadas corretamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'appointment_requests';

-- Comentário explicativo
COMMENT ON TABLE appointment_requests IS 'Solicitações de agendamento pendentes de aprovação - RLS configurado para permitir inserção pública';
