export const emailTemplates = {
  // Template base com CSS inline para compatibilidade
  baseTemplate: (content: string, title: string) => `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #fdf2f8; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
        }
        .header { 
          background: linear-gradient(135deg, #d63384 0%, #e91e63 100%); 
          padding: 30px 20px; 
          text-align: center; 
        }
        .logo { 
          font-size: 28px; 
          font-weight: bold; 
          color: #ffffff; 
          margin-bottom: 10px; 
        }
        .subtitle { 
          color: #fce7f3; 
          font-size: 16px; 
        }
        .content { 
          padding: 40px 30px; 
        }
        .title { 
          color: #d63384; 
          font-size: 24px; 
          font-weight: 600; 
          margin-bottom: 20px; 
          text-align: center; 
        }
        .info-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 20px; 
          margin: 25px 0; 
        }
        .info-item { 
          background-color: #fdf2f8; 
          padding: 15px; 
          border-radius: 8px; 
          border-left: 4px solid #e91e63; 
        }
        .info-label { 
          font-weight: 600; 
          color: #d63384; 
          font-size: 14px; 
          text-transform: uppercase; 
          margin-bottom: 5px; 
        }
        .info-value { 
          color: #333; 
          font-size: 16px; 
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #d63384 0%, #e91e63 100%); 
          color: #ffffff; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          text-align: center; 
          margin: 20px 0; 
          transition: all 0.3s ease; 
        }
        .button:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 6px 12px rgba(214, 51, 132, 0.3); 
        }
        .footer { 
          background-color: #fdf2f8; 
          padding: 20px; 
          text-align: center; 
          color: #666; 
          font-size: 14px; 
        }
        .status-badge { 
          display: inline-block; 
          padding: 8px 16px; 
          border-radius: 20px; 
          font-weight: 600; 
          font-size: 14px; 
          text-transform: uppercase; 
        }
        .status-pendente { 
          background-color: #fff3cd; 
          color: #856404; 
        }
        .status-aprovado { 
          background-color: #d4edda; 
          color: #155724; 
        }
        .status-rejeitado { 
          background-color: #f8d7da; 
          color: #721c24; 
        }
        .status-cancelado { 
          background-color: #e2e3e5; 
          color: #383d41; 
        }
        .divider { 
          height: 1px; 
          background-color: #e9ecef; 
          margin: 25px 0; 
        }
        .price-highlight { 
          color: #d63384; 
          font-weight: 600; 
        }
        @media (max-width: 600px) {
          .info-grid { 
            grid-template-columns: 1fr; 
          }
          .content { 
            padding: 30px 20px; 
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">AlveX</div>
          <div class="subtitle">Sistema de Agendamentos</div>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>Este é um email automático do sistema AlveX</p>
          <p>Para dúvidas, entre em contato com o estabelecimento</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Template de confirmação da solicitação de agendamento (enviado quando cliente cria solicitação)
  // IMPORTANTE: Este email NÃO confirma aprovação, apenas confirma que a solicitação foi enviada
  confirmacaoAgendamento: (data: any) => `
    <div class="title">📋 Solicitação de Agendamento Enviada!</div>
    
    <p>Olá <strong>${data.cliente_nome}</strong>,</p>
    <p>Sua solicitação de agendamento foi enviada com sucesso ao salão! Aqui estão os detalhes:</p>
    
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Serviço</div>
        <div class="info-value">${data.servico_nome}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Profissional</div>
        <div class="info-value">${data.funcionario_nome}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Data Solicitada</div>
        <div class="info-value">${new Date(data.data_hora).toLocaleDateString('pt-BR')}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Horário</div>
        <div class="info-value">${new Date(data.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Preço</div>
        <div class="info-value price-highlight">R$ ${data.preco.toFixed(2)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Duração</div>
        <div class="info-value">${data.duracao_minutos} min</div>
      </div>
    </div>
    
    ${data.observacoes ? `
      <div class="divider"></div>
      <p><strong>Observações:</strong></p>
      <p style="background-color: #fdf2f8; padding: 15px; border-radius: 8px; border-left: 4px solid #e91e63;">
        ${data.observacoes}
      </p>
    ` : ''}
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <p style="margin: 0; color: #856404; font-weight: 600;">⏳ Status da Solicitação</p>
      <p style="margin: 10px 0 0 0; color: #856404;">
        Sua solicitação está sendo analisada pelo salão. Você receberá uma notificação por email assim que for aprovada ou rejeitada.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="#" class="button">Acompanhar Solicitação</a>
    </div>
    
    <p><strong>Próximos passos:</strong></p>
    <ol style="color: #666; line-height: 1.8;">
      <li>Aguarde a análise do salão (geralmente em até 24h)</li>
      <li>Verifique seu email para receber a confirmação</li>
      <li>Em caso de aprovação, confirme sua presença</li>
      <li>Em caso de rejeição, entre em contato para reagendar</li>
    </ol>
    
    <p style="color: #666; font-size: 14px; margin-top: 20px;">
      <strong>Dúvidas?</strong> Entre em contato diretamente com o salão para mais informações.
    </p>
  `,

  // Template de aprovação de agendamento
  aprovacaoAgendamento: (data: any) => `
    <div class="title">🎉 Agendamento Aprovado!</div>
    
    <p>Olá <strong>${data.cliente_nome}</strong>,</p>
    <p>Seu agendamento foi <strong>aprovado</strong> pelo estabelecimento! Aqui estão os detalhes:</p>
    
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Serviço</div>
        <div class="info-value">${data.servico_nome}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Profissional</div>
        <div class="info-value">${data.funcionario_nome}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Data</div>
        <div class="info-value">${new Date(data.data_hora).toLocaleDateString('pt-BR')}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Horário</div>
        <div class="info-value">${new Date(data.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Preço</div>
        <div class="info-value price-highlight">R$ ${data.preco.toFixed(2)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Duração</div>
        <div class="info-value">${data.duracao_minutos} min</div>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <span class="status-badge status-aprovado">Aprovado</span>
    </div>
    
    <p><strong>Próximos passos:</strong></p>
    <ol style="color: #666; line-height: 1.8;">
      <li>Confirme sua presença</li>
      <li>Chegue no horário marcado</li>
      <li>Traga documentos necessários</li>
    </ol>
  `,

  // Template de rejeição de agendamento
  rejeicaoAgendamento: (data: any) => `
    <div class="title">❌ Agendamento Não Aprovado</div>
    
    <p>Olá <strong>${data.cliente_nome}</strong>,</p>
    <p>Infelizmente seu agendamento não foi aprovado pelo estabelecimento.</p>
    
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Serviço</div>
        <div class="info-value">${data.servico_nome}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Profissional</div>
        <div class="info-value">${data.funcionario_nome}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Data Solicitada</div>
        <div class="info-value">${new Date(data.data_hora).toLocaleDateString('pt-BR')}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Horário</div>
        <div class="info-value">${new Date(data.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <span class="status-badge status-rejeitado">Não Aprovado</span>
    </div>
    
    ${data.motivo_rejeicao ? `
      <div class="divider"></div>
      <p><strong>Motivo da não aprovação:</strong></p>
      <p style="background-color: #fdf2f8; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545; color: #721c24;">
        ${data.motivo_rejeicao}
      </p>
    ` : ''}
    
    <p><strong>Alternativas:</strong></p>
    <ul style="color: #666; line-height: 1.8;">
      <li>Entre em contato para agendar outro horário</li>
      <li>Verifique a disponibilidade de outros profissionais</li>
      <li>Considere outros serviços disponíveis</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="#" class="button">Fazer Nova Solicitação</a>
    </div>
  `,

  // Template de cancelamento de agendamento
  cancelamentoAgendamento: (data: any) => `
    <div class="title">🚫 Agendamento Cancelado</div>
    
    <p>Olá <strong>${data.cliente_nome}</strong>,</p>
    <p>Seu agendamento foi <strong>cancelado</strong> com sucesso.</p>
    
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Serviço</div>
        <div class="info-value">${data.servico_nome}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Profissional</div>
        <div class="info-value">${data.funcionario_nome}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Data</div>
        <div class="info-value">${new Date(data.data_hora).toLocaleDateString('pt-BR')}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Horário</div>
        <div class="info-value">${new Date(data.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <span class="status-badge status-cancelado">Cancelado</span>
    </div>
    
    <p><strong>Para reagendar:</strong></p>
    <ul style="color: #666; line-height: 1.8;">
      <li>Acesse o sistema de agendamentos</li>
      <li>Escolha um novo horário disponível</li>
      <li>Confirme a nova data e horário</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="#" class="button">Fazer Novo Agendamento</a>
    </div>
  `,

  // Template de lembrete de agendamento
  lembreteAgendamento: (data: any) => `
    <div class="title">⏰ Lembrete de Agendamento</div>
    
    <p>Olá <strong>${data.cliente_nome}</strong>,</p>
    <p>Este é um lembrete do seu agendamento para <strong>amanhã</strong>:</p>
    
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Serviço</div>
        <div class="info-value">${data.servico_nome}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Profissional</div>
        <div class="info-value">${data.funcionario_nome}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Data</div>
        <div class="info-value">${new Date(data.data_hora).toLocaleDateString('pt-BR')}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Horário</div>
        <div class="info-value">${new Date(data.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Preço</div>
        <div class="info-value price-highlight">R$ ${data.preco.toFixed(2)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Duração</div>
        <div class="info-value">${data.duracao_minutos} min</div>
      </div>
    </div>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <p style="margin: 0; color: #856404; font-weight: 600;">📋 Checklist para o dia:</p>
      <ul style="margin: 10px 0 0 0; color: #856404;">
        <li>Documentos necessários</li>
        <li>Chegar com 10 minutos de antecedência</li>
        <li>Confirmar presença</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="#" class="button">Ver Detalhes</a>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      <strong>Precisa cancelar?</strong> Entre em contato o quanto antes para reagendar.
    </p>
  `
};

export interface EmailTemplateData {
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
