import React, { useEffect, useMemo, useRef } from 'react';
import {
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import type { ChartConfiguration, Plugin } from 'chart.js';
import { buildTimeline, visibleTicks } from './lineChartTimeline';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

export type LineChartVariant = 'area' | 'line' | 'sparkline';

export interface LineChartSeries {
  id: string;
  label: string;
  /** One value per entry of `dates`; null / missing = no data that day (drawn as a gap). */
  data: (number | null)[];
  /** Any CSS colour or `var(--token)`. Default: --vs-chart-series-1, -2, -3 in order. */
  color?: string;
  /** Second y axis on the right (for two series of different size). */
  axis?: 'left' | 'right';
}

export interface LineChartProps {
  /** "YYYY-MM-DD" per value, any order. The axis always ends one empty day after today. */
  dates: string[];
  series: LineChartSeries[];
  /** `area` (gradient under the line, draws left to right), `line` (lines rise into place), `sparkline` (tiny, no axes). */
  variant?: LineChartVariant;
  /** Describes the chart for screen readers, e.g. "Daily downloads, last 30 days". */
  ariaLabel: string;
  /** Canvas height in px. Default 280, sparkline 56. */
  height?: number;
  /** Legend row above the chart (never for sparklines). Default true. */
  showLegend?: boolean;
  /** Tooltip and y-axis number format. Default: toLocaleString. */
  formatValue?: (value: number) => string;
  /** "Now" for the axis; for tests and stories. */
  today?: Date;
  className?: string;
}

export const DEFAULT_SERIES_COLORS = ['var(--vs-chart-series-1)', 'var(--vs-chart-series-2)', 'var(--vs-chart-series-3)'];
/** How long the line takes to draw in (ms). */
export const LINE_CHART_DRAW_MS = 1200;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Resolves `var(--x)` against the element, then lets the canvas normalise the colour ("#rrggbb" or "rgba(...)"). */
function resolveColor(el: HTMLElement, ctx: CanvasRenderingContext2D, color: string, fallback: string): string {
  let value = color.trim();
  const m = /^var\((--[a-z0-9-]+)\)$/i.exec(value);
  if (m) value = getComputedStyle(el).getPropertyValue(m[1]).trim();
  if (!value) value = fallback;
  ctx.fillStyle = fallback;
  ctx.fillStyle = value; // an invalid colour leaves the fallback
  return String(ctx.fillStyle);
}

/** "#rrggbb" or "rgb(a)(...)" with a new alpha. */
export function withAlpha(color: string, alpha: number): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(color);
  return rgb ? `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alpha})` : color;
}

/** Each point starts after the one before it, so the line draws from left to right. */
function progressiveAnimation(total: number, count: number) {
  const step = total / Math.max(1, count);
  const previousY = (ctx: any) =>
    ctx.index === 0
      ? ctx.chart.scales.y.getPixelForValue(0)
      : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  const delay = (key: 'xStarted' | 'yStarted') => (ctx: any) => {
    if (ctx.type !== 'data' || ctx[key]) return 0;
    ctx[key] = true;
    return ctx.index * step;
  };
  return {
    x: { type: 'number' as const, easing: 'linear' as const, duration: step, from: NaN, delay: delay('xStarted') },
    y: { type: 'number' as const, easing: 'linear' as const, duration: step, from: previousY, delay: delay('yStarted') },
  };
}

/**
 * Time-trend line chart (Chart.js) with the design system's chart rules built in: one point per
 * day, today marked by a dotted line and a bold "(Today)" label, exactly one empty day after
 * today, missing days drawn as gaps. Animated on first draw (none with reduced motion).
 */
