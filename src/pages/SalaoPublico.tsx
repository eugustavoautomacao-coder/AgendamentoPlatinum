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
import { Calendar, Clock, User, Phone, Mail, MapPin, Star, CheckCircle, Search } from 'lucide-react';
import { toast } from 'sonner';

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

export default function SalaoPublico() {
  const { salaoId } = useParams<{ salaoId: string }>();
  const navigate = useNavigate();
  const { createAppointmentRequest, isLoading } = useAppointmentRequests();
  
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [step, setStep] = useState<'services' | 'professional' | 'schedule' | 'form' | 'success'>('services');
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  
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
  };

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    await fetchAvailableSlots(date);
  };

  const fetchAvailableSlots = async (date: string) => {
    if (!selectedService || !selectedProfessional) return;

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

      // Gerar slots disponíveis (assumindo horário de funcionamento 8h-18h)
      const slots: TimeSlot[] = [];
      const startHour = 8;
      const endHour = 18;
      const serviceDuration = selectedService.duracao_minutos;

      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const slotDateTime = new Date(`${date}T${timeString}:00`);
          
          // Verificar se o slot está disponível
          const isAvailable = !appointments?.some(apt => {
            const aptTime = new Date(apt.data_hora);
            const aptEndTime = new Date(aptTime.getTime() + (apt.servico?.duracao_minutos || 60) * 60000);
            const slotEndTime = new Date(slotDateTime.getTime() + serviceDuration * 60000);
            
            return (slotDateTime >= aptTime && slotDateTime < aptEndTime) ||
                   (slotEndTime > aptTime && slotEndTime <= aptEndTime) ||
                   (slotDateTime <= aptTime && slotEndTime >= aptEndTime);
          });

          slots.push({
            time: timeString,
            available: isAvailable
          });
        }
      }

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      toast.error('Erro ao buscar horários disponíveis');
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
      
      const success = await createAppointmentRequest({
        salao_id: salaoId!,
        servico_id: selectedService.id,
        funcionario_id: selectedProfessional.id,
        data_hora: dataHora,
        cliente_nome: formData.cliente_nome,
        cliente_telefone: formData.cliente_telefone,
        cliente_email: formData.cliente_email || undefined,
        observacoes: formData.observacoes || undefined
      });

      if (success) {
        setStep('success');
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
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{salon.nome}</h1>
              <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{salon.telefone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{salon.endereco}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-green-600 border-green-600 dark:text-green-400 dark:border-green-400">
                <CheckCircle className="h-3 w-3 mr-1" />
                Online
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {['services', 'professional', 'schedule', 'form'].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName ? 'bg-primary text-primary-foreground' : 
                  ['services', 'professional', 'schedule', 'form'].indexOf(step) > index ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                {index < 3 && (
                  <div className={`w-16 h-0.5 ${
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
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-foreground">Escolha um Serviço</h2>
              
              {/* Campo de Busca */}
              <div className="relative w-full lg:w-80">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.map((service) => (
                  <Card key={service.id} className="cursor-pointer hover:shadow-lg transition-shadow border-border" onClick={() => handleServiceSelect(service)}>
                    <CardHeader>
                      <CardTitle className="text-lg text-foreground">{service.nome}</CardTitle>
                      <Badge variant="secondary">{service.categoria}</Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-3">{service.descricao}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{service.duracao_minutos} min</span>
                        </div>
                        <div className="text-lg font-bold text-primary">
                          R$ {service.preco.toFixed(2)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum serviço encontrado</h3>
                <p className="text-muted-foreground">
                  {serviceSearchTerm 
                    ? `Nenhum serviço encontrado para "${serviceSearchTerm}".`
                    : 'Não há serviços disponíveis no momento.'
                  }
                </p>
                {serviceSearchTerm && (
                  <Button 
                    variant="outline" 
                    onClick={() => setServiceSearchTerm('')}
                    className="mt-4"
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
              <Button variant="outline" onClick={() => setStep('services')} className="mb-4">
                ← Voltar
              </Button>
              <h2 className="text-2xl font-bold text-foreground">Escolha um Profissional</h2>
              <p className="text-muted-foreground">Serviço selecionado: <strong className="text-foreground">{selectedService.nome}</strong></p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {professionals.map((professional) => (
                <Card key={professional.id} className="cursor-pointer hover:shadow-lg transition-shadow border-border" onClick={() => handleProfessionalSelect(professional)}>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 overflow-hidden">
                      {professional.avatar_url ? (
                        <img 
                          src={professional.avatar_url} 
                          alt={professional.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-primary" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">{professional.nome}</h3>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-muted-foreground">4.8</span>
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
              <Button variant="outline" onClick={() => setStep('professional')} className="mb-4">
                ← Voltar
              </Button>
              <h2 className="text-2xl font-bold text-foreground">Escolha Data e Horário</h2>
              <p className="text-muted-foreground">
                Profissional: <strong className="text-foreground">{selectedProfessional.nome}</strong> • 
                Serviço: <strong className="text-foreground">{selectedService.nome}</strong>
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Seleção de Data */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Calendar className="h-5 w-5 text-primary" />
                    Escolha a Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateSelect(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full"
                  />
                </CardContent>
              </Card>

              {/* Seleção de Horário */}
              {selectedDate && (
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Clock className="h-5 w-5 text-primary" />
                      Horários Disponíveis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto modal-scrollbar">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot.time}
                          variant={slot.available ? "outline" : "secondary"}
                          disabled={!slot.available}
                          onClick={() => slot.available && handleTimeSelect(slot.time)}
                          className="text-sm"
                        >
                          {slot.time}
                        </Button>
                      ))}
                    </div>
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
              <Button variant="outline" onClick={() => setStep('schedule')} className="mb-4">
                ← Voltar
              </Button>
              <h2 className="text-2xl font-bold text-foreground">Seus Dados</h2>
              <p className="text-muted-foreground">
                {selectedProfessional.nome} • {selectedService.nome} • {selectedDate} às {selectedTime}
              </p>
            </div>

            <Card className="max-w-2xl mx-auto border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Informações para o Agendamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cliente_nome">Nome Completo *</Label>
                  <Input
                    id="cliente_nome"
                    value={formData.cliente_nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente_nome: e.target.value }))}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <Label htmlFor="cliente_telefone">Telefone *</Label>
                  <Input
                    id="cliente_telefone"
                    value={formData.cliente_telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente_telefone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <Label htmlFor="cliente_email">E-mail</Label>
                  <Input
                    id="cliente_email"
                    type="email"
                    value={formData.cliente_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente_email: e.target.value }))}
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Alguma observação especial..."
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleSubmitRequest} 
                  disabled={isLoading}
                  className="w-full"
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
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Solicitação Enviada!</h2>
            <p className="text-muted-foreground mb-6">
              Sua solicitação de agendamento foi enviada com sucesso. 
              O salão entrará em contato para confirmar o horário.
            </p>
            <Button onClick={() => {
              setStep('services');
              setSelectedService(null);
              setSelectedProfessional(null);
              setSelectedDate('');
              setSelectedTime('');
              setFormData({
                cliente_nome: '',
                cliente_telefone: '',
                cliente_email: '',
                observacoes: ''
              });
            }}>
              Fazer Novo Agendamento
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
