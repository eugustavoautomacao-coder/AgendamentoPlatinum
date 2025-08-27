import { Calendar as CalendarIcon, Clock, Users, Plus, Filter, ChevronLeft, ChevronRight, Scissors, CheckCircle, MessageSquare, Trash2, Save, X, Phone, User, UserPlus, Mail, Camera, Image, Eye, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/layout/AdminLayout";
import { useSalonInfo } from '@/hooks/useSalonInfo';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useAppointments } from '@/hooks/useAppointments';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AgendaSkeleton } from '@/components/AgendaSkeleton';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const SLOT_MINUTES = 60; // tamanho do slot (60 = 1h)
const SLOT_HEIGHT = 72;  // altura visual de cada slot

// Função para formatar telefone no padrão brasileiro
const formatPhoneNumber = (phone: string) => {
  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');
  
  // Se tem 11 dígitos (com DDD e 9), formata como (11) 99999-9999
  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }
  
  // Se tem 10 dígitos (com DDD sem 9), formata como (11) 9999-9999
  if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  
  // Se tem 8 dígitos (sem DDD), formata como 9999-9999
  if (numbers.length === 8) {
    return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
  }
  
  // Se tem 9 dígitos (sem DDD com 9), formata como 99999-9999
  if (numbers.length === 9) {
    return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
  }
  
  // Se não se encaixa em nenhum padrão, retorna o original
  return phone;
};



