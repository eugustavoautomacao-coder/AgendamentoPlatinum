import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
        .select(`
          *,
          saloes (
            nome
          )
        `)
        .eq('id', session.user.id)
        .single();
      
      if (error) throw error;
      
      // Adicionar nome do salão ao perfil
      const profileWithSalon = {
        ...profile,
        salao_nome: profile.saloes?.nome,
        email: profile.email || session.user.email
      };
      
      setProfile(profileWithSalon);
    } catch (error) {
      console.error('Error refetching profile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('users')
                .select(`
                  *,
                  saloes (
                    nome
                  )
                `)
                .eq('id', session.user.id)
                .single();
              
              if (error) throw error;
              
              // Adicionar nome do salão ao perfil
              const profileWithSalon = {
                ...profile,
                salao_nome: profile.saloes?.nome,
                email: profile.email || session.user.email // Prioriza o email do profile, senão pega do user
              };
              
              setProfile(profileWithSalon);
            } catch (error) {
              console.error('Error fetching profile:', error);
              // Remover toast daqui para evitar loop
              console.error('Erro ao carregar perfil do usuário');
            }
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []); // Remover dependência toast

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
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
      return { error };
    } catch (error) {
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