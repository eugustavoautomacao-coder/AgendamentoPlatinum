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
        email: '', // Email comes from auth.users which we can't query directly
        phone: client.phone,
        avatar_url: client.avatar_url,
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
  }) => {
    if (!profile?.salon_id) return { error: 'Salon ID não encontrado' };

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: clientData.email,
        password: Math.random().toString(36).slice(-8), // Temporary password
        user_metadata: {
          name: clientData.name
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Usuário não criado');

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          salon_id: profile.salon_id,
          role: 'cliente',
          phone: clientData.phone
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;
      
      await fetchClients();
      toast({
        title: "Sucesso",
        description: "Cliente criado com sucesso"
      });
      
      return { data: authData.user, error: null };
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar cliente"
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
          phone: clientData.phone
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