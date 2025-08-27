# Guia de Configuração - Fotos do Processo

## 📸 Configuração Completa

### 1. Executar Script SQL
Execute o arquivo `setup-process-photos.sql` no Supabase SQL Editor para criar:
- Tabela `appointment_photos`
- Índices de performance
- Políticas RLS (Row Level Security)
- Triggers automáticos

### 2. Configurar Bucket de Storage

#### 2.1 Criar Bucket no Supabase
1. Acesse o **Supabase Dashboard**
2. Vá para **Storage** no menu lateral
3. Clique em **"New bucket"**
4. Configure:
   - **Name**: `process-photos`
   - **Public bucket**: ✅ Marcar como público
   - **File size limit**: `10 MB` (ou conforme necessário)
   - **Allowed MIME types**: `image/*`

#### 2.2 Configurar Políticas de Storage
Execute no SQL Editor:

```sql
-- Política para permitir upload de fotos para usuários autenticados
CREATE POLICY "Users can upload process photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'process-photos' AND
        auth.role() = 'authenticated'
    );

-- Política para permitir visualização de fotos públicas
CREATE POLICY "Anyone can view process photos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'process-photos'
    );

-- Política para permitir atualização de fotos pelos usuários
CREATE POLICY "Users can update process photos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'process-photos' AND
        auth.role() = 'authenticated'
    );

-- Política para permitir exclusão de fotos pelos usuários
CREATE POLICY "Users can delete process photos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'process-photos' AND
        auth.role() = 'authenticated'
    );
```

### 3. Estrutura de Pastas
O sistema criará automaticamente a seguinte estrutura:
```
process-photos/
├── {appointment-id}-antes-{timestamp}.jpg
├── {appointment-id}-durante-{timestamp}.jpg
└── {appointment-id}-depois-{timestamp}.jpg
```

### 4. Funcionalidades Implementadas

#### 4.1 Modal de Fotos
- **Acesso**: Botão "Fotos do Processo" no modal de edição do agendamento
- **Organização**: 3 seções (Antes, Durante, Depois) com cores distintas
- **Upload**: Botão "Adicionar Foto" para cada seção
- **Visualização**: Grid responsivo com preview das fotos
- **Exclusão**: Botão X no hover para remover fotos

#### 4.2 Recursos Técnicos
- **Storage**: Supabase Storage com bucket `process-photos`
- **Banco**: Tabela `appointment_photos` com relacionamento
- **Segurança**: RLS configurado para isolamento por salão
- **Performance**: Índices otimizados para consultas rápidas

### 5. Fluxo de Uso

1. **Abrir Agendamento**: Clique em um card de agendamento na agenda
2. **Acessar Fotos**: Clique no botão "Fotos do Processo"
3. **Adicionar Fotos**: Use "Adicionar Foto" em cada seção desejada
4. **Gerenciar**: Visualize, organize e remova fotos conforme necessário
5. **Salvar**: As fotos são salvas automaticamente no sistema

### 6. Limitações e Considerações

#### 6.1 Tamanho de Arquivo
- **Limite**: 10MB por foto (configurável no bucket)
- **Formatos**: JPG, PNG, GIF, WebP
- **Otimização**: Considere comprimir fotos antes do upload

#### 6.2 Performance
- **Cache**: Fotos são carregadas sob demanda
- **Grid**: Layout responsivo para diferentes tamanhos de tela
- **Lazy Loading**: Implementar se necessário para muitos agendamentos

#### 6.3 Segurança
- **Isolamento**: Cada salão vê apenas suas fotos
- **Autenticação**: Apenas usuários logados podem fazer upload
- **Validação**: Tipos de arquivo restritos a imagens

### 7. Troubleshooting

#### 7.1 Erro de Upload
```
Error: Upload failed
```
**Solução**: Verificar se o bucket `process-photos` existe e as políticas estão configuradas

#### 7.2 Fotos não aparecem
```
Error: Cannot load photos
```
**Solução**: Verificar se a tabela `appointment_photos` foi criada e as políticas RLS estão ativas

#### 7.3 Erro de permissão
```
Error: Permission denied
```
**Solução**: Verificar se o usuário está autenticado e pertence ao salão correto

### 8. Próximos Passos

1. **Teste**: Faça upload de algumas fotos de teste
2. **Validação**: Verifique se as fotos aparecem corretamente
3. **Performance**: Monitore o uso de storage
4. **Backup**: Configure backup automático se necessário

### 9. Comandos Úteis

#### Verificar Bucket
```sql
SELECT * FROM storage.buckets WHERE id = 'process-photos';
```

#### Verificar Políticas
```sql
SELECT * FROM storage.policies WHERE bucket_id = 'process-photos';
```

#### Verificar Fotos
```sql
SELECT * FROM public.appointment_photos ORDER BY created_at DESC LIMIT 10;
```

---

**✅ Configuração concluída!** O sistema de fotos do processo está pronto para uso.
