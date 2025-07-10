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
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: adminData.email,
        password: adminData.password,
        user_metadata: {
          name: adminData.name
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Usuário não criado');

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          salon_id: salonId,
          role: 'admin',
          phone: adminData.phone
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;
      
      toast({
        title: "Sucesso",
        description: "Administrador criado com sucesso"
      });
      
      return { data: authData.user, error: null };
    } catch (error) {
      console.error('Error creating salon admin:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar administrador"
      });
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