export const emailConfig = {
  provider: 'brevo',
  smtp: {
    host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
    secure: process.env.BREVO_SMTP_SECURE === 'true',
    auth: {
      user: process.env.BREVO_SMTP_USER || '95bbc9001@smtp-brevo.com',
      pass: process.env.BREVO_API_KEY || ''
    }
  },
  from: {
    name: process.env.BREVO_FROM_NAME || 'Platinum - Sistema de Agendamentos',
    email: process.env.BREVO_FROM_EMAIL || '95bbc9001@smtp-brevo.com'
  },
  templates: {
    confirmacao: 'confirmacao_agendamento',
    lembrete: 'lembrete_agendamento',
    cancelamento: 'cancelamento_agendamento',
    aprovacao: 'aprovacao_agendamento',
    rejeicao: 'rejeicao_agendamento'
  }
};

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface AgendamentoEmailData {
  cliente_nome: string;
  cliente_email: string;
  servico_nome: string;
  funcionario_nome: string;
  data_hora: string;
  preco: number;
  duracao_minutos: number;
  observacoes?: string;
  motivo_rejeicao?: string;
}
