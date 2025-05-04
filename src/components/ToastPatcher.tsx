
import { useEffect } from 'react';
import { patchToastCalls } from '@/lib/toast-helpers';

// This component patches toast calls globally to ensure proper formatting
const ToastPatcher: React.FC = () => {
  useEffect(() => {
    // Patch toast methods
    const cleanup = patchToastCalls();
    
    // Restore original methods when component unmounts
    return cleanup;
  }, []);
  
  // This is just a utility component, it doesn't render anything
  return null;
};

export default ToastPatcher;
