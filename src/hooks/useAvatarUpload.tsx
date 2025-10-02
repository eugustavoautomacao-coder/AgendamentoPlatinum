import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UseAvatarUploadReturn {
  uploading: boolean;
  uploadAvatar: (file: File, userId: string) => Promise<string | null>;
  deleteAvatar: (avatarUrl: string) => Promise<boolean>;
}

export function useAvatarUpload(): UseAvatarUploadReturn {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
    setUploading(true);

    try {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Apenas arquivos de imagem são permitidos');
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('O arquivo deve ter no máximo 5MB');
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Fazer upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // Se o arquivo já existe, tentar fazer upsert
        if (uploadError.message.includes('already exists')) {
          const { error: upsertError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true
            });
          
          if (upsertError) throw upsertError;
        } else {
          throw uploadError;
        }
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      toast({
        title: "Avatar atualizado!",
        description: "Sua foto foi atualizada com sucesso."
      });

      return publicUrl;
    } catch (error: any) {
      console.error('Erro no upload do avatar:', error);
      toast({
        title: "Erro ao fazer upload",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteAvatar = async (avatarUrl: string): Promise<boolean> => {
    try {
      // Extrair o caminho do arquivo da URL
      const url = new URL(avatarUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const filePath = `avatars/${fileName}`;

      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (error) {
        console.error('Erro ao deletar avatar:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao deletar avatar:', error);
      return false;
    }
  };

  return {
    uploading,
    uploadAvatar,
    deleteAvatar
  };
}




