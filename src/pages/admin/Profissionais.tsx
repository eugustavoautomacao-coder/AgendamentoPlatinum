import { User, Plus, Clock, Star, Camera } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminLayout from "@/components/layout/AdminLayout";
import { useProfessionals } from "@/hooks/useProfessionals";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useRef } from "react";

const Profissionais = () => {
  const { professionals, loading, createProfessional, deleteProfessional, updateProfessional } = useProfessionals();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    specialties: "",
    schedule: "",
    avatar_url: ""
  });
  const [formImage, setFormImage] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    specialties: "",
    schedule: "",
    avatar_url: ""
  });
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Upload handler para cadastro
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
  // Upload handler para edição
  const handleEditImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 2 * 1024 * 1024 && file.type.startsWith('image/')) {
      setEditImage(file);
      setEditImagePreview(URL.createObjectURL(file));
    } else {
      setEditImage(null);
      setEditImagePreview(null);
      toast({ variant: 'destructive', title: 'Erro', description: 'Selecione uma imagem válida de até 2MB.' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    let avatar_url = "";
    if (formImage) {
      const ext = formImage.name.split('.').pop();
      const fileName = `professional-${form.email.replace(/[^a-zA-Z0-9]/g, '')}.${ext}`; // sem barra!
      const { data, error } = await supabase.storage.from('avatars').upload(fileName, formImage, { upsert: true });
      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao fazer upload da imagem.' });
      } else {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        avatar_url = urlData.publicUrl;
      }
    }
    const specialtiesArr = form.specialties.split(",").map(s => s.trim()).filter(Boolean);
    const result = await createProfessional({
      name: form.name,
      email: form.email,
      phone: form.phone,
      specialties: specialtiesArr,
      schedule: form.schedule,
      avatar_url
    });
    setSubmitting(false);
    if (!result.error) {
      setOpen(false);
      setForm({ name: "", email: "", phone: "", specialties: "", schedule: "", avatar_url: "" });
      setFormImage(null);
      setFormImagePreview(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    const result = await deleteProfessional(deleteId);
    setDeleteLoading(false);
    setDeleteId(null);
    if (!result.error) {
      toast({ title: "Sucesso", description: "Profissional excluído com sucesso" });
    }
  };

  const openEdit = (professional: any) => {
    setEditId(professional.id);
    setEditForm({
      name: professional.name || "",
      phone: professional.phone || "",
      specialties: (professional.specialties || []).join(", "),
      schedule: typeof professional.schedule === 'string' ? professional.schedule : "",
      avatar_url: professional.avatar_url || ""
    });
    setEditImage(null); // Limpar preview ao abrir modal de edição
    setEditImagePreview(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setEditLoading(true);
    let avatar_url = editForm.avatar_url;
    if (editImage) {
      const ext = editImage.name.split('.').pop();
      const fileName = `professional-${editId}.${ext}`; // sem barra!
      const { data, error } = await supabase.storage.from('avatars').upload(fileName, editImage, { upsert: true });
      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao fazer upload da imagem.' });
      } else {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        avatar_url = urlData.publicUrl;
      }
    }
    const specialtiesArr = editForm.specialties.split(",").map(s => s.trim()).filter(Boolean);
    const result = await updateProfessional(editId, {
      name: editForm.name,
      phone: editForm.phone,
      specialties: specialtiesArr,
      schedule: editForm.schedule,
      avatar_url
    });
    setEditLoading(false);
    if (!result.error) {
      setEditId(null);
      setEditImage(null);
      setEditImagePreview(null);
      toast({ title: "Sucesso", description: "Profissional atualizado com sucesso" });
    }
  };

  // Função para remover foto (reutilizada no modal)
  const handleRemoveAvatarById = async (id: string, avatar_url: string) => {
    if (!avatar_url) return;
    const path = avatar_url.split('/storage/v1/object/public/avatars/')[1];
    if (path) {
      await supabase.storage.from('avatars').remove([path]);
    }
    await updateProfessional(id, { avatar_url: '' });
    setEditForm(f => ({ ...f, avatar_url: '' }));
    setEditImage(null);
    setEditImagePreview(null);
    toast({ title: 'Sucesso', description: 'Foto removida com sucesso' });
  };

  // Função para upload rápido
  const handleQuickAvatarChange = async (professional: any, file: File) => {
    if (!file || file.size > 2 * 1024 * 1024 || !file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Selecione uma imagem válida de até 2MB.' });
      return;
    }
    const ext = file.name.split('.').pop();
    const fileName = `professional-${professional.id}.${ext}`;
    const { data, error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao fazer upload da imagem.' });
      return;
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    await updateProfessional(professional.id, { avatar_url: urlData.publicUrl });
    toast({ title: 'Sucesso', description: 'Foto atualizada com sucesso' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profissionais</h1>
            <p className="text-muted-foreground">
              Gerencie a equipe do seu salão
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Profissional
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{loading ? <Skeleton className='h-6 w-12' /> : professionals.length}</div>
              <p className="text-xs text-muted-foreground">ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avaliação Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">4.8</div>
              <p className="text-xs text-muted-foreground">de 5 estrelas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Serviços Realizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">746</div>
              <p className="text-xs text-muted-foreground">este mês</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Equipe
            </CardTitle>
            <CardDescription>
              Todos os profissionais do salão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="bg-gradient-card border border-border">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <div className="flex gap-2 w-full">
                          <Skeleton className="h-8 w-20 flex-1" />
                          <Skeleton className="h-8 w-20 flex-1" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : professionals.length === 0 ? (
                <div className="col-span-full text-center text-muted-foreground py-12">
                  Nenhum profissional cadastrado ainda.
                </div>
              ) : (
                professionals.map((professional) => (
                  <Card key={professional.id} className="bg-gradient-card border border-border hover:shadow-soft transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="relative group">
                          <Avatar className="h-20 w-20">
                            <AvatarImage src={professional.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary-soft text-primary text-lg">
                              {professional.name?.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={el => (window[`fileInput_${professional.id}`] = el)}
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleQuickAvatarChange(professional, file);
                            }}
                          />
                          <button
                            type="button"
                            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-full z-10"
                            style={{ pointerEvents: 'auto' }}
                            onClick={() => window[`fileInput_${professional.id}`]?.click()}
                            title="Alterar foto"
                          >
                            <Camera className="h-6 w-6 text-white drop-shadow" />
                          </button>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">
                            {professional.name}
                          </h3>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <Star className="h-4 w-4 fill-warning text-warning" />
                            <span className="text-sm text-muted-foreground">
                              4.8
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 w-full">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {professional.specialties?.length > 0 ? professional.specialties.map((specialty, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {specialty}
                              </Badge>
                            )) : <span className="text-xs text-muted-foreground">Sem especialidades</span>}
                          </div>
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {professional.schedule ? (typeof professional.schedule === 'string' ? professional.schedule : 'Personalizado') : 'Horário não informado'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {/* Aqui pode-se exibir total de serviços se houver campo */}
                          </div>
                        </div>
                        <div className="flex gap-2 w-full">
                          <Button size="sm" variant="outline" className="flex-1">
                            Ver Agenda
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(professional)}>
                            Editar
                          </Button>
                          <Button size="sm" variant="destructive" className="flex-1" onClick={() => setDeleteId(professional.id)}>
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        {/* Modal de cadastro */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Profissional</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" value={form.name} onChange={handleChange} required disabled={submitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required disabled={submitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" value={form.phone} onChange={handleChange} disabled={submitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialties">Especialidades <span className="text-xs text-muted-foreground">(separadas por vírgula)</span></Label>
                <Input id="specialties" name="specialties" value={form.specialties} onChange={handleChange} placeholder="Corte, Escova, Coloração" disabled={submitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule">Horário</Label>
                <Input id="schedule" name="schedule" value={form.schedule} onChange={handleChange} placeholder="Seg-Sex: 9h-18h" disabled={submitting} />
              </div>
              <div className="space-y-2">
                <Label>Foto do profissional</Label>
                <Input type="file" accept="image/*" onChange={handleFormImage} disabled={submitting} />
                {formImagePreview && <img src={formImagePreview} alt="Preview" className="h-20 w-20 rounded-full object-cover mt-2 mx-auto" />}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Salvando..." : "Salvar"}
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={submitting}>Cancelar</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        {/* Modal de confirmação de exclusão */}
        <Dialog open={!!deleteId} onOpenChange={v => !deleteLoading && setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
            </DialogHeader>
            <div className="py-4">Tem certeza que deseja excluir este profissional? Esta ação é reversível.</div>
            <DialogFooter>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? "Excluindo..." : "Excluir"}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={deleteLoading}>Cancelar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Modal de edição */}
        <Dialog open={!!editId} onOpenChange={v => !editLoading && setEditId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Profissional</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Foto e ações no topo */}
              <div className="flex flex-col items-center gap-2 mb-4">
                <span className="block text-xs text-muted-foreground mb-1">Foto do profissional</span>
                <div className="relative">
                  <img
                    src={editImagePreview || editForm.avatar_url || undefined}
                    alt="Foto do profissional"
                    className="h-24 w-24 rounded-full object-cover border-2 border-primary shadow"
                  />
                  {/* Overlay de alterar foto */}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="edit-avatar-input"
                    onChange={handleEditImage}
                    disabled={editLoading}
                  />
                  <button
                    type="button"
                    className="absolute bottom-1 right-1 bg-black/70 rounded-full p-1 hover:bg-primary transition"
                    style={{ pointerEvents: 'auto' }}
                    onClick={e => {
                      e.preventDefault();
                      document.getElementById('edit-avatar-input')?.click();
                    }}
                    title="Alterar foto"
                    disabled={editLoading}
                  >
                    <Camera className="h-5 w-5 text-white" />
                  </button>
                </div>
                {(editForm.avatar_url || editImagePreview) && (
                  <button
                    type="button"
                    className="text-xs text-red-600 underline hover:text-red-800"
                    onClick={e => {
                      e.preventDefault();
                      handleRemoveAvatarById(editId!, editForm.avatar_url);
                    }}
                    disabled={editLoading}
                  >
                    Remover foto
                  </button>
                )}
              </div>
              {/* Campos de texto */}
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input id="edit-name" name="name" value={editForm.name} onChange={handleEditChange} required disabled={editLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input id="edit-phone" name="phone" value={editForm.phone} onChange={handleEditChange} disabled={editLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-specialties">Especialidades <span className="text-xs text-muted-foreground">(separadas por vírgula)</span></Label>
                <Input id="edit-specialties" name="specialties" value={editForm.specialties} onChange={handleEditChange} placeholder="Corte, Escova, Coloração" disabled={editLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-schedule">Horário</Label>
                <Input id="edit-schedule" name="schedule" value={editForm.schedule} onChange={handleEditChange} placeholder="Seg-Sex: 9h-18h" disabled={editLoading} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? "Salvando..." : "Salvar"}
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={editLoading}>Cancelar</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Profissionais;