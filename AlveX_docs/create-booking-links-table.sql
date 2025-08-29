-- Tabela para armazenar links de agendamento únicos
CREATE TABLE IF NOT EXISTS booking_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES users(id) ON DELETE CASCADE,
  link_token VARCHAR(255) UNIQUE NOT NULL,
  nome_cliente VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(255),
  servicos_permitidos UUID[] DEFAULT '{}', -- Array de IDs de serviços permitidos (vazio = todos)
  profissionais_permitidos UUID[] DEFAULT '{}', -- Array de IDs de profissionais permitidos (vazio = todos)
  data_inicio DATE,
  data_fim DATE,
  max_agendamentos INTEGER DEFAULT 1, -- Máximo de agendamentos que pode fazer
  agendamentos_realizados INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  expira_em TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_booking_links_salao_id ON booking_links(salao_id);
CREATE INDEX IF NOT EXISTS idx_booking_links_token ON booking_links(link_token);
CREATE INDEX IF NOT EXISTS idx_booking_links_cliente_id ON booking_links(cliente_id);
CREATE INDEX IF NOT EXISTS idx_booking_links_ativo ON booking_links(ativo);

-- RLS (Row Level Security)
ALTER TABLE booking_links ENABLE ROW LEVEL SECURITY;

-- Política para salões acessarem seus próprios links
CREATE POLICY "Salões podem gerenciar seus links de agendamento" ON booking_links
  FOR ALL USING (
    salao_id IN (
      SELECT salao_id FROM users WHERE id = auth.uid()
    )
  );

-- Política para acesso público aos links ativos (para a página de agendamento)
CREATE POLICY "Links ativos são acessíveis publicamente" ON booking_links
  FOR SELECT USING (
    ativo = true AND 
    (expira_em IS NULL OR expira_em > NOW()) AND
    (data_fim IS NULL OR data_fim >= CURRENT_DATE)
  );

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_booking_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_booking_links_updated_at
  BEFORE UPDATE ON booking_links
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_links_updated_at();

-- Comentários para documentação
COMMENT ON TABLE booking_links IS 'Links únicos para agendamento online de clientes';
COMMENT ON COLUMN booking_links.link_token IS 'Token único para o link de agendamento';
COMMENT ON COLUMN booking_links.servicos_permitidos IS 'Array de IDs de serviços permitidos (vazio = todos)';
COMMENT ON COLUMN booking_links.profissionais_permitidos IS 'Array de IDs de profissionais permitidos (vazio = todos)';
COMMENT ON COLUMN booking_links.max_agendamentos IS 'Máximo de agendamentos que o cliente pode fazer com este link';
COMMENT ON COLUMN booking_links.agendamentos_realizados IS 'Quantidade de agendamentos já realizados com este link';
