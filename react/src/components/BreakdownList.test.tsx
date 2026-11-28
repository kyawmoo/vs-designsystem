import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BreakdownList } from './BreakdownList';
import type { BreakdownRow } from './BreakdownList';

afterEach(cleanup);

const rows: BreakdownRow[] = [
  { key: 'ca', label: 'Canada (CA)', value: 1, share: 50 },
  { key: 'eg', label: 'Egypt (EG)', value: 1, share: 50 },
];
const widths = (html: string) => [...html.matchAll(/vs-meter__fill" style="width:([\d.]+)%"/g)].map((m) => m[1]);

describe('BreakdownList', () => {
  it('writes each row as name, count and share', () => {
    render(<BreakdownList rows={rows} empty="No data" />);
    expect(screen.getByText('Canada (CA)')).toBeTruthy();
    expect(screen.getAllByText('1').length).toBe(2);
    expect(screen.getAllByText('50%').length).toBe(2);
    expect(screen.getAllByRole('listitem').length).toBe(2);
  });

  it('shows the empty text, and no list, when there are no rows', () => {
    const html = renderToStaticMarkup(<BreakdownList rows={[]} empty="No device data in this period." />);
    expect(html).toBe('<p class="vs-breakdown__empty">No device data in this period.</p>');
  });

  it('share scale (default): the bar is as long as the share', () => {
    expect(widths(renderToStaticMarkup(<BreakdownList rows={[{ key: 'a', label: 'A', value: 3, share: 75 }, { key: 'b', label: 'B', value: 1, share: 25 }]} empty="-" />))).toEqual(['75', '25']);
  });

  it('relative scale: the largest share fills the track, the others are scaled to it', () => {
    const html = renderToStaticMarkup(
      <BreakdownList barScale="relative" rows={[{ key: 'a', label: 'A', value: 3, share: 20 }, { key: 'b', label: 'B', value: 1, share: 10 }, { key: 'c', label: 'C', value: 0, share: 0 }]} empty="-" />
    );
    expect(widths(html)).toEqual(['100', '50', '0']);
  });

  it('relative scale with every share 0 does not divide by zero', () => {
    expect(widths(renderToStaticMarkup(<BreakdownList barScale="relative" rows={[{ key: 'a', label: 'A', value: 0, share: 0 }]} empty="-" />))).toEqual(['0']);
  });

  it('keeps a bar inside the track whatever the share is (-10, 140)', () => {
    expect(widths(renderToStaticMarkup(<BreakdownList rows={[{ key: 'a', label: 'A', value: 1, share: -10 }, { key: 'b', label: 'B', value: 1, share: 140 }]} empty="-" />))).toEqual(['0', '100']);
  });

  it('a row without a usable share still shows its count and no bar or percent', () => {
    const html = renderToStaticMarkup(<BreakdownList rows={[{ key: 'a', label: 'A', value: 7, share: Number.NaN }]} empty="-" />);
    expect(html).toContain('>7<');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('vs-meter__fill');
    expect(html).not.toContain('vs-breakdown__share');
  });

  it('formats the count, or takes the row\'s own text', () => {
    const html = renderToStaticMarkup(<BreakdownList rows={[{ key: 'a', label: 'A', value: 12345, share: 10 }, { key: 'b', label: 'B', value: 1500, share: 5, valueText: '1.5k' }]} empty="-" />);
    expect(html).toContain('>12,345<');
    expect(html).toContain('>1.5k<');
    expect(renderToStaticMarkup(<BreakdownList rows={[{ key: 'a', label: 'A', value: 5, share: 10 }]} formatValue={(v) => `${v} dl`} empty="-" />)).toContain('>5 dl<');
  });

  it('the bars are decorative: hidden from screen readers, no meter role on each row', () => {
    const html = renderToStaticMarkup(<BreakdownList rows={rows} empty="-" />);
    expect(html).not.toContain('role="meter"');
    expect((html.match(/<div class="vs-meter" aria-hidden="true">/g) ?? []).length).toBe(2);
  });

  it('a row tone colours its bar; label can hold markup', () => {
    const html = renderToStaticMarkup(<BreakdownList rows={[{ key: 'a', label: <b>🇨🇦 Canada</b>, value: 1, share: 50, tone: 'danger' }]} empty="-" />);
    expect(html).toContain('vs-meter vs-meter--danger');
    expect(html).toContain('<b>🇨🇦 Canada</b>');
  });

  it('passes a class name through', () => {
    expect(renderToStaticMarkup(<BreakdownList rows={rows} empty="-" className="mine" />)).toContain('<ul class="vs-breakdown mine">');
  });

  it('without new props the markup is unchanged (no style colour, no title)', () => {
    const html = renderToStaticMarkup(<BreakdownList rows={rows} empty="-" />);
    expect(html).not.toContain('background');
    expect(html).not.toContain('title=');
    expect(html).toContain('<span class="vs-breakdown__share">50%</span>');
  });

  it('a row colour paints the bar, tokens included', () => {
    const html = renderToStaticMarkup(<BreakdownList rows={[{ key: 'a', label: 'A', value: 1, share: 40, color: 'var(--vs-chart-series-2)' }]} empty="-" />);
    expect(html).toContain('style="width:40%;background:var(--vs-chart-series-2)"');
  });

  it('rows without share: bars scale to the largest value and no percent is written', () => {
    const html = renderToStaticMarkup(
      <BreakdownList rows={[{ key: 'a', label: 'A', value: 8 }, { key: 'b', label: 'B', value: 2 }, { key: 'c', label: 'C', value: 0 }]} empty="-" />
    );
    expect(widths(html)).toEqual(['100', '25', '0']);
    expect(html).not.toContain('vs-breakdown__share');
    expect(html).not.toContain('%</span>');
  });

  it('rows without share and all values 0 or invalid never print NaN', () => {
    const html = renderToStaticMarkup(<BreakdownList rows={[{ key: 'a', label: 'A', value: 0 }, { key: 'b', label: 'B', value: NaN }]} empty="-" />);
    expect(html).not.toMatch(/NaN|Infinity/);
    expect(widths(html)).toEqual(['0']);
  });

  it('title becomes the tooltip of the name', () => {
    expect(renderToStaticMarkup(<BreakdownList rows={[{ key: 'a', label: 'A', value: 1, title: 'Full name A' }]} empty="-" />)).toContain('title="Full name A"');
  });
});
