import { useCallback } from 'react';

export const usePhoneFormat = () => {
  const formatPhoneNumber = useCallback((value: string): string => {
    // Remove todos os caracteres não numéricos
    const cleaned = value.replace(/\D/g, '');
    
    // Aplica a máscara (11) 99999-9999
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 7) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    } else {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    }
  }, []);

  const cleanPhoneNumber = useCallback((value: string): string => {
    return value.replace(/\D/g, '');
  }, []);

  const validatePhoneNumber = useCallback((value: string): boolean => {
    const cleaned = cleanPhoneNumber(value);
    return cleaned.length === 11;
  }, [cleanPhoneNumber]);

  return {
    formatPhoneNumber,
    cleanPhoneNumber,
    validatePhoneNumber
  };
};

