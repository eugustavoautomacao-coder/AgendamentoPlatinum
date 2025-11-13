import React from 'react';
import { Input } from './input';
import { formatPhoneNumber, cleanPhoneNumber } from '@/hooks/usePhoneFormat';

interface InputPhoneProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (formatted: string, raw: string) => void;
}

export const InputPhone = React.forwardRef<HTMLInputElement, InputPhoneProps>(
  ({ value, onChange, ...props }, ref) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const cleaned = cleanPhoneNumber(inputValue);
      const formatted = formatPhoneNumber(cleaned);
      onChange(formatted, cleaned);
    };

    // Formatar o valor recebido para exibição
    const displayValue = formatPhoneNumber(value || '');

    return (
      <Input
        {...props}
        ref={ref}
        value={displayValue}
        onChange={handleInputChange}
        placeholder="(11) 99999-9999"
      />
    );
  }
);

InputPhone.displayName = 'InputPhone';







