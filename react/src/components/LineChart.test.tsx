import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';

// jsdom has no canvas: Chart.js is replaced by a recorder, so these tests check the configuration
// the component builds (the chart rules), not the pixels.
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
  return { Chart, CategoryScale: {}, Filler: {}, LinearScale: {}, LineController: {}, LineElement: {}, PointElement: {}, Tooltip: {} };
});

import { LineChart, LINE_CHART_DRAW_MS, withAlpha } from './LineChart';
import { AnimatedNumber } from './AnimatedNumber';

const TODAY = new Date(2026, 9, 22, 12);
const DATES = ['2026-10-19', '2026-10-20', '2026-10-22'];
const SERIES = [{ id: 'dl', label: 'Downloads', data: [5, 7, 9] }];

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

describe('LineChart', () => {
  it('names the canvas for screen readers and shows a legend row', () => {
    render(<LineChart dates={DATES} series={SERIES} ariaLabel="Daily downloads" today={TODAY} />);
    expect(screen.getByRole('img', { name: 'Daily downloads' })).toBeTruthy();
    expect(screen.getByText('Downloads')).toBeTruthy();
  });

  it('builds the axis by the chart rules: today labelled, one empty day after, gaps not zeros', () => {
    render(<LineChart dates={DATES} series={SERIES} ariaLabel="x" today={TODAY} />);
    const { labels, datasets } = last().data;
    expect(labels).toEqual(['19 Oct', '20 Oct', '21 Oct', '22 Oct (Today)', '23 Oct']);
    expect(datasets[0].data).toEqual([5, 7, null, 9, null]);
    expect(datasets[0].spanGaps).toBe(false);
    expect(last().plugins.map((p: any) => p.id)).toEqual(['vsTodayLine', 'vsCrosshair']);
  });

  it('area draws left to right, line rises, and reduced motion turns animation off', () => {
    render(<LineChart dates={DATES} series={SERIES} ariaLabel="x" today={TODAY} />);
    expect(last().options.animation.x.easing).toBe('linear');
    expect(last().data.datasets[0].fill).toBe(true);
    cleanup();

    render(<LineChart dates={DATES} series={SERIES} ariaLabel="x" today={TODAY} variant="line" />);
    expect(last().options.animation.duration).toBe(LINE_CHART_DRAW_MS);
    expect(last().data.datasets[0].fill).toBe(false);
    cleanup();

    reducedMotion = true;
    render(<LineChart dates={DATES} series={SERIES} ariaLabel="x" today={TODAY} />);
    expect(last().options.animation).toBe(false);
  });

  it('a sparkline has no axes, legend, tooltip, events or today line', () => {
    render(<LineChart dates={DATES} series={SERIES} ariaLabel="x" today={TODAY} variant="sparkline" />);
    const c = last();
    expect(c.options.scales.x.display).toBe(false);
    expect(c.options.scales.y.display).toBe(false);
    expect(c.options.plugins.tooltip.enabled).toBe(false);
    expect(c.options.events).toEqual([]);
    expect(c.plugins).toEqual([]);
    expect(screen.queryByText('Downloads')).toBeNull();
  });

  it('adds a right axis only when a series asks for it', () => {
    render(<LineChart dates={DATES} series={SERIES} ariaLabel="x" today={TODAY} />);
    expect(last().options.scales.y1).toBeUndefined();
    cleanup();
    render(
      <LineChart dates={DATES} ariaLabel="x" today={TODAY}
        series={[SERIES[0], { id: 'v', label: 'Views', data: [50, 70, 90], axis: 'right' }]} />
    );
    expect(last().options.scales.y1.position).toBe('right');
    expect(last().data.datasets[1].yAxisID).toBe('y1');
  });

  it('uses given colours, falls back on a bad one, and formats tooltip values', () => {
    render(
      <LineChart dates={DATES} ariaLabel="x" today={TODAY} formatValue={(v) => `${v} dl`}
        series={[{ ...SERIES[0], color: '#005C55' }, { id: 'b', label: 'B', data: [1, 2, 3], color: 'not-a-colour' }]} />
    );
    const ds = last().data.datasets;
    expect(ds[0].borderColor).toBe('#005c55');
    expect(ds[1].borderColor).toBe('#4caf50');
    expect(last().options.plugins.tooltip.callbacks.label({ dataset: { label: 'Downloads' }, raw: 4 })).toBe('Downloads: 4 dl');
    expect(last().options.plugins.tooltip.filter({ raw: null })).toBe(false);
  });

  it('does not redraw when the parent re-renders with equal inline data, but does when data changes', () => {
    const { rerender, unmount } = render(<LineChart dates={[...DATES]} series={[{ ...SERIES[0] }]} ariaLabel="x" today={new Date(TODAY)} formatValue={(v) => String(v)} />);
    expect(charts).toHaveLength(1);
    rerender(<LineChart dates={[...DATES]} series={[{ ...SERIES[0] }]} ariaLabel="x" today={new Date(TODAY)} formatValue={(v) => String(v)} />);
    expect(charts).toHaveLength(1);
    rerender(<LineChart dates={[...DATES]} series={[{ ...SERIES[0], data: [1, 1, 1] }]} ariaLabel="x" today={new Date(TODAY)} />);
    expect(charts).toHaveLength(2);
    expect(charts[0].destroy).toHaveBeenCalledTimes(1);
    unmount();
    expect(charts[1].destroy).toHaveBeenCalledTimes(1);
  });

  it('with no data still renders the axis around today', () => {
    render(<LineChart dates={[]} series={[{ id: 'a', label: 'A', data: [] }]} ariaLabel="x" today={TODAY} />);
    expect(last().data.labels).toEqual(['22 Oct (Today)', '23 Oct']);
    expect(last().data.datasets[0].data).toEqual([null, null]);
  });
});

