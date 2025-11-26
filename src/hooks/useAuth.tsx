import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage, getErrorTitle, isCriticalError } from '@/utils/errorMessages';
import { isMobile, clearAuthData, waitWithTimeout } from '@/utils/mobileUtils';

interface Profile {
  id: string;
  salao_id: string | null;
  nome: string;
  tipo: 'system_admin' | 'admin' | 'funcionario' | 'cliente';
  telefone?: string;
  email: string;
  salao_nome?: string;
  ativo?: boolean;
  cargo?: string;
  percentual_comissao?: number;
  avatar_url?: string;
  criado_em?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refetch = async () => {
    if (!session?.user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*, employees(id, ativo, cargo, percentual_comissao)')
        .eq('id', session.user.id)
        .single();
      
      if (error) throw error;
      
      // Adicionar nome do salão ao perfil e dados do employee
      const employee = (profile as any)?.employees?.[0];
      const profileWithSalon = {
        ...profile,
        salao_nome: (profile as any)?.salao_nome || undefined,
        email: (profile as any)?.email || session.user.email,
        ativo: employee?.ativo ?? true,
        cargo: employee?.cargo || '',
        percentual_comissao: employee?.percentual_comissao || 0
      } as any;
      
      // Log apenas em desenvolvimento e sem dados sensíveis
      if (import.meta.env.DEV) {
        console.log('Profile loaded:', { 
          id: profileWithSalon.id, 
          tipo: profileWithSalon.tipo,
          salao_id: profileWithSalon.salao_id 
        });
      }
      setProfile(profileWithSalon);
    } catch (error) {
      console.error('Error refetching profile:', error);
      // Em caso de erro, não criar profile fake - deixar null para o sistema tratar
      setProfile(null);
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          timeoutId = setTimeout(async () => {
            if (!isMounted) return;
            
            try {
              const { data: profile, error } = await supabase
                .from('users')
                .select('*, employees(id, ativo, cargo, percentual_comissao)')
                .eq('id', session.user.id)
                .single();
              
              if (error) throw error;
              
              if (!isMounted) return;
              
              // Adicionar nome do salão ao perfil e dados do employee
              const employee = (profile as any)?.employees?.[0];
              const profileWithSalon = {
                ...profile,
                salao_nome: (profile as any)?.salao_nome || undefined,
                email: (profile as any)?.email || session.user.email,
                ativo: employee?.ativo ?? true,
                cargo: employee?.cargo || '',
                percentual_comissao: employee?.percentual_comissao || 0
              } as any;
              
              // Log apenas em desenvolvimento e sem dados sensíveis
              if (import.meta.env.DEV) {
                console.log('Profile loaded:', { 
                  id: profileWithSalon.id, 
                  tipo: profileWithSalon.tipo,
                  salao_id: profileWithSalon.salao_id 
                });
              }
              setProfile(profileWithSalon);
            } catch (error) {
              if (!isMounted) return;
              
              console.error('Error fetching profile:', error);
              
              // Se for erro PGRST116 (perfil não encontrado), apenas avisar
              if (error.code === 'PGRST116') {
                console.warn('Usuário autenticado mas sem perfil na tabela users. Aguardando criação automática...');
                // Não criar profile fake - o sistema não funciona sem salao_id
                setProfile(null);
              } else {
                console.error('Erro ao carregar perfil do usuário:', error);
                // Não criar profile fake - deixar null para o sistema tratar o erro
                setProfile(null);
              }
            }
          }, 0);
        } else {
          if (isMounted) {
            setProfile(null);
          }
        }
        
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []); // Remover dependência toast

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        const errorMessage = getErrorMessage(error);
        const errorTitle = getErrorTitle(error);
        const critical = isCriticalError(error);
        
        toast({
          variant: "destructive",
          title: errorTitle,
          description: errorMessage,
        className: critical ? 'toast-error-gradient' : 'toast-orange-gradient'
        });
      }
      
      return { error };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      const errorTitle = getErrorTitle(error);
      
      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorMessage,
        className: 'toast-error-gradient'
      });
      
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name
          }
        }
      });
      
      if (error) {
        const errorMessage = getErrorMessage(error);
        const errorTitle = getErrorTitle(error);
        const critical = isCriticalError(error);
        
        toast({
          variant: "destructive",
          title: errorTitle,
          description: errorMessage,
        className: critical ? 'toast-error-gradient' : 'toast-orange-gradient'
        });
      }
      
      return { error };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      const errorTitle = getErrorTitle(error);
      
      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorMessage,
        className: 'toast-error-gradient'
      });
      
      return { error };
    }
  };

  const signOut = async () => {
    const isMobileDevice = isMobile();
    const timeoutMs = isMobileDevice ? 3000 : 5000; // Timeout menor no mobile
    
    try {
      // Primeiro, limpar dados locais imediatamente para melhor UX
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // Limpar dados de autenticação de forma robusta
      clearAuthData();
      
      // Tentar logout do Supabase com timeout adaptativo
      try {
        const { error } = await waitWithTimeout(
          supabase.auth.signOut({ scope: 'local' }),
          timeoutMs
        );
        
        if (error) {
          // Verificar se é erro de sessão não encontrada (comum no mobile)
          if (error.message?.includes('Session not found') || 
              error.message?.includes('session id') ||
              error.message?.includes('doesn\'t exist')) {
            console.info('Sessão já expirada (comportamento esperado no mobile):', error.message);
            // Sessão já expirada - isso é normal e esperado
          } else {
            console.warn('Erro no logout do Supabase (continuando):', error);
          }
        }
        
        toast({
          title: "Logout realizado com sucesso!",
          description: "Você foi desconectado com segurança.",
          className: 'toast-success-gradient'
        });
        
      } catch (timeoutError) {
        console.warn('Timeout no logout do Supabase (continuando):', timeoutError);
        
        // Mesmo com timeout, consideramos o logout bem-sucedido
        // pois já limpamos os dados locais
        toast({
          title: "Logout realizado com sucesso!",
          description: isMobileDevice 
            ? "Você foi desconectado. Recarregue a página se necessário."
            : "Você foi desconectado com segurança.",
          className: 'toast-success-gradient'
        });
      }
      
    } catch (error) {
      console.error('Erro inesperado ao fazer logout:', error);
      
      // Mesmo com erro, tentamos limpar os dados locais
      setUser(null);
      setProfile(null);
      setSession(null);
      clearAuthData();
      
      toast({
        variant: "destructive",
        title: "Logout parcial",
        description: isMobileDevice 
          ? "Logout realizado localmente. Recarregue a página."
          : "Logout realizado localmente. Recarregue a página se necessário.",
        className: 'toast-orange-gradient'
      });
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}