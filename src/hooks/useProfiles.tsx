import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  name: string;
  role: 'superadmin' | 'admin' | 'profissional' | 'cliente';
  salon_id: string | null;
  salon_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  email?: string; // Vem do auth.users
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile: currentProfile } = useAuth();
  const { toast } = useToast();

  const fetchProfiles = useCallback(async (filters?: {
    role?: string;
    salon_id?: string;
    search?: string;
  }) => {
    if (currentProfile?.role !== 'superadmin') return;
    try {
      setLoading(true);
      let query = supabase
        .from('profiles')
        .select(`
          *,
          salons (
            name
          )
        `)
        .order('created_at', { ascending: false });
      if (filters?.role && filters.role !== 'all') {
        query = query.eq('role', filters.role);
      }
      if (filters?.salon_id && filters.salon_id !== 'all') {
        query = query.eq('salon_id', filters.salon_id);
      }
      const { data, error } = await query;
      if (error) throw error;
      const transformedData = (data || []).map(profile => ({
        id: profile.id,
        name: profile.name,
        role: profile.role,
        salon_id: profile.salon_id,
        salon_name: profile.salons?.name || null,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }));
      let filteredData = transformedData;
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredData = transformedData.filter(profile =>
          profile.name.toLowerCase().includes(searchTerm) ||
          (profile.salon_name && profile.salon_name.toLowerCase().includes(searchTerm))
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
  }, [currentProfile?.role, toast]);

  const updateProfile = async (id: string, data: Partial<Profile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          role: data.role,
          salon_id: data.salon_id,
          phone: data.phone,
          avatar_url: data.avatar_url
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
        .from('profiles')
        .update({ salon_id: null })
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

  return {
    profiles,
    loading,
    fetchProfiles,
    updateProfile,
    deleteProfile,
    refetch: () => fetchProfiles()
  };
} 