describe('LineChart ticks', () => {
  it('uses whole-number ticks for counts only', () => {
    render(<LineChart dates={DATES} series={SERIES} ariaLabel="x" today={TODAY} />);
    expect(last().options.scales.y.ticks.precision).toBe(0);
    cleanup();
    render(<LineChart dates={DATES} series={[{ id: 'r', label: 'Rate', data: [0.5, 1, 2.5] }]} ariaLabel="x" today={TODAY} />);
    expect(last().options.scales.y.ticks.precision).toBeUndefined();
  });
});

describe('withAlpha', () => {
  it('adds an alpha to hex and rgb colours and leaves anything else alone', () => {
    expect(withAlpha('#005c55', 0.3)).toBe('rgba(0, 92, 85, 0.3)');
    expect(withAlpha('rgb(1, 2, 3)', 0)).toBe('rgba(1, 2, 3, 0)');
    expect(withAlpha('rgba(1, 2, 3, 0.9)', 0.5)).toBe('rgba(1, 2, 3, 0.5)');
    expect(withAlpha('red', 0.5)).toBe('red');
  });
});

describe('AnimatedNumber', () => {
  it('counts up to the value and gives screen readers the final value at once', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    render(<AnimatedNumber value={4214} duration={1000} />);
    const el = screen.getByLabelText('4,214');
    expect(el.textContent).toBe('0');
    act(() => { vi.advanceTimersByTime(500); });
    const mid = Number(el.textContent!.replace(/,/g, ''));
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(4214);
    act(() => { vi.advanceTimersByTime(600); });
    expect(el.textContent).toBe('4,214');
    vi.useRealTimers();
  });

  it('shows the final value at once with reduced motion, and treats a bad value as 0', () => {
    reducedMotion = true;
    render(<AnimatedNumber value={27} />);
    expect(screen.getByLabelText('27').textContent).toBe('27');
    cleanup();
    render(<AnimatedNumber value={Number.NaN} />);
    expect(screen.getByLabelText('0').textContent).toBe('0');
  });
});
