import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Professional {
  id: string;
  salao_id: string;
  nome: string;
  telefone?: string;
  email?: string;
  cargo?: string;
  avatar_url?: string;
  criado_em: string;
}

export function useProfessionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchProfessionals = async () => {
    if (!profile?.salao_id) {
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('salao_id', profile.salao_id)
        .order('criado_em');

      if (error) throw error;
      
      const transformedData = data?.map(prof => ({
        id: prof.id,
        salao_id: prof.salao_id,
        nome: prof.nome || '',
        telefone: prof.telefone,
        email: prof.email,
        cargo: prof.cargo,
        avatar_url: prof.avatar_url,
        criado_em: prof.criado_em
      })) || [];
      
      setProfessionals(transformedData);
    } catch (error) {
      console.error('Error fetching professionals:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar profissionais"
      });
    } finally {
      setLoading(false);
    }
  };

  const createProfessional = async (userData: {
    nome: string;
    email: string;
    telefone?: string;
    cargo?: string;
  }) => {
    if (!profile?.salao_id) return { error: 'Salon ID não encontrado' };

    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          ...userData,
          salao_id: profile.salao_id
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchProfessionals();
      toast({
        title: "Sucesso",
        description: "Profissional criado com sucesso"
      });
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating professional:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar profissional"
      });
      return { data: null, error };
    }
  };

  const updateProfessional = async (id: string, data: Partial<Professional>) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          nome: data.nome,
          telefone: data.telefone,
          email: data.email,
          cargo: data.cargo,
          avatar_url: data.avatar_url
        })
        .eq('id', id);

      if (error) throw error;
      
      await fetchProfessionals();
      toast({
        title: "Sucesso",
        description: "Profissional atualizado com sucesso"
      });
      
      return { error: null };
    } catch (error) {
      console.error('Error updating professional:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar profissional"
      });
      return { error };
    }
  };

  const deleteProfessional = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchProfessionals();
      toast({
        title: "Sucesso",
        description: "Profissional removido com sucesso"
      });
      
      return { error: null };
    } catch (error) {
      console.error('Error deleting professional:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao remover profissional"
      });
      return { error };
    }
  };

  useEffect(() => {
    if (profile?.salao_id) {
      fetchProfessionals();
    }
  }, [profile?.salao_id]);

  return {
    professionals,
    loading,
    createProfessional,
    updateProfessional,
    deleteProfessional,
    refetch: fetchProfessionals
  };
}