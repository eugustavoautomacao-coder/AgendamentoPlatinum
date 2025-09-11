import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Primeiro, verificar se é um cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('salao_id, nome')
        .eq('email', email)
        .eq('ativo', true)
        .single();
      
      if (clienteData && !clienteError) {
        // É um cliente, fazer login diretamente
        
        // Verificar senha do cliente
        const { data: clienteCompleto, error: loginError } = await supabase
          .from('clientes')
          .select('*')
          .eq('salao_id', clienteData.salao_id)
          .eq('email', email)
          .eq('ativo', true)
          .single();
        
        if (loginError || !clienteCompleto) {
          toast({
            variant: "destructive",
            title: "❌ Cliente não encontrado",
            description: "Cliente não encontrado ou conta inativa. Verifique seus dados.",
            className: 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
          });
          setLoading(false);
          return;
        }
        
        // Verificar senha (simplificado - em produção usar bcrypt)
        if (clienteCompleto.senha_hash !== password) {
          toast({
            variant: "destructive",
            title: "❌ Senha incorreta",
            description: "A senha informada está incorreta. Tente novamente.",
            className: 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
          });
          setLoading(false);
          return;
        }
        
        // Atualizar último login
        await supabase
          .from('clientes')
          .update({ ultimo_login: new Date().toISOString() })
          .eq('id', clienteCompleto.id);
        
        // Armazenar no localStorage
        localStorage.setItem('cliente_auth', JSON.stringify(clienteCompleto));
        
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${clienteCompleto.nome}! Redirecionando para seu painel...`,
          className: 'border-l-4 border-l-[#d63384] bg-gradient-to-r from-[#fdf2f8] to-green-50 dark:from-[#1a0b1a] dark:to-green-900/20',
        });
        
        // Redirecionar diretamente para o dashboard do cliente
        navigate(`/cliente/${clienteData.salao_id}/agendamentos`);
        
        setLoading(false);
        return;
      }
      
      // Se não é cliente, tentar login de admin/profissional
      const { error } = await signIn(email, password);
      
      if (error) {
        // O erro já foi tratado pelo useAuth, não precisa mostrar novamente
      } else {
        // Login de admin/profissional bem-sucedido
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para seu painel...",
          className: 'border-l-4 border-l-[#d63384] bg-gradient-to-r from-[#fdf2f8] to-green-50 dark:from-[#1a0b1a] dark:to-green-900/20',
        });
        
        // O redirecionamento será feito automaticamente pelo App.tsx
        // baseado no tipo de usuário (system_admin, admin, funcionario)
      }
      
    } catch (error: any) {
      console.error('Erro inesperado no login:', error);
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente em alguns instantes.",
        className: 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
      });
    }
    
    setLoading(false);
  };

  return (
    <AuthLayout 
      title="Entrar no Sistema"
      subtitle="Faça login para acessar seu painel - detectamos automaticamente se você é cliente, admin ou profissional"
    >
      <LoginForm onSubmit={handleLogin} isLoading={loading} />
    </AuthLayout>
  );
};

export default Login;