import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Agenda from "./pages/admin/Agenda";
import Clientes from "./pages/admin/Clientes";
import Profissionais from "./pages/admin/Profissionais";
import Servicos from "./pages/admin/Servicos";
import Relatorios from "./pages/admin/Relatorios";
import Configuracoes from "./pages/admin/Configuracoes";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import GestaoSaloes from "./pages/superadmin/GestaoSaloes";
import GestaoUsuarios from "./pages/superadmin/GestaoUsuarios";
import Assinaturas from "./pages/superadmin/Assinaturas";
import SuperAdminRelatorios from "./pages/superadmin/Relatorios";
import SuperAdminConfiguracoes from "./pages/superadmin/Configuracoes";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import ProfissionalDashboard from "./pages/profissional/ProfissionalDashboard";
import ProfissionalAgenda from "./pages/profissional/Agenda";
import ProfissionalClientes from "./pages/profissional/Clientes";
import ProfissionalServicos from "./pages/profissional/Servicos";
import ProfissionalRelatorios from "./pages/profissional/Relatorios";
import ProfissionalConfiguracoes from "./pages/profissional/Configuracoes";
import Perfil from "./pages/Perfil";
import AdminLayout from "@/components/layout/AdminLayout";

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
      <Route path="/admin/relatorios" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Relatorios />
        </ProtectedRoute>
      } />
      <Route path="/admin/configuracoes" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Configuracoes />
        </ProtectedRoute>
      } />
      
      {/* Profissional Routes */}
      <Route path="/profissional" element={
        <ProtectedRoute allowedRoles={['funcionario']}>
          <ProfissionalDashboard />
        </ProtectedRoute>
      } />
      <Route path="/profissional/agenda" element={
        <ProtectedRoute allowedRoles={['profissional']}>
          <ProfissionalAgenda />
        </ProtectedRoute>
      } />
      <Route path="/profissional/clientes" element={
        <ProtectedRoute allowedRoles={['profissional']}>
          <ProfissionalClientes />
        </ProtectedRoute>
      } />
      <Route path="/profissional/servicos" element={
        <ProtectedRoute allowedRoles={['profissional']}>
          <ProfissionalServicos />
        </ProtectedRoute>
      } />
      <Route path="/profissional/relatorios" element={
        <ProtectedRoute allowedRoles={['profissional']}>
          <ProfissionalRelatorios />
        </ProtectedRoute>
      } />
      <Route path="/profissional/configuracoes" element={
        <ProtectedRoute allowedRoles={['profissional']}>
          <ProfissionalConfiguracoes />
        </ProtectedRoute>
      } />
      
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
