
import { addDays, differenceInDays, isFuture } from "date-fns";

export const calculateDaysRemaining = (endDate: Date): number | null => {
  if (!endDate) {
    return null;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset hours to compare just the dates
  
  const endDateTime = new Date(endDate);
  endDateTime.setHours(0, 0, 0, 0); // Reset hours to compare just the dates
  
  if (isFuture(endDateTime)) {
    return differenceInDays(endDateTime, today);
  } else {
    return -differenceInDays(today, endDateTime);
  }
};

export const formatDateToLocalString = (date: Date): string => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatDateTimeToLocalString = (date: Date): string => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Calculate if an action is close to deadline (1 day or less)
export const isCloseToDeadline = (endDate: Date): boolean => {
  const daysRemaining = calculateDaysRemaining(endDate);
  return daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 1;
};

// Calculate if an action is within 1 hour of deadline
export const isWithinOneHourOfDeadline = (endDate: Date): boolean => {
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return diffHours > 0 && diffHours <= 1;
};
