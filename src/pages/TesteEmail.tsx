import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmailService } from '@/services/emailService';
import { AgendamentoEmailData } from '@/settings/email.config';
import { emailTemplates } from '@/settings/emailTemplates';
import { Mail, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const TesteEmail: React.FC = () => {
  const [emailService] = useState(new EmailService());
  const [testando, setTestando] = useState(false);
  const [resultado, setResultado] = useState<{ sucesso: boolean; mensagem: string } | null>(null);
  
  // Dados de teste
  const [dadosTeste, setDadosTeste] = useState<AgendamentoEmailData>({
    cliente_nome: 'João Silva',
    cliente_email: 'teste@exemplo.com', // Email padrão para testes
    servico_nome: 'Corte Masculino',
    funcionario_nome: 'Maria Santos',
    data_hora: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Amanhã
    preco: 45.00,
    duracao_minutos: 60,
    observacoes: 'Cliente solicita corte moderno e barba aparada'
  });

  // Testar conexão SMTP
  const testarConexao = async () => {
    setTestando(true);
    setResultado(null);
    
    try {
      const sucesso = await emailService.testarConexao();
      setResultado({
        sucesso,
        mensagem: sucesso 
          ? 'Conexão SMTP estabelecida com sucesso!' 
          : 'Falha na conexão SMTP. Verifique as configurações.'
      });
    } catch (error) {
      setResultado({
        sucesso: false,
        mensagem: `Erro ao testar conexão: ${error}`
      });
    } finally {
      setTestando(false);
    }
  };

  // Testar envio de email específico
  const testarEmail = async (tipo: string) => {
    // Validar se o email foi preenchido
    if (!dadosTeste.cliente_email || dadosTeste.cliente_email.trim() === '') {
      setResultado({
        sucesso: false,
        mensagem: '❌ Por favor, preencha o email do cliente antes de testar o envio.'
      });
      return;
    }

    setTestando(true);
    setResultado(null);
    
    try {
      let sucesso = false;
      
      switch (tipo) {
        case 'confirmacao':
          sucesso = await emailService.enviarConfirmacaoAgendamento(dadosTeste);
          break;
        case 'aprovacao':
          sucesso = await emailService.enviarAprovacaoAgendamento(dadosTeste);
          break;
        case 'rejeicao':
          sucesso = await emailService.enviarRejeicaoAgendamento(dadosTeste);
          break;
        case 'lembrete':
          sucesso = await emailService.enviarLembreteAgendamento(dadosTeste);
          break;
        case 'cancelamento':
          sucesso = await emailService.enviarCancelamentoAgendamento(dadosTeste);
          break;
        default:
          throw new Error('Tipo de email inválido');
      }
      
      setResultado({
        sucesso,
        mensagem: sucesso 
          ? `Email de ${tipo} enviado com sucesso!` 
          : `Falha ao enviar email de ${tipo}.`
      });
    } catch (error) {
      setResultado({
        sucesso: false,
        mensagem: `Erro ao enviar email: ${error}`
      });
    } finally {
      setTestando(false);
    }
  };

  // Atualizar dados de teste
  const atualizarDadosTeste = (campo: keyof AgendamentoEmailData, valor: string | number) => {
    setDadosTeste(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Visualizar template de email
  const visualizarTemplate = (tipo: string) => {
    let content = '';
    let title = '';
    
    switch (tipo) {
      case 'confirmacao':
        content = emailTemplates.confirmacaoAgendamento(dadosTeste);
        title = 'Agendamento Confirmado';
        break;
      case 'aprovacao':
        content = emailTemplates.aprovacaoAgendamento(dadosTeste);
        title = 'Agendamento Aprovado';
        break;
      case 'rejeicao':
        content = emailTemplates.rejeicaoAgendamento(dadosTeste);
        title = 'Agendamento Rejeitado';
        break;
      case 'lembrete':
        content = emailTemplates.lembreteAgendamento(dadosTeste);
        title = 'Lembrete de Agendamento';
        break;
      case 'cancelamento':
        content = emailTemplates.cancelamentoAgendamento(dadosTeste);
        title = 'Agendamento Cancelado';
        break;
      default:
        return;
    }
    
    const html = emailTemplates.baseTemplate(content, title);
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">🧪 Teste do Sistema de Email</h1>
          <p className="text-muted-foreground">
            Teste a configuração SMTP e envie emails de exemplo para verificar o funcionamento.
          </p>
        </div>

        {/* Teste de Conexão */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Teste de Conexão SMTP
            </CardTitle>
            <CardDescription>
              Verifique se a conexão com o servidor Brevo está funcionando.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testarConexao} 
              disabled={testando}
              className="flex items-center gap-2"
            >
              {testando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              {testando ? 'Testando...' : 'Testar Conexão SMTP'}
            </Button>
          </CardContent>
        </Card>

        {/* Dados de Teste */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>📝 Dados de Teste</CardTitle>
            <CardDescription>
              Configure os dados que serão usados nos emails de teste.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cliente_nome">Nome do Cliente</Label>
                <Input
                  id="cliente_nome"
                  value={dadosTeste.cliente_nome}
                  onChange={(e) => atualizarDadosTeste('cliente_nome', e.target.value)}
                />
              </div>
                             <div>
                 <Label htmlFor="cliente_email">
                   Email do Cliente <span className="text-red-500">*</span>
                 </Label>
                 <Input
                   id="cliente_email"
                   type="email"
                   value={dadosTeste.cliente_email}
                   onChange={(e) => atualizarDadosTeste('cliente_email', e.target.value)}
                   placeholder="exemplo@email.com"
                   required
                   className={!dadosTeste.cliente_email ? 'border-red-500' : ''}
                 />
                 {!dadosTeste.cliente_email && (
                   <p className="text-sm text-red-500 mt-1">
                     Email é obrigatório para testar o envio
                   </p>
                 )}
               </div>
              <div>
                <Label htmlFor="servico_nome">Nome do Serviço</Label>
                <Input
                  id="servico_nome"
                  value={dadosTeste.servico_nome}
                  onChange={(e) => atualizarDadosTeste('servico_nome', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="funcionario_nome">Nome do Profissional</Label>
                <Input
                  id="funcionario_nome"
                  value={dadosTeste.funcionario_nome}
                  onChange={(e) => atualizarDadosTeste('funcionario_nome', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="preco">Preço</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  value={dadosTeste.preco}
                  onChange={(e) => atualizarDadosTeste('preco', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="duracao">Duração (minutos)</Label>
                <Input
                  id="duracao"
                  type="number"
                  value={dadosTeste.duracao_minutos}
                  onChange={(e) => atualizarDadosTeste('duracao_minutos', parseInt(e.target.value) || 60)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={dadosTeste.observacoes || ''}
                onChange={(e) => atualizarDadosTeste('observacoes', e.target.value)}
                placeholder="Observações do agendamento..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Testes de Email */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Testes de Email
            </CardTitle>
            <CardDescription>
              Envie emails de teste para verificar os templates e funcionalidade.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => testarEmail('confirmacao')}
                  disabled={testando}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {testando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Confirmação
                </Button>
                <Button
                  onClick={() => visualizarTemplate('confirmacao')}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  👁️ Visualizar
                </Button>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => testarEmail('aprovacao')}
                  disabled={testando}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {testando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Aprovação
                </Button>
                <Button
                  onClick={() => visualizarTemplate('aprovacao')}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  👁️ Visualizar
                </Button>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => testarEmail('rejeicao')}
                  disabled={testando}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {testando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Rejeição
                </Button>
                <Button
                  onClick={() => visualizarTemplate('rejeicao')}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  👁️ Visualizar
                </Button>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => testarEmail('lembrete')}
                  disabled={testando}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {testando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Lembrete
                </Button>
                <Button
                  onClick={() => visualizarTemplate('lembrete')}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  👁️ Visualizar
                </Button>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => testarEmail('cancelamento')}
                  disabled={testando}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {testando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Cancelamento
                </Button>
                <Button
                  onClick={() => visualizarTemplate('cancelamento')}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  👁️ Visualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultado */}
        {resultado && (
          <Card className={`border-l-4 ${resultado.sucesso ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {resultado.sucesso ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <h3 className={`font-semibold ${resultado.sucesso ? 'text-green-800' : 'text-red-800'}`}>
                    {resultado.sucesso ? 'Sucesso!' : 'Erro'}
                  </h3>
                  <p className={`text-sm ${resultado.sucesso ? 'text-green-700' : 'text-red-700'}`}>
                    {resultado.mensagem}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>ℹ️ Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Certifique-se de que as variáveis de ambiente estão configuradas corretamente</p>
            <p>• Verifique se a API key do Brevo está válida</p>
                      <p>• Os emails são enviados para o endereço configurado em "Email do Cliente"</p>
          <p>• Verifique a pasta de spam se não receber os emails</p>
          <p>• Os logs de envio aparecem no console do navegador</p>
          <p>• Configure um email real para testar o sistema</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