const Agenda = () => {
  const { salonInfo } = useSalonInfo();
  const { professionals, loading: professionalsLoading } = useProfessionals();
  const { appointments, loading, createAppointment, updateAppointment, deleteAppointment, refetch: refetchAppointments, isCreating, isUpdating, isDeleting } = useAppointments();


  const { clients, createClient, refetch: refetchClients } = useClients();
  const { services, createService, refetch: refetchServices } = useServices();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ funcionario_id: '', cliente_id: '', servico_id: '', date: '', time: '' });
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<any>(null);
  const [editForm, setEditForm] = useState<{ servico_id?: string; status?: string; observacoes?: string }>({});
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const [hasDragged, setHasDragged] = useState(false);

  // Estados para fotos do processo
  const [photosModalOpen, setPhotosModalOpen] = useState(false);
  const [processPhotos, setProcessPhotos] = useState<{
    antes: string[];
    durante: string[];
    depois: string[];
  }>({
    antes: [],
    durante: [],
    depois: []
  });
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<{
    url: string;
    phase: string;
    index: number;
  } | null>(null);
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [servicePopoverOpen, setServicePopoverOpen] = useState(false);

  // Estados para modal de novo cliente
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientForm, setClientForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    observacoes: ''
  });
  const [creatingClient, setCreatingClient] = useState(false);

  // Estados para modal de novo serviço
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    nome: '',
    descricao: '',
    preco: '',
    duracao_minutos: '',
    categoria: ''
  });
  const [creatingService, setCreatingService] = useState(false);

  // Estados para navegação horizontal dos profissionais
  const [currentProfIndex, setCurrentProfIndex] = useState(0);
  const professionalsPerView = 3; // Número de profissionais visíveis por vez

  // Estados para filtros
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [selectedProfessionalFilter, setSelectedProfessionalFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Detectar parâmetros da URL para filtro automático
  useEffect(() => {
    const filterType = searchParams.get('filter');
    const filterId = searchParams.get('id');
    
    if (filterType === 'professional' && filterId) {
      setSelectedProfessionalFilter(filterId);
      // Limpar os parâmetros da URL após aplicar o filtro
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Filtrar profissionais baseado no filtro selecionado
  const filteredProfessionals = useMemo(() => {
    if (selectedProfessionalFilter === 'all') return professionals;
    return professionals.filter(prof => prof.id === selectedProfessionalFilter);
  }, [professionals, selectedProfessionalFilter]);

  // Filtrar agendamentos baseado nos filtros selecionados
  const filteredAppointments = useMemo(() => {
    if (!Array.isArray(appointments)) return [];
    
    let filtered = appointments;
    
    if (selectedProfessionalFilter !== 'all') {
      filtered = filtered.filter(apt => apt.funcionario_id === selectedProfessionalFilter);
    }
    
    if (selectedStatusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === selectedStatusFilter);
    }
    
    return filtered;
  }, [appointments, selectedProfessionalFilter, selectedStatusFilter]);

  // refs das colunas para detectar drop
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const gridRef = useRef<HTMLDivElement | null>(null);

  // estado de drag
  const [dragging, setDragging] = useState<{
    id: string;
    startY: number;
    initialTop: number;
    currentTop: number;
    height: number;
    profId: string;
  } | null>(null);
  
  // estado para detectar coluna atual durante drag
  const [currentDragColumn, setCurrentDragColumn] = useState<string | null>(null);

  // Horário de funcionamento baseado na data selecionada
  const getScheduleForDate = (date: Date) => {
    if (!salonInfo?.working_hours) {
      console.log('Horários de funcionamento não configurados, usando padrão');
      return { open: '08:00', close: '18:00', active: true };
    }
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const key = days[date.getDay()];
    const schedule = salonInfo.working_hours[key];
    
    console.log(`Horário para ${key} (${format(date, 'EEEE', { locale: ptBR })}):`, schedule);
    
    if (!schedule) {
      console.log(`Horário não configurado para ${key}, usando padrão`);
      return { open: '08:00', close: '18:00', active: true };
    }
    
    return schedule;
  };

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  function generateHours(open: string, close: string) {
    const openM = timeToMinutes(open);
    const closeM = timeToMinutes(close);
    const hours: string[] = [];
    for (let m = openM; m < closeM; m += SLOT_MINUTES) {
      const hh = Math.floor(m / 60).toString().padStart(2, '0');
      const mm = (m % 60).toString().padStart(2, '0');
      hours.push(`${hh}:${mm}`);
    }
    return hours;
  }

  const currentSchedule = getScheduleForDate(selectedDate || new Date());
  const hours = currentSchedule.active ? generateHours(currentSchedule.open, currentSchedule.close) : [];
  const openMinutes = timeToMinutes(currentSchedule.open);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-success text-success-foreground';
      case 'pendente':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getCardColorByStatus = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-emerald-500/10 border-emerald-500/40';
      case 'pendente':
        return 'bg-amber-500/10 border-amber-500/40';
      case 'cancelado':
        return 'bg-rose-500/10 border-rose-500/40';
      case 'concluido':
        return 'bg-sky-500/10 border-sky-500/40';
      default:
        return 'bg-muted/30 border-border';
    }
  };

  const getStripColorByStatus = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-emerald-500';
      case 'pendente':
        return 'bg-amber-500';
      case 'cancelado':
        return 'bg-rose-500';
      case 'concluido':
        return 'bg-sky-500';
      default:
        return 'bg-muted-foreground';
    }
  };

  const handleCreate = async () => {
    if (!form.funcionario_id || !form.cliente_id || !form.servico_id || !form.date || !form.time) return;
    setSaving(true);
    const data_hora = new Date(`${form.date}T${form.time}:00`).toISOString();
    await createAppointment({
      funcionario_id: form.funcionario_id,
      cliente_id: form.cliente_id,
      servico_id: form.servico_id,
      data_hora
    } as any);
    setSaving(false);
    setOpen(false);
    setForm({ funcionario_id: '', cliente_id: '', servico_id: '', date: '', time: '' });
    refetchAppointments();
  };

  const handleCreateClient = async () => {
    if (!clientForm.nome || !clientForm.email) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nome e email são obrigatórios"
      });
      return;
    }

    setCreatingClient(true);
    try {
      // Criar cliente usando o hook useClients
      const result = await createClient(clientForm);
      
      if (result && result.data) {
        // Limpar formulário de cliente
        setClientForm({ nome: '', email: '', telefone: '', observacoes: '' });
        
        // Selecionar automaticamente o novo cliente no formulário de agendamento
        setForm(f => ({ ...f, cliente_id: result.data.id }));
        
        // Fechar popover de cliente se estiver aberto
        setClientPopoverOpen(false);
        
        // Voltar ao modal de agendamento
        setClientModalOpen(false);
        
        toast({
          title: "Cliente criado com sucesso!",
          description: "Cliente selecionado automaticamente no agendamento."
        });
        
        // Refetch clients para atualizar a lista
        refetchClients();
      }
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar cliente"
      });
    } finally {
      setCreatingClient(false);
    }
  };

  const handleCreateService = async () => {
    if (!serviceForm.nome || !serviceForm.preco || !serviceForm.duracao_minutos) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nome, preço e duração são obrigatórios"
      });
      return;
    }

    setCreatingService(true);
    try {
      // Criar serviço usando o hook useServices
      const result = await createService({
        nome: serviceForm.nome,
        descricao: serviceForm.descricao,
        preco: parseFloat(serviceForm.preco),
        duracao_minutos: parseInt(serviceForm.duracao_minutos),
        categoria: serviceForm.categoria
      });
      
      if (result && result.data) {
        // Limpar formulário de serviço
        setServiceForm({ nome: '', descricao: '', preco: '', duracao_minutos: '', categoria: '' });
        
        // Selecionar automaticamente o novo serviço no formulário de agendamento
        setForm(f => ({ ...f, servico_id: result.data.id }));
        
        // Fechar popover de serviço se estiver aberto
        setServicePopoverOpen(false);
        
        // Voltar ao modal de agendamento
        setServiceModalOpen(false);
        
        toast({
          title: "Serviço criado com sucesso!",
          description: "Serviço selecionado automaticamente no agendamento."
        });
        
        // Refetch services para atualizar a lista
        refetchServices();
      }
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar serviço"
      });
    } finally {
      setCreatingService(false);
    }
  };

  const selectedDay = selectedDate || new Date();
  const appointmentsOfDay = Array.isArray(filteredAppointments) ? filteredAppointments.filter(a => {
    const aptDate = new Date(a.data_hora);
    return (
      aptDate.getFullYear() === selectedDay.getFullYear() &&
      aptDate.getMonth() === selectedDay.getMonth() &&
      aptDate.getDate() === selectedDay.getDate()
    );
  }) : [];

  const goPrevDay = () => setSelectedDate(d => addDays(d || new Date(), -1));
  const goNextDay = () => setSelectedDate(d => addDays(d || new Date(), 1));
  const goToday   = () => setSelectedDate(new Date());

  // Funções para navegação horizontal dos profissionais
  const goPrevProfessionals = () => {
    setCurrentProfIndex(prev => Math.max(0, prev - 1));
  };

  const goNextProfessionals = () => {
    const maxIndex = Math.max(0, professionals.length - professionalsPerView);
    setCurrentProfIndex(prev => Math.min(maxIndex, prev + 1));
  };

  // Calcular profissionais visíveis
  const visibleProfessionals = filteredProfessionals.slice(currentProfIndex, currentProfIndex + professionalsPerView);
  const canGoPrev = currentProfIndex > 0;
  const canGoNext = currentProfIndex + professionalsPerView < filteredProfessionals.length;

  // drag handlers
  const onMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    
    // Marcar que houve movimento (drag)
    if (!hasDragged) {
      setHasDragged(true);
    }
    
    // Detectar coluna atual durante o drag
    let currentColumn = dragging.profId;
    for (const prof of professionals) {
      const el = columnRefs.current[prof.id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right) {
        currentColumn = prof.id;
        break;
      }
    }
    setCurrentDragColumn(currentColumn);
    
    const container = columnRefs.current[dragging.profId];
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const maxTop = rect.height - dragging.height - 2;
    const deltaY = e.clientY - dragging.startY;
    const nextTop = Math.max(0, Math.min(dragging.initialTop + deltaY, maxTop));
    setDragging({ ...dragging, currentTop: nextTop });
  };

  const onMouseUp = async (e: MouseEvent) => {
    if (!dragging) return;

    // Se houve drag, não abrir modal
    if (hasDragged) {
      // descobrir coluna alvo pelo X
      let targetProfId = dragging.profId;
      let targetProfName = '';
      
      for (const prof of professionals) {
        const el = columnRefs.current[prof.id];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right) {
          targetProfId = prof.id;
          targetProfName = prof.nome;
          break;
        }
      }

      // snap to grid
      const snappedRows = Math.round(dragging.currentTop / SLOT_HEIGHT);
      const minutesFromOpen = snappedRows * SLOT_MINUTES;
      const totalMinutes = openMinutes + minutesFromOpen;
      const hh = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
      const mm = (totalMinutes % 60).toString().padStart(2, '0');

      const dateStr = format(selectedDay, 'yyyy-MM-dd');
      const iso = new Date(`${dateStr}T${hh}:${mm}:00`).toISOString();

      try {
        await updateAppointment(dragging.id, { funcionario_id: targetProfId, data_hora: iso } as any);
        
        // Mostrar toast de sucesso com informações da mudança
        const originalProf = professionals.find(p => p.id === dragging.profId);
        const newTime = `${hh}:${mm}`;
        
        if (targetProfId !== dragging.profId) {
          toast({
            title: 'Agendamento movido com sucesso!',
            description: `Movido para ${targetProfName} às ${newTime}`,
          });
        } else {
          toast({
            title: 'Horário atualizado!',
            description: `Novo horário: ${newTime}`,
          });
        }
        
        refetchAppointments();
      } catch (error: any) {
        toast({
          title: 'Erro ao mover agendamento',
          description: error.message || 'Tente novamente.',
          variant: 'destructive',
        });
      }
    }

    // Reset drag state
    setDragging(null);
    setHasDragged(false);
    setDragStartTime(0);
    setCurrentDragColumn(null);
  };

  const handleCardMouseDown = (e: React.MouseEvent, apt: any, prof: any, top: number) => {
    e.preventDefault();
    setDragStartTime(Date.now());
    setHasDragged(false);
    setDragging({ 
      id: apt.id, 
      startY: e.clientY, 
      initialTop: top, 
      currentTop: top, 
      height: (Math.max(30, (apt.servico_duracao || 60)) / SLOT_MINUTES) * SLOT_HEIGHT, 
      profId: prof.id 
    });
  };

  const handleCardClick = (apt: any) => {
    // Só abrir modal se não houve drag
    if (!hasDragged) {
      setSelectedApt(apt); 
      setEditForm({ 
        servico_id: apt.servico_id, 
        status: apt.status, 
        observacoes: apt.observacoes || '' 
      }); 
      setDetailOpen(true);
    }
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [dragging, hasDragged]);

  // Inicializar formulário quando modal abre
  useEffect(() => {
    if (open) {
      const dateStr = format(selectedDate || new Date(), 'yyyy-MM-dd');
      setForm(prev => ({
        ...prev,
        date: dateStr
      }));
    }
  }, [open]);

  const handleEmptySlotClick = (profId: string, hour: string) => {
    const dateStr = format(selectedDay, 'yyyy-MM-dd');
    setForm(prev => ({
      ...prev,
      funcionario_id: profId,
      date: dateStr,
      time: hour
    }));
    setOpen(true);
  };

  // Detectar parâmetro modal=new na URL e abrir modal automaticamente
  useEffect(() => {
    const modalParam = searchParams.get('modal');
    if (modalParam === 'new') {
      setOpen(true);
      // Limpar o parâmetro da URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Resetar índice de profissionais quando mudar de data
  useEffect(() => {
    setCurrentProfIndex(0);
  }, [selectedDate]);

  // Resetar índice de profissionais quando o filtro de profissional mudar
  useEffect(() => {
    setCurrentProfIndex(0);
  }, [selectedProfessionalFilter]);

  // Função para fazer upload de fotos do processo
  const uploadProcessPhoto = async (file: File, appointmentId: string, phase: 'antes' | 'durante' | 'depois'): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${appointmentId}-${phase}-${Date.now()}.${fileExt}`;
      const filePath = `process-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('process-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('process-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading process photo:', error);
      toast({
        title: "Erro ao fazer upload da foto",
        description: "Tente novamente",
        variant: "destructive"
      });
      return null;
    }
  };

  // Função para carregar fotos do processo
  const loadProcessPhotos = async (appointmentId: string) => {
    try {
      const { data: photos, error } = await supabase
        .from('appointment_photos')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const organizedPhotos = {
        antes: photos.filter(p => p.phase === 'antes').map(p => p.photo_url),
        durante: photos.filter(p => p.phase === 'durante').map(p => p.photo_url),
        depois: photos.filter(p => p.phase === 'depois').map(p => p.photo_url)
      };

      setProcessPhotos(organizedPhotos);
    } catch (error) {
      console.error('Error loading process photos:', error);
    }
  };

  // Função para salvar foto no banco
  const savePhotoToDatabase = async (appointmentId: string, photoUrl: string, phase: 'antes' | 'durante' | 'depois') => {
    try {
      const { error } = await supabase
        .from('appointment_photos')
        .insert({
          appointment_id: appointmentId,
          photo_url: photoUrl,
          phase: phase
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving photo to database:', error);
      throw error;
    }
  };

  // Função para deletar foto
  const deleteProcessPhoto = async (photoUrl: string, appointmentId: string, phase: 'antes' | 'durante' | 'depois') => {
    try {
      // Extrair caminho do arquivo da URL
      const urlParts = photoUrl.split('/');
      const filePath = urlParts.slice(-2).join('/');

      // Deletar do storage
      await supabase.storage
        .from('process-photos')
        .remove([filePath]);

      // Deletar do banco
      await supabase
        .from('appointment_photos')
        .delete()
        .eq('appointment_id', appointmentId)
        .eq('photo_url', photoUrl)
        .eq('phase', phase);

      // Atualizar estado local
      setProcessPhotos(prev => ({
        ...prev,
        [phase]: prev[phase].filter(url => url !== photoUrl)
      }));

      toast({
        title: "Foto removida com sucesso",
        description: "A foto foi deletada do sistema"
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Erro ao deletar foto",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };

  // Função para abrir foto expandida
  const openExpandedPhoto = (url: string, phase: string, index: number) => {
    setExpandedPhoto({ url, phase, index });
  };

  // Mostrar skeleton enquanto carrega (aguarda profissionais e agendamentos)
  if (loading || professionalsLoading) {
    return (
      <AdminLayout>
        <AgendaSkeleton />
      </AdminLayout>
    );
  }

  // Verificar se o salão está funcionando no dia selecionado
  const isSalonOpen = currentSchedule.active;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
            <p className="text-muted-foreground">Gerencie todos os agendamentos do salão</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setFilterModalOpen(true)}>
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {(selectedProfessionalFilter !== 'all' || selectedStatusFilter !== 'all') && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {(selectedProfessionalFilter !== 'all' ? 1 : 0) + (selectedStatusFilter !== 'all' ? 1 : 0)}
                </span>
              )}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Novo Agendamento</Button>
              </DialogTrigger>
              <DialogContent>
                {!clientModalOpen && !serviceModalOpen ? (
                  // Modal de Novo Agendamento
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        Novo Agendamento
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Profissional
                    </label>
                    <Select value={form.funcionario_id} onValueChange={v => setForm(f => ({ ...f, funcionario_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {professionals.map(p => (<SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Cliente
                    </label>
                    <div className="flex gap-2">
                      <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="flex-1 justify-between" onClick={() => setClientPopoverOpen(true)}>
                            {form.cliente_id ? (clients.find(c => c.id === form.cliente_id)?.nome || 'Selecione') : 'Selecione'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                          <Command>
                            <CommandInput placeholder="Buscar cliente pelo nome..." />
                            <CommandList>
                              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                              <CommandGroup>
                                {clients.map((c) => (
                                  <CommandItem
                                    key={c.id}
                                    value={c.nome}
                                    onSelect={() => {
                                      setForm(f => ({ ...f, cliente_id: c.id }));
                                      setClientPopoverOpen(false);
                                    }}
                                  >
                                    {c.nome}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setClientModalOpen(true)}
                        className="h-10 w-10 flex-shrink-0"
                        title="Cadastrar Novo Cliente"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1 flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-primary" />
                      Serviço
                    </label>
                    <div className="flex gap-2">
                      <Popover open={servicePopoverOpen} onOpenChange={setServicePopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="flex-1 justify-between" onClick={() => setServicePopoverOpen(true)}>
                            {form.servico_id ? (services.find(s => s.id === form.servico_id)?.nome || 'Selecione') : 'Selecione'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                          <Command>
                            <CommandInput placeholder="Buscar serviço pelo nome..." />
                            <CommandList>
                              <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
                              <CommandGroup>
                        {services.map(s => (
                                <CommandItem
                                  key={s.id}
                                  value={s.nome}
                                  onSelect={() => {
                                    setForm(f => ({ ...f, servico_id: s.id }));
                                    setServicePopoverOpen(false);
                                  }}
                                >
                                  {s.nome}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setServiceModalOpen(true)}
                      className="h-10 w-10 flex-shrink-0"
                      title="Cadastrar Novo Serviço"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm mb-1 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        Data
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : <span className="text-muted-foreground">Selecione a data</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="p-0">
                          <Calendar mode="single" selected={selectedDate} onSelect={date => { setSelectedDate(date || new Date()); setForm(f => ({ ...f, date: date ? format(date, 'yyyy-MM-dd') : '' })); }} locale={ptBR} fromDate={new Date()} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm mb-1 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Hora
                      </label>
                      <Select value={form.time} onValueChange={v => setForm(f => ({ ...f, time: v }))}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {hours.map(h => (<SelectItem key={h} value={h}>{h}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleCreate} 
                    disabled={saving || !form.funcionario_id || !form.cliente_id || !form.servico_id || !form.date || !form.time}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      'Salvar'
                    )}
                  </Button>
                  <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                </DialogFooter>
                  </>
                ) : clientModalOpen ? (
                  // Modal de Cadastro de Cliente
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Novo Cliente
                      </DialogTitle>
                      <DialogDescription>
                        Cadastre um novo cliente para continuar com o agendamento
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={(e) => { e.preventDefault(); handleCreateClient(); }} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="client-nome" className="text-sm flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          Nome
                        </label>
                        <Input 
                          id="client-nome" 
                          value={clientForm.nome} 
                          onChange={e => setClientForm({ ...clientForm, nome: e.target.value })} 
                          required 
                          disabled={creatingClient} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="client-email" className="text-sm flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary" />
                          E-mail
                        </label>
                        <Input 
                          id="client-email" 
                          type="email" 
                          value={clientForm.email} 
                          onChange={e => setClientForm({ ...clientForm, email: e.target.value })} 
                          required 
                          disabled={creatingClient} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="client-telefone" className="text-sm flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" />
                          Telefone (Opcional)
                        </label>
                        <Input 
                          id="client-telefone" 
                          value={clientForm.telefone} 
                          onChange={e => setClientForm({ ...clientForm, telefone: e.target.value })} 
                          disabled={creatingClient} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="client-observacoes" className="text-sm flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          Observações (Opcional)
                        </label>
                        <textarea 
                          id="client-observacoes" 
                          value={clientForm.observacoes} 
                          onChange={e => setClientForm({ ...clientForm, observacoes: e.target.value })} 
                          className="w-full rounded border border-border bg-background px-3 py-2 text-sm" 
                          rows={2} 
                          disabled={creatingClient} 
                        />
                      </div>
                      
                      <DialogFooter className="flex gap-2 justify-end pt-4">
                        <Button type="submit" disabled={creatingClient}>
                          {creatingClient ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Criando...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Criar Cliente
                            </>
                          )}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setClientModalOpen(false)} 
                          disabled={creatingClient}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </DialogFooter>
                    </form>
                  </>
                ) : (
                  // Modal de Cadastro de Serviço
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Scissors className="h-5 w-5 text-primary" />
                        Novo Serviço
                      </DialogTitle>
                      <DialogDescription>
                        Cadastre um novo serviço para continuar com o agendamento
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={(e) => { e.preventDefault(); handleCreateService(); }} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="service-nome" className="text-sm flex items-center gap-2">
                          <Scissors className="h-4 w-4 text-primary" />
                          Nome do Serviço
                        </label>
                        <Input 
                          id="service-nome" 
                          value={serviceForm.nome} 
                          onChange={e => setServiceForm({ ...serviceForm, nome: e.target.value })} 
                          required 
                          disabled={creatingService} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="service-descricao" className="text-sm flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          Descrição (Opcional)
                        </label>
                        <textarea 
                          id="service-descricao" 
                          value={serviceForm.descricao} 
                          onChange={e => setServiceForm({ ...serviceForm, descricao: e.target.value })} 
                          className="w-full rounded border border-border bg-background px-3 py-2 text-sm" 
                          rows={2} 
                          disabled={creatingService} 
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="service-preco" className="text-sm flex items-center gap-2">
                            <span className="text-primary">R$</span>
                            Preço (R$)
                          </label>
                          <Input 
                            id="service-preco" 
                            type="number" 
                            step="0.01" 
                            min="0"
                            value={serviceForm.preco} 
                            onChange={e => setServiceForm({ ...serviceForm, preco: e.target.value })} 
                            required 
                            disabled={creatingService} 
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="service-duracao" className="text-sm flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            Duração (min)
                          </label>
                          <Input 
                            id="service-duracao" 
                            type="number" 
                            min="1"
                            value={serviceForm.duracao_minutos} 
                            onChange={e => setServiceForm({ ...serviceForm, duracao_minutos: e.target.value })} 
                            required 
                            disabled={creatingService} 
                          />
                        </div>
                      </div>
                      
                                              <div className="space-y-2">
                          <label htmlFor="service-categoria" className="text-sm flex items-center gap-2">
                            <span className="text-primary">#</span>
                            Categoria (Opcional)
                          </label>
                        <Input 
                          id="service-categoria" 
                          value={serviceForm.categoria} 
                          onChange={e => setServiceForm({ ...serviceForm, categoria: e.target.value })} 
                          placeholder="Ex: Cabelo, Unha, Maquiagem..."
                          disabled={creatingService} 
                        />
                      </div>
                      
                      <DialogFooter className="flex gap-2 justify-end pt-4">
                        <Button type="submit" disabled={creatingService}>
                          {creatingService ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Criando...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Criar Serviço
                            </>
                          )}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setServiceModalOpen(false)} 
                          disabled={creatingService}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </DialogFooter>
                    </form>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Controles de data da agenda */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goPrevDay} aria-label="Dia anterior"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" onClick={goToday}>Hoje</Button>
            <Button variant="outline" size="icon" onClick={goNextDay} aria-label="Próximo dia"><ChevronRight className="h-4 w-4" /></Button>
            {/* Navegação de profissionais */}
            {filteredProfessionals.length > professionalsPerView && (
              <div className="flex items-center gap-2 ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goPrevProfessionals}
                  disabled={!canGoPrev}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentProfIndex + 1}-{Math.min(currentProfIndex + professionalsPerView, filteredProfessionals.length)} de {filteredProfessionals.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goNextProfessionals}
                  disabled={!canGoNext}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(selectedDay, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-0">
              <Calendar mode="single" selected={selectedDay} onSelect={date => setSelectedDate(date || new Date())} locale={ptBR} />
            </PopoverContent>
          </Popover>
        </div>

        {/* Mensagem quando salão não está funcionando */}
        {!isSalonOpen && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800">Salão Fechado</h3>
                <p className="text-sm text-amber-700">
                  O salão não está funcionando na {format(selectedDay, "EEEE, dd/MM", { locale: ptBR })}. 
                  {currentSchedule.open && currentSchedule.close && (
                    <span> Horário configurado: {currentSchedule.open} às {currentSchedule.close}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grade da agenda */}
        <div className="bg-card rounded-lg shadow-elegant overflow-auto border border-border">
          {/* Cabeçalho sticky dos profissionais */}
          <div className="sticky top-0 z-10 grid bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75" style={{ gridTemplateColumns: `160px repeat(${visibleProfessionals.length}, minmax(200px,1fr))` }}>
            {/* Célula da data */}
            <div className="p-4 border-r border-border text-left">
              <div className="text-xs text-muted-foreground leading-none">Dia</div>
              <div className="font-semibold text-foreground">{format(selectedDay, "EEEE, dd/MM", { locale: ptBR })}</div>
              {isSalonOpen && currentSchedule.open && currentSchedule.close && (
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {currentSchedule.open} - {currentSchedule.close}
                </div>
              )}
            </div>
            {visibleProfessionals.map(prof => (
              <div key={prof.id} className="p-4 text-center border-r border-border last:border-r-0 flex flex-col items-center">
                {prof.avatar_url ? (
                  <img src={prof.avatar_url} alt={prof.nome} className="w-12 h-12 rounded-full mb-2 object-cover border-2 border-primary" />
                ) : (
                  <div className="w-12 h-12 rounded-full mb-2 bg-muted flex items-center justify-center text-lg font-bold border-2 border-primary text-primary">
                    {prof.nome.split(' ').map(n => n[0]).join('').slice(0,2)}
                  </div>
                )}
                <p className="font-bold text-foreground leading-tight">{prof.nome}</p>
                <p className="text-xs text-muted-foreground">{prof.cargo || 'Profissional'}</p>
              </div>
            ))}
          </div>

          {/* Corpo da grade */}
          <div ref={gridRef} className="relative grid" style={{ gridTemplateColumns: `160px repeat(${visibleProfessionals.length}, minmax(200px,1fr))` }}>
            {hours.length === 0 ? (
              // Mensagem quando não há horários disponíveis
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="p-3 bg-muted rounded-full w-fit mx-auto mb-3">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Nenhum horário disponível</h3>
                  <p className="text-sm text-muted-foreground">
                    O salão não está funcionando neste dia ou os horários não foram configurados.
                  </p>
                </div>
              </div>
            ) : (
              <>
            {/* Coluna de horários (sticky à esquerda) */}
            <div className="sticky left-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 border-r border-border text-xs text-muted-foreground">
              {hours.map((hour) => (
                <div key={hour} className="flex items-center justify-center border-t border-border" style={{ height: SLOT_HEIGHT }}>
                  <span>{hour}</span>
                </div>
              ))}
            </div>

            {/* Colunas dos profissionais */}
            {visibleProfessionals.map(prof => {
              const profAppointments = appointmentsOfDay.filter(a => a.funcionario_id === prof.id);
              const isDragTarget = dragging && currentDragColumn === prof.id && currentDragColumn !== dragging.profId;
              return (
                <div 
                  key={prof.id} 
                  ref={(el) => (columnRefs.current[prof.id] = el)} 
                  className={`relative border-l border-border transition-colors duration-200 ${isDragTarget ? 'bg-primary/5 border-primary/40' : ''}`} 
                  style={{ height: hours.length * SLOT_HEIGHT }}
                >
                  {/* Linhas de hora de fundo */}
                  {hours.map((h, i) => (
                    <div key={h} className="absolute left-0 right-0 border-t border-border" style={{ top: i * SLOT_HEIGHT }} />
                  ))}

                  {/* Slots vazios clicáveis */}
                  {hours.map((h, i) => {
                    const topPos = i * SLOT_HEIGHT;
                    return (
                      <button
                        key={`slot-${prof.id}-${h}`}
                        type="button"
                        className={`group absolute left-1 right-1 rounded-md border border-transparent transition-colors ${dragging ? 'pointer-events-none' : 'hover:border-border/60 hover:bg-primary/5'}`}
                        style={{ top: topPos, height: SLOT_HEIGHT }}
                        onClick={() => handleEmptySlotClick(prof.id, h)}
                        aria-label={`Adicionar agendamento às ${h} com ${prof.nome}`}
                      >
                        <span className={`pointer-events-none transition-opacity duration-150 inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium ml-2 mt-2 shadow-sm ${dragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>+</span>
                      </button>
                    );
                  })}

                  {/* Agendamentos posicionados por horário e duração */}
                  {profAppointments.map(apt => {
                    const start = new Date(apt.data_hora);
                    const startMinutes = start.getHours() * 60 + start.getMinutes();
                    const minutesFromOpen = Math.max(0, startMinutes - openMinutes);
                    const top = (minutesFromOpen / SLOT_MINUTES) * SLOT_HEIGHT;
                    const duration = Math.max(30, (apt.servico_duracao || 60));
                    const height = (duration / SLOT_MINUTES) * SLOT_HEIGHT;

                    const isDragging = dragging?.id === apt.id;
                    const topStyle = isDragging ? dragging.currentTop : top;

                    const end = addMinutes(start, apt.servico_duracao || 60);
                    const timeRange = `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;

                  return (
                      <div
                        key={apt.id}
                        className={`absolute left-1 right-1 rounded-md shadow-sm overflow-hidden hover:shadow-md transition-shadow border ${getCardColorByStatus(apt.status)} ${isDragging ? 'z-20 ring-2 ring-primary/40' : ''}`}
                        style={{ top: topStyle, height }}
                        onMouseDown={(e) => handleCardMouseDown(e, apt, prof, top)}
                        onClick={() => handleCardClick(apt)}
                        title={`${apt.cliente_nome || 'Cliente'} • ${apt.servico_nome || ''}`}
                      >
                        <div className="px-3 py-2 text-left cursor-grab active:cursor-grabbing select-none relative h-full">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStripColorByStatus(apt.status)}`} />
                          <div className="flex items-center justify-between pr-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <Users className="h-3.5 w-3.5 text-primary min-w-[14px]" />
                              <span className="text-sm font-semibold text-foreground truncate">{apt.cliente_nome || 'Cliente'}</span>
                            </div>
                            <span className={`ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${getStatusColor(apt.status)}`}>{apt.status}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                            <Scissors className="h-3.5 w-3.5 text-primary min-w-[14px]" />
                            <span className="truncate">{apt.servico_nome || 'Serviço'}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 text-primary" />
                            <span>{apt.cliente_telefone ? formatPhoneNumber(apt.cliente_telefone) : 'Sem telefone'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Legenda de status */}
        <div className="flex flex-wrap items-center gap-4 pt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-500"></span>
            <span>Pendente</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-500"></span>
            <span>Confirmado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-rose-500"></span>
            <span>Cancelado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-sky-500"></span>
            <span>Concluído</span>
          </div>
        </div>

        {/* Modal de detalhes/edição */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-semibold">Detalhes do Agendamento</DialogTitle>
                    <p className="text-xs text-muted-foreground">
                      {selectedApt && format(new Date(selectedApt.data_hora), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedApt) {
                        loadProcessPhotos(selectedApt.id);
                        setPhotosModalOpen(true);
                      }
                    }}
                    className="ml-20"
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Fotos
                  </Button>
                </div>
              </div>
            </DialogHeader>
            {selectedApt && (
              <div className="space-y-4">
                {/* Informações do Agendamento */}
                <div className="bg-muted/30 rounded-lg p-3 space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Informações do Agendamento</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3 text-primary" />
                        <span>Cliente</span>
                      </div>
                      <div className="font-medium text-foreground text-base">{selectedApt.cliente_nome || 'Cliente'}</div>
                      {selectedApt.cliente_telefone && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3 text-primary" />
                          {selectedApt.cliente_telefone}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Scissors className="h-3 w-3 text-primary" />
                        <span>Serviço</span>
                      </div>
                      <div className="font-medium text-foreground text-base">{selectedApt.servico_nome || 'Serviço'}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3 text-primary" />
                        Duração: {selectedApt.servico_duracao || 60} min
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edição do Agendamento */}
                <div className="bg-muted/30 rounded-lg p-3 space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Editar Agendamento</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-primary" />
                        Status
                      </label>
                      <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="confirmado">Confirmado</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 flex items-center gap-1">
                        <Scissors className="h-3 w-3 text-primary" />
                        Serviço
                      </label>
                      <Select value={editForm.servico_id} onValueChange={v => setEditForm(f => ({ ...f, servico_id: v }))}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {services.map(s => (<SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-primary" />
                      Observações
                    </label>
                    <textarea
                      className="w-full min-h-[60px] rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
                      placeholder="Anote qualquer observação importante sobre este agendamento..."
                      value={editForm.observacoes || ''}
                      onChange={(e) => setEditForm(f => ({ ...f, observacoes: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="flex items-center justify-between pt-3 border-t border-border">
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={async () => {
                  if (!selectedApt) return;
                  await deleteAppointment(selectedApt.id);
                  setDetailOpen(false);
                }}
                className="flex items-center gap-1"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3 w-3" />
                    <span>Excluir</span>
                  </>
                )}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setDetailOpen(false)} disabled={isUpdating}>
                  <X className="h-3 w-3 mr-1" />
                  Cancelar
                </Button>
                <Button 
                  size="sm"
                  disabled={isUpdating}
                  onClick={async () => {
                    if (!selectedApt) return;
                    await updateAppointment(selectedApt.id, {
                      servico_id: editForm.servico_id,
                      status: editForm.status as any,
                      observacoes: editForm.observacoes,
                    } as any);
                    setDetailOpen(false);
                  }}
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3 mr-1" />
                      Salvar alterações
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Fotos do Processo */}
        <Dialog open={photosModalOpen} onOpenChange={setPhotosModalOpen}>
          <DialogContent className="w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Fotos do Processo
              </DialogTitle>
              <DialogDescription>
                Gerencie as fotos do processo: Antes, Durante e Depois
              </DialogDescription>
            </DialogHeader>

            {selectedApt && (
              <div className="space-y-4 sm:space-y-6">
                {/* Seção Antes */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                      Antes
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file && selectedApt) {
                            setUploadingPhotos(true);
                            const photoUrl = await uploadProcessPhoto(file, selectedApt.id, 'antes');
                            if (photoUrl) {
                              await savePhotoToDatabase(selectedApt.id, photoUrl, 'antes');
                              await loadProcessPhotos(selectedApt.id);
                              toast({
                                title: "Foto adicionada com sucesso",
                                description: "A foto foi salva no sistema"
                              });
                            }
                            setUploadingPhotos(false);
                          }
                        };
                        input.click();
                      }}
                      disabled={uploadingPhotos}
                    >
                      <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Adicionar Foto
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {processPhotos.antes.map((photoUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photoUrl}
                          alt={`Antes ${index + 1}`}
                          className="w-full h-24 sm:h-32 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => openExpandedPhoto(photoUrl, 'antes', index)}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProcessPhoto(photoUrl, selectedApt.id, 'antes');
                          }}
                          className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <X className="h-2 w-2 sm:h-3 sm:w-3" />
                        </button>
                      </div>
                    ))}
                    {processPhotos.antes.length === 0 && (
                      <div className="col-span-full text-center py-4 sm:py-8 text-muted-foreground text-sm sm:text-base">
                        Nenhuma foto adicionada
                      </div>
                    )}
                  </div>
                </div>

                {/* Seção Durante */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full"></div>
                      Durante
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file && selectedApt) {
                            setUploadingPhotos(true);
                            const photoUrl = await uploadProcessPhoto(file, selectedApt.id, 'durante');
                            if (photoUrl) {
                              await savePhotoToDatabase(selectedApt.id, photoUrl, 'durante');
                              await loadProcessPhotos(selectedApt.id);
                              toast({
                                title: "Foto adicionada com sucesso",
                                description: "A foto foi salva no sistema"
                              });
                            }
                            setUploadingPhotos(false);
                          }
                        };
                        input.click();
                      }}
                      disabled={uploadingPhotos}
                    >
                      <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Adicionar Foto
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {processPhotos.durante.map((photoUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photoUrl}
                          alt={`Durante ${index + 1}`}
                          className="w-full h-24 sm:h-32 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => openExpandedPhoto(photoUrl, 'durante', index)}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProcessPhoto(photoUrl, selectedApt.id, 'durante');
                          }}
                          className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <X className="h-2 w-2 sm:h-3 sm:w-3" />
                        </button>
                      </div>
                    ))}
                    {processPhotos.durante.length === 0 && (
                      <div className="col-span-full text-center py-4 sm:py-8 text-muted-foreground text-sm sm:text-base">
                        Nenhuma foto adicionada
                      </div>
                    )}
                  </div>
                </div>

                {/* Seção Depois */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
                      Depois
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file && selectedApt) {
                            setUploadingPhotos(true);
                            const photoUrl = await uploadProcessPhoto(file, selectedApt.id, 'depois');
                            if (photoUrl) {
                              await savePhotoToDatabase(selectedApt.id, photoUrl, 'depois');
                              await loadProcessPhotos(selectedApt.id);
                              toast({
                                title: "Foto adicionada com sucesso",
                                description: "A foto foi salva no sistema"
                              });
                            }
                            setUploadingPhotos(false);
                          }
                        };
                        input.click();
                      }}
                      disabled={uploadingPhotos}
                    >
                      <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Adicionar Foto
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {processPhotos.depois.map((photoUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photoUrl}
                          alt={`Depois ${index + 1}`}
                          className="w-full h-24 sm:h-32 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => openExpandedPhoto(photoUrl, 'depois', index)}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProcessPhoto(photoUrl, selectedApt.id, 'depois');
                          }}
                          className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <X className="h-2 w-2 sm:h-3 sm:w-3" />
                        </button>
                      </div>
                    ))}
                    {processPhotos.depois.length === 0 && (
                      <div className="col-span-full text-center py-4 sm:py-8 text-muted-foreground text-sm sm:text-base">
                        Nenhuma foto adicionada
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-4 sm:pt-6">
              <Button 
                onClick={() => setPhotosModalOpen(false)}
                className="w-full sm:w-auto"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Filtros */}
        {filterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md relative">
              <button 
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" 
                onClick={() => setFilterModalOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <Filter className="h-5 w-5 text-primary" />
                  Filtros da Agenda
                </h2>
                <p className="text-sm text-muted-foreground">
                  Filtre os agendamentos por profissional e status
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Profissional
                  </label>
                  <Select 
                    value={selectedProfessionalFilter} 
                    onValueChange={setSelectedProfessionalFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os profissionais" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os profissionais</SelectItem>
                      {professionals.map(prof => (
                        <SelectItem key={prof.id} value={prof.id}>
                          {prof.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Status
                  </label>
                  <Select 
                    value={selectedStatusFilter} 
                    onValueChange={setSelectedStatusFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedProfessionalFilter('all');
                    setSelectedStatusFilter('all');
                  }}
                >
                  Limpar Filtros
                </Button>
                <Button onClick={() => setFilterModalOpen(false)}>
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Visualização Expandida */}
        <Dialog open={!!expandedPhoto} onOpenChange={() => setExpandedPhoto(null)}>
          <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
              className="fixed left-[50%] top-[50%] z-50 w-[95vw] h-[90vh] max-w-6xl translate-x-[-50%] translate-y-[-50%] bg-black/95 p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg"
            >
              <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4 lg:p-6">
                {expandedPhoto && (
                  <>
                    <img
                      src={expandedPhoto.url}
                      alt={`Foto ${expandedPhoto.phase} ${expandedPhoto.index + 1}`}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                      style={{
                        maxWidth: 'min(calc(100vw - 1rem), 1200px)',
                        maxHeight: 'min(calc(90vh - 1rem), 800px)'
                      }}
                    />
                    <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-black/70 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium backdrop-blur-sm">
                      {expandedPhoto.phase.charAt(0).toUpperCase() + expandedPhoto.phase.slice(1)} - Foto {expandedPhoto.index + 1}
                    </div>
                    <button
                      onClick={() => setExpandedPhoto(null)}
                      className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/70 text-white p-1.5 sm:p-2 rounded-full hover:bg-black/90 transition-colors backdrop-blur-sm"
                    >
                      <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </>
                )}
              </div>
            </DialogPrimitive.Content>
          </DialogPortal>
        </Dialog>

      </div>
    </AdminLayout>
  );
};

export default Agenda;