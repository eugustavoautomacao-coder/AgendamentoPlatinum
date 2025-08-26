import { Plus, Scissors, DollarSign, Clock, Edit, Trash2, Save, X, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/layout/AdminLayout";
import { useServices } from '@/hooks/useServices';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const Servicos = () => {
  const { services, createService, updateService, deleteService, refetch } = useServices();
  const [open, setOpen] = useState(false);
  const [editService, setEditService] = useState(null);
  const [form, setForm] = useState({ nome: '', duracao_minutos: 60, preco: 0, categoria: '', descricao: '' });
  const [saving, setSaving] = useState(false);

  const handleOpenNew = () => {
    setEditService(null);
    setForm({ nome: '', duracao_minutos: 60, preco: 0, categoria: '', descricao: '' });
    setOpen(true);
  };
  
  const handleOpenEdit = (service) => {
    setEditService(service);
    setForm({
      nome: service.nome,
      duracao_minutos: service.duracao_minutos,
      preco: service.preco,
      categoria: service.categoria || '',
      descricao: service.descricao || ''
    });
    setOpen(true);
  };
  
  const handleSave = async () => {
    setSaving(true);
    if (editService) {
      await updateService(editService.id, form);
    } else {
      await createService(form);
    }
    setSaving(false);
    setOpen(false);
    refetch();
  };
  
  const handleDelete = async (service) => {
    await deleteService(service.id);
    refetch();
  };
  
  const categories = [...new Set(services.map(s => s.categoria).filter(Boolean))];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Serviços</h1>
            <p className="text-muted-foreground">
              Gerencie os serviços oferecidos pelo salão
            </p>
          </div>
          <Button onClick={handleOpenNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Serviço
          </Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editService ? (
                  <>
                    <Edit className="h-5 w-5 text-primary" />
                    Editar Serviço
                  </>
                ) : (
                  <>
                    <Package className="h-5 w-5 text-primary" />
                    Novo Serviço
                  </>
                )}
              </DialogTitle>
              <CardDescription className="mb-2">
                Preencha os dados do serviço. Todos os campos são obrigatórios.
              </CardDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-primary" />
                  Nome do Serviço *
                </label>
                <Input placeholder="Ex: Corte Feminino" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Duração (min) *
                  </label>
                  <Input type="number" min={1} placeholder="Ex: 60" value={form.duracao_minutos} onChange={e => setForm(f => ({ ...f, duracao_minutos: Number(e.target.value) }))} required />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Preço (R$) *
                  </label>
                  <Input type="number" min={0} step={0.01} placeholder="Ex: 45.00" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: Number(e.target.value) }))} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Categoria
                </label>
                <Input placeholder="Ex: Cabelo, Unhas, Barba" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <span className="text-primary">📝</span>
                  Descrição
                </label>
                <Input placeholder="Ex: Serviço de corte de cabelo para mulheres" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" disabled={saving || !form.nome}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Serviços
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{services.length}</div>
              <p className="text-xs text-muted-foreground">ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Preço Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                R$ {(services.length ? (services.reduce((acc, s) => acc + s.preco, 0) / services.length) : 0).toFixed(0)}
              </div>
              <p className="text-xs text-muted-foreground">por serviço</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Categorias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{categories.length}</div>
              <p className="text-xs text-muted-foreground">diferentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Duração Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {services.length ? Math.round(services.reduce((acc, s) => acc + s.duracao_minutos, 0) / services.length) : 0} min
              </div>
              <p className="text-xs text-muted-foreground">por serviço</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-primary" />
              Lista de Serviços
            </CardTitle>
            <CardDescription>
              Todos os serviços disponíveis no salão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center gap-4 p-4 bg-gradient-card rounded-lg border border-border hover:shadow-soft transition-all duration-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {service.nome}
                      </h3>
                      {service.categoria && <Badge variant="secondary">{service.categoria}</Badge>}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {service.duracao_minutos} min
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Preço: R$ {Number(service.preco).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">
                      R$ {Number(service.preco).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Preço final
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleOpenEdit(service)}>Editar</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(service)}>Excluir</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Servicos;