import ProfissionalLayout from '@/components/layout/ProfissionalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors } from 'lucide-react';

const Servicos = () => (
  <ProfissionalLayout>
    <h1 className="text-2xl font-bold mb-4">Serviços do Profissional</h1>
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