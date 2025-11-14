import { Calendar as CalendarIcon, Clock, Users, Plus, Filter, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Scissors, CheckCircle, MessageSquare, Trash2, Save, X, Phone, User, UserPlus, Mail, Camera, Image, Eye, Upload, Lock, Unlock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputPhone } from "@/components/ui/input-phone";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/layout/AdminLayout";
import { useSalonInfo } from '@/hooks/useSalonInfo';
import { useProfessionals } from '@/hooks/useProfessionals';
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
import { NoProfessionalsMessage } from '@/components/NoProfessionalsMessage';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fixTimezone } from '@/utils/dateUtils';

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
  const { salonInfo, loading: salonInfoLoading } = useSalonInfo();
  const { professionals, loading: professionalsLoading } = useProfessionals();
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
  // Estados de drag removidos

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
  const agendaContainerRef = useRef<HTMLDivElement | null>(null);

  // estado de drag
  const [dragging, setDragging] = useState<{
    id: string;
    startX: number;
    startY: number;
    startColumnId: string;
    startColumnY: number;
    initialTop: number;
    currentTop: number;
    currentX: number;
    height: number;
    profId: string;
  } | null>(null);
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const [hasDragged, setHasDragged] = useState(false);
  const hasDraggedRef = useRef(false);
  const pendingClickAptRef = useRef<any | null>(null);
  const [currentDragColumn, setCurrentDragColumn] = useState<string | null>(null);
  
  // Estados para bloqueio de horários
  const [lockedSlots, setLockedSlots] = useState<Set<string>>(new Set());
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  // Função para carregar horários bloqueados do banco
  const loadBlockedSlots = async (date: Date) => {
    try {
      if (!salonInfo?.id) {
        console.warn('⚠️ loadBlockedSlots: salonInfo?.id não disponível');
        return;
      }

      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Buscar com filtro de data
      const { data, error } = await supabase
        .from('blocked_slots')
        .select('funcionario_id, hora_inicio')
        .eq('salao_id', salonInfo.id)
        .eq('data', dateStr);

      if (error) {
        console.error('❌ Erro ao buscar blocked_slots:', error);
        throw error;
      }

      // Converter para o formato do estado local
      const blockedSet = new Set<string>();
      data?.forEach(slot => {
        // Normalizar hora para HH:mm (banco retorna HH:mm:ss)
        const hora = String(slot.hora_inicio).slice(0, 5);
        const slotKey = `${slot.funcionario_id}-${hora}`;
        blockedSet.add(slotKey);
      });
      setLockedSlots(blockedSet);
    } catch (error: any) {
      // Se a tabela não existir ou houver erro de RLS, continuar sem bloqueios
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

  // Função para capitalizar a primeira letra
  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
    
    // Criar data como UTC sem conversão de timezone
    // Se o usuário escolhe 08:00, salvar como 08:00 UTC (não 11:00 UTC)
    const dateTimeStr = `${form.date}T${form.time}:00`;
    const [datePart, timePart] = dateTimeStr.split('T');
    const [hours, minutes, seconds = '00'] = timePart.split(':');
    const data_hora = new Date(Date.UTC(
      parseInt(datePart.split('-')[0]),
      parseInt(datePart.split('-')[1]) - 1,
      parseInt(datePart.split('-')[2]),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    )).toISOString();
    
    // Buscar informações do cliente para incluir no agendamento
    const cliente = clients.find(c => c.id === form.cliente_id);
    const servico = services.find(s => s.id === form.servico_id);
    
    await createAppointment({
      salao_id: salonInfo?.id,
      funcionario_id: form.funcionario_id,
      cliente_id: form.cliente_id,
      servico_id: form.servico_id,
      data_hora,
      status: 'confirmado', // Status padrão para agendamentos manuais
      // Dados diretos do cliente para compatibilidade
      cliente_nome: cliente?.nome || '',
      cliente_telefone: cliente?.telefone || '',
      cliente_email: cliente?.email || ''
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

    // Garantir que telefone tenha pelo menos um valor
    if (!clientForm.telefone || clientForm.telefone.trim() === '') {
      setClientForm(prev => ({ ...prev, telefone: 'Não informado' }));
    }

    setCreatingClient(true);
    try {
      // Gerar senha temporária (6 dígitos)
      const senhaTemporaria = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Verificar se temos o salao_id
      if (!salonInfo?.id) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Informações do salão não encontradas"
        });
        return;
      }

      // Criar cliente usando o hook useClients
      const result = await createClient({
        nome: clientForm.nome,
        email: clientForm.email,
        telefone: clientForm.telefone || 'Não informado',
        salao_id: salonInfo.id,
        senha_hash: senhaTemporaria // Em produção, isso deveria ser um hash
      } as any);
      
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
          description: `Cliente selecionado automaticamente. Senha temporária: ${senhaTemporaria}`,
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
    if (!a.data_hora) return false;
    
    // Usar fixTimezone para obter a data correta (remove Z e trata como local)
    const aptDate = fixTimezone(a.data_hora);
    const aptDateStr = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}-${String(aptDate.getDate()).padStart(2, '0')}`;
    
    // Extrair data local do dia selecionado
    const selectedDateStr = `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, '0')}-${String(selectedDay.getDate()).padStart(2, '0')}`;
    
    return aptDateStr === selectedDateStr;
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
    
    if (!hasDragged) {
      setHasDragged(true);
      hasDraggedRef.current = true;
    }
    
    requestAnimationFrame(() => {
      const agendaContainer = agendaContainerRef.current;
      if (!agendaContainer) return;

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
      
      const containerRect = agendaContainer.getBoundingClientRect();
      const mouseYInContainer = e.clientY - containerRect.top + agendaContainer.scrollTop;
      const deltaY = mouseYInContainer - dragging.startColumnY;
      
      const maxTop = (allHours.length * SLOT_HEIGHT) - dragging.height;
      const nextTop = Math.max(0, Math.min(maxTop, dragging.initialTop + deltaY));
      
      const deltaX = e.clientX - dragging.startX;
      
      setDragging({ 
        ...dragging, 
        currentTop: nextTop,
        currentX: deltaX
      });
    });
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!dragging || !e.touches[0]) return;
    e.preventDefault();
    
    if (!hasDragged) {
      setHasDragged(true);
      hasDraggedRef.current = true;
    }
    
    const touch = e.touches[0];
    requestAnimationFrame(() => {
      const agendaContainer = agendaContainerRef.current;
      if (!agendaContainer) return;

      let currentColumn = dragging.profId;
      for (const prof of professionals) {
        const el = columnRefs.current[prof.id];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (touch.clientX >= r.left && touch.clientX <= r.right) {
          currentColumn = prof.id;
          break;
        }
      }
      setCurrentDragColumn(currentColumn);
      
      const containerRect = agendaContainer.getBoundingClientRect();
      const touchYInContainer = touch.clientY - containerRect.top + agendaContainer.scrollTop;
      const deltaY = touchYInContainer - dragging.startColumnY;
      
      const maxTop = (allHours.length * SLOT_HEIGHT) - dragging.height;
      const nextTop = Math.max(0, Math.min(maxTop, dragging.initialTop + deltaY));
      
      const deltaX = touch.clientX - dragging.startX;
      
      setDragging({ 
        ...dragging, 
        currentTop: nextTop,
        currentX: deltaX
      });
    });
  };

  const onMouseUp = async (e: MouseEvent) => {
    if (!dragging) return;

    if (hasDraggedRef.current) {
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

      await handleDragEnd(targetProfId, targetProfName);
    } else {
      const timeSinceStart = Date.now() - dragStartTime;
      const apt = pendingClickAptRef.current;
      if (apt && timeSinceStart > 100) {
        setSelectedApt(apt);
        setEditForm({
          servico_id: apt.servico_id,
          status: apt.status,
          observacoes: apt.observacoes || ''
        });
        setDetailOpen(true);
      }
    }

    setDragging(null);
    setHasDragged(false);
    setDragStartTime(0);
    setCurrentDragColumn(null);
    hasDraggedRef.current = false;
    pendingClickAptRef.current = null;
  };

  const onTouchEnd = async (e: TouchEvent) => {
    if (!dragging) return;

    if (hasDragged) {
      let targetProfId = dragging.profId;
      let targetProfName = '';
      
      if (e.changedTouches[0]) {
        const touch = e.changedTouches[0];
        for (const prof of professionals) {
          const el = columnRefs.current[prof.id];
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (touch.clientX >= r.left && touch.clientX <= r.right) {
            targetProfId = prof.id;
            targetProfName = prof.nome;
            break;
          }
        }
      }

      await handleDragEnd(targetProfId, targetProfName);
    }

    setDragging(null);
    setHasDragged(false);
    setDragStartTime(0);
    setCurrentDragColumn(null);
  };

  const handleMoveAppointment = async (apt: any, direction: 'up' | 'down') => {
    try {
      console.log('handleMoveAppointment chamado:', { aptId: apt.id, direction, data_hora: apt.data_hora });
      
      const start = fixTimezone(apt.data_hora);
      console.log('Horário inicial fixado:', start);
      
      const newStart = direction === 'up' ? addMinutes(start, -60) : addMinutes(start, 60);
      console.log('Novo horário calculado:', newStart);
      
      const dateStr = format(newStart, 'yyyy-MM-dd');
      const hh = format(newStart, 'HH');
      const mm = format(newStart, 'mm');
      
      // Construir ISO manualmente para evitar conversão de timezone
      // Salvar o horário exatamente como calculado (sem converter para UTC)
      const year = newStart.getFullYear();
      const month = String(newStart.getMonth() + 1).padStart(2, '0');
      const day = String(newStart.getDate()).padStart(2, '0');
      const hour = String(newStart.getHours()).padStart(2, '0');
      const minute = String(newStart.getMinutes()).padStart(2, '0');
      const second = String(newStart.getSeconds()).padStart(2, '0');
      
      // Formato: "YYYY-MM-DDTHH:mm:ss.000Z" mas com o horário local (sem conversão)
      const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
      
      console.log('Atualizando agendamento:', { id: apt.id, iso, horario_display: `${hh}:${mm}` });

      await updateAppointment(apt.id, { data_hora: iso } as any);
      
      toast({
        title: 'Horário atualizado!',
        description: `Novo horário: ${hh}:${mm}`,
      });
      
      refetchAppointments();
    } catch (error: any) {
      console.error('Erro ao mover agendamento:', error);
      toast({
        title: 'Erro ao mover agendamento',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDragEnd = async (targetProfId: string, targetProfName: string) => {
    if (!dragging) return;

    const snappedRows = Math.round(dragging.currentTop / SLOT_HEIGHT);
    const minutesFromOpen = snappedRows * SLOT_MINUTES;
    const totalMinutes = openMinutes + minutesFromOpen;
    
    const newHour = Math.floor(totalMinutes / 60);
    const newMinute = totalMinutes % 60;
    
    const selectedDay = selectedDate || new Date();
    const year = selectedDay.getFullYear();
    const month = String(selectedDay.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDay.getDate()).padStart(2, '0');
    const hour = String(newHour).padStart(2, '0');
    const minute = String(newMinute).padStart(2, '0');
    
    // Construir ISO manualmente (mesma lógica das setas)
    const iso = `${year}-${month}-${day}T${hour}:${minute}:00.000Z`;

    try {
      await updateAppointment(dragging.id, { funcionario_id: targetProfId, data_hora: iso } as any);
      
      const originalProf = professionals.find(p => p.id === dragging.profId);
      const newTime = `${hour}:${minute}`;
      
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
  };

  const handleCardMouseDown = (e: React.MouseEvent, apt: any, prof: any, top: number) => {
    e.preventDefault();
    setDragStartTime(Date.now());
    setHasDragged(false);
    hasDraggedRef.current = false;
    pendingClickAptRef.current = apt;
    
    const container = agendaContainerRef.current;
    const containerRect = container?.getBoundingClientRect();
    const startColumnY = containerRect ? (e.clientY - containerRect.top + container.scrollTop) : e.clientY;
    
    setDragging({ 
      id: apt.id, 
      startX: e.clientX,
      startY: e.clientY,
      startColumnId: prof.id,
      startColumnY,
      initialTop: top, 
      currentTop: top,
      currentX: 0,
      height: SLOT_HEIGHT,
      profId: prof.id 
    });
  };

  const handleCardTouchStart = (e: React.TouchEvent, apt: any, prof: any, top: number) => {
    e.preventDefault();
    if (!e.touches[0]) return;
    
    const touch = e.touches[0];
    setDragStartTime(Date.now());
    setHasDragged(false);
    hasDraggedRef.current = false;
    pendingClickAptRef.current = apt;
    
    const container = agendaContainerRef.current;
    const containerRect = container?.getBoundingClientRect();
    const startColumnY = containerRect ? (touch.clientY - containerRect.top + container.scrollTop) : touch.clientY;
    
    setDragging({ 
      id: apt.id, 
      startX: touch.clientX,
      startY: touch.clientY,
      startColumnId: prof.id,
      startColumnY,
      initialTop: top, 
      currentTop: top,
      currentX: 0,
      height: SLOT_HEIGHT,
      profId: prof.id 
    });
    
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleCardClick = (apt: any) => {
    const timeSinceStart = Date.now() - dragStartTime;
    if (!hasDraggedRef.current && timeSinceStart > 100) {
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
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
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

  // Limpar horário selecionado se estiver bloqueado quando mudar o profissional
  useEffect(() => {
    if (form.funcionario_id && form.time) {
      const availableHours = getAvailableHours(form.funcionario_id);
      if (!availableHours.includes(form.time)) {
        setForm(prev => ({ ...prev, time: '' }));
      }
    }
  }, [form.funcionario_id, lockedSlots]);

  const handleEmptySlotClick = (profId: string, hour: string) => {
    // Verificar se o horário não está bloqueado
    if (isSlotLocked(profId, hour)) {
      toast({
        title: "Horário bloqueado",
        description: `O horário ${hour} está bloqueado para agendamentos`,
        variant: "destructive"
      });
      return;
    }
    
    const dateStr = format(selectedDay, 'yyyy-MM-dd');
    setForm(prev => ({
      ...prev,
      funcionario_id: profId,
      date: dateStr,
      time: hour
    }));
    setOpen(true);
  };
  
  const handleSlotLock = async (profId: string, hour: string) => {
    const slotKey = `${profId}-${hour}`;
    const isCurrentlyLocked = lockedSlots.has(slotKey);
    
    
    try {
      if (isCurrentlyLocked) {
        // Desbloquear horário - remover do banco
        // Atualizar estado imediatamente (otimista)
        setLockedSlots(prev => {
          const newSet = new Set(prev);
          newSet.delete(slotKey);
          return newSet;
        });
        
        const { error } = await supabase
          .from('blocked_slots')
          .delete()
          .eq('funcionario_id', profId)
          .eq('data', format(selectedDate || new Date(), 'yyyy-MM-dd'))
          .eq('hora_inicio', hour);

        if (error) {
          // Se der erro, reverter o estado
          setLockedSlots(prev => {
            const newSet = new Set(prev);
            newSet.add(slotKey);
            return newSet;
          });
          throw error;
        }

        toast({
          title: "Horário desbloqueado",
          description: `O horário ${hour} foi liberado para agendamentos`
        });
      } else {
        // Bloquear horário - inserir no banco
        const endHour = addMinutes(new Date(`2000-01-01T${hour}:00`), SLOT_MINUTES).toTimeString().slice(0, 5);
        
        // Atualizar estado imediatamente (otimista)
        setLockedSlots(prev => {
          const newSet = new Set(prev);
          newSet.add(slotKey);
          return newSet;
        });
        
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

        if (error) {
          // Se der erro, reverter o estado
          setLockedSlots(prev => {
            const newSet = new Set(prev);
            newSet.delete(slotKey);
            return newSet;
          });
          throw error;
        }

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

  // Detectar parâmetro modal=new na URL e abrir modal automaticamente
  useEffect(() => {
    const modalParam = searchParams.get('modal');
    if (modalParam === 'new') {
      setOpen(true);
      // Limpar o parâmetro da URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Detectar parâmetro appointment na URL e abrir modal de detalhes
  useEffect(() => {
    const appointmentId = searchParams.get('appointment');
    if (appointmentId && appointments && Array.isArray(appointments)) {
      // Encontrar o agendamento específico
      const appointment = (appointments as any[]).find((apt: any) => apt.id === appointmentId);
      if (appointment) {
        // Definir a data do agendamento
        setSelectedDate(fixTimezone(appointment.data_hora));
        // Inicializar o formulário de edição com os dados do agendamento
        setEditForm({ 
          servico_id: appointment.servico_id, 
          status: appointment.status, 
          observacoes: appointment.observacoes || '' 
        });
        // Abrir modal de detalhes
        setSelectedApt(appointment);
        setDetailOpen(true);
        // Limpar o parâmetro da URL
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, setSearchParams, appointments]);

  // Resetar índice de profissionais quando mudar de data
  useEffect(() => {
    setCurrentProfIndex(0);
  }, [selectedDate]);

  // Carregar horários bloqueados quando mudar de data
  useEffect(() => {
    console.log('🔄 useEffect loadBlockedSlots executado:', { 
      selectedDate, 
      salonInfoId: salonInfo?.id,
      salonInfoLoading,
      hasSelectedDate: !!selectedDate,
      hasSalonInfo: !!salonInfo?.id,
      isReady: !salonInfoLoading && !!selectedDate && !!salonInfo?.id
    });
    
    // Aguardar o salonInfo terminar de carregar antes de tentar carregar os slots bloqueados
    if (!salonInfoLoading && selectedDate && salonInfo?.id) {
      console.log('✅ Chamando loadBlockedSlots...');
      loadBlockedSlots(selectedDate);
    } else {
      console.warn('⚠️ loadBlockedSlots não chamado:', {
        salonInfoLoading,
        missingSelectedDate: !selectedDate,
        missingSalonInfo: !salonInfo?.id
      });
    }
  }, [selectedDate, salonInfo?.id, salonInfoLoading]);

  // Resetar índice de profissionais quando o filtro de profissional mudar
  useEffect(() => {
    setCurrentProfIndex(0);
  }, [selectedProfessionalFilter]);

  // Função para fazer upload de fotos do processo
  const uploadProcessPhoto = async (file: File, appointmentId: string, phase: 'antes' | 'durante' | 'depois'): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${appointmentId}-${phase}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('process-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('process-photos')
        .getPublicUrl(fileName);

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

  // Verificar se não há profissionais cadastrados
  if (professionals.length === 0) {
    return (
      <AdminLayout>
        <NoProfessionalsMessage />
      </AdminLayout>
    );
  }

  // Verificar se o salão está funcionando no dia selecionado
  const isSalonOpen = currentSchedule.active;

  return (
    <TooltipProvider delayDuration={1000}>
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
              <p className="text-muted-foreground">Gerencie todos os agendamentos do salão</p>
            </div>
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
              <DialogPortal>
                <DialogOverlay className="z-[9998]" />
                <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-[9999] w-[95vw] max-w-lg translate-x-[-50%] translate-y-[-50%] bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg">
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
                    <label className="block text-sm mb-1 flex items-center gap-2 mt-4">
                      <Users className="h-4 w-4 text-primary" />
                      Profissional
                    </label>
                    <Select value={form.funcionario_id} onValueChange={v => setForm(f => ({ ...f, funcionario_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="z-[10001]">
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
                           <Button type="button" variant="outline" className="flex-1 justify-between">
                             {form.cliente_id ? (clients.find(c => c.id === form.cliente_id)?.nome || 'Selecione') : 'Selecione'}
                             <ChevronDown className="h-4 w-4 opacity-50" />
                           </Button>
                         </PopoverTrigger>
                         <PopoverContent className="z-[10001] p-0 w-[--radix-popover-trigger-width]">
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
                           <Button type="button" variant="outline" className="flex-1 justify-between">
                             {form.servico_id ? (services.find(s => s.id === form.servico_id)?.nome || 'Selecione') : 'Selecione'}
                             <ChevronDown className="h-4 w-4 opacity-50" />
                           </Button>
                         </PopoverTrigger>
                         <PopoverContent className="z-[10001] p-0 w-[--radix-popover-trigger-width]">
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
                        <PopoverContent align="start" className="z-[10001] p-0">
                          <Calendar mode="single" selected={selectedDate} onSelect={date => { setSelectedDate(date || new Date()); setForm(f => ({ ...f, date: date ? format(date, 'yyyy-MM-dd') : '' })); }} locale={ptBR} fromDate={new Date()} />
                        </PopoverContent>
                      </Popover>
                    </div>
                                         <div className="flex-1" >
                       <label className="block text-sm mb-1 flex items-center gap-2">
                         <Clock className="h-4 w-4 text-primary" />
                         Hora
                       </label>
                      <Select value={form.time} onValueChange={v => setForm(f => ({ ...f, time: v }))}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                         <SelectContent className="z-[10001]">
                           {form.funcionario_id ? (
                             getAvailableHours(form.funcionario_id).map(h => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                             ))
                           ) : (
                             allHours.map(h => (
                               <SelectItem key={h} value={h}>{h}</SelectItem>
                             ))
                           )}
                        </SelectContent>
                      </Select>
                       {form.funcionario_id && getAvailableHours(form.funcionario_id).length === 0 && (
                         <p className="text-xs text-muted-foreground mt-1">
                           Nenhum horário disponível para este profissional
                         </p>
                       )}
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
                        <InputPhone 
                          id="client-telefone" 
                          value={clientForm.telefone} 
                          onChange={(formattedValue, rawValue) => setClientForm({ ...clientForm, telefone: rawValue })} 
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
                </DialogPrimitive.Content>
              </DialogPortal>
            </Dialog>
          </div>
        </div>

        {/* Controles de data da agenda */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="icon" onClick={goPrevDay} aria-label="Dia anterior"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" onClick={goToday} className="text-xs sm:text-sm">Hoje</Button>
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
                <span className="text-xs sm:text-sm text-muted-foreground">
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
              <Button variant="outline" className="justify-start w-full sm:w-auto min-w-0">
                <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate text-xs sm:text-sm">
                {capitalizeFirstLetter(format(selectedDay, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }))}
                </span>
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
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800">Salão Fechado</h3>
                <p className="text-sm text-amber-700">
                  O salão não está funcionando na {capitalizeFirstLetter(format(selectedDay, "EEEE, dd/MM", { locale: ptBR }))}. 
                  {currentSchedule.open && currentSchedule.close && (
                    <span> Horário configurado: {currentSchedule.open} às {currentSchedule.close}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grade da agenda */}
        <div 
          ref={agendaContainerRef}
          className="bg-card rounded-lg shadow-elegant overflow-y-auto max-h-[600px] border border-border agenda-scrollbar"
        >
          {/* Cabeçalho sticky dos profissionais */}
          <div className="sticky top-0 z-10 grid bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75" style={{ gridTemplateColumns: `160px repeat(${visibleProfessionals.length}, minmax(200px,1fr))` }}>
            {/* Célula da data */}
            <div className="p-4 border-r border-border text-left">
              <div className="text-xs text-muted-foreground leading-none">Dia</div>
              <div className="font-semibold text-foreground">{capitalizeFirstLetter(format(selectedDay, "EEEE, dd/MM", { locale: ptBR }))}</div>
              {isSalonOpen && currentSchedule.open && currentSchedule.close && (
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {currentSchedule.open} - {currentSchedule.close}
                </div>
              )}
            </div>
            {visibleProfessionals.map(prof => {
              const isDragTarget = dragging && currentDragColumn === prof.id && currentDragColumn !== dragging.profId;
              const isDragSource = dragging && dragging.profId === prof.id;
              
              return (
                <div 
                  key={prof.id} 
                  className={`p-4 text-center border-r border-border last:border-r-0 flex flex-col items-center transition-all duration-200 ${
                    isDragTarget 
                      ? 'bg-primary/10 border-primary/60 shadow-inner' 
                      : isDragSource 
                        ? 'bg-muted/30 border-muted-foreground/30' 
                        : ''
                  }`}
                >
                  {prof.avatar_url ? (
                    <img 
                      src={prof.avatar_url} 
                      alt={prof.nome} 
                      className={`w-12 h-12 rounded-full mb-2 object-cover border-2 transition-all duration-200 ${
                        isDragTarget 
                          ? 'border-primary shadow-lg' 
                          : isDragSource 
                            ? 'border-muted-foreground/50' 
                            : 'border-primary'
                      }`} 
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full mb-2 bg-muted flex items-center justify-center text-lg font-bold border-2 transition-all duration-200 ${
                      isDragTarget 
                        ? 'border-primary shadow-lg text-primary' 
                        : isDragSource 
                          ? 'border-muted-foreground/50 text-muted-foreground' 
                          : 'border-primary text-primary'
                    }`}>
                      {prof.nome.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                  )}
                  <p className={`font-bold leading-tight transition-colors duration-200 ${
                    isDragTarget ? 'text-primary' : 'text-foreground'
                  }`}>{prof.nome}</p>
                  <p className="text-xs text-muted-foreground">{prof.cargo || 'Profissional'}</p>
                </div>
              );
            })}
          </div>

                     {/* Corpo da grade */}
           <div ref={gridRef} className="relative grid" style={{ gridTemplateColumns: `160px repeat(${visibleProfessionals.length}, minmax(200px,1fr))` }}>
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

            {/* Colunas dos profissionais */}
            {visibleProfessionals.map(prof => {
              const profAppointments = appointmentsOfDay.filter(a => a.funcionario_id === prof.id);
              const isDragTarget = dragging && currentDragColumn === prof.id && currentDragColumn !== dragging.profId;
              const isDragSource = dragging && dragging.profId === prof.id;
                  return (
                <div 
                  key={prof.id} 
                  ref={(el) => (columnRefs.current[prof.id] = el)} 
                  className={`relative border-l border-border transition-all duration-200 ${
                    isDragTarget 
                      ? 'bg-primary/10 border-primary/60 shadow-inner' 
                      : isDragSource 
                        ? 'bg-muted/30 border-muted-foreground/30' 
                        : ''
                  }`} 
                   style={{ height: allHours.length * SLOT_HEIGHT }}
                >
                  {/* Linhas de hora de fundo */}
                  {allHours.map((h, i) => (
                    <div key={h} className="absolute left-0 right-0 border-t border-border" style={{ top: i * SLOT_HEIGHT }} />
                  ))}

                  {/* Slots vazios clicáveis */}
                  {allHours.map((h, i) => {
                    const topPos = i * SLOT_HEIGHT;
                    const slotKey = `${prof.id}-${h}`;
                    const isLocked = isSlotLocked(prof.id, h);
                    const isHovered = hoveredSlot === slotKey;
                    
                    return (
                      <div
                        key={`slot-${prof.id}-${h}`}
                        className={`group absolute left-1 right-1 rounded-md border border-transparent transition-colors ${
                          isLocked 
                            ? 'bg-muted/50 border-muted-foreground/30' 
                            : dragging 
                              ? 'pointer-events-none' 
                              : 'hover:border-border/60 hover:bg-primary/5'
                        }`}
                        style={{ top: topPos, height: SLOT_HEIGHT }}
                        onMouseEnter={() => setHoveredSlot(slotKey)}
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
                                    onClick={() => handleEmptySlotClick(prof.id, h)}
                                    aria-label={`Adicionar agendamento às ${h} com ${prof.nome}`}
                                  >
                                    +
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Adicionar agendamento às {h}</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              {/* Botão de bloqueio */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className={`transition-opacity duration-150 inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground shadow-sm hover:scale-110 transition-all duration-200 ${
                                      isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                    }`}
                                    onClick={() => handleSlotLock(prof.id, h)}
                                    aria-label={`Bloquear horário ${h}`}
                                  >
                                    <Unlock className="h-3 w-3 group-hover:animate-[wiggle_0.3s_ease-in-out]" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Bloquear horário {h}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                         )}
                         
                         {/* Botão de desbloqueio adicional quando bloqueado - no canto superior direito */}
                         {isLocked && (
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <button
                                 type="button"
                                 className="absolute top-2 right-2 transition-opacity duration-150 inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-amber-foreground shadow-sm hover:scale-110 transition-all duration-200 opacity-100"
                                 onClick={() => handleSlotLock(prof.id, h)}
                                 aria-label={`Desbloquear horário ${h}`}
                               >
                                 <Lock className="h-3 w-3 hover:animate-[wiggle_0.3s_ease-in-out]" />
                               </button>
                             </TooltipTrigger>
                             <TooltipContent>
                               <p>Desbloquear horário {h}</p>
                             </TooltipContent>
                           </Tooltip>
                         )}
                        
                        {/* Indicador visual de bloqueio */}
                        {isLocked && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-muted/80 text-muted-foreground text-xs font-medium px-2 py-1 rounded">
                              BLOQUEADO
                            </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                  {/* Agendamentos posicionados por horário e duração */}
                  {profAppointments.map(apt => {
                    // Usar fixTimezone para garantir que o horário seja lido corretamente (especialmente para agendamentos da API)
                    const start = fixTimezone(apt.data_hora);
                    const startMinutes = start.getHours() * 60 + start.getMinutes();
                    const minutesFromOpen = Math.max(0, startMinutes - openMinutes);
                    const top = (minutesFromOpen / SLOT_MINUTES) * SLOT_HEIGHT;
                    // Sempre ocupar exatamente 1 bloco do grid, independente da duração do serviço
                    const duration = Math.max(30, (apt.servico_duracao || 60));
                    const height = SLOT_HEIGHT;

                    const isDragging = dragging?.id === apt.id;
                    const topStyle = isDragging ? dragging.currentTop : top;
                    const leftStyle = isDragging ? dragging.currentX : 0;

                    const end = addMinutes(start, apt.servico_duracao || 60);
                    const timeRange = `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;

                  return (
                      <div
                        key={apt.id}
                        className={`group absolute left-1 right-1 rounded-md shadow-sm overflow-hidden hover:shadow-md border ${getCardColorByStatus(apt.status)} ${isDragging ? 'z-20 ring-2 ring-primary/40 shadow-lg scale-105' : 'transition-shadow'}`}
                        style={{ 
                          top: topStyle, 
                          height,
                          transform: isDragging ? `translate3d(${leftStyle}px, 0, 0)` : 'translate3d(0, 0, 0)',
                          transition: isDragging ? 'none' : 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
                          pointerEvents: isDragging ? 'none' : 'auto'
                        }}
                        onMouseDown={(e) => handleCardMouseDown(e, apt, prof, top)}
                        onTouchStart={(e) => handleCardTouchStart(e, apt, prof, top)}
                        onClick={() => handleCardClick(apt)}
                        title={`${apt.cliente_nome || 'Cliente'} • ${apt.servico_nome || ''}`}
                      >
                      <div 
                        className={`px-3 py-2 text-left select-none relative h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab active:cursor-grabbing'}`}
                        style={{
                          willChange: isDragging ? 'transform' : 'auto'
                        }}
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStripColorByStatus(apt.status)}`} />
                        
                        {/* Botões de seta - pequenos e sutis no centro */}
                        <div 
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-row gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50"
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Movendo para cima:', apt.cliente_nome);
                              handleMoveAppointment(apt, 'up');
                            }}
                            className="w-6 h-6 rounded-full bg-background/80 hover:bg-background border border-border/50 flex items-center justify-center shadow-sm transition-colors backdrop-blur-sm"
                            title="Mover para cima (1 hora)"
                          >
                            <ChevronUp className="w-3.5 h-3.5 text-foreground" />
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Movendo para baixo:', apt.cliente_nome);
                              handleMoveAppointment(apt, 'down');
                            }}
                            className="w-6 h-6 rounded-full bg-background/80 hover:bg-background border border-border/50 flex items-center justify-center shadow-sm transition-colors backdrop-blur-sm"
                            title="Mover para baixo (1 hora)"
                          >
                            <ChevronDown className="w-3.5 h-3.5 text-foreground" />
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedApt(apt);
                              setEditForm({
                                servico_id: apt.servico_id,
                                status: apt.status,
                                observacoes: apt.observacoes || ''
                              });
                              setDetailOpen(true);
                            }}
                            className="bg-primary/10 hover:bg-primary/20 active:bg-primary/30 rounded-full p-1.5 cursor-pointer transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="h-3 w-3 text-primary" />
                          </button>
                        </div>
                        
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
            <span className="inline-block w-3 h-3 rounded-full bg-primary"></span>
            <span>Cancelado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-sky-500"></span>
            <span>Concluído</span>
          </div>
        </div>

        {/* Modal de detalhes/edição */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogPortal>
            <DialogOverlay className="z-[9998]" />
            <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-[9999] w-[95vw] sm:max-w-[500px] max-h-[90vh] translate-x-[-50%] translate-y-[-50%] bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg overflow-y-auto">
            <DialogHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-lg font-semibold">Detalhes do Agendamento</DialogTitle>
                    <p className="text-xs text-muted-foreground">
                      {selectedApt && capitalizeFirstLetter(format(fixTimezone(selectedApt.data_hora), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR }))}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
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
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Fotos
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
                         {selectedApt && (
               <div className="space-y-4">
                 {/* Informações do Agendamento */}
                 <div className="bg-muted/30 rounded-lg p-3 space-y-3 mt-4">
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
                        <SelectContent className="z-[10001]" position="popper" side="bottom" align="start">
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
                        <SelectContent className="z-[10001] max-h-[200px] overflow-y-auto" position="popper" side="bottom" align="start">
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
            <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-border">
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={async () => {
                  if (!selectedApt) return;
                  await deleteAppointment(selectedApt.id);
                  setDetailOpen(false);
                }}
                className="flex items-center gap-1 w-full sm:w-auto order-3 sm:order-1"
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
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDetailOpen(false)} 
                  disabled={isUpdating}
                  className="w-full sm:w-auto"
                >
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
                  className="w-full sm:w-auto"
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
            </DialogPrimitive.Content>
          </DialogPortal>
        </Dialog>

        {/* Modal de Fotos do Processo */}
        <Dialog open={photosModalOpen} onOpenChange={setPhotosModalOpen}>
          <DialogPortal>
            <DialogOverlay className="z-[9998]" />
            <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-[9999] w-[95vw] max-w-[800px] max-h-[90vh] translate-x-[-50%] translate-y-[-50%] bg-background p-4 sm:p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg overflow-y-auto">
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
            </DialogPrimitive.Content>
          </DialogPortal>
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
            <DialogOverlay className="z-[9998]" />
            <DialogPrimitive.Content
              className="fixed left-[50%] top-[50%] z-[9999] w-[95vw] h-[90vh] max-w-6xl translate-x-[-50%] translate-y-[-50%] bg-black/95 p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg"
            >
              <DialogPrimitive.Title className="sr-only">
                Visualização Expandida da Foto
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                Visualização em tela cheia da foto do processo
              </DialogPrimitive.Description>
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
    </TooltipProvider>
  );
};

export default Agenda;