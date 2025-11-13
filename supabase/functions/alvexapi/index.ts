import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Initialize Supabase client
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    // Extract salonId from path - remove /functions/v1/alvexapi prefix
    const cleanPath = path.replace('/functions/v1/alvexapi', '');
    const pathParts = cleanPath.split('/').filter((part)=>part !== '');
    // Find salonId in path (it's usually the part after 'salon')
    let salonId = null;
    for(let i = 0; i < pathParts.length; i++){
      if (pathParts[i] === 'salon' && i + 1 < pathParts.length) {
        salonId = pathParts[i + 1];
        break;
      }
    }
    console.log(`📱 Evolution API Request: ${method} ${path} - Clean Path: ${cleanPath}`);
    console.log(`🔍 Path parts:`, pathParts);
    console.log(`🔍 Salon ID:`, salonId);
    console.log(`🔍 Full URL:`, url.href);
    // Validate salonId for salon-specific endpoints
    if (path.includes('/salon/') && !salonId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Salon ID não encontrado na URL',
        debug: {
          path,
          cleanPath,
          pathParts,
          salonId
        }
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Route handlers
    // Endpoint raiz - informações da API
    if ((path === '/functions/v1/alvexapi' || path === '/alvexapi' || cleanPath === '' || path.endsWith('/alvexapi')) && method === 'GET') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Platinum Evolution API',
        version: '1.0.0',
        endpoints: {
          health: '/functions/v1/alvexapi/health',
          salonInfo: '/functions/v1/alvexapi/salon/{salonId}/info',
          services: '/functions/v1/alvexapi/salon/{salonId}/services',
          professionals: '/functions/v1/alvexapi/salon/{salonId}/professionals',
          availability: '/functions/v1/alvexapi/salon/{salonId}/availability',
          booking: '/functions/v1/alvexapi/salon/{salonId}/booking',
          bookingStatus: '/functions/v1/alvexapi/salon/{salonId}/booking/{appointmentId}/status',
          bookingReschedule: '/functions/v1/alvexapi/salon/{salonId}/booking/{appointmentId}/reschedule',
          bookingCode: '/functions/v1/alvexapi/salon/{salonId}/booking/code/{confirmationCode}',
          bookings: '/functions/v1/alvexapi/salon/{salonId}/bookings',
          bookingsUpcoming: '/functions/v1/alvexapi/salon/{salonId}/bookings/upcoming',
          client: '/functions/v1/alvexapi/salon/{salonId}/client'
        },
        timestamp: new Date().toISOString()
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Health check endpoint
    if (path.endsWith('/health') && method === 'GET') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Platinum Evolution API está funcionando',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (path.includes('/salon/') && path.includes('/info') && method === 'GET') {
      return await handleGetSalonInfo(supabaseClient, salonId);
    }
    if (path.includes('/salon/') && path.includes('/services') && method === 'GET') {
      return await handleGetServices(supabaseClient, salonId);
    }
    if (path.includes('/salon/') && path.includes('/professionals') && method === 'GET') {
      return await handleGetProfessionals(supabaseClient, salonId);
    }
    if (path.includes('/salon/') && path.includes('/availability') && method === 'GET') {
      return await handleGetAvailability(supabaseClient, salonId, url.searchParams);
    }
    if (path.includes('/salon/') && path.includes('/booking') && method === 'POST') {
      const bookingData = await req.json();
      return await handleCreateBooking(supabaseClient, salonId, bookingData);
    }
    if (path.includes('/salon/') && path.includes('/booking/') && method === 'DELETE') {
      const appointmentId = pathParts[pathParts.length - 1];
      const cancelData = await req.json().catch(()=>({}));
      return await handleCancelBooking(supabaseClient, salonId, appointmentId, cancelData);
    }
    if (path.includes('/salon/') && path.includes('/bookings') && method === 'GET') {
      return await handleGetClientBookings(supabaseClient, salonId, url.searchParams);
    }
    if (path.includes('/salon/') && path.includes('/booking/code/') && method === 'GET') {
      const confirmationCode = pathParts[pathParts.length - 1];
      return await handleGetBookingByCode(supabaseClient, salonId, confirmationCode);
    }
    // Atualizar status do agendamento
    if (path.includes('/salon/') && path.includes('/booking/') && path.includes('/status') && method === 'PATCH') {
      const appointmentId = pathParts[pathParts.findIndex(p => p === 'booking') + 1];
      const statusData = await req.json();
      return await handleUpdateBookingStatus(supabaseClient, salonId, appointmentId, statusData);
    }
    // Reagendar agendamento
    if (path.includes('/salon/') && path.includes('/booking/') && path.includes('/reschedule') && method === 'PUT') {
      const appointmentId = pathParts[pathParts.findIndex(p => p === 'booking') + 1];
      const rescheduleData = await req.json();
      return await handleRescheduleBooking(supabaseClient, salonId, appointmentId, rescheduleData);
    }
    // Buscar cliente por telefone
    if (path.includes('/salon/') && path.includes('/client') && method === 'GET') {
      return await handleGetClientByPhone(supabaseClient, salonId, url.searchParams);
    }
    // Criar/Atualizar cliente
    if (path.includes('/salon/') && path.includes('/client') && method === 'POST') {
      const clientData = await req.json();
      return await handleCreateOrUpdateClient(supabaseClient, salonId, clientData);
    }
    // Listar agendamentos futuros
    if (path.includes('/salon/') && path.includes('/bookings/upcoming') && method === 'GET') {
      return await handleGetUpcomingBookings(supabaseClient, salonId, url.searchParams);
    }
    // Default case - endpoint not found
    return new Response(JSON.stringify({
      success: false,
      error: 'Endpoint não encontrado',
      debug: {
        path,
        method,
        pathParts
      }
    }), {
      status: 404,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Erro na Evolution API:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
// 1. GET /salon/{salonId}/info
async function handleGetSalonInfo(supabaseClient, salonId) {
  try {
    const { data: salon, error } = await supabaseClient.from('saloes').select('*').eq('id', salonId).single();
    if (error || !salon) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Salão não encontrado'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      data: {
        id: salon.id,
        name: salon.nome,
        phone: salon.telefone,
        address: salon.endereco,
        workingHours: salon.working_hours
      }
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar informações do salão:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}
// 2. GET /salon/{salonId}/services
async function handleGetServices(supabaseClient, salonId) {
  try {
    console.log(`🔍 Buscando serviços para salão: ${salonId}`);
    const { data: services, error } = await supabaseClient.from('services').select('*').eq('salao_id', salonId).eq('ativo', true).order('nome');
    console.log(`📊 Resultado da busca de serviços:`, {
      services,
      error
    });
    if (error) {
      console.error('❌ Erro ao buscar serviços:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao buscar serviços',
        details: error.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const formattedServices = (services || []).map((service)=>({
        id: service.id,
        name: service.nome,
        description: service.descricao || '',
        duration: service.duracao_minutos,
        price: service.preco,
        category: service.categoria || 'Geral'
      }));
    return new Response(JSON.stringify({
      success: true,
      data: formattedServices
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar serviços:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}
// 3. GET /salon/{salonId}/professionals
async function handleGetProfessionals(supabaseClient, salonId) {
  try {
    const { data: professionals, error } = await supabaseClient.from('employees').select(`
        id,
        nome,
        avatar_url,
        cargo
      `).eq('salao_id', salonId).eq('ativo', true);
    if (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao buscar profissionais'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const formattedProfessionals = (professionals || []).map((prof)=>({
        id: prof.id,
        name: prof.nome || 'Profissional',
        specialties: [
          prof.cargo || 'Geral'
        ],
        avatar: prof.avatar_url
      }));
    return new Response(JSON.stringify({
      success: true,
      data: formattedProfessionals
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar profissionais:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}
// 4. GET /salon/{salonId}/availability
async function handleGetAvailability(supabaseClient, salonId, searchParams) {
  try {
    const serviceId = searchParams.get('serviceId');
    const professionalId = searchParams.get('professionalId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    if (!serviceId || !professionalId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'serviceId e professionalId são obrigatórios'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Buscar informações do serviço
    const { data: service, error: serviceError } = await supabaseClient.from('services').select('duracao_minutos').eq('id', serviceId).eq('salao_id', salonId).single();
    if (serviceError || !service) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Serviço não encontrado'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Buscar informações do profissional
    const { data: professional, error: professionalError } = await supabaseClient.from('employees').select(`
        nome,
        salao_id
      `).eq('id', professionalId).eq('salao_id', salonId).single();
    if (professionalError || !professional) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Profissional não encontrado'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Buscar agendamentos existentes (confirmados e pendentes devem bloquear o horário)
    const { data: appointments, error: appointmentsError } = await supabaseClient.from('appointments').select(`
        data_hora,
        services!servico_id(duracao_minutos)
      `).eq('funcionario_id', professionalId).eq('salao_id', salonId).in('status', [
      'confirmado',
      'pendente'
    ]).gte('data_hora', `${date}T00:00:00`).lt('data_hora', `${date}T23:59:59`);
    if (appointmentsError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao buscar agendamentos'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Buscar horários bloqueados do funcionário para este dia (igual ao frontend)
    let blockedSlots = [];
    try {
      const { data: blockedData, error: blockedError } = await supabaseClient.from('blocked_slots').select('hora_inicio, hora_fim').eq('funcionario_id', professionalId).eq('salao_id', salonId).eq('data', date);
      if (!blockedError && blockedData && blockedData.length > 0) {
        blockedSlots = blockedData.map((blocked)=>({
            hora_inicio: blocked.hora_inicio,
            hora_fim: blocked.hora_fim
          }));
      }
    } catch (error) {
    // Tabela pode não existir, continuar sem horários bloqueados
    }
    // Gerar slots disponíveis (horário padrão 8h às 18h)
    const slots = [];
    const serviceDuration = service.duracao_minutos;
    // Gerar slots de 1 em 1 hora (8h às 18h) - EXATAMENTE como o frontend faz
    const startHour = 8;
    const endHour = 18;
    for(let hour = startHour; hour < endHour; hour++){
      // Gerar apenas horários cheios (sem minutos fracionados) - igual ao frontend
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      const slotDateTime = new Date(`${date}T${timeString}:00`);
      // Extrair hora do slot (ex: "08:00" -> 8) - usado em múltiplos lugares
      const slotHour = parseInt(timeString.split(':')[0]);
      // Verificar se o slot está disponível (bloquear apenas a hora de início do agendamento)
      // Se um agendamento está marcado para 08:00, apenas 08:00 deve ser bloqueado
      // Ignorar completamente a duração do serviço
      const isAvailableByAppointments = !appointments?.some((apt)=>{
        // Extrair hora do agendamento
        // O agendamento está vindo como "2025-10-29T08:00:00+00:00" (08:00 UTC)
        // Mas o frontend mostra como 08:00 na agenda, então vamos tratar UTC como hora local
        // (o sistema parece estar salvando sem conversão de timezone)
        const aptDate = new Date(apt.data_hora);
        const aptHourUTC = aptDate.getUTCHours();
        // EXTRAIR HORA DIRETAMENTE DA STRING (ignorar timezone)
        // Se está como "2025-10-29T08:00:00+00:00", pegar o "08"
        const timeMatch = apt.data_hora.match(/T(\d{2}):/);
        const aptHourFromString = timeMatch ? parseInt(timeMatch[1]) : aptHourUTC;
        // Usar a hora extraída da string diretamente (como o frontend faz)
        // O frontend mostra 08:00 quando está salvo como 08:00 UTC, então vamos fazer o mesmo
        const aptHour = aptHourFromString;
        // Se as horas são iguais, o slot está ocupado
        return slotHour === aptHour;
      });
      // Verificar se o slot não está bloqueado pelo funcionário (igual ao frontend)
      const isAvailableByBlockedSlots = !blockedSlots?.some((blocked)=>{
        // Normalizar hora_inicio e hora_fim de "HH:MM:SS" para "HH:MM"
        const horaInicio = String(blocked.hora_inicio).slice(0, 5);
        const horaFim = String(blocked.hora_fim).slice(0, 5);
        // Extrair hora de início e fim do bloqueio
        const blockedStartHour = parseInt(horaInicio.split(':')[0]);
        const blockedEndHour = parseInt(horaFim.split(':')[0]);
        // Verificar se o slot está dentro do intervalo bloqueado
        // Se o bloqueio vai de 10:00 até 11:00, então 10:00 está bloqueado
        // Se o bloqueio vai de 10:00 até 12:00, então 10:00 e 11:00 estão bloqueados
        const isBlocked = slotHour >= blockedStartHour && slotHour < blockedEndHour;
        return isBlocked;
      });
      // Slot está disponível se não conflita com agendamentos E não está bloqueado
      const isAvailable = isAvailableByAppointments && isAvailableByBlockedSlots;
      slots.push({
        time: timeString,
        available: isAvailable,
        professionalId,
        professionalName: professional.nome || 'Profissional'
      });
    }
    return new Response(JSON.stringify({
      success: true,
      data: slots
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Erro ao consultar disponibilidade:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}
// 5. POST /salon/{salonId}/booking
async function handleCreateBooking(supabaseClient, salonId, bookingData) {
  try {
    const { serviceId, professionalId, dateTime, clientPhone, clientName, clientEmail, notes } = bookingData;
    if (!serviceId || !professionalId || !dateTime || !clientPhone) {
      return new Response(JSON.stringify({
        success: false,
        error: 'serviceId, professionalId, dateTime e clientPhone são obrigatórios'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // VALIDAÇÕES ESPECÍFICAS DOS CAMPOS DO CLIENTE
    console.log(`🔍 Validando dados do cliente...`);
    // Validar formato do telefone (deve ter pelo menos 10 dígitos)
    const phoneDigits = clientPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Telefone deve ter pelo menos 10 dígitos'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Verificar se cliente já existe (por telefone OU email)
    const { data: existingClient, error: clientSearchError } = await supabaseClient.from('users').select('id, nome, telefone, email').eq('salao_id', salonId).eq('tipo', 'cliente').or(`telefone.eq.${clientPhone}${clientEmail ? `,email.eq.${clientEmail}` : ''}`).single();
    if (existingClient) {
      console.log(`✅ Cliente existente encontrado`);
    // Se cliente existe, usar dados do cadastro (não validar campos obrigatórios)
    } else {
      console.log(`➕ Cliente não existe - validando campos obrigatórios para novo cadastro`);
      // Se cliente não existe, nome é obrigatório (email pode ser opcional se telefone for único)
      if (!clientName || clientName.trim() === '') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Nome do cliente é obrigatório para novos cadastros'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      // Validar nome do cliente (pelo menos 2 caracteres)
      if (clientName.trim().length < 2) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Nome do cliente deve ter pelo menos 2 caracteres'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      // Validar formato do email (se fornecido)
      if (clientEmail && clientEmail.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(clientEmail)) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Formato de email inválido'
          }), {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
      }
    }
    console.log(`✅ Validações dos campos do cliente aprovadas`);
    // Buscar informações do serviço e profissional
    const { data: service, error: serviceError } = await supabaseClient.from('services').select('nome, preco, duracao_minutos').eq('id', serviceId).eq('salao_id', salonId).single();
    const { data: professional, error: professionalError } = await supabaseClient.from('employees').select('nome').eq('id', professionalId).eq('salao_id', salonId).single();
    if (serviceError || !service || professionalError || !professional) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Serviço ou profissional não encontrado'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Tratar data recebida
    let appointmentDateTime;
    if (dateTime.includes('T') && !dateTime.includes('Z') && !dateTime.includes('+')) {
      const [datePart, timePart] = dateTime.split('T');
      const [hours, minutes = '00', seconds = '00'] = timePart.split(':');
      appointmentDateTime = new Date(Date.UTC(
        parseInt(datePart.split('-')[0]),
        parseInt(datePart.split('-')[1]) - 1,
        parseInt(datePart.split('-')[2]),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds.split('.')[0])
      ));
    } else {
      appointmentDateTime = new Date(dateTime);
    }
    // Verificar conflitos
    const { data: conflictingAppointments, error: conflictError } = await supabaseClient.from('appointments').select(`
        id,
        data_hora,
        status,
        services!inner(duracao_minutos)
      `).eq('funcionario_id', professionalId).eq('salao_id', salonId).eq('status', 'confirmado').gte('data_hora', appointmentDateTime.toISOString()).lt('data_hora', new Date(appointmentDateTime.getTime() + service.duracao_minutos * 60000).toISOString());
    if (conflictError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao verificar disponibilidade'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (conflictingAppointments && conflictingAppointments.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Horário não disponível - já existe agendamento neste período'
      }), {
        status: 409,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Usar cliente existente ou criar novo
    let clientId = null;
    let finalClientName = clientName;
    let finalClientEmail = clientEmail;
    if (existingClient) {
      clientId = existingClient.id;
      finalClientName = existingClient.nome;
      finalClientEmail = existingClient.email;
    } else {
      const { data: newClient, error: clientCreateError } = await supabaseClient.from('users').insert([
        {
          salao_id: salonId,
          nome: clientName,
          telefone: clientPhone,
          email: clientEmail || `${clientPhone.replace(/\D/g, '')}@whatsapp.com`,
          tipo: 'cliente',
          senha: `whatsapp${Math.random().toString(36).slice(-6)}`,
          observacoes: `Cliente criado via WhatsApp Agent - ${new Date().toISOString()}`
        }
      ]).select().single();
      if (clientCreateError) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Erro ao criar cliente',
          details: clientCreateError.message
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      clientId = newClient.id;
      finalClientName = newClient.nome;
      finalClientEmail = newClient.email;
    }
    // Criar agendamento
    const { data: appointment, error: appointmentError } = await supabaseClient.from('appointments').insert([
      {
        salao_id: salonId,
        servico_id: serviceId,
        funcionario_id: professionalId,
        cliente_id: clientId,
        data_hora: appointmentDateTime.toISOString(),
        status: 'confirmado',
        observacoes: `Agendado via Evolution API WhatsApp. ${notes || ''}`,
        cliente_nome: finalClientName,
        cliente_telefone: clientPhone,
        cliente_email: finalClientEmail
      }
    ]).select().single();
    if (appointmentError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao confirmar agendamento'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const confirmationCode = `WA${appointment.id.slice(-6).toUpperCase()}`;
    return new Response(JSON.stringify({
      success: true,
      data: {
        id: appointment.id,
        serviceName: service.nome,
        professionalName: professional.nome || 'Profissional',
        clientName: finalClientName,
        clientPhone: clientPhone,
        clientEmail: finalClientEmail,
        dateTime: dateTime,
        status: 'confirmado',
        price: service.preco,
        confirmationCode
      },
      message: `Agendamento confirmado! Código: ${confirmationCode}`
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Erro ao criar agendamento:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}

// 9. PATCH /salon/{salonId}/booking/{appointmentId}/status
async function handleUpdateBookingStatus(supabaseClient, salonId, appointmentId, statusData) {
  try {
    const { status } = statusData;
    if (!status || !['pendente', 'confirmado', 'cancelado', 'concluido'].includes(status)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Status inválido. Use: pendente, confirmado, cancelado ou concluido'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Buscar agendamento
    const { data: appointment, error: fetchError } = await supabaseClient
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('salao_id', salonId)
      .single();

    if (fetchError || !appointment) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Agendamento não encontrado'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Atualizar status
    const { data: updatedAppointment, error: updateError } = await supabaseClient
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId)
      .select(`
        id,
        data_hora,
        status,
        observacoes,
        services!inner(nome, preco),
        employees!inner(nome)
      `)
      .single();

    if (updateError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao atualizar status do agendamento'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: updatedAppointment.id,
        serviceName: updatedAppointment.services?.nome || 'Serviço',
        professionalName: updatedAppointment.employees?.nome || 'Profissional',
        dateTime: updatedAppointment.data_hora,
        status: updatedAppointment.status,
        price: updatedAppointment.services?.preco || 0,
        confirmationCode: `WA${updatedAppointment.id.slice(-6).toUpperCase()}`
      },
      message: `Status do agendamento atualizado para: ${status}`
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar status do agendamento:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}

// 10. PUT /salon/{salonId}/booking/{appointmentId}/reschedule
async function handleRescheduleBooking(supabaseClient, salonId, appointmentId, rescheduleData) {
  try {
    const { newDateTime, reason } = rescheduleData;
    if (!newDateTime) {
      return new Response(JSON.stringify({
        success: false,
        error: 'newDateTime é obrigatório'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Buscar agendamento atual
    const { data: appointment, error: fetchError } = await supabaseClient
      .from('appointments')
      .select(`
        *,
        services!inner(id, duracao_minutos)
      `)
      .eq('id', appointmentId)
      .eq('salao_id', salonId)
      .single();

    if (fetchError || !appointment) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Agendamento não encontrado'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Processar nova data/hora
    let newAppointmentDateTime;
    if (newDateTime.includes('T') && !newDateTime.includes('Z') && !newDateTime.includes('+')) {
      const [datePart, timePart] = newDateTime.split('T');
      const [hours, minutes = '00', seconds = '00'] = timePart.split(':');
      newAppointmentDateTime = new Date(Date.UTC(
        parseInt(datePart.split('-')[0]),
        parseInt(datePart.split('-')[1]) - 1,
        parseInt(datePart.split('-')[2]),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds.split('.')[0])
      ));
    } else {
      newAppointmentDateTime = new Date(newDateTime);
    }

    // Verificar conflitos
    const { data: conflictingAppointments, error: conflictError } = await supabaseClient
      .from('appointments')
      .select('id, data_hora, status')
      .eq('funcionario_id', appointment.funcionario_id)
      .eq('salao_id', salonId)
      .eq('status', 'confirmado')
      .neq('id', appointmentId)
      .gte('data_hora', newAppointmentDateTime.toISOString())
      .lt('data_hora', new Date(newAppointmentDateTime.getTime() + appointment.services.duracao_minutos * 60000).toISOString());

    if (conflictError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao verificar disponibilidade'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    if (conflictingAppointments && conflictingAppointments.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Horário não disponível - já existe agendamento neste período'
      }), {
        status: 409,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Atualizar agendamento
    const { data: updatedAppointment, error: updateError } = await supabaseClient
      .from('appointments')
      .update({
        data_hora: newAppointmentDateTime.toISOString(),
        observacoes: `${appointment.observacoes || ''}\nReagendado via API WhatsApp. Motivo: ${reason || 'Não informado'}. Nova data: ${newDateTime}`
      })
      .eq('id', appointmentId)
      .select(`
        id,
        data_hora,
        status,
        observacoes,
        services!inner(nome, preco),
        employees!inner(nome)
      `)
      .single();

    if (updateError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao reagendar agendamento'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: updatedAppointment.id,
        serviceName: updatedAppointment.services?.nome || 'Serviço',
        professionalName: updatedAppointment.employees?.nome || 'Profissional',
        dateTime: updatedAppointment.data_hora,
        status: updatedAppointment.status,
        price: updatedAppointment.services?.preco || 0,
        confirmationCode: `WA${updatedAppointment.id.slice(-6).toUpperCase()}`
      },
      message: 'Agendamento reagendado com sucesso'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Erro ao reagendar agendamento:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}

// 11. GET /salon/{salonId}/client?phone={phone}
async function handleGetClientByPhone(supabaseClient, salonId, searchParams) {
  try {
    const clientPhone = searchParams.get('phone');
    if (!clientPhone) {
      return new Response(JSON.stringify({
        success: false,
        error: 'phone é obrigatório'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Buscar cliente
    const { data: client, error } = await supabaseClient
      .from('users')
      .select('id, nome, telefone, email')
      .eq('salao_id', salonId)
      .eq('tipo', 'cliente')
      .eq('telefone', clientPhone)
      .single();

    if (error || !client) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cliente não encontrado'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Contar agendamentos do cliente
    const { count } = await supabaseClient
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('salao_id', salonId)
      .eq('cliente_telefone', clientPhone);

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: client.id,
        name: client.nome,
        phone: client.telefone,
        email: client.email,
        appointmentsCount: count || 0
      }
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar cliente:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}

// 12. POST /salon/{salonId}/client
async function handleCreateOrUpdateClient(supabaseClient, salonId, clientData) {
  try {
    const { name, phone, email } = clientData;
    if (!name || !phone) {
      return new Response(JSON.stringify({
        success: false,
        error: 'name e phone são obrigatórios'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Verificar se cliente já existe
    const { data: existingClient } = await supabaseClient
      .from('users')
      .select('id, nome, telefone, email')
      .eq('salao_id', salonId)
      .eq('tipo', 'cliente')
      .eq('telefone', phone)
      .single();

    if (existingClient) {
      // Atualizar cliente existente
      const { data: updatedClient, error: updateError } = await supabaseClient
        .from('users')
        .update({
          nome: name,
          email: email || existingClient.email
        })
        .eq('id', existingClient.id)
        .select('id, nome, telefone, email')
        .single();

      if (updateError) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Erro ao atualizar cliente'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data: updatedClient,
        message: 'Cliente atualizado com sucesso'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } else {
      // Criar novo cliente (precisa criar via Edge Function create-client)
      // Por enquanto, retornamos erro pedindo para usar o endpoint de booking que cria automaticamente
      return new Response(JSON.stringify({
        success: false,
        error: 'Para criar um novo cliente, use o endpoint de booking. O cliente será criado automaticamente.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('❌ Erro ao criar/atualizar cliente:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}

// 13. GET /salon/{salonId}/bookings/upcoming?clientPhone={phone}
async function handleGetUpcomingBookings(supabaseClient, salonId, searchParams) {
  try {
    const clientPhone = searchParams.get('clientPhone');
    if (!clientPhone) {
      return new Response(JSON.stringify({
        success: false,
        error: 'clientPhone é obrigatório'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Buscar agendamentos futuros
    const now = new Date().toISOString();
    const { data: appointments, error } = await supabaseClient
      .from('appointments')
      .select(`
        id,
        data_hora,
        status,
        observacoes,
        services!inner(nome, preco),
        employees!inner(nome)
      `)
      .eq('salao_id', salonId)
      .eq('cliente_telefone', clientPhone)
      .gte('data_hora', now)
      .order('data_hora', { ascending: true });

    if (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao buscar agendamentos'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const formattedAppointments = (appointments || []).map((apt) => ({
      id: apt.id,
      serviceName: apt.services?.nome || 'Serviço',
      professionalName: apt.employees?.nome || 'Profissional',
      dateTime: apt.data_hora,
      status: apt.status,
      price: apt.services?.preco || 0,
      confirmationCode: `WA${apt.id.slice(-6).toUpperCase()}`
    }));

    return new Response(JSON.stringify({
      success: true,
      data: formattedAppointments
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar agendamentos futuros:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}
