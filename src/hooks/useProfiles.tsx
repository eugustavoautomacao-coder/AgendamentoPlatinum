import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  nome: string;
  tipo: 'system_admin' | 'admin' | 'funcionario' | 'cliente';
  salao_id: string | null;
  salao_nome?: string;
  telefone?: string;
  email: string;
  criado_em: string;
}

interface ProfileFilters {
  tipo?: string;
  salao_id?: string;
  search?: string;
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile: currentProfile } = useAuth();
  const { toast } = useToast();

  const fetchProfiles = useCallback(async (filters?: ProfileFilters) => {
    // Apenas SuperAdmin pode ver todos os usuários
    if (currentProfile?.tipo !== 'system_admin') return;
    try {
      setLoading(true);
      let query = supabase
        .from('users')
        .select(`
          *,
          saloes (
            nome
          )
        `)
        .order('criado_em', { ascending: false });
      if (filters?.tipo && filters.tipo !== 'all') {
        query = query.eq('tipo', filters.tipo);
      }
      if (filters?.salao_id && filters.salao_id !== 'all') {
        query = query.eq('salao_id', filters.salao_id);
      }
      const { data, error } = await query;
      if (error) throw error;
      const transformedData = (data || []).map(profile => ({
        id: profile.id,
        nome: profile.nome,
        tipo: profile.tipo,
        salao_id: profile.salao_id,
        salao_nome: profile.saloes?.nome || null,
        telefone: profile.telefone,
        email: profile.email,
        criado_em: profile.criado_em
      }));
      let filteredData = transformedData;
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredData = transformedData.filter(profile =>
          profile.nome.toLowerCase().includes(searchTerm) ||
          (profile.salao_nome && profile.salao_nome.toLowerCase().includes(searchTerm))
        );
      }
      setProfiles(filteredData);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar usuários"
      });
    } finally {
      setLoading(false);
    }
  }, [currentProfile?.tipo, toast]);

  const updateProfile = async (id: string, data: Partial<Profile>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          nome: data.nome,
          tipo: data.tipo,
          salao_id: data.salao_id,
          telefone: data.telefone
        })
        .eq('id', id);
      if (error) throw error;
      await fetchProfiles();
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso"
      });
      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar usuário"
      });
      return { error };
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ salao_id: null })
        .eq('id', id);
      if (error) throw error;
      await fetchProfiles();
      toast({
        title: "Sucesso",
        description: "Usuário removido com sucesso"
      });
      return { error: null };
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao remover usuário"
      });
      return { error };
    }
  };

  const createProfile = async (data: Omit<Profile, 'id' | 'criado_em'>) => {
    try {
      const { error } = await supabase
        .from('users')
        .insert({
          nome: data.nome,
          tipo: data.tipo,
          salao_id: data.salao_id,
          telefone: data.telefone,
          email: data.email
        });
      if (error) throw error;
      await fetchProfiles();
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso"
      });
      return { error: null };
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar usuário"
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return {
    profiles,
    loading,
    fetchProfiles,
    updateProfile,
    deleteProfile,
    createProfile,
    refetch: () => fetchProfiles()
  };
} 