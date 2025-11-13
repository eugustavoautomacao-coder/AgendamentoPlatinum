import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MobileDialogContent } from '@/components/ui/mobile-dialog-content';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, UserPlus, Shield, User, Edit, Trash2, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  tipo: string;
  salao_id: string;
  salao_nome: string;
  criado_em: string;
}

interface Salon {
  id: string;
  nome: string;
}

const GestaoUsuarios = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [salonFilter, setSalonFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserProfile | null>(null);
  const [roleUser, setRoleUser] = useState<UserProfile | null>(null);
  const [resetUser, setResetUser] = useState<UserProfile | null>(null);
  const [password, setPassword] = useState('');
  const [newRole, setNewRole] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [editError, setEditError] = useState('');
  const [roleError, setRoleError] = useState('');

  const { handleError, handleSuccess } = useErrorHandler();

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'cliente',
    salon_id: ''
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    salon_id: ''
  });

  const isCreateFormValid = createForm.name && createForm.email && createForm.phone && createForm.password && createForm.salon_id;
  const isEditFormValid = editForm.name && editForm.phone && editForm.salon_id;

  useEffect(() => {
    loadProfiles();
    loadSalons();
  }, []);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          nome,
          email,
          telefone,
          tipo,
          salao_id,
          saloes(nome),
          criado_em
        `)
        .order('criado_em', { ascending: false });

      if (error) throw error;

      const profilesWithSalon = data?.map(profile => ({
        ...profile,
        salao_nome: (profile.saloes as any)?.nome || ''
      })) || [];

      setProfiles(profilesWithSalon);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      handleError(error, 'Carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const loadSalons = async () => {
    try {
      const { data, error } = await supabase
        .from('saloes')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setSalons(data || []);
    } catch (error) {
      console.error('Erro ao carregar salões:', error);
      handleError(error, 'Carregar salões');
    }
  };

  const handleCreateUser = async () => {
    if (!isCreateFormValid) return;

    setCreateLoading(true);
    setCreateError('');

    try {
      // Usar edge function para criar usuário
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado');


      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          nome: createForm.name,
          email: createForm.email,
          password: createForm.password,
          tipo: createForm.role,
          salao_id: createForm.salon_id,
          telefone: createForm.phone
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar usuário');
      }

      handleSuccess('Usuário criado com sucesso!');
      setIsCreateOpen(false);
      setCreateForm({ name: '', email: '', phone: '', password: '', role: 'cliente', salon_id: '' });
      loadProfiles();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      handleError(error, 'Criar usuário');
      setCreateError(error.message || 'Erro ao criar usuário');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditUser(user);
    setEditForm({
      name: user.nome,
      email: user.email,
      phone: user.telefone,
      salon_id: user.salao_id
    });
  };

  const handleEditUser = async () => {
    if (!editUser || !isEditFormValid) return;

    setEditLoading(true);
    setEditError('');

    try {
      const { error } = await supabase
        .from('users')
        .update({
          nome: editForm.name,
          telefone: editForm.phone,
          salao_id: editForm.salon_id
        })
        .eq('id', editUser.id);

      if (error) throw error;

      toast.success('Usuário atualizado com sucesso!');
      setEditUser(null);
      loadProfiles();
    } catch (error: any) {
      console.error('Erro ao editar usuário:', error);
      setEditError(error.message || 'Erro ao editar usuário');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;

    setDeleteLoading(true);

    try {
      // Usar edge function para deletar usuário
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ userId: deleteUser.id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir usuário');
      }

      toast.success('Usuário excluído com sucesso!');
      setDeleteUser(null);
      loadProfiles();
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast.error(error.message || 'Erro ao excluir usuário');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenRole = (user: UserProfile) => {
    setRoleUser(user);
    setNewRole(user.tipo);
  };

  const handleChangeRole = async () => {
    if (!roleUser || !newRole || newRole === roleUser.tipo) return;

    setRoleLoading(true);
    setRoleError('');

    try {
      const { error } = await supabase
        .from('users')
        .update({ tipo: newRole })
        .eq('id', roleUser.id);

      if (error) throw error;

      toast.success('Tipo de usuário alterado com sucesso!');
      setRoleUser(null);
      loadProfiles();
    } catch (error: any) {
      console.error('Erro ao alterar tipo:', error);
      setRoleError(error.message || 'Erro ao alterar tipo');
    } finally {
      setRoleLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetUser || !password) return;

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.admin.updateUserById(resetUser.id, {
        password: password
      });

      if (error) throw error;

      toast.success('Senha redefinida com sucesso!');
      setResetUser(null);
      setPassword('');
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      toast.error('Erro ao redefinir senha');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCloseModal = () => {
    setResetUser(null);
    setPassword('');
  };

  const getRoleIcon = (tipo: string) => {
    switch (tipo) {
      case 'system_admin':
        return <Shield className="h-3 w-3 text-red-500" />;
      case 'admin':
        return <Shield className="h-3 w-3 text-blue-500" />;
      case 'funcionario':
        return <User className="h-3 w-3 text-green-500" />;
      case 'cliente':
        return <User className="h-3 w-3 text-gray-500" />;
      default:
        return <User className="h-3 w-3 text-gray-500" />;
    }
  };

  const getRoleBadge = (tipo: string) => {
    const variants = {
      system_admin: 'destructive',
      admin: 'default',
      funcionario: 'secondary',
      cliente: 'outline'
    } as const;

    const labels = {
      system_admin: 'SuperAdmin',
      admin: 'Admin',
      funcionario: 'Funcionário',
      cliente: 'Cliente'
    };

    return (
      <Badge variant={variants[tipo as keyof typeof variants] || 'outline'}>
        {labels[tipo as keyof typeof labels] || tipo}
      </Badge>
    );
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.nome.toLowerCase().includes(searchInput.toLowerCase()) ||
                         profile.email.toLowerCase().includes(searchInput.toLowerCase());
    const matchesRole = roleFilter === 'all' || profile.tipo === roleFilter;
    const matchesSalon = salonFilter === 'all' || profile.salao_id === salonFilter;
    
    return matchesSearch && matchesRole && matchesSalon;
  });

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando usuários...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">Gestão de Usuários</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                Gerencie todos os usuários do sistema
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="text-xs sm:text-sm px-3 py-2">
                  <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Novo Usuário</span>
                  <span className="sm:hidden">Novo</span>
                </Button>
              </DialogTrigger>
              <MobileDialogContent 
                isOpen={isCreateOpen}
                className="max-w-[600px] max-h-[90vh] overflow-y-auto"
              >
              <DialogHeader>
                <DialogTitle>Novo Usuário</DialogTitle>
                <DialogDescription>Preencha os dados para cadastrar um novo usuário.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 px-1">
                <div className="space-y-2">
                    <Label htmlFor="create-user-name">Nome</Label>
                  <Input
                      id="create-user-name"
                      value={createForm.name}
                      onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="create-user-email">E-mail</Label>
                  <Input
                      id="create-user-email"
                    type="email"
                      value={createForm.email}
                      onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="usuario@email.com"
                  />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="create-user-phone">Telefone</Label>
                  <Input
                      id="create-user-phone"
                      value={createForm.phone}
                      onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="Telefone"
                  />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="create-user-password">Senha</Label>
                  <Input
                      id="create-user-password"
                      type="password"
                      value={createForm.password}
                      onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Senha"
                  />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="create-user-role">Tipo</Label>
                    <Select value={createForm.role} onValueChange={value => setCreateForm(f => ({ ...f, role: value }))}>
                      <SelectTrigger id="create-user-role" className="w-full">
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
                    <Label htmlFor="create-user-salon">Salão</Label>
                    <Select value={createForm.salon_id} onValueChange={value => setCreateForm(f => ({ ...f, salon_id: value }))}>
                      <SelectTrigger id="create-user-salon" className="w-full">
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
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={createLoading}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateUser} disabled={createLoading || !isCreateFormValid}>
                    {createLoading ? 'Criando...' : 'Criar usuário'}
                </Button>
              </DialogFooter>
            </MobileDialogContent>
          </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 w-full">
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total de Usuários</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{profiles.length}</div>
              <p className="text-xs text-muted-foreground">
                Usuários cadastrados
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Administradores</CardTitle>
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                {profiles.filter(u => u.tipo === 'admin').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Gestores de salão
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Profissionais</CardTitle>
              <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                {profiles.filter(u => u.tipo === 'funcionario').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Funcionários
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Clientes</CardTitle>
              <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                {profiles.filter(u => u.tipo === 'cliente').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Clientes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 w-full">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
            <SelectTrigger className="w-full sm:w-[200px]">
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
        <Card className="shadow-elegant w-full">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
              <div className="min-w-0 flex-1">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="truncate">Lista de Usuários</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm truncate">
              Todos os usuários cadastrados no sistema
            </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 w-full">
            {/* Mobile View - Cards */}
            <div className="block md:hidden space-y-3">
              {filteredProfiles.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-gradient-card rounded-lg border border-border hover:shadow-soft transition-all duration-200 w-full min-w-0"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                      <AvatarImage src={""} />
                      <AvatarFallback className="text-xs sm:text-sm">
                        {(user.nome || '').split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground text-sm sm:text-base truncate">{user.nome}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          {getRoleIcon(user.tipo)}
                          {getRoleBadge(user.tipo)}
                        </div>
                        {user.salao_nome && (
                          <div className="truncate">
                            <span className="font-medium">Salão:</span> {user.salao_nome}
                          </div>
                        )}
                        {user.telefone && (
                          <div className="truncate">
                            <span className="font-medium">Tel:</span> {user.telefone}
                          </div>
                        )}
                        <div className="text-xs">
                          Criado em {new Date(user.criado_em).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-1 sm:p-2">
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
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
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table className="min-w-[600px]">
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
            </div>
          </CardContent>
        </Card>

        {/* Modal de redefinição de senha */}
          <Dialog open={!!resetUser} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Redefinir senha</DialogTitle>
                <DialogDescription>
                  Defina uma nova senha para o usuário <b>{resetUser?.nome}</b>.
                </DialogDescription>
              </DialogHeader>
            <Input
                type="password"
              className="w-full mt-2"
                placeholder="Nova senha"
                minLength={6}
                required
              value={password || ''}
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
          <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
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
                        <SelectItem key={salon.id} value={salon.id}>{salon.nome}</SelectItem>
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
          <DialogContent className="max-w-[95vw] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Excluir usuário</DialogTitle>
                <DialogDescription>
                Tem certeza que deseja excluir o usuário <b>{deleteUser?.nome}</b>? Esta ação não poderá ser desfeita.
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
          <DialogContent className="max-w-[95vw] sm:max-w-lg">
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
      </div>
    </SuperAdminLayout>
  );
};

export default GestaoUsuarios;