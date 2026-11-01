import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonthsKeepDay,
  clampIsoDate,
  daysInclusive,
  daysInMonth,
  diffDays,
  formatDMY,
  formatLongDate,
  formatRangeLabel,
  isIsoDate,
  monthGrid,
  monthIndexOf,
  parseIsoDate,
  todayIsoDate,
  toIsoDate,
  weekdayLabels,
  weekdayOf,
} from './rangeCalendarDates';

describe('rangeCalendarDates: parsing', () => {
  it('accepts real dates only', () => {
    expect(parseIsoDate('2026-10-14')).toEqual({ year: 2026, month: 9, day: 14 });
    expect(isIsoDate('2024-02-29')).toBe(true); // leap year
    for (const bad of ['2026-02-30', '2025-02-29', '2026-13-01', '2026-00-10', '2026-10-00', '2026-10-32', '14 Oct 2026', '2026-1-5', '', null, undefined]) {
      expect(isIsoDate(bad as string)).toBe(false);
    }
  });

  it('formats and round-trips', () => {
    expect(toIsoDate(2026, 9, 4)).toBe('2026-10-04');
    expect(todayIsoDate(new Date(2026, 10, 1, 23, 59))).toBe('2026-11-01'); // local calendar day, late evening
    expect(todayIsoDate(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
  });
});

describe('rangeCalendarDates: day maths', () => {
  it('adds days across month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2024-02-28', 2)).toBe('2024-03-01');
    expect(addDays('2026-10-14', 0)).toBe('2026-10-14');
  });

  it('adds months and keeps the day, or the last day of a shorter month', () => {
    expect(addMonthsKeepDay('2026-10-14', 1)).toBe('2026-11-14');
    expect(addMonthsKeepDay('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonthsKeepDay('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonthsKeepDay('2026-01-15', -1)).toBe('2025-12-15');
    expect(addMonthsKeepDay('2026-12-15', 1)).toBe('2027-01-15');
  });

  it('counts days between and in a range, both ends included', () => {
    expect(diffDays('2026-10-14', '2026-10-20')).toBe(6);
    expect(diffDays('2026-10-20', '2026-10-14')).toBe(-6);
    expect(daysInclusive('2026-10-14', '2026-10-20')).toBe(7);
    expect(daysInclusive('2026-10-20', '2026-10-14')).toBe(7);
    expect(daysInclusive('2026-10-14', '2026-10-14')).toBe(1);
    expect(daysInclusive('2026-10-31', '2026-11-01')).toBe(2);
    expect(daysInclusive('2025-01-01', '2025-12-31')).toBe(365);
  });

  it('knows the weekday, month length and clamps', () => {
    expect(weekdayOf('2026-11-01')).toBe(0); // a Sunday
    expect(weekdayOf('2026-10-01')).toBe(4); // a Thursday
    expect(daysInMonth(2026, 1)).toBe(28);
    expect(daysInMonth(2024, 1)).toBe(29);
    expect(clampIsoDate('2026-12-01', '2026-01-01', '2026-11-01')).toBe('2026-11-01');
    expect(clampIsoDate('2025-12-01', '2026-01-01', '2026-11-01')).toBe('2026-01-01');
    expect(clampIsoDate('2026-05-01')).toBe('2026-05-01');
    expect(monthIndexOf('2026-11-30') - monthIndexOf('2026-10-01')).toBe(1);
    expect(monthIndexOf('2027-01-01') - monthIndexOf('2026-12-31')).toBe(1);
  });
});

describe('rangeCalendarDates: month grid', () => {
  const flat = (g: Array<Array<string | null>>) => g.flat();

  it('Sunday-first: November 2026 starts on the first column (1 Nov is a Sunday)', () => {
    const g = monthGrid(2026, 10, 0);
    expect(g[0][0]).toBe('2026-11-01');
    expect(g.every((w) => w.length === 7)).toBe(true);
    expect(flat(g).filter(Boolean)).toHaveLength(30);
    expect(g).toHaveLength(5);
  });

  it('Sunday-first: October 2026 starts on Thursday (4 empty cells before the 1st)', () => {
    const g = monthGrid(2026, 9, 0);
    expect(g[0].slice(0, 4)).toEqual([null, null, null, null]);
    expect(g[0][4]).toBe('2026-10-01');
    expect(flat(g).filter(Boolean)).toHaveLength(31);
  });

  it('Monday-first moves the leading blanks (November 2026 has 6 before the 1st)', () => {
    const g = monthGrid(2026, 10, 1);
    expect(g[0].slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(g[0][6]).toBe('2026-11-01');
    expect(g).toHaveLength(6); // 6 blanks + 30 days = 36 cells
  });

  it('a 28-day February that starts on the first column is exactly 4 weeks; a long month can need 6', () => {
    expect(monthGrid(2026, 1, 0)).toHaveLength(4); // 1 Feb 2026 is a Sunday
    expect(monthGrid(2026, 7, 0)).toHaveLength(6); // 1 Aug 2026 is a Saturday, 31 days
  });

  it('weekday labels follow the first day of the week', () => {
    expect(weekdayLabels(0)).toEqual(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);
    expect(weekdayLabels(1)).toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
  });
});

describe('rangeCalendarDates: text', () => {
  it('DD MMM YYYY and the long spoken date', () => {
    expect(formatDMY('2026-10-04')).toBe('04 Oct 2026');
    expect(formatDMY('2026-10-14')).toBe('14 Oct 2026');
    expect(formatDMY('nope')).toBe('');
    expect(formatLongDate('2026-10-04')).toBe('4 October 2026');
  });

  it('range label: one day, same month, across months, across years, either order', () => {
    expect(formatRangeLabel('2026-10-28', '2026-10-28')).toBe('28 Oct');
    expect(formatRangeLabel('2026-10-14', '2026-10-20')).toBe('14–20 Oct');
    expect(formatRangeLabel('2026-10-04', '2026-10-09')).toBe('04–09 Oct');
    expect(formatRangeLabel('2026-09-28', '2026-10-04')).toBe('28 Sep – 04 Oct');
    expect(formatRangeLabel('2025-12-28', '2026-01-03')).toBe('28 Dec 2025 – 03 Jan 2026');
    expect(formatRangeLabel('2026-10-20', '2026-10-14')).toBe('14–20 Oct');
    expect(formatRangeLabel('bad', '2026-10-14')).toBe('');
  });
});
