import { Calendar as CalendarIcon, Clock, Users, Plus, Filter, ChevronLeft, ChevronRight, ChevronDown, Scissors, CheckCircle, MessageSquare, Trash2, Save, X, Phone, User, UserPlus, Mail, Camera, Image, Eye, Upload, Lock, Unlock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputPhone } from "@/components/ui/input-phone";
import { Badge } from "@/components/ui/badge";
import { useSalonInfo } from '@/hooks/useSalonInfo';
import { useAppointments } from '@/hooks/useAppointments';
import { useAuth } from '@/hooks/useAuth';
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
  const numbers = phone.replace(/\D/g, '');
  
  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }
  
  if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  
  if (numbers.length === 8) {
    return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
  }
  
  if (numbers.length === 9) {
    return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
  }
  
  return phone;
};


const ProfissionalAgenda = () => {
  const { salonInfo } = useSalonInfo();
  const { appointments, loading, createAppointment, updateAppointment, deleteAppointment, refetch: refetchAppointments, isCreating, isUpdating, isDeleting } = useAppointments();
  const { profile } = useAuth();

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

  // Estados para filtros
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // refs das colunas para detectar drop
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const gridRef = useRef<HTMLDivElement | null>(null);

  // estado de drag
  const [dragging, setDragging] = useState<{
    id: string;
    startX: number;
    startY: number;
    initialTop: number;
    currentTop: number;
    currentX: number;
    height: number;
    profId: string;
  } | null>(null);
  
  // estado para detectar coluna atual durante drag
  const [currentDragColumn, setCurrentDragColumn] = useState<string | null>(null);
  
  // Estados para bloqueio de horários
  const [lockedSlots, setLockedSlots] = useState<Set<string>>(new Set());
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  // Filtrar agendamentos apenas do profissional logado
  const filteredAppointments = useMemo(() => {
    if (!Array.isArray(appointments) || !profile?.id) return [];
    
    let filtered = appointments.filter(apt => apt.funcionario_id === profile.id);
    
    if (selectedStatusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === selectedStatusFilter);
    }
    
    return filtered;
  }, [appointments, profile?.id, selectedStatusFilter]);

  // Função para carregar horários bloqueados do banco
  const loadBlockedSlots = async (date: Date) => {
    try {
      const { data, error } = await supabase
        .from('blocked_slots')
        .select('funcionario_id, hora_inicio')
        .eq('salao_id', salonInfo?.id)
        .eq('data', format(date, 'yyyy-MM-dd'));

      if (error) throw error;

      const blockedSet = new Set<string>();
      data?.forEach(slot => {
        blockedSet.add(`${slot.funcionario_id}-${slot.hora_inicio}`);
      });

      setLockedSlots(blockedSet);
    } catch (error) {
      console.error('Erro ao carregar horários bloqueados:', error);
      setLockedSlots(new Set());
    }
  };

  // Horário de funcionamento baseado na data selecionada
  const getScheduleForDate = (date: Date) => {
    if (!salonInfo?.working_hours) {
      return { open: '08:00', close: '18:00', active: true };
    }
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const key = days[date.getDay()];
    const schedule = salonInfo.working_hours[key];
    
    if (!schedule) {
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
  const allHours = currentSchedule.active ? generateHours(currentSchedule.open, currentSchedule.close) : [];
  const openMinutes = timeToMinutes(currentSchedule.open);
  
  // Filtrar horários disponíveis baseado nos slots bloqueados
  const getAvailableHours = (profId: string) => {
    return allHours.filter(hour => !isSlotLocked(profId, hour));
  };

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
        return 'bg-muted';
    }
  };

  // Funções de drag and drop
  const handleCardMouseDown = (e: React.MouseEvent, apt: any, prof: any, top: number) => {
    e.preventDefault();
    setDragStartTime(Date.now());
    setHasDragged(false);
    setDragging({ 
      id: apt.id, 
      startX: e.clientX,
      startY: e.clientY, 
      initialTop: top, 
      currentTop: top,
      currentX: 0,
      height: (Math.max(30, (apt.servico_duracao || 60)) / SLOT_MINUTES) * SLOT_HEIGHT, 
      profId: prof.id 
    });
  };

  const handleCardTouchStart = (e: React.TouchEvent, apt: any, prof: any, top: number) => {
    e.preventDefault();
    const touch = e.touches[0];
    setDragStartTime(Date.now());
    setHasDragged(false);
    setDragging({ 
      id: apt.id, 
      startX: touch.clientX,
      startY: touch.clientY, 
      initialTop: top, 
      currentTop: top,
      currentX: 0,
      height: (Math.max(30, (apt.servico_duracao || 60)) / SLOT_MINUTES) * SLOT_HEIGHT, 
      profId: prof.id 
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    
    const deltaY = e.clientY - dragging.startY;
    const newTop = Math.max(0, dragging.initialTop + deltaY);
    
    setDragging(prev => ({
      ...prev,
      currentTop: newTop
    }));
    
    if (Math.abs(deltaY) > 5) {
      setHasDragged(true);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!dragging) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - dragging.startY;
    const newTop = Math.max(0, dragging.initialTop + deltaY);
    
    setDragging(prev => ({
      ...prev,
      currentTop: newTop
    }));
    
    if (Math.abs(deltaY) > 5) {
      setHasDragged(true);
    }
  };

  const handleMouseUp = () => {
    if (!dragging) return;
    
    // Snap to grid
    const snappedRows = Math.round(dragging.currentTop / SLOT_HEIGHT);
    const minutesFromOpen = snappedRows * SLOT_MINUTES;
    const totalMinutes = openMinutes + minutesFromOpen;
    const hh = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const mm = (totalMinutes % 60).toString().padStart(2, '0');

    const dateStr = format(selectedDate || new Date(), 'yyyy-MM-dd');
    const iso = new Date(`${dateStr}T${hh}:${mm}:00`).toISOString();

    updateAppointment(dragging.id, { data_hora: iso } as any);
    
    setDragging(null);
    setDragStartTime(0);
  };

  const handleTouchEnd = () => {
    if (!dragging) return;
    
    // Snap to grid
    const snappedRows = Math.round(dragging.currentTop / SLOT_HEIGHT);
    const minutesFromOpen = snappedRows * SLOT_MINUTES;
    const totalMinutes = openMinutes + minutesFromOpen;
    const hh = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const mm = (totalMinutes % 60).toString().padStart(2, '0');

    const dateStr = format(selectedDate || new Date(), 'yyyy-MM-dd');
    const iso = new Date(`${dateStr}T${hh}:${mm}:00`).toISOString();

    updateAppointment(dragging.id, { data_hora: iso } as any);
    
    setDragging(null);
    setDragStartTime(0);
  };

  // Funções de bloqueio de horários
  const handleSlotLock = async (profId: string, hour: string) => {
    const slotKey = `${profId}-${hour}`;
    
    try {
      if (lockedSlots.has(slotKey)) {
        // Desbloquear horário - remover do banco
        const { error } = await supabase
          .from('blocked_slots')
          .delete()
          .eq('funcionario_id', profId)
          .eq('data', format(selectedDate || new Date(), 'yyyy-MM-dd'))
          .eq('hora_inicio', hour);

        if (error) throw error;

        setLockedSlots(prev => {
          const newSet = new Set(prev);
          newSet.delete(slotKey);
          return newSet;
        });

        toast({
          title: "Horário desbloqueado",
          description: `O horário ${hour} foi liberado para agendamentos`
        });
      } else {
        // Bloquear horário - inserir no banco
        const endHour = addMinutes(new Date(`2000-01-01T${hour}:00`), SLOT_MINUTES).toTimeString().slice(0, 5);
        
        const { error } = await supabase
          .from('blocked_slots')
          .insert([{
            salao_id: salonInfo?.id,
            funcionario_id: profId,
            data: format(selectedDate || new Date(), 'yyyy-MM-dd'),
            hora_inicio: hour,
            hora_fim: endHour,
            criado_por: profile?.id
          }]);

        if (error) throw error;

        setLockedSlots(prev => {
          const newSet = new Set(prev);
          newSet.add(slotKey);
          return newSet;
        });

        toast({
          title: "Horário bloqueado",
          description: `O horário ${hour} foi bloqueado para agendamentos`
        });
      }
    } catch (error) {
      console.error('Erro ao gerenciar bloqueio:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerenciar bloqueio do horário",
        variant: "destructive"
      });
    }
  };

  const isSlotLocked = (profId: string, hour: string) => {
    return lockedSlots.has(`${profId}-${hour}`);
  };

  const handleEmptySlotClick = (profId: string, hour: string) => {
    const dateStr = format(selectedDate || new Date(), 'yyyy-MM-dd');
    const iso = new Date(`${dateStr}T${hour}:00`).toISOString();
    
    setForm(prev => ({
      ...prev,
      funcionario_id: profId,
      date: dateStr,
      time: hour
    }));
    setOpen(true);
  };

  // Event listeners para drag and drop
  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [dragging]);

  const getAppointmentsForTime = (profId: string, time: string) => {
    if (!selectedDate) return [];
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return filteredAppointments.filter(apt => 
      apt.funcionario_id === profId && 
      apt.data_hora.startsWith(dateStr) &&
      apt.data_hora.includes(time)
    );
  };

  const getAppointmentPosition = (apt: any) => {
    const startTime = apt.data_hora.split('T')[1].substring(0, 5);
    const startMinutes = timeToMinutes(startTime);
    const top = ((startMinutes - openMinutes) / SLOT_MINUTES) * SLOT_HEIGHT;
    return top;
  };

  const getAppointmentHeight = (apt: any) => {
    const service = services.find(s => s.id === apt.servico_id);
    const duration = service?.duracao_minutos || 60;
    return (duration / SLOT_MINUTES) * SLOT_HEIGHT;
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      loadBlockedSlots(date);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.funcionario_id || !form.cliente_id || !form.servico_id || !form.date || !form.time) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const service = services.find(s => s.id === form.servico_id);
      const duration = service?.duracao_minutos || 60;
      const endTime = addMinutes(new Date(`${form.date}T${form.time}`), duration);
      
      await createAppointment({
        funcionario_id: form.funcionario_id,
        cliente_id: form.cliente_id,
        servico_id: form.servico_id,
        data_hora: `${form.date}T${form.time}`,
        data_hora_fim: endTime.toISOString(),
        status: 'confirmado',
        observacoes: ''
      });

      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso",
      });

      setForm({ funcionario_id: '', cliente_id: '', servico_id: '', date: '', time: '' });
      setOpen(false);
      refetchAppointments();
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar agendamento",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAppointment = async () => {
    if (!selectedApt) return;

    setSaving(true);
    try {
      await updateAppointment(selectedApt.id, editForm);
      
      toast({
        title: "Sucesso",
        description: "Agendamento atualizado com sucesso",
      });

      setDetailOpen(false);
      setSelectedApt(null);
      setEditForm({});
      refetchAppointments();
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar agendamento",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedApt) return;

    setSaving(true);
    try {
      await deleteAppointment(selectedApt.id);
      
      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso",
      });

      setDetailOpen(false);
      setSelectedApt(null);
      refetchAppointments();
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir agendamento",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingClient(true);

    try {
      await createClient({
        nome: clientForm.nome,
        email: clientForm.email,
        telefone: clientForm.telefone,
        observacoes: clientForm.observacoes
      });

      toast({
        title: "Sucesso",
        description: "Cliente criado com sucesso",
      });

      setClientForm({ nome: '', email: '', telefone: '', observacoes: '' });
      setClientModalOpen(false);
      refetchClients();
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar cliente",
        variant: "destructive",
      });
    } finally {
      setCreatingClient(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingService(true);

    try {
      await createService({
        nome: serviceForm.nome,
        descricao: serviceForm.descricao,
        preco: parseFloat(serviceForm.preco),
        duracao_minutos: parseInt(serviceForm.duracao_minutos),
        categoria: serviceForm.categoria
      });

      toast({
        title: "Sucesso",
        description: "Serviço criado com sucesso",
      });

      setServiceForm({ nome: '', descricao: '', preco: '', duracao_minutos: '', categoria: '' });
      setServiceModalOpen(false);
      refetchServices();
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar serviço",
        variant: "destructive",
      });
    } finally {
      setCreatingService(false);
    }
  };

  // Carregar slots bloqueados quando a data muda
  useEffect(() => {
    if (selectedDate && salonInfo?.id) {
      loadBlockedSlots(selectedDate);
    }
  }, [selectedDate, salonInfo?.id]);

  // Definir o funcionário_id como o profissional logado
  useEffect(() => {
    if (profile?.id) {
      setForm(prev => ({ ...prev, funcionario_id: profile.id }));
    }
  }, [profile?.id]);

  if (loading) {
    return <AgendaSkeleton />;
  }

  if (!profile?.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando informações do profissional...</p>
          </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-none">
        {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-8 w-8 text-pink-500" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Minha Agenda
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus agendamentos e horários
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setFilterModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Agendamento</DialogTitle>
                <DialogDescription>
                  Crie um novo agendamento para seu cliente
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cliente</label>
                  <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={clientPopoverOpen}
                        className="w-full justify-between"
                      >
                        {form.cliente_id ? clients.find(c => c.id === form.cliente_id)?.nome : "Selecione um cliente"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar cliente..." />
                        <CommandList>
                          <CommandEmpty>
                            <div className="flex flex-col items-center gap-2 p-4">
                              <p>Nenhum cliente encontrado</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setClientPopoverOpen(false);
                                  setClientModalOpen(true);
                                }}
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Novo Cliente
                              </Button>
                            </div>
                          </CommandEmpty>
                          <CommandGroup>
                            {clients.map((client) => (
                              <CommandItem
                                key={client.id}
                                value={client.nome}
                                onSelect={() => {
                                  setForm(prev => ({ ...prev, cliente_id: client.id }));
                                  setClientPopoverOpen(false);
                                }}
                              >
                                <User className="mr-2 h-4 w-4" />
                                <div className="flex flex-col">
                                  <span>{client.nome}</span>
                                  <span className="text-xs text-muted-foreground">{client.telefone}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Serviço</label>
                  <Popover open={servicePopoverOpen} onOpenChange={setServicePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={servicePopoverOpen}
                        className="w-full justify-between"
                      >
                        {form.servico_id ? services.find(s => s.id === form.servico_id)?.nome : "Selecione um serviço"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar serviço..." />
                        <CommandList>
                          <CommandEmpty>
                            <div className="flex flex-col items-center gap-2 p-4">
                              <p>Nenhum serviço encontrado</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setServicePopoverOpen(false);
                                  setServiceModalOpen(true);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Serviço
                              </Button>
                            </div>
                          </CommandEmpty>
                          <CommandGroup>
                            {services.map((service) => (
                              <CommandItem
                                key={service.id}
                                value={service.nome}
                                onSelect={() => {
                                  setForm(prev => ({ ...prev, servico_id: service.id }));
                                  setServicePopoverOpen(false);
                                }}
                              >
                                <Scissors className="mr-2 h-4 w-4" />
                                <div className="flex flex-col">
                                  <span>{service.nome}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {service.duracao_minutos}min - R$ {service.preco.toFixed(2)}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.date ? format(new Date(form.date), "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.date ? new Date(form.date) : undefined}
                          onSelect={(date) => setForm(prev => ({ ...prev, date: date ? format(date, 'yyyy-MM-dd') : '' }))}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Horário</label>
                    <Select value={form.time} onValueChange={(value) => setForm(prev => ({ ...prev, time: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o horário" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableHours(profile.id).map((hour) => (
                          <SelectItem key={hour} value={hour}>
                            {hour}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Salvando..." : "Criar Agendamento"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <Dialog open={filterModalOpen} onOpenChange={setFilterModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtros</DialogTitle>
            <DialogDescription>
              Filtre os agendamentos por status
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setFilterModalOpen(false)}>
              Aplicar Filtros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Controles de data da agenda */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="icon" onClick={() => handleDateChange(addDays(selectedDate || new Date(), -1))} aria-label="Dia anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => handleDateChange(new Date())} className="text-xs sm:text-sm">
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => handleDateChange(addDays(selectedDate || new Date(), 1))} aria-label="Próximo dia">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start w-full sm:w-auto min-w-0">
              <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate text-xs sm:text-sm">
                {selectedDate ? format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione a data"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Mensagem quando salão não está funcionando */}
      {!currentSchedule.active && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-800">Salão Fechado</h3>
              <p className="text-sm text-amber-700">
                O salão não está funcionando neste dia. 
                {currentSchedule.open && currentSchedule.close && (
                  <span> Horário configurado: {currentSchedule.open} às {currentSchedule.close}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grade da agenda */}
      <div className="bg-card rounded-lg shadow-elegant border border-border overflow-hidden max-h-[600px] w-full max-w-none">
        {/* Cabeçalho sticky do profissional */}
        <div className="sticky top-0 z-10 grid bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 w-full" style={{ gridTemplateColumns: `160px 1fr` }}>
          {/* Célula da data */}
          <div className="p-4 border-r border-border text-left">
            <div className="text-xs text-muted-foreground leading-none">Dia</div>
            <div className="font-semibold text-foreground">
              {selectedDate ? format(selectedDate, "EEEE, dd/MM", { locale: ptBR }) : "Selecione a data"}
            </div>
            {currentSchedule.active && currentSchedule.open && currentSchedule.close && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {currentSchedule.open} - {currentSchedule.close}
              </div>
            )}
          </div>
          
          {/* Célula do profissional */}
          <div className="p-4 text-center flex flex-col items-center">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.nome || "Profissional"} 
                className="w-12 h-12 rounded-full mb-2 object-cover border-2 border-primary" 
              />
            ) : (
              <div className="w-12 h-12 rounded-full mb-2 bg-muted flex items-center justify-center text-lg font-bold border-2 border-primary text-primary">
                {profile?.nome ? profile.nome.split(' ').map(n => n[0]).join('').slice(0,2) : "P"}
              </div>
            )}
            <p className="font-bold leading-tight text-foreground">
              {profile?.nome || "Profissional"}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile?.cargo || "Profissional"}
            </p>
          </div>
        </div>

        {/* Corpo da grade */}
        <div className="relative grid overflow-y-auto w-full" style={{ gridTemplateColumns: `160px 1fr` }}>
          {allHours.length === 0 ? (
            // Mensagem quando não há horários disponíveis
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <div className="p-3 bg-muted rounded-full w-fit mx-auto mb-3">
                  <Clock className="h-6 w-6 text-primary" />
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
                {allHours.map((hour) => (
                  <div key={hour} className="flex items-center justify-center border-t border-border" style={{ height: SLOT_HEIGHT }}>
                    <span>{hour}</span>
                  </div>
                ))}
              </div>

              {/* Coluna do profissional */}
              <div className="relative">
                {allHours.map((hour) => {
                  const appointments = getAppointmentsForTime(profile.id, hour);
                  const isLocked = isSlotLocked(profile.id, hour);
                  const isHovered = hoveredSlot === `${profile.id}-${hour}`;
                  
                  return (
                    <div
                      key={hour}
                      className={`relative border-t border-border group ${isHovered ? 'bg-muted/30' : ''}`}
                      style={{ height: SLOT_HEIGHT }}
                      onMouseEnter={() => setHoveredSlot(`${profile.id}-${hour}`)}
                      onMouseLeave={() => setHoveredSlot(null)}
                    >
                      {/* Botões do centro - só aparecem quando NÃO está bloqueado */}
                      {!isLocked && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1">
                          {/* Botão de adicionar agendamento */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className={`transition-opacity duration-150 inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-sm ${
                                  dragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                                }`}
                                onClick={() => handleEmptySlotClick(profile.id, hour)}
                                aria-label={`Adicionar agendamento às ${hour}`}
                              >
                                +
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Adicionar agendamento às {hour}</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          {/* Botão de bloqueio */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className={`transition-opacity duration-150 inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-sm font-medium shadow-sm ${
                                  dragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                                }`}
                                onClick={() => handleSlotLock(profile.id, hour)}
                                aria-label={`Bloquear horário ${hour}`}
                              >
                                <Lock className="h-3 w-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Bloquear horário {hour}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}

                      {/* Agendamentos */}
                      {appointments.map((apt) => {
                        const client = clients.find(c => c.id === apt.cliente_id);
                        const service = services.find(s => s.id === apt.servico_id);
                        const top = getAppointmentPosition(apt);
                        const height = getAppointmentHeight(apt);
                        const isDraggingThis = dragging?.id === apt.id;
                        
                        return (
                          <div
                            key={apt.id}
                            className={`absolute left-1 right-1 rounded-md shadow-sm overflow-hidden hover:shadow-md border ${getCardColorByStatus(apt.status)} ${isDraggingThis ? 'z-20 ring-2 ring-primary/40 shadow-lg scale-105' : 'transition-shadow'}`}
                            style={{ 
                              top: isDraggingThis ? dragging.currentTop : top, 
                              height,
                              transform: isDraggingThis ? `translate3d(0, 0, 0)` : 'translate3d(0, 0, 0)',
                              transition: isDraggingThis ? 'none' : 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
                              pointerEvents: isDraggingThis ? 'none' : 'auto'
                            }}
                            onMouseDown={(e) => handleCardMouseDown(e, apt, profile, top)}
                            onTouchStart={(e) => handleCardTouchStart(e, apt, profile, top)}
                            onClick={() => {
                              if (!hasDragged) {
                                setSelectedApt(apt);
                                setEditForm({
                                  servico_id: apt.servico_id,
                                  status: apt.status,
                                  observacoes: apt.observacoes || ''
                                });
                                setDetailOpen(true);
                              }
                            }}
                            title={`${apt.cliente_nome || 'Cliente'} • ${apt.servico_nome || ''}`}
                          >
                            <div className={`h-1 w-full rounded-t-lg ${getStripColorByStatus(apt.status)}`} />
                            <div className="p-2 h-full flex flex-col justify-between">
                              <div>
                                <p className="font-medium text-sm truncate">
                                  {client?.nome || 'Cliente não encontrado'}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {service?.nome || 'Serviço não encontrado'}
                                </p>
                              </div>
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="text-xs">
                                  {apt.status}
                                </Badge>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(apt.data_hora), 'HH:mm')}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Slot bloqueado */}
                      {isLocked && (
                        <div className="absolute inset-0 bg-red-500/10 border border-red-500/20 rounded flex items-center justify-center group">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-red-500" />
                            <span className="text-xs text-red-600 font-medium">Bloqueado</span>
                          </div>
                          {/* Botão de desbloqueio */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="absolute right-2 top-1/2 -translate-y-1/2 transition-opacity duration-150 inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-sm font-medium shadow-sm opacity-0 group-hover:opacity-100"
                                onClick={() => handleSlotLock(profile.id, hour)}
                                aria-label={`Desbloquear horário ${hour}`}
                              >
                                <Unlock className="h-3 w-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Desbloquear horário {hour}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de Detalhes do Agendamento */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
            <DialogDescription>
              Visualize e edite os detalhes do agendamento
            </DialogDescription>
          </DialogHeader>
          
          {selectedApt && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cliente</label>
                <div className="p-3 border rounded-lg bg-muted/50">
                  <p className="font-medium">{clients.find(c => c.id === selectedApt.cliente_id)?.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {clients.find(c => c.id === selectedApt.cliente_id)?.telefone}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Serviço</label>
                <Select
                  value={editForm.servico_id || selectedApt.servico_id}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, servico_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.nome} - {service.duracao_minutos}min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={editForm.status || selectedApt.status}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Observações</label>
                <Input
                  value={editForm.observacoes || selectedApt.observacoes || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Adicione observações..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Data e Hora</p>
              <p className="text-muted-foreground">
                    {format(new Date(selectedApt.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
                <div>
                  <p className="font-medium">Duração</p>
                  <p className="text-muted-foreground">
                    {services.find(s => s.id === selectedApt.servico_id)?.duracao_minutos || 60} minutos
                  </p>
                    </div>
                    </div>
                  </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleDeleteAppointment}
              disabled={saving}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
            <Button
              onClick={handleUpdateAppointment}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Cliente */}
      <Dialog open={clientModalOpen} onOpenChange={setClientModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Adicione um novo cliente ao sistema
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateClient} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={clientForm.nome}
                onChange={(e) => setClientForm(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome completo"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={clientForm.email}
                onChange={(e) => setClientForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <InputPhone
                value={clientForm.telefone}
                onChange={(value) => setClientForm(prev => ({ ...prev, telefone: value }))}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Observações</label>
              <Input
                value={clientForm.observacoes}
                onChange={(e) => setClientForm(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações sobre o cliente"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={creatingClient}>
                {creatingClient ? "Criando..." : "Criar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Serviço */}
      <Dialog open={serviceModalOpen} onOpenChange={setServiceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Serviço</DialogTitle>
            <DialogDescription>
              Adicione um novo serviço ao sistema
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateService} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={serviceForm.nome}
                onChange={(e) => setServiceForm(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome do serviço"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Input
                value={serviceForm.descricao}
                onChange={(e) => setServiceForm(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição do serviço"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço</label>
                <Input
                  type="number"
                  step="0.01"
                  value={serviceForm.preco}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, preco: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duração (min)</label>
                <Input
                  type="number"
                  value={serviceForm.duracao_minutos}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, duracao_minutos: e.target.value }))}
                  placeholder="60"
                  required
                />
                  </div>
                </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Input
                value={serviceForm.categoria}
                onChange={(e) => setServiceForm(prev => ({ ...prev, categoria: e.target.value }))}
                placeholder="Categoria do serviço"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={creatingService}>
                {creatingService ? "Criando..." : "Criar Serviço"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
  );
};

export default ProfissionalAgenda;


