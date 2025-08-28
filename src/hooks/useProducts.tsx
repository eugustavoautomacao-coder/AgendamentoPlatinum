import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Product {
  id: string;
  salao_id: string;
  codigo_interno: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  marca?: string;
  preco_custo: number;
  preco_venda: number;
  estoque_atual: number;
  estoque_minimo: number;
  unidade_medida: string;
  codigo_barras?: string;
  fornecedor?: string;
  observacoes?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface CreateProductData {
  codigo_interno: string;
  nome: string;
  categoria?: string;
  marca?: string;
  preco_custo: number;
  preco_venda: number;
  preco_profissional?: number;
  estoque_atual: number;
  estoque_minimo: number;
  unidade_medida: string;
  codigo_barras?: string;
  fornecedor?: string;
  descricao?: string;
  para_revenda: boolean;
  ativo?: boolean;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
}

export function useProducts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar produtos do salão do usuário
  const { data: products = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      if (!user) return [];

      // Buscar o salão do usuário
      const { data: userData } = await supabase
        .from('users')
        .select('salao_id')
        .eq('id', user.id)
        .single();

      if (!userData?.salao_id) return [];

      // Buscar produtos do salão
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('salao_id', userData.salao_id)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!user,
  });

  // Criar produto
  const createProduct = useMutation({
    mutationFn: async (productData: CreateProductData) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar o salão do usuário
      const { data: userData } = await supabase
        .from('users')
        .select('salao_id')
        .eq('id', user.id)
        .single();

      if (!userData?.salao_id) throw new Error('Usuário não está associado a um salão');

      const { data, error } = await supabase
        .from('produtos')
        .insert([{
          ...productData,
          salao_id: userData.salao_id,
          ativo: productData.ativo ?? true,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // Atualizar produto
  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateProductData) => {
      const { data, error } = await supabase
        .from('produtos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // Deletar produto (soft delete)
  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('produtos')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // Buscar categorias únicas
  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      if (!user) return [];

      // Buscar o salão do usuário
      const { data: userData } = await supabase
        .from('users')
        .select('salao_id')
        .eq('id', user.id)
        .single();

      if (!userData?.salao_id) return [];

      const { data, error } = await supabase
        .from('produtos')
        .select('categoria')
        .eq('salao_id', userData.salao_id)
        .eq('ativo', true)
        .not('categoria', 'is', null);

      if (error) throw error;

      // Extrair categorias únicas
      const uniqueCategories = [...new Set(data.map(item => item.categoria).filter(Boolean))];
      return uniqueCategories.sort();
    },
    enabled: !!user,
  });

  return {
    products,
    categories,
    loading,
    error,
    refetch,
    createProduct,
    updateProduct,
    deleteProduct,
    isCreating: createProduct.isPending,
    isUpdating: updateProduct.isPending,
    isDeleting: deleteProduct.isPending,
  };
}
