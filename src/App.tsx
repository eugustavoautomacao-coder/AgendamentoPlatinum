import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./hooks/useAuth";

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

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={profile?.role === 'superadmin' ? '/superadmin' : '/admin'} replace /> : <Index />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to={profile?.role === 'superadmin' ? '/superadmin' : '/admin'} replace />} />
      
      {/* SuperAdmin Routes */}
      <Route path="/superadmin" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminDashboard />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
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
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
