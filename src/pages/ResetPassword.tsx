import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { extractAuthParams, hasValidAuthParams, logAuthDebug, cleanAuthParams } from '@/utils/supabaseRedirectHandler';
import SupabaseLinkDebugger from '@/components/debug/SupabaseLinkDebugger';
import ManualLinkProcessor from '@/components/debug/ManualLinkProcessor';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [errors, setErrors] = useState<{password?: string; confirmPassword?: string}>({});
  const [showDebugger, setShowDebugger] = useState(false);
  const [showManualProcessor, setShowManualProcessor] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // LOG 1: Confirma que o componente montou e o listener será configurado.
    console.log("Página Redefinir-Senha montada. Configurando listener...");

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // LOG 2: Mostra CADA evento que o Supabase captura. É o log mais importante.
      console.log("onAuthStateChange disparado!", { event, session });

      if (event === 'PASSWORD_RECOVERY') {
        // LOG 3: Confirma que o evento específico que queremos foi detectado.
        console.log("EVENTO DE PASSWORD_RECOVERY DETECTADO! Sessão temporária ativa.");
        setIsAuthorized(true);
        setMessage('');
      } else if (event === 'SIGNED_OUT') {
        console.log("Usuário deslogado");
        setIsAuthorized(false);
        setMessage('Sessão expirada. Solicite um novo link de recuperação.');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("Token renovado");
      } else if (event === 'INITIAL_SESSION') {
        console.log("Sessão inicial detectada");
        if (session) {
          setIsAuthorized(true);
          setMessage('');
        }
      }
    });

    return () => {
      // LOG 4: Confirma que o componente está sendo desmontado (útil para debug).
      console.log("Página Redefinir-Senha desmontada. Removendo listener.");
      subscription.unsubscribe();
    };
  }, []);

  const validateForm = () => {
    const newErrors: {password?: string; confirmPassword?: string} = {};
    
    if (!password) {
      newErrors.password = 'Nova senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Erro na validação',
        description: 'Por favor, corrija os campos destacados',
        variant: 'destructive',
      });
      return;
    }

    if (!isAuthorized) {
      setMessage('Você não está autorizado a alterar a senha.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setMessage(`Erro: ${error.message}`);
        setIsSuccess(false);
        toast({
          variant: 'destructive',
          title: 'Erro ao alterar senha',
          description: error.message,
        });
      } else {
        setMessage('Senha alterada com sucesso! Redirecionando para o login...');
        setIsSuccess(true);
        toast({
          title: 'Senha alterada!',
          description: 'Sua senha foi alterada com sucesso.',
        });
        
        // Fazer logout e redirecionar para login
        await supabase.auth.signOut();
        
        // Mostrar mensagem de sucesso
        toast({
          title: 'Senha alterada com sucesso!',
          description: 'Faça login com sua nova senha.',
        });
        
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error: any) {
      setMessage(`Erro inesperado: ${error.message}`);
      setIsSuccess(false);
      toast({
        variant: 'destructive',
        title: 'Erro inesperado',
        description: 'Tente novamente em alguns instantes.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized && !message) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <Card className="w-full max-w-md mx-auto shadow-elegant border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            </div>
            <p className="text-center text-muted-foreground mt-4">
              Verificando link de recuperação...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não está autorizado e há mensagem, mostrar página de instruções
  if (!isAuthorized && message) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <Card className="w-full max-w-lg mx-auto shadow-elegant border-border">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Link de Recuperação Inválido
            </CardTitle>
            <CardDescription>
              Você precisa acessar esta página através do link enviado por email
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Acesso Negado</span>
              </div>
              <p className="text-red-600 mt-2 text-sm">
                {message}
              </p>
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 text-xs">
                  <strong>Possível causa:</strong> O link do email pode ter expirado ou as configurações do Supabase precisam ser ajustadas.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Como recuperar sua senha:</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      <strong>Vá para a página de login</strong>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Acesse a tela de login do sistema
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      <strong>Clique em "Esqueci minha senha"</strong>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Abaixo do campo de senha
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      <strong>Digite seu email e clique "Enviar Link"</strong>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Você receberá um email com o link correto
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-medium">
                    4
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      <strong>Clique no link do email</strong>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Isso te levará para esta página com os parâmetros corretos
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <div className="text-blue-600 mt-0.5">💡</div>
                <div>
                  <p className="text-blue-800 font-medium text-sm">Dica Importante</p>
                  <p className="text-blue-700 text-xs mt-1">
                    O link de recuperação contém informações de segurança que expiram em 24 horas. 
                    Não compartilhe este link com ninguém.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardContent className="pt-0 space-y-3">
            <Button
              onClick={() => navigate('/login')}
              className="w-full"
              size="lg"
            >
              Ir para Login
            </Button>
            
            <div className="space-y-3">
              <Button
                onClick={async () => {
                  console.log('🧹 Limpando cache e sessão...');
                  await supabase.auth.signOut();
                  localStorage.clear();
                  sessionStorage.clear();
                  console.log('✅ Cache limpo com sucesso');
                  toast({
                    title: 'Cache limpo',
                    description: 'Sessão e cache foram limpos. Redirecionando...',
                  });
                  setTimeout(() => {
                    window.location.href = '/login';
                  }, 1000);
                }}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Limpar Cache e Ir para Login
              </Button>
              
              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={() => setShowDebugger(true)}
                  variant="secondary"
                  className="w-full"
                  size="lg"
                >
                  🔍 Debug Link do Supabase
                </Button>
                
                <Button
                  onClick={() => setShowManualProcessor(true)}
                  variant="default"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  🔗 Processar Link Manualmente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não está autorizado e tem mensagem, mostrar página de erro com instruções
  if (!isAuthorized && message) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <Card className="w-full max-w-md mx-auto shadow-elegant border-border">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Link Inválido
            </CardTitle>
            <CardDescription>
              Este link de recuperação não é válido
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Acesso Negado</span>
              </div>
              <p className="text-red-600 mt-2 text-sm">
                {message}
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-medium text-blue-900 mb-2">Como acessar:</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Vá para a página de login</li>
                <li>2. Clique em "Esqueci minha senha"</li>
                <li>3. Digite seu email</li>
                <li>4. Clique no link que receber por email</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="flex-1"
              >
                Voltar ao Login
              </Button>
              <Button
                onClick={() => navigate('/')}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                Página Inicial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <Card className="w-full max-w-md mx-auto shadow-elegant border-border">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            Nova Senha
          </CardTitle>
          <CardDescription>
            Crie uma nova senha para sua conta
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleUpdatePassword}>
          <CardContent className="space-y-4">
            {/* Nova Senha */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Nova Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                  disabled={loading || !isAuthorized}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || !isAuthorized}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {errors.password}
                </div>
              )}
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirmar Nova Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                  disabled={loading || !isAuthorized}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading || !isAuthorized}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {errors.confirmPassword}
                </div>
              )}
            </div>

            {/* Mensagem */}
            {message && (
              <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${
                isSuccess 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {isSuccess ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {message}
              </div>
            )}
          </CardContent>

          <CardContent className="pt-0">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !isAuthorized}
              size="lg"
            >
              {loading ? 'Salvando...' : 'Salvar Nova Senha'}
            </Button>
          </CardContent>
        </form>
      </Card>
      
      {/* Modal do Debugger */}
      {showDebugger && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <SupabaseLinkDebugger onClose={() => setShowDebugger(false)} />
          </div>
        </div>
      )}
      
      {/* Modal do Processador Manual */}
      {showManualProcessor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ManualLinkProcessor onClose={() => setShowManualProcessor(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
