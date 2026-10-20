import { computeHabitStreak } from '../streaks';
import { format, subDays } from 'date-fns';

describe('computeHabitStreak (Pure Rule)', () => {
  const refDate = new Date('2026-10-20T12:00:00.000Z'); // Tuesday (ISO day 2)
  const dailySchedule = [1, 2, 3, 4, 5, 6, 7];

  it('TC-STR-01: calculates 5 consecutive daily completed habits', () => {
    const logs = new Map<string, 'completed' | 'frozen' | 'skipped'>();
    for (let i = 0; i < 5; i++) {
      logs.set(format(subDays(refDate, i), 'yyyy-MM-dd'), 'completed');
    }

    const result = computeHabitStreak(dailySchedule, logs, refDate);
    expect(result.currentStreak).toBe(5);
    expect(result.bestStreak).toBe(5);
  });

  it('TC-STR-02: preserves streak when frozen (rest-day freeze applied)', () => {
    const logs = new Map<string, 'completed' | 'frozen' | 'skipped'>();
    logs.set(format(refDate, 'yyyy-MM-dd'), 'completed');
    logs.set(format(subDays(refDate, 1), 'yyyy-MM-dd'), 'frozen'); // Yesterday frozen
    logs.set(format(subDays(refDate, 2), 'yyyy-MM-dd'), 'completed');

    const result = computeHabitStreak(dailySchedule, logs, refDate);
    expect(result.currentStreak).toBe(3);
  });

  it('TC-STR-03: skips non-scheduled days without breaking streak for weekday habit', () => {
    // Scheduled: Mon-Fri [1, 2, 3, 4, 5]
    // Sunday (subDays 2) and Saturday (subDays 3) are not scheduled
    const weekdaySchedule = [1, 2, 3, 4, 5];
    const logs = new Map<string, 'completed' | 'frozen' | 'skipped'>();
    logs.set(format(refDate, 'yyyy-MM-dd'), 'completed'); // Tuesday (day 2)
    logs.set(format(subDays(refDate, 1), 'yyyy-MM-dd'), 'completed'); // Monday (day 1)
    logs.set(format(subDays(refDate, 4), 'yyyy-MM-dd'), 'completed'); // Previous Friday (day 5)

    const result = computeHabitStreak(weekdaySchedule, logs, refDate);
    expect(result.currentStreak).toBe(3);
  });

  it('TC-STR-04: resets streak if scheduled day was skipped or missing', () => {
    const logs = new Map<string, 'completed' | 'frozen' | 'skipped'>();
    logs.set(format(refDate, 'yyyy-MM-dd'), 'completed');
    // subDays 1 (yesterday) was missed/missing
    logs.set(format(subDays(refDate, 2), 'yyyy-MM-dd'), 'completed');

    const result = computeHabitStreak(dailySchedule, logs, refDate);
    expect(result.currentStreak).toBe(1);
    expect(result.bestStreak).toBeGreaterThanOrEqual(1);
  });
});
