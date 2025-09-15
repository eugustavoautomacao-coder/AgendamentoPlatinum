import { useToast } from '@/hooks/use-toast';
import { getErrorMessage, getErrorTitle, isCriticalError } from '@/utils/errorMessages';

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = (error: any, context?: string) => {
    const errorMessage = getErrorMessage(error);
    const errorTitle = getErrorTitle(error);
    const critical = isCriticalError(error);
    
    const title = context ? `${errorTitle} - ${context}` : errorTitle;
    
    toast({
      variant: "destructive",
      title,
      description: errorMessage,
      className: critical ? 'toast-error-gradient' : 'toast-orange-gradient'
    });
  };

  const handleSuccess = (message: string, description?: string) => {
    toast({
      title: message,
      description,
      className: 'toast-success-gradient'
    });
  };

  const handleWarning = (message: string, description?: string) => {
    toast({
      variant: "destructive",
      title: message,
      description,
      className: 'toast-warning-gradient'
    });
  };

  const handleInfo = (message: string, description?: string) => {
    toast({
      title: message,
      description,
      className: 'toast-info-gradient'
    });
  };

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo
  };
};
