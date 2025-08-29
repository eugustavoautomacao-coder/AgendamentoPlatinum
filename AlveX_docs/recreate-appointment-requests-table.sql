-- Script para recriar a tabela appointment_requests sem RLS
-- Use este script se o anterior não funcionar

-- 1. Verificar se a tabela existe
SELECT 'Verificando se a tabela existe:' as info;
SELECT table_name FROM information_schema.tables WHERE table_name = 'appointment_requests';

-- 2. Fazer backup dos dados existentes (se houver)
CREATE TABLE IF NOT EXISTS appointment_requests_backup AS 
SELECT * FROM appointment_requests;

-- 3. Remover a tabela existente
DROP TABLE IF EXISTS appointment_requests CASCADE;

-- 4. Recriar a tabela SEM RLS
CREATE TABLE appointment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  funcionario_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  cliente_nome VARCHAR(255) NOT NULL,
  cliente_telefone VARCHAR(20) NOT NULL,
  cliente_email VARCHAR(255),
  observacoes TEXT,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'cancelado')),
  motivo_rejeicao TEXT,
  aprovado_por UUID REFERENCES users(id),
  aprovado_em TIMESTAMP WITH TIME ZONE,
  appointment_id UUID REFERENCES appointments(id),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_appointment_requests_salao_id ON appointment_requests(salao_id);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_status ON appointment_requests(status);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_data_hora ON appointment_requests(data_hora);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_funcionario_id ON appointment_requests(funcionario_id);

-- 6. Restaurar dados do backup (se houver)
INSERT INTO appointment_requests 
SELECT * FROM appointment_requests_backup 
WHERE EXISTS (SELECT 1 FROM appointment_requests_backup LIMIT 1);

-- 7. Remover tabela de backup
DROP TABLE IF EXISTS appointment_requests_backup;

-- 8. Verificar se a tabela foi criada corretamente
SELECT 'Tabela recriada:' as info;
SELECT table_name, table_type FROM information_schema.tables WHERE table_name = 'appointment_requests';

-- 9. Verificar se RLS está desabilitado
SELECT 'RLS desabilitado:' as info;
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'appointment_requests';

-- 10. Comentário explicativo
COMMENT ON TABLE appointment_requests IS 'Solicitações de agendamento - Tabela recriada SEM RLS para permitir inserção pública';

SELECT '=== TABELA RECRIADA COM SUCESSO ===' as resultado;
SELECT 'appointment_requests criada SEM RLS!' as status;
