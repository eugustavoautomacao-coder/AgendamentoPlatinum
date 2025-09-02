-- Script para resolver constraints da tabela clientes
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura atual
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clientes' 
ORDER BY ordinal_position;

-- 2. Adicionar valores padrão para campos obrigatórios
ALTER TABLE clientes 
ALTER COLUMN senha_hash SET DEFAULT 'senha123';

ALTER TABLE clientes 
ALTER COLUMN telefone SET DEFAULT 'Não informado';

-- 3. Verificar se funcionou
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'clientes' 
AND column_name IN ('senha_hash', 'telefone');

-- 4. Se ainda houver problemas, criar a tabela do zero
-- (Execute apenas se necessário)
/*
DROP TABLE IF EXISTS clientes CASCADE;

CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telefone VARCHAR(20) NOT NULL DEFAULT 'Não informado',
  senha_hash VARCHAR(255) NOT NULL DEFAULT 'senha123',
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultimo_login TIMESTAMP WITH TIME ZONE,
  senha_temporaria BOOLEAN DEFAULT true
);

-- Desabilitar RLS temporariamente
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
*/
