import { useState, useEffect } from 'react';
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
  criado_em: string;
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchClients = async (activeOnly: boolean = true) => {
    if (!profile?.salao_id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('salao_id', profile.salao_id)
        .eq('tipo', 'cliente')
        .order('nome');

      if (error) throw error;
      
      const transformedData = data?.map(client => ({
        id: client.id,
        salao_id: client.salao_id,
        nome: client.nome,
        email: client.email || '',
        telefone: client.telefone,
        observacoes: client.observacoes || '',
        criado_em: client.criado_em
      })) || [];
      setClients(transformedData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar clientes"
      });
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (clientData: {
    nome: string;
    email: string;
    telefone?: string;
    observacoes?: string;
  }) => {
    if (!profile?.salao_id) return { error: 'Salon ID não encontrado' };
    try {
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
      
      await fetchClients();
      toast({
        title: "Sucesso",
        description: "Cliente criado com sucesso"
      });
      return { data, error: null };
    } catch (error: any) {
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
      return { data: null, error };
    }
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    try {
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
      
      await fetchClients();
      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso"
      });
      
      return { error: null };
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar cliente"
      });
      return { error };
    }
  };

  const deleteClient = async (id: string) => {
    try {
      // Soft delete: marcar como inativo (se houver campo is_active) ou deletar
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchClients();
      toast({
        title: "Sucesso",
        description: "Cliente removido com sucesso"
      });
      
      return { error: null };
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao remover cliente"
      });
      return { error };
    }
  };

  useEffect(() => {
    if (profile?.salao_id) {
      fetchClients();
    }
  }, [profile?.salao_id]);

  return {
    clients,
    loading,
    createClient,
    updateClient,
    deleteClient,
    refetch: fetchClients,
    fetchClients
  };
}