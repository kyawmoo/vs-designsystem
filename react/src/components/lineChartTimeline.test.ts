import { describe, expect, it } from 'vitest';
import { buildTimeline, dateKey, shortLabel, visibleTicks } from './lineChartTimeline';

const TODAY = new Date(2026, 9, 22, 15, 30);

describe('buildTimeline', () => {
  it('runs from the first date to exactly one empty day after today', () => {
    const t = buildTimeline(['2026-10-19', '2026-10-21'], TODAY);
    expect(t.dates).toEqual(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23']);
    expect(t.todayIndex).toBe(3);
    expect(t.labels[3]).toBe('22 Oct (Today)');
    expect(t.labels[4]).toBe('23 Oct');
  });

  it('lays values onto the days: missing and future days are null, never 0', () => {
    const t = buildTimeline(['2026-10-19', '2026-10-21'], TODAY);
    expect(t.align(['2026-10-19', '2026-10-21'], [5, 0])).toEqual([5, null, 0, null, null]);
  });

  it('ignores bad dates and bad values and adds up a repeated day', () => {
    const t = buildTimeline(['2026-10-21', 'garbage', '2026-02-30', '2026-10-21'], TODAY);
    expect(t.dates[0]).toBe('2026-10-21');
    expect(t.align(['2026-10-21', 'garbage', '2026-10-21', '2026-10-22'], [2, 9, 3, Number.NaN])).toEqual([5, null, null]);
  });

  it('keeps data dated after tomorrow (clock difference) on the axis', () => {
    const t = buildTimeline(['2026-10-21', '2026-10-25'], TODAY);
    expect(t.dates[t.dates.length - 1]).toBe('2026-10-25');
    expect(t.todayIndex).toBe(1);
  });

  it('with no data still shows today and the empty day after it', () => {
    const t = buildTimeline([], TODAY);
    expect(t.dates).toEqual(['2026-10-22', '2026-10-23']);
    expect(t.todayIndex).toBe(0);
  });

  it('crosses month and year ends by calendar day', () => {
    const t = buildTimeline(['2026-12-30'], new Date(2027, 0, 1));
    expect(t.dates).toEqual(['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02']);
  });

  it('caps a huge range at the most recent days', () => {
    const t = buildTimeline(['1990-01-01'], TODAY);
    expect(t.dates.length).toBe(400);
    expect(t.dates[t.dates.length - 1]).toBe('2026-10-23');
    expect(t.todayIndex).toBe(398);
  });
});

describe('labels and ticks', () => {
  it('formats keys from local calendar fields', () => {
    expect(dateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(shortLabel('2026-10-02')).toBe('2 Oct');
  });

  it('always shows today and spaces the others evenly from it', () => {
    const v = visibleTicks(31, 29, 6);
    expect(v[29]).toBe(true);
    expect(v.filter(Boolean).length).toBeLessThanOrEqual(7);
    expect(v[23]).toBe(true);
    expect(v[30]).toBe(false);
  });

  it('shows every label when there is room, and survives bad input', () => {
    expect(visibleTicks(5, 3, 10)).toEqual([true, true, true, true, true]);
    expect(visibleTicks(4, -1, 0)).toHaveLength(4);
  });
});
