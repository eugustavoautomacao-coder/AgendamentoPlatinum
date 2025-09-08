import { useAuth } from '@/hooks/useAuth';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

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
import ProfissionalDashboard from '@/pages/profissional/ProfissionalDashboard';
import { ClienteAgendamentos } from '@/pages/ClienteAgendamentos';
import SuperAdminDashboard from '@/pages/superadmin/SuperAdminDashboard';

// Componente de Loading
function LoadingScreen() {
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

// Componente de Erro de Perfil
function ProfileErrorScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
      <Card className="w-full max-w-md mx-auto shadow-elegant border-border">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Erro no Perfil
            </h2>
            <p className="text-sm text-gray-600">
              Não foi possível carregar seu perfil. Tente fazer login novamente.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              Tentar Novamente
            </button>
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
  
  // Redirecionar baseado no tipo de usuário
  const getDefaultRoute = () => {
    switch (profile?.tipo) {
      case 'system_admin':
        return '/superadmin';
      case 'admin':
        return '/dashboard';
      case 'funcionario':
        return '/profissional';
      case 'cliente':
        return '/cliente';
      default:
        return '/dashboard';
    }
  };

  return (
    <Routes>
      {/* Redirecionamento baseado no tipo de usuário */}
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      
      {/* Rotas de Admin */}
      <Route path="/dashboard" element={<AdminDashboard />} />
      <Route path="/agenda" element={<Agenda />} />
      <Route path="/clientes" element={<Clientes />} />
      <Route path="/funcionarios" element={<Profissionais />} />
      <Route path="/servicos" element={<Servicos />} />
      <Route path="/relatorios" element={<Relatorios />} />
      <Route path="/comissoes-mensais" element={<ComissoesMensais />} />
      <Route path="/comissoes" element={<Comissoes />} />
      <Route path="/configuracoes" element={<Configuracoes />} />
      
      {/* Relatórios Detalhados */}
      <Route path="/relatorios/faturamento" element={<Faturamento />} />
      <Route path="/relatorios/comissoes" element={<ComissoesRelatorio />} />
      <Route path="/relatorios/clientes" element={<ClientesRelatorio />} />
      <Route path="/relatorios/servicos" element={<ServicosRelatorio />} />
      <Route path="/relatorios/agendamentos" element={<AgendamentosRelatorio />} />
      <Route path="/relatorios/funcionarios" element={<FuncionariosRelatorio />} />
      <Route path="/relatorios/horarios" element={<HorariosRelatorio />} />
      
      {/* Rotas de Profissional */}
      <Route path="/profissional" element={<ProfissionalDashboard />} />
      
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

  // 3. Estado de Erro: usuário existe mas perfil não foi carregado
  if (user && !profile) {
    return <ProfileErrorScreen />;
  }

  // 4. Estado Não Autenticado: se nenhuma das condições acima for atendida.
  // Garante que o usuário seja direcionado para as rotas públicas.
  return <PublicRoutes />;
}
