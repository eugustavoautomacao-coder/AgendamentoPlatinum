-- Tabela para clientes do sistema
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL, -- Senha temporária gerada automaticamente
  senha_temporaria BOOLEAN DEFAULT true, -- Indica se precisa trocar a senha
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultimo_login TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_salao_id ON clientes(salao_id);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_salao_email ON clientes(salao_id, email);

-- RLS (Row Level Security)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Política para clientes acessarem apenas seus dados
CREATE POLICY "Clientes podem acessar apenas seus dados" ON clientes
  FOR ALL USING (
    id = auth.uid()::text::uuid OR
    salao_id IN (
      SELECT salao_id FROM users WHERE id = auth.uid()
    )
  );

-- Política para inserção pública (criação de contas)
CREATE POLICY "Público pode criar contas de cliente" ON clientes
  FOR INSERT WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_clientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_clientes_updated_at();

-- Comentários para documentação
COMMENT ON TABLE clientes IS 'Clientes dos salões com acesso ao sistema';
COMMENT ON COLUMN clientes.senha_temporaria IS 'Indica se o cliente precisa trocar a senha temporária';
COMMENT ON COLUMN clientes.salao_id IS 'Salão ao qual o cliente está vinculado';
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL, -- Senha temporária gerada automaticamente
  senha_temporaria BOOLEAN DEFAULT true, -- Indica se precisa trocar a senha
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultimo_login TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_salao_id ON clientes(salao_id);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_salao_email ON clientes(salao_id, email);

-- RLS (Row Level Security)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Política para clientes acessarem apenas seus dados
CREATE POLICY "Clientes podem acessar apenas seus dados" ON clientes
  FOR ALL USING (
    id = auth.uid()::text::uuid OR
    salao_id IN (
      SELECT salao_id FROM users WHERE id = auth.uid()
    )
  );

-- Política para inserção pública (criação de contas)
CREATE POLICY "Público pode criar contas de cliente" ON clientes
  FOR INSERT WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_clientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_clientes_updated_at();

-- Comentários para documentação
COMMENT ON TABLE clientes IS 'Clientes dos salões com acesso ao sistema';
COMMENT ON COLUMN clientes.senha_temporaria IS 'Indica se o cliente precisa trocar a senha temporária';
COMMENT ON COLUMN clientes.salao_id IS 'Salão ao qual o cliente está vinculado';
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL, -- Senha temporária gerada automaticamente
  senha_temporaria BOOLEAN DEFAULT true, -- Indica se precisa trocar a senha
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultimo_login TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_salao_id ON clientes(salao_id);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_salao_email ON clientes(salao_id, email);

-- RLS (Row Level Security)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Política para clientes acessarem apenas seus dados
CREATE POLICY "Clientes podem acessar apenas seus dados" ON clientes
  FOR ALL USING (
    id = auth.uid()::text::uuid OR
    salao_id IN (
      SELECT salao_id FROM users WHERE id = auth.uid()
    )
  );

-- Política para inserção pública (criação de contas)
CREATE POLICY "Público pode criar contas de cliente" ON clientes
  FOR INSERT WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_clientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_clientes_updated_at();

-- Comentários para documentação
COMMENT ON TABLE clientes IS 'Clientes dos salões com acesso ao sistema';
COMMENT ON COLUMN clientes.senha_temporaria IS 'Indica se o cliente precisa trocar a senha temporária';
COMMENT ON COLUMN clientes.salao_id IS 'Salão ao qual o cliente está vinculado';



