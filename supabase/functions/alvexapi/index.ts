import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    // Extract salonId from path - remove /functions/v1/alvexapi prefix
    const cleanPath = path.replace('/functions/v1/alvexapi', '')
    const pathParts = cleanPath.split('/').filter(part => part !== '')
    
    // Find salonId in path (it's usually the part after 'salon')
    let salonId = null
    for (let i = 0; i < pathParts.length; i++) {
      if (pathParts[i] === 'salon' && i + 1 < pathParts.length) {
        salonId = pathParts[i + 1]
        break
      }
    }

    console.log(`📱 Evolution API Request: ${method} ${path} - Clean Path: ${cleanPath}`)
    console.log(`🔍 Path parts:`, pathParts)
    console.log(`🔍 Salon ID:`, salonId)
    console.log(`🔍 Full URL:`, url.href)

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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route handlers
    if (path.endsWith('/health') && method === 'GET') {
      return new Response(JSON.stringify({
        success: true,
        message: 'AlveX Evolution API está funcionando',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    if (path.includes('/salon/') && path.includes('/info') && method === 'GET') {
      return await handleGetSalonInfo(supabaseClient, salonId)
    }
    
    if (path.includes('/salon/') && path.includes('/services') && method === 'GET') {
      return await handleGetServices(supabaseClient, salonId)
    }
    
    if (path.includes('/salon/') && path.includes('/professionals') && method === 'GET') {
      return await handleGetProfessionals(supabaseClient, salonId)
    }
    
    if (path.includes('/salon/') && path.includes('/availability') && method === 'GET') {
      return await handleGetAvailability(supabaseClient, salonId, url.searchParams)
    }
    
    if (path.includes('/salon/') && path.includes('/booking') && method === 'POST') {
      const bookingData = await req.json()
      return await handleCreateBooking(supabaseClient, salonId, bookingData)
    }
    
    if (path.includes('/salon/') && path.includes('/booking/') && method === 'DELETE') {
      const appointmentId = pathParts[pathParts.length - 1]
      const cancelData = await req.json().catch(() => ({}))
      return await handleCancelBooking(supabaseClient, salonId, appointmentId, cancelData)
    }
    
    if (path.includes('/salon/') && path.includes('/bookings') && method === 'GET') {
      return await handleGetClientBookings(supabaseClient, salonId, url.searchParams)
    }
    
    if (path.includes('/salon/') && path.includes('/booking/code/') && method === 'GET') {
      const confirmationCode = pathParts[pathParts.length - 1]
      return await handleGetBookingByCode(supabaseClient, salonId, confirmationCode)
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Erro na Evolution API:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// 1. GET /salon/{salonId}/info
async function handleGetSalonInfo(supabaseClient, salonId) {
  try {
    const { data: salon, error } = await supabaseClient
      .from('saloes')
      .select('*')
      .eq('id', salonId)
      .single()

    if (error || !salon) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Salão não encontrado'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('❌ Erro ao buscar informações do salão:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 2. GET /salon/{salonId}/services
async function handleGetServices(supabaseClient, salonId) {
  try {
    console.log(`🔍 Buscando serviços para salão: ${salonId}`)
    
    const { data: services, error } = await supabaseClient
      .from('services')
      .select('*')
      .eq('salao_id', salonId)
      .eq('ativo', true)
      .order('nome')

    console.log(`📊 Resultado da busca de serviços:`, { services, error })

    if (error) {
      console.error('❌ Erro ao buscar serviços:', error)
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao buscar serviços',
        details: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const formattedServices = (services || []).map(service => ({
      id: service.id,
      name: service.nome,
      description: service.descricao || '',
      duration: service.duracao_minutos,
      price: service.preco,
      category: service.categoria || 'Geral'
    }))

    return new Response(JSON.stringify({
      success: true,
      data: formattedServices
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('❌ Erro ao buscar serviços:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 3. GET /salon/{salonId}/professionals
async function handleGetProfessionals(supabaseClient, salonId) {
  try {
    const { data: professionals, error } = await supabaseClient
      .from('employees')
      .select(`
        id,
        nome,
        avatar_url,
        cargo
      `)
      .eq('salao_id', salonId)
      .eq('ativo', true)

    if (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao buscar profissionais'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const formattedProfessionals = (professionals || []).map(prof => ({
      id: prof.id,
      name: prof.nome || 'Profissional',
      specialties: [prof.cargo || 'Geral'],
      avatar: prof.avatar_url
    }))

    return new Response(JSON.stringify({
      success: true,
      data: formattedProfessionals
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('❌ Erro ao buscar profissionais:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 4. GET /salon/{salonId}/availability
async function handleGetAvailability(supabaseClient, salonId, searchParams) {
  try {
    const serviceId = searchParams.get('serviceId')
    const professionalId = searchParams.get('professionalId')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    if (!serviceId || !professionalId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'serviceId e professionalId são obrigatórios'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Buscar informações do serviço
    const { data: service, error: serviceError } = await supabaseClient
      .from('services')
      .select('duracao_minutos')
      .eq('id', serviceId)
      .eq('salao_id', salonId)
      .single()

    if (serviceError || !service) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Serviço não encontrado'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Buscar informações do profissional
    const { data: professional, error: professionalError } = await supabaseClient
      .from('employees')
      .select(`
        nome,
        salao_id
      `)
      .eq('id', professionalId)
      .eq('salao_id', salonId)
      .single()

    if (professionalError || !professional) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Profissional não encontrado'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Buscar agendamentos existentes (bloqueiam: confirmado e pendente)
    const { data: appointments, error: appointmentsError } = await supabaseClient
      .from('appointments')
      .select(`
        data_hora,
        services!servico_id(duracao_minutos)
      `)
      .eq('funcionario_id', professionalId)
      .eq('salao_id', salonId)
      .in('status', ['confirmado', 'pendente'])
      .gte('data_hora', `${date}T00:00:00`)
      .lt('data_hora', `${date}T23:59:59`)

    if (appointmentsError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao buscar agendamentos'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`🔍 Consultando disponibilidade para ${date}`)
    console.log(`📅 Agendamentos encontrados:`, appointments?.length || 0)
    console.log(`🧩 Duração do serviço selecionado: ${service.duracao_minutos}min`)
    if (appointments?.length > 0) {
      appointments.forEach(apt => {
        console.log(`  - ${apt.data_hora} (duração: ${apt.services.duracao_minutos}min)`)
      })
    }

    // Gerar slots disponíveis (horário padrão 8h às 18h)
    const slots: Array<{
      time: string;
      available: boolean;
      professionalId: string;
      professionalName: string;
    }> = []
    const serviceDuration = service.duracao_minutos

    // Horário padrão (Brasil): 8h às 18h - interpretar como horário local (UTC-3) e converter para UTC
    const TZ_OFFSET = '-03:00'
    const startTime = new Date(`${date}T08:00:00${TZ_OFFSET}`)
    const endTime = new Date(`${date}T18:00:00${TZ_OFFSET}`)

    // Gerar slots de 1 em 1 hora (para corresponder à agenda do sistema)
    for (let hour = 8; hour < 18; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`
      // Interpretar o horário informado como local Brasil (UTC-3) e converter para UTC
      const slotDateTime = new Date(`${date}T${timeString}:00${TZ_OFFSET}`)
      const slotEndTime = new Date(slotDateTime.getTime() + serviceDuration * 60000)

      // Respeitar horário de funcionamento: serviço precisa terminar até o fim do expediente
      const fitsBusinessHours = slotEndTime <= endTime

      // Verificar se o slot não conflita com agendamentos existentes
      const hasAppointmentConflict = appointments?.some(apt => {
        const aptTime = new Date(apt.data_hora)
        const aptEndTime = new Date(aptTime.getTime() + apt.services.duracao_minutos * 60000)
        
        // Logs de debug para entender conflitos
        const hasConflict = (slotDateTime >= aptTime && slotDateTime < aptEndTime) ||
                           (slotEndTime > aptTime && slotEndTime <= aptEndTime) ||
                           (slotDateTime <= aptTime && slotEndTime >= aptEndTime)
        
        if (hasConflict) {
          console.log(`⚠️ Conflito detectado para ${timeString}:`)
          console.log(`  Slot: ${slotDateTime.toISOString()} - ${slotEndTime.toISOString()} (${serviceDuration}min)`)
          console.log(`  Agendamento: ${aptTime.toISOString()} - ${aptEndTime.toISOString()} (${apt.services.duracao_minutos}min)`)
        }
        
        return hasConflict
      }) || false

      const isAvailable = fitsBusinessHours && !hasAppointmentConflict

      slots.push({
        time: timeString,
        available: isAvailable,
        professionalId,
        professionalName: professional.nome || 'Profissional'
      })
      
      console.log(`✅ Slot ${timeString}: ${isAvailable ? 'DISPONÍVEL' : 'OCUPADO'}${!fitsBusinessHours ? ' (fora do expediente)' : ''}`)
    }

    return new Response(JSON.stringify({
      success: true,
      data: slots
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('❌ Erro ao consultar disponibilidade:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 5. POST /salon/{salonId}/booking
async function handleCreateBooking(supabaseClient, salonId, bookingData) {
  try {
    const { serviceId, professionalId, dateTime, clientPhone, clientName, clientEmail, notes } = bookingData

    if (!serviceId || !professionalId || !dateTime || !clientPhone) {
      return new Response(JSON.stringify({
        success: false,
        error: 'serviceId, professionalId, dateTime e clientPhone são obrigatórios'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // VALIDAÇÕES ESPECÍFICAS DOS CAMPOS DO CLIENTE
    console.log(`🔍 Validando dados do cliente...`)
    
    // Validar formato do telefone (deve ter pelo menos 10 dígitos)
    const phoneDigits = clientPhone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Telefone deve ter pelo menos 10 dígitos'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verificar se cliente já existe (por telefone OU email)
    const { data: existingClient, error: clientSearchError } = await supabaseClient
      .from('users')
      .select('id, nome, telefone, email')
      .eq('salao_id', salonId)
      .eq('tipo', 'cliente')
      .or(`telefone.eq.${clientPhone}${clientEmail ? `,email.eq.${clientEmail}` : ''}`)
      .single()

    if (existingClient) {
      console.log(`✅ Cliente existente encontrado`)
      // Se cliente existe, usar dados do cadastro (não validar campos obrigatórios)
    } else {
      console.log(`➕ Cliente não existe - validando campos obrigatórios para novo cadastro`)
      
      // Se cliente não existe, nome é obrigatório (email pode ser opcional se telefone for único)
      if (!clientName || clientName.trim() === '') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Nome do cliente é obrigatório para novos cadastros'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Validar nome do cliente (pelo menos 2 caracteres)
      if (clientName.trim().length < 2) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Nome do cliente deve ter pelo menos 2 caracteres'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Validar formato do email (se fornecido)
      if (clientEmail && clientEmail.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(clientEmail)) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Formato de email inválido'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }
    }

    console.log(`✅ Validações dos campos do cliente aprovadas`)

    // Buscar informações do serviço e profissional
    const { data: service, error: serviceError } = await supabaseClient
      .from('services')
      .select('nome, preco, duracao_minutos')
      .eq('id', serviceId)
      .eq('salao_id', salonId)
      .single()

    const { data: professional, error: professionalError } = await supabaseClient
      .from('employees')
      .select('nome')
      .eq('id', professionalId)
      .eq('salao_id', salonId)
      .single()

    if (serviceError || !service || professionalError || !professional) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Serviço ou profissional não encontrado'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // CORREÇÃO: Tratar data como horário local (Brasil UTC-3)
    // Se a data não tem timezone, assumir que é horário local do Brasil
    let appointmentDateTime
    if (dateTime.includes('T') && !dateTime.includes('Z') && !dateTime.includes('+')) {
      // Data sem timezone - assumir que é horário local do Brasil (UTC-3)
      // Converter para UTC subtraindo 3 horas
      const localDate = new Date(dateTime)
      appointmentDateTime = new Date(localDate.getTime() + (3 * 60 * 60 * 1000)) // +3 horas para UTC
    } else {
      appointmentDateTime = new Date(dateTime)
    }
    
    console.log(`🕐 Processando data do agendamento`)

    // VALIDAÇÃO: Verificar se já existe agendamento no mesmo horário
    console.log(`🔍 Verificando conflitos de horário...`)
    const { data: conflictingAppointments, error: conflictError } = await supabaseClient
      .from('appointments')
      .select(`
        id,
        data_hora,
        status,
        services!inner(duracao_minutos)
      `)
      .eq('funcionario_id', professionalId)
      .eq('salao_id', salonId)
      .eq('status', 'confirmado')
      .gte('data_hora', appointmentDateTime.toISOString())
      .lt('data_hora', new Date(appointmentDateTime.getTime() + service.duracao_minutos * 60000).toISOString())

    if (conflictError) {
      console.error('❌ Erro ao verificar conflitos:', conflictError)
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao verificar disponibilidade'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (conflictingAppointments && conflictingAppointments.length > 0) {
      console.log(`❌ Conflito encontrado: ${conflictingAppointments.length} agendamento(s) existente(s)`)
      return new Response(JSON.stringify({
        success: false,
        error: 'Horário não disponível - já existe agendamento neste período',
        conflictingAppointments: conflictingAppointments.map(apt => ({
          id: apt.id,
          dateTime: apt.data_hora,
          status: apt.status
        }))
      }), {
        status: 409, // Conflict
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`✅ Horário disponível - nenhum conflito encontrado`)

    // Usar cliente existente ou criar novo
    let clientId = null
    let finalClientName = clientName
    let finalClientEmail = clientEmail

    if (existingClient) {
      // Cliente existe - usar dados do cadastro
      clientId = existingClient.id
      finalClientName = existingClient.nome
      finalClientEmail = existingClient.email
      console.log(`✅ Usando cliente existente`)
    } else {
      // Cliente não existe - criar novo com dados fornecidos
      console.log(`➕ Criando novo cliente`)
      const { data: newClient, error: clientCreateError } = await supabaseClient
        .from('users')
        .insert([{
          salao_id: salonId,
          nome: clientName, // Já validado como obrigatório
          telefone: clientPhone,
          email: clientEmail || `${clientPhone.replace(/\D/g, '')}@whatsapp.com`, // Email opcional com fallback
          tipo: 'cliente',
          senha: `whatsapp${Math.random().toString(36).slice(-6)}`, // Senha única
          observacoes: `Cliente criado via WhatsApp Agent - ${new Date().toISOString()}`
        }])
        .select()
        .single()

      if (clientCreateError) {
        console.error('❌ Erro ao criar cliente:', clientCreateError)
        return new Response(JSON.stringify({
          success: false,
          error: 'Erro ao criar cliente',
          details: clientCreateError.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      clientId = newClient.id
      finalClientName = newClient.nome
      finalClientEmail = newClient.email
      console.log(`✅ Novo cliente criado`)
    }

    // Criar agendamento confirmado
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .insert([{
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
      }])
      .select()
      .single()

    if (appointmentError) {
      console.error('❌ Erro ao criar agendamento:', appointmentError)
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao confirmar agendamento'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Agendamento criado com sucesso

    // Gerar código de confirmação
    const confirmationCode = `WA${appointment.id.slice(-6).toUpperCase()}`

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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('❌ Erro ao criar agendamento:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 6. DELETE /salon/{salonId}/booking/{appointmentId}
async function handleCancelBooking(supabaseClient, salonId, appointmentId, cancelData) {
  try {
    const { reason } = cancelData

    // Buscar agendamento
    const { data: appointment, error: fetchError } = await supabaseClient
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('salao_id', salonId)
      .single()

    if (fetchError || !appointment) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Agendamento não encontrado'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Cancelar agendamento
    const { error: cancelError } = await supabaseClient
      .from('appointments')
      .update({
        status: 'cancelado',
        observacoes: `${appointment.observacoes || ''}\nCancelado via Evolution API WhatsApp. Motivo: ${reason || 'Não informado'}`
      })
      .eq('id', appointmentId)

    if (cancelError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao cancelar agendamento'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Agendamento cancelado com sucesso'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('❌ Erro ao cancelar agendamento:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 7. GET /salon/{salonId}/bookings
async function handleGetClientBookings(supabaseClient, salonId, searchParams) {
  try {
    const clientPhone = searchParams.get('clientPhone')

    if (!clientPhone) {
      return new Response(JSON.stringify({
        success: false,
        error: 'clientPhone é obrigatório'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Buscar agendamentos por telefone
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
      .order('data_hora', { ascending: true })

    if (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao buscar agendamentos'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const formattedAppointments = (appointments || []).map(apt => ({
      id: apt.id,
      serviceName: apt.services?.nome || 'Serviço',
      professionalName: apt.employees?.nome || 'Profissional',
      dateTime: apt.data_hora,
      status: apt.status,
      price: apt.services?.preco || 0,
      confirmationCode: `WA${apt.id.slice(-6).toUpperCase()}`
    }))

    return new Response(JSON.stringify({
      success: true,
      data: formattedAppointments
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('❌ Erro ao buscar agendamentos:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 8. GET /salon/{salonId}/booking/code/{confirmationCode}
async function handleGetBookingByCode(supabaseClient, salonId, confirmationCode) {
  try {
    // Extrair ID do agendamento do código
    const appointmentId = confirmationCode.replace('WA', '')
    
    // Buscar agendamento
    const { data: appointment, error } = await supabaseClient
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
      .like('id', `%${appointmentId}`)
      .single()

    if (error || !appointment) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Agendamento não encontrado'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: appointment.id,
        serviceName: appointment.services?.nome || 'Serviço',
        professionalName: appointment.employees?.nome || 'Profissional',
        dateTime: appointment.data_hora,
        status: appointment.status,
        price: appointment.services?.preco || 0,
        confirmationCode
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('❌ Erro ao buscar agendamento por código:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
