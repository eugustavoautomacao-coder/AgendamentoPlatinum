import { User, Plus, Phone, Mail, Users, UserPlus, Edit, Trash2, Save, X, Search, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminLayout from "@/components/layout/AdminLayout";
import { useClients } from '@/hooks/useClients';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';

const Clientes = () => {
  const { clients, loading, createClient, updateClient, deleteClient, refetch } = useClients();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    observacoes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // Verificar se deve abrir o modal automaticamente
  useEffect(() => {
    const modalParam = searchParams.get('modal');
    if (modalParam === 'new') {
      openNew();
      // Limpar o parâmetro da URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('modal');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  // Calcular estatísticas reais
  const activeClients = clients.length;
  
  // Novos clientes (esta semana)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newClientsThisWeek = clients.filter(client =>
    new Date(client.criado_em) >= oneWeekAgo
  ).length;
  
  // Clientes este mês
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const newClientsThisMonth = clients.filter(client => 
    new Date(client.criado_em) >= oneMonthAgo
  ).length;

  const openNew = () => {
    setEditId(null);
    setForm({ nome: '', email: '', telefone: '', observacoes: '' });
    setModalOpen(true);
  };

  const openEdit = (client: any) => {
    setEditId(client.id);
    setForm({
      nome: client.nome || '',
      email: client.email || '',
      telefone: client.telefone || '',
      observacoes: client.observacoes || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.nome || !form.email) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nome e email são obrigatórios"
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editId) {
        await updateClient(editId, form);
      } else {
        await createClient(form);
      }
      setModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error submitting client:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteClient(id);
      refetch();
    } catch (error) {
      console.error('Error deleting client:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredClients = clients.filter(client =>
    client.nome?.toLowerCase().includes(searchInput.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchInput.toLowerCase()) ||
    client.telefone?.includes(searchInput)
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Clientes</h1>
              <p className="text-muted-foreground">Gerencie os clientes do salão</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-[200px] bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-[150px] bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie a base de clientes do salão
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
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Total de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{activeClients}</div>
              <p className="text-xs text-muted-foreground">cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Novos Esta Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{newClientsThisWeek}</div>
              <p className="text-xs text-muted-foreground">últimos 7 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Novos Este Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{newClientsThisMonth}</div>
              <p className="text-xs text-muted-foreground">últimos 30 dias</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Base de Clientes
            </CardTitle>
            <CardDescription>
              Todos os clientes cadastrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center gap-4 p-4 bg-gradient-card rounded-lg border border-border hover:shadow-soft transition-all duration-200"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary-soft text-primary">
                      {client.nome?.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {client.nome}
                      </h3>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </div>
                      {client.telefone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.telefone}
                        </div>
                      )}
                    </div>
                    {client.observacoes && (
                      <div className="text-sm text-muted-foreground mt-2">
                        <span className="font-semibold">Obs:</span> {client.observacoes}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(client)}>Editar</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(client.id)}>Excluir</Button>
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
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                {editId ? (
                  <>
                    <Edit className="h-5 w-5 text-primary" />
                    Editar Cliente
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 text-primary" />
                    Novo Cliente
                  </>
                )}
              </h2>
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="nome" className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Nome
                  </label>
                  <Input id="nome" name="nome" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    E-mail
                  </label>
                  <Input id="email" name="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required disabled={submitting || !!editId} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="telefone" className="text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    Telefone
                  </label>
                  <Input id="telefone" name="telefone" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="observacoes" className="text-sm flex items-center gap-2">
                    <span className="text-primary">📝</span>
                    Observações
                  </label>
                  <textarea id="observacoes" name="observacoes" value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" rows={2} disabled={submitting} />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button type="submit" disabled={submitting}>
                    <Save className="h-4 w-4 mr-2" />
                    {submitting ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de confirmação de exclusão */}
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-sm relative">
              <button className="absolute top-2 right-2 text-muted-foreground" onClick={() => setDeletingId(null)}>&times;</button>
              <h2 className="text-xl font-bold mb-4">Confirmar Exclusão</h2>
              <p className="mb-6">Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.</p>
              <div className="flex gap-2 justify-end">
                <Button variant="destructive" onClick={async () => { await handleDelete(deletingId); setDeletingId(null); }}>Confirmar</Button>
                <Button variant="outline" onClick={() => setDeletingId(null)}>Cancelar</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Clientes;