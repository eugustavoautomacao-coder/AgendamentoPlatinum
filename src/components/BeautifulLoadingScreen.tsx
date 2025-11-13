interface BeautifulLoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export const BeautifulLoadingScreen = ({ 
  message = "Carregando...", 
  subMessage = "Verificando autenticação e carregando perfil" 
}: BeautifulLoadingScreenProps) => {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="flex flex-col items-center justify-center space-y-6 px-4">
        {/* Spinner principal */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin"></div>
        </div>
        
        {/* Texto */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            {message}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            {subMessage}
          </p>
        </div>
        
        {/* Indicador de progresso */}
        <div className="flex items-center justify-center space-x-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-primary rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
