import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

// jsdom has no canvas: Chart.js is replaced by a recorder; these tests check the configuration.
const charts: { config: any; destroy: ReturnType<typeof vi.fn>; draw: ReturnType<typeof vi.fn> }[] = [];
vi.mock('chart.js', () => {
  class Chart {
    static register() {}
    static defaults = { font: { family: 'sans-serif' } };
    config: any;
    destroy = vi.fn();
    draw = vi.fn();
    data: any;
    chartArea = { left: 0, right: 400, top: 0, bottom: 200 };
    scales = { x: { getValueForPixel: (px: number) => px * 1000 } };
    constructor(_canvas: unknown, config: any) {
      this.config = config;
      this.data = config.data;
      charts.push(this as any);
    }
  }
  const el = {};
  return { Chart, LineController: el, LineElement: el, PointElement: el, LinearScale: el, ScatterController: el, Tooltip: el, Filler: el };
});

import {
  TimeSeriesLineChart,
  isIsolatedPoint,
  sortMarkersByUrgency,
  localMidnightsBetween,
  localHoursBetween,
  dullColor,
  isNewDrawing,
} from './TimeSeriesLineChart';
import type { TimeSeriesLineChartProps, TimeSeriesMarker } from './TimeSeriesLineChart';

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

const T0 = new Date(2026, 10, 20, 0, 0).getTime();
const H = 3600_000;
const POINTS = [{ x: T0, y: 10 }, { x: T0 + H, y: null }, { x: T0 + 2 * H, y: 50 }, { x: T0 + 3 * H, y: null }, { x: T0 + 4 * H, y: 95 }, { x: T0 + 5 * H, y: 20 }];
const THRESH = { warning: 70, danger: 90 };
const MARKERS: TimeSeriesMarker[] = [
  { id: 'd1', x: T0 + 4 * H, y: 95, severity: 'danger' },
  { id: 'w1', x: T0 + 2 * H, y: 75, severity: 'warning', status: 'resolved' },
  { id: 'd2', x: T0 + 5 * H, y: 92, severity: 'danger', status: 'ignored', primary: true },
];
const base: TimeSeriesLineChartProps = { points: POINTS, thresholds: THRESH, from: T0, to: T0 + 6 * H, days: 1, seriesLabel: 'CPU', ariaLabel: 'CPU usage' };
const draw = (p: Partial<TimeSeriesLineChartProps> = {}) => {
  const r = render(<TimeSeriesLineChart {...base} {...p} />);
  return { ...r, chart: charts[charts.length - 1] };
};
const ds = (chart: any, label: string) => chart.config.data.datasets.find((d: any) => d.label === label);

