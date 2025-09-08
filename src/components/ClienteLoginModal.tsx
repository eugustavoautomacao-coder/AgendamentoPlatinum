import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClienteAuth } from '@/hooks/useClienteAuth';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, User, Lock } from 'lucide-react';

interface ClienteLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  salaoId: string;
  clienteEmail?: string;
  senhaTemporaria?: string;
}

export const ClienteLoginModal: React.FC<ClienteLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  salaoId,
  clienteEmail = '',
  senhaTemporaria = ''
}) => {
  const { login, loading } = useClienteAuth();
  const [email, setEmail] = useState(clienteEmail);
  const [senha, setSenha] = useState(senhaTemporaria);
  const [showSenha, setShowSenha] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !senha) {
      toast.error('Preencha todos os campos');
      return;
    }

    const success = await login(email, senha, salaoId);
    if (success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5 text-primary" />
            Login do Cliente
          </DialogTitle>
        </DialogHeader>
        
        <Card className="border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-center">Acesse sua conta</CardTitle>
            <CardDescription className="text-center">
              Faça login para acompanhar seus agendamentos
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="input-focus"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="senha" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Sua senha"
                    className="input-focus pr-10"
                    required
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
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Entrando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};



