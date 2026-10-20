import { format, subDays, getISODay, parseISO } from 'date-fns';

export interface StreakResult {
  currentStreak: number;
  bestStreak: number;
}

/**
 * Computes the current and best streak for a habit given its scheduled days of week and historical logs.
 * ISO Day: 1 = Monday, ..., 7 = Sunday
 */
export function computeHabitStreak(
  scheduledDaysOfWeek: number[], // e.g. [1,2,3,4,5] for weekdays, or [1..7] for daily
  logs: Map<string, 'completed' | 'frozen' | 'skipped'>,
  referenceDate: Date = new Date()
): StreakResult {
  if (scheduledDaysOfWeek.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const scheduledSet = new Set(scheduledDaysOfWeek);
  const todayStr = format(referenceDate, 'yyyy-MM-dd');
  const todayDayOfWeek = getISODay(referenceDate);

  // Check if today is scheduled and completed
  const isScheduledToday = scheduledSet.has(todayDayOfWeek);
  const todayLog = logs.get(todayStr);
  const completedToday = todayLog === 'completed' || todayLog === 'frozen';

  // Determine starting point for streak walk
  let cursor = completedToday ? referenceDate : subDays(referenceDate, 1);
  let currentStreak = 0;

  // Walk backwards to compute current streak
  for (let i = 0; i < 365; i++) {
    const dayOfWeek = getISODay(cursor);
    const dateStr = format(cursor, 'yyyy-MM-dd');

    if (scheduledSet.has(dayOfWeek)) {
      const status = logs.get(dateStr);
      if (status === 'completed' || status === 'frozen') {
        currentStreak++;
      } else {
        // If today is scheduled but not yet completed, we already started from yesterday,
        // so hitting a non-completed scheduled day breaks the streak.
        break;
      }
    }
    // Non-scheduled days are skipped without breaking the streak

    cursor = subDays(cursor, 1);
  }

  // Calculate best streak from all logs
  let bestStreak = currentStreak;
  // Sort log dates ascending
  const sortedDates = Array.from(logs.keys())
    .filter((d) => logs.get(d) === 'completed' || logs.get(d) === 'frozen')
    .sort();

  let tempStreak = 0;
  let lastDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const date = parseISO(dateStr);
    const dayOfWeek = getISODay(date);

    if (scheduledSet.has(dayOfWeek)) {
      if (!lastDate) {
        tempStreak = 1;
      } else {
        // Verify no missed scheduled days between lastDate and date
        let walk = subDays(date, 1);
        let gapFound = false;
        while (format(walk, 'yyyy-MM-dd') !== format(lastDate, 'yyyy-MM-dd')) {
          if (scheduledSet.has(getISODay(walk))) {
            const status = logs.get(format(walk, 'yyyy-MM-dd'));
            if (status !== 'completed' && status !== 'frozen') {
              gapFound = true;
              break;
            }
          }
          walk = subDays(walk, 1);
        }

        if (gapFound) {
          tempStreak = 1;
        } else {
          tempStreak++;
        }
      }
      lastDate = date;
      if (tempStreak > bestStreak) {
        bestStreak = tempStreak;
      }
    }
  }

  return { currentStreak, bestStreak };
}
