import ProfissionalLayout from '@/components/layout/ProfissionalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const Clientes = () => (
  <ProfissionalLayout>
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-pink-500" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes e histórico
          </p>
        </div>
      </div>
    </div>
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