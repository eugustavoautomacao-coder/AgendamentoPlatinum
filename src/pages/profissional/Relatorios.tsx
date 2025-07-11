import ProfissionalLayout from '@/components/layout/ProfissionalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2 } from 'lucide-react';

const Relatorios = () => (
  <ProfissionalLayout>
    <h1 className="text-2xl font-bold mb-4">Relatórios do Profissional</h1>
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