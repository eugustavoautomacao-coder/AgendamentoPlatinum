import { useState } from "react";
import { Plus, Search, Edit, Trash2, MapPin, Phone, Mail, Users } from "lucide-react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSalons } from "@/hooks/useSalons";
import { useToast } from "@/hooks/use-toast";

const GestaoSaloes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    adminName: "",
    adminEmail: "",
    adminPassword: ""
  });

  const { salons, loading, createSalon, createSalonAdmin } = useSalons();
  const { toast } = useToast();

  const filteredSalons = salons?.filter(salon =>
    salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    salon.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleCreateSalon = async () => {
    try {
      // Primeiro criar o salão
      const salonResult = await createSalon({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
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
        name: "", 
        email: "", 
        phone: "", 
        address: "",
        adminName: "",
        adminEmail: "",
        adminPassword: ""
      });
    } catch (error) {
      console.error("Erro ao criar salão:", error);
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
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Endereço completo do salão"
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
                  <TableHead>Endereço</TableHead>
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
                      {salon.address && (
                        <div className="flex items-center text-sm">
                          <MapPin className="mr-1 h-3 w-3" />
                          <span className="truncate max-w-[200px]">{salon.address}</span>
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
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
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
      </div>
    </SuperAdminLayout>
  );
};

export default GestaoSaloes;