import { startOfDay, differenceInCalendarDays } from 'date-fns';

export interface SlipMetrics {
  daysLate: number;
  isOnTime: boolean;
}

/**
 * Calculates slip metrics upon completion of a project.
 */
export function computeSlipMetrics(
  deadline: Date | null,
  completionDate: Date = new Date()
): SlipMetrics {
  if (!deadline) {
    return { daysLate: 0, isOnTime: true };
  }

  const completionDay = startOfDay(completionDate);
  const deadlineDay = startOfDay(deadline);
  const diffDays = differenceInCalendarDays(completionDay, deadlineDay);

  const daysLate = Math.max(0, diffDays);
  return {
    daysLate,
    isOnTime: daysLate === 0,
  };
}
