import { computeSlipMetrics } from '../slips';
import { addDays, subDays } from 'date-fns';

describe('computeSlipMetrics (Pure Rule)', () => {
  const deadline = new Date('2026-10-20T10:00:00.000Z');

  it('TC-SLP-01: calculates 0 days late when completed on deadline day', () => {
    const result = computeSlipMetrics(deadline, deadline);
    expect(result.daysLate).toBe(0);
    expect(result.isOnTime).toBe(true);
  });

  it('TC-SLP-02: calculates 0 days late when completed 2 days ahead of deadline', () => {
    const early = subDays(deadline, 2);
    const result = computeSlipMetrics(deadline, early);
    expect(result.daysLate).toBe(0);
    expect(result.isOnTime).toBe(true);
  });

  it('TC-SLP-03: calculates 3 days late when completed 3 calendar days after deadline', () => {
    const late = addDays(deadline, 3);
    const result = computeSlipMetrics(deadline, late);
    expect(result.daysLate).toBe(3);
    expect(result.isOnTime).toBe(false);
  });

  it('TC-SLP-04: returns 0 days late when deadline is null', () => {
    const result = computeSlipMetrics(null, new Date());
    expect(result.daysLate).toBe(0);
    expect(result.isOnTime).toBe(true);
  });
});
