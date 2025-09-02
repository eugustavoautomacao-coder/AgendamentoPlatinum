-- Script para atualizar a tabela appointments para suportar agendamentos de solicitações
-- Este script adiciona campos para armazenar dados de clientes não cadastrados

-- Adicionar campos para dados do cliente (para agendamentos de solicitações)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS cliente_nome VARCHAR(255),
ADD COLUMN IF NOT EXISTS cliente_telefone VARCHAR(20),
ADD COLUMN IF NOT EXISTS cliente_email VARCHAR(255);

-- Adicionar campos para compatibilidade com o sistema atual
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS funcionario_id UUID REFERENCES employees(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS servico_id UUID REFERENCES services(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS data_hora TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_appointments_funcionario_id ON appointments(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_appointments_servico_id ON appointments(servico_id);
CREATE INDEX IF NOT EXISTS idx_appointments_data_hora ON appointments(data_hora);
CREATE INDEX IF NOT EXISTS idx_appointments_cliente_email ON appointments(cliente_email);

-- Comentários para documentação
COMMENT ON COLUMN appointments.cliente_nome IS 'Nome do cliente para agendamentos de solicitações (quando cliente não está cadastrado)';
COMMENT ON COLUMN appointments.cliente_telefone IS 'Telefone do cliente para agendamentos de solicitações';
COMMENT ON COLUMN appointments.cliente_email IS 'Email do cliente para agendamentos de solicitações';
COMMENT ON COLUMN appointments.funcionario_id IS 'ID do funcionário (compatibilidade com sistema atual)';
COMMENT ON COLUMN appointments.servico_id IS 'ID do serviço (compatibilidade com sistema atual)';
COMMENT ON COLUMN appointments.data_hora IS 'Data e hora do agendamento (compatibilidade com sistema atual)';
COMMENT ON COLUMN appointments.observacoes IS 'Observações do agendamento';

-- Verificar se a tabela foi atualizada corretamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
ORDER BY ordinal_position;
-- Este script adiciona campos para armazenar dados de clientes não cadastrados

-- Adicionar campos para dados do cliente (para agendamentos de solicitações)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS cliente_nome VARCHAR(255),
ADD COLUMN IF NOT EXISTS cliente_telefone VARCHAR(20),
ADD COLUMN IF NOT EXISTS cliente_email VARCHAR(255);

-- Adicionar campos para compatibilidade com o sistema atual
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS funcionario_id UUID REFERENCES employees(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS servico_id UUID REFERENCES services(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS data_hora TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_appointments_funcionario_id ON appointments(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_appointments_servico_id ON appointments(servico_id);
CREATE INDEX IF NOT EXISTS idx_appointments_data_hora ON appointments(data_hora);
CREATE INDEX IF NOT EXISTS idx_appointments_cliente_email ON appointments(cliente_email);

-- Comentários para documentação
COMMENT ON COLUMN appointments.cliente_nome IS 'Nome do cliente para agendamentos de solicitações (quando cliente não está cadastrado)';
COMMENT ON COLUMN appointments.cliente_telefone IS 'Telefone do cliente para agendamentos de solicitações';
COMMENT ON COLUMN appointments.cliente_email IS 'Email do cliente para agendamentos de solicitações';
COMMENT ON COLUMN appointments.funcionario_id IS 'ID do funcionário (compatibilidade com sistema atual)';
COMMENT ON COLUMN appointments.servico_id IS 'ID do serviço (compatibilidade com sistema atual)';
COMMENT ON COLUMN appointments.data_hora IS 'Data e hora do agendamento (compatibilidade com sistema atual)';
COMMENT ON COLUMN appointments.observacoes IS 'Observações do agendamento';

-- Verificar se a tabela foi atualizada corretamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
ORDER BY ordinal_position;
-- Este script adiciona campos para armazenar dados de clientes não cadastrados

-- Adicionar campos para dados do cliente (para agendamentos de solicitações)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS cliente_nome VARCHAR(255),
ADD COLUMN IF NOT EXISTS cliente_telefone VARCHAR(20),
ADD COLUMN IF NOT EXISTS cliente_email VARCHAR(255);

-- Adicionar campos para compatibilidade com o sistema atual
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS funcionario_id UUID REFERENCES employees(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS servico_id UUID REFERENCES services(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS data_hora TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_appointments_funcionario_id ON appointments(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_appointments_servico_id ON appointments(servico_id);
CREATE INDEX IF NOT EXISTS idx_appointments_data_hora ON appointments(data_hora);
CREATE INDEX IF NOT EXISTS idx_appointments_cliente_email ON appointments(cliente_email);

-- Comentários para documentação
COMMENT ON COLUMN appointments.cliente_nome IS 'Nome do cliente para agendamentos de solicitações (quando cliente não está cadastrado)';
COMMENT ON COLUMN appointments.cliente_telefone IS 'Telefone do cliente para agendamentos de solicitações';
COMMENT ON COLUMN appointments.cliente_email IS 'Email do cliente para agendamentos de solicitações';
COMMENT ON COLUMN appointments.funcionario_id IS 'ID do funcionário (compatibilidade com sistema atual)';
COMMENT ON COLUMN appointments.servico_id IS 'ID do serviço (compatibilidade com sistema atual)';
COMMENT ON COLUMN appointments.data_hora IS 'Data e hora do agendamento (compatibilidade com sistema atual)';
COMMENT ON COLUMN appointments.observacoes IS 'Observações do agendamento';

-- Verificar se a tabela foi atualizada corretamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
ORDER BY ordinal_position;



