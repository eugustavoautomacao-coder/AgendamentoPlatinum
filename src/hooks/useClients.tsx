import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Client {
  id: string;
  salon_id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchClients = async () => {
    if (!profile?.salon_id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('salon_id', profile.salon_id)
        .eq('role', 'cliente')
        .order('name');

      if (error) throw error;
      
      const transformedData = data?.map(client => ({
        id: client.id,
        salon_id: client.salon_id,
        name: client.name,
        email: client.email || '',
        phone: client.phone,
        avatar_url: client.avatar_url,
        observacoes: client.observacoes || '',
        created_at: client.created_at,
        updated_at: client.updated_at
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
    name: string;
    email: string;
    phone?: string;
    observacoes?: string;
    avatar_url?: string;
  }) => {
    if (!profile?.salon_id) return { error: 'Salon ID não encontrado' };
    try {
      // Obter token do usuário logado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Usuário não autenticado"
        });
        return { data: null, error: 'Usuário não autenticado' };
      }
      // Determinar URL base das funções
      const baseUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || '/functions/v1';
      const response = await fetch(`${baseUrl}/create-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          observacoes: clientData.observacoes,
          avatar_url: clientData.avatar_url,
          salon_id: profile.salon_id
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao criar cliente');
      await fetchClients();
      toast({
        title: "Sucesso",
        description: "Cliente criado com sucesso"
      });
      return { data: result, error: null };
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
        .from('profiles')
        .update({
          name: clientData.name,
          email: clientData.email, // garantir atualização do email
          phone: clientData.phone,
          observacoes: clientData.observacoes,
          avatar_url: clientData.avatar_url
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
      // Instead of deleting, we could deactivate or remove salon association
      const { error } = await supabase
        .from('profiles')
        .update({ salon_id: null })
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
    if (profile?.salon_id) {
      fetchClients();
    }
  }, [profile?.salon_id]);

  return {
    clients,
    loading,
    createClient,
    updateClient,
    deleteClient,
    refetch: fetchClients
  };
}