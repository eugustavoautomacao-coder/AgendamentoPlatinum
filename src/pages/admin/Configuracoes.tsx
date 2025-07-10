import { Settings, Save, Building, Clock, DollarSign, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import AdminLayout from "@/components/layout/AdminLayout";

const Configuracoes = () => {
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
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
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
                  defaultValue="Beauty Salon Luxo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salon-address">Endereço</Label>
                <Textarea
                  id="salon-address"
                  placeholder="Endereço completo do salão"
                  defaultValue="Rua das Flores, 123 - Centro, São Paulo - SP"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="salon-phone">Telefone</Label>
                  <Input
                    id="salon-phone"
                    placeholder="(11) 99999-9999"
                    defaultValue="(11) 3456-7890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salon-email">E-mail</Label>
                  <Input
                    id="salon-email"
                    type="email"
                    placeholder="contato@salao.com"
                    defaultValue="contato@beautysalonluxo.com"
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
              {[
                { day: "Segunda-feira", open: "08:00", close: "18:00", active: true },
                { day: "Terça-feira", open: "08:00", close: "18:00", active: true },
                { day: "Quarta-feira", open: "08:00", close: "18:00", active: true },
                { day: "Quinta-feira", open: "08:00", close: "18:00", active: true },
                { day: "Sexta-feira", open: "08:00", close: "19:00", active: true },
                { day: "Sábado", open: "08:00", close: "17:00", active: true },
                { day: "Domingo", open: "09:00", close: "15:00", active: false }
              ].map((schedule) => (
                <div key={schedule.day} className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id={schedule.day} defaultChecked={schedule.active} />
                    <Label htmlFor={schedule.day} className="min-w-[100px] text-sm">
                      {schedule.day}
                    </Label>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      defaultValue={schedule.open}
                      className="w-24"
                      disabled={!schedule.active}
                    />
                    <span className="text-muted-foreground">às</span>
                    <Input
                      type="time"
                      defaultValue={schedule.close}
                      className="w-24"
                      disabled={!schedule.active}
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

        {/* Zona de Perigo */}
        <Card className="shadow-elegant border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            <CardDescription>
              Ações irreversíveis - use com cautela
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg border border-destructive/20">
              <div>
                <h4 className="font-medium text-destructive">Resetar Configurações</h4>
                <p className="text-sm text-muted-foreground">
                  Volta todas as configurações para o padrão
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Resetar
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg border border-destructive/20">
              <div>
                <h4 className="font-medium text-destructive">Excluir Conta</h4>
                <p className="text-sm text-muted-foreground">
                  Remove permanentemente todos os dados do salão
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Excluir Conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Configuracoes;