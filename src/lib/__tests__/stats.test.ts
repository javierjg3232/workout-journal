import { describe, expect, it } from '@jest/globals';

import { addDays } from '../dates';
import { currentStreak, workoutsThisMonth, workoutsThisYear } from '../stats';

const TODAY = '2026-07-07';

/** Build workout dates from day offsets relative to TODAY (0 = today, -1 = yesterday…). */
function days(...offsets: number[]): string[] {
  return offsets.map((o) => addDays(TODAY, o));
}

describe('workoutsThisYear', () => {
  it('counts only distinct dates in the current year', () => {
    const dates = ['2026-01-05', '2026-01-05', '2026-03-10', '2025-12-31'];
    expect(workoutsThisYear(dates, TODAY)).toBe(2);
  });

  it('returns 0 with no workouts', () => {
    expect(workoutsThisYear([], TODAY)).toBe(0);
  });
});

describe('workoutsThisMonth', () => {
  it('counts only distinct dates in the current month', () => {
    const dates = ['2026-07-01', '2026-07-01', '2026-07-06', '2026-06-30', '2025-07-15'];
    expect(workoutsThisMonth(dates, TODAY)).toBe(2);
  });

  it('returns 0 with no workouts this month', () => {
    expect(workoutsThisMonth(['2026-06-30'], TODAY)).toBe(0);
  });
});

describe('currentStreak with 0 rest days (strict daily)', () => {
  it('returns 0 with no workouts', () => {
    expect(currentStreak([], 0, TODAY)).toEqual({ days: 0, atRisk: false });
  });

  it('counts consecutive days ending today', () => {
    expect(currentStreak(days(0, -1, -2, -3), 0, TODAY).days).toBe(4);
  });

  it('breaks on a gap', () => {
    // Worked today and 2 days ago, but missed yesterday.
    expect(currentStreak(days(0, -2, -3), 0, TODAY).days).toBe(1);
  });

  it('keeps yesterday-ending streak alive but flags it at risk today', () => {
    const result = currentStreak(days(-1, -2, -3), 0, TODAY);
    expect(result.days).toBe(3);
    expect(result.atRisk).toBe(true);
  });

  it('is not at risk once today is logged', () => {
    expect(currentStreak(days(0, -1), 0, TODAY).atRisk).toBe(false);
  });

  it('returns 0 when the last workout was two days ago', () => {
    expect(currentStreak(days(-2, -3), 0, TODAY).days).toBe(0);
  });
});

describe('currentStreak with rest days allowed', () => {
  it('survives rest days within the allowance', () => {
    // Every-other-day pattern: worked 0, -2, -4, -6. The full 7-day window
    // [0..-6] contains 3 misses, so 3 allowed rest days keep it alive.
    const result = currentStreak(days(0, -2, -4, -6), 3, TODAY);
    expect(result.days).toBe(7);
    expect(result.atRisk).toBe(false);
  });

  it('breaks an every-other-day pattern when the allowance is lower', () => {
    // Same pattern with only 2 rest days allowed: the run stops before -6.
    const result = currentStreak(days(0, -2, -4, -6), 2, TODAY);
    expect(result.days).toBe(5); // -4 through 0
  });

  it('breaks when a rolling week exceeds the allowance', () => {
    // 3 misses (-1, -2, -3) with only 2 allowed: run stops at today.
    const result = currentStreak(days(0, -4, -5, -6), 2, TODAY);
    expect(result.days).toBe(1);
  });

  it('does not count rest days at the edges of the run', () => {
    // Last workout yesterday, rest allowed today: streak still measured to yesterday.
    const result = currentStreak(days(-1, -3, -5), 2, TODAY);
    expect(result.days).toBe(5); // from -5 through -1
  });

  it('flags at-risk when the rest budget for the current week is spent', () => {
    // Worked -1, -3, -5 with 1 rest day/week: missing today would make
    // 2 misses in the last 2 days alone.
    const result = currentStreak(days(-1, -3, -5), 1, TODAY);
    expect(result.atRisk).toBe(true);
  });

  it('is not at-risk when rest budget remains for today', () => {
    // Worked -1 through -6; today would be the only miss of the week.
    const result = currentStreak(days(-1, -2, -3, -4, -5, -6), 2, TODAY);
    expect(result.atRisk).toBe(false);
    expect(result.days).toBe(6);
  });

  it('handles a long backfilled history', () => {
    // Every other day for 60 days. Rolling windows alternate between 3 and 4
    // misses, so 4 allowed rest days keep the whole run alive.
    const offsets = [];
    for (let i = 0; i <= 60; i += 2) offsets.push(-i);
    const result = currentStreak(days(...offsets), 4, TODAY);
    expect(result.days).toBe(61);
  });

  it('clamps out-of-range rest day settings', () => {
    expect(currentStreak(days(0, -1), 99, TODAY).days).toBeGreaterThan(0);
    expect(currentStreak(days(0, -1), -5, TODAY).days).toBe(2);
  });
});
