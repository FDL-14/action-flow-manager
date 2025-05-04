
import { toast as sonnerToast } from 'sonner';

// This helper ensures toast calls are properly formatted
export const toast = {
  ...sonnerToast,
  // Override methods to ensure they have proper arguments
  success: (title: string, options?: { description?: string }) => {
    return sonnerToast.success(title, options || { description: "" });
  },
  error: (title: string, options?: { description?: string }) => {
    return sonnerToast.error(title, options || { description: "" });
  },
  info: (title: string, options?: { description?: string }) => {
    return sonnerToast.info(title, options || { description: "" });
  },
  warning: (title: string, options?: { description?: string }) => {
    return sonnerToast.warning(title, options || { description: "" });
  }
};

// This function helps patch toast calls that don't pass the right number of arguments
export const patchToastCalls = () => {
  // Store original methods
  const originalSuccess = sonnerToast.success;
  const originalError = sonnerToast.error;
  const originalInfo = sonnerToast.info;
  const originalWarning = sonnerToast.warning;
  
  // Override with properly formatted methods
  sonnerToast.success = (message: string, options?: any) => {
    return originalSuccess(message, options || { description: "" });
  };
  
  sonnerToast.error = (message: string, options?: any) => {
    return originalError(message, options || { description: "" });
  };
  
  sonnerToast.info = (message: string, options?: any) => {
    return originalInfo(message, options || { description: "" });
  };
  
  sonnerToast.warning = (message: string, options?: any) => {
    return originalWarning(message, options || { description: "" });
  };
  
  return () => {
    // Restore original methods when cleanup is needed
    sonnerToast.success = originalSuccess;
    sonnerToast.error = originalError;
    sonnerToast.info = originalInfo;
    sonnerToast.warning = originalWarning;
  };
};
