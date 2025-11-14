-- Políticas RLS para o bucket 'avatars' - Permitir upload por usuários autenticados
-- Execute este script no SQL Editor do Supabase Dashboard
-- IMPORTANTE: Certifique-se de que o bucket 'avatars' está criado e configurado como público

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete avatars" ON storage.objects;

-- Política para permitir que usuários autenticados façam upload de avatars
CREATE POLICY "Authenticated users can upload avatars" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
);

-- Política para permitir que usuários autenticados atualizem avatars
CREATE POLICY "Authenticated users can update avatars" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Política para permitir que usuários autenticados deletem avatars
CREATE POLICY "Authenticated users can delete avatars" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'avatars');

-- Política para permitir leitura pública dos avatars
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars are publicly readable" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'avatars');

