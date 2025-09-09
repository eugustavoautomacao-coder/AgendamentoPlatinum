// Função para comprimir dados antes de enviar para o banco
export const compressData = (data: any): string => {
  try {
    // Converter para JSON e comprimir
    const jsonString = JSON.stringify(data);
    
    // Comprimir usando algoritmo simples (pode usar gzip em produção)
    const compressed = btoa(jsonString);
    
    return compressed;
  } catch (error) {
    console.error('Erro ao comprimir dados:', error);
    return JSON.stringify(data);
  }
};

// Função para descomprimir dados
export const decompressData = (compressedData: string): any => {
  try {
    // Descomprimir
    const jsonString = atob(compressedData);
    
    // Converter de volta para objeto
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Erro ao descomprimir dados:', error);
    return null;
  }
};

// Função para otimizar imagens (se necessário)
export const optimizeImage = async (file: File, maxWidth: number = 800): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calcular nova dimensão mantendo proporção
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // Desenhar imagem redimensionada
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Converter para blob
      canvas.toBlob((blob) => {
        if (blob) {
          const optimizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(optimizedFile);
        } else {
          resolve(file);
        }
      }, 'image/jpeg', 0.8); // 80% de qualidade
    };
    
    img.src = URL.createObjectURL(file);
  });
};
