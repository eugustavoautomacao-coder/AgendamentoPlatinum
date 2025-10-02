import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAppointmentRequests } from '@/hooks/useAppointmentRequests';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Clock, User, Phone, Mail, MapPin, Star, CheckCircle, Search, LogIn, LogOut, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ClienteLoginModal } from '@/components/ClienteLoginModal';

interface Salon {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
  working_hours: any;
}

interface Service {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  duracao_minutos: number;
  categoria: string;
}

interface Professional {
  id: string;
  nome: string;
  avatar_url?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  salao_id: string;
}

export default function SalaoPublico() {
  const { salaoId } = useParams<{ salaoId: string }>();
  const navigate = useNavigate();
  const { createAppointmentRequest, isLoading } = useAppointmentRequests();
  
  // Estado para cliente logado
  const [clienteLogado, setClienteLogado] = useState<Cliente | null>(null);
  const [verificandoCliente, setVerificandoCliente] = useState(true);
  
  // Helper function para obter data de hoje no formato correto
  const getTodayDate = () => {
    const today = new Date();
    // Ajustar para fuso horário local
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
    const result = localDate.toISOString().split('T')[0];
    return result;
  };
  
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [step, setStep] = useState<'services' | 'professional' | 'schedule' | 'form' | 'success'>('services');
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [senhaTemporaria, setSenhaTemporaria] = useState<string>('');
  const [clienteEmail, setClienteEmail] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Verificar se há cliente logado no localStorage
  useEffect(() => {
    const checkClienteLogado = () => {
      try {
        const storedCliente = localStorage.getItem('cliente_auth');
        if (storedCliente) {
          const clienteData = JSON.parse(storedCliente);
          // Verificar se o cliente é do salão atual
          if (clienteData.salao_id === salaoId) {
            setClienteLogado(clienteData);
            // Pré-preencher o formulário apenas se não estiver vazio
            setFormData(prev => ({
              ...prev,
              cliente_nome: clienteData.nome || '',
              cliente_telefone: clienteData.telefone || '',
              cliente_email: clienteData.email || ''
            }));
          }
        }
      } catch (error) {
        console.error('Erro ao verificar cliente armazenado:', error);
        localStorage.removeItem('cliente_auth');
      } finally {
        setVerificandoCliente(false);
      }
    };

    if (salaoId) {
      checkClienteLogado();
    }
  }, [salaoId]);

  // Função para fazer logout do cliente
  const handleClienteLogout = () => {
    localStorage.removeItem('cliente_auth');
    setClienteLogado(null);
    // Limpar formulário
    setFormData({
      cliente_nome: '',
      cliente_telefone: '',
      cliente_email: '',
      observacoes: ''
    });
    toast.success('Logout realizado com sucesso!');
    // Redirecionar para a página de login do cliente
    navigate(`/cliente/${salaoId}/login`);
  };

  // Função para atualizar estado após login bem-sucedido
  const handleLoginSuccess = (clienteData: Cliente) => {
    setClienteLogado(clienteData);
    // Pré-preencher o formulário apenas se os campos estiverem vazios
    setFormData(prev => ({
      ...prev,
      cliente_nome: prev.cliente_nome || clienteData.nome,
      cliente_telefone: prev.cliente_telefone || clienteData.telefone,
      cliente_email: prev.cliente_email || clienteData.email
    }));
    setShowLoginModal(false);
    // Não redirecionar aqui, o modal faz isso diretamente
  };
  
  // Helper function para formatar data
  const formatDate = (dateString: string) => {
    try {
      // Criar data no fuso horário local
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month - 1 porque getMonth() retorna 0-11
      
      const formattedDate = date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Capitalizar primeira letra do dia da semana
      return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dateString; // Retorna a string original se houver erro
    }
  };
  
  // Form data
  const [formData, setFormData] = useState({
    cliente_nome: '',
    cliente_telefone: '',
    cliente_email: '',
    observacoes: ''
  });

  useEffect(() => {
    if (salaoId) {
      fetchSalonData();
    }
  }, [salaoId]);

  // Garantir que a data atual seja sempre correta
  useEffect(() => {
    const today = getTodayDate();
    if (selectedDate !== today) {
      setSelectedDate(today);
    }
  }, []);

  // Carregar horários disponíveis quando chegar no passo de agendamento
  useEffect(() => {
    if (step === 'schedule' && selectedService && selectedProfessional && selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [step, selectedService, selectedProfessional, selectedDate]);

  const fetchSalonData = async () => {
    try {
      // Buscar dados do salão
      const { data: salonData, error: salonError } = await supabase
        .from('saloes')
        .select('*')
        .eq('id', salaoId)
        .single();

      if (salonError) throw salonError;
      setSalon(salonData);

      // Buscar serviços do salão
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('salao_id', salaoId)
        .order('nome');

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      // Buscar profissionais do salão
      const { data: professionalsData, error: professionalsError } = await supabase
        .from('employees')
        .select('*')
        .eq('salao_id', salaoId)
        .order('nome');

      if (professionalsError) throw professionalsError;
      setProfessionals(professionalsData || []);

    } catch (error) {
      console.error('Erro ao carregar dados do salão:', error);
      toast.error('Erro ao carregar dados do salão');
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('professional');
  };

  // Filtrar serviços baseado no termo de busca
  const filteredServices = services.filter(service =>
    service.nome.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
    service.descricao.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
    service.categoria.toLowerCase().includes(serviceSearchTerm.toLowerCase())
  );

  const handleProfessionalSelect = (professional: Professional) => {
    setSelectedProfessional(professional);
    setStep('schedule');
    // Buscar horários disponíveis automaticamente para a data selecionada
    setTimeout(() => {
      if (selectedDate) {
        fetchAvailableSlots(selectedDate);
      }
    }, 100);
  };

  const handleDateSelect = async (date: string) => {
    // Garantir que a data está no formato correto
    const formattedDate = date.split('T')[0]; // Remove qualquer parte de tempo
    
    // Debug log
    console.log('handleDateSelect debug:', {
      originalDate: date,
      formattedDate: formattedDate,
      selectedDate: selectedDate,
      currentTime: new Date().toLocaleString('pt-BR')
    });
    
    setSelectedDate(formattedDate);
    await fetchAvailableSlots(formattedDate);
  };

  const fetchAvailableSlots = async (date: string) => {
    if (!selectedService || !selectedProfessional) return;

    setLoadingSlots(true);

    try {
      // Buscar agendamentos existentes para o dia
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('data_hora, servico:services(duracao_minutos)')
        .eq('funcionario_id', selectedProfessional.id)
        .gte('data_hora', `${date}T00:00:00`)
        .lt('data_hora', `${date}T23:59:59`)
        .in('status', ['confirmado', 'pendente']);

      if (error) throw error;

      // Buscar horários bloqueados do funcionário para este dia
      let blockedSlots: any[] = [];
      try {
        const { data: blockedData, error: blockedError } = await supabase
          .from('blocked_slots')
          .select('hora_inicio, hora_fim')
          .eq('funcionario_id', selectedProfessional.id)
          .eq('data', date);

        if (!blockedError && blockedData) {
          blockedSlots = blockedData;
        }
      } catch (error) {
        // Tabela pode não existir, continuar sem horários bloqueados
        console.log('Tabela de horários bloqueados não encontrada, continuando...');
      }

      // Buscar horário de funcionamento do salão
      let workingHours: any = null;
      try {
        const { data: whData, error: workingError } = await supabase
          .from('saloes')
          .select('working_hours')
          .eq('id', salaoId)
          .single();

        if (!workingError && whData) {
          workingHours = whData;
        }
      } catch (error) {
        // Campo pode não existir, continuar com horário padrão
        console.log('Horários de funcionamento não configurados, usando padrão...');
      }

      // Determinar horário de funcionamento (padrão 8h-18h se não configurado)
      let startHour = 8;
      let endHour = 18;
      
      if (workingHours?.working_hours) {
        const wh = workingHours.working_hours;
        const today = new Date(date).getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayKey = dayNames[today];
        
        if (wh[dayKey] && wh[dayKey].active) {
          startHour = parseInt(wh[dayKey].open.split(':')[0]);
          endHour = parseInt(wh[dayKey].close.split(':')[0]);
        }
      }

      // Gerar slots disponíveis
      const slots: TimeSlot[] = [];
      const serviceDuration = selectedService.duracao_minutos;

      for (let hour = startHour; hour < endHour; hour++) {
        // Gerar apenas horários cheios (sem minutos fracionados)
        const timeString = `${hour.toString().padStart(2, '0')}:00`;
        const slotDateTime = new Date(`${date}T${timeString}:00`);
        
        // Verificar se o slot está disponível (não conflita com agendamentos)
        const isAvailableByAppointments = !appointments?.some(apt => {
          const aptTime = new Date(apt.data_hora);
          const aptServiceDuration = (apt.servico as any)?.duracao_minutos || 60;
          const aptEndTime = new Date(aptTime.getTime() + aptServiceDuration * 60000);
          const slotEndTime = new Date(slotDateTime.getTime() + serviceDuration * 60000);
          
          return (slotDateTime >= aptTime && slotDateTime < aptEndTime) ||
                 (slotEndTime > aptTime && slotEndTime <= aptEndTime) ||
                 (slotDateTime <= aptTime && slotEndTime >= aptEndTime);
        });

        // Verificar se o slot não está bloqueado pelo funcionário
        const isAvailableByBlockedSlots = !blockedSlots?.some(blocked => {
          const blockedStart = new Date(`${date}T${blocked.hora_inicio}`);
          const blockedEnd = new Date(`${date}T${blocked.hora_fim}`);
          const slotEndTime = new Date(slotDateTime.getTime() + serviceDuration * 60000);
          
          return (slotDateTime >= blockedStart && slotDateTime < blockedEnd) ||
                 (slotEndTime > blockedStart && slotEndTime <= blockedEnd) ||
                 (slotDateTime <= blockedStart && slotEndTime >= blockedEnd);
        });

        // Slot está disponível se não conflita com agendamentos E não está bloqueado
        const isAvailable = isAvailableByAppointments && isAvailableByBlockedSlots;

        slots.push({
          time: timeString,
          available: isAvailable
        });
      }

      setAvailableSlots(slots);
      
      // Debug logs
      console.log('Horários carregados:', {
        date,
        professional: selectedProfessional.nome,
        service: selectedService.nome,
        totalSlots: slots.length,
        availableSlots: slots.filter(s => s.available).length,
        workingHours: { startHour, endHour },
        appointments: appointments?.length || 0,
        blockedSlots: blockedSlots.length
      });
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      toast.error('Erro ao buscar horários disponíveis');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('form');
  };

  const handleSubmitRequest = async () => {
    if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (!formData.cliente_nome || !formData.cliente_telefone) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }

    try {
      const dataHora = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
      
      const result = await createAppointmentRequest({
        salao_id: salaoId!,
        servico_id: selectedService.id,
        funcionario_id: selectedProfessional.id,
        data_hora: dataHora,
        cliente_nome: formData.cliente_nome,
        cliente_telefone: formData.cliente_telefone,
        cliente_email: formData.cliente_email || undefined,
        observacoes: formData.observacoes || undefined
      });

      console.log('Resultado createAppointmentRequest:', result);
      if (result && (result as any).request) {
        setStep('success');
        
        // Se uma conta foi criada, salvar as credenciais para uso posterior
        if ((result as any).senhaTemporaria && formData.cliente_email) {
          setSenhaTemporaria((result as any).senhaTemporaria);
          setClienteEmail(formData.cliente_email);
          // NÃO abrir o modal automaticamente
        }
      } else {
        toast.error('Erro ao enviar solicitação');
      }
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      toast.error('Erro ao enviar solicitação');
    }
  };

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do salão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header do Salão */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col gap-4">
            {/* Informações do Salão */}
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{salon.nome}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm lg:text-base">{salon.telefone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm lg:text-base">{salon.endereco}</span>
                </div>
              </div>
            </div>
            
            {/* Status e Login */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Badge variant="outline" className="text-green-600 border-green-600 dark:text-green-400 dark:border-green-400 self-start sm:self-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                Online
              </Badge>
              
              {clienteLogado ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200 self-start sm:self-center">
                    <User className="h-3 w-3 mr-1" />
                    <span className="truncate max-w-32 sm:max-w-none">{clienteLogado.nome}</span>
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClienteLogout}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs self-start sm:self-center flex items-center gap-1 w-full sm:w-auto"
                  >
                    <LogOut className="h-3 w-3" />
                    Sair
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                  <div className="text-xs text-muted-foreground self-start sm:self-center flex items-center gap-1.5">
                    <HelpCircle className="h-3 w-3" />
                    Já tem login?
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLoginModal(true)}
                    className="flex items-center gap-2 text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 self-start sm:self-center w-full sm:w-auto"
                  >
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto w-full justify-center">
            {['services', 'professional', 'schedule', 'form'].map((stepName, index) => (
              <div key={stepName} className="flex items-center flex-shrink-0">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                  step === 'success' ? 'bg-green-500 text-white' : // Todos verdes na tela de sucesso
                  step === stepName ? 'bg-primary text-primary-foreground' : 
                  ['services', 'professional', 'schedule', 'form'].indexOf(step) > index ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                {index < 3 && (
                  <div className={`w-8 sm:w-16 h-0.5 ${
                    step === 'success' ? 'bg-green-500' : // Todas as linhas verdes na tela de sucesso
                    ['services', 'professional', 'schedule', 'form'].indexOf(step) > index ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Seleção de Serviços */}
        {step === 'services' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Escolha um Serviço</h2>
              
              {/* Campo de Busca */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar serviços..."
                  value={serviceSearchTerm}
                  onChange={(e) => setServiceSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Contador de Resultados */}
            {serviceSearchTerm && (
              <div className="mb-4 text-sm text-muted-foreground">
                {filteredServices.length} de {services.length} serviços encontrados
              </div>
            )}
            
            {filteredServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.map((service) => (
                  <Card key={service.id} className="cursor-pointer hover:shadow-lg transition-shadow border-border" onClick={() => handleServiceSelect(service)}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base sm:text-lg text-foreground">{service.nome}</CardTitle>
                      <Badge variant="secondary" className="text-xs w-fit">{service.categoria}</Badge>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{service.descricao}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{service.duracao_minutos} min</span>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-primary">
                          R$ {service.preco.toFixed(2)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <Search className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Nenhum serviço encontrado</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {serviceSearchTerm 
                    ? `Nenhum serviço encontrado para "${serviceSearchTerm}".`
                    : 'Não há serviços disponíveis no momento.'
                  }
                </p>
                {serviceSearchTerm && (
                  <Button 
                    variant="outline" 
                    onClick={() => setServiceSearchTerm('')}
                    className="mt-4 text-sm"
                  >
                    Limpar busca
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Seleção de Profissional */}
        {step === 'professional' && selectedService && (
          <div>
            <div className="mb-6">
              <Button variant="outline" onClick={() => setStep('services')} className="mb-4 text-sm">
                ← Voltar
              </Button>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Escolha um Profissional</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Serviço selecionado: <strong className="text-foreground">{selectedService.nome}</strong></p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {professionals.map((professional) => (
                <Card key={professional.id} className="cursor-pointer hover:shadow-lg transition-shadow border-border" onClick={() => handleProfessionalSelect(professional)}>
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full mx-auto mb-3 sm:mb-4 overflow-hidden">
                      {professional.avatar_url ? (
                        <img 
                          src={professional.avatar_url} 
                          alt={professional.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg text-foreground">{professional.nome}</h3>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current" />
                      <span className="text-xs sm:text-sm text-muted-foreground">4.8</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Seleção de Data e Horário */}
        {step === 'schedule' && selectedService && selectedProfessional && (
          <div>
            <div className="mb-6">
              <Button variant="outline" onClick={() => setStep('professional')} className="mb-4 text-sm">
                ← Voltar
              </Button>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Escolha Data e Horário</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Profissional: <strong className="text-foreground">{selectedProfessional.nome}</strong> • 
                Serviço: <strong className="text-foreground">{selectedService.nome}</strong>
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Seleção de Data */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
                    <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Escolha a Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Campo de data formatada (visual) */}
                    <div className="relative">
                      <Input
                        type="text"
                        value={formatDate(selectedDate)}
                        readOnly
                        className="w-full pr-10 cursor-pointer bg-muted/50 text-sm"
                        onClick={() => {
                          const dateInput = document.getElementById('date-input') as HTMLInputElement;
                          if (dateInput) dateInput.showPicker();
                        }}
                        placeholder="Selecione uma data"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    
                    {/* Campo de data nativo (funcional) */}
                    <Input
                      id="date-input"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => handleDateSelect(e.target.value)}
                      min={getTodayDate()}
                      className="sr-only"
                    />
                    
                    <p className="text-xs text-muted-foreground">
                      Clique no campo para abrir o calendário e escolher uma data
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Seleção de Horário */}
              {selectedDate && (
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Horários Disponíveis
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Horários livres para {formatDate(selectedDate)}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {loadingSlots ? (
                      <div className="text-center py-6 sm:py-8">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto mb-3"></div>
                        <p className="text-sm text-muted-foreground">Carregando horários disponíveis...</p>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <Clock className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Nenhum horário disponível</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                          Não há horários disponíveis para esta data. 
                          Tente selecionar outra data ou entre em contato com o salão.
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => setStep('professional')}
                          className="text-xs sm:text-sm"
                        >
                          Escolher Outro Profissional
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4 text-xs sm:text-sm text-muted-foreground">
                          {availableSlots.filter(slot => slot.available).length} de {availableSlots.length} horários disponíveis
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 sm:max-h-60 overflow-y-auto modal-scrollbar">
                          {availableSlots.map((slot) => (
                            <Button
                              key={slot.time}
                              variant={slot.available ? "outline" : "secondary"}
                              disabled={!slot.available}
                              onClick={() => slot.available && handleTimeSelect(slot.time)}
                              className={`text-xs sm:text-sm ${
                                slot.available 
                                  ? 'hover:bg-primary hover:text-primary-foreground border-primary' 
                                  : 'cursor-not-allowed opacity-50'
                              }`}
                              title={slot.available ? `Agendar para ${slot.time}` : 'Horário indisponível'}
                            >
                              {slot.time}
                            </Button>
                          ))}
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground">
                          <span className="inline-block w-2 h-2 sm:w-3 sm:h-3 bg-primary border border-primary rounded mr-1"></span>
                          Disponível
                          <span className="inline-block w-2 h-2 sm:w-3 sm:h-3 bg-muted border border-border rounded ml-3 mr-1"></span>
                          Indisponível
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Formulário de Dados */}
        {step === 'form' && selectedService && selectedProfessional && selectedDate && selectedTime && (
          <div>
            <div className="mb-6">
              <Button variant="outline" onClick={() => setStep('schedule')} className="mb-4 text-sm">
                ← Voltar
              </Button>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Seus Dados</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                {selectedProfessional.nome} • {selectedService.nome} • {formatDate(selectedDate)} às {selectedTime}
              </p>
            </div>

            <Card className="max-w-2xl mx-auto border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-base sm:text-lg">Informações para o Agendamento</span>
                  {clienteLogado && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClienteLogout}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs w-full sm:w-auto"
                    >
                      <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Sair
                    </Button>
                  )}
                </CardTitle>
                {clienteLogado && (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Olá, <strong>{clienteLogado.nome}</strong>! Seus dados foram preenchidos automaticamente.
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div>
                  <Label htmlFor="cliente_nome" className="text-sm">Nome Completo *</Label>
                  <Input
                    id="cliente_nome"
                    value={formData.cliente_nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente_nome: e.target.value }))}
                    placeholder="Seu nome completo"
                    disabled={clienteLogado !== null}
                    className={`text-sm ${clienteLogado ? 'bg-muted/50 cursor-not-allowed' : ''}`}
                  />
                  {clienteLogado && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Dados preenchidos automaticamente do seu perfil
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cliente_telefone" className="text-sm">Telefone *</Label>
                  <Input
                    id="cliente_telefone"
                    type="tel"
                    value={formData.cliente_telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente_telefone: e.target.value }))}
                    disabled={clienteLogado !== null}
                    placeholder="(11) 99999-9999"
                    className={`text-sm ${clienteLogado ? 'bg-muted/50 cursor-not-allowed' : ''}`}
                  />
                  {clienteLogado && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Dados preenchidos automaticamente do seu perfil
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cliente_email" className="text-sm">E-mail</Label>
                  <Input
                    id="cliente_email"
                    value={formData.cliente_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente_email: e.target.value }))}
                    placeholder="seu@email.com"
                    disabled={clienteLogado !== null}
                    className={`text-sm ${clienteLogado ? 'bg-muted/50 cursor-not-allowed' : ''}`}
                  />
                  {clienteLogado && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Dados preenchidos automaticamente do seu perfil
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="observacoes" className="text-sm">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Alguma observação especial..."
                    rows={3}
                    className="text-sm"
                  />
                </div>

                <Button 
                  onClick={handleSubmitRequest} 
                  disabled={isLoading}
                  className="w-full text-sm"
                >
                  {isLoading ? 'Enviando...' : 'Solicitar Agendamento'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 5: Sucesso */}
        {step === 'success' && (
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">Solicitação Enviada!</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Sua solicitação de agendamento foi enviada com sucesso. 
              O salão entrará em contato para confirmar o horário.
            </p>

            {/* Mensagem sobre credenciais enviadas por email */}
            {!clienteLogado && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-green-800">
                      Suas credenciais foram enviadas por email!
                    </p>
                    <p className="text-xs text-green-700">
                      Verifique sua caixa de entrada e spam. Use o email e senha temporária para fazer login e acompanhar seus agendamentos.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Explicação sobre acompanhamento */}
            <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10 mb-4 sm:mb-6">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    {clienteLogado ? (
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    ) : (
                      <LogIn className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                      {clienteLogado 
                        ? 'Quer ver seus agendamentos?'
                        : 'Quer acompanhar seu agendamento?'
                      }
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                      {clienteLogado 
                        ? 'Você pode acessar seu dashboard para ver o status da sua solicitação, receber notificações e gerenciar seus agendamentos futuros.'
                        : 'Você pode fazer login para ver o status da sua solicitação, receber notificações e gerenciar seus agendamentos futuros.'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Botões centralizados */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button 
                variant="outline"
                onClick={() => {
                  // Se o usuário já estiver logado, ir direto para o dashboard
                  if (clienteLogado) {
                    navigate(`/cliente/${salaoId}/agendamentos`);
                  } else {
                    // Se não estiver logado, abrir modal de login
                    setShowLoginModal(true);
                  }
                }}
                className="flex items-center gap-2 w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-sm"
              >
                {clienteLogado ? (
                  <>
                    <User className="h-4 w-4" />
                    Ver Meus Agendamentos
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Acompanhar Agendamentos
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setStep('services');
                  setSelectedService(null);
                  setSelectedProfessional(null);
                  setSelectedDate(getTodayDate());
                  setSelectedTime('');
                  setFormData({
                    cliente_nome: '',
                    cliente_telefone: '',
                    cliente_email: '',
                    observacoes: ''
                  });
                }}
                className="w-full sm:w-auto border-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:text-background transition-all duration-300 text-sm"
              >
                Fazer Novo Agendamento
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Login */}
      <ClienteLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          // Buscar dados do cliente logado do localStorage
          const storedCliente = localStorage.getItem('cliente_auth');
          if (storedCliente) {
            const clienteData = JSON.parse(storedCliente);
            if (clienteData.salao_id === salaoId) {
              // Redirecionar diretamente para o dashboard de agendamentos
          navigate(`/cliente/${salaoId}/agendamentos`);
            }
          }
        }}
        salaoId={salaoId!}
        clienteEmail={clienteEmail}
        senhaTemporaria={senhaTemporaria}
      />
    </div>
  );
}
