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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
            <p className="text-muted-foreground">
              Configurações gerais do sistema
            </p>
          </div>
        </div>

        <Tabs defaultValue="system" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="system">Sistema</TabsTrigger>
            <TabsTrigger value="email">E-mail</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="database">Banco de Dados</TabsTrigger>
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
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Nome do Sistema</Label>
                    <Input
                      id="siteName"
                      value={systemSettings.siteName}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, siteName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteUrl">URL do Sistema</Label>
                    <Input
                      id="siteUrl"
                      value={systemSettings.siteUrl}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, siteUrl: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">E-mail de Suporte</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={systemSettings.supportEmail}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxSalons">Máx. Salões por Admin</Label>
                    <Input
                      id="maxSalons"
                      type="number"
                      value={systemSettings.maxSalonsPerAdmin}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, maxSalonsPerAdmin: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Modo de Manutenção</Label>
                      <p className="text-sm text-muted-foreground">
                        Bloqueia o acesso ao sistema para manutenção
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Permitir Registro</Label>
                      <p className="text-sm text-muted-foreground">
                        Permite que novos usuários se registrem
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.allowRegistration}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, allowRegistration: checked }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSaveSettings("sistema")}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="mr-2 h-5 w-5" />
                  Configurações de E-mail
                </CardTitle>
                <CardDescription>
                  Configure o servidor SMTP para envio de e-mails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">Servidor SMTP</Label>
                    <Input
                      id="smtpHost"
                      value={emailSettings.smtpHost}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">Porta</Label>
                    <Input
                      id="smtpPort"
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">Usuário SMTP</Label>
                    <Input
                      id="smtpUser"
                      value={emailSettings.smtpUser}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                      placeholder="usuario@gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">Senha SMTP</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={emailSettings.smtpPassword}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fromName">Nome do Remetente</Label>
                    <Input
                      id="fromName"
                      value={emailSettings.fromName}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, fromName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">E-mail do Remetente</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline">
                    Testar Conexão
                  </Button>
                  <Button onClick={() => handleSaveSettings("e-mail")}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Configurações de Segurança
                </CardTitle>
                <CardDescription>
                  Configure políticas de segurança do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Timeout de Sessão (horas)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passwordLength">Tamanho Mín. da Senha</Label>
                    <Input
                      id="passwordLength"
                      type="number"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ipWhitelist">Lista de IPs Permitidos</Label>
                  <Textarea
                    id="ipWhitelist"
                    value={securitySettings.ipWhitelist}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, ipWhitelist: e.target.value }))}
                    placeholder="192.168.1.1, 10.0.0.1"
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    Separe os IPs com vírgula. Deixe vazio para permitir todos.
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Exigir Autenticação de Dois Fatores</Label>
                      <p className="text-sm text-muted-foreground">
                        Obriga usuários a configurar 2FA
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.requireTwoFactor}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, requireTwoFactor: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Permitir Acesso via API</Label>
                      <p className="text-sm text-muted-foreground">
                        Habilita endpoints da API REST
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.allowApiAccess}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, allowApiAccess: checked }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSaveSettings("segurança")}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Configurações de Notificações
                </CardTitle>
                <CardDescription>
                  Configure notificações e integrações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notificações por E-mail</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Novo Salão Cadastrado</Label>
                        <p className="text-sm text-muted-foreground">
                          Notifica quando um novo salão é cadastrado
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailNewSalon}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNewSalon: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Falha no Pagamento</Label>
                        <p className="text-sm text-muted-foreground">
                          Notifica quando há falha em pagamentos
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailFailedPayment}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailFailedPayment: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Alertas do Sistema</Label>
                        <p className="text-sm text-muted-foreground">
                          Notifica sobre problemas técnicos
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailSystemAlerts}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailSystemAlerts: checked }))}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Integrações</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="slackWebhook">Webhook do Slack</Label>
                      <Input
                        id="slackWebhook"
                        value={notificationSettings.slackWebhook}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, slackWebhook: e.target.value }))}
                        placeholder="https://hooks.slack.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discordWebhook">Webhook do Discord</Label>
                      <Input
                        id="discordWebhook"
                        value={notificationSettings.discordWebhook}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, discordWebhook: e.target.value }))}
                        placeholder="https://discord.com/api/webhooks/..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSaveSettings("notificações")}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  Configurações do Banco de Dados
                </CardTitle>
                <CardDescription>
                  Manutenção e monitoramento do banco
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Tamanho do Banco</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">245 MB</div>
                      <p className="text-xs text-muted-foreground">
                        Último backup: há 2 horas
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Conexões Ativas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">12/100</div>
                      <p className="text-xs text-muted-foreground">
                        Conexões em uso
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">98%</div>
                      <p className="text-xs text-muted-foreground">
                        Uptime últimas 24h
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Ações de Manutenção</h3>
                  
                  <div className="grid gap-2 md:grid-cols-2">
                    <Button variant="outline">
                      Criar Backup Manual
                    </Button>
                    <Button variant="outline">
                      Otimizar Tabelas
                    </Button>
                    <Button variant="outline">
                      Limpar Logs Antigos
                    </Button>
                    <Button variant="outline">
                      Verificar Integridade
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Backup Automático</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Backups são criados automaticamente a cada 6 horas e mantidos por 30 dias.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label>Backup automático habilitado</Label>
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