export function LineChart({
  dates,
  series,
  variant = 'area',
  ariaLabel,
  height,
  showLegend = true,
  formatValue = (v) => v.toLocaleString(),
  today,
  className,
}: LineChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparkline = variant === 'sparkline';
  const todayKey = today ? today.getTime() : null;
  // Inline arrays and functions from the parent must not redraw (and re-animate) the chart on every render.
  const datesKey = dates.join(',');
  const seriesKey = JSON.stringify(series.map((s) => [s.id, s.label, s.color ?? '', s.axis ?? 'left', s.data]));
  const formatRef = useRef(formatValue);
  formatRef.current = formatValue;

  const timeline = useMemo(() => buildTimeline(dates, today ?? new Date()), [datesKey, todayKey]);
  const rows = useMemo(() => series.map((s) => timeline.align(dates, s.data)), [seriesKey, timeline]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !wrap || !ctx) return;

    const token = (name: string, fallback: string) => resolveColor(wrap, ctx, `var(${name})`, fallback);
    const theme = {
      grid: token('--vs-chart-grid', '#ececec'),
      axis: token('--vs-chart-axis-text', '#8e9cba'),
      today: token('--vs-chart-today', '#ff7a14'),
      tooltip: token('--vs-color-text-heading', '#010d4c'),
      surface: token('--vs-color-surface', '#ffffff'),
    };
    const colors = series.map((s, i) => resolveColor(wrap, ctx, s.color || DEFAULT_SERIES_COLORS[i % DEFAULT_SERIES_COLORS.length], '#4caf50'));
    const { labels, todayIndex } = timeline;
    const reduce = prefersReducedMotion();
    const hasRight = series.some((s) => s.axis === 'right');

    const todayLine: Plugin<'line'> = {
      id: 'vsTodayLine',
      afterDatasetsDraw(chart) {
        if (todayIndex < 0) return;
        const x = chart.scales.x.getPixelForValue(todayIndex);
        const { top, bottom } = chart.chartArea;
        const c = chart.ctx;
        c.save();
        c.setLineDash([4, 4]);
        c.strokeStyle = theme.today;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x, top);
        c.lineTo(x, bottom);
        c.stroke();
        c.restore();
      },
    };
    const crosshair: Plugin<'line'> = {
      id: 'vsCrosshair',
      afterDraw(chart) {
        const active = chart.tooltip?.getActiveElements();
        if (!active || active.length === 0) return;
        const x = active[0].element.x;
        const { top, bottom } = chart.chartArea;
        const c = chart.ctx;
        c.save();
        c.strokeStyle = theme.grid;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x, top);
        c.lineTo(x, bottom);
        c.stroke();
        c.restore();
      },
    };

    const fillFor = (color: string) => (context: any) => {
      const area = context.chart.chartArea;
      if (!area) return 'transparent';
      const g = context.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
      g.addColorStop(0, withAlpha(color, sparkline ? 0.28 : 0.32));
      g.addColorStop(1, withAlpha(color, 0));
      return g;
    };

    const yScale = (position: 'left' | 'right', grid: boolean) => ({
      display: !sparkline,
      position,
      beginAtZero: true,
      border: { display: false },
      grid: { display: grid, color: theme.grid },
      ticks: { color: theme.axis, maxTicksLimit: 5, font: { size: 11 }, callback: (v: string | number) => formatRef.current(Number(v)) },
    });

    const config: ChartConfiguration<'line', (number | null)[], string> = {
      type: 'line',
      data: {
        labels,
        datasets: series.map((s, i) => ({
          label: s.label,
          data: rows[i],
          borderColor: colors[i],
          backgroundColor: variant === 'line' ? colors[i] : fillFor(colors[i]),
          fill: variant !== 'line',
          borderWidth: sparkline ? 2 : 2.5,
          tension: 0.4,
          spanGaps: false,
          yAxisID: s.axis === 'right' ? 'y1' : 'y',
          pointRadius: (c: any) => (!sparkline && variant === 'area' && c.dataIndex === todayIndex ? 4 : 0),
          pointHoverRadius: sparkline ? 0 : 5,
          pointBackgroundColor: variant === 'area' ? theme.surface : colors[i],
          pointBorderColor: colors[i],
          pointBorderWidth: 2,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        events: sparkline ? [] : undefined,
        interaction: { mode: 'index', intersect: false },
        animation: reduce
          ? false
          : variant === 'line'
            ? ({ duration: LINE_CHART_DRAW_MS, easing: 'easeOutQuart', y: { from: (c: any) => c.chart.chartArea?.bottom ?? 0 } } as any)
            : (progressiveAnimation(sparkline ? LINE_CHART_DRAW_MS * 0.75 : LINE_CHART_DRAW_MS, labels.length) as any),
        // Without a right axis, room for the longer "(Today)" label next to the one empty day.
        layout: { padding: sparkline ? { top: 4, bottom: 2 } : { top: 8, right: hasRight ? 8 : 40 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: !sparkline,
            backgroundColor: theme.tooltip,
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            padding: 10,
            cornerRadius: 6,
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            filter: (item) => item.raw !== null,
            callbacks: {
              label: (item) => `${item.dataset.label}: ${formatRef.current(Number(item.raw))}`,
            },
          },
        },
        scales: {
          x: {
            display: !sparkline,
            grid: { display: false },
            border: { display: false },
            ticks: {
              autoSkip: false,
              maxRotation: 0,
              color: (c: any) => (c.index === todayIndex ? theme.today : theme.axis),
              font: (c: any) => ({ size: 11, weight: c.index === todayIndex ? 'bold' : 'normal' }),
              callback: function (this: any, _v, index) {
                const width = this.chart?.width || wrap.clientWidth || 600;
                const show = visibleTicks(labels.length, todayIndex, width / 100);
                return show[index] ? labels[index] : '';
              },
            },
          },
          y: yScale('left', true) as any,
          ...(hasRight ? { y1: yScale('right', false) as any } : {}),
        },
      },
      plugins: sparkline ? [] : [todayLine, crosshair],
    };

    const chart = new Chart(canvas, config);
    return () => chart.destroy();
  }, [timeline, rows, seriesKey, variant]);

  const legendColors = series.map((s, i) => s.color || DEFAULT_SERIES_COLORS[i % DEFAULT_SERIES_COLORS.length]);
  const h = height ?? (sparkline ? 56 : 280);

  return (
    <div ref={wrapRef} className={className ? `vs-line-chart ${className}` : 'vs-line-chart'}>
      {showLegend && !sparkline && (
        <div className="vs-line-chart-legend">
          {series.map((s, i) => (
            <span key={s.id} className="vs-line-chart-legend-item">
              <span className="vs-line-chart-swatch" style={{ background: legendColors[i] }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
      <div className="vs-line-chart-canvas" style={{ height: h }}>
        <canvas ref={canvasRef} role="img" aria-label={ariaLabel} />
      </div>
    </div>
  );
}
