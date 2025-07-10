import { Scissors, Plus, Clock, DollarSign, Percent } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/layout/AdminLayout";

const Servicos = () => {
  const services = [
    {
      id: 1,
      name: "Corte Feminino",
      duration: 60,
      basePrice: 45.00,
      taxes: { maquina: 5, produto: 8, impostos: 12 },
      category: "Cabelo",
      active: true
    },
    {
      id: 2,
      name: "Escova",
      duration: 45,
      basePrice: 35.00,
      taxes: { maquina: 3, produto: 5, impostos: 12 },
      category: "Cabelo", 
      active: true
    },
    {
      id: 3,
      name: "Coloração",
      duration: 120,
      basePrice: 85.00,
      taxes: { maquina: 8, produto: 15, impostos: 12 },
      category: "Cabelo",
      active: true
    },
    {
      id: 4,
      name: "Manicure",
      duration: 60,
      basePrice: 25.00,
      taxes: { maquina: 2, produto: 3, impostos: 12 },
      category: "Unhas",
      active: true
    },
    {
      id: 5,
      name: "Barba",
      duration: 30,
      basePrice: 20.00,
      taxes: { maquina: 2, produto: 3, impostos: 12 },
      category: "Masculino",
      active: true
    }
  ];

  const calculateFinalPrice = (service: typeof services[0]) => {
    const totalTaxes = service.taxes.maquina + service.taxes.produto + service.taxes.impostos;
    return service.basePrice + totalTaxes;
  };

  const categories = [...new Set(services.map(s => s.category))];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Serviços</h1>
            <p className="text-muted-foreground">
              Gerencie os serviços oferecidos pelo salão
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Serviço
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Serviços
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{services.length}</div>
              <p className="text-xs text-muted-foreground">ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Preço Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                R$ {(services.reduce((acc, s) => acc + calculateFinalPrice(s), 0) / services.length).toFixed(0)}
              </div>
              <p className="text-xs text-muted-foreground">por serviço</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Categorias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{categories.length}</div>
              <p className="text-xs text-muted-foreground">diferentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Duração Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {Math.round(services.reduce((acc, s) => acc + s.duration, 0) / services.length)} min
              </div>
              <p className="text-xs text-muted-foreground">por serviço</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-primary" />
              Lista de Serviços
            </CardTitle>
            <CardDescription>
              Todos os serviços disponíveis no salão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center gap-4 p-4 bg-gradient-card rounded-lg border border-border hover:shadow-soft transition-all duration-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {service.name}
                      </h3>
                      <Badge variant="secondary">
                        {service.category}
                      </Badge>
                      {service.active && (
                        <Badge className="bg-success text-success-foreground">
                          Ativo
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {service.duration} min
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Base: R$ {service.basePrice.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        Taxas: R$ {(service.taxes.maquina + service.taxes.produto + service.taxes.impostos).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">
                      R$ {calculateFinalPrice(service).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Preço final
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Editar
                    </Button>
                    <Button size="sm" variant="outline">
                      Configurar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Configuração de Taxas</CardTitle>
            <CardDescription>
              Configure as taxas padrão aplicadas aos serviços
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-gradient-card rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Taxa de Máquina</span>
                  <span className="text-primary font-bold">5%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Aplicada sobre equipamentos utilizados
                </p>
              </div>
              
              <div className="p-4 bg-gradient-card rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Taxa de Produto</span>
                  <span className="text-primary font-bold">8%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Aplicada sobre produtos utilizados
                </p>
              </div>
              
              <div className="p-4 bg-gradient-card rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Taxa de Impostos</span>
                  <span className="text-primary font-bold">12%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Impostos e tributos aplicados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Servicos;