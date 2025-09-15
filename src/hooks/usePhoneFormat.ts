import { useState, useCallback } from 'react';

// Função para formatar telefone no padrão brasileiro
export const formatPhoneNumber = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos (DDD + 9 dígitos)
  const limitedNumbers = numbers.slice(0, 11);
  
  // Aplica a formatação baseada no tamanho
  if (limitedNumbers.length <= 2) {
    return limitedNumbers;
  } else if (limitedNumbers.length <= 6) {
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
  } else if (limitedNumbers.length <= 10) {
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 6)}-${limitedNumbers.slice(6)}`;
  } else {
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
  }
};

// Função para limpar o telefone (remover formatação)
export const cleanPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Hook para gerenciar formatação de telefone
export const usePhoneFormat = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);
  const [rawValue, setRawValue] = useState(cleanPhoneNumber(initialValue));

  const handleChange = useCallback((inputValue: string) => {
    const formatted = formatPhoneNumber(inputValue);
    const cleaned = cleanPhoneNumber(inputValue);
    
    setValue(formatted);
    setRawValue(cleaned);
  }, []);

  const setPhoneValue = useCallback((newValue: string) => {
    const formatted = formatPhoneNumber(newValue);
    const cleaned = cleanPhoneNumber(newValue);
    
    setValue(formatted);
    setRawValue(cleaned);
  }, []);

  const reset = useCallback(() => {
    setValue('');
    setRawValue('');
  }, []);

  return {
    value,           // Valor formatado para exibição
    rawValue,        // Valor limpo para salvar no banco
    handleChange,    // Função para onChange do input
    setPhoneValue,   // Função para definir valor programaticamente
    reset,           // Função para limpar
    isValid: rawValue.length >= 10, // Validação básica (DDD + 8 dígitos)
    isComplete: rawValue.length === 11, // Telefone completo (DDD + 9 dígitos)
  };
};

// Validação de telefone brasileiro
export const validatePhoneNumber = (phone: string): { isValid: boolean; message?: string } => {
  const cleaned = cleanPhoneNumber(phone);
  
  if (cleaned.length === 0) {
    return { isValid: true }; // Campo opcional
  }
  
  if (cleaned.length < 10) {
    return { isValid: false, message: 'Telefone deve ter pelo menos 10 dígitos' };
  }
  
  if (cleaned.length > 11) {
    return { isValid: false, message: 'Telefone deve ter no máximo 11 dígitos' };
  }
  
  // Validação de DDD (primeiros 2 dígitos)
  const ddd = cleaned.slice(0, 2);
  const validDDDs = [
    '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
    '21', '22', '24', // RJ
    '27', '28', // ES
    '31', '32', '33', '34', '35', '37', '38', // MG
    '41', '42', '43', '44', '45', '46', // PR
    '47', '48', '49', // SC
    '51', '53', '54', '55', // RS
    '61', // DF
    '62', '64', // GO
    '63', // TO
    '65', '66', // MT
    '67', // MS
    '68', // AC
    '69', // RO
    '71', '73', '74', '75', '77', // BA
    '79', // SE
    '81', '87', // PE
    '82', // AL
    '83', // PB
    '84', // RN
    '85', '88', // CE
    '86', '89', // PI
    '91', '93', '94', // PA
    '92', '97', // AM
    '95', // RR
    '96', // AP
    '98', '99', // MA
  ];
  
  if (!validDDDs.includes(ddd)) {
    return { isValid: false, message: 'DDD inválido' };
  }
  
  // Validação do número (não pode começar com 0 ou 1)
  const number = cleaned.slice(2);
  if (number.startsWith('0') || number.startsWith('1')) {
    return { isValid: false, message: 'Número de telefone inválido' };
  }
  
  return { isValid: true };
};
