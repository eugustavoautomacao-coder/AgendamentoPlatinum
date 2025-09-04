import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { EmailNotificationManager } from "@/components/EmailNotificationManager";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Agenda from "./pages/admin/Agenda";
import Clientes from "./pages/admin/Clientes";
import Profissionais from "./pages/admin/Profissionais";
import Servicos from "./pages/admin/Servicos";
import Produtos from "./pages/admin/Produtos";
import SolicitacoesAgendamento from "./pages/admin/SolicitacoesAgendamento";
import Relatorios from "./pages/admin/Relatorios";
import RelatorioFaturamento from "./pages/admin/relatorios/Faturamento";
import RelatorioComissoes from "./pages/admin/relatorios/Comissoes";
import RelatorioClientes from "./pages/admin/relatorios/Clientes";
import RelatorioServicos from "./pages/admin/relatorios/Servicos";
import RelatorioAgendamentos from "./pages/admin/relatorios/Agendamentos";
import RelatorioFuncionarios from "./pages/admin/relatorios/Funcionarios";
import RelatorioHorarios from "./pages/admin/relatorios/Horarios";
import Configuracoes from "./pages/admin/Configuracoes";
import { ConfiguracoesEmail } from "./pages/admin/ConfiguracoesEmail";
import Comissoes from "./pages/admin/Comissoes";
import ComissoesMensais from "./pages/admin/ComissoesMensais";
import SalaoPublico from "./pages/SalaoPublico";
import { ClienteAgendamentos } from "./pages/ClienteAgendamentos";
import { ClienteHistorico } from "./pages/ClienteHistorico";
import { TesteEmail } from "./pages/TesteEmail";
import ClienteLogin from "./pages/ClienteLogin";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import GestaoSaloes from "./pages/superadmin/GestaoSaloes";
import GestaoUsuarios from "./pages/superadmin/GestaoUsuarios";
import Assinaturas from "./pages/superadmin/Assinaturas";
import SuperAdminRelatorios from "./pages/superadmin/Relatorios";
import SuperAdminConfiguracoes from "./pages/superadmin/Configuracoes";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ClienteAuthProvider } from "./hooks/useClienteAuth";
import ProfissionalDashboard from "./pages/profissional/ProfissionalDashboard";
import ProfissionalAgenda from "./pages/profissional/Agenda";
import ProfissionalClientes from "./pages/profissional/Clientes";
import ProfissionalServicos from "./pages/profissional/Servicos";
import ProfissionalProdutos from "./pages/profissional/Produtos";
import ProfissionalRelatorios from "./pages/profissional/Relatorios";
import ProfissionalConfiguracoes from "./pages/profissional/Configuracoes";
import ProfissionalSolicitacoes from "./pages/profissional/SolicitacoesAgendamento";
import Perfil from "./pages/Perfil";

const queryClient = new QueryClient();

