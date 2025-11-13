import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./components/AppRouter";
import { ThemeProvider } from "@/hooks/useTheme";
import { EmailNotificationManager } from "@/components/EmailNotificationManager";
import { AuthProvider } from "./hooks/useAuth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as ToastToaster } from "@/components/ui/toaster";
import { useDataSync } from "./hooks/useDataSync";

// Configuração do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 1,
    },
  },
});

function AppRoutes() {
  return <AppRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <BrowserRouter>
              <AppRoutes />
              <EmailNotificationManager />
              <DataSyncWrapper />
              <Toaster />
              <ToastToaster />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// Componente wrapper para usar o hook de sincronização
function DataSyncWrapper() {
  useDataSync();
  return null;
}

export default App;


