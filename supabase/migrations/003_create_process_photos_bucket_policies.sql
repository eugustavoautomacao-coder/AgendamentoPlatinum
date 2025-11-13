-- Políticas RLS para o bucket 'process-photos'
-- Execute este script no SQL Editor do Supabase Dashboard
-- IMPORTANTE: Certifique-se de que o bucket 'process-photos' está criado e configurado como público

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Authenticated users can upload process photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update process photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete process photos" ON storage.objects;
DROP POLICY IF EXISTS "Process photos are publicly readable" ON storage.objects;

-- Política para permitir que usuários autenticados façam upload de fotos do processo
CREATE POLICY "Authenticated users can upload process photos" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'process-photos'
);

-- Política para permitir que usuários autenticados atualizem fotos do processo
CREATE POLICY "Authenticated users can update process photos" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'process-photos')
WITH CHECK (bucket_id = 'process-photos');

-- Política para permitir que usuários autenticados deletem fotos do processo
CREATE POLICY "Authenticated users can delete process photos" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'process-photos');

-- Política para permitir leitura pública das fotos do processo
CREATE POLICY "Process photos are publicly readable" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'process-photos');
