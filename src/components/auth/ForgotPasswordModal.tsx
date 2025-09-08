import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { checkUserExists } from '@/utils/checkUserExists';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Primeiro, verificar se o usuário existe no sistema
      console.log('🔍 Verificando se usuário existe:', email);
      const userCheck = await checkUserExists(email);
      
      if (!userCheck.exists) {
        setMessage(`Usuário não encontrado: ${userCheck.error}`);
        setIsSuccess(false);
        toast({
          variant: 'destructive',
          title: 'Usuário não encontrado',
          description: 'Este email não está cadastrado no sistema.',
        });
        return;
      }
      
      console.log('✅ Usuário encontrado, prosseguindo com envio de email');

      // A URL para onde o usuário será redirecionado APÓS clicar no link do e-mail
      const redirectTo = `${window.location.origin}/redefinir-senha`;
      
      console.log('🔍 Enviando email de recuperação para:', email);
      console.log('🔍 URL de redirecionamento:', redirectTo);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });

      console.log('📧 Resposta do Supabase:', { data, error });

      if (error) {
        console.error('❌ Erro ao enviar email:', error);
        setMessage(`Erro: ${error.message}`);
        setIsSuccess(false);
        toast({
          variant: 'destructive',
          title: 'Erro ao enviar email',
          description: error.message,
        });
      } else {
        console.log('✅ Email enviado com sucesso!');
        setMessage('Link de recuperação enviado! Verifique seu e-mail.');
        setIsSuccess(true);
        toast({
          title: 'Email enviado!',
          description: 'Verifique sua caixa de entrada e spam.',
        });
      }
    } catch (error: any) {
      console.error('💥 Erro inesperado:', error);
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

  const handleClose = () => {
    setEmail('');
    setMessage('');
    setIsSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            Recuperar Senha
          </DialogTitle>
          <DialogDescription>
            Digite seu e-mail para receber um link de recuperação de senha.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-md text-sm ${
              isSuccess 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              {loading ? 'Enviando...' : 'Enviar Link'}
            </Button>
          </div>
        </form>

        {isSuccess && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              💡 <strong>Dica:</strong> Verifique também sua pasta de spam caso não encontre o email.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
