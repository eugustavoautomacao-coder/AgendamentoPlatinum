import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { useToast } from '@/hooks/use-toast';
import { setupAvatarStorage } from '@/utils/setupStorage';
import { LogOut, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Perfil = () => {
  const { profile, loading, refetch } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: profile?.nome || '',
    telefone: profile?.telefone || '',
    email: profile?.email || '',
    avatar_url: profile?.avatar_url || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      nome: profile?.nome || '',
      telefone: profile?.telefone || '',
      email: profile?.email || '',
      avatar_url: profile?.avatar_url || ''
    });
    
    // Configurar storage de avatars
    setupAvatarStorage();
  }, [profile]);

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = (newAvatarUrl: string) => {
    setForm(f => ({ ...f, avatar_url: newAvatarUrl }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    try {
      const updateData: any = {
        nome: form.nome,
        telefone: form.telefone
      };

      // Adicionar avatar_url apenas se foi alterado
      if (form.avatar_url !== profile?.avatar_url) {
        updateData.avatar_url = form.avatar_url;
      }

      const { data, error, status, statusText } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', profile.id)
        .select();
      
      console.log('Update result:', { data, error, status, statusText });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setError('Nenhuma linha foi alterada. Verifique permissões ou se o ID está correto.');
        return;
      }
      
      toast({ title: 'Perfil atualizado com sucesso!' });
      
      // Forçar refetch para atualizar a sidebar
      await refetch?.();
      
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil');
      console.error('Erro ao atualizar perfil:', err);
      toast({ 
        title: 'Erro ao atualizar perfil', 
        description: err.message || 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGoDashboard = () => {
    if (profile?.tipo === 'system_admin') navigate('/superadmin');
    else if (profile?.tipo === 'admin') navigate('/admin');
    else if (profile?.tipo === 'funcionario') navigate('/profissional');
    else navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleGoDashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">Meu Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <AvatarUpload
              currentAvatarUrl={form.avatar_url}
              userName={profile.nome || ''}
              userId={profile.id}
              onAvatarChange={handleAvatarChange}
              size="xl"
              showUploadButton={true}
              disabled={false}
            />

            {/* Form */}
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Seu nome completo"
                  required
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={form.telefone}
                  onChange={handleChange}
                  placeholder="Seu telefone"
                  disabled={saving}
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Perfil; 