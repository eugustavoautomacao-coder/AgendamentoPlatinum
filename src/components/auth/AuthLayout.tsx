import { ReactNode } from "react";
import { Sparkles, Scissors, Calendar, TrendingUp, Shield } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-6 lg:p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-primary rounded-xl shadow-elegant">
                <Sparkles className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground mt-2">{subtitle}</p>
            )}
          </div>

          {/* Form Content */}
          <div className="bg-gradient-card rounded-xl p-6 shadow-elegant border border-border">
            {children}
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Sistema seguro e confiável para sua empresa</p>
          </div>
        </div>
      </div>

      {/* Right Side - Modern Gradient Design */}
      <div className="hidden lg:block relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          {/* Geometric Shapes */}
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow [animation-delay:1s]"></div>
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-primary/5 rounded-full blur-2xl"></div>
          
          {/* Floating Icons */}
          <div className="absolute top-32 right-32 text-primary/60 dark:text-primary/20 animate-float">
            <Scissors className="h-16 w-16 rotate-12" />
          </div>
          <div className="absolute bottom-40 left-40 text-primary/60 dark:text-primary/20 animate-float [animation-delay:0.5s]">
            <Calendar className="h-20 w-20 -rotate-12" />
          </div>
          <div className="absolute top-1/2 left-1/4 text-primary/50 dark:text-primary/15 animate-float [animation-delay:1s]">
            <TrendingUp className="h-14 w-14 rotate-45" />
          </div>
          <div className="absolute bottom-1/4 right-1/4 text-primary/50 dark:text-primary/15 animate-float [animation-delay:1.5s]">
            <Shield className="h-12 w-12" />
          </div>
        </div>

        {/* Content Card */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10 max-w-md w-full border border-gray-200/50 dark:border-gray-700/50">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-primary rounded-xl">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Transforme sua Empresa
                </h2>
              </div>
              
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                Sistema completo de gestão para sua empresa. 
                Agendamentos, equipe e relatórios em uma plataforma segura.
              </p>

              {/* Feature Icons */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Agendamentos</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Relatórios</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Scissors className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Equipe</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Segurança</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;