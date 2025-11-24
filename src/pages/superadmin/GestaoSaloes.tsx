import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, MapPin, Phone, Mail, Users, Building2 } from "lucide-react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MobileDialogContent } from "@/components/ui/mobile-dialog-content";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSalons, Salon } from "@/hooks/useSalons";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";

const GestaoSaloes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Verificar se deve abrir o modal de criação automaticamente
  useEffect(() => {
    const shouldCreate = searchParams.get('create');
    if (shouldCreate === 'true') {
      setIsCreateOpen(true);
      // Limpar o parâmetro da URL após abrir o modal
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

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
      // A função deleteSalon já faz a deleção em cascata automaticamente
      const result = await deleteSalon(selectedSalon.id, deleteCascade);

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
      <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">Gestão de Salões</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                Gerencie todos os salões cadastrados no sistema
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="text-xs sm:text-sm px-3 py-2">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Novo Salão</span>
                  <span className="sm:hidden">Novo</span>
                </Button>
              </DialogTrigger>
            <MobileDialogContent 
              isOpen={isCreateOpen}
              className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-2 sm:mx-4"
            >
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
            </MobileDialogContent>
          </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 w-full">
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total de Salões
              </CardTitle>
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{salons?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                +2 novos este mês
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Salões Ativos
              </CardTitle>
              <Badge variant="default" className="h-3 w-3 sm:h-4 sm:w-4 p-0"></Badge>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{salons?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                100% dos salões
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Média de Profissionais
              </CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">3.2</div>
              <p className="text-xs text-muted-foreground">
                Por salão
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Receita Total
              </CardTitle>
              <Badge variant="secondary" className="h-3 w-3 sm:h-4 sm:w-4 p-0"></Badge>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">R$ 124.580</div>
              <p className="text-xs text-muted-foreground">
                +12% este mês
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 w-full">
          {/* Salons List */}
          <div className="lg:col-span-3 w-full">
            <Card className="shadow-elegant w-full">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <span className="truncate">Lista de Salões</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm truncate">
                      {filteredSalons.length} salões cadastrados no sistema
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none min-w-0">
                      <Search className="absolute left-2 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar salões..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-6 sm:pl-8 w-full sm:w-64 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 w-full">
                {/* Mobile View - Cards */}
                <div className="block md:hidden space-y-3">
                  {filteredSalons.map((salon) => (
                    <div
                      key={salon.id}
                      className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-gradient-card rounded-lg border border-border hover:shadow-soft transition-all duration-200 w-full min-w-0"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground text-sm sm:text-base truncate">
                            {salon.name}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                            {salon.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{salon.email}</span>
                              </div>
                            )}
                            {(salon as any).phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{(salon as any).phone}</span>
                              </div>
                            )}
                            {salon.cnpj && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">CNPJ:</span>
                                <span className="truncate">{formatCnpj(salon.cnpj)}</span>
                              </div>
                            )}
                            <div className="text-xs">
                              Criado em {new Date(salon.created_at).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          Ativo
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditSalon(salon)} className="p-1 sm:p-2">
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive p-1 sm:p-2" onClick={() => handleDeleteSalon(salon)}>
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View - Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Salão</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>CNPJ</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSalons.map((salon) => (
                        <TableRow key={salon.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-primary-foreground" />
                              </div>
                              <div>
                                <div className="font-medium">{salon.name}</div>
                                <div className="text-sm text-muted-foreground">ID: {salon.id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {salon.email || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>
                            {salon.cnpj ? formatCnpj(salon.cnpj) : <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">Ativo</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(salon.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Salon Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <MobileDialogContent 
            isOpen={isEditOpen}
            className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-2 sm:mx-4"
          >
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
          </MobileDialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
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