import React from 'react';
import { Input } from '@/components/ui/input';
import { usePhoneFormat } from '@/hooks/usePhoneFormat';
import { cn } from '@/lib/utils';

interface InputPhoneProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string;
  onChange?: (formattedValue: string, rawValue: string) => void;
  onValidationChange?: (isValid: boolean, message?: string) => void;
  showValidation?: boolean;
  className?: string;
}

export const InputPhone = React.forwardRef<HTMLInputElement, InputPhoneProps>(
  ({ 
    value = '', 
    onChange, 
    onValidationChange,
    showValidation = false,
    className,
    ...props 
  }, ref) => {
    const {
      value: formattedValue,
      rawValue,
      handleChange,
      setPhoneValue,
      isValid,
      isComplete
    } = usePhoneFormat(value);

    // Atualiza o valor quando a prop value muda
    React.useEffect(() => {
      if (value !== formattedValue) {
        setPhoneValue(value);
      }
    }, [value, formattedValue, setPhoneValue]);

    // Notifica mudanças de validação
    React.useEffect(() => {
      if (onValidationChange) {
        const validation = validatePhoneNumber(formattedValue);
        onValidationChange(validation.isValid, validation.message);
      }
    }, [formattedValue, onValidationChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      handleChange(inputValue);
      
      if (onChange) {
        const formatted = formatPhoneNumber(inputValue);
        const cleaned = cleanPhoneNumber(inputValue);
        onChange(formatted, cleaned);
      }
    };

    return (
      <div className="space-y-1">
        <Input
          ref={ref}
          {...props}
          value={formattedValue}
          onChange={handleInputChange}
          placeholder="(11) 99999-9999"
          className={cn(
            className,
            showValidation && !isValid && rawValue.length > 0 && 'border-red-500 focus:border-red-500',
            showValidation && isValid && 'border-green-500 focus:border-green-500'
          )}
        />
        {showValidation && rawValue.length > 0 && !isValid && (
          <p className="text-xs text-red-500">
            Telefone inválido
          </p>
        )}
        {showValidation && isValid && rawValue.length > 0 && (
          <p className="text-xs text-green-500">
            ✓ Telefone válido
          </p>
        )}
      </div>
    );
  }
);

InputPhone.displayName = 'InputPhone';

// Re-export das funções utilitárias
export { formatPhoneNumber, cleanPhoneNumber, validatePhoneNumber } from '@/hooks/usePhoneFormat';
