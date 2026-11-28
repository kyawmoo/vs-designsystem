import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StackedBar } from './StackedBar';
import type { StackedBarPart } from './StackedBar';

const html = (parts: StackedBarPart[], extra: Partial<React.ComponentProps<typeof StackedBar>> = {}) =>
  renderToStaticMarkup(<StackedBar parts={parts} ariaLabel="Downloads by type" {...extra} />);
const widths = (h: string) => [...h.matchAll(/vs-stacked-bar__part" style="width:([\d.]+)%/g)].map((m) => Number(m[1]));
const pcts = (h: string) => [...h.matchAll(/vs-stacked-bar__legend-pct">([^<]+)</g)].map((m) => m[1]);

describe('StackedBar', () => {
  it('draws one segment per part, as wide as its share, and a legend with name and percentage', () => {
    const h = html([{ key: 'f', label: 'File', value: 3 }, { key: 'l', label: 'External link', value: 1 }]);
    expect(widths(h)).toEqual([75, 25]);
    expect(pcts(h)).toEqual(['75%', '25%']);
    expect(h).toContain('>File<');
    expect(h).toContain('>External link<');
  });
  it('is role="img" with the aria label; the swatches are hidden from screen readers', () => {
    const h = html([{ key: 'a', label: 'A', value: 1 }]);
    expect(h).toContain('role="img" aria-label="Downloads by type"');
    expect(h).toContain('vs-stacked-bar__swatch" style="background:var(--vs-chart-donut-1)" aria-hidden="true"');
  });
  it('a part with 0 gets no segment but stays in the legend as 0%', () => {
    const h = html([{ key: 'a', label: 'A', value: 2 }, { key: 'b', label: 'B', value: 0 }]);
    expect(widths(h)).toEqual([100]);
    expect(pcts(h)).toEqual(['100%', '0%']);
  });
  it('values of any size always fill the track exactly, never wider, never NaN', () => {
    const h = html([{ key: 'a', label: 'A', value: 1 }, { key: 'b', label: 'B', value: 1 }, { key: 'c', label: 'C', value: 1 }]);
    const sum = widths(h).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(100, 6);
    expect(pcts(h)).toEqual(['33%', '33%', '33%']);
    const bad = html([{ key: 'a', label: 'A', value: NaN }, { key: 'b', label: 'B', value: -4 }, { key: 'c', label: 'C', value: Infinity }, { key: 'd', label: 'D', value: 5 }]);
    expect(bad).not.toMatch(/NaN|Infinity/);
    expect(widths(bad)).toEqual([100]);
  });
  it('a tiny share is written <1%', () => {
    expect(pcts(html([{ key: 'a', label: 'A', value: 999 }, { key: 'b', label: 'B', value: 1 }]))).toEqual(['100%', '&lt;1%']);
  });
  it('no parts, or all 0: the empty text and no bar', () => {
    for (const parts of [[], [{ key: 'a', label: 'A', value: 0 }]]) {
      const h = html(parts, { empty: 'No downloads yet' });
      expect(h).toContain('No downloads yet');
      expect(h).not.toContain('role="img"');
    }
  });
  it('uses the part colour, otherwise the donut palette in order, repeated after 6', () => {
    const parts: StackedBarPart[] = Array.from({ length: 7 }, (_, i) => ({ key: String(i), label: String(i), value: 1 }));
    parts[1] = { ...parts[1], color: 'var(--vs-chart-series-2)' };
    const h = html(parts);
    const bgs = [...h.matchAll(/vs-stacked-bar__part" style="width:[\d.]+%;background:([^"]+)"/g)].map((m) => m[1]);
    expect(bgs).toEqual(['var(--vs-chart-donut-1)', 'var(--vs-chart-series-2)', 'var(--vs-chart-donut-3)', 'var(--vs-chart-donut-4)', 'var(--vs-chart-donut-5)', 'var(--vs-chart-donut-6)', 'var(--vs-chart-donut-1)']);
  });
  it('legend none leaves only the bar', () => {
    expect(html([{ key: 'a', label: 'A', value: 1 }], { legend: 'none' })).not.toContain('vs-stacked-bar__legend');
  });
  it('escapes labels', () => {
    expect(html([{ key: 'a', label: '<img src=x>', value: 1 }])).toContain('&lt;img src=x&gt;');
  });
});
