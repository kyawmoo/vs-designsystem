import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

// jsdom has no canvas: Chart.js is replaced by a recorder; these tests check the configuration.
const charts: { config: any; destroy: ReturnType<typeof vi.fn> }[] = [];
vi.mock('chart.js', () => {
  class Chart {
    static register() {}
    static defaults = { font: { family: 'sans-serif' } };
    config: any;
    destroy = vi.fn();
    constructor(_canvas: unknown, config: any) {
      this.config = config;
      charts.push(this as any);
    }
  }
  const el = {};
  return { Chart, BarController: el, BarElement: el, CategoryScale: el, LinearScale: el, Tooltip: el };
});

import { RankedBarChart, fitLabel } from './RankedBarChart';

let reducedMotion = false;
beforeEach(() => {
  charts.length = 0;
  reducedMotion = false;
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function () {
    let fill = '#000000';
    return {
      get fillStyle() { return fill; },
      set fillStyle(v: string) { if (/^(#|rgb)/.test(v)) fill = v.toLowerCase(); },
      font: '',
      save() {},
      restore() {},
      measureText: (t: string) => ({ width: t.length * 6 }),
    } as unknown as CanvasRenderingContext2D;
  } as any);
  window.matchMedia = ((q: string) => ({ matches: reducedMotion && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as any;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const ROWS = [
  { label: 'Thailand (TH)', value: 1200 },
  { label: 'India (IN)', value: 860 },
];
const last = () => charts[charts.length - 1].config;

describe('RankedBarChart', () => {
  it('draws one horizontal bar per row, in the order given, with an accessible name', () => {
    render(<RankedBarChart rows={ROWS} ariaLabel="Downloads by country" valueLabel="Downloads" />);
    expect(screen.getByRole('img', { name: 'Downloads by country' })).toBeTruthy();
    expect(last().type).toBe('bar');
    expect(last().options.indexAxis).toBe('y');
    expect(last().data.labels).toEqual(['Thailand (TH)', 'India (IN)']);
    expect(last().data.datasets[0].data).toEqual([1200, 860]);
  });

  it('grows with the rows but never below minHeight', () => {
    const { container, rerender } = render(<RankedBarChart rows={ROWS} ariaLabel="x" />);
    expect((container.querySelector('.vs-line-chart-canvas') as HTMLElement).style.height).toBe('240px');
    const many = Array.from({ length: 20 }, (_, i) => ({ label: `L${i}`, value: i + 1 }));
    rerender(<RankedBarChart rows={many} ariaLabel="x" />);
    expect((container.querySelector('.vs-line-chart-canvas') as HTMLElement).style.height).toBe('680px');
  });

  it('counts negative, missing and non-finite values as 0 (no NaN)', () => {
    render(
      <RankedBarChart
        rows={[{ label: 'a', value: -5 }, { label: 'b', value: NaN }, { label: 'c', value: Infinity }, { label: 'd', value: '7' as unknown as number }]}
        ariaLabel="x"
      />,
    );
    expect(last().data.datasets[0].data).toEqual([0, 0, 0, 7]);
  });

  it('shows the empty text and creates no chart when there are no rows', () => {
    render(<RankedBarChart rows={[]} ariaLabel="Downloads by country" empty="Nothing yet" />);
    expect(screen.getByText('Nothing yet')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Downloads by country' })).toBeTruthy();
    expect(charts).toHaveLength(0);
  });

  it('puts the full name and the formatted value in the hover text', () => {
    render(<RankedBarChart rows={ROWS} ariaLabel="x" valueLabel="Downloads" formatValue={(v) => `${v} dl`} />);
    const tip = last().options.plugins.tooltip.callbacks;
    expect(tip.title([{ dataIndex: 1 }])).toBe('India (IN)');
    expect(tip.label({ parsed: { x: 860 } })).toBe(' Downloads: 860 dl');
  });

  it('uses tokens, hides the legend and destroys the chart on unmount', () => {
    const { unmount } = render(<RankedBarChart rows={ROWS} ariaLabel="x" />);
    expect(last().options.plugins.legend.display).toBe(false);
    unmount();
    expect(charts[0].destroy).toHaveBeenCalledTimes(1);
  });

  it('draws without animation under reduced motion', () => {
    reducedMotion = true;
    render(<RankedBarChart rows={ROWS} ariaLabel="x" />);
    expect(last().options.animation).toBe(false);
  });
});

describe('fitLabel', () => {
  const widthOf = (max: number) => (s: string) => s.length <= max;
  it('keeps a name that fits', () => {
    expect(fitLabel('Thailand (TH)', widthOf(20))).toBe('Thailand (TH)');
  });
  it('drops the trailing code before cutting letters', () => {
    expect(fitLabel('Thailand (TH)', widthOf(10))).toBe('Thailand');
  });
  it('cuts letters and adds an ellipsis when the name alone is too long', () => {
    const out = fitLabel('Bosnia and Herzegovina (BA)', widthOf(8));
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(8);
  });
  it('never returns an empty text', () => {
    expect(fitLabel('Ab', widthOf(0)).length).toBeGreaterThan(0);
  });
});
