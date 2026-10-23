import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

// jsdom has no canvas: Chart.js is replaced by a recorder; these tests check the configuration.
const charts: { config: any; destroy: ReturnType<typeof vi.fn> }[] = [];
vi.mock('chart.js', () => {
  class Chart {
    static register() {}
    config: any;
    destroy = vi.fn();
    constructor(_canvas: unknown, config: any) {
      this.config = config;
      charts.push(this as any);
    }
  }
  const el = {};
  return { Chart, BarController: el, BarElement: el, CategoryScale: el, Filler: el, LinearScale: el, LineController: el, LineElement: el, PointElement: el, Tooltip: el };
});

import { BarChart } from './BarChart';

const TODAY = new Date(2026, 9, 22, 12);
const DATES = ['2026-10-20', '2026-10-22'];
const FREE = { id: 'free', label: 'Free', data: [3, 4] };
const PREMIUM = { id: 'premium', label: 'Premium', data: [1, 0] };

let reducedMotion = false;
beforeEach(() => {
  charts.length = 0;
  reducedMotion = false;
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function () {
    let fill = '#000000';
    return {
      get fillStyle() { return fill; },
      set fillStyle(v: string) { if (/^(#|rgb)/.test(v)) fill = v.toLowerCase(); },
    } as unknown as CanvasRenderingContext2D;
  } as any);
  window.matchMedia = ((q: string) => ({ matches: reducedMotion && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as any;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const last = () => charts[charts.length - 1].config;
const ctxFor = (datasetIndex: number, dataIndex: number) => ({ datasetIndex, dataIndex });

describe('BarChart', () => {
  it('follows the chart rules: one column per day, today labelled, one empty day after, gaps empty', () => {
    render(<BarChart dates={DATES} series={[FREE]} ariaLabel="Daily downloads" today={TODAY} />);
    expect(screen.getByRole('img', { name: 'Daily downloads' })).toBeTruthy();
    const { labels, datasets } = last().data;
    expect(labels).toEqual(['20 Oct', '21 Oct', '22 Oct (Today)', '23 Oct']);
    expect(datasets[0].data).toEqual([3, null, 4, null]);
    expect(last().plugins.map((p: any) => p.id)).toEqual(['vsTodayLine', 'vsValueLabels']);
  });

  it('stacks bar series into one column and puts the total in the tooltip footer', () => {
    render(<BarChart dates={DATES} series={[FREE, PREMIUM]} stacked ariaLabel="x" today={TODAY} />);
    const c = last();
    expect(c.options.scales.x.stacked).toBe(true);
    expect(c.options.scales.y.stacked).toBe(true);
    expect(c.data.datasets.map((d: any) => d.stack)).toEqual(['total', 'total']);
    const footer = c.options.plugins.tooltip.callbacks.footer;
    expect(footer([{ dataIndex: 0 }])).toBe('Total: 4');
    expect(footer([{ dataIndex: 1 }])).toBe('');
  });

  it('rounds only the top part of a stacked column and separates the parts', () => {
    render(<BarChart dates={DATES} series={[FREE, PREMIUM]} stacked ariaLabel="x" today={TODAY} />);
    const [free, premium] = last().data.datasets;
    // 20 Oct: free 3 + premium 1 -> premium is on top
    expect(free.borderRadius(ctxFor(0, 0))).toBe(0);
    expect(premium.borderRadius(ctxFor(1, 0))).toBe(4);
    expect(free.borderWidth(ctxFor(0, 0))).toEqual({ top: 2 });
    // 22 Oct: premium is 0 -> free is the top
    expect(free.borderRadius(ctxFor(0, 2))).toBe(4);
    expect(free.borderWidth(ctxFor(0, 2))).toBe(0);
  });

  it('draws a line series over the bars on its own right axis', () => {
    render(
      <BarChart dates={DATES} ariaLabel="x" today={TODAY}
        series={[{ id: 'dl', label: 'Downloads', data: [3, 4], axis: 'right' }, { id: 'u', label: 'Active users', data: [30, 40], type: 'line' }]} />
    );
    const [bars, line] = last().data.datasets;
    expect(bars.type).toBe('bar');
    expect(bars.yAxisID).toBe('y1');
    expect(line.type).toBe('line');
    expect(line.order).toBe(-1);
    expect(line.fill).toBe('origin');
    expect(line.spanGaps).toBe(false);
    expect(last().options.scales.y1.position).toBe('right');
    expect(screen.getByText('Active users').firstElementChild?.className).toContain('vs-line-chart-swatch--line');
  });

  it('grows bars left to right, and turns every animation off with reduced motion', () => {
    render(<BarChart dates={DATES} series={[FREE, { id: 'l', label: 'L', data: [1, 2], type: 'line' }]} ariaLabel="x" today={TODAY} />);
    const delay = last().options.animation.delay;
    expect(delay({ type: 'data', mode: 'default', dataIndex: 0 })).toBe(0);
    expect(delay({ type: 'data', mode: 'default', dataIndex: 3 })).toBeGreaterThan(delay({ type: 'data', mode: 'default', dataIndex: 1 }));
    expect(delay({ type: 'data', mode: 'active', dataIndex: 3 })).toBe(0);
    expect(last().data.datasets[1].animations.x.easing).toBe('linear');
    cleanup();

    reducedMotion = true;
    render(<BarChart dates={DATES} series={[FREE, { id: 'l', label: 'L', data: [1, 2], type: 'line' }]} ariaLabel="x" today={TODAY} />);
    expect(last().options.animation).toBe(false);
    expect(last().data.datasets[1].animations).toBe(false);
  });

  it('formats tooltip values and hides null values from it', () => {
    render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} formatValue={(v) => `${v} dl`} />);
    const tip = last().options.plugins.tooltip;
    expect(tip.callbacks.label({ dataset: { label: 'Free' }, raw: 3 })).toBe('Free: 3 dl');
    expect(tip.filter({ raw: null })).toBe(false);
    expect(tip.callbacks.footer([{ dataIndex: 0 }])).toBe('');
  });

  it('does not redraw for equal inline props, redraws on new data, destroys on unmount', () => {
    const { rerender, unmount } = render(<BarChart dates={[...DATES]} series={[{ ...FREE }]} ariaLabel="x" today={new Date(TODAY)} />);
    rerender(<BarChart dates={[...DATES]} series={[{ ...FREE }]} ariaLabel="x" today={new Date(TODAY)} />);
    expect(charts).toHaveLength(1);
    rerender(<BarChart dates={[...DATES]} series={[{ ...FREE, data: [9, 9] }]} ariaLabel="x" today={new Date(TODAY)} />);
    expect(charts).toHaveLength(2);
    expect(charts[0].destroy).toHaveBeenCalled();
    unmount();
    expect(charts[1].destroy).toHaveBeenCalled();
  });

  it('leaves room for value labels and the (Today) label', () => {
    render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} showValues />);
    expect(last().options.layout.padding).toEqual({ top: 20, right: 40 });
  });
});
