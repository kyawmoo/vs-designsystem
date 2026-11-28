import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { WeeklyColumnChart, weeklyAxisPercent, weeklyMarkerRows } from './WeeklyColumnChart';
import type { WeeklyColumn, WeeklyColumnChartProps } from './WeeklyColumnChart';

const COLS: WeeklyColumn[] = [
  { key: 'w1', label: '2 Nov', values: [30, 10], title: 'Week of 2 Nov' },
  { key: 'w2', label: '9 Nov', values: [null, null] },
  { key: 'w3', label: '16 Nov*', values: [15, 5], partial: true },
];
const SERIES = [{ label: 'File on our site' }, { label: 'External link' }];
const render = (p: Partial<WeeklyColumnChartProps> = {}) =>
  renderToStaticMarkup(<WeeklyColumnChart columns={COLS} series={SERIES} ariaLabel="Links per week" {...p} />);
const cols = (h: string) => h.split('<div class="vs-weekly-chart__plot"')[1].split(/(?=<div class="vs-weekly-chart__col)/).slice(1);
const heights = (s: string) => [...s.matchAll(/vs-weekly-chart__bar[^"]*" style="height:([\d.]+)%/g)].map((m) => Number(m[1]));

describe('WeeklyColumnChart', () => {
  it('one stacked column per week, scaled to the largest week total, labels under it', () => {
    const c = cols(render());
    expect(heights(c[0])).toEqual([75, 25]);
    expect(heights(c[2])).toEqual([37.5, 12.5]);
    const h = render();
    expect(h).toContain('<span>2 Nov</span><span>9 Nov</span><span>16 Nov*</span><span></span>');
    expect(h).toContain('title="Week of 2 Nov"');
  });
  it('plot is role="img" with the label; the series legend is text with token colours', () => {
    const h = render();
    expect(h).toContain('role="img" aria-label="Links per week"');
    expect(h).toContain('>File on our site</li>');
    expect(h).toContain('background:var(--vs-chart-series-1)');
    expect(h).toContain('background:var(--vs-chart-series-2)');
  });
  it('a running week is hatched, the others are not', () => {
    const c = cols(render());
    expect(c[0]).not.toContain('--partial');
    expect(c[2].match(/vs-weekly-chart__bar--partial/g)).toHaveLength(2);
  });
  it('bars set only the background colour, so the hatch (a background image) is not wiped out', () => {
    const c = cols(render());
    expect(c[2]).toContain('background-color:var(--vs-chart-series-1)');
    expect(c[2]).not.toMatch(/[";]background:/);
  });
  it('a week with no data is a gap, never a 0 bar', () => {
    const c = cols(render());
    expect(c[1]).toContain('vs-weekly-chart__col--gap');
    expect(heights(c[1])).toEqual([]);
  });
  it('exactly one empty future week slot after the last week', () => {
    const h = render();
    expect(h.match(/vs-weekly-chart__col--future/g)).toHaveLength(1);
    expect(h).toContain('grid-template-columns:repeat(4, minmax(0, 1fr))');
  });
  it('Today line at its position when on the axis, none otherwise', () => {
    expect(render({ todayAt: 2.5 })).toContain('vs-weekly-chart__today" style="left:62.5%"');
    for (const t of [null, undefined, -1, 4, NaN]) expect(render({ todayAt: t as number })).not.toContain('vs-weekly-chart__today');
  });
  it('markers sit on the axis with their id and are listed; one off the axis is listed only', () => {
    const h = render({
      markers: [
        { id: 1, label: 'New page 3 Nov', at: 0.2 },
        { id: '?', label: 'Launch (date not set)', at: null, variant: 'unconfirmed' },
        { id: 2, label: 'Old change', at: 9 },
      ],
    });
    expect(h.match(/class="vs-weekly-chart__marker"/g)).toHaveLength(1);
    expect(h).toContain('vs-weekly-chart__marker" style="left:5%"');
    expect(h).toContain('New page 3 Nov</li>');
    expect(h).toContain('Launch (date not set)</li>');
    expect(h).toContain('Old change</li>');
    expect(h).toContain('vs-weekly-chart__dot vs-weekly-chart__dot--unconfirmed');
  });
  it('close markers go to lower rows so they never cover each other', () => {
    expect(weeklyMarkerRows([5, 8, 9, 10, 30])).toEqual([0, 1, 2, 2, 0]);
  });
  it('axis percent: inside 0..slots only', () => {
    expect(weeklyAxisPercent(1, 4)).toBe(25);
    expect(weeklyAxisPercent(4, 4)).toBeNull();
    expect(weeklyAxisPercent(Infinity, 4)).toBeNull();
  });
  it('no columns: the empty text and no plot', () => {
    const h = render({ columns: [], empty: 'No weeks yet' });
    expect(h).toContain('No weeks yet');
    expect(h).not.toContain('role="img"');
  });
  it('bad values (negative, NaN, Infinity) are no part and never print NaN; all zero weeks keep the scale at 1', () => {
    const h = render({ columns: [{ key: 'a', label: 'A', values: [-3, NaN] }, { key: 'b', label: 'B', values: [Infinity as number, 0] }] });
    expect(h).not.toMatch(/NaN|Infinity/);
    expect(cols(h)[0]).toContain('--gap');
  });
  it('legend none hides the series legend; labels are escaped', () => {
    expect(render({ legend: 'none' })).not.toContain('vs-weekly-chart__legend');
    expect(render({ series: [{ label: '<b>x</b>' }] })).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});
