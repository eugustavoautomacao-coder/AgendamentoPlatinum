import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Salon {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export function useSalons() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchSalons = async () => {
    if (profile?.role !== 'superadmin') return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('salons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSalons(data || []);
    } catch (error) {
      console.error('Error fetching salons:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar salões"
      });
    } finally {
      setLoading(false);
    }
  };

  const createSalon = async (salonData: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('salons')
        .insert([salonData])
        .select()
        .single();

      if (error) throw error;
      
      await fetchSalons();
      toast({
        title: "Sucesso",
        description: "Salão criado com sucesso"
      });
      
      return { data, error: null };
    } catch (error) {
      console.error('Error creating salon:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar salão"
      });
      return { data: null, error };
    }
  };

  const updateSalon = async (id: string, salonData: Partial<Salon>) => {
    try {
      const { data, error } = await supabase
        .from('salons')
        .update(salonData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchSalons();
      toast({
        title: "Sucesso",
        description: "Salão atualizado com sucesso"
      });
      
      return { data, error: null };
    } catch (error) {
      console.error('Error updating salon:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar salão"
      });
      return { data: null, error };
    }
  };

  const deleteSalon = async (id: string) => {
    try {
      const { error } = await supabase
        .from('salons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchSalons();
      toast({
        title: "Sucesso",
        description: "Salão removido com sucesso"
      });
      
      return { error: null };
    } catch (error) {
      console.error('Error deleting salon:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao remover salão"
      });
      return { error };
    }
  };

  const createSalonAdmin = async (salonId: string, adminData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => {
    try {
      console.log('Creating salon admin:', { salonId, adminEmail: adminData.email });
      
      // Chamar a Edge Function para criar o administrador
      const { data, error } = await supabase.functions.invoke('create-salon-admin', {
        body: { 
          salonId, 
          adminData 
        }
      })

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error)
        toast({
          variant: "destructive",
          title: "Erro",
          description: `Erro na criação do administrador: ${error.message || 'Erro desconhecido'}`
        });
        throw error
      }

      if (data?.error) {
        console.error('Admin creation error:', data.error)
        toast({
          variant: "destructive",
          title: "Erro",
          description: `Erro ao criar administrador: ${data.error}`
        });
        throw new Error(data.error)
      }
      
      if (data?.message) {
        toast({
          title: "Sucesso",
          description: data.message
        });
      }
      
      return { data: data?.user, error: null };
    } catch (error) {
      console.error('Error creating salon admin:', error);
      return { data: null, error };
    }
  };

  useEffect(() => {
    if (profile?.role === 'superadmin') {
      fetchSalons();
    }
  }, [profile?.role]);

  return {
    salons,
    loading,
    createSalon,
    updateSalon,
    deleteSalon,
    createSalonAdmin,
    refetch: fetchSalons
  };
}