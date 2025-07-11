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
    name: '',
    email: '',
    password: '',
    role: 'admin',
    salon_id: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Validação visual simples
  const isSalonRequired = newUser.role !== 'superadmin';
  const isFormValid =
    newUser.name.trim() &&
    newUser.email.trim() &&
    newUser.password.trim() &&
    newUser.role &&
    (!isSalonRequired || newUser.salon_id);

  // Buscar usuários apenas quando filtros principais mudarem
  useEffect(() => {
    fetchProfiles({
      role: roleFilter,
      salon_id: salonFilter
    });
  }, [roleFilter, salonFilter, fetchProfiles]);

  // Filtro local instantâneo
  const filteredProfiles = profiles.filter(profile => {
    const search = searchInput.toLowerCase();
    return (
      profile.name.toLowerCase().includes(search) ||
      (profile.salon_name && profile.salon_name.toLowerCase().includes(search)) ||
      (profile.phone && profile.phone.toLowerCase().includes(search))
    );
  });

  useEffect(() => {
    if (!resetUser) setPassword('');
  }, [resetUser]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "superadmin":
        return <Crown className="h-4 w-4" />;
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "profissional":
        return <User className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "superadmin":
        return <Badge variant="default" className="bg-purple-600">SuperAdmin</Badge>;
      case "admin":
        return <Badge variant="default" className="bg-blue-600">Admin</Badge>;
      case "profissional":
        return <Badge variant="secondary">Profissional</Badge>;
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
        "https://vymwodxwwdhjxxzobjha.functions.supabase.co/reset-user-password",
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
      await fetchProfiles({
        role: roleFilter,
        salon_id: salonFilter,
        search: ''
      });
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
                    value={newUser.name}
                    onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))}
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
                  <Label htmlFor="user-role">Role</Label>
                  <Select value={newUser.role} onValueChange={value => setNewUser(u => ({ ...u, role: value }))}>
                    <SelectTrigger id="user-role" className="w-full">
                      <SelectValue placeholder="Selecione o role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-salon">Salão</Label>
                  <Select value={newUser.salon_id} onValueChange={value => setNewUser(u => ({ ...u, salon_id: value }))} disabled={!isSalonRequired}>
                    <SelectTrigger id="user-salon" className="w-full" disabled={!isSalonRequired}>
                      <SelectValue placeholder="Selecione o salão" />
                    </SelectTrigger>
                    <SelectContent>
                      {salons.map(salon => (
                        <SelectItem key={salon.id} value={salon.id}>{salon.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {createError && <div className="text-destructive text-sm mt-2">{createError}</div>}
              </div>
              <DialogFooter>
                <Button disabled={!isFormValid || createLoading} onClick={() => {}}>
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
                {profiles.filter(u => u.role === 'admin').length}
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
                {profiles.filter(u => u.role === 'profissional').length}
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
                {profiles.filter(u => u.role === 'cliente').length}
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
              <SelectItem value="all">Todos os roles</SelectItem>
              <SelectItem value="superadmin">SuperAdmin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="profissional">Profissional</SelectItem>
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
                  {salon.name}
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
                  <TableHead>Role</TableHead>
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
                          <AvatarImage src={user.avatar_url || ""} />
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(user.role)}
                        {getRoleBadge(user.role)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.salon_name || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {user.phone || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Shield className="mr-2 h-4 w-4" />
                            Alterar Role
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
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
                  Defina uma nova senha para o usuário <b>{resetUser?.name}</b>.
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
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default GestaoUsuarios;