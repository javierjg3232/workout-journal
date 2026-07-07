import { addDays, yearOf } from './dates';

export interface StreakInfo {
  /** Calendar days from the oldest to the newest workout in the unbroken run. */
  days: number;
  /** True when the user hasn't worked out today and skipping today will break the streak. */
  atRisk: boolean;
}

const MAX_LOOKBACK_DAYS = 3660; // ~10 years

/** Number of distinct workout days in the same year as `today`. */
export function workoutsThisYear(dateKeys: Iterable<string>, today: string): number {
  const year = yearOf(today);
  let count = 0;
  const seen = new Set<string>();
  for (const key of dateKeys) {
    if (yearOf(key) === year && !seen.has(key)) {
      seen.add(key);
      count++;
    }
  }
  return count;
}

/**
 * Current streak, honoring the user's planned rest days.
 *
 * Rule: within the streak, every rolling 7-day window may contain at most
 * `restDaysPerWeek` days without a workout. The streak is measured in calendar
 * days between the oldest and newest workout of the unbroken run (inclusive),
 * so allowed rest days inside the run count toward the total but a run never
 * starts or ends on a rest day. A missing workout *today* doesn't reduce the
 * streak (the day isn't over); instead `atRisk` reports whether skipping today
 * would break it.
 */
export function currentStreak(
  dateKeys: Iterable<string>,
  restDaysPerWeek: number,
  today: string
): StreakInfo {
  const dates = dateKeys instanceof Set ? dateKeys : new Set(dateKeys);
  if (dates.size === 0) return { days: 0, atRisk: false };

  const allowedRest = Math.max(0, Math.min(6, Math.floor(restDaysPerWeek)));
  const todayWorked = dates.has(today);
  const start = todayWorked ? today : addDays(today, -1);

  // Walk backward from `start`; statuses[i] is whether a workout happened
  // i days before `start`. Stop when a rolling 7-day window exceeds the
  // allowed rest days.
  const statuses: boolean[] = [];
  let missesInWindow = 0;
  for (let i = 0; i < MAX_LOOKBACK_DAYS; i++) {
    const worked = dates.has(addDays(start, -i));
    if (i >= 7 && !statuses[i - 7]) missesInWindow--;
    if (!worked) missesInWindow++;
    if (missesInWindow > allowedRest) break;
    statuses.push(worked);
  }

  const newest = statuses.indexOf(true);
  const oldest = statuses.lastIndexOf(true);
  if (newest === -1) return { days: 0, atRisk: false };
  const days = oldest - newest + 1;

  let atRisk = false;
  if (!todayWorked) {
    // If today ends without a workout, the window [today-6 .. today] must
    // still respect the rest allowance for the streak to survive.
    let windowMisses = 0;
    for (let i = 0; i <= 6; i++) {
      if (!dates.has(addDays(today, -i))) windowMisses++;
    }
    atRisk = windowMisses > allowedRest;
  }

  return { days, atRisk };
}
