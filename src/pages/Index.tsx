import { Calendar, Scissors, Users, BarChart3, Sparkles, Clock, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const features = [
    {
      icon: Calendar,
      title: "Agendamento Inteligente",
      description: "Sistema de agendamento otimizado para maximizar sua produtividade"
    },
    {
      icon: Scissors,
      title: "Gestão de Serviços",
      description: "Cadastre e gerencie todos os serviços do seu salão"
    },
    {
      icon: Users,
      title: "Equipe & Clientes",
      description: "Organize sua equipe e mantenha base de clientes atualizada"
    },
    {
      icon: BarChart3,
      title: "Relatórios Financeiros",
      description: "Acompanhe receitas, custos e performance do negócio"
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Economia de Tempo",
      description: "Automatize processos e foque no que importa"
    },
    {
      icon: Star,
      title: "Experiência Premium",
      description: "Ofereça experiência excepcional aos seus clientes"
    },
    {
      icon: Shield,
      title: "Dados Seguros",
      description: "Proteção total e isolamento entre salões"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
        <div className="relative container mx-auto px-4 py-16 sm:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <Sparkles className="h-16 w-16 text-primary animate-pulse" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Transforme seu
              <span className="text-transparent bg-gradient-primary bg-clip-text"> Salão de Beleza</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Plataforma completa de gestão multitenant para salões de beleza. 
              Agendamentos, equipe, clientes e relatórios em um só lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" onClick={() => window.location.href = '/login'}>
                Fazer Login
              </Button>
              <Button variant="elegant" size="lg" className="text-lg px-8">
                Ver Demonstração
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Funcionalidades Principais
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tudo que você precisa para gerenciar seu salão com eficiência e profissionalismo
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-gradient-card border-border shadow-elegant hover:shadow-float transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary-soft rounded-lg">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-card py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Por que Escolher Nossa Plataforma?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Benefícios que fazem a diferença no seu dia a dia
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-gradient-primary rounded-full shadow-elegant">
                    <benefit.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gradient-primary rounded-2xl p-8 sm:p-12 text-center shadow-float">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
            Pronto para Começar?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Transforme a gestão do seu salão hoje mesmo. Interface intuitiva, segurança total e suporte especializado.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Solicitar Demonstração
            </Button>
            <Button variant="secondary" size="lg">
              Entrar em Contato
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="text-background/80">
              © 2024 Beauty Salon Manager. Sistema multitenant seguro e confiável.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;