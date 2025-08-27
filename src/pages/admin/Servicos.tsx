import { Plus, Scissors, DollarSign, Clock, Edit, Trash2, Save, X, Package, Search, Download, Filter, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/layout/AdminLayout";
import { useServices } from '@/hooks/useServices';
import { useSalons, DEFAULT_SERVICES } from '@/hooks/useSalons';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

const Servicos = () => {
  const { services, createService, updateService, deleteService, refetch } = useServices();
  const { addDefaultServicesToExistingSalon } = useSalons();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [editService, setEditService] = useState(null);
  const [form, setForm] = useState({ 
    nome: '', 
    duracao_minutos: 60, 
    preco: 0, 
    categoria: '', 
    descricao: '',
    observacao: ''
  });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [addingDefaultServices, setAddingDefaultServices] = useState(false);

  // Extrair categorias únicas dos serviços
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(services.map(s => s.categoria).filter(Boolean))];
    return uniqueCategories.sort();
  }, [services]);

  // Filtrar serviços baseado no termo de busca e categoria
  const filteredServices = useMemo(() => {
    let filtered = services;

    // Filtrar por categoria
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.categoria === selectedCategory);
    }

    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      filtered = filtered.filter(service =>
        service.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.categoria && service.categoria.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (service.observacao && service.observacao.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [services, searchTerm, selectedCategory]);

  const handleOpenNew = () => {
    setEditService(null);
    setForm({ 
      nome: '', 
      duracao_minutos: 60, 
      preco: 0, 
      categoria: '', 
      descricao: '',
      observacao: ''
    });
    setOpen(true);
  };
  
  const handleOpenEdit = (service) => {
    setEditService(service);
    setForm({
      nome: service.nome,
      duracao_minutos: service.duracao_minutos,
      preco: service.preco,
      categoria: service.categoria || '',
      descricao: service.descricao || '',
      observacao: service.observacao || ''
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

  const handleAddDefaultServices = async () => {
    if (!profile?.salao_id) return;
    
    setAddingDefaultServices(true);
    try {
      await addDefaultServicesToExistingSalon(profile.salao_id);
      refetch(); // Recarregar a lista de serviços
    } finally {
      setAddingDefaultServices(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
  };

  const hasActiveFilters = searchTerm.trim() || (selectedCategory && selectedCategory !== 'all');

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Lista de Serviços</h1>
            <p className="text-muted-foreground">Todos os serviços disponíveis no salão</p>
          </div>
          <div className="flex gap-2">
            {services.length === 0 && (
              <Button 
                variant="outline" 
                onClick={handleAddDefaultServices}
                disabled={addingDefaultServices}
              >
                {addingDefaultServices ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Adicionar Serviços Padrão
                  </>
                )}
              </Button>
            )}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Serviço
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editService ? 'Editar Serviço' : 'Novo Serviço'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nome do Serviço *</label>
                    <Input
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Ex: Corte de Cabelo"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descrição (Opcional)</label>
                    <Input
                      value={form.descricao}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                      placeholder="Descrição detalhada do serviço"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Duração (minutos) *</label>
                      <Input
                        type="number"
                        value={form.duracao_minutos}
                        onChange={(e) => setForm({ ...form, duracao_minutos: parseInt(e.target.value) || 0 })}
                        placeholder="60"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Preço (R$) *</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.preco}
                        onChange={(e) => setForm({ ...form, preco: parseFloat(e.target.value) || 0 })}
                        placeholder="50.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Categoria (Opcional)</label>
                    <Input
                      value={form.categoria}
                      onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                      placeholder="Ex: Cabelo, Unha, Maquiagem"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Observações (Opcional)</label>
                    <Textarea
                      value={form.observacao}
                      onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                      placeholder="Observações adicionais sobre o serviço, instruções especiais, etc."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editService ? 'Atualizar' : 'Criar'}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filtros */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar serviços por nome, categoria ou observações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por Categoria */}
            <div className="w-full sm:w-64">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botão Limpar Filtros */}
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="w-full sm:w-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
          </div>

          {/* Indicadores de Filtros Ativos */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  Busca: "{searchTerm}"
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedCategory && selectedCategory !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  Categoria: {selectedCategory}
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Lista de Serviços */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Serviços
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {filteredServices.length} de {services.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {hasActiveFilters 
                ? `${filteredServices.length} serviço${filteredServices.length !== 1 ? 's' : ''} encontrado${filteredServices.length !== 1 ? 's' : ''}`
                : `Total de ${services.length} serviço${services.length !== 1 ? 's' : ''}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredServices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {hasActiveFilters ? (
                    <>
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Nenhum serviço encontrado</p>
                      <p className="text-sm">Tente ajustar os filtros ou termos de busca</p>
                      <Button 
                        variant="outline" 
                        onClick={clearFilters}
                        className="mt-4"
                      >
                        Limpar Filtros
                      </Button>
                    </>
                  ) : (
                    <>
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Nenhum serviço cadastrado</p>
                      <p className="text-sm">Comece criando seu primeiro serviço ou adicione os serviços padrão</p>
                      <Button 
                        variant="outline" 
                        onClick={handleAddDefaultServices}
                        disabled={addingDefaultServices}
                        className="mt-4"
                      >
                        {addingDefaultServices ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                            Adicionando...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Adicionar {DEFAULT_SERVICES.length} Serviços Padrão
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                filteredServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-start gap-4 p-4 bg-gradient-card rounded-lg border border-border hover:shadow-soft transition-all duration-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {service.nome}
                        </h3>
                        {service.categoria && <Badge variant="secondary">{service.categoria}</Badge>}
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.duracao_minutos} min
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Preço: R$ {Number(service.preco).toFixed(2)}
                        </div>
                      </div>

                      {service.observacao && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 rounded-md p-2">
                          <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="text-xs">{service.observacao}</span>
                        </div>
                      )}
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
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Servicos;