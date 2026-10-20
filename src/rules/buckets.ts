import { startOfDay, differenceInCalendarDays, endOfWeek } from 'date-fns';

export type Bucket = 'today' | 'tomorrow' | 'this_week' | 'later';

/**
 * Determines which bucket a project belongs to based on its deadline and the reference date.
 * Overdue items remain pinned in 'today'.
 */
export function calculateBucket(
  deadline: Date | null,
  referenceDate: Date = new Date()
): Bucket {
  if (!deadline) {
    return 'later';
  }

  const today = startOfDay(referenceDate);
  const targetDate = startOfDay(deadline);
  const deltaDays = differenceInCalendarDays(targetDate, today);

  if (deltaDays <= 0) {
    // Today or overdue
    return 'today';
  }

  if (deltaDays === 1) {
    return 'tomorrow';
  }

  // Days until Sunday of current week (assuming week starts on Monday)
  const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const daysUntilSunday = differenceInCalendarDays(currentWeekEnd, today);

  if (deltaDays <= daysUntilSunday) {
    return 'this_week';
  }

  return 'later';
}
