import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DonutChart, donutAmount, donutPercentText } from './DonutChart';
import type { DonutSegment } from './DonutChart';

afterEach(cleanup);

const seg = (key: string, value: number, extra: Partial<DonutSegment> = {}): DonutSegment => ({ key, label: key.toUpperCase(), value, ...extra });
const four = [seg('direct', 38), seg('search', 34), seg('social', 20), seg('ai', 8)];
const chart = (segments: DonutSegment[], props: Partial<React.ComponentProps<typeof DonutChart>> = {}) => (
  <DonutChart segments={segments} ariaLabel="Traffic sources" {...props} />
);
const legend = (html: string) => [...html.matchAll(/vs-donut__legend-label">([^<]*)<\/span><span class="vs-donut__legend-pct">([^<]*)</g)].map((m) => [m[1], m[2]]);
/** The drawn length of every segment along the ring, in percent of the circumference (gaps not counted back in). */
const dashes = (html: string) => [...html.matchAll(/stroke-dasharray="([\d.]+) ([\d.]+)"/g)].map((m) => Number(m[1]) / (Number(m[1]) + Number(m[2])) * 100);
const arcCount = (html: string) => (html.match(/class="vs-donut__seg"/g) ?? []).length;

describe('DonutChart: shares', () => {
  it('[38, 34, 20, 8] gives 38 / 34 / 20 / 8 %, in the legend and in the ring', () => {
    const html = renderToStaticMarkup(chart(four));
    expect(legend(html)).toEqual([['DIRECT', '38%'], ['SEARCH', '34%'], ['SOCIAL', '20%'], ['AI', '8%']]);
    // each drawn length is its share minus a 1.5 gap on a circumference of 276.46
    const gapPct = (1.5 / 276.46) * 100;
    dashes(html).forEach((d, i) => expect(d).toBeCloseTo([38, 34, 20, 8][i] - gapPct, 1));
  });

  it('the shares are taken from the total, whatever its size', () => {
    const html = renderToStaticMarkup(chart([seg('a', 3), seg('b', 1)]));
    expect(legend(html)).toEqual([['A', '75%'], ['B', '25%']]);
  });

  it('percent text: rounded, "<1%" below one percent, "0%" for none', () => {
    expect(donutPercentText(37.6)).toBe('38%');
    expect(donutPercentText(0.4)).toBe('<1%');
    expect(donutPercentText(0)).toBe('0%');
    expect(donutPercentText(Number.NaN)).toBe('0%');
    expect(donutPercentText(100)).toBe('100%');
  });

  it('a tiny segment is still drawn and legended as "<1%"', () => {
    const html = renderToStaticMarkup(chart([seg('big', 999), seg('tiny', 1)]));
    expect(legend(html)[1]).toEqual(['TINY', '&lt;1%']); // the markup escapes the <
    expect(arcCount(html)).toBe(2);
  });

  it('a single segment is a whole ring with no gap', () => {
    const html = renderToStaticMarkup(chart([seg('only', 12)]));
    expect(legend(html)).toEqual([['ONLY', '100%']]);
    expect(dashes(html)[0]).toBeCloseTo(100, 5);
  });
});

describe('DonutChart: empty and invalid input', () => {
  it('no segments: the empty text, no arc, no legend, no NaN', () => {
    const html = renderToStaticMarkup(chart([], { empty: 'No traffic yet' }));
    expect(html).toContain('No traffic yet');
    expect(arcCount(html)).toBe(0);
    expect(html).not.toContain('vs-donut__legend');
    expect(html).not.toContain('NaN');
  });

  it('every value 0: the same empty state', () => {
    const html = renderToStaticMarkup(chart([seg('a', 0), seg('b', 0)]));
    expect(html).toContain('No data');
    expect(arcCount(html)).toBe(0);
    expect(html).not.toContain('NaN');
  });

  it('negative, NaN and Infinity count as 0: not drawn, shares come from the valid ones only', () => {
    const html = renderToStaticMarkup(chart([seg('ok', 50), seg('neg', -10), seg('nan', Number.NaN), seg('inf', Number.POSITIVE_INFINITY), seg('ok2', 50)]));
    expect(arcCount(html)).toBe(2);
    expect(legend(html).map((l) => l[1])).toEqual(['50%', '0%', '0%', '0%', '50%']);
    expect(html).not.toContain('NaN');
    expect(donutAmount(-1)).toBe(0);
    expect(donutAmount(Number.NaN)).toBe(0);
    expect(donutAmount(7)).toBe(7);
  });

  it('a zero segment gets a legend line but no arc', () => {
    const html = renderToStaticMarkup(chart([seg('a', 5), seg('zero', 0)]));
    expect(arcCount(html)).toBe(1);
    expect(legend(html)).toEqual([['A', '100%'], ['ZERO', '0%']]);
  });

  it('keeps the ring size and the empty ring even with no data', () => {
    const html = renderToStaticMarkup(chart([], { size: 120 }));
    expect(html).toContain('style="width:120px;height:120px"');
    expect(html).toContain('stroke="var(--vs-meter-track)"');
  });
});

describe('DonutChart: middle, legend and colours', () => {
  it('the middle shows the total by default, or the caller\'s own value, with a caption', () => {
    expect(renderToStaticMarkup(chart(four, { centerCaption: 'Sessions' }))).toContain('<strong class="vs-donut__center-value">100</strong><span class="vs-donut__center-caption">Sessions</span>');
    expect(renderToStaticMarkup(chart([seg('a', 12480)]))).toContain('>12,480<');
    expect(renderToStaticMarkup(chart(four, { centerValue: '12,480' }))).toContain('>12,480<');
  });

  it('the legend is a swatch, a short label and a percentage; it can go to the right or be left out', () => {
    const html = renderToStaticMarkup(chart(four));
    expect((html.match(/class="vs-donut__swatch"/g) ?? []).length).toBe(4);
    expect(html).toContain('class="vs-donut"');
    expect(renderToStaticMarkup(chart(four, { legend: 'right' }))).toContain('class="vs-donut vs-donut--legend-right"');
    expect(renderToStaticMarkup(chart(four, { legend: 'none' }))).not.toContain('vs-donut__legend');
  });

  it('colours come from the donut tokens in order and then repeat; a segment colour overrides', () => {
    const many = Array.from({ length: 8 }, (_, i) => seg(`s${i}`, 1));
    const html = renderToStaticMarkup(chart(many));
    const strokes = [...html.matchAll(/stroke="(var\(--vs-chart-donut-\d\))"/g)].map((m) => m[1]);
    expect(strokes).toEqual(['1', '2', '3', '4', '5', '6', '1', '2'].map((n) => `var(--vs-chart-donut-${n})`));
    const own = renderToStaticMarkup(chart([seg('a', 1, { color: 'var(--vs-color-badge-sale)' }), seg('b', 1)]));
    expect(own).toContain('stroke="var(--vs-color-badge-sale)"');
    expect(own).toContain('stroke="var(--vs-chart-donut-2)"');
  });

  it('uses tokens only: no colour literal in the markup', () => {
    expect(renderToStaticMarkup(chart(four, { legend: 'right' }))).not.toMatch(/#[0-9a-fA-F]{3,8}|rgba?\(/);
  });

  it('each segment has a hover text with its name, amount and share', () => {
    const html = renderToStaticMarkup(chart(four));
    expect(html).toContain('<title>DIRECT: 38 (38%)</title>');
    expect(renderToStaticMarkup(chart([seg('a', 4742), seg('b', 7738)], { formatValue: (v) => `${v} sessions` }))).toContain('<title>A: 4742 sessions (38%)</title>');
  });

  it('each segment sweeps in one after the other; the first starts at once', () => {
    const html = renderToStaticMarkup(chart([seg('a', 50), seg('b', 50)]));
    const delays = [...html.matchAll(/animation-delay:(\d+)ms/g)].map((m) => Number(m[1]));
    expect(delays).toEqual([0, 400]);
    expect([...html.matchAll(/animation-duration:(\d+)ms/g)].map((m) => Number(m[1]))).toEqual([400, 400]);
  });
});

describe('DonutChart: accessibility', () => {
  it('the ring is an image with the caller\'s label; the legend is real text', () => {
    render(chart(four, { centerCaption: 'Sessions' }));
    expect(screen.getByRole('img', { name: 'Traffic sources' })).toBeTruthy();
    expect(screen.getByText('DIRECT')).toBeTruthy();
    expect(screen.getAllByRole('listitem').length).toBe(4);
    expect(screen.getByText('38%')).toBeTruthy();
  });

  it('the empty chart is still a labelled image and says why it is empty', () => {
    render(chart([], { empty: 'No traffic yet' }));
    expect(screen.getByRole('img', { name: 'Traffic sources' })).toBeTruthy();
    expect(screen.getByText('No traffic yet')).toBeTruthy();
  });
});
