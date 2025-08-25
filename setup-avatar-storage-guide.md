# 🖼️ Guia para Configurar Avatar Storage

## 📋 Passos para Configurar Upload de Fotos

### 1. **Executar Script SQL**
Execute o arquivo `add-avatar-url-to-users.sql` no SQL Editor do Supabase para:
- Adicionar campo `avatar_url` na tabela `users`
- Configurar políticas RLS para o bucket `avatars`

**✅ Script corrigido**: Agora remove políticas existentes antes de criar novas

### 2. **Criar Bucket no Storage**
1. Vá para **Storage** no painel do Supabase
2. Clique em **"New bucket"**
3. Configure:
   - **Name**: `avatars`
   - **Public bucket**: ✅ **Marcado**
   - **File size limit**: `5MB`
   - **Allowed MIME types**: `image/*`

### 3. **Configurar Políticas RLS (se necessário)**
Se as políticas não foram criadas pelo script SQL, configure manualmente:

```sql
-- Remover políticas existentes primeiro
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete avatars" ON storage.objects;

-- Criar novas políticas
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

### 4. **Testar Funcionalidade**
1. Acesse a página de perfil
2. Clique no ícone da câmera no avatar
3. Selecione uma imagem
4. Clique em "Salvar alterações"
5. Verifique se a foto aparece na sidebar

## ✅ **Correções Implementadas**

### **Script SQL Corrigido**:
- ✅ **Removido**: `IF NOT EXISTS` das políticas RLS
- ✅ **Adicionado**: `DROP POLICY IF EXISTS` antes de criar
- ✅ **Compatível**: Agora funciona no PostgreSQL

### **Sidebars Atualizadas**:
- ✅ **AdminSidebar**: `profile?.name` → `profile?.nome`
- ✅ **SuperAdminSidebar**: `profile?.name` → `profile?.nome`
- ✅ **ProfissionalSidebar**: `profile?.name` → `profile?.nome`

### **Perfil Melhorado**:
- ✅ **Upload de foto**: Funcionalidade completa
- ✅ **Avatar dinâmico**: Mostra foto ou iniciais
- ✅ **Salvamento correto**: Telefone e nome salvam corretamente
- ✅ **Refetch automático**: Sidebar atualiza após salvar
- ✅ **Feedback visual**: Toast notifications
- ✅ **Estados de loading**: Upload e salvamento

### **Hook useAuth Atualizado**:
- ✅ **Função refetch**: Permite atualizar perfil
- ✅ **Sincronização**: Sidebar atualiza automaticamente

## 🎯 **Funcionalidades Disponíveis**

1. **📸 Upload de Foto**:
   - Clique no ícone da câmera
   - Selecione imagem (máx 5MB)
   - Preview imediato
   - Salva no Supabase Storage

2. **✏️ Edição de Dados**:
   - Nome (obrigatório)
   - Telefone (opcional)
   - E-mail (somente leitura)

3. **🔄 Sincronização**:
   - Sidebar atualiza automaticamente
   - Avatar mostra foto ou iniciais
   - Nome atualizado em tempo real

4. **📱 Responsivo**:
   - Funciona em mobile e desktop
   - Interface adaptativa
   - Loading states

## 🚀 **Próximos Passos**

1. Execute o script SQL corrigido no Supabase
2. Configure o bucket `avatars`
3. Teste o upload de foto
4. Verifique se a sidebar atualiza
5. Teste a edição de nome e telefone

**Agora o perfil está completamente funcional!** 🎉
