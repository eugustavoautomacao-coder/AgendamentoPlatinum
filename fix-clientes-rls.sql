-- Configurar RLS para a tabela clientes
-- Primeiro, habilitar RLS se não estiver habilitado
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Política para inserção (criar clientes)
-- Permitir que usuários autenticados criem clientes para o salão deles
CREATE POLICY "Usuários podem criar clientes para seu salão" ON clientes
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM saloes WHERE id = salao_id
  )
);

-- Política para seleção (ler clientes)
-- Permitir que usuários autenticados vejam clientes do seu salão
CREATE POLICY "Usuários podem ver clientes do seu salão" ON clientes
FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM saloes WHERE id = salao_id
  )
);

-- Política para atualização (editar clientes)
-- Permitir que usuários autenticados editem clientes do seu salão
CREATE POLICY "Usuários podem editar clientes do seu salão" ON clientes
FOR UPDATE USING (
  auth.uid() IN (
    SELECT user_id FROM saloes WHERE id = salao_id
  )
);

-- Política para deleção (remover clientes)
-- Permitir que usuários autenticados removam clientes do seu salão
CREATE POLICY "Usuários podem remover clientes do seu salão" ON clientes
FOR DELETE USING (
  auth.uid() IN (
    SELECT user_id FROM saloes WHERE id = salao_id
  )
);

-- Política alternativa mais permissiva para desenvolvimento
-- Se as políticas acima não funcionarem, use esta:
-- DROP POLICY IF EXISTS "Usuários podem criar clientes para seu salão" ON clientes;
-- CREATE POLICY "Permitir inserção de clientes" ON clientes
-- FOR INSERT WITH CHECK (true);

-- DROP POLICY IF EXISTS "Usuários podem ver clientes do seu salão" ON clientes;
-- CREATE POLICY "Permitir visualização de clientes" ON clientes
-- FOR SELECT USING (true);

-- DROP POLICY IF EXISTS "Usuários podem editar clientes do seu salão" ON clientes;
-- CREATE POLICY "Permitir edição de clientes" ON clientes
-- FOR UPDATE USING (true);

-- DROP POLICY IF EXISTS "Usuários podem remover clientes do seu salão" ON clientes;
-- CREATE POLICY "Permitir remoção de clientes" ON clientes
-- FOR DELETE USING (true);