describe('TimeSeriesLineChart', () => {
  it('canvas is role="img" with the label; the main line keeps null gaps (spanGaps false), straight segments', () => {
    const { container, chart } = draw();
    expect(container.querySelector('canvas')!.getAttribute('aria-label')).toBe('CPU usage');
    const main = ds(chart, 'CPU');
    expect(main.data).toBe(POINTS);
    expect(main.spanGaps).toBe(false);
    expect(main.tension).toBe(0);
  });
  it('a lone reading (no neighbour) gets a dot, others none', () => {
    const { chart } = draw();
    const r = ds(chart, 'CPU').pointRadius;
    expect([0, 1, 2, 3, 4].map((i) => r({ dataIndex: i }))).toEqual([3, 0, 3, 0, 0]);
  });
  it('dotted Warning and Danger lines in their colours, across to the end of the future space', () => {
    const { chart } = draw({ futureMs: 2 * H, colors: { warning: '#e08a00', danger: '#c13b3b' } });
    const w = ds(chart, 'Warning threshold');
    const d = ds(chart, 'Danger threshold');
    expect(w.borderDash).toEqual([2, 4]);
    expect(w.borderColor).toBe('#e08a00');
    expect(d.borderColor).toBe('#c13b3b');
    expect(w.data).toEqual([{ x: T0, y: 70 }, { x: T0 + 8 * H, y: 70 }]);
  });
  it('a stretch that reaches a threshold is drawn in its colour', () => {
    const { chart } = draw({ colors: { line: '#4caf50', warning: '#e08a00', danger: '#c13b3b' } });
    const seg = ds(chart, 'CPU').segment.borderColor;
    expect(seg({ p0DataIndex: 0, p1DataIndex: 0 })).toBe('#4caf50');
    expect(seg({ p0DataIndex: 4, p1DataIndex: 5 })).toBe('#c13b3b');
    expect(seg({ p0DataIndex: 2, p1DataIndex: 2 })).toBe('#4caf50');
  });
  it('futureMs adds a dotted Now line at `to`; none without it', () => {
    expect(ds(draw({ futureMs: H }).chart, 'Now').data[0].x).toBe(T0 + 6 * H);
    cleanup();
    expect(ds(draw().chart, 'Now')).toBeUndefined();
  });
  it('markers: urgent ones drawn last; shape by severity and status; the primary one bigger', () => {
    const { chart } = draw({ markers: MARKERS });
    const m = ds(chart, 'Spike event');
    expect(m.data.map((p: any) => p.id)).toEqual(['d2', 'w1', 'd1']); // ignored, resolved, new
    expect(m.pointStyle[0]).toBe('circle'); // ignored: grey dot
    expect(m.pointRadius).toEqual([4, 7, 7]);
  });
  it('tooltip says severity, status and value; thresholds and Now are left out', () => {
    const { chart } = draw({ markers: MARKERS, formatValue: (v) => `${v.toFixed(1)}%`, futureMs: H });
    const tt = chart.config.options.plugins.tooltip;
    expect(tt.callbacks.label({ raw: { severity: 'danger', status: 'new', y: 95 }, dataset: { label: 'Spike event' } })).toBe('Danger event · Needs review: 95.0%');
    expect(tt.callbacks.afterLabel({ raw: { id: 'd1' } })).toBe('Click to open event details');
    expect(tt.filter({ dataset: { label: 'Warning threshold' } })).toBe(false);
    expect(tt.filter({ dataset: { label: 'Now' } })).toBe(false);
    expect(tt.filter({ dataset: { label: 'CPU' } })).toBe(true);
  });
  it('a click on a marker calls onSelectMarker; a click on empty plot calls onZoomAt with the time', () => {
    const onSelectMarker = vi.fn();
    const onZoomAt = vi.fn();
    const { chart } = draw({ markers: MARKERS, onSelectMarker, onZoomAt });
    const markerIndex = chart.config.data.datasets.findIndex((d: any) => d.label === 'Spike event');
    chart.config.options.onClick({ x: 10, y: 10 }, [{ datasetIndex: markerIndex, index: 2 }]);
    expect(onSelectMarker).toHaveBeenCalledWith('d1');
    expect(onZoomAt).not.toHaveBeenCalled();
    chart.config.options.onClick({ x: 120, y: 50 }, []);
    expect(onZoomAt).toHaveBeenCalledWith(120000);
  });
  it('yMax: given value, else 15% above the highest value, threshold or marker', () => {
    expect(draw({ yMax: 100 }).chart.config.options.scales.y.max).toBe(100);
    cleanup();
    expect(draw().chart.config.options.scales.y.max).toBe(109.3); // 95 x 1.15 = 109.25 -> 109.3
  });
  it('highest adds a ring', () => {
    expect(ds(draw({ highest: { value: 95, t: T0 + 4 * H } }).chart, 'Highest').pointRadius).toBe(14);
  });
  it('liveDot adds the hidden DS live dot element', () => {
    expect(draw({ liveDot: true }).container.querySelector('.vs-live-dot[hidden]')).not.toBeNull();
    cleanup();
    expect(draw().container.querySelector('.vs-live-dot')).toBeNull();
  });
  it('animates the first drawing, not a rebuild with the same data; never with reduced motion', () => {
    const r = render(<TimeSeriesLineChart {...base} />);
    expect(charts[0].config.options.animation).toMatchObject({ duration: 800 });
    r.rerender(<TimeSeriesLineChart {...base} clickHint="x" />);
    expect(charts[1].config.options.animation).toBe(false);
    cleanup();
    reducedMotion = true;
    expect(draw().chart.config.options.animation).toBe(false);
  });
  it('a new formatter function on each render does not rebuild the chart', () => {
    const r = render(<TimeSeriesLineChart {...base} formatValue={(v) => String(v)} />);
    r.rerender(<TimeSeriesLineChart {...base} formatValue={(v) => String(v)} />);
    expect(charts).toHaveLength(1);
  });
  it('day ticks: one per local midnight, today bold and "(Today)"; narrow screens show the day number', () => {
    const { chart } = draw({ tickStep: 'day', from: T0, to: T0 + 2 * 24 * H, days: 3, futureMs: 24 * H });
    const scale: any = {};
    chart.config.options.scales.x.afterBuildTicks(scale);
    expect(scale.ticks).toHaveLength(3);
    const cb = chart.config.options.scales.x.ticks.callback;
    const today = T0 + 2 * 24 * H;
    expect(cb.call({ chart: { width: 800 } }, today)).toMatch(/\(Today\)$/);
    expect(cb.call({ chart: { width: 390 } }, today)).toBe('Today');
    expect(chart.config.options.scales.x.ticks.font({ tick: { value: today } }).weight).toBe('bold');
  });
});

describe('TimeSeriesLineChart helpers', () => {
  it('isIsolatedPoint', () => {
    expect(isIsolatedPoint([null, 5, null], 1)).toBe(true);
    expect(isIsolatedPoint([4, 5, null], 1)).toBe(false);
    expect(isIsolatedPoint([null, null], 0)).toBe(false);
  });
  it('sortMarkersByUrgency: ignored, resolved, investigating, new; Warning before Danger', () => {
    const list = sortMarkersByUrgency([
      { severity: 'danger' as const, status: 'new' as const },
      { severity: 'warning' as const, status: 'new' as const },
      { severity: 'danger' as const, status: 'ignored' as const },
      { severity: 'danger' as const },
    ]);
    expect(list.map((m) => `${m.severity}/${m.status ?? 'new'}`)).toEqual(['danger/ignored', 'warning/new', 'danger/new', 'danger/new']);
  });
  it('local ticks', () => {
    expect(localMidnightsBetween(T0, T0 + 47 * H)).toEqual([T0, T0 + 24 * H]);
    expect(localHoursBetween(T0, T0 + 6 * H, 3)).toEqual([T0, T0 + 3 * H, T0 + 6 * H]);
  });
  it('dullColor mixes hex with the surface; other input unchanged', () => {
    expect(dullColor('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(dullColor('var(--x)', '#ffffff')).toBe('var(--x)');
  });
  it('isNewDrawing', () => {
    const a = [1];
    expect(isNewDrawing(null, [a])).toBe(true);
    expect(isNewDrawing([a], [a])).toBe(false);
    expect(isNewDrawing([a], [[1]])).toBe(true);
  });
});
