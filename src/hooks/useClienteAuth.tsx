import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Cliente } from './useClientes';

interface ClienteAuthContextType {
  cliente: Cliente | null;
  loading: boolean;
  login: (email: string, senha: string, salaoId: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const ClienteAuthContext = createContext<ClienteAuthContextType | undefined>(undefined);

export const useClienteAuth = () => {
  const context = useContext(ClienteAuthContext);
  if (!context) {
    throw new Error('useClienteAuth deve ser usado dentro de ClienteAuthProvider');
  }
  return context;
};

export const useClienteAuthProvider = () => {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar se há cliente logado no localStorage
  useEffect(() => {
    const checkStoredCliente = () => {
      try {
        const storedCliente = localStorage.getItem('cliente_auth');
        if (storedCliente) {
          const clienteData = JSON.parse(storedCliente);
          setCliente(clienteData);
        }
      } catch (error) {
        console.error('Erro ao verificar cliente armazenado:', error);
        localStorage.removeItem('cliente_auth');
      } finally {
        setLoading(false);
      }
    };

    checkStoredCliente();
  }, []);

  // Login do cliente
  const login = async (email: string, senha: string, salaoId: string): Promise<boolean> => {
    try {
      setLoading(true);

      // Buscar cliente no banco
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('salao_id', salaoId)
        .eq('email', email)
        .eq('ativo', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast.error('Cliente não encontrado');
          return false;
        }
        throw error;
      }

      // Verificar senha (simplificado - em produção usar bcrypt)
      if (data.senha_hash !== senha) {
        toast.error('Senha incorreta');
        return false;
      }

      // Atualizar último login
      await supabase
        .from('clientes')
        .update({ ultimo_login: new Date().toISOString() })
        .eq('id', data.id);

      // Armazenar no localStorage
      localStorage.setItem('cliente_auth', JSON.stringify(data));
      setCliente(data);

      toast.success('Login realizado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro ao fazer login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout do cliente
  const logout = () => {
    localStorage.removeItem('cliente_auth');
    setCliente(null);
    toast.success('Logout realizado com sucesso!');
  };

  const isAuthenticated = !!cliente;

  return {
    cliente,
    loading,
    login,
    logout,
    isAuthenticated
  };
};

// Provider para o contexto
export const ClienteAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useClienteAuthProvider();

  return (
    <ClienteAuthContext.Provider value={auth}>
      {children}
    </ClienteAuthContext.Provider>
  );
};
