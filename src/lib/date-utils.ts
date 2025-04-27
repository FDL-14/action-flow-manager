
export const calculateDaysRemaining = (endDate: Date | string) => {
  const end = new Date(endDate);
  const today = new Date();
  
  // Reset time to compare only dates
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const timeDiff = end.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  return daysDiff;
};
