-- Script para configurar Supabase Storage e adicionar campo avatar_url

-- 1. Adicionar campo avatar_url na tabela employees
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Criar bucket 'avatars' para armazenar imagens de perfil
-- (Execute isso no SQL Editor do Supabase)

-- 3. Configurar políticas RLS para o bucket avatars
-- Permitir que usuários autenticados façam upload de imagens
CREATE POLICY "Users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- Permitir que usuários autenticados vejam imagens
CREATE POLICY "Users can view avatars" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- Permitir que usuários autenticados atualizem suas próprias imagens
CREATE POLICY "Users can update avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- Permitir que usuários autenticados deletem suas próprias imagens
CREATE POLICY "Users can delete avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- 4. Verificar se o campo foi adicionado
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name = 'avatar_url';

-- 5. Verificar políticas do bucket
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
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%avatar%';
