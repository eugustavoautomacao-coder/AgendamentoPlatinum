import { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-beauty-salon.jpg";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-6 lg:p-8">
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
            <p>Sistema seguro e confiável para salões de beleza</p>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-20"></div>
        <img 
          src={heroImage} 
          alt="Beauty Salon Management" 
          className="h-full w-full object-cover"
        />
        {/* Alinhamento centralizado verticalmente */}
        <div className="absolute inset-0 flex items-center p-8">
          <div className="text-white max-w-md">
            <h2 className="text-3xl font-bold mb-4">
              Transforme seu Salão
            </h2>
            <p className="text-white/90 text-lg leading-relaxed">
              Sistema completo de gestão para salões de beleza. 
              Agendamentos, equipe e relatórios em uma plataforma segura.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;