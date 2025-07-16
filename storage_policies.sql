/* Policies para o bucket 'avatars' */
/* Execute este SQL no SQL Editor do Supabase */

/* Policy para upload (INSERT) */
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

/* Policy para visualização (SELECT) */
CREATE POLICY "Allow public viewing" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');

/* Policy para atualização (UPDATE) */
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

/* Policy para exclusão (DELETE) */
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'avatars'); 