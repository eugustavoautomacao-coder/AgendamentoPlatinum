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
      className: critical 
        ? 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20'
        : 'border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20'
    });
  };

  const handleSuccess = (message: string, description?: string) => {
    toast({
      title: message,
      description,
      className: 'border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20'
    });
  };

  const handleWarning = (message: string, description?: string) => {
    toast({
      variant: "destructive",
      title: message,
      description,
      className: 'border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20'
    });
  };

  const handleInfo = (message: string, description?: string) => {
    toast({
      title: message,
      description,
      className: 'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20'
    });
  };

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo
  };
};
