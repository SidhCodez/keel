import { startOfDay, differenceInCalendarDays } from 'date-fns';

/**
 * Calculates the required daily target units to complete a project on time.
 * Returns null if totalUnits is not specified.
 */
export function calculateDailyTarget(
  totalUnits: number | null,
  completedUnits: number,
  deadline: Date | null,
  referenceDate: Date = new Date()
): number | null {
  if (totalUnits === null || totalUnits <= 0) {
    return null;
  }

  const remaining = Math.max(0, totalUnits - completedUnits);
  if (remaining === 0) {
    return 0;
  }

  if (!deadline) {
    return null;
  }

  const today = startOfDay(referenceDate);
  const targetDate = startOfDay(deadline);
  const deltaDays = differenceInCalendarDays(targetDate, today);

  // If due today or overdue, target is all remaining units
  if (deltaDays <= 0) {
    return remaining;
  }

  // Days remaining including today = deltaDays + 1
  return Math.ceil(remaining / (deltaDays + 1));
}
