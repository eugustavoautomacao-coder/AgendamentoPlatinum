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
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

const Profissionais = () => {
  const { professionals, loading, createProfessional, deleteProfessional, updateProfessional } = useProfessionals();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    cargo: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    nome: "",
    telefone: "",
    cargo: ""
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File, professionalId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${professionalId}-${Date.now()}.${fileExt}`;
      const filePath = `professionals/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const result = await createProfessional({
      nome: form.nome,
      email: form.email,
      telefone: form.telefone,
      cargo: form.cargo
    });
    
    setSubmitting(false);
    if (!result.error) {
      setOpen(false);
      setForm({ nome: "", email: "", telefone: "", cargo: "" });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    
    setEditLoading(true);
    
    // Handle image upload if there's a new image
    let avatarUrl = null;
    const fileInput = document.getElementById('edit-avatar-input') as HTMLInputElement;
    if (fileInput?.files?.[0]) {
      avatarUrl = await uploadImage(fileInput.files[0], editId);
    }
    
    const result = await updateProfessional(editId, {
      nome: editForm.nome,
      telefone: editForm.telefone,
      cargo: editForm.cargo,
      avatar_url: avatarUrl
    });
    
    setEditLoading(false);
    if (!result.error) {
      setEditId(null);
      setEditForm({ nome: "", telefone: "", cargo: "" });
      setEditImagePreview(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    setDeleteLoading(true);
    const result = await deleteProfessional(id);
    setDeleteLoading(false);
    setDeleteId(null);
    if (!result.error) {
      toast({ title: "Profissional removido com sucesso!" });
    }
  };

  const openEdit = (professional: any) => {
    setEditId(professional.id);
    setEditForm({
      nome: professional.nome || "",
      telefone: professional.telefone || "",
      cargo: professional.cargo || ""
    });
    setEditImagePreview(null);
  };

  const handleQuickAvatarChange = async (professional: any, file: File) => {
    const avatarUrl = await uploadImage(file, professional.id);
    if (avatarUrl) {
      await updateProfessional(professional.id, { avatar_url: avatarUrl });
    }
  };

  const handleRemoveAvatarById = async (id: string, currentAvatarUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = currentAvatarUrl.split('/');
      const filePath = urlParts.slice(-2).join('/'); // Get last two parts: folder/filename
      
      // Delete from storage
      await supabase.storage
        .from('avatars')
        .remove([filePath]);
      
      // Update database
      await updateProfessional(id, { avatar_url: null });
      
      setEditImagePreview(null);
    } catch (error) {
      console.error('Error removing avatar:', error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Profissionais</h1>
              <p className="text-muted-foreground">Gerencie os profissionais do salão</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
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
                              {professional.nome?.split(' ').map(n => n[0]).join('')}
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
                            {professional.nome}
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
                            <span className="text-xs text-muted-foreground">{professional.cargo || 'Sem cargo definido'}</span>
                          </div>
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {professional.telefone || 'Telefone não informado'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {professional.email}
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
                <Input id="name" name="nome" value={form.nome} onChange={handleChange} required disabled={submitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required disabled={submitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="telefone" value={form.telefone} onChange={handleChange} disabled={submitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input id="cargo" name="cargo" value={form.cargo} onChange={handleChange} disabled={submitting} />
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
              <Button variant="destructive" onClick={() => handleDelete(deleteId!)} disabled={deleteLoading}>
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
            <form onSubmit={handleEdit} className="space-y-4">
              {/* Foto e ações no topo */}
              <div className="flex flex-col items-center gap-2 mb-4">
                <span className="block text-xs text-muted-foreground mb-1">Foto do profissional</span>
                <div className="relative">
                  <img
                    src={editImagePreview || (professionals.find(p => p.id === editId)?.avatar_url || undefined)}
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
                {(professionals.find(p => p.id === editId)?.avatar_url || editImagePreview) && (
                  <button
                    type="button"
                    className="text-xs text-red-600 underline hover:text-red-800"
                    onClick={e => {
                      e.preventDefault();
                      const professional = professionals.find(p => p.id === editId);
                      if (professional?.avatar_url) {
                        handleRemoveAvatarById(editId!, professional.avatar_url);
                      }
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
                <Input id="edit-name" name="nome" value={editForm.nome} onChange={handleEditChange} required disabled={editLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input id="edit-phone" name="telefone" value={editForm.telefone} onChange={handleEditChange} disabled={editLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cargo">Cargo</Label>
                <Input id="edit-cargo" name="cargo" value={editForm.cargo} onChange={handleEditChange} disabled={editLoading} />
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