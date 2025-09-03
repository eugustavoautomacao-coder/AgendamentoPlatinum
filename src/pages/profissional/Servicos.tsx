import ProfissionalLayout from '@/components/layout/ProfissionalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors } from 'lucide-react';

const Servicos = () => (
  <ProfissionalLayout>
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        <Scissors className="h-8 w-8 text-pink-500" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Serviços</h1>
          <p className="text-muted-foreground">
            Visualize os serviços disponíveis
          </p>
        </div>
      </div>
    </div>
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Serviços Realizados</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Nenhum serviço realizado.</p>
      </CardContent>
    </Card>
  </ProfissionalLayout>
);

export default Servicos; 