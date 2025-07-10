import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao fazer login"
      });
    } else {
      navigate('/admin');
    }
    
    setLoading(false);
  };

  return (
    <AuthLayout 
      title="Entrar no Sistema"
      subtitle="Faça login para acessar seu painel de controle"
    >
      <LoginForm onSubmit={handleLogin} isLoading={loading} />
    </AuthLayout>
  );
};

export default Login;