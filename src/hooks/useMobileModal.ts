import { useEffect, useRef } from 'react';

/**
 * Hook para gerenciar comportamento de modais em dispositivos móveis
 * Previne abertura automática do teclado ao abrir modais
 */
export const useMobileModal = (isOpen: boolean, delay: number = 100) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Função para detectar se é dispositivo móvel
    const isMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
             (typeof window !== 'undefined' && window.innerWidth <= 768);
    };

    // Função para prevenir foco automático em mobile
    const preventAutoFocus = () => {
      if (!isMobile()) return;

      // Encontrar o primeiro input do modal
      const modal = modalRef.current;
      if (!modal) return;

      const firstInput = modal.querySelector('input, textarea, select') as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (!firstInput) return;

      // Armazenar referência do primeiro input
      firstInputRef.current = firstInput;

      // Remover foco imediatamente se o input receber foco
      const handleFocus = (e: FocusEvent) => {
        e.preventDefault();
        e.target?.blur();
      };

      // Adicionar listener temporário
      firstInput.addEventListener('focus', handleFocus, { once: true });

      // Remover listener após um tempo para permitir foco manual
      setTimeout(() => {
        firstInput.removeEventListener('focus', handleFocus);
      }, delay);
    };

    // Aplicar prevenção após um pequeno delay para garantir que o modal esteja renderizado
    const timeoutId = setTimeout(preventAutoFocus, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isOpen, delay]);

  return {
    modalRef,
    firstInputRef,
    // Função para focar no primeiro input manualmente (quando o usuário clicar)
    focusFirstInput: () => {
      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }
    }
  };
};

/**
 * Hook específico para modais de formulário
 * Adiciona funcionalidade extra para formulários
 */
export const useMobileFormModal = (isOpen: boolean, delay: number = 100) => {
  const { modalRef, firstInputRef, focusFirstInput } = useMobileModal(isOpen, delay);

  // Função para focar no primeiro campo quando o usuário tocar no modal
  const handleModalClick = (e: React.MouseEvent) => {
    // Só focar se o clique foi no modal (não em inputs)
    if (e.target === e.currentTarget && firstInputRef.current) {
      focusFirstInput();
    }
  };

  return {
    modalRef,
    firstInputRef,
    focusFirstInput,
    handleModalClick
  };
};
