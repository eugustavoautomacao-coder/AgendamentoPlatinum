import ProfissionalLayout from '@/components/layout/ProfissionalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const Clientes = () => (
  <ProfissionalLayout>
    <h1 className="text-2xl font-bold mb-4">Clientes do Profissional</h1>
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Lista de Clientes</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Nenhum cliente cadastrado.</p>
      </CardContent>
    </Card>
  </ProfissionalLayout>
);

export default Clientes; 