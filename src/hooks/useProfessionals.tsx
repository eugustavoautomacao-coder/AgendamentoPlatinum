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
  percentual_comissao?: number;
  ativo?: boolean;
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
        .select(`
          *,
          users(avatar_url)
        `)
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
        percentual_comissao: prof.percentual_comissao,
        ativo: prof.ativo,
        avatar_url: prof.users?.avatar_url || null,
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
    senha: string;
    telefone?: string;
    cargo?: string;
    percentual_comissao?: number;
  }) => {
    if (!profile?.salao_id) return { error: 'Salon ID não encontrado' };

    try {
      // Obter token de autenticação do usuário logado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      // Chamar Edge Function para criar profissional com autenticação
      const functionsUrl = 'https://lbpqmdcmoybuuthzezmj.supabase.co/functions/v1/create-professional';
      
      const response = await fetch(functionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: userData.nome,
          email: userData.email,
          password: userData.senha,
          phone: userData.telefone || 'Não informado',
          salon_id: profile.salao_id,
          cargo: userData.cargo || 'Profissional',
          percentual_comissao: userData.percentual_comissao || 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar profissional');
      }

      const result = await response.json();
      
      await fetchProfessionals();
      toast({
        title: "Sucesso",
        description: "Profissional criado com sucesso! Credenciais enviadas por email."
      });
      return { data: result, error: null };
    } catch (error: any) {
      console.error('Error creating professional:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao criar profissional"
      });
      return { data: null, error };
    }
  };

  const updateProfessional = async (id: string, data: Partial<Professional>) => {
    try {
      // Criar objeto de atualização apenas com campos fornecidos
      const updateData: any = {};
      
      if (data.nome !== undefined) updateData.nome = data.nome;
      if (data.telefone !== undefined) updateData.telefone = data.telefone;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.cargo !== undefined) updateData.cargo = data.cargo;
      if (data.percentual_comissao !== undefined) updateData.percentual_comissao = data.percentual_comissao;
      if (data.ativo !== undefined) updateData.ativo = data.ativo;
      if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;

      const { error } = await supabase
        .from('employees')
        .update(updateData)
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