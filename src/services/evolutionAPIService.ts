import { supabase } from '@/integrations/supabase/client';

// Interfaces para Evolution API Integration
export interface EvolutionAPIRequest {
  salonId: string;
  clientPhone: string;
  clientName?: string;
  clientEmail?: string;
}

export interface AvailabilityRequest extends EvolutionAPIRequest {
  serviceId?: string;
  professionalId?: string;
  date?: string; // YYYY-MM-DD
}

export interface BookingRequest extends EvolutionAPIRequest {
  serviceId: string;
  professionalId: string;
  dateTime: string; // ISO string
  notes?: string;
}

export interface EvolutionAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  professionalId: string;
  professionalName: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
}

export interface Professional {
  id: string;
  name: string;
  specialties: string[];
  avatar?: string;
}

export interface SalonInfo {
  id: string;
  name: string;
  phone: string;
  address: string;
  workingHours: any;
}

export interface Appointment {
  id: string;
  serviceName: string;
  professionalName: string;
  dateTime: string;
  status: string;
  price: number;
  confirmationCode: string;
}

export class EvolutionAPIService {
  // Validar se o salão existe e está ativo
  private async validateSalon(salonId: string): Promise<boolean> {
    try {
      const { data: salon, error } = await supabase
        .from('salons')
        .select('id')
        .eq('id', salonId)
        .single();

      return !error && !!salon;
    } catch (error) {
      console.error('❌ Erro ao validar salão:', error);
      return false;
    }
  }

