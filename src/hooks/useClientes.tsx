import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Cliente {
  id: string;
  salao_id: string;
  nome: string;
  email: string;
  telefone: string;
  senha_temporaria: boolean;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  ultimo_login?: string;
}

export interface CreateClienteData {
  salao_id: string;
  nome: string;
  email: string;
  telefone: string;
  senha_hash: string;
}

export const useClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar clientes do salão
  const loadClientes = async (salaoId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('salao_id', salaoId)
        .order('criado_em', { ascending: false });

      if (error) throw error;

      setClientes(data || []);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setError('Erro ao carregar clientes');
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  // Criar novo cliente
  const createCliente = async (clienteData: CreateClienteData): Promise<Cliente | null> => {
    try {
      setLoading(true);
      setError(null);

      // Garantir defaults para campos NOT NULL
      const payload: CreateClienteData = {
        salao_id: clienteData.salao_id,
        nome: clienteData.nome,
        email: clienteData.email,
        telefone: clienteData.telefone || 'Não informado',
        senha_hash: clienteData.senha_hash || 'senha123'
      };

      const { data, error } = await supabase
        .from('clientes')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      toast.success('Cliente criado com sucesso!');
      return data;
    } catch (err) {
      console.error('Erro ao criar cliente:', err);
      setError('Erro ao criar cliente');
      toast.error('Erro ao criar cliente');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Verificar se cliente já existe
  const checkClienteExists = async (salaoId: string, email: string): Promise<Cliente | null> => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('salao_id', salaoId)
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

      return data;
    } catch (err) {
      console.error('Erro ao verificar cliente:', err);
      return null;
    }
  };

  // Atualizar senha do cliente
  const updateClienteSenha = async (clienteId: string, novaSenhaHash: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('clientes')
        .update({ 
          senha_hash: novaSenhaHash,
          senha_temporaria: false,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', clienteId);

      if (error) throw error;

      toast.success('Senha atualizada com sucesso!');
      return true;
    } catch (err) {
      console.error('Erro ao atualizar senha:', err);
      setError('Erro ao atualizar senha');
      toast.error('Erro ao atualizar senha');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar último login
  const updateUltimoLogin = async (clienteId: string): Promise<void> => {
    try {
      await supabase
        .from('clientes')
        .update({ ultimo_login: new Date().toISOString() })
        .eq('id', clienteId);
    } catch (err) {
      console.error('Erro ao atualizar último login:', err);
    }
  };

  // Desativar cliente
  const desativarCliente = async (clienteId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('clientes')
        .update({ ativo: false })
        .eq('id', clienteId);

      if (error) throw error;

      toast.success('Cliente desativado com sucesso!');
      return true;
    } catch (err) {
      console.error('Erro ao desativar cliente:', err);
      setError('Erro ao desativar cliente');
      toast.error('Erro ao desativar cliente');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    clientes,
    loading,
    error,
    loadClientes,
    createCliente,
    checkClienteExists,
    updateClienteSenha,
    updateUltimoLogin,
    desativarCliente
  };
};
