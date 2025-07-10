import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (email: string, password: string) => {
    console.log('[Auth/Login]', 'Tentativa de login:', { email });
    setIsLoading(true);

    try {
      // Simular autenticação
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Determinar tipo de usuário baseado no email (temporário para MVP)
      let userRole = 'cliente';
      let dashboardPath = '/cliente';
      
      if (email.includes('admin')) {
        userRole = 'admin';
        dashboardPath = '/admin';
      } else if (email.includes('prof')) {
        userRole = 'profissional';
        dashboardPath = '/profissional';
      }

      console.log('[Auth/Login]', 'Login realizado com sucesso:', { userRole, dashboardPath });
      
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo de volta!`,
      });

      // Redirect para dashboard correspondente
      navigate(dashboardPath);
      
    } catch (error) {
      console.error('[Auth/Login]', 'Erro no login:', error);
      toast({
        title: "Erro no login",
        description: "Credenciais inválidas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Entrar no Sistema"
      subtitle="Faça login para acessar seu painel de controle"
    >
      <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
    </AuthLayout>
  );
};

export default Login;