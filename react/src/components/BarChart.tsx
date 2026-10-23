import React, { useEffect, useMemo, useRef } from 'react';
import {
  BarController,
  BarElement,
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
import { prefersReducedMotion, progressiveAnimation, resolveColor, withAlpha } from './chartShared';
import { DEFAULT_SERIES_COLORS } from './LineChart';

Chart.register(BarController, BarElement, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

export interface BarChartSeries {
  id: string;
  label: string;
  /** One value per entry of `dates`; null / missing = no data that day (a gap, never 0). */
  data: (number | null)[];
  /** `bar` (default) or `line` drawn over the bars with a soft area (e.g. visitors over downloads). */
  type?: 'bar' | 'line';
  /** Any CSS colour or `var(--token)`. Default: --vs-chart-series-1, -2, -3 in order. */
  color?: string;
  /** Second y axis on the right (for a series of a different size). */
  axis?: 'left' | 'right';
}

export interface BarChartProps {
  /** "YYYY-MM-DD" per value, any order. The axis always ends one empty day after today. */
  dates: string[];
  series: BarChartSeries[];
  /** Stack the bar series of a day into one column (parts of a total). */
  stacked?: boolean;
  /** Stacked: the day's total above each column. Not stacked: each value above its bar / point. Shown while there is room. */
  showValues?: boolean;
  /** Describes the chart for screen readers. */
  ariaLabel: string;
  /** Canvas height in px. Default 280. */
  height?: number;
  /** Legend row above the chart. Default true. */
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  /** "Now" for the axis; for tests and stories. */
  today?: Date;
  className?: string;
}

/** How long the bars take to grow in, left to right (ms). */
export const BAR_CHART_GROW_MS = 900;
const VALUE_FONT = '600 11px Poppins, -apple-system, sans-serif';

/**
 * Daily bar chart (Chart.js) with the design system's chart rules built in: one column per day,
 * today marked by a dotted line and a bold "(Today)" label, exactly one empty day after today,
 * missing days left empty. Bars grow in from left to right (none with reduced motion); optional
 * stacking with day totals, and line series drawn over the bars.
 */
export function BarChart({
  dates,
  series,
  stacked = false,
  showValues = false,
  ariaLabel,
  height = 280,
  showLegend = true,
  formatValue = (v) => v.toLocaleString(),
  today,
  className,
}: BarChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const todayKey = today ? today.getTime() : null;
  // Inline arrays and functions from the parent must not redraw (and re-animate) the chart on every render.
  const datesKey = dates.join(',');
  const seriesKey = JSON.stringify(series.map((s) => [s.id, s.label, s.type ?? 'bar', s.color ?? '', s.axis ?? 'left', s.data]));
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
      text: token('--vs-color-text-body', '#2b2b2b'),
    };
    const colors = series.map((s, i) => resolveColor(wrap, ctx, s.color || DEFAULT_SERIES_COLORS[i % DEFAULT_SERIES_COLORS.length], '#4caf50'));
    const { labels, todayIndex } = timeline;
    const count = labels.length;
    const reduce = prefersReducedMotion();
    const hasRight = series.some((s) => s.axis === 'right');
    const barIdx = series.map((s, i) => (s.type === 'line' ? -1 : i)).filter((i) => i >= 0);

    // Day total of the bar series (null when none of them has a value that day).
    const totals = Array.from({ length: count }, (_, d) => {
      let sum: number | null = null;
      barIdx.forEach((i) => {
        const v = rows[i][d];
        if (v !== null) sum = (sum ?? 0) + v;
      });
      return sum;
    });
    // In a stacked column, the topmost bar with a value gets the rounded corners.
    const isTop = (datasetIndex: number, d: number) => {
      if (!stacked) return true;
      const higher = barIdx.filter((i) => i > datasetIndex);
      return !higher.some((i) => (rows[i][d] ?? 0) > 0);
    };

    const todayLine: Plugin<'bar'> = {
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

    // Values above columns / points, only while every label fits its column (else the tooltip has them).
    const valueLabels: Plugin<'bar'> = {
      id: 'vsValueLabels',
      afterDatasetsDraw(chart) {
        if (!showValues) return;
        const slot = chart.chartArea.width / Math.max(1, count);
        const c = chart.ctx;
        c.save();
        c.font = VALUE_FONT;
        c.textAlign = 'center';
        c.textBaseline = 'bottom';
        const items: { x: number; y: number; text: string; color: string }[] = [];
        if (stacked) {
          totals.forEach((t, d) => {
            if (t === null || t === 0) return;
            const yScale = chart.scales.y;
            items.push({ x: chart.scales.x.getPixelForValue(d), y: yScale.getPixelForValue(t) - 4, text: formatRef.current(t), color: theme.text });
          });
        } else {
          series.forEach((s, i) => {
            const meta = chart.getDatasetMeta(i);
            rows[i].forEach((v, d) => {
              const el: any = meta.data[d];
              if (v === null || !el) return;
              items.push({ x: el.x, y: el.y - 6, text: formatRef.current(v), color: colors[i] });
            });
          });
        }
        if (items.some((it) => c.measureText(it.text).width + 4 > slot)) {
          c.restore();
          return;
        }
        // A label that would overlap one already drawn is left out (bar and line labels of one day).
        const drawn: { l: number; r: number; t: number; b: number }[] = [];
        const LABEL_H = 13;
        items.forEach((it) => {
          const w = c.measureText(it.text).width;
          const box = { l: it.x - w / 2 - 2, r: it.x + w / 2 + 2, t: it.y - LABEL_H, b: it.y };
          if (drawn.some((d) => box.l < d.r && box.r > d.l && box.t < d.b && box.b > d.t)) return;
          drawn.push(box);
          c.fillStyle = it.color;
          c.fillText(it.text, it.x, it.y);
        });
        c.restore();
      },
    };

    const step = (reduce ? 0 : BAR_CHART_GROW_MS) / Math.max(1, count);
    const allIntegers = rows.every((row) => row.every((v) => v === null || Number.isInteger(v)));
    const yScale = (position: 'left' | 'right', grid: boolean, stack: boolean) => ({
      position,
      stacked: stack,
      beginAtZero: true,
      border: { display: false },
      grid: { display: grid, color: theme.grid },
      // Whole-number data (counts) gets whole-number ticks: no 0.5 users.
      ticks: { color: theme.axis, maxTicksLimit: 5, precision: allIntegers ? 0 : undefined, font: { size: 11 }, callback: (v: string | number) => formatRef.current(Number(v)) },
    });

    const config: ChartConfiguration<'bar', (number | null)[], string> = {
      type: 'bar',
      data: {
        labels,
        datasets: series.map((s, i) => {
          const axis = s.axis === 'right' ? 'y1' : 'y';
          if (s.type === 'line') {
            return {
              type: 'line',
              label: s.label,
              data: rows[i],
              yAxisID: axis,
              order: -1,
              borderColor: colors[i],
              borderWidth: 2.5,
              tension: 0.35,
              spanGaps: false,
              fill: 'origin',
              backgroundColor: (context: any) => {
                const area = context.chart.chartArea;
                if (!area) return 'transparent';
                const g = context.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
                g.addColorStop(0, withAlpha(colors[i], 0.22));
                g.addColorStop(1, withAlpha(colors[i], 0));
                return g;
              },
              pointRadius: (c: any) => (c.dataIndex === todayIndex ? 4 : 0),
              pointHoverRadius: 5,
              pointBackgroundColor: theme.surface,
              pointBorderColor: colors[i],
              pointBorderWidth: 2,
              animations: reduce ? false : (progressiveAnimation(BAR_CHART_GROW_MS, count) as any),
            } as any;
          }
          return {
            type: 'bar',
            label: s.label,
            data: rows[i],
            yAxisID: axis,
            stack: stacked && s.axis !== 'right' ? 'total' : s.id,
            backgroundColor: colors[i],
            hoverBackgroundColor: withAlpha(colors[i], 0.85),
            borderColor: theme.surface,
            // A thin surface-coloured gap between stacked parts; round corners only on the top part.
            borderWidth: (c: any) => (stacked && !isTop(i, c.dataIndex) ? { top: 2 } : 0),
            borderRadius: (c: any) => (isTop(i, c.dataIndex) ? 4 : 0),
            borderSkipped: 'bottom',
            maxBarThickness: 34,
          } as any;
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        animation: reduce
          ? false
          : ({ duration: 600, easing: 'easeOutQuart', delay: (c: any) => (c.type === 'data' && c.mode === 'default' ? c.dataIndex * step : 0) } as any),
        // Room on the right for the longer "(Today)" label; on top for the value labels.
        layout: { padding: { top: showValues ? 20 : 8, right: hasRight ? 8 : 40 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: theme.tooltip,
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            footerColor: '#ffffff',
            padding: 10,
            cornerRadius: 6,
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            filter: (item) => item.raw !== null,
            callbacks: {
              label: (item) => `${item.dataset.label}: ${formatRef.current(Number(item.raw))}`,
              footer: (items) => {
                if (!stacked || barIdx.length < 2 || items.length === 0) return '';
                const t = totals[items[0].dataIndex];
                return t === null ? '' : `Total: ${formatRef.current(t)}`;
              },
            },
          },
        },
        scales: {
          x: {
            stacked,
            grid: { display: false },
            border: { display: false },
            ticks: {
              autoSkip: false,
              maxRotation: 0,
              color: (c: any) => (c.index === todayIndex ? theme.today : theme.axis),
              font: (c: any) => ({ size: 11, weight: c.index === todayIndex ? 'bold' : 'normal' }),
              callback: function (this: any, _v, index) {
                const width = this.chart?.width || wrap.clientWidth || 600;
                return visibleTicks(count, todayIndex, width / 100)[index] ? labels[index] : '';
              },
            },
          },
          y: yScale('left', true, stacked) as any,
          ...(hasRight ? { y1: yScale('right', false, false) as any } : {}),
        },
      },
      plugins: [todayLine, valueLabels],
    };

    const chart = new Chart(canvas, config);
    return () => chart.destroy();
  }, [timeline, rows, seriesKey, stacked, showValues]);

  const legendColors = series.map((s, i) => s.color || DEFAULT_SERIES_COLORS[i % DEFAULT_SERIES_COLORS.length]);

  return (
    <div ref={wrapRef} className={className ? `vs-line-chart vs-bar-chart ${className}` : 'vs-line-chart vs-bar-chart'}>
      {showLegend && (
        <div className="vs-line-chart-legend">
          {series.map((s, i) => (
            <span key={s.id} className="vs-line-chart-legend-item">
              <span
                className={s.type === 'line' ? 'vs-line-chart-swatch vs-line-chart-swatch--line' : 'vs-line-chart-swatch'}
                style={{ background: legendColors[i] }}
              />
              {s.label}
            </span>
          ))}
        </div>
      )}
      <div className="vs-line-chart-canvas" style={{ height }}>
        <canvas ref={canvasRef} role="img" aria-label={ariaLabel} />
      </div>
    </div>
  );
}
