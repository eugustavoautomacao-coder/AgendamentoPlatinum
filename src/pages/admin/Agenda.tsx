import { Calendar as CalendarIcon, Clock, Users, Plus, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/layout/AdminLayout";
import { useSalonInfo } from '@/hooks/useSalonInfo';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useAppointments } from '@/hooks/useAppointments';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { useState } from 'react';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

const Agenda = () => {
  const { salonInfo } = useSalonInfo();
  const { professionals, loading: loadingProfs } = useProfessionals();
  const { appointments, loading: loadingApts, createAppointment, refetch: refetchAppointments } = useAppointments();
  const { clients } = useClients();
  const { services } = useServices();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ professional_id: '', client_id: '', service_id: '', date: '', time: '' });
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Função para obter o horário de funcionamento do dia atual
  const getTodaySchedule = () => {
    if (!salonInfo?.working_hours) return { open: '08:00', close: '18:00', active: true };
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const todayKey = days[new Date().getDay()];
    return salonInfo.working_hours[todayKey] || { open: '08:00', close: '18:00', active: true };
  };
  const todaySchedule = getTodaySchedule();
  // Gera array de horários baseado no expediente
  function generateHours(open, close) {
    const [hStart, mStart] = open.split(':').map(Number);
    const [hEnd, mEnd] = close.split(':').map(Number);
    let hours = [];
    let h = hStart, m = mStart;
    while (h < hEnd || (h === hEnd && m < mEnd)) {
      hours.push(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`);
      m += 60;
      if (m >= 60) { h += 1; m = 0; }
    }
    return hours;
  }
  const hours = todaySchedule.active ? generateHours(todaySchedule.open, todaySchedule.close) : [];

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

  const handleCreate = async () => {
    if (!form.professional_id || !form.client_id || !form.service_id || !form.date || !form.time) return;
    setSaving(true);
    const start_time = new Date(`${form.date}T${form.time}:00`).toISOString();
    await createAppointment({
      professional_id: form.professional_id,
      client_id: form.client_id,
      service_id: form.service_id,
      start_time
    });
    setSaving(false);
    setOpen(false);
    setForm({ professional_id: '', client_id: '', service_id: '', date: '', time: '' });
    refetchAppointments();
  };

  // Restaurar selects do modal para Select padrão (dropdown) para Profissional, Cliente e Serviço
  // Profissional:
  const [openProf, setOpenProf] = useState(false);
  const [openClient, setOpenClient] = useState(false);
  const [openService, setOpenService] = useState(false);

  const selectedDay = selectedDate || new Date();
  const appointmentsOfDay = appointments.filter(a => {
    const aptDate = new Date(a.start_time);
    return (
      aptDate.getFullYear() === selectedDay.getFullYear() &&
      aptDate.getMonth() === selectedDay.getMonth() &&
      aptDate.getDate() === selectedDay.getDate()
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
            <p className="text-muted-foreground">
              Gerencie todos os agendamentos do salão
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Agendamento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Agendamento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1">Profissional</label>
                    <Select value={form.professional_id} onValueChange={v => setForm(f => ({ ...f, professional_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {professionals.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Cliente</label>
                    <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Serviço</label>
                    <Select value={form.service_id} onValueChange={v => setForm(f => ({ ...f, service_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {services.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm mb-1">Data</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : <span className="text-muted-foreground">Selecione a data</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="p-0">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={date => { setSelectedDate(date); setForm(f => ({ ...f, date: date ? format(date, 'yyyy-MM-dd') : '' })); }}
                            locale={ptBR}
                            fromDate={new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm mb-1">Hora</label>
                      <Select value={form.time} onValueChange={v => setForm(f => ({ ...f, time: v }))}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {hours.map(h => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={saving || !form.professional_id || !form.client_id || !form.service_id || !form.date || !form.time}>
                    Salvar
                  </Button>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">12</div>
              <p className="text-xs text-muted-foreground">agendamentos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Esta Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">87</div>
              <p className="text-xs text-muted-foreground">agendamentos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Ocupação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">87%</div>
              <p className="text-xs text-muted-foreground">dos horários</p>
            </CardContent>
          </Card>
        </div>

        {/* Grid de agenda */}
        <div className="bg-card rounded-lg shadow-elegant overflow-x-auto">
          {/* Cabeçalho dos profissionais */}
          <div className="grid" style={{ gridTemplateColumns: `60px repeat(${professionals.length}, minmax(180px,1fr))` }}>
            <div className="p-2 border-r border-border"></div>
            {professionals.map(prof => (
              <div key={prof.id} className="p-3 text-center border-r border-border last:border-r-0 flex flex-col items-center">
                {prof.avatar_url ? (
                  <img src={prof.avatar_url} alt={prof.name} className="w-12 h-12 rounded-full mb-2 object-cover border-2 border-primary" />
                ) : (
                  <div className="w-12 h-12 rounded-full mb-2 bg-muted flex items-center justify-center text-lg font-bold border-2 border-primary text-primary">
                    {prof.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                  </div>
                )}
                <p className="font-bold text-foreground">{prof.name}</p>
                <p className="text-xs text-muted-foreground">{prof.specialties?.join(', ')}</p>
              </div>
            ))}
          </div>
          {/* Grid de horários e colunas dos profissionais */}
          <div
            className="relative grid"
            style={{
              gridTemplateColumns: `60px repeat(${professionals.length}, minmax(180px,1fr))`,
              gridAutoRows: 'minmax(48px, auto)'
            }}
          >
            {/* Coluna de horários */}
            <div className="border-r border-border text-xs text-muted-foreground">
              {hours.map(hour => (
                <div key={hour} className="h-14 flex items-start justify-center pt-1 border-t border-border">
                  <span>{hour}</span>
                </div>
              ))}
            </div>
            {/* Colunas dos profissionais */}
            {professionals.map(prof => (
              <div key={prof.id} className="relative border-r border-border last:border-r-0">
                {hours.map((hour, hourIdx) => {
                  // Encontrar agendamento para este profissional e horário
                  const apt = appointmentsOfDay.find(a => a.professional_id === prof.id && new Date(a.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) === hour);
                  return (
                    <div key={hour} className="border-t border-border relative w-full min-h-[48px]">
                      {apt && (
                        <div className="absolute inset-0 bg-card/90 border border-border rounded-lg flex flex-col justify-center px-3 py-2 min-h-[48px] max-h-full shadow-none gap-1">
                          <span className="font-semibold text-foreground text-sm break-words" title={apt.client_name || apt.client_id || 'Cliente não encontrado'} style={{ wordBreak: 'break-word' }}>
                            {apt.client_name || (apt.client_id ? `ID: ${apt.client_id}` : 'Cliente não encontrado')}
                          </span>
                          <span className="text-muted-foreground text-xs break-words" title={apt.service_name && typeof apt.service_name === 'object' ? apt.service_name.name : apt.service_name || apt.service_id || 'Serviço não encontrado'} style={{ wordBreak: 'break-word' }}>
                            {(apt.service_name && typeof apt.service_name === 'object' ? apt.service_name.name : apt.service_name) || (apt.service_id ? `ID: ${apt.service_id}` : 'Serviço não encontrado')}
                          </span>
                          <span className="mt-1 px-1.5 py-0.5 rounded bg-warning/80 text-warning-foreground text-[10px] font-medium uppercase tracking-wide w-fit" style={{ letterSpacing: 0.5 }}>
                            {apt.status}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Agenda;