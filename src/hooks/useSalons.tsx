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
  working_hours?: any;
  created_at: string;
  // Compat: alguns componentes ainda usam `name`
  name?: string;
}

// Lista de serviços padrão para salões de beleza
export const DEFAULT_SERVICES = [
  // Cabelo
  { nome: 'Corte Feminino', descricao: 'Corte de cabelo para mulheres', duracao_minutos: 60, preco: 45.00, categoria: 'Cabelo', observacao: 'Inclui lavagem, corte e finalização' },
  { nome: 'Corte Masculino', descricao: 'Corte de cabelo para homens', duracao_minutos: 45, preco: 35.00, categoria: 'Cabelo', observacao: 'Inclui lavagem, corte e finalização' },
  { nome: 'Escova', descricao: 'Escova no cabelo', duracao_minutos: 60, preco: 40.00, categoria: 'Cabelo', observacao: 'Escova com produto de finalização' },
  { nome: 'Escova Progressiva', descricao: 'Escova progressiva', duracao_minutos: 120, preco: 120.00, categoria: 'Cabelo', observacao: 'Tratamento alisante sem formol, durabilidade de até 3 meses' },
  { nome: 'Escova Definida', descricao: 'Escova para cabelos crespos/cacheados', duracao_minutos: 90, preco: 80.00, categoria: 'Cabelo', observacao: 'Definição de cachos com produtos específicos' },
  { nome: 'Hidratação', descricao: 'Tratamento hidratante', duracao_minutos: 60, preco: 50.00, categoria: 'Cabelo', observacao: 'Hidratação profunda com máscara capilar' },
  { nome: 'Coloração', descricao: 'Coloração de cabelo', duracao_minutos: 120, preco: 100.00, categoria: 'Cabelo', observacao: 'Coloração completa com produto profissional' },
  { nome: 'Mechas', descricao: 'Aplicação de mechas', duracao_minutos: 150, preco: 150.00, categoria: 'Cabelo', observacao: 'Mechas californianas ou tradicionais' },
  { nome: 'Retoque de Raiz', descricao: 'Retoque de cor na raiz', duracao_minutos: 90, preco: 80.00, categoria: 'Cabelo', observacao: 'Apenas retoque na raiz, não inclui pontas' },
  { nome: 'Pintura', descricao: 'Pintura completa do cabelo', duracao_minutos: 120, preco: 120.00, categoria: 'Cabelo', observacao: 'Pintura completa incluindo raiz e pontas' },
  
  // Unhas
  { nome: 'Manicure', descricao: 'Manicure básica', duracao_minutos: 45, preco: 25.00, categoria: 'Unhas', observacao: 'Cutilagem, lixamento e esmaltação' },
  { nome: 'Pedicure', descricao: 'Pedicure básica', duracao_minutos: 45, preco: 30.00, categoria: 'Unhas', observacao: 'Cutilagem, lixamento, esfoliação e esmaltação' },
  { nome: 'Manicure + Pedicure', descricao: 'Manicure e pedicure', duracao_minutos: 90, preco: 50.00, categoria: 'Unhas', observacao: 'Combo completo de mãos e pés' },
  { nome: 'Unha Postiça', descricao: 'Aplicação de unha postiça', duracao_minutos: 60, preco: 40.00, categoria: 'Unhas', observacao: 'Aplicação de unha postiça com cola especial' },
  { nome: 'Alongamento de Unha', descricao: 'Alongamento com gel ou acrílico', duracao_minutos: 90, preco: 80.00, categoria: 'Unhas', observacao: 'Alongamento com gel UV ou acrílico' },
  { nome: 'Manutenção de Unha', descricao: 'Manutenção de unha alongada', duracao_minutos: 60, preco: 50.00, categoria: 'Unhas', observacao: 'Manutenção de unhas alongadas (preenchimento)' },
  { nome: 'Decoração de Unha', descricao: 'Decoração especial nas unhas', duracao_minutos: 30, preco: 20.00, categoria: 'Unhas', observacao: 'Decoração com strass, adesivos ou desenhos' },
  
  // Maquiagem
  { nome: 'Maquiagem Social', descricao: 'Maquiagem para eventos sociais', duracao_minutos: 60, preco: 60.00, categoria: 'Maquiagem', observacao: 'Maquiagem completa para eventos sociais' },
  { nome: 'Maquiagem Festa', descricao: 'Maquiagem para festas', duracao_minutos: 90, preco: 80.00, categoria: 'Maquiagem', observacao: 'Maquiagem glamour para festas e eventos especiais' },
  { nome: 'Maquiagem Noiva', descricao: 'Maquiagem para noivas', duracao_minutos: 120, preco: 150.00, categoria: 'Maquiagem', observacao: 'Maquiagem especial para noivas com produtos à prova d\'água' },
  { nome: 'Maquiagem Simples', descricao: 'Maquiagem básica', duracao_minutos: 30, preco: 35.00, categoria: 'Maquiagem', observacao: 'Maquiagem básica para o dia a dia' },
  
  // Depilação
  { nome: 'Depilação Cera', descricao: 'Depilação com cera', duracao_minutos: 30, preco: 25.00, categoria: 'Depilação', observacao: 'Depilação com cera quente ou fria' },
  { nome: 'Depilação Linha', descricao: 'Depilação da linha do biquíni', duracao_minutos: 20, preco: 20.00, categoria: 'Depilação', observacao: 'Depilação da linha do biquíni com linha' },
  { nome: 'Depilação Axila', descricao: 'Depilação das axilas', duracao_minutos: 15, preco: 15.00, categoria: 'Depilação', observacao: 'Depilação das axilas com cera' },
  { nome: 'Depilação Perna', descricao: 'Depilação das pernas', duracao_minutos: 45, preco: 40.00, categoria: 'Depilação', observacao: 'Depilação completa das pernas' },
  { nome: 'Depilação Braço', descricao: 'Depilação dos braços', duracao_minutos: 30, preco: 25.00, categoria: 'Depilação', observacao: 'Depilação dos braços com cera' },
  
  // Tratamentos Faciais
  { nome: 'Limpeza de Pele', descricao: 'Limpeza facial profunda', duracao_minutos: 60, preco: 70.00, categoria: 'Tratamento Facial', observacao: 'Limpeza profunda com extração de cravos e espinhas' },
  { nome: 'Peeling', descricao: 'Tratamento de peeling', duracao_minutos: 45, preco: 60.00, categoria: 'Tratamento Facial', observacao: 'Peeling químico para renovação celular' },
  { nome: 'Hidratação Facial', descricao: 'Hidratação da pele do rosto', duracao_minutos: 45, preco: 50.00, categoria: 'Tratamento Facial', observacao: 'Hidratação profunda com máscara facial' },
  { nome: 'Máscara Facial', descricao: 'Aplicação de máscara facial', duracao_minutos: 30, preco: 40.00, categoria: 'Tratamento Facial', observacao: 'Aplicação de máscara facial específica para o tipo de pele' },
  
  // Sombrancelhas
  { nome: 'Design de Sombrancelha', descricao: 'Design e modelagem de sombrancelha', duracao_minutos: 30, preco: 25.00, categoria: 'Sombrancelhas', observacao: 'Design e modelagem com pinça ou cera' },
  { nome: 'Henna Sombrancelha', descricao: 'Aplicação de henna na sombrancelha', duracao_minutos: 45, preco: 35.00, categoria: 'Sombrancelhas', observacao: 'Henna para colorir e definir as sombrancelhas' },
  { nome: 'Micropigmentação', descricao: 'Micropigmentação de sombrancelha', duracao_minutos: 120, preco: 200.00, categoria: 'Sombrancelhas', observacao: 'Micropigmentação fio a fio ou pó compacto' },
  
  // Outros
  { nome: 'Penteado', descricao: 'Penteado para eventos', duracao_minutos: 60, preco: 50.00, categoria: 'Penteado', observacao: 'Penteado especial para eventos e festas' },
  { nome: 'Penteado Noiva', descricao: 'Penteado para noivas', duracao_minutos: 90, preco: 120.00, categoria: 'Penteado', observacao: 'Penteado especial para noivas com acessórios' },
  { nome: 'Lavagem', descricao: 'Lavagem e finalização', duracao_minutos: 30, preco: 25.00, categoria: 'Cabelo', observacao: 'Lavagem com shampoo e condicionador profissional' },
  { nome: 'Secagem', descricao: 'Secagem e finalização', duracao_minutos: 30, preco: 20.00, categoria: 'Cabelo', observacao: 'Secagem com secador e finalização com produtos' }
];

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

  // Função para criar serviços padrão para um salão
  const createDefaultServices = async (salonId: string) => {
    try {
      const servicesToInsert = DEFAULT_SERVICES.map(service => ({
        ...service,
        salao_id: salonId
      }));

      const { error } = await supabase
        .from('services')
        .insert(servicesToInsert);

      if (error) {
        console.error('Error creating default services:', error);
        throw error;
      }

      console.log(`Created ${DEFAULT_SERVICES.length} default services for salon ${salonId}`);
    } catch (error) {
      console.error('Error in createDefaultServices:', error);
      // Não vamos falhar a criação do salão se os serviços padrão falharem
      // Apenas logamos o erro
    }
  };

  // Função para adicionar serviços padrão a um salão existente
  const addDefaultServicesToExistingSalon = async (salonId: string) => {
    try {
      // Verificar se já existem serviços para este salão
      const { data: existingServices, error: checkError } = await supabase
        .from('services')
        .select('id')
        .eq('salao_id', salonId)
        .limit(1);

      if (checkError) throw checkError;

      if (existingServices && existingServices.length > 0) {
        toast({
          title: "Aviso",
          description: "Este salão já possui serviços cadastrados. Os serviços padrão não serão adicionados."
        });
        return { success: false, message: "Salão já possui serviços" };
      }

      // Adicionar serviços padrão
      await createDefaultServices(salonId);
      
      toast({
        title: "Sucesso",
        description: `${DEFAULT_SERVICES.length} serviços padrão adicionados ao salão`
      });
      
      return { success: true, message: `${DEFAULT_SERVICES.length} serviços adicionados` };
    } catch (error) {
      console.error('Error adding default services to existing salon:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao adicionar serviços padrão"
      });
      return { success: false, error };
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
      
      // Criar serviços padrão para o novo salão
      if (data) {
        await createDefaultServices(data.id);
      }
      
      await fetchSalons();
      toast({
        title: "Sucesso",
        description: "Salão criado com sucesso com serviços padrão"
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
      const { error } = await supabase
        .from('saloes')
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
      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      // Chamar Edge Function para criar admin do salão
      const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-salon-admin`;
      
      const response = await fetch(functionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          salonId: salonId,
          adminData: {
            name: adminData.name,
            email: adminData.email,
            password: adminData.password,
            phone: adminData.phone
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      toast({
        title: "Sucesso",
        description: `Administrador criado com sucesso! Email: ${adminData.email}`
      });
      
      return { data: result.user, error: null };
    } catch (error: any) {
      console.error('Error creating salon admin:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro inesperado ao criar administrador"
      });
      return { data: null, error };
    }
  };

  useEffect(() => {
    if (profile?.tipo === 'system_admin') {
      fetchSalons();
    }
  }, [profile?.tipo]);

  return {
    salons,
    loading,
    createSalon,
    updateSalon,
    deleteSalon,
    createSalonAdmin,
    addDefaultServicesToExistingSalon,
    refetch: fetchSalons
  };
}