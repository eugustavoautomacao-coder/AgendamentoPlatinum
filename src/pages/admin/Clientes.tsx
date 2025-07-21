import { Users, Plus, Search, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminLayout from "@/components/layout/AdminLayout";
import { useClients } from '@/hooks/useClients';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera } from 'lucide-react';

const Clientes = () => {
  const { clients, loading, createClient, updateClient, deleteClient, refetch } = useClients();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    observacoes: '',
    avatar_url: ''
  });
  const [formImage, setFormImage] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");

  // Calcular estatísticas reais
  const totalClients = clients.length;
  
  // Clientes ativos (últimos 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const activeClients = clients.filter(client => 
    new Date(client.created_at) >= thirtyDaysAgo
  ).length;
  
  // Novos clientes (esta semana)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newClientsThisWeek = clients.filter(client => 
    new Date(client.created_at) >= oneWeekAgo
  ).length;
  
  // Clientes este mês
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const newClientsThisMonth = clients.filter(client => 
    new Date(client.created_at) >= oneMonthAgo
  ).length;

  const openNew = () => {
    setEditId(null);
    setForm({ name: '', email: '', phone: '', observacoes: '', avatar_url: '' });
    setFormImage(null);
    setFormImagePreview(null);
    setModalOpen(true);
  };
  const openEdit = (client: any) => {
    setEditId(client.id);
    setForm({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      observacoes: client.observacoes || '',
      avatar_url: client.avatar_url || ''
    });
    setFormImage(null);
    setFormImagePreview(null);
    setModalOpen(true);
  };
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleFormImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 2 * 1024 * 1024 && file.type.startsWith('image/')) {
      setFormImage(file);
      setFormImagePreview(URL.createObjectURL(file));
    } else {
      setFormImage(null);
      setFormImagePreview(null);
      toast({ variant: 'destructive', title: 'Erro', description: 'Selecione uma imagem válida de até 2MB.' });
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    let avatar_url = form.avatar_url;
    if (formImage) {
      const ext = formImage.name.split('.').pop();
      const fileName = `client-${(editId || form.email).replace(/[^a-zA-Z0-9]/g, '')}.${ext}`;
      const { data, error } = await supabase.storage.from('avatars').upload(fileName, formImage, { upsert: true });
      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao fazer upload da imagem.' });
      } else {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        avatar_url = urlData.publicUrl;
      }
    }
    if (editId) {
      await updateClient(editId, { ...form, avatar_url });
    } else {
      await createClient({ ...form, avatar_url });
    }
    setSubmitting(false);
    setModalOpen(false);
    setForm({ name: '', email: '', phone: '', observacoes: '', avatar_url: '' });
    setFormImage(null);
    setFormImagePreview(null);
  };

  // Filtro de busca em tempo real
  const filteredClients = clients.filter(client => {
    const search = searchInput.toLowerCase();
    return (
      client.name.toLowerCase().includes(search) ||
      (client.email && client.email.toLowerCase().includes(search)) ||
      (client.phone && client.phone.toLowerCase().includes(search)) ||
      (client.observacoes && client.observacoes.toLowerCase().includes(search))
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie todos os clientes do salão
            </p>
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalClients}</div>
              <p className="text-xs text-muted-foreground">+{newClientsThisMonth} este mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clientes Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{activeClients}</div>
              <p className="text-xs text-muted-foreground">últimos 30 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Novos Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{newClientsThisWeek}</div>
              <p className="text-xs text-muted-foreground">esta semana</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Lista de Clientes
                </CardTitle>
                <CardDescription>
                  Todos os clientes cadastrados
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente..."
                    className="pl-10 w-full sm:w-64"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center text-muted-foreground py-8">Carregando clientes...</div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">Nenhum cliente cadastrado ainda.</div>
              ) : filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="p-4 bg-gradient-card rounded-lg border border-border hover:shadow-soft transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={client.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary-soft text-primary">
                        {client.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {client.name}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </div>
                      </div>
                      {client.observacoes && (
                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="font-semibold">Obs:</span> {client.observacoes}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Ver Histórico
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(client)}>
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Modal de cadastro/edição */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md relative">
              <button className="absolute top-2 right-2 text-muted-foreground" onClick={() => setModalOpen(false)}>&times;</button>
              <h2 className="text-xl font-bold mb-4">{editId ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col items-center gap-2 mb-2">
                  <div className="relative">
                    <img
                      src={formImagePreview || form.avatar_url || undefined}
                      alt="Foto do cliente"
                      className="h-20 w-20 rounded-full object-cover border-2 border-primary shadow"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="client-avatar-input"
                      onChange={handleFormImage}
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      className="absolute bottom-1 right-1 bg-black/70 rounded-full p-1 hover:bg-primary transition"
                      style={{ pointerEvents: 'auto' }}
                      onClick={e => {
                        e.preventDefault();
                        document.getElementById('client-avatar-input')?.click();
                      }}
                      title="Alterar foto"
                      disabled={submitting}
                    >
                      <Camera className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm">Nome</label>
                  <Input id="name" name="name" value={form.name} onChange={handleFormChange} required disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm">E-mail</label>
                  <Input id="email" name="email" type="email" value={form.email} onChange={handleFormChange} required disabled={submitting || !!editId} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm">Telefone</label>
                  <Input id="phone" name="phone" value={form.phone} onChange={handleFormChange} disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="observacoes" className="text-sm">Observações</label>
                  <textarea id="observacoes" name="observacoes" value={form.observacoes} onChange={handleFormChange} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" rows={2} disabled={submitting} />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Clientes;