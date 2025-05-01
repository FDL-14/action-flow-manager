
import { addDays, differenceInDays, isFuture, format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

export const calculateDaysRemaining = (endDate: Date | string | undefined): number | null => {
  if (!endDate) {
    return null;
  }
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset hours to compare just the dates
    
    const endDateTime = new Date(endDate);
    
    // Check if the date is valid
    if (!isValid(endDateTime)) {
      console.warn("Invalid end date:", endDate);
      return null;
    }
    
    endDateTime.setHours(0, 0, 0, 0); // Reset hours to compare just the dates
    
    if (isFuture(endDateTime)) {
      return differenceInDays(endDateTime, today);
    } else {
      return -differenceInDays(today, endDateTime);
    }
  } catch (error) {
    console.error("Error calculating days remaining:", error);
    return null;
  }
};

export const formatDateToLocalString = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (!isValid(dateObj)) {
      console.warn("Invalid date for formatting:", date);
      return "Data inválida";
    }
    
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Data inválida";
  }
};

export const formatDateTimeToLocalString = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (!isValid(dateObj)) {
      console.warn("Invalid date for formatting:", date);
      return "Data inválida";
    }
    
    return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Data inválida";
  }
};

// Calculate if an action is close to deadline (1 day or less)
export const isCloseToDeadline = (endDate: Date | string | undefined): boolean => {
  const daysRemaining = calculateDaysRemaining(endDate);
  return daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 1;
};

// Calculate if an action is within 1 hour of deadline
export const isWithinOneHourOfDeadline = (endDate: Date | string | undefined): boolean => {
  if (!endDate) return false;
  
  try {
    const now = new Date();
    const end = new Date(endDate);
    
    // Check if the date is valid
    if (!isValid(end)) {
      console.warn("Invalid end date for hour check:", endDate);
      return false;
    }
    
    const diffMs = end.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return diffHours > 0 && diffHours <= 1;
  } catch (error) {
    console.error("Error checking if within one hour:", error);
    return false;
  }
};

// Format a date in a localized way with the day and month name
export const formatDateWithDayMonth = (date: Date | string | undefined): string => {
  if (!date) return "Data não definida";
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (!isValid(dateObj)) {
      console.warn("Invalid date for formatting with day month:", date);
      return "Data inválida";
    }
    
    return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch (error) {
    console.error("Error formatting date with day month:", error);
    return "Data inválida";
  }
};
