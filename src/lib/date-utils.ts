
import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Helper to check if a date is valid
export function isValidDate(date: Date | null | undefined): boolean {
  return date !== null && date !== undefined && isValid(date);
}

// Format a date to a locale string with proper validation
export function formatDateToLocalString(date: Date, locale: string): string {
  if (!isValidDate(date)) {
    return 'Data inválida';
  }
  
  try {
    // Use format from date-fns with ptBR locale regardless of what's passed
    // This ensures consistency in the Portuguese formatting
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Erro ao formatar data';
  }
}
