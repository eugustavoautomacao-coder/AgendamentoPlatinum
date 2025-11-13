import React, { forwardRef } from 'react';
import { DialogContent } from '@/components/ui/dialog';
import { useMobileFormModal } from '@/hooks/useMobileModal';
import { cn } from '@/lib/utils';

interface MobileDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogContent> {
  isOpen: boolean;
  delay?: number;
}

/**
 * Componente DialogContent otimizado para mobile
 * Previne abertura automática do teclado ao abrir modais
 */
export const MobileDialogContent = forwardRef<HTMLDivElement, MobileDialogContentProps>(
  ({ isOpen, delay = 100, className, onClick, ...props }, ref) => {
    const { modalRef, handleModalClick } = useMobileFormModal(isOpen, delay);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      // Chamar o onClick original se fornecido
      onClick?.(e);
      // Chamar o handler do mobile modal
      handleModalClick(e);
    };

    return (
      <DialogContent
        ref={(node) => {
          // Atribuir ambas as refs
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          modalRef.current = node;
        }}
        className={cn(className)}
        onClick={handleClick}
        {...props}
      />
    );
  }
);

MobileDialogContent.displayName = 'MobileDialogContent';
