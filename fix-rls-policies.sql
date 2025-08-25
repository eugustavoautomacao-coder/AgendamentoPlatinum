-- Verificar políticas RLS existentes na tabela saloes
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

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'saloes';

-- Criar política RLS para system_admin poder excluir salões
-- Primeiro, remover políticas existentes de DELETE se houver
DROP POLICY IF EXISTS "system_admin_can_delete_saloes" ON public.saloes;

-- Criar nova política para system_admin poder excluir salões
CREATE POLICY "system_admin_can_delete_saloes" ON public.saloes
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.tipo = 'system_admin'
        )
    );

-- Verificar se a política foi criada
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
WHERE tablename = 'saloes' AND policyname = 'system_admin_can_delete_saloes';
