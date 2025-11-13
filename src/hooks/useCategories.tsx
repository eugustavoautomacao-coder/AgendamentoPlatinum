import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Category {
  id: string;
  salao_id: string;
  nome: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface CreateCategoryData {
  nome: string;
}

export function useCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Buscar categorias do salão
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: userData } = await supabase
        .from('users')
        .select('salao_id')
        .eq('id', user.id)
        .single();

      if (!userData?.salao_id) return [];

      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('salao_id', userData.salao_id)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data as Category[];
    },
    enabled: !!user,
  });

  // Criar nova categoria
  const createCategory = useMutation({
    mutationFn: async (categoryData: CreateCategoryData) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data: userData } = await supabase
        .from('users')
        .select('salao_id')
        .eq('id', user.id)
        .single();

      if (!userData?.salao_id) throw new Error('Usuário não está associado a um salão');

      const { data, error } = await supabase
        .from('categorias')
        .insert([{
          ...categoryData,
          salao_id: userData.salao_id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  // Atualizar categoria
  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<CreateCategoryData>) => {
      const { data, error } = await supabase
        .from('categorias')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  // Desativar categoria (soft delete)
  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      // Verificar se há produtos usando esta categoria
      const { data: products, error: checkError } = await supabase
        .from('produtos')
        .select('id')
        .eq('categoria_id', id)
        .eq('ativo', true)
        .limit(1);

      if (checkError) throw checkError;

      if (products && products.length > 0) {
        throw new Error('Não é possível excluir esta categoria pois existem produtos associados a ela.');
      }

      const { error } = await supabase
        .from('categorias')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  return {
    categories,
    createCategory,
    updateCategory,
    deleteCategory,
    isLoading,
  };
}
