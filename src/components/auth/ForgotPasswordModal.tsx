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
      // Primeiro, verificar se é um cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('salao_id, nome')
        .eq('email', email)
        .eq('ativo', true)
        .single();
      
      if (clienteData && !clienteError) {
        // É um cliente - enviar email de reset personalizado
        
        // Gerar token único para reset
        const resetToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
        
        // Armazenar token temporariamente no localStorage (solução simples)
        // Em produção, seria melhor adicionar campos na tabela clientes
        const resetData = {
          token: resetToken,
          email: email,
          expires: expiresAt.toISOString(),
          salaoId: clienteData.salao_id
        };
        
        // Armazenar no localStorage com chave única
        localStorage.setItem(`reset_token_${resetToken}`, JSON.stringify(resetData));
        
        // Enviar email personalizado (usando o EmailService existente)
        const { EmailService } = await import('@/services/emailService');
        const emailService = new EmailService();
        
        const resetLink = `${window.location.origin}/redefinir-senha?token=${resetToken}&type=cliente`;
        
        await emailService.sendPasswordResetEmail({
          to: email,
          nome: clienteData.nome,
          resetLink: resetLink
        });
        
        setMessage('Se o e-mail estiver correto, você receberá um link para redefinir sua senha.');
        setIsSuccess(true);
        toast({
          title: '📧 Email de recuperação enviado!',
          description: 'Verifique sua caixa de entrada e pasta de spam. O link expira em 24 horas.',
          className: 'border-l-4 border-l-[#c35d8f] bg-gradient-to-r from-[#fdf2f8] to-white dark:from-[#1a0b1a] dark:to-[#2d1b2d]',
        });
      } else {
        // É um admin/profissional, usar Supabase Auth
        const redirectTo = `${window.location.origin}/redefinir-senha`;
        

        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectTo,
        });


        // Sempre mostrar mensagem genérica por motivos de segurança
        setMessage('Se o e-mail estiver correto, você receberá um link para redefinir sua senha.');
        setIsSuccess(true);
        toast({
          title: '📧 Email de recuperação enviado!',
          description: 'Verifique sua caixa de entrada e pasta de spam. O link expira em 24 horas.',
          className: 'border-l-4 border-l-[#c35d8f] bg-gradient-to-r from-[#fdf2f8] to-white dark:from-[#1a0b1a] dark:to-[#2d1b2d]',
        });
      }
    } catch (error: any) {
      console.error('💥 Erro inesperado:', error);
      // Mesmo em caso de erro, mostre uma mensagem genérica por motivos de segurança
      setMessage('Se o e-mail estiver correto, você receberá um link para redefinir sua senha.');
      setIsSuccess(true);
      toast({
        title: '📧 Email de recuperação enviado!',
        description: 'Verifique sua caixa de entrada e pasta de spam. O link expira em 24 horas.',
        className: 'border-l-4 border-l-[#d63384] bg-gradient-to-r from-[#fdf2f8] to-white',
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
      <DialogContent className="sm:max-w-md border-2 border-[#c35d8f]/20 bg-gradient-to-br from-[#fdf2f8] to-white dark:from-[#1a0b1a] dark:to-[#2d1b2d] dark:border-[#c35d8f]/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#c35d8f] to-[#e91e63] bg-clip-text text-transparent flex items-center gap-2">
            🔐 Recuperar Senha
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            Digite seu e-mail para receber um link seguro de recuperação de senha.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#c35d8f] dark:text-[#e91e63] font-semibold">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full border-2 border-[#c35d8f]/20 focus:border-[#c35d8f] focus:ring-[#c35d8f]/20 dark:border-[#e91e63]/30 dark:focus:border-[#e91e63] dark:focus:ring-[#e91e63]/20"
            />
          </div>

          {message && (
            <div className={`p-4 rounded-lg text-sm border-l-4 ${
              isSuccess 
                ? 'bg-gradient-to-r from-[#fdf2f8] to-green-50 text-[#c35d8f] border-l-[#c35d8f] border border-[#c35d8f]/20 dark:from-[#1a0b1a] dark:to-green-900/20 dark:text-[#e91e63] dark:border-l-[#e91e63] dark:border-[#e91e63]/20' 
                : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-l-red-500 border border-red-200 dark:from-red-900/20 dark:to-red-800/20 dark:text-red-300 dark:border-l-red-400 dark:border-red-400/20'
            }`}>
              <div className="flex items-center gap-2">
                {!isSuccess && '❌'}
                <span className="font-medium">{message}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 border-2 border-[#c35d8f]/30 text-[#c35d8f] hover:bg-[#c35d8f]/10 hover:border-[#c35d8f] dark:border-[#e91e63]/40 dark:text-[#e91e63] dark:hover:bg-[#e91e63]/10 dark:hover:border-[#e91e63]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1 bg-gradient-to-r from-[#c35d8f] to-[#e91e63] hover:from-[#e91e63] hover:to-[#c35d8f] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 dark:from-[#e91e63] dark:to-[#c35d8f] dark:hover:from-[#c35d8f] dark:hover:to-[#e91e63]"
            >
              {loading ? '📧 Enviando...' : '📧 Enviar Link'}
            </Button>
          </div>
        </form>

        {isSuccess && (
          <div className="mt-4 p-4 bg-gradient-to-r from-[#fdf2f8] to-blue-50 border-2 border-[#c35d8f]/20 rounded-lg dark:from-[#1a0b1a] dark:to-blue-900/20 dark:border-[#c35d8f]/30">
            <p className="text-sm text-[#c35d8f] font-medium dark:text-[#e91e63]">
              💡 <strong>Dica importante:</strong> Verifique também sua pasta de spam caso não encontre o email. O link de recuperação expira em 24 horas.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
