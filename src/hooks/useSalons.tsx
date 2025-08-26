import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Salon {
  id: string;
  nome: string;
  email?: string;
  cnpj?: string;
  telefone?: string;
  endereco?: string;
  working_hours?: Record<string, { open: string; close: string; active: boolean }>;
  created_at: string;
  // Compat: alguns componentes ainda usam `name`
  name?: string;
}

export function useSalons() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchSalons = async () => {
    // Apenas system_admin acessa; se não for, finalize o loading para não travar a UI
    if (profile?.tipo !== 'system_admin') {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saloes')
        .select('id, nome, email, cnpj, telefone, endereco, working_hours, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Adiciona alias `name` para compatibilidade com componentes antigos
      const normalized = (data || []).map((s: any) => ({ ...s, name: s.nome }));
      setSalons(normalized);
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
    nome: string;
    email?: string;
    cnpj?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('saloes')
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
        .from('saloes')
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
      // Primeiro, verificar se há usuários vinculados ao salão
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, nome, tipo')
        .eq('salao_id', id);

      if (usersError) {
        throw new Error('Erro ao verificar usuários vinculados');
      }

      if (users && users.length > 0) {
        const userTypes = users.map(u => u.tipo).join(', ');
        throw new Error(`Não é possível excluir o salão. Existem ${users.length} usuário(s) vinculado(s): ${userTypes}`);
      }

      // Verificar se há funcionários vinculados
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, nome')
        .eq('salao_id', id);

      if (employeesError) {
        throw new Error('Erro ao verificar funcionários vinculados');
      }

      if (employees && employees.length > 0) {
        throw new Error(`Não é possível excluir o salão. Existem ${employees.length} funcionário(s) vinculado(s)`);
      }

      // Verificar se há serviços vinculados
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, nome')
        .eq('salao_id', id);

      if (servicesError) {
        throw new Error('Erro ao verificar serviços vinculados');
      }

      if (services && services.length > 0) {
        throw new Error(`Não é possível excluir o salão. Existem ${services.length} serviço(s) vinculado(s)`);
      }

      // Se não há dependências, tentar excluir
      const { error } = await supabase
        .from('saloes')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === '23503') {
          throw new Error('Não é possível excluir o salão. Existem registros vinculados.');
        }
        throw error;
      }

      await fetchSalons();
      toast({
        title: "Sucesso",
        description: "Salão removido com sucesso"
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting salon:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao remover salão';
      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage
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

      // Verificar se o usuário foi criado, se não, criar manualmente
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', signUpData.user.id)
        .single();

      if (!existingUser) {
        console.log('User not created by trigger, creating manually');
        const { error: createUserError } = await supabase
          .from('users')
          .insert({
            id: signUpData.user.id,
            nome: adminData.name,
            tipo: 'admin',
            salao_id: salonId,
            telefone: adminData.phone || null,
            email: adminData.email
          });

        if (createUserError) {
          console.error('Create user error:', createUserError);
          toast({
            variant: "destructive",
            title: "Erro",
            description: `Erro ao criar usuário: ${createUserError.message}`
          });
          return { data: null, error: createUserError };
        }
      } else {
        // Atualizar o usuário existente para ser admin do salão
        const { error: updateError } = await supabase
          .from('users')
          .update({
            salao_id: salonId,
            tipo: 'admin',
            telefone: adminData.phone || null
          })
          .eq('id', signUpData.user.id);

        if (updateError) {
          console.error('Update error:', updateError);
          toast({
            variant: "destructive",
            title: "Erro", 
            description: `Erro ao atualizar usuário: ${updateError.message}`
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
    if (profile?.tipo === 'system_admin') {
      fetchSalons();
    } else {
      // Evita travar a tela de dashboard quando o perfil ainda não carregou
      setLoading(false);
    }
  }, [profile?.tipo]);

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