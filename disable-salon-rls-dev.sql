-- Script para desabilitar RLS da tabela saloes durante desenvolvimento
-- Execute este script no Supabase SQL Editor

-- 1. Desabilitar RLS na tabela saloes
Aimage.png
-- 3. Testar se o update funciona
-- (Execute manualmente um update para testar)
-- UPDATE public.saloes SET nome = 'Teste' WHERE id = 'seu-salao-id';

-- Para reabilitar RLS depois (quando as políticas estiverem corretas):
-- ALTER TABLE public.saloes ENABLE ROW LEVEL SECURITY;
