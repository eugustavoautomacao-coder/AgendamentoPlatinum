import { Request, Response } from 'express';
import { evolutionAPIService } from '@/services/evolutionAPIService';

// Middleware para validar autenticação (opcional - você pode implementar sua própria lógica)
const validateRequest = (req: Request, res: Response, next: Function) => {
  // Aqui você pode implementar validação específica se necessário
  // Por exemplo, verificar API key, rate limiting, etc.
  next();
};

// GET /api/evolution/salon/:salonId/info
export const getSalonInfo = async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    
    const result = await evolutionAPIService.getSalonInfo(salonId);
    res.json(result);
  } catch (error) {
    console.error('❌ Erro no endpoint de informações do salão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// GET /api/evolution/salon/:salonId/services
export const getServices = async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    
    const result = await evolutionAPIService.getServices(salonId);
    res.json(result);
  } catch (error) {
    console.error('❌ Erro no endpoint de serviços:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// GET /api/evolution/salon/:salonId/professionals
export const getProfessionals = async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    
    const result = await evolutionAPIService.getProfessionals(salonId);
    res.json(result);
  } catch (error) {
    console.error('❌ Erro no endpoint de profissionais:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// GET /api/evolution/salon/:salonId/availability
export const getAvailability = async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { serviceId, professionalId, date, clientPhone, clientName, clientEmail } = req.query;

    if (!serviceId || !professionalId) {
      return res.status(400).json({
        success: false,
        error: 'serviceId e professionalId são obrigatórios'
      });
    }

    const result = await evolutionAPIService.getAvailability({
      salonId,
      serviceId: serviceId as string,
      professionalId: professionalId as string,
      date: date as string,
      clientPhone: clientPhone as string || '',
      clientName: clientName as string,
      clientEmail: clientEmail as string
    });

    res.json(result);
  } catch (error) {
    console.error('❌ Erro no endpoint de disponibilidade:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// POST /api/evolution/salon/:salonId/booking
export const createBooking = async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { serviceId, professionalId, dateTime, clientPhone, clientName, clientEmail, notes } = req.body;

    if (!serviceId || !professionalId || !dateTime || !clientPhone) {
      return res.status(400).json({
        success: false,
        error: 'serviceId, professionalId, dateTime e clientPhone são obrigatórios'
      });
    }

    const result = await evolutionAPIService.createBooking({
      salonId,
      serviceId,
      professionalId,
      dateTime,
      clientPhone,
      clientName,
      clientEmail,
      notes
    });

    res.json(result);
  } catch (error) {
    console.error('❌ Erro no endpoint de agendamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// DELETE /api/evolution/salon/:salonId/booking/:appointmentId
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const { salonId, appointmentId } = req.params;
    const { reason } = req.body;

    const result = await evolutionAPIService.cancelBooking(salonId, appointmentId, reason);
    res.json(result);
  } catch (error) {
    console.error('❌ Erro no endpoint de cancelamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// GET /api/evolution/salon/:salonId/bookings
export const getClientBookings = async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { clientPhone } = req.query;

    if (!clientPhone) {
      return res.status(400).json({
        success: false,
        error: 'clientPhone é obrigatório'
      });
    }

    const result = await evolutionAPIService.getClientBookings(salonId, clientPhone as string);
    res.json(result);
  } catch (error) {
    console.error('❌ Erro no endpoint de consulta de agendamentos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// GET /api/evolution/salon/:salonId/booking/code/:confirmationCode
export const getBookingByCode = async (req: Request, res: Response) => {
  try {
    const { salonId, confirmationCode } = req.params;

    const result = await evolutionAPIService.getBookingByCode(salonId, confirmationCode);
    res.json(result);
  } catch (error) {
    console.error('❌ Erro no endpoint de busca por código:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// POST /api/evolution/webhook/:salonId
export const webhookHandler = async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { event, data } = req.body;

    console.log(`📱 Webhook Evolution API recebido para salão ${salonId}:`, { event, data });

    // Processar diferentes tipos de eventos
    switch (event) {
      case 'appointment.status.changed':
        await handleAppointmentStatusChange(salonId, data);
        break;
      
      case 'appointment.reminder':
        await handleAppointmentReminder(salonId, data);
        break;
      
      case 'client.created':
        await handleClientCreated(salonId, data);
        break;
      
      default:
        console.log(`⚠️ Evento não reconhecido: ${event}`);
    }

    res.json({ success: true, message: 'Webhook processado com sucesso' });
  } catch (error) {
    console.error('❌ Erro no webhook Evolution API:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Handlers para diferentes eventos
async function handleAppointmentStatusChange(salonId: string, data: any) {
  try {
    // Notificar Evolution API sobre mudança de status
    const webhookUrl = import.meta.env.VITE_EVOLUTION_WEBHOOK_URL;
    
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Platinum-Source': 'platinum-system'
        },
        body: JSON.stringify({
          event: 'appointment.status.changed',
          salonId,
          data: {
            appointmentId: data.appointmentId,
            status: data.status,
            clientPhone: data.clientPhone,
            message: data.message
          },
          timestamp: new Date().toISOString()
        })
      });
    }
  } catch (error) {
    console.error('❌ Erro ao processar mudança de status:', error);
  }
}

async function handleAppointmentReminder(salonId: string, data: any) {
  try {
    // Enviar lembrete via Evolution API
    const webhookUrl = import.meta.env.VITE_EVOLUTION_WEBHOOK_URL;
    
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Platinum-Source': 'platinum-system'
        },
        body: JSON.stringify({
          event: 'appointment.reminder',
          salonId,
          data: {
            appointmentId: data.appointmentId,
            clientPhone: data.clientPhone,
            appointmentTime: data.appointmentTime,
            serviceName: data.serviceName,
            professionalName: data.professionalName,
            message: data.message
          },
          timestamp: new Date().toISOString()
        })
      });
    }
  } catch (error) {
    console.error('❌ Erro ao processar lembrete:', error);
  }
}

async function handleClientCreated(salonId: string, data: any) {
  try {
    // Notificar Evolution API sobre novo cliente
    const webhookUrl = import.meta.env.VITE_EVOLUTION_WEBHOOK_URL;
    
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Platinum-Source': 'platinum-system'
        },
        body: JSON.stringify({
          event: 'client.created',
          salonId,
          data: {
            clientId: data.clientId,
            clientName: data.clientName,
            clientPhone: data.clientPhone,
            clientEmail: data.clientEmail
          },
          timestamp: new Date().toISOString()
        })
      });
    }
  } catch (error) {
    console.error('❌ Erro ao processar novo cliente:', error);
  }
}

// GET /api/evolution/health
export const healthCheck = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: 'Evolution API está funcionando',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Exportar middleware para uso nas rotas
export { validateRequest };
