import { useState, useMemo } from "react";
import { Plus, Search, Filter, Package, Edit, Trash2, Save, X, DollarSign, Hash, Building, Tag, FileText, Barcode, Package2, User, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useProducts, CreateProductData, UpdateProductData } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";

const Produtos = () => {
  const { products, categories, loading, createProduct, updateProduct, deleteProduct, isCreating, isUpdating, isDeleting } = useProducts();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingProduct, setDeletingProduct] = useState<any>(null);
  const [form, setForm] = useState<CreateProductData>({
    codigo_interno: "",
    nome: "",
    descricao: "",
    categoria: "",
    marca: "",
    preco_custo: 0,
    preco_venda: 0,
    estoque_atual: 0,
    estoque_minimo: 0,
    unidade_medida: "unidade",
    codigo_barras: "",
    fornecedor: "",
    observacoes: "",
    ativo: true
  });

  // Filtrar produtos
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.codigo_interno.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.categoria?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || product.categoria === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Limpar formulário
  const clearForm = () => {
    setForm({
      codigo_interno: "",
      nome: "",
      descricao: "",
      categoria: "",
      marca: "",
      preco_custo: 0,
      preco_venda: 0,
      estoque_atual: 0,
      estoque_minimo: 0,
      unidade_medida: "unidade",
      codigo_barras: "",
      fornecedor: "",
      observacoes: "",
      ativo: true
    });
    setEditingProduct(null);
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
      descricao: product.descricao || "",
      categoria: product.categoria || "",
      marca: product.marca || "",
      preco_custo: product.preco_custo,
      preco_venda: product.preco_venda,
      estoque_atual: product.estoque_atual,
      estoque_minimo: product.estoque_minimo,
      unidade_medida: product.unidade_medida,
      codigo_barras: product.codigo_barras || "",
      fornecedor: product.fornecedor || "",
      observacoes: product.observacoes || "",
      ativo: product.ativo
    });
    setEditingProduct(product);
    setModalOpen(true);
  };

  // Salvar produto
  const handleSave = async () => {
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
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar produto. Tente novamente.",
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
            <p className="text-muted-foreground">Gerencie o estoque de produtos do seu salão</p>
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
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground">Gerencie o estoque de produtos do seu salão</p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? "Atualize as informações do produto" : "Adicione um novo produto ao estoque"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Nome */}
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

              {/* Código Interno e Código de Barras */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="codigo_interno" className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary" />
                    Código Interno *
                  </Label>
                  <Input
                    id="codigo_interno"
                    type="number"
                    value={form.codigo_interno}
                    onChange={(e) => setForm(f => ({ ...f, codigo_interno: e.target.value }))}
                    placeholder="Ex: 001, 123, 456"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="codigo_barras" className="flex items-center gap-2">
                    <Barcode className="h-4 w-4 text-primary" />
                    Código de Barras
                  </Label>
                  <Input
                    id="codigo_barras"
                    value={form.codigo_barras}
                    onChange={(e) => setForm(f => ({ ...f, codigo_barras: e.target.value }))}
                    placeholder="7891234567890"
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

              {/* Categoria e Marca */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="categoria" className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    Categoria
                  </Label>
                  <Input
                    id="categoria"
                    value={form.categoria}
                    onChange={(e) => setForm(f => ({ ...f, categoria: e.target.value }))}
                    placeholder="Ex: Cabelo, Unhas"
                  />
                </div>
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
              </div>

              {/* Preços */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="preco_custo" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Preço de Custo *
                  </Label>
                  <Input
                    id="preco_custo"
                    type="number"
                    step="0.01"
                    value={form.preco_custo}
                    onChange={(e) => setForm(f => ({ ...f, preco_custo: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="preco_venda" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Preço de Venda *
                  </Label>
                  <Input
                    id="preco_venda"
                    type="number"
                    step="0.01"
                    value={form.preco_venda}
                    onChange={(e) => setForm(f => ({ ...f, preco_venda: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Estoque */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="estoque_atual" className="flex items-center gap-2">
                    <Package2 className="h-4 w-4 text-primary" />
                    Estoque Atual *
                  </Label>
                  <Input
                    id="estoque_atual"
                    type="number"
                    value={form.estoque_atual}
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
                    value={form.estoque_minimo}
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

              {/* Fornecedor */}
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

              {/* Observações */}
              <div className="grid gap-2">
                <Label htmlFor="observacoes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Observações
                </Label>
                <Textarea
                  id="observacoes"
                  value={form.observacoes}
                  onChange={(e) => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  placeholder="Observações adicionais..."
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
      <div className="flex flex-col sm:flex-row gap-4">
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
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
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
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-start gap-4 p-4 bg-gradient-card rounded-lg border border-border hover:shadow-soft transition-all duration-200"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-foreground">
                    {product.nome}
                  </h3>
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
                      {product.categoria}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-6 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Preço: R$ {product.preco_venda.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Package2 className="h-3 w-3" />
                    Estoque: {product.estoque_atual} {product.unidade_medida}
                  </div>
                  {product.estoque_atual <= product.estoque_minimo && (
                    <div className="flex items-center gap-1 text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      Estoque Baixo
                    </div>
                  )}
                </div>

                {product.descricao && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 rounded-md p-2 mb-2">
                    <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">{product.descricao}</span>
                  </div>
                )}

                {product.fornecedor && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="text-xs">Fornecedor: {product.fornecedor}</span>
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-foreground">
                  R$ {product.preco_venda.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Preço de venda
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      Excluir
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
          ))}
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

export default Produtos;
