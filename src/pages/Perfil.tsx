import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { LogOut, ArrowLeft, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Perfil = () => {
  const { profile, loading, refetch } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    avatar_url: profile?.avatar_url || '',
    email: profile?.email || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm({
      name: profile?.name || '',
      phone: profile?.phone || '',
      avatar_url: profile?.avatar_url || '',
      email: profile?.email || ''
    });
  }, [profile]);

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}_${Date.now()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, {
        upsert: true
      });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setForm(f => ({ ...f, avatar_url: publicUrlData.publicUrl }));
      toast({ title: 'Avatar atualizado! (pré-visualização)', description: 'Clique em Salvar alterações para aplicar.' });
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload do avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const { data, error, status, statusText } = await supabase
        .from('profiles')
        .update({
          name: form.name,
          phone: form.phone,
          avatar_url: form.avatar_url
        })
        .eq('id', profile.id)
        .select();
      console.log('Update result:', { data, error, status, statusText });
      if (error) throw error;
      if (!data || data.length === 0) {
        setError('Nenhuma linha foi alterada. Verifique permissões ou se o ID está correto.');
        return;
      }
      toast({ title: 'Perfil atualizado com sucesso!' });
      await refetch?.();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil');
      console.error('Erro ao atualizar perfil:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleGoDashboard = () => {
    if (profile?.role === 'superadmin') navigate('/superadmin');
    else if (profile?.role === 'admin') navigate('/admin');
    else if (profile?.role === 'profissional') navigate('/profissional');
    else navigate('/');
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted relative">
      <button
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-primary font-medium text-sm"
        onClick={handleGoDashboard}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao Dashboard
      </button>
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader>
          <CardTitle>Meu Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                <AvatarImage src={form.avatar_url} />
                <AvatarFallback>{form.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 shadow hover:bg-primary/90"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Alterar foto"
              >
                <Upload className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Nome completo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              value={form.email}
              disabled
              className="bg-muted cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              placeholder="Telefone"
            />
          </div>
          {error && <div className="text-destructive text-sm mt-2">{error}</div>}
          <Button className="w-full mt-4" onClick={handleSave} disabled={saving || !form.name.trim() || !form.phone.trim()}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Perfil; 