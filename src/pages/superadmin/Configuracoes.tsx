import { useState } from "react";
import { Save, Mail, Shield, Database, Globe, Bell } from "lucide-react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const Configuracoes = () => {
  const { toast } = useToast();
  
  // System settings
  const [systemSettings, setSystemSettings] = useState({
    siteName: "Beauty Manager",
    siteUrl: "https://beautymanager.com",
    supportEmail: "suporte@beautymanager.com",
    maxSalonsPerAdmin: 5,
    maintenanceMode: false,
    allowRegistration: true
  });

  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    fromName: "Beauty Manager",
    fromEmail: "noreply@beautymanager.com"
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 24,
    passwordMinLength: 8,
    requireTwoFactor: false,
    allowApiAccess: true,
    ipWhitelist: ""
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNewSalon: true,
    emailFailedPayment: true,
    emailSystemAlerts: true,
    slackWebhook: "",
    discordWebhook: ""
  });

  const handleSaveSettings = (section: string) => {
    toast({
      title: "Configurações salvas",
      description: `Configurações de ${section} foram atualizadas com sucesso.`
    });
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6 w-full max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-pink-500 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">Configurações</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                Configurações gerais do sistema
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="system" className="space-y-4 w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-1 h-auto">
            <TabsTrigger value="system" className="text-xs sm:text-sm">Sistema</TabsTrigger>
            <TabsTrigger value="email" className="text-xs sm:text-sm">E-mail</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs sm:text-sm">Notificações</TabsTrigger>
            <TabsTrigger value="database" className="text-xs sm:text-sm">Banco de Dados</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5" />
                  Configurações do Sistema
                </CardTitle>
                <CardDescription>
                  Configurações gerais da aplicação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 w-full">
                  <div className="space-y-2">
                    <Label htmlFor="siteName" className="text-xs sm:text-sm">Nome do Sistema</Label>
                    <Input
                      id="siteName"
                      value={systemSettings.siteName}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, siteName: e.target.value }))}
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteUrl" className="text-xs sm:text-sm">URL do Sistema</Label>
                    <Input
                      id="siteUrl"
                      value={systemSettings.siteUrl}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, siteUrl: e.target.value }))}
                      className="text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 w-full">
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail" className="text-xs sm:text-sm">E-mail de Suporte</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={systemSettings.supportEmail}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxSalons" className="text-xs sm:text-sm">Máx. Salões por Admin</Label>
                    <Input
                      id="maxSalons"
                      type="number"
                      value={systemSettings.maxSalonsPerAdmin}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, maxSalonsPerAdmin: parseInt(e.target.value) }))}
                      className="text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <Label className="text-xs sm:text-sm">Modo de Manutenção</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Bloqueia o acesso ao sistema para manutenção
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                      className="flex-shrink-0"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <Label className="text-xs sm:text-sm">Permitir Registro</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Permite que novos usuários se registrem
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.allowRegistration}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, allowRegistration: checked }))}
                      className="flex-shrink-0"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSaveSettings("sistema")} className="text-xs sm:text-sm px-3 py-2">
                    <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Salvar Configurações</span>
                    <span className="sm:hidden">Salvar</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Mail className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">Configurações de E-mail</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Configure o servidor SMTP para envio de e-mails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 w-full">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost" className="text-xs sm:text-sm">Servidor SMTP</Label>
                    <Input
                      id="smtpHost"
                      value={emailSettings.smtpHost}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                      placeholder="smtp.gmail.com"
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort" className="text-xs sm:text-sm">Porta</Label>
                    <Input
                      id="smtpPort"
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                      placeholder="587"
                      className="text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 w-full">
                  <div className="space-y-2">
                    <Label htmlFor="smtpUser" className="text-xs sm:text-sm">Usuário SMTP</Label>
                    <Input
                      id="smtpUser"
                      value={emailSettings.smtpUser}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                      placeholder="usuario@gmail.com"
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword" className="text-xs sm:text-sm">Senha SMTP</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={emailSettings.smtpPassword}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                      placeholder="••••••••"
                      className="text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 w-full">
                  <div className="space-y-2">
                    <Label htmlFor="fromName" className="text-xs sm:text-sm">Nome do Remetente</Label>
                    <Input
                      id="fromName"
                      value={emailSettings.fromName}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, fromName: e.target.value }))}
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail" className="text-xs sm:text-sm">E-mail do Remetente</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                      className="text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button variant="outline" className="text-xs sm:text-sm px-3 py-2">
                    <span className="hidden sm:inline">Testar Conexão</span>
                    <span className="sm:hidden">Testar</span>
                  </Button>
                  <Button onClick={() => handleSaveSettings("e-mail")} className="text-xs sm:text-sm px-3 py-2">
                    <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Salvar Configurações</span>
                    <span className="sm:hidden">Salvar</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="notifications" className="space-y-4">
            <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Bell className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">Configurações de Notificações</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Configure notificações e integrações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-medium">Notificações por E-mail</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <Label className="text-xs sm:text-sm">Novo Salão Cadastrado</Label>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Notifica quando um novo salão é cadastrado
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailNewSalon}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNewSalon: checked }))}
                        className="flex-shrink-0"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <Label className="text-xs sm:text-sm">Falha no Pagamento</Label>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Notifica quando há falha em pagamentos
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailFailedPayment}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailFailedPayment: checked }))}
                        className="flex-shrink-0"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <Label className="text-xs sm:text-sm">Alertas do Sistema</Label>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Notifica sobre problemas técnicos
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailSystemAlerts}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailSystemAlerts: checked }))}
                        className="flex-shrink-0"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-medium">Integrações</h3>
                  
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 w-full">
                    <div className="space-y-2">
                      <Label htmlFor="slackWebhook" className="text-xs sm:text-sm">Webhook do Slack</Label>
                      <Input
                        id="slackWebhook"
                        value={notificationSettings.slackWebhook}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, slackWebhook: e.target.value }))}
                        placeholder="https://hooks.slack.com/..."
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discordWebhook" className="text-xs sm:text-sm">Webhook do Discord</Label>
                      <Input
                        id="discordWebhook"
                        value={notificationSettings.discordWebhook}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, discordWebhook: e.target.value }))}
                        placeholder="https://discord.com/api/webhooks/..."
                        className="text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSaveSettings("notificações")} className="text-xs sm:text-sm px-3 py-2">
                    <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Salvar Configurações</span>
                    <span className="sm:hidden">Salvar</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Database className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">Configurações do Banco de Dados</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Manutenção e monitoramento do banco
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
                  <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Tamanho do Banco</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-1">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">245 MB</div>
                      <p className="text-xs text-muted-foreground">
                        Último backup: há 2 horas
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Conexões Ativas</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-1">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">12/100</div>
                      <p className="text-xs text-muted-foreground">
                        Conexões em uso
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-1">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">98%</div>
                      <p className="text-xs text-muted-foreground">
                        Uptime últimas 24h
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-medium">Ações de Manutenção</h3>
                  
                  <div className="grid gap-2 grid-cols-1 md:grid-cols-2 w-full">
                    <Button variant="outline" className="text-xs sm:text-sm px-3 py-2">
                      <span className="hidden sm:inline">Criar Backup Manual</span>
                      <span className="sm:hidden">Backup</span>
                    </Button>
                    <Button variant="outline" className="text-xs sm:text-sm px-3 py-2">
                      <span className="hidden sm:inline">Otimizar Tabelas</span>
                      <span className="sm:hidden">Otimizar</span>
                    </Button>
                    <Button variant="outline" className="text-xs sm:text-sm px-3 py-2">
                      <span className="hidden sm:inline">Limpar Logs Antigos</span>
                      <span className="sm:hidden">Limpar Logs</span>
                    </Button>
                    <Button variant="outline" className="text-xs sm:text-sm px-3 py-2">
                      <span className="hidden sm:inline">Verificar Integridade</span>
                      <span className="sm:hidden">Integridade</span>
                    </Button>
                  </div>
                </div>

                <div className="p-3 sm:p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2 text-sm sm:text-base">Backup Automático</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                    Backups são criados automaticamente a cada 6 horas e mantidos por 30 dias.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label className="text-xs sm:text-sm">Backup automático habilitado</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

export default Configuracoes;