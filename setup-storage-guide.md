# 🗄️ Configuração do Supabase Storage

## 📋 Passos para Configurar o Storage

### 1. **Criar o Bucket 'avatars'**

1. Acesse o **Dashboard do Supabase**
2. Vá para **Storage** no menu lateral
3. Clique em **"New bucket"**
4. Configure:
   - **Name**: `avatars`
   - **Public bucket**: ✅ Marque como público
   - **File size limit**: `5MB` (ou o valor desejado)
   - **Allowed MIME types**: `image/*`

### 2. **Executar o Script SQL**

Execute o script `setup-storage.sql` no **SQL Editor** do Supabase:

```sql
-- Adicionar campo avatar_url na tabela employees
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Configurar políticas RLS para o bucket avatars
CREATE POLICY "Users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can view avatars" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);
```

### 3. **Verificar Configuração**

Após executar o script, verifique se:

1. **Campo adicionado**: A tabela `employees` tem o campo `avatar_url`
2. **Bucket criado**: Existe um bucket chamado `avatars`
3. **Políticas criadas**: As políticas RLS foram aplicadas

### 4. **Testar Upload**

1. Faça login como Admin
2. Acesse `/admin/profissionais`
3. Crie um novo profissional ou edite um existente
4. Tente fazer upload de uma imagem
5. Verifique se a imagem aparece no bucket `avatars`

## 🔧 Funcionalidades Implementadas

### **Upload de Imagens**
- ✅ Upload direto no card do profissional (hover)
- ✅ Upload no modal de edição
- ✅ Preview da imagem antes de salvar
- ✅ Remoção de imagens existentes

### **Storage Management**
- ✅ Criação automática de nomes únicos
- ✅ Organização em pastas (`professionals/`)
- ✅ Limpeza automática ao remover imagens
- ✅ URLs públicas para acesso

### **Interface**
- ✅ Cards com avatares circulares
- ✅ Hover effects para upload rápido
- ✅ Modal de edição com preview
- ✅ Botão de remoção de foto

## 🚨 Possíveis Problemas

### **Erro de Upload**
- Verifique se o bucket `avatars` foi criado
- Verifique se as políticas RLS estão corretas
- Verifique se o campo `avatar_url` foi adicionado

### **Imagem não aparece**
- Verifique se a URL está sendo salva no banco
- Verifique se o bucket é público
- Verifique se a política de visualização está correta

### **Erro de permissão**
- Verifique se o usuário está autenticado
- Verifique se as políticas RLS permitem a ação

## 📝 Próximos Passos

1. **Execute o script SQL** no Supabase
2. **Crie o bucket** `avatars` no Storage
3. **Teste o upload** de imagens
4. **Verifique se tudo funciona** corretamente

## 🎯 Resultado Esperado

Após a configuração, você deve conseguir:
- ✅ Fazer upload de imagens para profissionais
- ✅ Ver as imagens nos cards
- ✅ Editar e remover imagens
- ✅ Ter URLs públicas funcionando
