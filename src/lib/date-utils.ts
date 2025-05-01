
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Format a date to a localized string using date-fns
 */
export const formatDateToLocalString = (date: Date): string => {
  if (!isValidDate(date)) {
    return 'Data inválida';
  }
  
  try {
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Erro ao formatar data';
  }
};

/**
 * Check if a date is valid
 */
export const isValidDate = (date: Date | string | undefined): boolean => {
  if (!date) return false;
  
  try {
    // If it's a string, try to parse it
    if (typeof date === 'string') {
      // Try ISO format first
      if (isValid(parseISO(date))) {
        return true;
      }
      
      // Try creating a new Date from string
      const dateObj = new Date(date);
      return isValid(dateObj);
    }
    
    // If it's already a Date object
    return isValid(date);
  } catch (error) {
    console.error('Error validating date:', error);
    return false;
  }
};

/**
 * Format a date to a Brazilian localized string (dd/MM/yyyy)
 */
export const formatToBrazilianDate = (date: Date | string | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (!isValidDate(dateObj)) {
      return 'Data inválida';
    }
    
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
  } catch (e) {
    console.error('Error formatting date to Brazilian format:', e);
    return 'Erro ao formatar data';
  }
};
