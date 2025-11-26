import { useAuth } from '@/hooks/useAuth';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { ProfissionalLoadingScreen } from '@/components/ProfissionalLoadingScreen';

// Importar rotas públicas
import Login from '@/pages/Login';
import ResetPassword from '@/pages/ResetPassword';
import SalaoPublico from '@/pages/SalaoPublico';

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
import SolicitacoesAgendamento from '@/pages/admin/SolicitacoesAgendamento';
import Produtos from '@/pages/admin/Produtos';

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
import GestaoUsuarios from '@/pages/superadmin/GestaoUsuarios';
import GestaoSaloes from '@/pages/superadmin/GestaoSaloes';
import SuperAdminConfiguracoes from '@/pages/superadmin/Configuracoes';
import SuperAdminRelatorios from '@/pages/superadmin/Relatorios';
import Assinaturas from '@/pages/superadmin/Assinaturas';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

// Importar páginas do profissional
import ProfissionalDashboard from '@/pages/profissional/Dashboard';
import ProfissionalAgenda from '@/pages/profissional/Agenda';
import ProfissionalClientes from '@/pages/profissional/Clientes';
import ProfissionalServicos from '@/pages/profissional/Servicos';
import ProfissionalProdutos from '@/pages/profissional/Produtos';
import ProfissionalComissoes from '@/pages/profissional/Comissoes';
import ProfissionalPerfil from '@/pages/profissional/Perfil';
import ProfissionalSolicitacoes from '@/pages/profissional/Solicitacoes';
import ProfissionalLayout from '@/components/layout/ProfissionalLayout';
import { BeautifulLoadingScreen } from '@/components/BeautifulLoadingScreen';

// Componente de Loading
function LoadingScreen() {
  return <BeautifulLoadingScreen />;
}


// Rotas Públicas
function PublicRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/redefinir-senha" element={<ResetPassword />} />
      <Route path="/salao/:salaoId" element={<SalaoPublico />} />
      <Route path="/cliente/:salaoId/agendamentos" element={<ClienteAgendamentos />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// Rotas Autenticadas
function AuthenticatedRoutes() {
  const { profile } = useAuth();
  
  // Log apenas em desenvolvimento e sem dados sensíveis
  if (import.meta.env.DEV) {
    console.log('AuthenticatedRoutes - Profile tipo:', profile?.tipo);
    console.log('AuthenticatedRoutes - URL atual:', window.location.pathname);
  }
  
  // Redirecionar baseado no tipo de usuário
  const getDefaultRoute = () => {
    // Log apenas em desenvolvimento
    if (import.meta.env.DEV) {
      console.log('getDefaultRoute - Profile tipo:', profile?.tipo);
    }
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
      <Route path="/profissional/solicitacoes" element={
        <ProfissionalLayout>
          <ProfissionalSolicitacoes />
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
      <Route path="/admin/solicitacoes" element={<SolicitacoesAgendamento />} />
      <Route path="/admin/produtos" element={<Produtos />} />
      
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
      
      {/* Rotas de Super Admin
          Importante: as páginas de superadmin já incluem SuperAdminLayout
          internamente. Portanto, NÃO devemos embrulhá-las novamente aqui
          para evitar navbar duplicada e problemas de responsividade. */}
      <Route path="/superadmin" element={<SuperAdminDashboard />} />
      <Route path="/superadmin/usuarios" element={<GestaoUsuarios />} />
      <Route path="/superadmin/saloes" element={<GestaoSaloes />} />
      <Route path="/superadmin/configuracoes" element={<SuperAdminConfiguracoes />} />
      <Route path="/superadmin/relatorios" element={<SuperAdminRelatorios />} />
      <Route path="/superadmin/assinaturas" element={<Assinaturas />} />
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
