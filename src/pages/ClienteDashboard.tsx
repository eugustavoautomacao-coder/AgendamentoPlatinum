import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, Calendar, Settings } from 'lucide-react';

export default function ClienteDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard do Cliente</h1>
            <p className="text-gray-600">Bem-vindo ao seu painel pessoal</p>
          </div>
          <Button 
            onClick={handleLogout} 
            variant="outline" 
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
          >
            <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Sair</span>
            <span className="sm:hidden">Sair</span>
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="shadow-elegant border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Meu Perfil
            </CardTitle>
            <CardDescription>
              Informações da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {profile?.nome?.charAt(0) || 'C'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  {profile?.nome || 'Cliente'}
                </h3>
                <p className="text-gray-600">{profile?.email || user?.email}</p>
                <p className="text-sm text-gray-500">
                  Tipo: {profile?.tipo || 'cliente'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-elegant border-border hover:shadow-soft transition-all duration-200 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Meus Agendamentos
              </CardTitle>
              <CardDescription>
                Visualize e gerencie seus agendamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Ver Agendamentos
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-elegant border-border hover:shadow-soft transition-all duration-200 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Meu Perfil
              </CardTitle>
              <CardDescription>
                Atualize suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Editar Perfil
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-elegant border-border hover:shadow-soft transition-all duration-200 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Configurações
              </CardTitle>
              <CardDescription>
                Personalize sua experiência
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Configurações
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message */}
        <Card className="shadow-elegant border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Bem-vindo ao Sistema Platinum!
              </h2>
              <p className="text-gray-600 mb-4">
                Aqui você pode gerenciar seus agendamentos e informações pessoais.
              </p>
              <p className="text-sm text-gray-500">
                Se precisar de ajuda, entre em contato com o administrador do salão.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


