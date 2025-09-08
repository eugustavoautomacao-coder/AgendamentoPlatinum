import { EmailOptions, AgendamentoEmailData } from '@/settings/email.config';
import { emailTemplates } from '@/settings/emailTemplates';

export class EmailService {
  private apiUrl: string;
  
  constructor() {
    // URL do servidor Express
    this.apiUrl = 'http://localhost:3001/api/email';
  }
  
  // Testar conexão SMTP via API
  async testarConexao(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Conexão SMTP estabelecida com sucesso!');
        return true;
      } else {
        console.error('❌ Erro na conexão SMTP:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao testar conexão SMTP:', error);
      return false;
    }
  }
  
  // Enviar email genérico via API
  async enviarEmail(options: EmailOptions): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Email enviado com sucesso:', result.messageId);
        return true;
      } else {
        console.error('❌ Erro ao enviar email:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      return false;
    }
  }
  
  // Template: Confirmação da Solicitação de Agendamento
  async enviarConfirmacaoAgendamento(data: AgendamentoEmailData): Promise<boolean> {
    const content = emailTemplates.confirmacaoAgendamento(data);
    const html = emailTemplates.baseTemplate(content, 'Solicitação de Agendamento Enviada');

    return await this.enviarEmail({
      to: data.cliente_email,
      subject: `📋 Solicitação de Agendamento Enviada - ${data.servico_nome}`,
      html
    });
  }

  // Template: Confirmação da Solicitação de Agendamento com Credenciais
  async enviarConfirmacaoAgendamentoComCredenciais(data: AgendamentoEmailData, senhaTemporaria: string): Promise<boolean> {
    const content = emailTemplates.confirmacaoAgendamentoComCredenciais(data, senhaTemporaria);
    const html = emailTemplates.baseTemplate(content, 'Solicitação de Agendamento Enviada - Suas Credenciais');

    return await this.enviarEmail({
      to: data.cliente_email,
      subject: `📋 Solicitação de Agendamento Enviada - Suas Credenciais de Acesso`,
      html
    });
  }
  
  // Template: Aprovação de Agendamento
  async enviarAprovacaoAgendamento(data: AgendamentoEmailData): Promise<boolean> {
    const content = emailTemplates.aprovacaoAgendamento(data);
    const html = emailTemplates.baseTemplate(content, 'Agendamento Aprovado');

    return await this.enviarEmail({
      to: data.cliente_email,
      subject: `✅ Agendamento Aprovado - ${data.servico_nome}`,
      html
    });
  }
  
  // Template: Rejeição de Agendamento
  async enviarRejeicaoAgendamento(data: AgendamentoEmailData): Promise<boolean> {
    const content = emailTemplates.rejeicaoAgendamento(data);
    const html = emailTemplates.baseTemplate(content, 'Agendamento Rejeitado');

    return await this.enviarEmail({
      to: data.cliente_email,
      subject: `❌ Agendamento Rejeitado - ${data.servico_nome}`,
      html
    });
  }
  
  // Template: Lembrete de Agendamento
  async enviarLembreteAgendamento(data: AgendamentoEmailData): Promise<boolean> {
    const content = emailTemplates.lembreteAgendamento(data);
    const html = emailTemplates.baseTemplate(content, 'Lembrete de Agendamento');

    return await this.enviarEmail({
      to: data.cliente_email,
      subject: `⏰ Lembrete: Seu agendamento é amanhã!`,
      html
    });
  }
  
  // Template: Cancelamento de Agendamento
  async enviarCancelamentoAgendamento(data: AgendamentoEmailData): Promise<boolean> {
    const content = emailTemplates.cancelamentoAgendamento(data);
    const html = emailTemplates.baseTemplate(content, 'Agendamento Cancelado');

    return await this.enviarEmail({
      to: data.cliente_email,
      subject: `🚫 Agendamento Cancelado - ${data.servico_nome}`,
      html
    });
  }
  
  // Utilitários
  private formatarDataHora(dataHora: string): string {
    const data = new Date(dataHora);
    return data.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
