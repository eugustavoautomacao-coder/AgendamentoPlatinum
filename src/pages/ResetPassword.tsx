import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useErrorHandler } from '@/hooks/useErrorHandler';

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
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { handleError, handleSuccess } = useErrorHandler();

  useEffect(() => {
    // Verificar se é um reset de cliente via token
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const type = urlParams.get('type');
    
    if (token && type === 'cliente') {
      
      // Verificar se o token existe e é válido
      const resetData = localStorage.getItem(`reset_token_${token}`);
      if (resetData) {
        const data = JSON.parse(resetData);
        const now = new Date();
        const expires = new Date(data.expires);
        
        if (now < expires) {
          setIsAuthorized(true);
          setMessage('');
          // Armazenar dados do reset para uso posterior
          localStorage.setItem('current_reset_data', JSON.stringify(data));
        } else {
          setMessage('Link de recuperação expirado. Solicite um novo link.');
          setIsAuthorized(false);
        }
      } else {
        setMessage('Link de recuperação inválido. Solicite um novo link.');
        setIsAuthorized(false);
      }
    } else {
      // Comportamento normal para admin/profissional

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {

      if (event === 'PASSWORD_RECOVERY') {
        setIsAuthorized(true);
        setMessage('');
      } else if (event === 'SIGNED_OUT') {
        setIsAuthorized(false);
        setMessage('Sessão expirada. Solicite um novo link de recuperação.');
      } else if (event === 'TOKEN_REFRESHED') {
      } else if (event === 'INITIAL_SESSION') {
        if (session) {
          setIsAuthorized(true);
          setMessage('');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    }
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
        description: 'Por favor, corrija os campos destacados antes de continuar',
        variant: 'destructive',
        className: 'toast-orange-gradient',
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
      // Verificar se é um reset de cliente via token
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const type = urlParams.get('type');
      
      if (token && type === 'cliente') {
        // Reset de cliente via token
        const resetData = localStorage.getItem('current_reset_data');
        
        if (!resetData) {
          setMessage('Dados de reset não encontrados. Solicite um novo link.');
          setIsSuccess(false);
          return;
        }
        
        const data = JSON.parse(resetData);
        
        // Atualizar senha na tabela clientes
        const { error } = await supabase
          .from('clientes')
          .update({ 
            senha_hash: password,
            senha_temporaria: false
          })
          .eq('email', data.email)
          .eq('salao_id', data.salaoId);
        
        if (error) {
          setMessage(`Erro: ${error.message}`);
          setIsSuccess(false);
          handleError(error, 'Alterar senha');
        } else {
          // Limpar tokens de reset
          localStorage.removeItem(`reset_token_${token}`);
          localStorage.removeItem('current_reset_data');
          
          setMessage('Senha alterada com sucesso! Redirecionando para o login...');
          setIsSuccess(true);
          toast({
            title: 'Senha alterada com sucesso!',
            description: 'Sua senha foi atualizada com segurança. Redirecionando para o login...',
            className: 'toast-primary-gradient',
          });
          
          // Redirecionar para login principal (detecta automaticamente se é cliente)
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } else {
        // Comportamento normal - verificar se é cliente logado ou admin/profissional
        const clienteAuth = localStorage.getItem('cliente_auth');
        
        if (clienteAuth) {
          // É um cliente, atualizar senha na tabela clientes
          const clienteData = JSON.parse(clienteAuth);
          
          const { error } = await supabase
            .from('clientes')
            .update({ 
              senha_hash: password,
              senha_temporaria: false // Marcar que não é mais senha temporária
            })
            .eq('id', clienteData.id);
          
          if (error) {
            setMessage(`Erro: ${error.message}`);
            setIsSuccess(false);
            toast({
              variant: 'destructive',
              title: 'Erro ao alterar senha',
              description: error.message,
            });
          } else {
            // Atualizar dados no localStorage
            const clienteAtualizado = { ...clienteData, senha_hash: password, senha_temporaria: false };
            localStorage.setItem('cliente_auth', JSON.stringify(clienteAtualizado));
            
            setMessage('Senha alterada com sucesso! Redirecionando para o login...');
            setIsSuccess(true);
            toast({
              title: 'Senha alterada!',
              description: 'Sua senha foi alterada com sucesso.',
            });
            
            // Fazer logout do cliente e redirecionar
            localStorage.removeItem('cliente_auth');
            
            // Mostrar mensagem de sucesso
            toast({
              title: 'Senha alterada com sucesso!',
              description: 'Faça login com sua nova senha. Redirecionando automaticamente...',
              className: 'toast-primary-gradient',
            });
            
            // Redirecionar para login principal (detecta automaticamente se é cliente)
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          }
        } else {
          // É um admin/profissional, usar Supabase Auth
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
            className: 'toast-error-gradient',
        });
      } else {
        setMessage('Senha alterada com sucesso! Redirecionando para o login...');
        setIsSuccess(true);
        toast({
            title: 'Senha alterada com sucesso!',
            description: 'Sua senha foi atualizada com segurança. Redirecionando para o login...',
            className: 'toast-primary-gradient',
        });
        
        // Fazer logout e redirecionar para login
        await supabase.auth.signOut();
        
        // Mostrar mensagem de sucesso
        toast({
            title: 'Senha alterada com sucesso!',
            description: 'Faça login com sua nova senha. Redirecionando automaticamente...',
            className: 'toast-primary-gradient',
          });
          
          // Detectar se é cliente ou admin e redirecionar para o login correto
          setTimeout(async () => {
            try {
              // Obter a sessão atual para pegar o email do usuário
              const { data: { session: currentSession } } = await supabase.auth.getSession();
              
              if (currentSession?.user?.email) {
                // Verificar se o usuário é um cliente
                const { data: clienteData } = await supabase
                  .from('clientes')
                  .select('salao_id')
                  .eq('email', currentSession.user.email)
                  .single();
                
                if (clienteData) {
                  // É um cliente, redirecionar para login principal (detecta automaticamente)
                  navigate('/login');
                } else {
                  // É um admin/funcionario, redirecionar para login de admin
                  navigate('/login');
                }
              } else {
                // Se não conseguir obter o email, redirecionar para login de admin por padrão
                navigate('/login');
              }
            } catch (error) {
              console.error('Erro ao detectar tipo de usuário:', error);
              // Em caso de erro, redirecionar para login de admin por padrão
          navigate('/login');
            }
        }, 2000);
        }
        }
      }
    } catch (error: any) {
      setMessage(`Erro inesperado: ${error.message}`);
      setIsSuccess(false);
      toast({
        variant: 'destructive',
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado. Tente novamente em alguns instantes.',
        className: 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized && !message) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdf2f8] to-white dark:from-[#1a0b1a] dark:to-[#2d1b2d]">
        <Card className="w-full max-w-md mx-auto shadow-elegant border-2 border-[#d63384]/20 dark:border-[#d63384]/30 bg-gradient-to-br from-white to-[#fdf2f8] dark:from-[#2d1b2d] dark:to-[#1a0b1a]">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d63384] dark:border-[#e91e63]"></div>
            </div>
            <p className="text-center text-gray-600 dark:text-gray-300 mt-4">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdf2f8] to-white dark:from-[#1a0b1a] dark:to-[#2d1b2d] p-4">
        <Card className="w-full max-w-lg mx-auto shadow-elegant border-2 border-[#d63384]/20 dark:border-[#d63384]/30 bg-gradient-to-br from-white to-[#fdf2f8] dark:from-[#2d1b2d] dark:to-[#1a0b1a]">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#d63384] to-[#e91e63] bg-clip-text text-transparent flex items-center justify-center gap-2">
              ❌ Link de Recuperação Inválido
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Você precisa acessar esta página através do link enviado por email
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-lg p-4 dark:from-red-900/20 dark:to-red-800/20 dark:border-red-400/20">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Acesso Negado</span>
              </div>
              <p className="text-red-600 dark:text-red-300 mt-2 text-sm">
                {message}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-[#d63384] dark:text-[#e91e63]">Como recuperar sua senha:</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-[#d63384] to-[#e91e63] text-white rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Vá para a página de login</strong>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Acesse a tela de login do sistema
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-[#d63384] to-[#e91e63] text-white rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Clique em "Esqueci minha senha"</strong>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Abaixo do campo de senha
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-[#d63384] to-[#e91e63] text-white rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Digite seu email e clique "Enviar Link"</strong>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Você receberá um email com o link correto
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-[#d63384] to-[#e91e63] text-white rounded-full flex items-center justify-center text-sm font-medium">
                    4
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Clique no link do email</strong>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Isso te levará para esta página com os parâmetros corretos
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#fdf2f8] to-blue-50 border-2 border-[#d63384]/20 rounded-lg p-4 dark:from-[#1a0b1a] dark:to-blue-900/20 dark:border-[#d63384]/30">
              <div className="flex items-start gap-2">
                <div className="text-[#d63384] dark:text-[#e91e63] mt-0.5">💡</div>
                <div>
                  <p className="text-[#d63384] dark:text-[#e91e63] font-medium text-sm">Dica Importante</p>
                  <p className="text-gray-600 dark:text-gray-300 text-xs mt-1">
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
              className="w-full bg-gradient-to-r from-[#d63384] to-[#e91e63] hover:from-[#e91e63] hover:to-[#d63384] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 dark:from-[#e91e63] dark:to-[#d63384] dark:hover:from-[#d63384] dark:hover:to-[#e91e63]"
              size="lg"
            >
              🔐 Ir para Login
            </Button>
            
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não está autorizado e tem mensagem, mostrar página de erro com instruções
  if (!isAuthorized && message) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdf2f8] to-white dark:from-[#1a0b1a] dark:to-[#2d1b2d] p-4">
        <Card className="w-full max-w-md mx-auto shadow-elegant border-2 border-[#d63384]/20 dark:border-[#d63384]/30 bg-gradient-to-br from-white to-[#fdf2f8] dark:from-[#2d1b2d] dark:to-[#1a0b1a]">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#d63384] to-[#e91e63] bg-clip-text text-transparent flex items-center justify-center gap-2">
              ❌ Link Inválido
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Este link de recuperação não é válido
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-lg dark:from-red-900/20 dark:to-red-800/20 dark:border-red-400/20">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Acesso Negado</span>
              </div>
              <p className="text-red-600 dark:text-red-300 mt-2 text-sm">
                {message}
              </p>
            </div>

            <div className="p-4 bg-gradient-to-r from-[#fdf2f8] to-blue-50 border-2 border-[#d63384]/20 rounded-lg dark:from-[#1a0b1a] dark:to-blue-900/20 dark:border-[#d63384]/30">
              <h3 className="font-medium text-[#d63384] dark:text-[#e91e63] mb-2">Como acessar:</h3>
              <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>1. Vá para a página de login</li>
                <li>2. Clique em "Esqueci minha senha"</li>
                <li>3. Digite seu email</li>
                <li>4. Clique no link que receber por email</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="flex-1 border-2 border-[#d63384]/30 text-[#d63384] hover:bg-[#d63384]/10 hover:border-[#d63384] dark:border-[#e91e63]/40 dark:text-[#e91e63] dark:hover:bg-[#e91e63]/10 dark:hover:border-[#e91e63]"
              >
                🔐 Voltar ao Login
              </Button>
              <Button
                onClick={() => navigate('/')}
                className="flex-1 bg-gradient-to-r from-[#d63384] to-[#e91e63] hover:from-[#e91e63] hover:to-[#d63384] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 dark:from-[#e91e63] dark:to-[#d63384] dark:hover:from-[#d63384] dark:hover:to-[#e91e63]"
              >
                🏠 Página Inicial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdf2f8] to-white dark:from-[#1a0b1a] dark:to-[#2d1b2d] p-4">
      <Card className="w-full max-w-md mx-auto shadow-elegant border-2 border-[#d63384]/20 dark:border-[#d63384]/30 bg-gradient-to-br from-white to-[#fdf2f8] dark:from-[#2d1b2d] dark:to-[#1a0b1a]">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#d63384] to-[#e91e63] bg-clip-text text-transparent flex items-center justify-center gap-2">
            🔐 Nova Senha
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Crie uma nova senha segura para sua conta
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleUpdatePassword}>
          <CardContent className="space-y-4">
            {/* Nova Senha */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[#d63384] dark:text-[#e91e63]">
                Nova Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#d63384] dark:text-[#e91e63]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 pr-10 border-2 border-[#d63384]/20 focus:border-[#d63384] focus:ring-[#d63384]/20 dark:border-[#e91e63]/30 dark:focus:border-[#e91e63] dark:focus:ring-[#e91e63]/20 ${errors.password ? 'border-red-500 dark:border-red-400' : ''}`}
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
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#d63384] dark:text-[#e91e63]">
                Confirmar Nova Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#d63384] dark:text-[#e91e63]" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 pr-10 border-2 border-[#d63384]/20 focus:border-[#d63384] focus:ring-[#d63384]/20 dark:border-[#e91e63]/30 dark:focus:border-[#e91e63] dark:focus:ring-[#e91e63]/20 ${errors.confirmPassword ? 'border-red-500 dark:border-red-400' : ''}`}
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
              <div className={`p-4 rounded-lg text-sm border-l-4 flex items-center gap-2 ${
                isSuccess 
                  ? 'bg-gradient-to-r from-[#fdf2f8] to-green-50 text-[#d63384] border-l-[#d63384] border border-[#d63384]/20 dark:from-[#1a0b1a] dark:to-green-900/20 dark:text-[#e91e63] dark:border-l-[#e91e63] dark:border-[#e91e63]/20' 
                  : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-l-red-500 border border-red-200 dark:from-red-900/20 dark:to-red-800/20 dark:text-red-300 dark:border-l-red-400 dark:border-red-400/20'
              }`}>
                {!isSuccess && <AlertCircle className="h-4 w-4" />}
                <span className="font-medium">{message}</span>
              </div>
            )}
          </CardContent>

          <CardContent className="pt-0">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#d63384] to-[#e91e63] hover:from-[#e91e63] hover:to-[#d63384] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 dark:from-[#e91e63] dark:to-[#d63384] dark:hover:from-[#d63384] dark:hover:to-[#e91e63]"
              disabled={loading || !isAuthorized}
              size="lg"
            >
              {loading ? '🔐 Salvando...' : '🔐 Salvar Nova Senha'}
            </Button>
          </CardContent>
        </form>
      </Card>
      
    </div>
  );
}
