import { useAuth } from '@/hooks/useAuth';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { ProfissionalLoadingScreen } from '@/components/ProfissionalLoadingScreen';

// Importar rotas públicas
import Login from '@/pages/Login';
import ResetPassword from '@/pages/ResetPassword';

// Importar rotas autenticadas
import AdminDashboard from '@/pages/admin/AdminDashboard';
import Agenda from '@/pages/admin/Agenda';
import Clientes from '@/pages/admin/Clientes';
import Profissionais from '@/pages/admin/Profissionais';
import Servicos from '@/pages/admin/Servicos';
import Relatorios from '@/pages/admin/Relatorios';
import ComissoesMensais from '@/pages/admin/ComissoesMensais';
import Comissoes from '@/pages/admin/Comissoes';
import Configuracoes from '@/pages/admin/Configuracoes';

// Importar relatórios
import Faturamento from '@/pages/admin/relatorios/Faturamento';
import ComissoesRelatorio from '@/pages/admin/relatorios/Comissoes';
import ClientesRelatorio from '@/pages/admin/relatorios/Clientes';
import ServicosRelatorio from '@/pages/admin/relatorios/Servicos';
import AgendamentosRelatorio from '@/pages/admin/relatorios/Agendamentos';
import FuncionariosRelatorio from '@/pages/admin/relatorios/Funcionarios';
import HorariosRelatorio from '@/pages/admin/relatorios/Horarios';

// Importar páginas de outros tipos de usuário
import { ClienteAgendamentos } from '@/pages/ClienteAgendamentos';
import SuperAdminDashboard from '@/pages/superadmin/SuperAdminDashboard';

// Importar páginas do profissional
import ProfissionalDashboard from '@/pages/profissional/Dashboard';
import ProfissionalAgenda from '@/pages/profissional/Agenda';
import ProfissionalClientes from '@/pages/profissional/Clientes';
import ProfissionalServicos from '@/pages/profissional/Servicos';
import ProfissionalProdutos from '@/pages/profissional/Produtos';
import ProfissionalComissoes from '@/pages/profissional/Comissoes';
import ProfissionalPerfil from '@/pages/profissional/Perfil';
import ProfissionalLayout from '@/components/layout/ProfissionalLayout';

// Componente de Loading
function LoadingScreen() {
  const { user } = useAuth();
  
  // Se há um usuário autenticado, mostrar loading específico do profissional
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="p-4 lg:p-6 xl:p-8">
          <ProfissionalLoadingScreen />
        </div>
      </div>
    );
  }
  
  // Loading genérico para usuários não autenticados
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
      <Card className="w-full max-w-md mx-auto shadow-elegant border-border">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin text-pink-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Carregando...
            </h2>
            <p className="text-sm text-gray-600">
              Verificando autenticação e carregando perfil
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


// Rotas Públicas
function PublicRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/redefinir-senha" element={<ResetPassword />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// Rotas Autenticadas
function AuthenticatedRoutes() {
  const { profile } = useAuth();
  
  // Debug completo
  console.log('AuthenticatedRoutes - Profile completo:', profile);
  console.log('AuthenticatedRoutes - Profile tipo:', profile?.tipo);
  console.log('AuthenticatedRoutes - URL atual:', window.location.pathname);
  
  // Redirecionar baseado no tipo de usuário
  const getDefaultRoute = () => {
    console.log('getDefaultRoute - Profile tipo:', profile?.tipo); // Debug
    switch (profile?.tipo) {
      case 'system_admin':
        return '/superadmin';
      case 'admin':
        return '/admin';
      case 'funcionario':
        return '/profissional';
      case 'cliente':
        return '/cliente';
      default:
        console.log('Tipo não reconhecido, redirecionando para admin');
        return '/admin';
    }
  };

  return (
    <Routes>
      {/* Redirecionamento baseado no tipo de usuário */}
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      
      {/* Rotas de Profissional - página por página */}
      <Route path="/profissional" element={
        <ProfissionalLayout>
          <ProfissionalDashboard />
        </ProfissionalLayout>
      } />
      <Route path="/profissional/agenda" element={
        <ProfissionalLayout>
          <ProfissionalAgenda />
        </ProfissionalLayout>
      } />
      <Route path="/profissional/clientes" element={
        <ProfissionalLayout>
          <ProfissionalClientes />
        </ProfissionalLayout>
      } />
      <Route path="/profissional/servicos" element={
        <ProfissionalLayout>
          <ProfissionalServicos />
        </ProfissionalLayout>
      } />
      <Route path="/profissional/produtos" element={
        <ProfissionalLayout>
          <ProfissionalProdutos />
        </ProfissionalLayout>
      } />
      <Route path="/profissional/comissoes" element={
        <ProfissionalLayout>
          <ProfissionalComissoes />
        </ProfissionalLayout>
      } />
      <Route path="/profissional/perfil" element={
        <ProfissionalLayout>
          <ProfissionalPerfil />
        </ProfissionalLayout>
      } />
      
      
      {/* Rotas de Admin */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/agenda" element={<Agenda />} />
      <Route path="/admin/clientes" element={<Clientes />} />
      <Route path="/admin/funcionarios" element={<Profissionais />} />
      <Route path="/admin/servicos" element={<Servicos />} />
      <Route path="/admin/relatorios" element={<Relatorios />} />
      <Route path="/admin/comissoes-mensais" element={<ComissoesMensais />} />
      <Route path="/admin/comissoes" element={<Comissoes />} />
      <Route path="/admin/configuracoes" element={<Configuracoes />} />
      
      {/* Relatórios Detalhados */}
      <Route path="/admin/relatorios/faturamento" element={<Faturamento />} />
      <Route path="/admin/relatorios/comissoes" element={<ComissoesRelatorio />} />
      <Route path="/admin/relatorios/clientes" element={<ClientesRelatorio />} />
      <Route path="/admin/relatorios/servicos" element={<ServicosRelatorio />} />
      <Route path="/admin/relatorios/agendamentos" element={<AgendamentosRelatorio />} />
      <Route path="/admin/relatorios/funcionarios" element={<FuncionariosRelatorio />} />
      <Route path="/admin/relatorios/horarios" element={<HorariosRelatorio />} />
      
      {/* Rotas de Cliente */}
      <Route path="/cliente" element={<ClienteAgendamentos />} />
      
      {/* Rotas de Super Admin */}
      <Route path="/superadmin" element={<SuperAdminDashboard />} />
      {/* Redirecionamento padrão */}
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
}

// Componente Principal de Roteamento
export default function AppRouter() {
  const { user, profile, loading } = useAuth();


  // 1. Estado de Carregamento: a primeira e mais importante verificação.
  // Enquanto o Supabase está verificando a sessão ou buscando o perfil, mostre uma tela de loading.
  if (loading) {
    return <LoadingScreen />;
  }

  // 2. Estado Autenticado: a "condição de ouro".
  // Apenas redirecione/mostre as rotas privadas se o usuário E o perfil foram carregados.
  if (user && profile) {
    return <AuthenticatedRoutes />;
  }

  // 3. Estado de Carregamento: usuário existe mas perfil ainda está carregando
  if (user && !profile) {
    return <LoadingScreen />;
  }

  // 4. Estado Não Autenticado: se nenhuma das condições acima for atendida.
  // Garante que o usuário seja direcionado para as rotas públicas.
  return <PublicRoutes />;
}
