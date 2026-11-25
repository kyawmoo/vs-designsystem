/**
 * Step numbers for Rewind Reveal. A day is the text `'YYYY-MM-DD'` (a calendar date, no time zone), which sorts like the
 * dates it names. The rule: today is step 0, each earlier day is one step later (newest first), days after today get no step
 * (they are shown at once), and no step is larger than `maxSteps`, so a long list never makes the viewer wait.
 * The same rule is written in blade/rewind-reveal.js; both are tested against react/src/fixtures-rewind-order.json.
 */

/** Default for `maxSteps`: 18 steps x --vs-motion-rewind-step (30ms) + one item (360ms) is about 0.9 s at the default tokens. */
export const REWIND_DEFAULT_MAX_STEPS = 18;
/** The most steps anyone can ask for (a safety bound on the total time). */
export const REWIND_HARD_MAX_STEPS = 60;

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar day in the form 'YYYY-MM-DD' (2026-02-30 and 2026-13-01 are not). */
export function isRewindDay(key: unknown): key is string {
  if (typeof key !== 'string' || !DAY.test(key)) return false;
  const [y, m, d] = key.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

/** A usable maxSteps: a whole number from 1 up to the hard limit; anything else gives the default. */
export function rewindMaxSteps(maxSteps?: number): number {
  return typeof maxSteps === 'number' && Number.isInteger(maxSteps) && maxSteps >= 1 ? Math.min(maxSteps, REWIND_HARD_MAX_STEPS) : REWIND_DEFAULT_MAX_STEPS;
}

/**
 * Step number of each day to animate. `days` may be unsorted, repeat, or hold values that are not real days (those are skipped).
 * Throws RangeError when `today` is not a real 'YYYY-MM-DD' day: guessing a "today" would animate the wrong days.
 */
export function rewindIndexes(days: readonly unknown[], today: string, maxSteps?: number): Map<string, number> {
  if (!isRewindDay(today)) throw new RangeError(`rewindIndexes: today must be a real 'YYYY-MM-DD' day, got ${JSON.stringify(today)}`);
  const max = rewindMaxSteps(maxSteps);
  const unique = Array.from(new Set(days.filter(isRewindDay)));
  const result = new Map<string, number>();
  if (unique.includes(today)) result.set(today, 0);
  unique
    .filter((d) => d < today)
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
    .forEach((d, i) => result.set(d, Math.min(i + 1, max)));
  return result;
}
