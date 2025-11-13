import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Client {
  id: string;
  salao_id: string;
  nome: string;
  email: string;
  telefone?: string;
  observacoes?: string;
  data_nascimento?: string;
  endereco?: string;
  ativo?: boolean;
  total_atendimentos?: number;
  ultimo_atendimento?: string;
  avatar_url?: string;
  criado_em: string;
}

export function useClients() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar clientes
  const {
    data: clients = [],
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['clients', profile?.salao_id],
    queryFn: async (): Promise<Client[]> => {
      if (!profile?.salao_id) return [];
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('salao_id', profile.salao_id)
        .eq('tipo', 'cliente')
        .order('nome');

      if (error) throw error;
      
      return data?.map(client => ({
        id: client.id,
        salao_id: client.salao_id,
        nome: client.nome,
        email: client.email || '',
        telefone: client.telefone,
        observacoes: client.observacoes || '',
        criado_em: client.criado_em
      })) || [];
    },
    enabled: !!profile?.salao_id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Mutation para criar cliente
  const createClientMutation = useMutation({
    mutationFn: async (clientData: {
      nome: string;
      email: string;
      telefone?: string;
      observacoes?: string;
    }) => {
      if (!profile?.salao_id) throw new Error('Salon ID não encontrado');
      
      const { data, error } = await supabase
        .from('users')
        .insert([{
          ...clientData,
          tipo: 'cliente',
          salao_id: profile.salao_id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidar e refetch queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      toast({
        title: "Sucesso",
        description: "Cliente criado com sucesso"
      });
    },
    onError: (error: any) => {
      console.error('Error creating client:', error);
      let description = "Erro ao criar cliente";
      if (error.message?.includes('already been registered')) {
        description = "Já existe um cliente cadastrado com este e-mail.";
      } else if (error.message) {
        description = error.message;
      }
      toast({
        variant: "destructive",
        title: "Erro",
        description
      });
    }
  });

  // Mutation para atualizar cliente
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, clientData }: { id: string; clientData: Partial<Client> }) => {
      const { error } = await supabase
        .from('users')
        .update({
          nome: clientData.nome,
          email: clientData.email,
          telefone: clientData.telefone,
          observacoes: clientData.observacoes
        })
        .eq('id', id);

      if (error) throw error;
      return { id, clientData };
    },
    onSuccess: () => {
      // Invalidar e refetch queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso"
      });
    },
    onError: (error) => {
      console.error('Error updating client:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar cliente"
      });
    }
  });

  // Mutation para deletar cliente
  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      // Invalidar e refetch queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      toast({
        title: "Sucesso",
        description: "Cliente removido com sucesso"
      });
    },
    onError: (error) => {
      console.error('Error deleting client:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao remover cliente"
      });
    }
  });

  return {
    clients,
    loading,
    createClient: createClientMutation.mutateAsync,
    updateClient: (id: string, clientData: Partial<Client>) => 
      updateClientMutation.mutateAsync({ id, clientData }),
    deleteClient: deleteClientMutation.mutateAsync,
    refetch,
    isCreating: createClientMutation.isPending,
    isUpdating: updateClientMutation.isPending,
    isDeleting: deleteClientMutation.isPending
  };
}