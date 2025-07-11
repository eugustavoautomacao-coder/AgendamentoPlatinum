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
      
      // Primeiro, criar o usuário através do signup normal
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: adminData.email,
        password: adminData.password,
        options: {
          data: {
            name: adminData.name
          }
        }
      });

      console.log('SignUp result:', { signUpData, signUpError });

      if (signUpError) {
        console.error('SignUp error:', signUpError);
        toast({
          variant: "destructive",
          title: "Erro",
          description: `Erro ao criar usuário: ${signUpError.message}`
        });
        return { data: null, error: signUpError };
      }

      if (!signUpData.user) {
        toast({
          variant: "destructive", 
          title: "Erro",
          description: "Falha na criação do usuário"
        });
        return { data: null, error: new Error("User creation failed") };
      }

      // Aguardar para o trigger criar o perfil
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verificar se o perfil foi criado, se não, criar manualmente
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', signUpData.user.id)
        .single();

      if (!existingProfile) {
        console.log('Profile not created by trigger, creating manually');
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: signUpData.user.id,
            name: adminData.name,
            role: 'admin',
            salon_id: salonId,
            phone: adminData.phone || null
          });

        if (createProfileError) {
          console.error('Create profile error:', createProfileError);
          toast({
            variant: "destructive",
            title: "Erro",
            description: `Erro ao criar perfil: ${createProfileError.message}`
          });
          return { data: null, error: createProfileError };
        }
      } else {
        // Atualizar o perfil existente para ser admin do salão
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            salon_id: salonId,
            role: 'admin',
            phone: adminData.phone || null
          })
          .eq('id', signUpData.user.id);

        if (updateError) {
          console.error('Update error:', updateError);
          toast({
            variant: "destructive",
            title: "Erro", 
            description: `Erro ao atualizar perfil: ${updateError.message}`
          });
          return { data: null, error: updateError };
        }
      }

      toast({
        title: "Sucesso",
        description: `Administrador criado com sucesso! Email: ${adminData.email}`
      });
      
      return { data: signUpData.user, error: null };
    } catch (error) {
      console.error('Error creating salon admin:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro inesperado ao criar administrador"
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