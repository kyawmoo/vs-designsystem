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

import { BarChart, linePointPosition } from './BarChart';

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

  it('rounds only the top part of a stacked column', () => {
    render(<BarChart dates={DATES} series={[FREE, PREMIUM]} stacked ariaLabel="x" today={TODAY} />);
    const [free, premium] = last().data.datasets;
    const ROUND = { topLeft: 6, topRight: 6 };
    // 20 Oct: free 3 + premium 1 -> premium is on top
    expect(free.borderRadius(ctxFor(0, 0))).toBe(0);
    expect(premium.borderRadius(ctxFor(1, 0))).toEqual(ROUND);
    // 22 Oct: premium is 0 -> free is the top
    expect(free.borderRadius(ctxFor(0, 2))).toEqual(ROUND);
  });

  it('few days get wide bars without a cap, many days slim capped bars', () => {
    render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} />);
    expect(last().data.datasets[0].maxBarThickness).toBeUndefined();
    expect(last().data.datasets[0].barPercentage).toBe(0.94);
    cleanup();
    const many = Array.from({ length: 30 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`);
    render(<BarChart dates={many} series={[{ id: 'f', label: 'F', data: many.map(() => 1) }]} ariaLabel="x" today={TODAY} />);
    expect(last().data.datasets[0].maxBarThickness).toBe(28);
    expect(last().data.datasets[0].barPercentage).toBe(0.82);
  });

  it('fills bars with a gradient, and fades the other days while one day is hovered', () => {
    render(<BarChart dates={DATES} series={[{ ...FREE, color: '#005c55' }]} ariaLabel="x" today={TODAY} />);
    const c = last();
    const bg = c.data.datasets[0].backgroundColor;
    const gradient = { addColorStop: vi.fn() };
    const ctxOf = (dataIndex: number) => ({ dataIndex, chart: { chartArea: { top: 0, bottom: 100 }, ctx: { createLinearGradient: () => gradient } } });
    expect(bg(ctxOf(0))).toBe(gradient);
    expect(gradient.addColorStop).toHaveBeenCalledWith(0, '#005c55');
    expect(gradient.addColorStop).toHaveBeenCalledWith(1, 'rgba(0, 92, 85, 0.55)');
    const chart = { update: vi.fn() };
    c.options.onHover({}, [{ index: 2 }], chart);
    expect(chart.update).toHaveBeenCalledWith('none');
    expect(bg(ctxOf(0))).toBe('rgba(0, 92, 85, 0.18)');
    expect(bg(ctxOf(2))).toBe(gradient);
    c.options.onHover({}, [{ index: 2 }], chart);
    expect(chart.update).toHaveBeenCalledTimes(1);
    c.options.onHover({}, [], chart);
    expect(bg(ctxOf(0))).toBe(gradient);
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

  it('uses whole-number ticks for counts only', () => {
    render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} />);
    expect(last().options.scales.y.ticks.precision).toBe(0);
    cleanup();
    render(<BarChart dates={DATES} series={[{ id: 'r', label: 'Rate', data: [0.5, 1.25] }]} ariaLabel="x" today={TODAY} />);
    expect(last().options.scales.y.ticks.precision).toBeUndefined();
  });
});

// Baseline for Task 7: what BarChart does today (before legendPosition / pinTooltip / todayMarker).
// These must keep passing unchanged after the new opt-in props are added.
describe('BarChart baseline (defaults must not change)', () => {
  it('puts the legend row above the canvas, with no position modifier', () => {
    const { container } = render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toBe('vs-line-chart vs-bar-chart');
    const kids = Array.from(root.children).map((c) => c.className);
    expect(kids).toEqual(['vs-line-chart-legend', 'vs-line-chart-canvas']);
  });

  it('draws the today line dotted in the orange chart token, and labels today in bold orange', () => {
    render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} />);
    const c = last();
    const calls: any = { dash: null, stroke: null, moves: [] as number[][] };
    const g: any = {
      save() {}, restore() {}, beginPath() {}, stroke() {},
      setLineDash(d: number[]) { calls.dash = d; },
      moveTo(x: number, y: number) { calls.moves.push([x, y]); },
      lineTo(x: number, y: number) { calls.moves.push([x, y]); },
      set strokeStyle(v: string) { calls.stroke = v; },
      set lineWidth(_v: number) {},
    };
    const chart: any = { scales: { x: { getPixelForValue: (i: number) => i * 10 } }, chartArea: { top: 5, bottom: 95 }, ctx: g };
    c.plugins[0].afterDatasetsDraw(chart);
    expect(calls.dash).toEqual([4, 4]);
    expect(calls.stroke).toBe('#ff7a14');
    expect(calls.moves).toEqual([[20, 5], [20, 95]]);
    const ticks = c.options.scales.x.ticks;
    expect(ticks.color({ index: 2 })).toBe('#ff7a14');
    expect(ticks.color({ index: 0 })).toBe('#8e9cba');
    expect(ticks.font({ index: 2 })).toEqual({ size: 11, weight: 'bold' });
    expect(ticks.font({ index: 0 })).toEqual({ size: 11, weight: 'normal' });
  });

  it('keeps the hover-only tooltip: index mode, dark heading colour, no external or custom events', () => {
    render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} />);
    const o = last().options;
    expect(o.interaction).toEqual({ mode: 'index', intersect: false });
    expect(o.plugins.legend).toEqual({ display: false });
    expect(o.plugins.tooltip.backgroundColor).toBe('#010d4c');
    expect(o.plugins.tooltip.external).toBeUndefined();
    expect(o.events).toBeUndefined();
    expect(o.onLeave).toBeUndefined();
    expect(Object.keys(o).sort()).toEqual(['animation', 'interaction', 'layout', 'maintainAspectRatio', 'onHover', 'plugins', 'responsive', 'scales']);
  });

  it('hides the legend row when showLegend is false', () => {
    const { container } = render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} showLegend={false} />);
    expect(container.querySelector('.vs-line-chart-legend')).toBeNull();
  });
});

describe('BarChart dashboard options (Task 7)', () => {
  it('legendPosition="bottom" puts the legend under the canvas, centred; top is the default', () => {
    const { container } = render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} legendPosition="bottom" />);
    const kids = Array.from((container.firstElementChild as HTMLElement).children).map((c) => c.className);
    expect(kids).toEqual(['vs-line-chart-canvas', 'vs-line-chart-legend vs-line-chart-legend--bottom']);
    cleanup();
    const top = render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} legendPosition="top" />);
    expect(Array.from((top.container.firstElementChild as HTMLElement).children).map((c) => c.className)).toEqual(['vs-line-chart-legend', 'vs-line-chart-canvas']);
  });

  it('legendPosition="bottom" with showLegend=false still shows no legend', () => {
    const { container } = render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} legendPosition="bottom" showLegend={false} />);
    expect(container.querySelector('.vs-line-chart-legend')).toBeNull();
  });

  it('todayMarker="dark" draws the line and the (Today) label in the dark marker colour', () => {
    render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} todayMarker="dark" />);
    const c = last();
    let stroke = '';
    const g: any = { save() {}, restore() {}, beginPath() {}, stroke() {}, setLineDash() {}, moveTo() {}, lineTo() {}, set strokeStyle(v: string) { stroke = v; }, set lineWidth(_v: number) {} };
    c.plugins[0].afterDatasetsDraw({ scales: { x: { getPixelForValue: () => 1 } }, chartArea: { top: 0, bottom: 1 }, ctx: g });
    expect(stroke).toBe('#222222');
    expect(c.options.scales.x.ticks.color({ index: 2 })).toBe('#222222');
    expect(c.options.scales.x.ticks.color({ index: 0 })).toBe('#8e9cba');
  });

  it('pinTooltip is off by default: no plugin, no onComplete', () => {
    render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} />);
    expect(last().plugins.map((p: any) => p.id)).toEqual(['vsTodayLine', 'vsValueLabels']);
    expect(last().options.animation.onComplete).toBeUndefined();
  });

  function fakeChart(active: any[] = []) {
    const calls: any = { chart: null, tooltip: null, updates: [] };
    const chart: any = {
      tooltip: { getActiveElements: () => active, setActiveElements: (a: any, p: any) => { calls.tooltip = [a, p]; } },
      getDatasetMeta: () => ({ data: [{}, {}, { x: 50, y: 60 }, {}] }),
      setActiveElements: (a: any) => { calls.chart = a; },
      update: (m: string) => calls.updates.push(m),
    };
    return { chart, calls };
  }

  it('pinTooltip clears the hover fade when the pinned tooltip comes back', async () => {
    render(<BarChart dates={DATES} series={[{ ...FREE, color: '#005c55' }]} ariaLabel="x" today={TODAY} pinTooltip />);
    const c = last();
    const bg = c.data.datasets[0].backgroundColor;
    const gradient = { addColorStop: vi.fn() };
    const ctxOf = (dataIndex: number) => ({ dataIndex, chart: { chartArea: { top: 0, bottom: 100 }, ctx: { createLinearGradient: () => gradient } } });
    c.options.onHover({}, [{ index: 0 }], { update: vi.fn() });
    expect(bg(ctxOf(1))).toBe('rgba(0, 92, 85, 0.18)');
    const { chart } = fakeChart([]);
    c.plugins.find((p: any) => p.id === 'vsPinTooltip').afterEvent(chart, { event: { type: 'mouseout' } });
    await Promise.resolve();
    await Promise.resolve();
    expect(bg(ctxOf(1))).toBe(gradient);
  });

  it('pinTooltip pins the latest day with a value, once the bars have grown', () => {
    render(<BarChart dates={DATES} series={[FREE, PREMIUM]} ariaLabel="x" today={TODAY} pinTooltip />);
    expect(last().plugins.map((p: any) => p.id)).toEqual(['vsTodayLine', 'vsValueLabels', 'vsPinTooltip']);
    const { chart, calls } = fakeChart();
    last().options.animation.onComplete({ chart });
    // today (22 Oct) is index 2; both series have a value that day (premium is 0, not null)
    expect(calls.chart).toEqual([{ datasetIndex: 0, index: 2 }, { datasetIndex: 1, index: 2 }]);
    expect(calls.tooltip).toEqual([calls.chart, { x: 50, y: 60 }]);
    expect(calls.updates).toEqual(['none']);
    // a later animation (e.g. a resize) must not override a tooltip the user is hovering
    const second = fakeChart();
    last().options.animation.onComplete({ chart: second.chart });
    expect(second.calls.chart).toBeNull();
  });

  it('pinTooltip leaves out a series that has no value on the pinned day', () => {
    render(<BarChart dates={DATES} series={[FREE, { id: 'n', label: 'N', data: [5, null] }]} ariaLabel="x" today={TODAY} pinTooltip />);
    const { chart, calls } = fakeChart();
    last().options.animation.onComplete({ chart });
    expect(calls.chart).toEqual([{ datasetIndex: 0, index: 2 }]);
  });

  it('pinTooltip never pins a day after today, even with a value on it', () => {
    render(<BarChart dates={['2026-10-21', '2026-10-22', '2026-10-23']} series={[{ id: 'f', label: 'F', data: [1, 4, 99] }]} ariaLabel="x" today={TODAY} pinTooltip />);
    const { chart, calls } = fakeChart();
    last().options.animation.onComplete({ chart });
    expect(calls.chart).toEqual([{ datasetIndex: 0, index: 1 }]);
  });

  it('pinTooltip falls back to the last day with data when today has none', () => {
    render(<BarChart dates={['2026-10-19', '2026-10-20']} series={[FREE]} ariaLabel="x" today={TODAY} pinTooltip />);
    const { chart, calls } = fakeChart();
    last().options.animation.onComplete({ chart });
    expect(calls.chart).toEqual([{ datasetIndex: 0, index: 1 }]);
  });

  it('pinTooltip brings the pinned tooltip back when the pointer leaves, but not while hovering', async () => {
    render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} pinTooltip />);
    const pinPlugin = last().plugins.find((p: any) => p.id === 'vsPinTooltip');
    const left = fakeChart([]);
    pinPlugin.afterEvent(left.chart, { event: { type: 'mouseout' } });
    await Promise.resolve();
    await Promise.resolve();
    expect(left.calls.chart).toEqual([{ datasetIndex: 0, index: 2 }]);
    const hovering = fakeChart([{ datasetIndex: 0, index: 0 }]);
    pinPlugin.afterEvent(hovering.chart, { event: { type: 'mousemove' } });
    await Promise.resolve();
    await Promise.resolve();
    expect(hovering.calls.chart).toBeNull();
  });

  it('pinTooltip with reduced motion pins after the first render only', () => {
    reducedMotion = true;
    render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} pinTooltip />);
    expect(last().options.animation).toBe(false);
    const pinPlugin = last().plugins.find((p: any) => p.id === 'vsPinTooltip');
    const first = fakeChart();
    pinPlugin.afterRender(first.chart);
    expect(first.calls.chart).toEqual([{ datasetIndex: 0, index: 2 }]);
    const again = fakeChart();
    pinPlugin.afterRender(again.chart);
    expect(again.calls.chart).toBeNull();
  });

  it('pinTooltip does nothing when no day has data', () => {
    render(<BarChart dates={DATES} series={[{ id: 'e', label: 'E', data: [null, null] }]} ariaLabel="x" today={TODAY} pinTooltip />);
    const { chart, calls } = fakeChart();
    last().options.animation.onComplete({ chart });
    expect(calls.chart).toBeNull();
  });

  it('redraws when pinTooltip or todayMarker change', () => {
    const { rerender } = render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} />);
    rerender(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} pinTooltip />);
    rerender(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} pinTooltip todayMarker="dark" />);
    expect(charts).toHaveLength(3);
  });

  // ── Dashboard style (25 Nov 2026): barStyle, lineStyle, tooltipTone, xLabels, rightAxis, legendPosition="bottom-end" ──

  const MIXED = [
    { id: 'dl', label: 'Downloads', data: [3, 4], axis: 'right' as const, color: '#743cee' },
    { id: 'u', label: 'Visitors', data: [30, 40], type: 'line' as const, color: '#2e7d32' },
  ];
  const gradientCtx = (dataIndex: number, gradient: any) => ({ dataIndex, chart: { chartArea: { top: 0, bottom: 100 }, ctx: { createLinearGradient: () => gradient } } });

  it('defaults keep the old look: no markers plugin, smooth line, wide full-colour bars, visible right axis', () => {
    render(<BarChart dates={DATES} series={MIXED} ariaLabel="x" today={TODAY} />);
    const c = last();
    expect(c.plugins.map((p: any) => p.id)).toEqual(['vsTodayLine', 'vsValueLabels']);
    const [bars, line] = c.data.datasets;
    expect(line.tension).toBe(0.35);
    expect(line.borderWidth).toBe(2.5);
    expect(line.pointRadius({ dataIndex: 0 })).toBe(0);
    expect(bars.barPercentage).toBe(0.94);
    expect(c.options.scales.y1.display).toBeUndefined();
    expect(c.options.plugins.tooltip.backgroundColor).toBe('#010d4c');
    expect(c.options.plugins.tooltip.titleColor).toBe('#ffffff');
  });

  it('barStyle="soft": light gradient (55% to 18%), half-column bars up to the standard width, standing on the axis, fainter fade on hover', () => {
    const many = Array.from({ length: 30 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`);
    render(<BarChart dates={many} series={[{ id: 'f', label: 'F', data: many.map(() => 1), color: '#743cee' }]} ariaLabel="x" today={TODAY} barStyle="soft" />);
    const c = last();
    const bars = c.data.datasets[0];
    expect(bars.maxBarThickness).toBe(12);
    expect(bars.barPercentage).toBe(0.5);
    // Round top, small bottom corners: the bar stands on the axis instead of floating as a pill.
    expect(bars.borderRadius).toEqual({ topLeft: 999, topRight: 999, bottomLeft: 5, bottomRight: 5 });
    const gradient = { addColorStop: vi.fn() };
    expect(bars.backgroundColor(gradientCtx(0, gradient))).toBe(gradient);
    expect(gradient.addColorStop).toHaveBeenCalledWith(0, 'rgba(116, 60, 238, 0.55)');
    expect(gradient.addColorStop).toHaveBeenCalledWith(1, 'rgba(116, 60, 238, 0.18)');
    c.options.onHover({}, [{ index: 3 }], { update: vi.fn() });
    expect(bars.backgroundColor(gradientCtx(0, gradient))).toBe('rgba(116, 60, 238, 0.08)');
  });

  it('barStyle="soft" on a few days: half-column bars that grow up to 32px (wide columns get wide bars)', () => {
    render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} barStyle="soft" />);
    expect(last().data.datasets[0].maxBarThickness).toBe(32);
    expect(last().data.datasets[0].barPercentage).toBe(0.5);
  });

  it('barStyle="soft": up to 10 days count as few (32px), 11 or more keep the 12px standard width', () => {
    const range = (n: number) => Array.from({ length: n }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`);
    // The axis adds one empty day after today, so 9 dated days + 1 = 10 slots (few) and 10 + 1 = 11 slots (many).
    const nine = range(9);
    render(<BarChart dates={nine} series={[{ id: 'f', label: 'F', data: nine.map(() => 1) }]} ariaLabel="x" today={new Date(2026, 8, 9)} barStyle="soft" />);
    expect(last().data.datasets[0].maxBarThickness).toBe(32);
    const ten = range(10);
    render(<BarChart dates={ten} series={[{ id: 'f', label: 'F', data: ten.map(() => 1) }]} ariaLabel="x" today={new Date(2026, 8, 10)} barStyle="soft" />);
    expect(last().data.datasets[0].maxBarThickness).toBe(12);
  });

  it('barStyle="soft" on a stacked chart keeps the rounded top of each column only', () => {
    render(<BarChart dates={DATES} series={[FREE, PREMIUM]} stacked ariaLabel="x" today={TODAY} barStyle="soft" />);
    const [free] = last().data.datasets;
    expect(typeof free.borderRadius).toBe('function');
    expect(free.borderRadius(ctxFor(0, 0))).toBe(0);
  });

  it('lineStyle="markers": straight 3px line, a hollow dot on every value but today, and the markers plugin', () => {
    render(<BarChart dates={DATES} series={MIXED} ariaLabel="x" today={TODAY} lineStyle="markers" />);
    const c = last();
    const line = c.data.datasets[1];
    expect(line.tension).toBe(0);
    expect(line.borderWidth).toBe(3);
    expect(line.pointRadius({ dataIndex: 0 })).toBe(3.5);
    expect(line.pointRadius({ dataIndex: 2 })).toBe(0); // today: the plugin draws the large dot
    expect(line.pointBackgroundColor).toBe('#ffffff');
    expect(c.plugins.map((p: any) => p.id)).toEqual(['vsTodayLine', 'vsValueLabels', 'vsLineMarkers']);
  });

  const drawMarkers = (c: any, width: number, textWidth: number) => {
    const calls: any = { texts: [] as string[], arcs: [] as number[], fills: [] as string[] };
    let fill = '';
    const g: any = {
      save() {}, restore() {}, beginPath() {}, stroke() {},
      measureText: () => ({ width: textWidth }),
      fillText: (t: string) => calls.texts.push(t),
      arc: (_x: number, _y: number, r: number) => calls.arcs.push(r),
      fill: () => calls.fills.push(fill),
      set fillStyle(v: string) { fill = v; }, get fillStyle() { return fill; },
      set font(_v: string) {}, set textAlign(_v: string) {}, set textBaseline(_v: string) {}, set lineWidth(_v: number) {}, set strokeStyle(_v: string) {},
    };
    const points = [{ x: 10, y: 50 }, { x: 20, y: 50 }, { x: 30, y: 40 }, { x: 40, y: 40 }];
    const chart = { ctx: g, chartArea: { width }, getDatasetMeta: () => ({ data: points }) };
    c.plugins.find((p: any) => p.id === 'vsLineMarkers').afterDatasetsDraw(chart);
    return calls;
  };

  it('lineStyle="markers" writes every line value while they fit, none when one does not, and a dark today dot with a halo', () => {
    render(<BarChart dates={DATES} series={MIXED} ariaLabel="x" today={TODAY} lineStyle="markers" />);
    const c = last();
    const fits = drawMarkers(c, 400, 10);
    expect(fits.texts).toEqual(['30', '40']); // line values only, not the bars
    expect(fits.arcs).toEqual([17, 10]);
    expect(fits.fills).toEqual(['rgba(34, 34, 34, 0.16)', '#222222']);
    const tight = drawMarkers(c, 40, 30);
    expect(tight.texts).toEqual([]);
    expect(tight.arcs).toEqual([17, 10]);
  });

  it('lineStyle="markers" draws no today dot when the line has no value today', () => {
    render(<BarChart dates={DATES} series={[{ id: 'u', label: 'V', type: 'line', data: [5, null] }]} ariaLabel="x" today={TODAY} lineStyle="markers" />);
    expect(drawMarkers(last(), 400, 5).arcs).toEqual([]);
  });

  it('tooltipTone="dark": the dark surface colour, light title, rounder and roomier', () => {
    render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} tooltipTone="dark" />);
    const t = last().options.plugins.tooltip;
    expect(t.backgroundColor).toBe('rgba(34, 34, 34, 0.95)');
    expect(t.titleColor).toBe('#e8e5fc');
    expect(t.cornerRadius).toBe(8);
    expect(t.padding).toBe(12);
    expect(t.callbacks.labelColor({ datasetIndex: 0 })).toEqual({ borderColor: '#4caf50', backgroundColor: '#4caf50' });
  });

  it('lineStyle="markers" puts the tooltip beside the line point, its arrow clear of the today halo', () => {
    render(<BarChart dates={DATES} series={MIXED} ariaLabel="x" today={TODAY} lineStyle="markers" />);
    const t = last().options.plugins.tooltip;
    expect(t.position).toBe('vsLinePoint');
    expect(t.yAlign).toBe('center');
    expect(t.caretPadding).toBe(21);
    expect(t.xAlign).toBeUndefined(); // Chart.js picks the side: left of the point on the right half, right of it on the left half
    cleanup();
    render(<BarChart dates={DATES} series={MIXED} ariaLabel="x" today={TODAY} />);
    expect(last().options.plugins.tooltip.position).toBeUndefined();
  });

  it('linePointPosition anchors on the line point of the day, not the bar', () => {
    const ctx = { chart: { data: { datasets: [{ type: 'bar' }, { type: 'line' }] } } };
    const items = [
      { datasetIndex: 0, element: { x: 100, y: 260 } },
      { datasetIndex: 1, element: { x: 100, y: 180 } },
    ];
    expect(linePointPosition.call(ctx, items, {})).toEqual({ x: 100, y: 180 });
    // No line value that day: falls back (the mocked Chart.js has no average positioner).
    expect(linePointPosition.call(ctx, [items[0]], {})).toBe(false);
  });

  it('tooltipTone default keeps the Chart.js swatches (no labelColor callback)', () => {
    render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} />);
    expect(last().options.plugins.tooltip.callbacks.labelColor).toBeUndefined();
  });

  it('xLabels="ends" labels only the first day, the middle day and today', () => {
    const many = Array.from({ length: 21 }, (_, i) => `2026-10-${String(i + 2).padStart(2, '0')}`);
    render(<BarChart dates={many} series={[{ id: 'f', label: 'F', data: many.map(() => 1) }]} ariaLabel="x" today={TODAY} xLabels="ends" />);
    const c = last();
    const cb = c.options.scales.x.ticks.callback;
    const shown = c.data.labels.map((_: string, i: number) => cb.call({ chart: { width: 2000 } }, 0, i)).filter(Boolean);
    expect(shown).toEqual(['2 Oct', '12 Oct', '22 Oct (Today)']);
  });

  it('rightAxis="hidden" hides the right axis numbers but keeps its own scale', () => {
    render(<BarChart dates={DATES} series={MIXED} ariaLabel="x" today={TODAY} rightAxis="hidden" />);
    const { y, y1 } = last().options.scales;
    expect(y1.display).toBe(false);
    expect(y1.position).toBe('right');
    expect(y.display).toBeUndefined();
    expect(last().data.datasets[0].yAxisID).toBe('y1');
    // No right axis numbers: the usual room for the bold "(Today)" label comes back.
    expect(last().options.layout.padding.right).toBe(40);
    cleanup();
    render(<BarChart dates={DATES} series={MIXED} ariaLabel="x" today={TODAY} />);
    expect(last().options.layout.padding.right).toBe(8);
  });

  it('legendPosition="bottom-end" puts the legend under the canvas, right-aligned', () => {
    const { container } = render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} legendPosition="bottom-end" />);
    const kids = Array.from((container.firstElementChild as HTMLElement).children).map((c) => c.className);
    expect(kids).toEqual(['vs-line-chart-canvas', 'vs-line-chart-legend vs-line-chart-legend--bottom vs-line-chart-legend--end']);
  });

  it('redraws when a dashboard style prop changes', () => {
    const { rerender } = render(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} />);
    rerender(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} barStyle="soft" />);
    rerender(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} barStyle="soft" lineStyle="markers" />);
    rerender(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} barStyle="soft" lineStyle="markers" tooltipTone="dark" />);
    rerender(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} barStyle="soft" lineStyle="markers" tooltipTone="dark" xLabels="ends" />);
    rerender(<BarChart dates={DATES} series={[FREE]} ariaLabel="x" today={TODAY} barStyle="soft" lineStyle="markers" tooltipTone="dark" xLabels="ends" rightAxis="hidden" />);
    expect(charts).toHaveLength(6);
  });
});
