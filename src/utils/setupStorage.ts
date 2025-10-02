import { supabase } from '@/integrations/supabase/client';

export async function setupAvatarStorage() {
  try {
    // Verificar se o bucket 'avatars' existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Erro ao listar buckets:', listError);
      return false;
    }

    const avatarsBucket = buckets.find(bucket => bucket.name === 'avatars');
    
    if (!avatarsBucket) {
      console.log('Bucket "avatars" não encontrado. Criando...');
      
      // Criar o bucket 'avatars'
      const { data, error: createError } = await supabase.storage.createBucket('avatars', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB
      });

      if (createError) {
        console.error('Erro ao criar bucket "avatars":', createError);
        return false;
      }

      console.log('Bucket "avatars" criado com sucesso!');
    } else {
      console.log('Bucket "avatars" já existe');
    }

    return true;
  } catch (error) {
    console.error('Erro ao configurar storage:', error);
    return false;
  }
}

// Função para testar o upload
export async function testAvatarUpload() {
  try {
    // Criar um arquivo de teste (1x1 pixel PNG)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, 1, 1);
    }
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png');
    });

    const file = new File([blob], 'test.png', { type: 'image/png' });
    const fileName = `test-${Date.now()}.png`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Erro no teste de upload:', uploadError);
      return false;
    }

    console.log('Teste de upload realizado com sucesso!');
    
    // Limpar arquivo de teste
    await supabase.storage
      .from('avatars')
      .remove([filePath]);

    return true;
  } catch (error) {
    console.error('Erro no teste de upload:', error);
    return false;
  }
}





