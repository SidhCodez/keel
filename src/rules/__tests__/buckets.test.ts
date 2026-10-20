import { calculateBucket } from '../buckets';
import { addDays, subDays } from 'date-fns';

describe('calculateBucket (Pure Rule)', () => {
  const refDate = new Date('2026-10-20T10:00:00.000Z'); // Tuesday

  it('TC-BKT-01: returns today for overdue deadlines (past date)', () => {
    const overdue = subDays(refDate, 2);
    expect(calculateBucket(overdue, refDate)).toBe('today');
  });

  it('TC-BKT-02: returns today when deadline equals reference date', () => {
    expect(calculateBucket(refDate, refDate)).toBe('today');
  });

  it('TC-BKT-03: returns tomorrow when deadline is 1 calendar day ahead', () => {
    const tomorrow = addDays(refDate, 1);
    expect(calculateBucket(tomorrow, refDate)).toBe('tomorrow');
  });

  it('TC-BKT-04: returns this_week when deadline falls within the same week', () => {
    // refDate is Tuesday (Oct 20). Friday (Oct 23) is within the same week.
    const friday = addDays(refDate, 3);
    expect(calculateBucket(friday, refDate)).toBe('this_week');
  });

  it('TC-BKT-05: returns later when deadline is beyond coming Sunday', () => {
    // Next week Wednesday (8 days ahead)
    const nextWeek = addDays(refDate, 8);
    expect(calculateBucket(nextWeek, refDate)).toBe('later');
  });

  it('TC-BKT-06: returns later when deadline is null', () => {
    expect(calculateBucket(null, refDate)).toBe('later');
  });
});
