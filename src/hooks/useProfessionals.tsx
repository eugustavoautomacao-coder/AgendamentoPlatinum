import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Professional {
  id: string;
  salon_id: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  specialties: string[];
  schedule: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useProfessionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchProfessionals = async () => {
    if (!profile?.salon_id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('professionals')
        .select(`
          *,
          profiles (
            name,
            phone,
            avatar_url
          )
        `)
        .eq('salon_id', profile.salon_id)
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;
      
      const transformedData = data?.map(prof => ({
        id: prof.id,
        salon_id: prof.salon_id,
        name: prof.profiles?.name || '',
        phone: prof.profiles?.phone,
        avatar_url: prof.profiles?.avatar_url,
        specialties: prof.specialties || [],
        schedule: prof.schedule || {},
        is_active: prof.is_active,
        created_at: prof.created_at,
        updated_at: prof.updated_at
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
    name: string;
    email: string;
    phone?: string;
    specialties: string[];
    schedule?: any;
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
      const response = await fetch(`${baseUrl}/create-professional`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          specialties: userData.specialties,
          schedule: userData.schedule,
          salon_id: profile.salon_id
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao criar profissional');

      await fetchProfessionals();
      toast({
        title: "Sucesso",
        description: "Profissional criado com sucesso"
      });
      return { data: result, error: null };
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
        .from('professionals')
        .update({
          specialties: data.specialties,
          schedule: data.schedule
        })
        .eq('id', id);

      if (error) throw error;
      
      // Update profile if needed
      if (data.name || data.phone || data.avatar_url) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: data.name,
            phone: data.phone,
            avatar_url: data.avatar_url
          })
          .eq('id', id);
        if (profileError) throw profileError;
      }
      
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
        .from('professionals')
        .update({ is_active: false })
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
    if (profile?.salon_id) {
      fetchProfessionals();
    }
  }, [profile?.salon_id]);

  return {
    professionals,
    loading,
    createProfessional,
    updateProfessional,
    deleteProfessional,
    refetch: fetchProfessionals
  };
}