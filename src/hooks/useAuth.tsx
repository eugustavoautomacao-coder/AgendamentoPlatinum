import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage, getErrorTitle, isCriticalError } from '@/utils/errorMessages';

interface Profile {
  id: string;
  salao_id: string | null;
  nome: string;
  tipo: 'system_admin' | 'admin' | 'funcionario' | 'cliente';
  telefone?: string;
  email: string;
  salao_nome?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
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
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) throw error;
      
      // Adicionar nome do salão ao perfil
      const profileWithSalon = {
        ...profile,
        salao_nome: (profile as any)?.salao_nome || undefined,
        email: (profile as any)?.email || session.user.email
      } as any;
      
      setProfile(profileWithSalon);
    } catch (error) {
      console.error('Error refetching profile:', error);
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
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (error) throw error;
              
              if (!isMounted) return;
              
              // Adicionar nome do salão ao perfil
              const profileWithSalon = {
                ...profile,
                salao_nome: (profile as any)?.salao_nome || undefined,
                email: (profile as any)?.email || session.user.email
              } as any;
              
              setProfile(profileWithSalon);
            } catch (error) {
              if (!isMounted) return;
              
              console.error('Error fetching profile:', error);
              
              // Se for erro PGRST116 (perfil não encontrado), apenas avisar
              if (error.code === 'PGRST116') {
                console.warn('Usuário autenticado mas sem perfil na tabela users. Aguardando criação automática...');
                setProfile(null);
              } else {
                console.error('Erro ao carregar perfil do usuário:', error);
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
          className: critical 
            ? 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20'
            : 'border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20'
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
        className: 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20'
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
          className: critical 
            ? 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20'
            : 'border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20'
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
        className: 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20'
      });
      
      return { error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro ao fazer logout:', error);
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