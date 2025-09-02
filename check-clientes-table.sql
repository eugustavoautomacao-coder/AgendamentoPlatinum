-- Verificar e corrigir estrutura da tabela clientes
-- Este script resolve o erro de constraint not-null

-- 1. Verificar estrutura atual da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'clientes' 
ORDER BY ordinal_position;

-- 2. Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'clientes'
);

-- 3. Se a tabela não existir, criar com estrutura correta
-- (Execute apenas se a tabela não existir)
/*
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telefone VARCHAR(20) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultimo_login TIMESTAMP WITH TIME ZONE,
  senha_temporaria BOOLEAN DEFAULT true
);
*/

-- 4. Verificar se há registros na tabela
SELECT COUNT(*) FROM clientes;

-- 5. Verificar se há constraints problemáticos
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'clientes'::regclass;

-- 6. Se necessário, adicionar valores padrão para campos obrigatórios
-- (Execute apenas se necessário)
/*
ALTER TABLE clientes 
ALTER COLUMN senha_hash SET DEFAULT 'senha123';

ALTER TABLE clientes 
ALTER COLUMN telefone SET DEFAULT 'Não informado';
*/

-- 7. Verificar se há dados inconsistentes
SELECT 
  id, 
  nome, 
  email, 
  telefone, 
  senha_hash,
  CASE 
    WHEN senha_hash IS NULL THEN 'ERRO: senha_hash é NULL'
    WHEN telefone IS NULL THEN 'ERRO: telefone é NULL'
    ELSE 'OK'
  END as status
FROM clientes 
WHERE senha_hash IS NULL OR telefone IS NULL;
