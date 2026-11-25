import { describe, expect, it } from 'vitest';
import fixtures from '../fixtures-rewind-order.json';
import { isRewindDay, REWIND_DEFAULT_MAX_STEPS, REWIND_HARD_MAX_STEPS, rewindIndexes, rewindMaxSteps } from './rewindOrder';

describe('rewindIndexes: the shared fixtures (the Blade script is tested against the same file)', () => {
  for (const f of fixtures as { name: string; days: unknown[]; today: string; maxSteps?: number; expected: Record<string, number> }[]) {
    it(f.name, () => {
      expect(Object.fromEntries(rewindIndexes(f.days, f.today, f.maxSteps))).toEqual(f.expected);
    });
  }
});

describe('rewindIndexes: failure and edge cases', () => {
  it('a today that is not a real day throws (a guessed today would animate the wrong days)', () => {
    for (const bad of ['', 'today', '2026-02-30', '2026-13-01', '2026-1-1', '12/11/2026']) {
      expect(() => rewindIndexes(['2026-11-10'], bad)).toThrow(RangeError);
    }
    expect(() => rewindIndexes(['2026-11-10'], undefined as unknown as string)).toThrow(RangeError);
  });
  it('maxSteps that is zero, negative, fractional or NaN falls back to the default', () => {
    const days = Array.from({ length: 30 }, (_, i) => `2026-10-${String(30 - i).padStart(2, '0')}`);
    for (const bad of [0, -3, 2.5, NaN, Infinity]) {
      expect(Math.max(...rewindIndexes(days, '2026-11-12', bad).values())).toBe(REWIND_DEFAULT_MAX_STEPS);
    }
  });
  it('maxSteps is bounded by the hard limit', () => {
    expect(rewindMaxSteps(10_000)).toBe(REWIND_HARD_MAX_STEPS);
    const days = Array.from({ length: 200 }, (_, i) => new Date(Date.UTC(2026, 5, 1) + i * 86400000).toISOString().slice(0, 10));
    expect(Math.max(...rewindIndexes(days, '2027-01-01', 10_000).values())).toBe(REWIND_HARD_MAX_STEPS);
  });
  it('does not change the list it is given', () => {
    const days = ['2026-11-03', '2026-11-12'];
    rewindIndexes(days, '2026-11-12');
    expect(days).toEqual(['2026-11-03', '2026-11-12']);
  });
  it('isRewindDay accepts only real calendar days', () => {
    expect(isRewindDay('2026-02-28')).toBe(true);
    expect(isRewindDay('2028-02-29')).toBe(true);
    expect(isRewindDay('2026-02-29')).toBe(false);
    expect(isRewindDay(20261112)).toBe(false);
  });
});
