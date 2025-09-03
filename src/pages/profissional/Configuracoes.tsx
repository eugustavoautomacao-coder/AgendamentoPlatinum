import ProfissionalLayout from '@/components/layout/ProfissionalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

const Configuracoes = () => (
  <ProfissionalLayout>
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-pink-500" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">
            Configure suas preferências pessoais
          </p>
        </div>
      </div>
    </div>
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