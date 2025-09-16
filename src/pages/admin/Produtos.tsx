import { useState, useMemo, useRef } from "react";
import { Plus, Search, Filter, Package, Edit, Trash2, Save, X, DollarSign, Hash, Building, Tag, FileText, Barcode, Package2, User, Clock, AlertCircle, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useProducts, CreateProductData, UpdateProductData } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";

const Produtos = () => {
  const { products, loading, createProduct, updateProduct, deleteProduct, checkInternalCodeExists, checkBarcodeExists, isCreating, isUpdating, isDeleting } = useProducts();
  const { categories, createCategory, deleteCategory } = useCategories();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingProduct, setDeletingProduct] = useState<any>(null);
  const [form, setForm] = useState<CreateProductData>({
    codigo_interno: "",
    nome: "",
    categoria_id: "",
    marca: "",
    preco_custo: 0,
    preco_venda: 0,
    preco_profissional: 0,
    estoque_atual: 0,
    estoque_minimo: 0,
    unidade_medida: "unidade",
    codigo_barras: "",
    fornecedor: "",
    descricao: "",
    para_revenda: true,
    ativo: true
  });
  
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<{
    codigo_interno?: string;
    codigo_barras?: string;
  }>({});
  
  const internalCodeTimeoutRef = useRef<NodeJS.Timeout>();
  const barcodeTimeoutRef = useRef<NodeJS.Timeout>();

  // Filtrar produtos
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.codigo_interno.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.categoria?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || product.categoria_id === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Limpar formulário
  const clearForm = () => {
    setForm({
      codigo_interno: "",
      nome: "",
      categoria_id: "",
      marca: "",
      preco_custo: 0,
      preco_venda: 0,
      preco_profissional: 0,
      estoque_atual: 0,
      estoque_minimo: 0,
      unidade_medida: "unidade",
      codigo_barras: "",
      fornecedor: "",
      descricao: "",
      para_revenda: true,
      ativo: true
    });
    setEditingProduct(null);
    setNewCategoryName("");
    setShowCreateCategory(false);
    setValidationErrors({});
  };

  // Criar nova categoria
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const newCategory = await createCategory.mutateAsync({ nome: newCategoryName.trim() });
      setForm(f => ({ ...f, categoria_id: newCategory.id }));
      setNewCategoryName("");
      setShowCreateCategory(false);
      
      toast({
        title: "Categoria criada",
        description: `Categoria "${newCategory.nome}" foi criada com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao criar categoria",
        description: "Não foi possível criar a categoria. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Excluir categoria
  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    
    try {
      await deleteCategory.mutateAsync(deletingCategory.id);
      setDeletingCategory(null);
      
      // Se a categoria excluída estava selecionada, limpar a seleção
      if (form.categoria_id === deletingCategory.id) {
        setForm(f => ({ ...f, categoria_id: "" }));
      }
      
      toast({
        title: "Categoria excluída",
        description: `Categoria "${deletingCategory.nome}" foi excluída com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir categoria",
        description: error.message || "Não foi possível excluir a categoria. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Validar código interno em tempo real
  const validateInternalCode = async (codigo: string) => {
    if (!codigo.trim()) {
      setValidationErrors(prev => ({ ...prev, codigo_interno: undefined }));
      return;
    }

    try {
      const exists = await checkInternalCodeExists(codigo, editingProduct?.id);
      if (exists) {
        setValidationErrors(prev => ({ ...prev, codigo_interno: "Código interno já existe" }));
      } else {
        setValidationErrors(prev => ({ ...prev, codigo_interno: undefined }));
      }
    } catch (error) {
      setValidationErrors(prev => ({ ...prev, codigo_interno: "Erro ao validar código" }));
    }
  };

  // Validar código de barras em tempo real
  const validateBarcode = async (codigo: string) => {
    if (!codigo.trim()) {
      setValidationErrors(prev => ({ ...prev, codigo_barras: undefined }));
      return;
    }

    try {
      const exists = await checkBarcodeExists(codigo, editingProduct?.id);
      if (exists) {
        setValidationErrors(prev => ({ ...prev, codigo_barras: "Código de barras já existe" }));
      } else {
        setValidationErrors(prev => ({ ...prev, codigo_barras: undefined }));
      }
    } catch (error) {
      setValidationErrors(prev => ({ ...prev, codigo_barras: "Erro ao validar código" }));
    }
  };

  // Abrir modal para criar produto
  const handleCreate = () => {
    clearForm();
    setModalOpen(true);
  };

  // Abrir modal para editar produto
  const handleEdit = (product: any) => {
    setForm({
      codigo_interno: product.codigo_interno || "",
      nome: product.nome,
      categoria_id: product.categoria_id || "",
      marca: product.marca || "",
      preco_custo: product.preco_custo,
      preco_venda: product.preco_venda,
      preco_profissional: product.preco_profissional || 0,
      estoque_atual: product.estoque_atual,
      estoque_minimo: product.estoque_minimo,
      unidade_medida: product.unidade_medida,
      codigo_barras: product.codigo_barras || "",
      fornecedor: product.fornecedor || "",
      descricao: product.descricao || "",
      para_revenda: product.para_revenda !== undefined ? product.para_revenda : true,
      ativo: product.ativo
    });
    setEditingProduct(product);
    setModalOpen(true);
  };

  // Função para lidar com mudanças no campo "Para Revenda"
  const handleParaRevendaChange = (value: boolean) => {
    setForm(prev => {
      const newForm = { ...prev, para_revenda: value };
      
      if (!value) {
        // Se não é para revenda, buscar categoria "Consumo" e limpar preço de venda
        const consumoCategory = categories.find(cat => cat.nome === "Consumo");
        newForm.categoria_id = consumoCategory?.id || "";
        newForm.preco_venda = 0;
        // Mantém o preço de custo (não limpa)
      } else {
        // Se é para revenda, limpar a categoria
        newForm.categoria_id = "";
      }
      
      return newForm;
    });
  };


  // Salvar produto
  const handleSave = async () => {
    // Verificar se há erros de validação
    if (validationErrors.codigo_interno || validationErrors.codigo_barras) {
      toast({
        title: "Erro de validação",
        description: "Corrija os erros nos campos antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...form });
        toast({
          title: "Produto atualizado",
          description: "Produto atualizado com sucesso!",
        });
      } else {
        await createProduct.mutateAsync(form);
        toast({
          title: "Produto criado",
          description: "Produto criado com sucesso!",
        });
      }
      setModalOpen(false);
      clearForm();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar produto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Deletar produto
  const handleDelete = async (id: string) => {
    try {
      await deleteProduct.mutateAsync(id);
      toast({
        title: "Produto excluído",
        description: "Produto excluído com sucesso!",
      });
      setDeletingProduct(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir produto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
  };

  const hasActiveFilters = searchTerm || selectedCategory !== "all";

  // Função para formatar unidade de medida (plural/singular)
  const formatUnidade = (quantidade: number, unidade: string) => {
    if (quantidade === 1) {
      return `${quantidade} ${unidade}`;
    }
    
    // Mapear unidades para plural
    const unidadesPlural: { [key: string]: string } = {
      'unidade': 'unidades',
      'kg': 'kg',
      'litro': 'litros',
      'ml': 'ml',
      'g': 'g',
      'caixa': 'caixas',
      'pacote': 'pacotes'
    };
    
    const unidadePlural = unidadesPlural[unidade] || unidade;
    return `${quantidade} ${unidadePlural}`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-pink-500" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
                <p className="text-muted-foreground">
                  Gerencie o estoque de produtos do salão
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
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
          <Package className="h-8 w-8 text-pink-500" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
            <p className="text-muted-foreground">
              Gerencie o estoque de produtos do salão
            </p>
          </div>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Novo Produto</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto modal-scrollbar">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? "Atualize as informações do produto" : "Adicione um novo produto ao estoque"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Nome do Produto e Para Revenda */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome do Produto */}
                <div className="grid gap-2">
                  <Label htmlFor="nome" className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Nome do Produto *
                  </Label>
                  <Input
                    id="nome"
                    value={form.nome}
                    onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
                    placeholder="Ex: Shampoo Hidratante"
                  />
                </div>

                {/* Para Revenda */}
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Package2 className="h-4 w-4 text-primary" />
                    Para Revenda?
                  </Label>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="para_revenda_sim"
                        name="para_revenda"
                        checked={form.para_revenda === true}
                        onChange={() => handleParaRevendaChange(true)}
                        className="h-4 w-4 text-primary focus:ring-primary focus:ring-2 focus:ring-offset-2 border-gray-300"
                        style={{
                          accentColor: 'hsl(var(--primary))'
                        }}
                      />
                      <Label htmlFor="para_revenda_sim" className="text-sm font-normal">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="para_revenda_nao"
                        name="para_revenda"
                        checked={form.para_revenda === false}
                        onChange={() => handleParaRevendaChange(false)}
                        className="h-4 w-4 text-primary focus:ring-primary focus:ring-2 focus:ring-offset-2 border-gray-300"
                        style={{
                          accentColor: 'hsl(var(--primary))'
                        }}
                      />
                      <Label htmlFor="para_revenda_nao" className="text-sm font-normal">Não</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Código Interno e Código de Barras */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="codigo_interno" className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary" />
                    Código Interno *
                  </Label>
                  <Input
                    id="codigo_interno"
                    type="text"
                    value={form.codigo_interno}
                    onChange={(e) => {
                      setForm(f => ({ ...f, codigo_interno: e.target.value }));
                      // Debounce da validação
                      if (internalCodeTimeoutRef.current) {
                        clearTimeout(internalCodeTimeoutRef.current);
                      }
                      internalCodeTimeoutRef.current = setTimeout(() => validateInternalCode(e.target.value), 500);
                    }}
                    placeholder="Ex: 001, 123, 456"
                    className={validationErrors.codigo_interno ? "border-red-500 focus:border-red-500" : ""}
                  />
                  {validationErrors.codigo_interno && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.codigo_interno}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="codigo_barras" className="flex items-center gap-2">
                    <Barcode className="h-4 w-4 text-primary" />
                    Código de Barras
                  </Label>
                  <Input
                    id="codigo_barras"
                    value={form.codigo_barras}
                    onChange={(e) => {
                      setForm(f => ({ ...f, codigo_barras: e.target.value }));
                      // Debounce da validação
                      if (barcodeTimeoutRef.current) {
                        clearTimeout(barcodeTimeoutRef.current);
                      }
                      barcodeTimeoutRef.current = setTimeout(() => validateBarcode(e.target.value), 500);
                    }}
                    placeholder="7891234567890"
                    className={validationErrors.codigo_barras ? "border-red-500 focus:border-red-500" : ""}
                  />
                  {validationErrors.codigo_barras && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.codigo_barras}
                    </p>
                  )}
                </div>
              </div>



              {/* Categoria e Preço de Venda */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="categoria" className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    Categoria
                  </Label>
                  <div className="flex gap-2">
                    <Select value={form.categoria_id} onValueChange={(value) => {
                      if (value === "create-new") {
                        setShowCreateCategory(true);
                      } else {
                        setForm(f => ({ ...f, categoria_id: value }));
                      }
                    }}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.nome}
                          </SelectItem>
                        ))}
                        <SelectItem value="create-new" className="text-primary font-medium">
                          + Criar nova categoria
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {form.categoria_id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-10 w-10">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => {
                              const category = categories.find(cat => cat.id === form.categoria_id);
                              if (category) {
                                setDeletingCategory(category);
                              }
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir categoria
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  
                  {showCreateCategory && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Nome da nova categoria"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
                      />
                      <Button size="sm" onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
                        Criar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setShowCreateCategory(false);
                        setNewCategoryName("");
                      }}>
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
                {form.para_revenda && (
                  <div className="grid gap-2">
                    <Label htmlFor="preco_venda" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Preço de Venda *
                    </Label>
                    <Input
                      id="preco_venda"
                      type="number"
                      step="0.01"
                      value={form.preco_venda || ''}
                      onChange={(e) => setForm(f => ({ ...f, preco_venda: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>

              {/* Preço de Custo - sempre visível */}
              <div className="grid gap-2">
                <Label htmlFor="preco_custo" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Preço de Custo *
                </Label>
                <Input
                  id="preco_custo"
                  type="number"
                  step="0.01"
                  value={form.preco_custo || ''}
                  onChange={(e) => setForm(f => ({ ...f, preco_custo: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>

              {/* Preço Para Profissional - apenas quando é para revenda */}
              {form.para_revenda && (
                <div className="grid gap-2">
                  <Label htmlFor="preco_profissional" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Preço Para Profissional
                  </Label>
                  <Input
                    id="preco_profissional"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.preco_profissional || ''}
                    onChange={(e) => setForm(f => ({ ...f, preco_profissional: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              )}

              {/* Estoque */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="estoque_atual" className="flex items-center gap-2">
                    <Package2 className="h-4 w-4 text-primary" />
                    Estoque Atual *
                  </Label>
                  <Input
                    id="estoque_atual"
                    type="number"
                    value={form.estoque_atual || ''}
                    onChange={(e) => setForm(f => ({ ...f, estoque_atual: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="estoque_minimo" className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    Estoque Mínimo *
                  </Label>
                  <Input
                    id="estoque_minimo"
                    type="number"
                    value={form.estoque_minimo || ''}
                    onChange={(e) => setForm(f => ({ ...f, estoque_minimo: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Unidade de Medida */}
              <div className="grid gap-2">
                <Label htmlFor="unidade_medida" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Unidade de Medida *
                </Label>
                <Select value={form.unidade_medida} onValueChange={(value) => setForm(f => ({ ...f, unidade_medida: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidade">Unidade</SelectItem>
                    <SelectItem value="kg">Quilograma (kg)</SelectItem>
                    <SelectItem value="litro">Litro (L)</SelectItem>
                    <SelectItem value="ml">Mililitro (ml)</SelectItem>
                    <SelectItem value="g">Grama (g)</SelectItem>
                    <SelectItem value="caixa">Caixa</SelectItem>
                    <SelectItem value="pacote">Pacote</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Marca e Fornecedor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="marca" className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" />
                    Marca
                  </Label>
                  <Input
                    id="marca"
                    value={form.marca}
                    onChange={(e) => setForm(f => ({ ...f, marca: e.target.value }))}
                    placeholder="Ex: L'Oréal"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fornecedor" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Fornecedor
                  </Label>
                  <Input
                    id="fornecedor"
                    value={form.fornecedor}
                    onChange={(e) => setForm(f => ({ ...f, fornecedor: e.target.value }))}
                    placeholder="Nome do fornecedor"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="grid gap-2">
                <Label htmlFor="descricao" className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Descrição
                </Label>
                <Textarea
                  id="descricao"
                  value={form.descricao}
                  onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Descrição do produto..."
                  rows={3}
                />
              </div>


            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!form.nome || !form.codigo_interno || isCreating || isUpdating}
              >
                {isCreating || isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingProduct ? "Atualizar" : "Criar"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>{category.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Limpar Filtros</span>
            <span className="sm:hidden">Limpar</span>
          </Button>
        )}
      </div>

      {/* Lista de Produtos */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {hasActiveFilters ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {hasActiveFilters 
                ? "Tente ajustar os filtros de busca" 
                : "Comece adicionando seu primeiro produto ao estoque"
              }
            </p>
            {!hasActiveFilters && (
              <Button onClick={handleCreate} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Adicionar Produto</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Informações principais */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                      <h3 className="font-semibold text-foreground text-base truncate">
                        {product.nome}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="default" className="text-xs">
                          <Hash className="h-3 w-3 mr-1" />
                          {product.codigo_interno}
                        </Badge>
                        {product.marca && (
                          <Badge variant="secondary" className="text-xs">
                            <Building className="h-3 w-3 mr-1" />
                            {product.marca}
                          </Badge>
                        )}
                        {product.categoria && (
                          <Badge variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {product.categoria.nome}
                          </Badge>
                        )}
                        {product.fornecedor && (
                          <Badge variant="secondary" className="text-xs">
                            <User className="h-3 w-3 mr-1" />
                            {product.fornecedor}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Informações de preço e estoque */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <DollarSign className="h-3 w-3 text-primary" />
                        <span>R$ {product.para_revenda ? product.preco_venda.toFixed(2) : product.preco_custo.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Package2 className="h-3 w-3 text-primary" />
                        <span>{formatUnidade(product.estoque_atual, product.unidade_medida)}</span>
                      </div>
                      {product.estoque_atual <= product.estoque_minimo && (
                        <div className="flex items-center gap-1 text-destructive text-sm col-span-2 sm:col-span-1">
                          <AlertCircle className="h-3 w-3" />
                          <span>Estoque Baixo</span>
                        </div>
                      )}
                    </div>

                    {/* Descrição */}
                    {product.descricao && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 rounded-md p-2 mb-2">
                        <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span className="text-xs line-clamp-2">{product.descricao}</span>
                      </div>
                    )}

                  </div>

                  {/* Preço destacado e ações */}
                  <div className="flex flex-col sm:items-end gap-3">
                    {product.para_revenda ? (
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">
                          R$ {product.preco_venda.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Preço de venda
                        </div>
                      </div>
                    ) : (
                      <div className="text-right">
                        <div className="text-sm font-medium text-muted-foreground">
                          Produto para consumo interno
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Não comercializado
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(product)}
                        className="flex-1 sm:flex-none"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Editar</span>
                        <span className="sm:hidden">Editar</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" className="flex-1 sm:flex-none">
                            <Trash2 className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Excluir</span>
                            <span className="sm:hidden">Excluir</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o produto <strong>"{product.nome}"</strong>?
                              <br />
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(product.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>

      {/* Modal de confirmação para exclusão de categoria */}
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão de Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria <strong>"{deletingCategory?.nome}"</strong>?
              <br />
              <br />
              <span className="text-amber-600 font-medium">
                ⚠️ Esta ação não pode ser desfeita e só será possível se não houver produtos associados a esta categoria.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Categoria
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default Produtos;
