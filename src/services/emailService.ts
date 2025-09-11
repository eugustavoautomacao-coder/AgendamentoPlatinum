import { EmailOptions, AgendamentoEmailData } from '@/settings/email.config';
import { emailTemplates } from '@/settings/emailTemplates';

export class EmailService {
  private apiUrl: string;
  
  constructor() {
    // URL da Edge Function do Supabase
    this.apiUrl = 'https://lbpqmdcmoybuuthzezmj.supabase.co/functions/v1/send-email';
  }
  
  // Testar conexão SMTP via API
  async testarConexao(): Promise<boolean> {
    try {
      // Teste simples enviando um email de teste
      const testResult = await this.enviarEmail({
        to: 'teste@exemplo.com',
        subject: 'Teste de Conexão',
        html: '<p>Teste de conexão SMTP</p>'
      });
      
      if (testResult) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Erro ao testar conexão SMTP:', error);
      return false;
    }
  }
  
  // Enviar email genérico via API
  async enviarEmail(options: EmailOptions): Promise<boolean> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(options)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro HTTP:', response.status, errorText);
        return false;
      }
      
      const result = await response.json();
      
      if (result.success) {
        return true;
      } else {
        console.error('Erro ao enviar email:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }
  
  // Template: Confirmação da Solicitação de Agendamento
  async enviarConfirmacaoAgendamento(data: AgendamentoEmailData): Promise<boolean> {
    const content = emailTemplates.confirmacaoAgendamento(data);
    const html = emailTemplates.baseTemplate(content, 'Solicitação de Agendamento Enviada');

    return await this.enviarEmail({
      to: data.cliente_email,
      subject: `Solicitação de Agendamento Enviada - ${data.servico_nome}`,
      html
    });
  }

  // Template: Confirmação da Solicitação de Agendamento com Credenciais
  async enviarConfirmacaoAgendamentoComCredenciais(data: AgendamentoEmailData, senhaTemporaria: string): Promise<boolean> {
    const content = emailTemplates.confirmacaoAgendamentoComCredenciais(data, senhaTemporaria);
    const html = emailTemplates.baseTemplate(content, 'Solicitação de Agendamento Enviada - Suas Credenciais');

    return await this.enviarEmail({
      to: data.cliente_email,
      subject: `Solicitação de Agendamento Enviada - Suas Credenciais de Acesso`,
      html
    });
  }
  
  // Template: Aprovação de Agendamento
  async enviarAprovacaoAgendamento(data: AgendamentoEmailData): Promise<boolean> {
    const content = emailTemplates.aprovacaoAgendamento(data);
    const html = emailTemplates.baseTemplate(content, 'Agendamento Aprovado');

    return await this.enviarEmail({
      to: data.cliente_email,
      subject: `Agendamento Aprovado ✅ - ${data.servico_nome}`,
      html
    });
  }
  
  // Template: Rejeição de Agendamento
  async enviarRejeicaoAgendamento(data: AgendamentoEmailData): Promise<boolean> {
    const content = emailTemplates.rejeicaoAgendamento(data);
    const html = emailTemplates.baseTemplate(content, 'Agendamento Rejeitado');

    return await this.enviarEmail({
      to: data.cliente_email,
      subject: `Agendamento Rejeitado ❌ - ${data.servico_nome}`,
      html
    });
  }
  
  // Template: Lembrete de Agendamento
  async enviarLembreteAgendamento(data: AgendamentoEmailData): Promise<boolean> {
    const content = emailTemplates.lembreteAgendamento(data);
    const html = emailTemplates.baseTemplate(content, 'Lembrete de Agendamento');

    return await this.enviarEmail({
      to: data.cliente_email,
      subject: ` Lembrete: Seu agendamento é amanhã! ⏰`,
      html
    });
  }
  
  // Template: Cancelamento de Agendamento
  async enviarCancelamentoAgendamento(data: AgendamentoEmailData): Promise<boolean> {
    const content = emailTemplates.cancelamentoAgendamento(data);
    const html = emailTemplates.baseTemplate(content, 'Agendamento Cancelado');

    return await this.enviarEmail({
      to: data.cliente_email,
      subject: ` Agendamento Cancelado 🚫 - ${data.servico_nome}`,
      html
    });
  }
  
  // Template: Reset de Senha
  async sendPasswordResetEmail(data: { to: string; nome: string; resetLink: string }): Promise<boolean> {
    const content = `
      <div style="text-align: center; padding: 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">Redefinir Senha</h2>
        <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
          Olá <strong>${data.nome}</strong>,
        </p>
        <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
          Você solicitou a redefinição de sua senha. Clique no botão abaixo para criar uma nova senha:
        </p>
        <a href="${data.resetLink}" 
           style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Redefinir Senha
        </a>
        <p style="color: #999; font-size: 14px; margin-top: 30px;">
          Este link expira em 24 horas. Se você não solicitou esta redefinição, ignore este email.
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          Se o botão não funcionar, copie e cole este link no seu navegador:<br>
          <span style="word-break: break-all;">${data.resetLink}</span>
        </p>
      </div>
    `;
    
    const html = emailTemplates.baseTemplate(content, 'Redefinir Senha');

    return await this.enviarEmail({
      to: data.to,
      subject: '🔐 Redefinir sua senha',
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
