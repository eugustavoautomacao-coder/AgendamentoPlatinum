import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Bell, Clock, Settings, TestTube } from 'lucide-react';
import { EmailService } from '@/services/emailService';
import { toast } from 'sonner';

export const ConfiguracoesEmail: React.FC = () => {
  const [emailService] = useState(new EmailService());
  const [testando, setTestando] = useState(false);
  const [configuracoes, setConfiguracoes] = useState({
    // Configurações gerais
    emailEnabled: true,
    testMode: false,
    
    // Configurações de lembretes
    lembretesEnabled: true,
    intervaloVerificacao: 30, // minutos
    lembretes24h: true,
    lembretes2h: true,
    lembretes1h: false,
    
    // Configurações de notificações
    confirmacaoCriacao: true,
    confirmacaoAprovacao: true,
    confirmacaoRejeicao: true,
    confirmacaoCancelamento: true,
    confirmacaoAlteracao: true,
    
    // Configurações de teste
    emailTeste: '',
    nomeTeste: 'Cliente Teste'
  });

  // Testar conexão SMTP
  const testarConexao = async () => {
    setTestando(true);
    try {
      const sucesso = await emailService.testarConexao();
      if (sucesso) {
        toast.success('✅ Conexão SMTP estabelecida com sucesso!');
      } else {
        toast.error('❌ Falha na conexão SMTP');
      }
    } catch (error) {
      toast.error(`❌ Erro ao testar conexão: ${error}`);
    } finally {
      setTestando(false);
    }
  };

  // Testar envio de email
  const testarEnvio = async () => {
    if (!configuracoes.emailTeste) {
      toast.error('❌ Configure um email para teste');
      return;
    }

    setTestando(true);
    try {
      const dadosTeste = {
        cliente_nome: configuracoes.nomeTeste,
        cliente_email: configuracoes.emailTeste,
        servico_nome: 'Corte Masculino',
        funcionario_nome: 'Maria Santos',
        data_hora: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        preco: 45.00,
        duracao_minutos: 60,
        observacoes: 'Email de teste do sistema'
      };

      const sucesso = await emailService.enviarConfirmacaoAgendamento(dadosTeste);
      if (sucesso) {
        toast.success('✅ Email de teste enviado com sucesso!');
      } else {
        toast.error('❌ Falha ao enviar email de teste');
      }
    } catch (error) {
      toast.error(`❌ Erro ao enviar email: ${error}`);
    } finally {
      setTestando(false);
    }
  };

  // Salvar configurações
  const salvarConfiguracoes = () => {
    localStorage.setItem('emailConfig', JSON.stringify(configuracoes));
    toast.success('✅ Configurações salvas com sucesso!');
  };

  // Carregar configurações salvas
  React.useEffect(() => {
    const configSalva = localStorage.getItem('emailConfig');
    if (configSalva) {
      setConfiguracoes(prev => ({ ...prev, ...JSON.parse(configSalva) }));
    }
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-pink-500" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Configurações de Email</h1>
              <p className="text-muted-foreground">
                Configure as notificações por email do sistema
              </p>
            </div>
          </div>
        </div>

        {/* Status do Sistema */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sistema de Email</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={configuracoes.emailEnabled ? "default" : "secondary"}>
                    {configuracoes.emailEnabled ? "Ativo" : "Inativo"}
                  </Badge>
                  {configuracoes.testMode && (
                    <Badge variant="outline">Modo Teste</Badge>
                  )}
                </div>
              </div>
              <Button onClick={testarConexao} disabled={testando} variant="outline">
                {testando ? "Testando..." : "Testar Conexão"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Lembretes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Configurações de Lembretes
            </CardTitle>
            <CardDescription>
              Configure quando e como enviar lembretes automáticos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="lembretesEnabled">Lembretes Automáticos</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar lembretes para agendamentos confirmados
                </p>
              </div>
              <Switch
                id="lembretesEnabled"
                checked={configuracoes.lembretesEnabled}
                onCheckedChange={(checked) => 
                  setConfiguracoes(prev => ({ ...prev, lembretesEnabled: checked }))
                }
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="intervaloVerificacao">Intervalo de Verificação (minutos)</Label>
                <Input
                  id="intervaloVerificacao"
                  type="number"
                  min="5"
                  max="120"
                  value={configuracoes.intervaloVerificacao}
                  onChange={(e) => 
                    setConfiguracoes(prev => ({ 
                      ...prev, 
                      intervaloVerificacao: parseInt(e.target.value) || 30 
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Horários de Lembrete</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="lembretes24h"
                    checked={configuracoes.lembretes24h}
                    onCheckedChange={(checked) => 
                      setConfiguracoes(prev => ({ ...prev, lembretes24h: checked }))
                    }
                  />
                  <Label htmlFor="lembretes24h">24 horas antes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="lembretes2h"
                    checked={configuracoes.lembretes2h}
                    onCheckedChange={(checked) => 
                      setConfiguracoes(prev => ({ ...prev, lembretes2h: checked }))
                    }
                  />
                  <Label htmlFor="lembretes2h">2 horas antes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="lembretes1h"
                    checked={configuracoes.lembretes1h}
                    onCheckedChange={(checked) => 
                      setConfiguracoes(prev => ({ ...prev, lembretes1h: checked }))
                    }
                  />
                  <Label htmlFor="lembretes1h">1 hora antes</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Notificações */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Notificações por Email
            </CardTitle>
            <CardDescription>
              Configure quais tipos de email serão enviados automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="confirmacaoCriacao"
                  checked={configuracoes.confirmacaoCriacao}
                  onCheckedChange={(checked) => 
                    setConfiguracoes(prev => ({ ...prev, confirmacaoCriacao: checked }))
                  }
                />
                <Label htmlFor="confirmacaoCriacao">Confirmação da Solicitação</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="confirmacaoAprovacao"
                  checked={configuracoes.confirmacaoAprovacao}
                  onCheckedChange={(checked) => 
                    setConfiguracoes(prev => ({ ...prev, confirmacaoAprovacao: checked }))
                  }
                />
                <Label htmlFor="confirmacaoAprovacao">Confirmação de Aprovação</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="confirmacaoRejeicao"
                  checked={configuracoes.confirmacaoRejeicao}
                  onCheckedChange={(checked) => 
                    setConfiguracoes(prev => ({ ...prev, confirmacaoRejeicao: checked }))
                  }
                />
                <Label htmlFor="confirmacaoRejeicao">Notificação de Rejeição</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="confirmacaoCancelamento"
                  checked={configuracoes.confirmacaoCancelamento}
                  onCheckedChange={(checked) => 
                    setConfiguracoes(prev => ({ ...prev, confirmacaoCancelamento: checked }))
                  }
                />
                <Label htmlFor="confirmacaoCancelamento">Confirmação de Cancelamento</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teste de Email */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Teste de Email
            </CardTitle>
            <CardDescription>
              Teste o envio de emails com dados de exemplo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nomeTeste">Nome do Cliente Teste</Label>
                <Input
                  id="nomeTeste"
                  value={configuracoes.nomeTeste}
                  onChange={(e) => 
                    setConfiguracoes(prev => ({ ...prev, nomeTeste: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="emailTeste">Email para Teste</Label>
                <Input
                  id="emailTeste"
                  type="email"
                  placeholder="seu@email.com"
                  value={configuracoes.emailTeste}
                  onChange={(e) => 
                    setConfiguracoes(prev => ({ ...prev, emailTeste: e.target.value }))
                  }
                />
              </div>
            </div>
            <Button 
              onClick={testarEnvio} 
              disabled={testando || !configuracoes.emailTeste}
              className="w-full md:w-auto"
            >
              {testando ? "Enviando..." : "Enviar Email de Teste"}
            </Button>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex gap-4">
          <Button onClick={salvarConfiguracoes} className="flex-1">
            Salvar Configurações
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/teste-email'}
          >
            Ir para Teste Completo
          </Button>
        </div>
      </div>
    </div>
  );
};
