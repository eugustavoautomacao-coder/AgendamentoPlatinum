-- Script para adicionar coluna 'ativo' à tabela clientes
-- Execute apenas se quiser ter controle de ativação/desativação de clientes

-- Adicionar coluna ativo
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);

-- Comentário para documentação
COMMENT ON COLUMN clientes.ativo IS 'Indica se o cliente está ativo no sistema';

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'clientes' AND column_name = 'ativo';



