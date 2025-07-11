import ProfissionalLayout from '@/components/layout/ProfissionalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

const Configuracoes = () => (
  <ProfissionalLayout>
    <h1 className="text-2xl font-bold mb-4">Configurações do Profissional</h1>
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Configurações</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Configurações do profissional em breve.</p>
      </CardContent>
    </Card>
  </ProfissionalLayout>
);

export default Configuracoes; 