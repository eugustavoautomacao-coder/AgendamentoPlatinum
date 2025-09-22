import { useState, useMemo } from "react";
import { Search, Filter, Package, Tag, Building, DollarSign, Hash, Package2, AlertCircle, FileText, User, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/hooks/useAuth";

const Produtos = () => {
  const { products, loading } = useProducts();
  const { categories } = useCategories();
  const { profile } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-pink-500" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Lista de Produtos</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Visualize os produtos disponíveis no salão
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 sm:h-8 sm:w-8 text-pink-500" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Lista de Produtos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Visualize os produtos disponíveis no salão
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos por nome, código, marca ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:max-w-sm"
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
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>{category.nome}</SelectItem>
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
                Categoria: {categories.find(c => c.id === selectedCategory)?.nome}
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

      {/* Lista de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Produtos
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {filteredProducts.length} de {products.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {hasActiveFilters ? (
              `${filteredProducts.length} produto${filteredProducts.length !== 1 ? 's' : ''} encontrado${filteredProducts.length !== 1 ? 's' : ''}`
            ) : (
              `Total de ${products.length} produto${products.length !== 1 ? 's' : ''}`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {hasActiveFilters ? (
                  <>
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhum produto encontrado</p>
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
                    <p className="text-lg font-medium">Nenhum produto cadastrado</p>
                    <p className="text-sm">Ainda não há produtos cadastrados no salão</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col sm:flex-row items-start gap-4 p-4 bg-gradient-card rounded-lg border border-border hover:shadow-soft transition-all duration-200"
                  >
                    {/* Informações principais */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="font-semibold text-foreground truncate">
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
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 flex-shrink-0" />
                          <span>R$ {product.para_revenda ? product.preco_venda.toFixed(2) : product.preco_custo.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package2 className="h-3 w-3 flex-shrink-0" />
                          <span>{formatUnidade(product.estoque_atual, product.unidade_medida)}</span>
                        </div>
                        {product.estoque_atual <= product.estoque_minimo && (
                          <div className="flex items-center gap-1 text-destructive text-sm">
                            <AlertCircle className="h-3 w-3" />
                            <span>Estoque Baixo</span>
                          </div>
                        )}
                      </div>

                      {/* Descrição */}
                      {product.descricao && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 rounded-md p-2">
                          <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="text-xs">{product.descricao}</span>
                        </div>
                      )}
                    </div>

                    {/* Preço destacado */}
                    <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
                      {product.para_revenda ? (
                        <div className="text-left sm:text-right">
                          <div className="text-lg font-bold text-foreground">
                            R$ {product.preco_venda.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Preço de venda
                          </div>
                        </div>
                      ) : (
                        <div className="text-left sm:text-right">
                          <div className="text-sm font-medium text-muted-foreground">
                            Produto para consumo interno
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Não comercializado
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Produtos;
