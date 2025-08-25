import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, MapPin, Phone, Mail, Users } from "lucide-react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSalons, Salon } from "@/hooks/useSalons";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const GestaoSaloes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [deleteCascade, setDeleteCascade] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cnpj: "",
    adminName: "",
    adminEmail: "",
    adminPassword: ""
  });

  const { salons, loading, createSalon, createSalonAdmin, updateSalon, deleteSalon, refetch } = useSalons();
  const { toast } = useToast();

  // Formata CNPJ no padrão 00.000.000/0000-00
  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    const parts = [] as string[];
    if (digits.length > 0) parts.push(digits.slice(0, 2));
    if (digits.length > 2) parts.push(digits.slice(2, 5));
    if (digits.length > 5) parts.push(digits.slice(5, 8));
    let rest = '';
    if (digits.length > 8) rest = digits.slice(8, 12) + '-' + digits.slice(12, 14);
    const head = parts.length ? parts.join('.') : '';
    return head + (digits.length > 8 ? '/' : '') + rest;
  };

  const filteredSalons = salons?.filter(salon =>
    (salon.nome || salon.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    salon.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleCreateSalon = async () => {
    try {
      // Primeiro criar o salão
      const salonResult = await createSalon({
        nome: formData.nome,
        email: formData.email,
        cnpj: formData.cnpj.replace(/\D/g, '')
      });

      if (salonResult.error) {
        throw new Error("Erro ao criar salão");
      }

      // Depois criar o administrador do salão
      if (salonResult.data && formData.adminEmail && formData.adminPassword && formData.adminName) {
        await createSalonAdmin(salonResult.data.id, {
          name: formData.adminName,
          email: formData.adminEmail,
          password: formData.adminPassword
        });
      }

      setIsCreateOpen(false);
      setFormData({ 
        nome: "", 
        email: "", 
        cnpj: "",
        adminName: "",
        adminEmail: "",
        adminPassword: ""
      });
      toast({ title: 'Salão criado com sucesso!' });
    } catch (error) {
      console.error("Erro ao criar salão:", error);
      toast({ variant: 'destructive', title: 'Erro ao criar salão' });
    }
  };

  const handleEditSalon = (salon: Salon) => {
    setSelectedSalon(salon);
    setFormData({
      nome: salon.nome || salon.name,
      email: salon.email || "",
      cnpj: salon.cnpj || "",
      adminName: "",
      adminEmail: "",
      adminPassword: ""
    });
    setIsEditOpen(true);
  };

  const handleUpdateSalon = async () => {
    if (!selectedSalon) return;

    try {
      await updateSalon(selectedSalon.id, {
        nome: formData.nome,
        email: formData.email || null,
        cnpj: (formData.cnpj ? formData.cnpj.replace(/\D/g, '') : null)
      } as any);

      setIsEditOpen(false);
      setSelectedSalon(null);
      setFormData({ 
        nome: "", 
        email: "", 
        cnpj: "",
        adminName: "",
        adminEmail: "",
        adminPassword: ""
      });
      toast({ title: 'Salão atualizado com sucesso!' });
    } catch (error) {
      console.error("Erro ao atualizar salão:", error);
      toast({ variant: 'destructive', title: 'Erro ao atualizar salão' });
    }
  };

  const handleDeleteSalon = (salon: Salon) => {
    setSelectedSalon(salon);
    setIsDeleteOpen(true);
  };

  const confirmDeleteSalon = async () => {
    if (!selectedSalon) return;

    try {
      if (deleteCascade) {
        // Exclusão em cascata - primeiro remover registros relacionados
        const { error: usersError } = await supabase
          .from('users')
          .delete()
          .eq('salao_id', selectedSalon.id);
        
        if (usersError) {
          console.error('Error deleting users:', usersError);
          throw new Error('Erro ao remover usuários vinculados');
        }

        const { error: employeesError } = await supabase
          .from('employees')
          .delete()
          .eq('salao_id', selectedSalon.id);
        
        if (employeesError) {
          console.error('Error deleting employees:', employeesError);
          throw new Error('Erro ao remover funcionários vinculados');
        }

        const { error: servicesError } = await supabase
          .from('services')
          .delete()
          .eq('salao_id', selectedSalon.id);
        
        if (servicesError) {
          console.error('Error deleting services:', servicesError);
          throw new Error('Erro ao remover serviços vinculados');
        }
      }

      const result = await deleteSalon(selectedSalon.id);

      if (result.error) {
        throw result.error;
      }

      setIsDeleteOpen(false);
      setSelectedSalon(null);
      setDeleteCascade(false);
      
      // Forçar atualização da lista usando refetch
      await refetch();
      
      toast({ title: 'Salão excluído com sucesso!' });
    } catch (error) {
      console.error("Erro ao deletar salão:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir salão';
      toast({ variant: 'destructive', title: 'Erro ao excluir salão', description: errorMessage });
    }
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Carregando...</div>
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
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Salões</h1>
            <p className="text-muted-foreground">
              Gerencie todos os salões cadastrados no sistema
            </p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Salão
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4">
              <DialogHeader>
                <DialogTitle>Criar Novo Salão</DialogTitle>
                <DialogDescription>
                  Adicione um novo salão ao sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 px-1">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Salão</Label>
                  <Input
                    id="name"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Digite o nome do salão"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contato@salao.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData(prev => ({ ...prev, cnpj: formatCnpj(e.target.value) }))}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                </div>

                {/* Separador */}
                <div className="border-t pt-4 space-y-2">
                  <h3 className="text-lg font-medium mb-3">Dados do Administrador</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminName">Nome do Administrador</Label>
                      <Input
                        id="adminName"
                        value={formData.adminName}
                        onChange={(e) => setFormData(prev => ({ ...prev, adminName: e.target.value }))}
                        placeholder="Nome completo do administrador"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="adminEmail">E-mail do Administrador</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={formData.adminEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                        placeholder="admin@salao.com"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="adminPassword">Senha</Label>
                      <Input
                        id="adminPassword"
                        type="password"
                        value={formData.adminPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, adminPassword: e.target.value }))}
                        placeholder="Senha para acesso do administrador"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="w-full sm:w-auto">
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateSalon} className="w-full sm:w-auto">
                    Criar Salão
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Salões</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salons?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                +2 novos este mês
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Salões Ativos</CardTitle>
              <Badge variant="default" className="h-4 w-4 p-0"></Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salons?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                100% dos salões
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média de Profissionais</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.2</div>
              <p className="text-xs text-muted-foreground">
                Por salão
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <Badge variant="secondary" className="h-4 w-4 p-0"></Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 124.580</div>
              <p className="text-xs text-muted-foreground">
                +12% este mês
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar salões..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Salons Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Salões</CardTitle>
            <CardDescription>
              Todos os salões cadastrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSalons.map((salon) => (
                  <TableRow key={salon.id}>
                    <TableCell className="font-medium">{salon.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {salon.email && (
                          <div className="flex items-center text-sm">
                            <Mail className="mr-1 h-3 w-3" />
                            {salon.email}
                          </div>
                        )}
                        {salon.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="mr-1 h-3 w-3" />
                            {salon.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {salon.cnpj && (
                        <div className="flex items-center text-sm">
                          <span className="truncate max-w-[200px]">{formatCnpj(salon.cnpj)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">Ativo</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(salon.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditSalon(salon)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteSalon(salon)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Salon Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle>Editar Salão</DialogTitle>
              <DialogDescription>
                Atualize as informações do salão
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 px-1">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome do Salão</Label>
                <Input
                  id="edit-name"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Digite o nome do salão"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-mail</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contato@salao.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cnpj">CNPJ</Label>
                <Input
                  id="edit-cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnpj: formatCnpj(e.target.value) }))}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditOpen(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button onClick={handleUpdateSalon} className="w-full sm:w-auto">
                  Atualizar Salão
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <p>
                    Tem certeza que deseja excluir o salão "{selectedSalon?.nome || selectedSalon?.name}"? 
                    Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="deleteCascade"
                      checked={deleteCascade}
                      onChange={(e) => setDeleteCascade(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="deleteCascade" className="text-sm">
                      Excluir também todos os usuários, funcionários e serviços vinculados
                    </label>
                  </div>
                  {deleteCascade && (
                    <p className="text-sm text-red-600 font-medium">
                      ⚠️ ATENÇÃO: Esta opção irá remover permanentemente todos os dados relacionados ao salão!
                    </p>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setIsDeleteOpen(false);
                setDeleteCascade(false);
                setSelectedSalon(null);
              }}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteSalon} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteCascade ? 'Excluir Tudo' : 'Excluir Salão'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SuperAdminLayout>
  );
};

export default GestaoSaloes;