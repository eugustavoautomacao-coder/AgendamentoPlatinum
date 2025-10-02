import React from 'react';
import { Input } from './input';
import { usePhoneFormat } from '@/hooks/usePhoneFormat';

interface InputPhoneProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (formatted: string, raw: string) => void;
}

export const InputPhone = React.forwardRef<HTMLInputElement, InputPhoneProps>(
  ({ value, onChange, ...props }, ref) => {
    const { formatPhoneNumber, cleanPhoneNumber } = usePhoneFormat();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formatted = formatPhoneNumber(inputValue);
      const cleaned = cleanPhoneNumber(inputValue);
      onChange(formatted, cleaned);
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={value}
        onChange={handleInputChange}
        placeholder="(11) 99999-9999"
      />
    );
  }
);

InputPhone.displayName = 'InputPhone';





