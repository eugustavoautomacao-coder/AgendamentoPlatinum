import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Service {
  id: string;
  salao_id: string;
  nome: string;
  descricao?: string;
  duracao_minutos: number;
  preco: number;
  categoria?: string;
  observacao?: string;
  taxa_custo_tipo?: 'fixo' | 'percentual';
  taxa_custo_valor?: number;
  ativo?: boolean;
  criado_em: string;
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchServices = async () => {
    // Se não houver profile ainda, aguardar
    if (!profile) {
      setLoading(true);
      return;
    }
    
    // Se não houver salao_id, mostrar erro e finalizar loading
    if (!profile.salao_id) {
      setLoading(false);
      setServices([]);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Salão não encontrado. Verifique se você está vinculado a um salão."
      });
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('salao_id', profile.salao_id)
        .order('nome');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar serviços"
      });
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const createService = async (serviceData: Omit<Service, 'id' | 'salao_id' | 'criado_em'>) => {
    if (!profile?.salao_id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Salão não encontrado. Verifique se você está vinculado a um salão."
      });
      return { data: null, error: 'Salon ID não encontrado' };
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .insert([{ ...serviceData, salao_id: profile.salao_id }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchServices();
      toast({
        title: "Sucesso",
        description: "Serviço criado com sucesso"
      });
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating service:', error);
      const errorMessage = error?.message || 'Erro ao criar serviço';
      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage
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
        .delete()
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
    // Aguardar o profile carregar antes de buscar serviços
    if (profile !== undefined) {
      fetchServices();
    }
  }, [profile?.salao_id]);

  return {
    services,
    loading,
    createService,
    updateService,
    deleteService,
    refetch: fetchServices
  };
}