
import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Helper to check if a date is valid
export function isValidDate(date: Date | null | undefined): boolean {
  return date !== null && date !== undefined && isValid(date);
}

// Format a date to a locale string with proper validation
// Adding an optional locale parameter with ptBR as the default
export function formatDateToLocalString(date: Date, locale = ptBR): string {
  if (!isValidDate(date)) {
    return 'Data inválida';
  }
  
  try {
    // Use format from date-fns with the provided locale (defaulting to ptBR)
    return format(date, 'dd/MM/yyyy', { locale });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Erro ao formatar data';
  }
}
