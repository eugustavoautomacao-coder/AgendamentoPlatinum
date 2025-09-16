import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Product {
  id: string;
  salao_id: string;
  codigo_interno: string;
  nome: string;
  descricao?: string;
  categoria_id?: string;
  categoria?: {
    id: string;
    nome: string;
  };
  marca?: string;
  preco_custo: number;
  preco_venda: number;
  preco_profissional?: number;
  estoque_atual: number;
  estoque_minimo: number;
  unidade_medida: string;
  codigo_barras?: string;
  fornecedor?: string;
  observacoes?: string;
  para_revenda: boolean;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface CreateProductData {
  codigo_interno: string;
  nome: string;
  categoria_id?: string;
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

      // Buscar produtos do salão com categoria
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *,
          categoria:categorias(id, nome)
        `)
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

      // Verificar se código interno já existe
      if (productData.codigo_interno) {
        const { data: existingInternalCode } = await supabase
          .from('produtos')
          .select('id')
          .eq('salao_id', userData.salao_id)
          .eq('codigo_interno', productData.codigo_interno)
          .eq('ativo', true)
          .single();

        if (existingInternalCode) {
          throw new Error('Código interno já existe. Por favor, use um código diferente.');
        }
      }

      // Verificar se código de barras já existe
      if (productData.codigo_barras) {
        const { data: existingBarcode } = await supabase
          .from('produtos')
          .select('id')
          .eq('salao_id', userData.salao_id)
          .eq('codigo_barras', productData.codigo_barras)
          .eq('ativo', true)
          .single();

        if (existingBarcode) {
          throw new Error('Código de barras já existe. Por favor, use um código diferente.');
        }
      }

      const { data, error } = await supabase
        .from('produtos')
        .insert([{
          ...productData,
          salao_id: userData.salao_id,
          ativo: productData.ativo ?? true,
        }])
        .select(`
          *,
          categoria:categorias(id, nome)
        `)
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
      // Buscar o salão do usuário
      const { data: userData } = await supabase
        .from('users')
        .select('salao_id')
        .eq('id', user.id)
        .single();

      if (!userData?.salao_id) throw new Error('Usuário não está associado a um salão');

      // Verificar se código interno já existe (excluindo o produto atual)
      if (updateData.codigo_interno) {
        const { data: existingInternalCode } = await supabase
          .from('produtos')
          .select('id')
          .eq('salao_id', userData.salao_id)
          .eq('codigo_interno', updateData.codigo_interno)
          .eq('ativo', true)
          .neq('id', id)
          .single();

        if (existingInternalCode) {
          throw new Error('Código interno já existe. Por favor, use um código diferente.');
        }
      }

      // Verificar se código de barras já existe (excluindo o produto atual)
      if (updateData.codigo_barras) {
        const { data: existingBarcode } = await supabase
          .from('produtos')
          .select('id')
          .eq('salao_id', userData.salao_id)
          .eq('codigo_barras', updateData.codigo_barras)
          .eq('ativo', true)
          .neq('id', id)
          .single();

        if (existingBarcode) {
          throw new Error('Código de barras já existe. Por favor, use um código diferente.');
        }
      }

      const { data, error } = await supabase
        .from('produtos')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          categoria:categorias(id, nome)
        `)
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


  // Verificar se código interno existe
  const checkInternalCodeExists = async (codigo_interno: string, excludeId?: string) => {
    if (!user || !codigo_interno.trim()) return false;

    const { data: userData } = await supabase
      .from('users')
      .select('salao_id')
      .eq('id', user.id)
      .single();

    if (!userData?.salao_id) return false;

    let query = supabase
      .from('produtos')
      .select('id')
      .eq('salao_id', userData.salao_id)
      .eq('codigo_interno', codigo_interno.trim())
      .eq('ativo', true);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query.single();
    return !!data;
  };

  // Verificar se código de barras existe
  const checkBarcodeExists = async (codigo_barras: string, excludeId?: string) => {
    if (!user || !codigo_barras.trim()) return false;

    const { data: userData } = await supabase
      .from('users')
      .select('salao_id')
      .eq('id', user.id)
      .single();

    if (!userData?.salao_id) return false;

    let query = supabase
      .from('produtos')
      .select('id')
      .eq('salao_id', userData.salao_id)
      .eq('codigo_barras', codigo_barras.trim())
      .eq('ativo', true);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query.single();
    return !!data;
  };

  return {
    products,
    loading,
    error,
    refetch,
    createProduct,
    updateProduct,
    deleteProduct,
    checkInternalCodeExists,
    checkBarcodeExists,
    isCreating: createProduct.isPending,
    isUpdating: updateProduct.isPending,
    isDeleting: deleteProduct.isPending,
  };
}

