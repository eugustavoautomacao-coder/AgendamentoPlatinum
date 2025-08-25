import { Settings, Save, Building, Clock, DollarSign, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import AdminLayout from "@/components/layout/AdminLayout";
import { useSalonInfo } from '@/hooks/useSalonInfo';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const defaultSchedule = [
  { day: 'Segunda-feira', key: 'monday', open: '08:00', close: '18:00', active: true },
  { day: 'Terça-feira', key: 'tuesday', open: '08:00', close: '18:00', active: true },
  { day: 'Quarta-feira', key: 'wednesday', open: '08:00', close: '18:00', active: true },
  { day: 'Quinta-feira', key: 'thursday', open: '08:00', close: '18:00', active: true },
  { day: 'Sexta-feira', key: 'friday', open: '08:00', close: '19:00', active: true },
  { day: 'Sábado', key: 'saturday', open: '08:00', close: '17:00', active: true },
  { day: 'Domingo', key: 'sunday', open: '09:00', close: '15:00', active: false },
];

const Configuracoes = () => {
  const { salonInfo, loading, refetchSalonInfo } = useSalonInfo();
  const { toast } = useToast();
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [saving, setSaving] = useState(false);
  // Estados para os campos do salão
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Preencher com valor salvo ao abrir
  useEffect(() => {
    if (salonInfo) {
      setName(salonInfo.name || '');
      setAddress(salonInfo.address || '');
      setPhone(salonInfo.phone || '');
      setEmail(salonInfo.email || '');
    }
    if (salonInfo?.working_hours) {
      const wh = salonInfo.working_hours;
      setSchedule(defaultSchedule.map((d) => ({
        ...d,
        ...wh[d.key],
        open: wh[d.key]?.open || d.open,
        close: wh[d.key]?.close || d.close,
        active: wh[d.key]?.active ?? d.active
      })));
    }
  }, [salonInfo]);

  const handleScheduleChange = (idx, field, value) => {
    setSchedule((prev) => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const handleSave = async () => {
    if (!salonInfo?.id) return;
    setSaving(true);
    // Montar objeto working_hours
    const working_hours = {};
    schedule.forEach((d) => {
      working_hours[d.key] = { open: d.open, close: d.close, active: d.active };
    });
    const { error } = await supabase.from('salons').update({
      name,
      address,
      phone,
      email,
      working_hours
    }).eq('id', salonInfo.id);
    setSaving(false);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar as alterações.'
      });
    } else {
      toast({
        title: 'Alterações salvas',
        description: 'As informações do salão foram atualizadas com sucesso.'
      });
      if (refetchSalonInfo) {
        await refetchSalonInfo();
        // Atualizar os campos do formulário com os valores reais do banco
        if (salonInfo) {
          setName(salonInfo.name || '');
          setAddress(salonInfo.address || '');
          setPhone(salonInfo.phone || '');
          setEmail(salonInfo.email || '');
        }
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground">
              Gerencie as configurações do seu salão
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Informações do Salão */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Informações do Salão
              </CardTitle>
              <CardDescription>
                Dados básicos do estabelecimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="salon-name">Nome do Salão</Label>
                <Input
                  id="salon-name"
                  placeholder="Beauty Salon"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salon-address">Endereço</Label>
                <Textarea
                  id="salon-address"
                  placeholder="Endereço completo do salão"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="salon-phone">Telefone</Label>
                  <Input
                    id="salon-phone"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salon-email">E-mail</Label>
                  <Input
                    id="salon-email"
                    type="email"
                    placeholder="contato@salao.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Horário de Funcionamento */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Horário de Funcionamento
              </CardTitle>
              <CardDescription>
                Configure os horários de atendimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {schedule.map((schedule, idx) => (
                <div key={schedule.day} className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id={schedule.day} checked={schedule.active} onCheckedChange={v => handleScheduleChange(idx, 'active', v)} />
                    <Label htmlFor={schedule.day} className="min-w-[100px] text-sm">
                      {schedule.day}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={schedule.open}
                      className="w-24"
                      disabled={!schedule.active}
                      onChange={e => handleScheduleChange(idx, 'open', e.target.value)}
                    />
                    <span className="text-muted-foreground">às</span>
                    <Input
                      type="time"
                      value={schedule.close}
                      className="w-24"
                      disabled={!schedule.active}
                      onChange={e => handleScheduleChange(idx, 'close', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Configurações Financeiras */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Configurações Financeiras
            </CardTitle>
            <CardDescription>
              Taxas e configurações de preços
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="tax-machine">Taxa de Máquina (%)</Label>
                <Input
                  id="tax-machine"
                  type="number"
                  placeholder="5"
                  defaultValue="5"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground">
                  Taxa aplicada sobre equipamentos utilizados
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax-product">Taxa de Produto (%)</Label>
                <Input
                  id="tax-product"
                  type="number"
                  placeholder="8"
                  defaultValue="8"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground">
                  Taxa aplicada sobre produtos utilizados
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax-taxes">Taxa de Impostos (%)</Label>
                <Input
                  id="tax-taxes"
                  type="number"
                  placeholder="12"
                  defaultValue="12"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground">
                  Impostos e tributos aplicados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure as notificações automáticas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Confirmação de Agendamentos</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar confirmação automática por e-mail
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Lembrete de Agendamentos</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar lembrete 24h antes do agendamento
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Relatórios Semanais</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber relatório semanal por e-mail
                  </p>
                </div>
                <Switch />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações de Cancelamento</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar sobre cancelamentos de clientes
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Configuracoes;