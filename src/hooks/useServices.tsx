import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Service {
  id: string;
  salon_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  base_price: number;
  tax_machine: number;
  tax_product: number;
  tax_other: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchServices = async () => {
    if (!profile?.salon_id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', profile.salon_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar serviços"
      });
    } finally {
      setLoading(false);
    }
  };

  const createService = async (serviceData: Omit<Service, 'id' | 'salon_id' | 'created_at' | 'updated_at'>) => {
    if (!profile?.salon_id) return { error: 'Salon ID não encontrado' };

    try {
      const { data, error } = await supabase
        .from('services')
        .insert([{ ...serviceData, salon_id: profile.salon_id }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchServices();
      toast({
        title: "Sucesso",
        description: "Serviço criado com sucesso"
      });
      
      return { data, error: null };
    } catch (error) {
      console.error('Error creating service:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar serviço"
      });
      return { data: null, error };
    }
  };

  const updateService = async (id: string, serviceData: Partial<Service>) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchServices();
      toast({
        title: "Sucesso",
        description: "Serviço atualizado com sucesso"
      });
      
      return { data, error: null };
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar serviço"
      });
      return { data: null, error };
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      
      await fetchServices();
      toast({
        title: "Sucesso",
        description: "Serviço removido com sucesso"
      });
      
      return { error: null };
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao remover serviço"
      });
      return { error };
    }
  };

  useEffect(() => {
    if (profile?.salon_id) {
      fetchServices();
    }
  }, [profile?.salon_id]);

  return {
    services,
    loading,
    createService,
    updateService,
    deleteService,
    refetch: fetchServices
  };
}