-- Tabela para armazenar horários bloqueados dos profissionais
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  funcionario_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  motivo TEXT,
  criado_por UUID REFERENCES users(id),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_blocked_slots_salao_id ON blocked_slots(salao_id);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_funcionario_id ON blocked_slots(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_data ON blocked_slots(data);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_funcionario_data ON blocked_slots(funcionario_id, data);

-- RLS (Row Level Security)
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- Política para salões acessarem seus horários bloqueados
CREATE POLICY "Salões podem gerenciar seus horários bloqueados" ON blocked_slots
  FOR ALL USING (
    salao_id IN (
      SELECT salao_id FROM users WHERE id = auth.uid()
    )
  );

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_blocked_slots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_blocked_slots_updated_at
  BEFORE UPDATE ON blocked_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_blocked_slots_updated_at();

-- Comentários para documentação
COMMENT ON TABLE blocked_slots IS 'Horários bloqueados dos profissionais para agendamentos';
COMMENT ON COLUMN blocked_slots.motivo IS 'Motivo do bloqueio (opcional)';
COMMENT ON COLUMN blocked_slots.criado_por IS 'Usuário que criou o bloqueio';
