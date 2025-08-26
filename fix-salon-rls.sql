-- Script para verificar e corrigir políticas RLS da tabela saloes
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'saloes';

-- 2. Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'saloes';

-- 3. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.saloes;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.saloes;
DROP POLICY IF EXISTS "Enable update for users based on salon_id" ON public.saloes;
DROP POLICY IF EXISTS "Enable delete for users based on salon_id" ON public.saloes;
DROP POLICY IF EXISTS "system_admin_can_delete_saloes" ON public.saloes;

-- 4. Criar políticas RLS adequadas

-- Política para leitura (todos os usuários autenticados podem ler)
CREATE POLICY "Enable read access for all users" ON public.saloes
    FOR SELECT
    TO authenticated
    USING (true);

-- Política para inserção (apenas system_admin)
CREATE POLICY "Enable insert for system_admin only" ON public.saloes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.tipo = 'system_admin'
        )
    );

-- Política para atualização (admin do salão ou system_admin)
CREATE POLICY "Enable update for salon admin or system_admin" ON public.saloes
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (
                users.tipo = 'system_admin' 
                OR (users.tipo = 'admin' AND users.salao_id = saloes.id)
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (
                users.tipo = 'system_admin' 
                OR (users.tipo = 'admin' AND users.salao_id = saloes.id)
            )
        )
    );

-- Política para exclusão (apenas system_admin)
CREATE POLICY "Enable delete for system_admin only" ON public.saloes
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.tipo = 'system_admin'
        )
    );

-- 5. Verificar se as políticas foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'saloes'
ORDER BY cmd, policyname;
