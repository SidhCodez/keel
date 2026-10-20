import { calculateDailyTarget } from '../targets';
import { addDays, subDays } from 'date-fns';

describe('calculateDailyTarget (Pure Rule)', () => {
  const refDate = new Date('2026-10-20T10:00:00.000Z');

  it('TC-TGT-01: calculates ceiling daily quota for 30 lessons over 5 days', () => {
    // 30 lessons, 0 done, 5 days remaining (+1 = 6 days) -> ceil(30/6) = 5
    const deadline = addDays(refDate, 5);
    expect(calculateDailyTarget(30, 0, deadline, refDate)).toBe(5);
  });

  it('TC-TGT-02: calculates quota when partially completed', () => {
    // 20 pages, 15 done -> 5 left. Deadline tomorrow (1 day -> +1 = 2 days) -> ceil(5/2) = 3
    const deadline = addDays(refDate, 1);
    expect(calculateDailyTarget(20, 15, deadline, refDate)).toBe(3);
  });

  it('TC-TGT-03: returns all remaining units if due today', () => {
    // 100 pages, 40 done -> 60 remaining, due today -> 60
    expect(calculateDailyTarget(100, 40, refDate, refDate)).toBe(60);
  });

  it('TC-TGT-04: returns all remaining units if overdue', () => {
    const overdue = subDays(refDate, 2);
    expect(calculateDailyTarget(50, 20, overdue, refDate)).toBe(30);
  });

  it('TC-TGT-05: returns 0 when completedUnits equals or exceeds totalUnits', () => {
    const deadline = addDays(refDate, 4);
    expect(calculateDailyTarget(30, 30, deadline, refDate)).toBe(0);
    expect(calculateDailyTarget(30, 35, deadline, refDate)).toBe(0);
  });

  it('TC-TGT-06: returns null when totalUnits is null', () => {
    const deadline = addDays(refDate, 4);
    expect(calculateDailyTarget(null, 0, deadline, refDate)).toBeNull();
  });
});
