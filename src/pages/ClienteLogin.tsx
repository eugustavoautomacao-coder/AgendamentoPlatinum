import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, ArrowLeft, LogIn, User, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage, getErrorTitle, isCriticalError } from '@/utils/errorMessages';

interface Salon {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
}

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  salao_id: string;
}

export default function ClienteLogin() {
  const { salaoId } = useParams<{ salaoId: string }>();
  const navigate = useNavigate();
  
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);

  // Carregar dados do salão
  useEffect(() => {
    const fetchSalonData = async () => {
      if (!salaoId) return;
      
      try {
        const { data, error } = await supabase
          .from('saloes')
          .select('id, nome, telefone, endereco')
          .eq('id', salaoId)
          .single();

        if (error) throw error;
        setSalon(data);
      } catch (error) {
        console.error('Erro ao carregar dados do salão:', error);
        toast.error('Erro ao carregar dados do salão');
      }
    };

    fetchSalonData();
  }, [salaoId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !senha) {
      toast.error('Preencha todos os campos');
      return;
    }

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
        const errorMessage = getErrorMessage(error);
        const errorTitle = getErrorTitle(error);
        const critical = isCriticalError(error);
        
        toast.error(errorMessage, {
          description: critical ? 'Verifique suas credenciais e tente novamente.' : undefined
        });
        return;
      }

      // Verificar senha (simplificado - em produção usar bcrypt)
      if (data.senha_hash !== senha) {
        toast.error('Senha incorreta. Verifique sua senha e tente novamente.');
        return;
      }

      // Atualizar último login
      await supabase
        .from('clientes')
        .update({ ultimo_login: new Date().toISOString() })
        .eq('id', data.id);

      // Armazenar no localStorage
      localStorage.setItem('cliente_auth', JSON.stringify(data));
      
      toast.success('Login realizado com sucesso!');
      
      // Redirecionar para o dashboard de agendamentos
      navigate(`/cliente/${salaoId}/agendamentos`);
    } catch (error) {
      console.error('Erro no login:', error);
      const errorMessage = getErrorMessage(error);
      const errorTitle = getErrorTitle(error);
      
      toast.error(errorMessage, {
        description: 'Tente novamente em alguns instantes.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do salão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header do Salão */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{salon.nome}</h1>
              <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{salon.telefone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{salon.endereco}</span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600 dark:text-green-400 dark:border-green-400">
              Área do Cliente
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-12">
        {/* Botão Voltar */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(`/salao/${salaoId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Salão
          </Button>
        </div>

        {/* Card de Login */}
        <Card className="border-border">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-foreground">Login do Cliente</CardTitle>
            <p className="text-muted-foreground">
              Acesse sua conta para gerenciar seus agendamentos
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="senha">Senha</Label>
                <div className="relative mt-1">
                  <Input
                    id="senha"
                    type={showSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Sua senha"
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowSenha(!showSenha)}
                  >
                    {showSenha ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            {/* Informações adicionais */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="text-center text-sm text-muted-foreground">
                <p className="mb-2">Não tem uma conta?</p>
                <p>
                  Faça seu primeiro agendamento no{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary hover:text-primary/80"
                    onClick={() => navigate(`/salao/${salaoId}`)}
                  >
                    salão público
                  </Button>
                  {' '}para criar uma conta automaticamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
