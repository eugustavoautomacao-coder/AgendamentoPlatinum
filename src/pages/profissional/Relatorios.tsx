import ProfissionalLayout from '@/components/layout/ProfissionalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, BarChart3 } from 'lucide-react';

const Relatorios = () => (
  <ProfissionalLayout>
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-pink-500" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">
            Visualize suas estatísticas e relatórios
          </p>
        </div>
      </div>
    </div>
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Relatórios Disponíveis</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Nenhum relatório disponível.</p>
      </CardContent>
    </Card>
  </ProfissionalLayout>
);

export default Relatorios; 