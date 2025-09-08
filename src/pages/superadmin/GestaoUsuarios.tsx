import { useState, useEffect } from "react";
import { Search, Filter, UserPlus, Edit, Trash2, Crown, Shield, User, Users } from "lucide-react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProfiles } from "@/hooks/useProfiles";
import { useSalons } from "@/hooks/useSalons";
import { useRef } from "react";
import { Label } from "@/components/ui/label";

const GestaoUsuarios = () => {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [salonFilter, setSalonFilter] = useState("all");
  
  const { profiles, loading, fetchProfiles } = useProfiles();
  const { salons } = useSalons();
  const { toast } = useToast();
  const [resetUser, setResetUser] = useState<any>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [password, setPassword] = useState("");

  // Estado do modal de cadastro
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    password: '',
    tipo: 'admin',
    salao_id: '',
    telefone: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Estado do modal de edição
  const [editUser, setEditUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', salon_id: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Estado do modal de exclusão
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Estado do modal de alteração de role
  const [roleUser, setRoleUser] = useState<any>(null);
  const [newRole, setNewRole] = useState('');
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  // Validação visual simples
  const isSalonRequired = newUser.tipo !== 'system_admin';
  const isFormValid =
    newUser.nome.trim() &&
    newUser.email.trim() &&
    newUser.password.trim() &&
    newUser.tipo &&
    newUser.telefone.trim() &&
    (!isSalonRequired || newUser.salao_id);

  // Ajustar validação do formulário de edição
  const isEditFormValid = editForm.name.trim() && editForm.email.trim() && editForm.phone.trim();

  // Buscar usuários apenas quando filtros principais mudarem
  useEffect(() => {
    fetchProfiles({
      tipo: roleFilter,
      salao_id: salonFilter
    });
  }, [roleFilter, salonFilter, fetchProfiles]);

  // Filtro local instantâneo
  const filteredProfiles = profiles.filter(profile => {
    const search = searchInput.toLowerCase();
    return (
      profile.nome.toLowerCase().includes(search) ||
      (profile.salao_nome && profile.salao_nome.toLowerCase().includes(search)) ||
      (profile.telefone && profile.telefone.toLowerCase().includes(search))
    );
  });

  useEffect(() => {
    if (!resetUser) setPassword('');
  }, [resetUser]);

  const getRoleIcon = (tipo: string) => {
    switch (tipo) {
      case "system_admin":
        return <Crown className="h-4 w-4" />;
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "funcionario":
        return <User className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (tipo: string) => {
    switch (tipo) {
      case "system_admin":
        return <Badge variant="default" className="bg-purple-600">SuperAdmin</Badge>;
      case "admin":
        return <Badge variant="default" className="bg-blue-600">Admin</Badge>;
      case "funcionario":
        return <Badge variant="secondary">Funcionário</Badge>;
      default:
        return <Badge variant="outline">Cliente</Badge>;
    }
  };

  // Função para redefinir senha via Edge Function
  const handleResetPassword = async () => {
    if (!resetUser || !password) return;
    setResetLoading(true);
    try {
      // Obter access token do usuário logado
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      if (!accessToken) throw new Error("Token de acesso não encontrado");

      const response = await fetch(
        "https://lbpqmdcmoybuuthzezmj.supabase.co/functions/v1/reset-user-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId: resetUser.id,
            newPassword: password,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao redefinir senha");
      }
      toast({
        title: "Senha redefinida com sucesso!",
        description: `A senha do usuário foi atualizada.`
      });
      // Limpar busca e atualizar a lista de usuários após redefinir senha
      setSearchTerm('');
      await fetchProfiles({ tipo: roleFilter, salao_id: salonFilter, search: '' });
      setPassword("");
      setResetUser(null);
      handleCloseModal();
    } catch (error: any) {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message || "Erro inesperado ao processar a solicitação",
        variant: "destructive"
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleCloseModal = () => {
    setResetUser(null);
    setPassword('');
    setSearchInput('');
  };

  const handleCreateUser = async () => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      // Obter access token do usuário logado
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      if (!accessToken) throw new Error("Token de acesso não encontrado");

      // Montar payload
      const payload = {
        nome: newUser.nome.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
        tipo: newUser.tipo.trim().toLowerCase(),
        salao_id: newUser.salao_id || null,
        telefone: newUser.telefone.trim()
      };
      console.log("Payload enviado:", payload);
      // Chamada para Edge Function
      const response = await fetch(
        "https://lbpqmdcmoybuuthzezmj.supabase.co/functions/v1/create-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        console.error("Erro detalhado da Edge Function:", data.error);
        throw new Error(data.error || "Erro ao cadastrar usuário");
      }
      toast({
        title: "Usuário cadastrado com sucesso!",
        description: `O usuário ${newUser.nome} foi criado.`
      });
      setIsCreateOpen(false);
      setNewUser({ nome: '', email: '', password: '', tipo: 'admin', salao_id: '', telefone: '' });
      // Atualizar listagem
      await fetchProfiles({ tipo: roleFilter, salao_id: salonFilter });
    } catch (error: any) {
      setCreateError(error.message || "Erro inesperado ao cadastrar usuário");
    } finally {
      setCreateLoading(false);
    }
  };

  // Função para abrir modal de edição
  const handleOpenEdit = (user: any) => {
    setEditUser(user);
    setEditForm({
      name: user.nome || '',
      email: user.email || '',
      phone: user.telefone || '',
      salon_id: user.salao_id || ''
    });
    setEditError(null);
  };

  // Função para salvar edição
  const handleEditUser = async () => {
    if (!editUser) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          nome: editForm.name,
          email: editForm.email,
          telefone: editForm.phone,
          salao_id: editForm.salon_id || null
        })
        .eq('id', editUser.id);
      if (error) throw error;
      toast({ title: 'Usuário atualizado com sucesso!' });
      setEditUser(null);
      await fetchProfiles({ tipo: roleFilter, salao_id: salonFilter });
    } catch (error: any) {
      setEditError(error.message || 'Erro ao atualizar usuário');
    } finally {
      setEditLoading(false);
    }
  };

  // Função para excluir usuário
  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setDeleteLoading(true);
    try {
      // Chama a Edge Function para excluir de ambas as tabelas
      const response = await fetch('https://lbpqmdcmoybuuthzezmj.supabase.co/functions/v1/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ userId: deleteUser.id })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir usuário');
      }

      toast({ title: 'Usuário excluído com sucesso!' });
      setDeleteUser(null);
      await fetchProfiles({ tipo: roleFilter, salao_id: salonFilter });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir usuário',
        description: error.message || 'Erro inesperado',
        variant: 'destructive'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Função para abrir modal de alteração de tipo
  const handleOpenRole = (user: any) => {
    setRoleUser(user);
    setNewRole(user.tipo);
    setRoleError(null);
  };

  // Função para salvar alteração de tipo
  const handleChangeRole = async () => {
    if (!roleUser || !newRole) return;
    setRoleLoading(true);
    setRoleError(null);
    try {
      const { error } = await supabase
        .from('users')
        .update({ tipo: newRole })
        .eq('id', roleUser.id);
      if (error) throw error;
      toast({ title: 'Tipo atualizado com sucesso!' });
      setRoleUser(null);
      await fetchProfiles({ tipo: roleFilter, salao_id: salonFilter });
    } catch (error: any) {
      setRoleError(error.message || 'Erro ao atualizar tipo');
    } finally {
      setRoleLoading(false);
    }
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando usuários...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie todos os usuários do sistema
            </p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4">
              <DialogHeader>
                <DialogTitle>Novo Usuário</DialogTitle>
                <DialogDescription>Preencha os dados para cadastrar um novo usuário.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 px-1">
                <div className="space-y-2">
                  <Label htmlFor="user-name">Nome</Label>
                  <Input
                    id="user-name"
                    value={newUser.nome}
                    onChange={e => setNewUser(u => ({ ...u, nome: e.target.value }))}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email">E-mail</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={newUser.email}
                    onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
                    placeholder="usuario@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-password">Senha</Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={newUser.password}
                    onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
                    placeholder="Senha"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-phone">Telefone</Label>
                  <Input
                    id="user-phone"
                    value={newUser.telefone}
                    onChange={e => setNewUser(u => ({ ...u, telefone: e.target.value }))}
                    placeholder="Telefone"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-role">Tipo</Label>
                  <Select value={newUser.tipo} onValueChange={value => setNewUser(u => ({ ...u, tipo: value, salao_id: '' }))}>
                    <SelectTrigger id="user-role" className="w-full">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system_admin">SuperAdmin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="funcionario">Funcionário</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-salon">Salão</Label>
                  <Select value={newUser.salao_id} onValueChange={value => setNewUser(u => ({ ...u, salao_id: value }))} disabled={!isSalonRequired}>
                    <SelectTrigger id="user-salon" className="w-full" disabled={!isSalonRequired}>
                      <SelectValue placeholder="Selecione o salão" />
                    </SelectTrigger>
                    <SelectContent>
                      {salons.map(salon => (
                        <SelectItem key={salon.id} value={salon.id}>{salon.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {createError && <div className="text-destructive text-sm mt-2">{createError}</div>}
              </div>
              <DialogFooter>
                <Button disabled={!isFormValid || createLoading} onClick={handleCreateUser}>
                  {createLoading ? "Salvando..." : "Cadastrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profiles.length}</div>
              <p className="text-xs text-muted-foreground">
                Usuários cadastrados
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profiles.filter(u => u.tipo === 'admin').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Gestores de salão
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profissionais</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profiles.filter(u => u.tipo === 'funcionario').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Prestadores de serviço
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profiles.filter(u => u.tipo === 'cliente').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Usuários finais
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrar por role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="system_admin">SuperAdmin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="funcionario">Funcionário</SelectItem>
              <SelectItem value="cliente">Cliente</SelectItem>
            </SelectContent>
          </Select>
          <Select value={salonFilter} onValueChange={setSalonFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrar por salão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os salões</SelectItem>
              {salons.map((salon) => (
                <SelectItem key={salon.id} value={salon.id}>
                  {salon.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
            <CardDescription>
              Todos os usuários cadastrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Salão</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={""} />
                          <AvatarFallback>
                            {(user.nome || '').split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.nome}</div>
                          <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(user.tipo)}
                        {getRoleBadge(user.tipo)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.salao_nome || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {user.telefone || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {new Date(user.criado_em).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenRole(user)}>
                            <Shield className="mr-2 h-4 w-4" />
                            Alterar Role
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteUser(user)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setResetUser(user)}>
                            <User className="mr-2 h-4 w-4" />
                            Redefinir senha
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          {/* Modal de redefinição de senha - FORA do map */}
          <Dialog open={!!resetUser} onOpenChange={handleCloseModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Redefinir senha</DialogTitle>
                <DialogDescription>
                  Defina uma nova senha para o usuário <b>{resetUser?.nome}</b>.
                </DialogDescription>
              </DialogHeader>
              <input
                type="password"
                className="input input-bordered w-full mt-2"
                placeholder="Nova senha"
                minLength={6}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <DialogFooter>
                <Button onClick={handleResetPassword} disabled={resetLoading}>
                  {resetLoading ? "Salvando..." : "Salvar nova senha"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Modal de edição de usuário */}
          <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4">
              <DialogHeader>
                <DialogTitle>Editar Usuário</DialogTitle>
                <DialogDescription>Altere os dados do usuário e salve as modificações.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 px-1">
                <div className="space-y-2">
                  <Label htmlFor="edit-user-name">Nome</Label>
                  <Input
                    id="edit-user-name"
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-user-email">E-mail</Label>
                  <Input
                    id="edit-user-email"
                    type="email"
                    value={editForm.email}
                    disabled
                    className="bg-muted cursor-not-allowed"
                    placeholder="usuario@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-user-phone">Telefone</Label>
                  <Input
                    id="edit-user-phone"
                    value={editForm.phone}
                    onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Telefone"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-user-salon">Salão</Label>
                  <Select value={editForm.salon_id} onValueChange={value => setEditForm(f => ({ ...f, salon_id: value }))}>
                    <SelectTrigger id="edit-user-salon" className="w-full">
                      <SelectValue placeholder="Selecione o salão" />
                    </SelectTrigger>
                    <SelectContent>
                      {salons.map(salon => (
                        <SelectItem key={salon.id} value={salon.id}>{salon.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {editError && <div className="text-destructive text-sm mt-2">{editError}</div>}
              </div>
              <DialogFooter>
                <Button disabled={editLoading || !isEditFormValid} onClick={handleEditUser}>
                  {editLoading ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Modal de confirmação de exclusão */}
          <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Excluir usuário</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja excluir o usuário <b>{deleteUser?.name}</b>? Esta ação não poderá ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteUser(null)} disabled={deleteLoading}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDeleteUser} disabled={deleteLoading}>
                  {deleteLoading ? 'Excluindo...' : 'Excluir'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Modal de alteração de tipo */}
          <Dialog open={!!roleUser} onOpenChange={() => setRoleUser(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alterar Tipo</DialogTitle>
                <DialogDescription>
                  Selecione o novo tipo para o usuário <b>{roleUser?.nome}</b>.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 px-1">
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o novo tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system_admin">SuperAdmin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="funcionario">Funcionário</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                  </SelectContent>
                </Select>
                {roleError && <div className="text-destructive text-sm mt-2">{roleError}</div>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRoleUser(null)} disabled={roleLoading}>
                  Cancelar
                </Button>
                <Button onClick={handleChangeRole} disabled={roleLoading || !newRole || newRole === roleUser?.tipo}>
                  {roleLoading ? 'Salvando...' : 'Salvar novo tipo'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default GestaoUsuarios;