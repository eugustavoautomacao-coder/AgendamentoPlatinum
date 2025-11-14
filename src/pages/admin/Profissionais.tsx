import { User, Plus, Clock, Star, Camera, Users, UserPlus, Edit, Trash2, Save, X, Phone, Mail, Briefcase, DollarSign, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminLayout from "@/components/layout/AdminLayout";
import { useProfessionals } from "@/hooks/useProfessionals";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputPhone } from "@/components/ui/input-phone";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

const Profissionais = () => {
  const navigate = useNavigate();
  const { professionals, loading, createProfessional, deleteProfessional, updateProfessional } = useProfessionals();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
    cargo: "",
    percentual_comissao: 0
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    nome: "",
    telefone: "",
    cargo: "",
    percentual_comissao: 0
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
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
        const result = e.target?.result as string;
        setEditImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File, professionalId: string): Promise<string | null> => {
    try {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Apenas arquivos de imagem são permitidos"
        });
        return null;
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "O arquivo deve ter no máximo 5MB"
        });
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${professionalId}-${Date.now()}.${fileExt}`;
      const filePath = `professionals/${fileName}`;

      // Fazer upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // Se o arquivo já existe, tentar fazer upsert
        if (uploadError.message.includes('already exists') || uploadError.message.includes('duplicate')) {
          const { error: upsertError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true
            });
          
          if (upsertError) {
            console.error('Error uploading image (upsert):', upsertError);
            toast({
              variant: "destructive",
              title: "Erro ao fazer upload",
              description: upsertError.message || "Erro ao fazer upload da imagem"
            });
            return null;
          }
        } else {
          console.error('Error uploading image:', uploadError);
          toast({
            variant: "destructive",
            title: "Erro ao fazer upload",
            description: uploadError.message || "Erro ao fazer upload da imagem"
          });
          return null;
        }
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Erro ao fazer upload",
        description: error?.message || "Erro ao fazer upload da imagem"
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar senha mínima de 6 caracteres
    if (form.senha.length < 6) {
      toast({
        variant: "destructive",
        title: "Senha inválida",
        description: "A senha deve ter no mínimo 6 caracteres"
      });
      return;
    }
    
    setSubmitting(true);
    
    const result = await createProfessional({
      nome: form.nome,
      email: form.email,
      senha: form.senha,
      telefone: form.telefone,
      cargo: form.cargo,
      percentual_comissao: form.percentual_comissao
    });
    
    setSubmitting(false);
    if (!result.error) {
      setOpen(false);
      setForm({ nome: "", email: "", senha: "", telefone: "", cargo: "", percentual_comissao: 0 });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    
    setEditLoading(true);
    
    // Handle image upload if there's a new image
    let avatarUrl = undefined;
    const fileInput = document.getElementById('edit-avatar-input') as HTMLInputElement;
    if (fileInput?.files?.[0]) {
      avatarUrl = await uploadImage(fileInput.files[0], editId);
    }
    
    // Criar objeto de atualização apenas com campos fornecidos
    const updateData: any = {
      nome: editForm.nome,
      telefone: editForm.telefone,
      cargo: editForm.cargo,
      percentual_comissao: editForm.percentual_comissao
    };
    
    // Só incluir avatar_url se uma nova imagem foi enviada
    if (avatarUrl !== undefined) {
      updateData.avatar_url = avatarUrl;
    }
    
    const result = await updateProfessional(editId, updateData);
    
    setEditLoading(false);
    if (!result.error) {
      setEditId(null);
      setEditForm({ nome: "", telefone: "", cargo: "", percentual_comissao: 0 });
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
      cargo: professional.cargo || "",
      percentual_comissao: professional.percentual_comissao || 0
    });
    setEditImagePreview(null);
  };

  const handleQuickAvatarChange = async (professional: any, file: File) => {
    try {
      setUploadingAvatar(professional.id);
      const avatarUrl = await uploadImage(file, professional.id);
      
      if (avatarUrl) {
        const result = await updateProfessional(professional.id, { avatar_url: avatarUrl });
        if (!result.error) {
          toast({
            title: "Sucesso",
            description: "Foto atualizada com sucesso"
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erro",
            description: result.error || "Erro ao atualizar foto no banco de dados"
          });
        }
      }
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error?.message || "Erro ao atualizar foto"
      });
    } finally {
      setUploadingAvatar(null);
      // Limpar o input para permitir upload do mesmo arquivo novamente
      const input = fileInputRefs.current[professional.id];
      if (input) {
        input.value = '';
      }
    }
  };

  const handleRemoveAvatarById = async (id: string, currentAvatarUrl: string) => {
    try {
      setUploadingAvatar(id);
      
      // Buscar o profissional para obter o user_id
      const professional = professionals.find(p => p.id === id);
      if (!professional) {
        throw new Error('Profissional não encontrado');
      }

      // Buscar o user_id do employee
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('user_id')
        .eq('id', id)
        .single();

      if (employeeError) throw employeeError;
      if (!employee?.user_id) throw new Error('User ID não encontrado para este profissional');

      // Extrair file path da URL
      try {
        const url = new URL(currentAvatarUrl);
        const pathParts = url.pathname.split('/');
        // Procurar pelo índice do bucket 'avatars' e pegar o que vem depois
        const avatarsIndex = pathParts.findIndex(part => part === 'avatars');
        if (avatarsIndex !== -1 && avatarsIndex + 1 < pathParts.length) {
          const filePath = pathParts.slice(avatarsIndex + 1).join('/');
          
          // Deletar do storage
          const { error: storageError } = await supabase.storage
            .from('avatars')
            .remove([filePath]);
          
          if (storageError) {
            console.error('Error removing from storage:', storageError);
            // Continuar mesmo se houver erro no storage
          }
        }
      } catch (urlError) {
        console.warn('Erro ao processar URL do avatar:', urlError);
        // Continuar mesmo se houver erro ao processar URL
      }
      
      // Atualizar no banco de dados (users table)
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: null })
        .eq('id', employee.user_id);

      if (updateError) throw updateError;
      
      // Atualizar lista de profissionais
      await updateProfessional(id, { avatar_url: null });
      
      setEditImagePreview(null);
      
      toast({
        title: "Sucesso",
        description: "Foto removida com sucesso"
      });
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error?.message || "Erro ao remover foto"
      });
    } finally {
      setUploadingAvatar(null);
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Profissionais</h1>
              <p className="text-muted-foreground">
                Gerencie a equipe de profissionais do salão
              </p>
            </div>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Profissional
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-primary">
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

          <Card className="border-l-4 border-l-primary">
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

          <Card className="border-l-4 border-l-primary">
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
                          {uploadingAvatar === professional.id ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full z-10">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            </div>
                          ) : (
                            <>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={el => fileInputRefs.current[professional.id] = el}
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleQuickAvatarChange(professional, file);
                                  }
                                }}
                                disabled={uploadingAvatar !== null}
                              />
                              <button
                                type="button"
                                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-full z-10 cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const input = fileInputRefs.current[professional.id];
                                  if (input) {
                                    input.click();
                                  }
                                }}
                                title="Alterar foto"
                                disabled={uploadingAvatar !== null}
                              >
                                <Camera className="h-6 w-6 text-white drop-shadow" />
                              </button>
                            </>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">
                            {professional.nome}
                          </h3>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <Star className="h-4 w-4 fill-primary text-primary" />
                            <span className="text-sm text-muted-foreground">
                              4.8
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2.5 w-full">
                          {/* Cargo */}
                          <div className="flex items-center justify-center gap-2">
                            <Briefcase className="h-4 w-4 text-primary/70 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground font-medium">
                              {professional.cargo || 'Sem cargo definido'}
                            </span>
                          </div>
                          
                          {/* Telefone */}
                          <div className="flex items-center justify-center gap-2">
                            <Phone className="h-4 w-4 text-primary/70 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground truncate max-w-full">
                              {professional.telefone || 'Telefone não informado'}
                            </span>
                          </div>
                          
                          {/* Email */}
                          <div className="flex items-center justify-center gap-2">
                            <Mail className="h-4 w-4 text-primary/70 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground truncate max-w-full">
                              {professional.email || 'Email não informado'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-2 w-full">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 text-xs md:text-sm"
                            onClick={() => navigate(`/admin/agenda?filter=professional&id=${professional.id}`)}
                          >
                            <span className="hidden md:inline">Ver Agenda</span>
                            <span className="md:hidden">Agenda</span>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 text-xs md:text-sm" 
                            onClick={() => openEdit(professional)}
                          >
                            Editar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="flex-1 text-xs md:text-sm" 
                            onClick={() => setDeleteId(professional.id)}
                          >
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
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Novo Profissional
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Nome
                </Label>
                <Input id="name" name="nome" value={form.nome} onChange={handleChange} required disabled={submitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  E-mail
                </Label>
                <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required disabled={submitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Senha
                </Label>
                <Input 
                  id="senha" 
                  name="senha" 
                  type="password" 
                  value={form.senha} 
                  onChange={handleChange} 
                  required 
                  minLength={6}
                  disabled={submitting} 
                  placeholder="Senha para login do profissional" 
                />
                <span className="text-xs text-muted-foreground">
                  O profissional usará esta senha para fazer login no sistema (mínimo 6 caracteres)
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  Telefone
                </Label>
                <InputPhone 
                  id="phone" 
                  name="telefone" 
                  value={form.telefone} 
                  onChange={(formattedValue, rawValue) => setForm({ ...form, telefone: rawValue })} 
                  disabled={submitting} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Cargo
                </Label>
                <Input id="cargo" name="cargo" value={form.cargo} onChange={handleChange} disabled={submitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentual_comissao" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Percentual de Comissão (%)
                </Label>
                <Input 
                  id="percentual_comissao" 
                  name="percentual_comissao" 
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.percentual_comissao} 
                  onChange={handleChange} 
                  disabled={submitting}
                  placeholder="30.00"
                />
                <span className="text-xs text-muted-foreground">
                  Percentual de comissão sobre o valor do serviço (após dedução da taxa de custo)
                </span>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  <Save className="h-4 w-4 mr-2" />
                  {submitting ? "Salvando..." : "Salvar"}
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={submitting}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal de confirmação de exclusão */}
        <Dialog open={!!deleteId} onOpenChange={v => !deleteLoading && setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Confirmar exclusão
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">Tem certeza que deseja excluir este profissional? Esta ação é reversível.</div>
            <DialogFooter>
              <Button variant="destructive" onClick={() => handleDelete(deleteId!)} disabled={deleteLoading}>
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteLoading ? "Excluindo..." : "Excluir"}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={deleteLoading}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de edição */}
        <Dialog open={!!editId} onOpenChange={v => !editLoading && setEditId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                Editar Profissional
              </DialogTitle>
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
                <Label htmlFor="edit-name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Nome
                </Label>
                <Input id="edit-name" name="nome" value={editForm.nome} onChange={handleEditChange} required disabled={editLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  Telefone
                </Label>
                <InputPhone 
                  id="edit-phone" 
                  name="telefone" 
                  value={editForm.telefone} 
                  onChange={(formattedValue, rawValue) => setEditForm({ ...editForm, telefone: rawValue })} 
                  disabled={editLoading} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cargo" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Cargo
                </Label>
                <Input id="edit-cargo" name="cargo" value={editForm.cargo} onChange={handleEditChange} disabled={editLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-percentual_comissao" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Percentual de Comissão (%)
                </Label>
                <Input 
                  id="edit-percentual_comissao" 
                  name="percentual_comissao" 
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={editForm.percentual_comissao} 
                  onChange={handleEditChange} 
                  disabled={editLoading}
                  placeholder="30.00"
                />
                <span className="text-xs text-muted-foreground">
                  Percentual de comissão sobre o valor do serviço (após dedução da taxa de custo)
                </span>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={editLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {editLoading ? "Salvando..." : "Salvar"}
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={editLoading}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
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










