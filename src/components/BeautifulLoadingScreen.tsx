interface BeautifulLoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export const BeautifulLoadingScreen = ({ 
  message = "Carregando...", 
  subMessage = "Verificando autenticação e carregando perfil" 
}: BeautifulLoadingScreenProps) => {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-8">
        {/* Animação profissional com múltiplos círculos */}
        <div className="relative w-20 h-20">
          {/* Círculo externo */}
          <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
          
          {/* Círculo médio */}
          <div className="absolute inset-2 border-3 border-gray-700 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
          
          {/* Círculo interno com gradiente */}
          <div className="absolute inset-4 border-2 border-transparent border-t-pink-500 border-r-pink-400 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
          
          {/* Ponto central pulsante */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-pink-500 rounded-full animate-pulse"></div>
        </div>
        
        {/* Texto principal com efeito de digitação */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-light text-white tracking-wide">
            {message}
          </h2>
          <div className="w-1 h-6 bg-pink-500 mx-auto animate-pulse"></div>
          <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
            {subMessage}
          </p>
        </div>
        
        {/* Indicador de progresso sofisticado */}
        <div className="flex space-x-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.5s'
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};