  // 1. CONSULTAR INFORMAÇÕES DO SALÃO
  async getSalonInfo(salonId: string): Promise<EvolutionAPIResponse<SalonInfo>> {
    try {
      if (!await this.validateSalon(salonId)) {
        return {
          success: false,
          error: 'Salão não encontrado'
        };
      }

      const { data: salon, error } = await supabase
        .from('salons')
        .select('*')
        .eq('id', salonId)
        .single();

      if (error || !salon) {
        return {
          success: false,
          error: 'Erro ao buscar informações do salão'
        };
      }

      return {
        success: true,
        data: {
          id: salon.id,
          name: salon.name,
          phone: salon.phone,
          address: salon.address,
          workingHours: salon.working_hours
        }
      };
    } catch (error) {
      console.error('❌ Erro ao buscar informações do salão:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // 2. LISTAR SERVIÇOS DISPONÍVEIS
  async getServices(salonId: string): Promise<EvolutionAPIResponse<Service[]>> {
    try {
      if (!await this.validateSalon(salonId)) {
        return {
          success: false,
          error: 'Salão não encontrado'
        };
      }

      const { data: services, error } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonId)
        .eq('is_active', true)
        .order('name');

      if (error) {
        return {
          success: false,
          error: 'Erro ao buscar serviços'
        };
      }

      const formattedServices: Service[] = (services || []).map(service => ({
        id: service.id,
        name: service.name,
        description: service.description || '',
        duration: service.duracao_minutos,
        price: service.preco,
        category: service.categoria || 'Geral'
      }));

      return {
        success: true,
        data: formattedServices
      };
    } catch (error) {
      console.error('❌ Erro ao buscar serviços:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // 3. LISTAR PROFISSIONAIS DISPONÍVEIS
  async getProfessionals(salonId: string): Promise<EvolutionAPIResponse<Professional[]>> {
    try {
      if (!await this.validateSalon(salonId)) {
        return {
          success: false,
          error: 'Salão não encontrado'
        };
      }

      const { data: professionals, error } = await supabase
        .from('professionals')
        .select(`
          id,
          profiles!inner(name, avatar_url),
          specialties
        `)
        .eq('salon_id', salonId);

      if (error) {
        return {
          success: false,
          error: 'Erro ao buscar profissionais'
        };
      }

      const formattedProfessionals: Professional[] = (professionals || []).map((prof: any) => ({
        id: prof.id,
        name: prof.profiles?.name || 'Profissional',
        specialties: prof.specialties || [],
        avatar: prof.profiles?.avatar_url
      }));

      return {
        success: true,
        data: formattedProfessionals
      };
    } catch (error) {
      console.error('❌ Erro ao buscar profissionais:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // 4. CONSULTAR DISPONIBILIDADE
  async getAvailability(request: AvailabilityRequest): Promise<EvolutionAPIResponse<TimeSlot[]>> {
    try {
      const { salonId, serviceId, professionalId, date } = request;
      const targetDate = date || new Date().toISOString().split('T')[0];

      if (!await this.validateSalon(salonId)) {
        return {
          success: false,
          error: 'Salão não encontrado'
        };
      }

      if (!serviceId || !professionalId) {
        return {
          success: false,
          error: 'serviceId e professionalId são obrigatórios'
        };
      }

      // Buscar informações do serviço
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('duracao_minutos')
        .eq('id', serviceId)
        .eq('salon_id', salonId)
        .single();

      if (serviceError || !service) {
        return {
          success: false,
          error: 'Serviço não encontrado'
        };
      }

      // Buscar informações do profissional
      const { data: professional, error: professionalError } = await supabase
        .from('professionals')
        .select(`
          profiles!inner(name),
          working_hours
        `)
        .eq('id', professionalId)
        .eq('salon_id', salonId)
        .single();

      if (professionalError || !professional) {
        return {
          success: false,
          error: 'Profissional não encontrado'
        };
      }

      // Buscar agendamentos existentes
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          data_hora,
          services!inner(duracao_minutos)
        `)
        .eq('funcionario_id', professionalId)
        .eq('salon_id', salonId)
        .gte('data_hora', `${targetDate}T00:00:00`)
        .lt('data_hora', `${targetDate}T23:59:59`);

      if (appointmentsError) {
        return {
          success: false,
          error: 'Erro ao buscar agendamentos'
        };
      }

      // Gerar slots disponíveis
      const slots: TimeSlot[] = [];
      const workingHours = professional.working_hours || {};
      const dayOfWeek = new Date(targetDate).getDay();
      const dayKey = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][dayOfWeek];

      if (workingHours[dayKey] && workingHours[dayKey].ativo) {
        const { hora_inicio, hora_fim } = workingHours[dayKey];
        const startTime = new Date(`${targetDate}T${hora_inicio}`);
        const endTime = new Date(`${targetDate}T${hora_fim}`);
          const serviceDuration = (service as any)?.duracao_minutos || 60;

        // Gerar slots de 30 em 30 minutos
        for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + 30)) {
          const timeString = time.toTimeString().slice(0, 5);
          const slotDateTime = new Date(time);
          const slotEndTime = new Date(slotDateTime.getTime() + serviceDuration * 60000);

          // Verificar se o slot não conflita com agendamentos existentes
          const isAvailable = !appointments?.some(apt => {
            const aptTime = new Date(apt.data_hora);
            const aptEndTime = new Date(aptTime.getTime() + (apt.services as any)?.duracao_minutos * 60000);
            
            return (slotDateTime >= aptTime && slotDateTime < aptEndTime) ||
                   (slotEndTime > aptTime && slotEndTime <= aptEndTime) ||
                   (slotDateTime <= aptTime && slotEndTime >= aptEndTime);
          });

          slots.push({
            time: timeString,
            available: isAvailable,
            professionalId,
            professionalName: (professional as any)?.profiles?.name || 'Profissional'
          });
        }
      }

      return {
        success: true,
        data: slots
      };
    } catch (error) {
      console.error('❌ Erro ao consultar disponibilidade:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // 5. CRIAR AGENDAMENTO
  async createBooking(request: BookingRequest): Promise<EvolutionAPIResponse<Appointment>> {
    try {
      const { salonId, serviceId, professionalId, dateTime, clientPhone, clientName, clientEmail, notes } = request;

      if (!await this.validateSalon(salonId)) {
        return {
          success: false,
          error: 'Salão não encontrado'
        };
      }

      // Verificar se o slot ainda está disponível
      const date = dateTime.split('T')[0];
      const time = dateTime.split('T')[1].slice(0, 5);
      
      const availability = await this.getAvailability({
        salonId,
        serviceId,
        professionalId,
        date,
        clientPhone
      });

      if (!availability.success || !availability.data) {
        return {
          success: false,
          error: 'Erro ao verificar disponibilidade'
        };
      }

      const slot = availability.data.find(s => s.time === time);
      if (!slot || !slot.available) {
        return {
          success: false,
          error: 'Horário não está mais disponível'
        };
      }

      // Buscar informações do serviço e profissional
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('nome, preco, duracao_minutos')
        .eq('id', serviceId)
        .eq('salon_id', salonId)
        .single();

      const { data: professional, error: professionalError } = await supabase
        .from('professionals')
        .select('profiles!inner(nome)')
        .eq('id', professionalId)
        .eq('salon_id', salonId)
        .single();

      if (serviceError || !service || professionalError || !professional) {
        return {
          success: false,
          error: 'Serviço ou profissional não encontrado'
        };
      }

      // Criar solicitação de agendamento
      const { data: appointmentRequest, error: requestError } = await supabase
        .from('appointment_requests')
        .insert([{
          salao_id: salonId,
          servico_id: serviceId,
          funcionario_id: professionalId,
          data_hora: dateTime,
          cliente_nome: clientName || 'Cliente WhatsApp',
          cliente_telefone: clientPhone,
          cliente_email: clientEmail,
          observacoes: `Agendado via Evolution API WhatsApp. ${notes || ''}`,
          status: 'aprovado' // Auto-aprovar agendamentos via WhatsApp
        }])
        .select()
        .single();

      if (requestError) {
        console.error('❌ Erro ao criar solicitação:', requestError);
        return {
          success: false,
          error: 'Erro ao criar agendamento'
        };
      }

      // Criar agendamento confirmado
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert([{
          salon_id: salonId,
          servico_id: serviceId,
          funcionario_id: professionalId,
          cliente_id: null,
          data_hora: dateTime,
          status: 'confirmado',
          observacoes: `Agendado via Evolution API WhatsApp. ${notes || ''}`,
          valor_total: service.preco
        }])
        .select()
        .single();

      if (appointmentError) {
        console.error('❌ Erro ao criar agendamento:', appointmentError);
        return {
          success: false,
          error: 'Erro ao confirmar agendamento'
        };
      }

      // Atualizar solicitação com ID do agendamento
      await supabase
        .from('appointment_requests')
        .update({ appointment_id: appointment.id })
        .eq('id', appointmentRequest.id);

      // Gerar código de confirmação
      const confirmationCode = `WA${appointment.id.slice(-6).toUpperCase()}`;

      const appointmentData: Appointment = {
        id: appointment.id,
        serviceName: (service as any)?.nome || 'Serviço',
        professionalName: (professional as any)?.profiles?.nome || 'Profissional',
        dateTime: dateTime,
        status: 'confirmado',
        price: (service as any)?.preco || 0,
        confirmationCode
      };

      return {
        success: true,
        data: appointmentData,
        message: `Agendamento confirmado! Código: ${confirmationCode}`
      };
    } catch (error) {
      console.error('❌ Erro ao criar agendamento:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // 6. CANCELAR AGENDAMENTO
  async cancelBooking(salonId: string, appointmentId: string, reason?: string): Promise<EvolutionAPIResponse> {
    try {
      if (!await this.validateSalon(salonId)) {
        return {
          success: false,
          error: 'Salão não encontrado'
        };
      }

      // Buscar agendamento
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .eq('salon_id', salonId)
        .single();

      if (fetchError || !appointment) {
        return {
          success: false,
          error: 'Agendamento não encontrado'
        };
      }

      // Cancelar agendamento
      const { error: cancelError } = await supabase
        .from('appointments')
        .update({
          status: 'cancelado',
          observacoes: `${appointment.observacoes || ''}\nCancelado via Evolution API WhatsApp. Motivo: ${reason || 'Não informado'}`
        })
        .eq('id', appointmentId);

      if (cancelError) {
        return {
          success: false,
          error: 'Erro ao cancelar agendamento'
        };
      }

      return {
        success: true,
        message: 'Agendamento cancelado com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao cancelar agendamento:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // 7. CONSULTAR AGENDAMENTOS DO CLIENTE
  async getClientBookings(salonId: string, clientPhone: string): Promise<EvolutionAPIResponse<Appointment[]>> {
    try {
      if (!await this.validateSalon(salonId)) {
        return {
          success: false,
          error: 'Salão não encontrado'
        };
      }

      // Buscar agendamentos por telefone
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          data_hora,
          status,
          valor_total,
          servico:services(nome),
          funcionario:employees!inner(nome)
        `)
        .eq('salon_id', salonId)
        .eq('cliente_telefone', clientPhone)
        .order('data_hora', { ascending: true });

      if (error) {
        return {
          success: false,
          error: 'Erro ao buscar agendamentos'
        };
      }

      const formattedAppointments: Appointment[] = (appointments || []).map((apt: any) => ({
        id: apt.id,
        serviceName: apt.servico?.nome || 'Serviço',
        professionalName: apt.funcionario?.nome || 'Profissional',
        dateTime: apt.data_hora,
        status: apt.status,
        price: apt.valor_total || 0,
        confirmationCode: `WA${apt.id.slice(-6).toUpperCase()}`
      }));

      return {
        success: true,
        data: formattedAppointments
      };
    } catch (error) {
      console.error('❌ Erro ao buscar agendamentos:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // 8. BUSCAR AGENDAMENTO POR CÓDIGO
  async getBookingByCode(salonId: string, confirmationCode: string): Promise<EvolutionAPIResponse<Appointment>> {
    try {
      if (!await this.validateSalon(salonId)) {
        return {
          success: false,
          error: 'Salão não encontrado'
        };
      }

      // Extrair ID do agendamento do código
      const appointmentId = confirmationCode.replace('WA', '');
      
      // Buscar agendamento
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select(`
          id,
          data_hora,
          status,
          valor_total,
          servico:services(nome),
          funcionario:employees!inner(nome)
        `)
        .eq('salon_id', salonId)
        .like('id', `%${appointmentId}`)
        .single();

      if (error || !appointment) {
        return {
          success: false,
          error: 'Agendamento não encontrado'
        };
      }

      const appointmentData: Appointment = {
        id: appointment.id,
        serviceName: (appointment as any).servico?.nome || 'Serviço',
        professionalName: (appointment as any).funcionario?.nome || 'Profissional',
        dateTime: appointment.data_hora,
        status: appointment.status,
        price: appointment.valor_total || 0,
        confirmationCode
      };

      return {
        success: true,
        data: appointmentData
      };
    } catch (error) {
      console.error('❌ Erro ao buscar agendamento por código:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }
}

// Instância singleton
export const evolutionAPIService = new EvolutionAPIService();
