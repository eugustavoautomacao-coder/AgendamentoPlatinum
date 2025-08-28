import { useState, useMemo } from "react";
import { Search, Filter, Package, Tag, Building, DollarSign, Hash, Package2, AlertCircle, FileText, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks/useProducts";
import ProfissionalLayout from "@/components/layout/ProfissionalLayout";

const Produtos = () => {
  const { products, categories, loading } = useProducts();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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
            <p className="text-muted-foreground">Visualize o estoque de produtos do salão</p>
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
    <ProfissionalLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground">Visualize o estoque de produtos do salão</p>
        </div>
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
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Limpar Filtros
          </button>
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
            <p className="text-muted-foreground text-center">
              {hasActiveFilters 
                ? "Tente ajustar os filtros de busca" 
                : "Ainda não há produtos cadastrados no salão"
              }
            </p>
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
            </div>
          ))}
        </div>
      )}
      </div>
    </ProfissionalLayout>
  );
};

export default Produtos;
