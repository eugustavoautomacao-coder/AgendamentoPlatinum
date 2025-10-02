import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputPhone } from '@/components/ui/input-phone';
import { Label } from '@/components/ui/label';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User, Mail, Phone, Building, DollarSign, Calendar, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fixTimezone } from '@/utils/dateUtils';

const ProfissionalPerfil = () => {
  const { profile, loading, refetch, signOut } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    nome: profile?.nome || '',
    telefone: profile?.telefone || '',
    email: profile?.email || '',
    avatar_url: profile?.avatar_url || '',
    cargo: profile?.cargo || '',
    percentual_comissao: profile?.percentual_comissao || 0
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        nome: profile.nome || '',
        telefone: profile.telefone || '',
        email: profile.email || '',
        avatar_url: profile.avatar_url || '',
        cargo: profile.cargo || '',
        percentual_comissao: profile.percentual_comissao || 0
      });
    }
  }, [profile]);

  if (loading || !profile) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 sm:h-8 sm:w-8 text-pink-500" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Meu Perfil</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Gerencie suas informações pessoais
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handlePhoneChange = (formattedValue: string) => {
    setForm(f => ({ ...f, telefone: formattedValue }));
  };

  const handleAvatarChange = (newAvatarUrl: string) => {
    setForm(f => ({ ...f, avatar_url: newAvatarUrl }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          nome: form.nome,
          telefone: form.telefone,
          avatar_url: form.avatar_url
        })
        .eq('id', profile.id);

      if (error) throw error;

      // Atualizar dados do funcionário se existir
      const { error: employeeError } = await supabase
        .from('employees')
        .update({
          nome: form.nome,
          telefone: form.telefone,
          cargo: form.cargo,
          percentual_comissao: form.percentual_comissao
        })
        .eq('user_id', profile.id);

      if (employeeError) {
        console.warn('Erro ao atualizar dados do funcionário:', employeeError);
      }

      await refetch();
      setEditing(false);
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso."
      });
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      nome: profile.nome || '',
      telefone: profile.telefone || '',
      email: profile.email || '',
      avatar_url: profile.avatar_url || '',
      cargo: profile.cargo || '',
      percentual_comissao: profile.percentual_comissao || 0
    });
    setEditing(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <User className="h-6 w-6 sm:h-8 sm:w-8 text-pink-500" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Meu Perfil</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie suas informações pessoais e profissionais
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              Editar Perfil
            </Button>
          )}
        </div>
      </div>

      {/* Informações Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center lg:items-start space-y-4">
              <AvatarUpload
                currentAvatarUrl={form.avatar_url}
                userName={form.nome}
                userId={profile?.id || ''}
                onAvatarChange={handleAvatarChange}
                size="xl"
                showUploadButton={editing}
                disabled={!editing}
              />
              {editing && (
                <p className="text-xs text-muted-foreground text-center lg:text-left">
                  Clique na foto para alterar
                </p>
              )}
            </div>

            {/* Form Fields */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-sm font-medium">
                    Nome Completo *
                  </Label>
                  <Input
                    id="nome"
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Seu nome completo"
                    className={!editing ? "bg-muted text-muted-foreground" : "bg-background text-foreground"}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    disabled
                    placeholder="seu@email.com"
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    O email não pode ser alterado
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone" className="text-sm font-medium">
                  Telefone
                </Label>
                <InputPhone
                  id="telefone"
                  value={form.telefone}
                  onChange={handlePhoneChange}
                  disabled={!editing}
                  placeholder="(11) 99999-9999"
                  className={!editing ? "bg-muted text-muted-foreground" : "bg-background text-foreground"}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Profissionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Informações Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                name="cargo"
                value={form.cargo}
                onChange={handleChange}
                disabled={!editing}
                placeholder="Ex: Cabeleireiro, Manicure, etc."
                className={!editing ? "bg-muted text-muted-foreground" : "bg-background text-foreground"}
              />
            </div>
            <div>
              <Label htmlFor="percentual_comissao">Percentual de Comissão (%)</Label>
              <Input
                id="percentual_comissao"
                name="percentual_comissao"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.percentual_comissao}
                disabled
                placeholder="15.00"
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                O percentual de comissão não pode ser alterado pelo profissional
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Data de Cadastro</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {profile.criado_em ? format(fixTimezone(profile.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Não informado'}
                </span>
              </div>
            </div>
            <div>
              <Label>Status da Conta</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <div className={`h-2 w-2 rounded-full ${profile.ativo ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  {profile.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="destructive"
              onClick={signOut}
              className="w-full sm:w-auto"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair da Conta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <X className="h-4 w-4" />
              <span className="text-sm font-medium">Erro:</span>
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfissionalPerfil;