// Protected Route component
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.tipo)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={
        profile?.tipo === 'system_admin' ? '/superadmin'
        : profile?.tipo === 'admin' ? '/admin'
        : profile?.tipo === 'funcionario' ? '/profissional'
        : '/'} replace /> : <Index />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to={
        profile?.tipo === 'system_admin' ? '/superadmin'
        : profile?.tipo === 'admin' ? '/admin'
        : profile?.tipo === 'funcionario' ? '/profissional'
        : '/'} replace />} />
      <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
      
      {/* SuperAdmin Routes */}
      <Route path="/superadmin" element={
        <ProtectedRoute allowedRoles={['system_admin']}>
          <SuperAdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/saloes" element={
        <ProtectedRoute allowedRoles={['system_admin']}>
          <GestaoSaloes />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/usuarios" element={
        <ProtectedRoute allowedRoles={['system_admin']}>
          <GestaoUsuarios />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/assinaturas" element={
        <ProtectedRoute allowedRoles={['system_admin']}>
          <Assinaturas />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/relatorios" element={
        <ProtectedRoute allowedRoles={['system_admin']}>
          <SuperAdminRelatorios />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/configuracoes" element={
        <ProtectedRoute allowedRoles={['system_admin']}>
          <SuperAdminConfiguracoes />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes padrão antigo */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/agenda" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Agenda />
        </ProtectedRoute>
      } />
      <Route path="/admin/clientes" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Clientes />
        </ProtectedRoute>
      } />
      <Route path="/admin/profissionais" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Profissionais />
        </ProtectedRoute>
      } />
      <Route path="/admin/servicos" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Servicos />
        </ProtectedRoute>
      } />
      <Route path="/admin/produtos" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Produtos />
        </ProtectedRoute>
      } />
      <Route path="/admin/solicitacoes-agendamento" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <SolicitacoesAgendamento />
        </ProtectedRoute>
      } />
      <Route path="/admin/comissoes" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Comissoes />
        </ProtectedRoute>
      } />
      <Route path="/admin/comissoes-mensais" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ComissoesMensais />
        </ProtectedRoute>
      } />
      <Route path="/admin/relatorios" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Relatorios />
        </ProtectedRoute>
      } />
      {/* Rotas de Relatórios */}
      <Route path="/admin/relatorios/faturamento" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <RelatorioFaturamento />
        </ProtectedRoute>
      } />
      <Route path="/admin/relatorios/comissoes" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <RelatorioComissoes />
        </ProtectedRoute>
      } />
      <Route path="/admin/relatorios/clientes" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <RelatorioClientes />
        </ProtectedRoute>
      } />
      <Route path="/admin/relatorios/servicos" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <RelatorioServicos />
        </ProtectedRoute>
      } />
      <Route path="/admin/relatorios/agendamentos" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <RelatorioAgendamentos />
        </ProtectedRoute>
      } />
      <Route path="/admin/relatorios/funcionarios" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <RelatorioFuncionarios />
        </ProtectedRoute>
      } />
      <Route path="/admin/relatorios/horarios" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <RelatorioHorarios />
        </ProtectedRoute>
      } />
      <Route path="/admin/configuracoes" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Configuracoes />
        </ProtectedRoute>
      } />
      <Route path="/admin/configuracoes-email" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ConfiguracoesEmail />
        </ProtectedRoute>
      } />
      
      {/* Profissional Routes */}
      <Route path="/profissional" element={
        <ProtectedRoute allowedRoles={['funcionario']}>
          <ProfissionalDashboard />
        </ProtectedRoute>
      } />
      <Route path="/profissional/agenda" element={
        <ProtectedRoute allowedRoles={['funcionario']}>
          <ProfissionalAgenda />
        </ProtectedRoute>
      } />
      <Route path="/profissional/solicitacoes" element={
        <ProtectedRoute allowedRoles={['funcionario']}>
          <ProfissionalSolicitacoes />
        </ProtectedRoute>
      } />
      <Route path="/profissional/clientes" element={
        <ProtectedRoute allowedRoles={['funcionario']}>
          <ProfissionalClientes />
        </ProtectedRoute>
      } />
      <Route path="/profissional/servicos" element={
        <ProtectedRoute allowedRoles={['funcionario']}>
          <ProfissionalServicos />
        </ProtectedRoute>
      } />
      <Route path="/profissional/produtos" element={
        <ProtectedRoute allowedRoles={['funcionario']}>
          <ProfissionalProdutos />
        </ProtectedRoute>
      } />
      <Route path="/profissional/relatorios" element={
        <ProtectedRoute allowedRoles={['funcionario']}>
          <ProfissionalRelatorios />
        </ProtectedRoute>
      } />
      <Route path="/profissional/configuracoes" element={
        <ProtectedRoute allowedRoles={['funcionario']}>
          <ProfissionalConfiguracoes />
        </ProtectedRoute>
      } />
      
      {/* Public Routes - Autoatendimento */}
      <Route path="/salao/:salaoId" element={
        <ClienteAuthProvider>
          <SalaoPublico />
        </ClienteAuthProvider>
      } />
      <Route path="/cliente/:salaoId/login" element={
        <ClienteAuthProvider>
          <ClienteLogin />
        </ClienteAuthProvider>
      } />
      <Route path="/cliente/:salaoId/agendamentos" element={
        <ClienteAuthProvider>
          <ClienteAgendamentos />
        </ClienteAuthProvider>
      } />
              <Route path="/cliente/:salaoId/historico" element={
          <ClienteAuthProvider>
            <ClienteHistorico />
          </ClienteAuthProvider>
        } />
        
        {/* Rota de teste de email */}
        <Route path="/teste-email" element={<TesteEmail />} />
      
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <BrowserRouter>
              <AppRoutes />
              <EmailNotificationManager 
                enabled={true}
                intervalMinutes={30}
                reminderHours={[24, 2]}
              />
              <Toaster />
              <Sonner />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
