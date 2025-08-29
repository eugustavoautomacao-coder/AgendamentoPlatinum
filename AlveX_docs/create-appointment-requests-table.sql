-- Tabela para solicitações de agendamento (pendentes de aprovação)
CREATE TABLE IF NOT EXISTS appointment_requests (
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
  appointment_id UUID REFERENCES appointments(id), -- Quando aprovado, referência ao agendamento criado
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_appointment_requests_salao_id ON appointment_requests(salao_id);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_status ON appointment_requests(status);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_data_hora ON appointment_requests(data_hora);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_funcionario_id ON appointment_requests(funcionario_id);

-- RLS (Row Level Security)
ALTER TABLE appointment_requests ENABLE ROW LEVEL SECURITY;

-- Política para salões acessarem suas solicitações
CREATE POLICY "Salões podem gerenciar suas solicitações de agendamento" ON appointment_requests
  FOR ALL USING (
    salao_id IN (
      SELECT salao_id FROM users WHERE id = auth.uid()
    )
  );

-- Política para acesso público (criação de solicitações)
CREATE POLICY "Público pode criar solicitações de agendamento" ON appointment_requests
  FOR INSERT WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_appointment_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_appointment_requests_updated_at
  BEFORE UPDATE ON appointment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_appointment_requests_updated_at();

-- Comentários para documentação
COMMENT ON TABLE appointment_requests IS 'Solicitações de agendamento pendentes de aprovação';
COMMENT ON COLUMN appointment_requests.status IS 'Status da solicitação: pendente, aprovado, rejeitado, cancelado';
COMMENT ON COLUMN appointment_requests.appointment_id IS 'Referência ao agendamento criado quando aprovado';
