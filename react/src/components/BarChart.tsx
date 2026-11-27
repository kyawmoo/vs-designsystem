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
import type { ChartConfiguration, ChartType, Plugin, TooltipPositionerFunction } from 'chart.js';

// The tooltip positioner registered below (Chart.js's documented way to name a custom one).
declare module 'chart.js' {
  interface TooltipPositionerMap {
    vsLinePoint: TooltipPositionerFunction<ChartType>;
  }
}
import { buildTimeline, visibleTicks } from './lineChartTimeline';
import { prefersReducedMotion, progressiveAnimation, resolveColor, withAlpha } from './chartShared';
import { DEFAULT_SERIES_COLORS } from './LineChart';
import { liveDotClass, liveDotPlugin, newestIndex } from './liveDot';
import type { LiveDotTarget } from './liveDot';

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
  /**
   * Where the legend row sits: `top` (default, right-aligned above the chart), `bottom` (centred under it) or
   * `bottom-end` (under it, right-aligned; added 25 Nov 2026).
   */
  legendPosition?: 'top' | 'bottom' | 'bottom-end';
  /**
   * Keep a tooltip open on the latest day that has data (today, or the last day before it), so the
   * newest numbers are visible without hovering. Hovering the chart shows that day's tooltip instead;
   * leaving brings the pinned one back. Default false.
   */
  pinTooltip?: boolean;
  /** Colour of the today line and the bold "(Today)" label: `default` (orange) or `dark` (the dark surface colour). */
  todayMarker?: 'default' | 'dark';
  /**
   * Bars (added 25 Nov 2026): `default` (full colour fading to 55%, wide) or `soft` (light: 55% fading to 18%, slim,
   * fully rounded), so a line drawn over the bars stays the first thing you see.
   */
  barStyle?: 'default' | 'soft';
  /**
   * Line series (added 25 Nov 2026): `default` (smooth, a dot on today only) or `markers` (straight segments, a hollow dot
   * on every value with the value above it while the values fit, and a large dark dot with a halo on today).
   */
  lineStyle?: 'default' | 'markers';
  /** Tooltip surface (added 25 Nov 2026): `default` (dark heading colour) or `dark` (the dark surface colour, light title). */
  tooltipTone?: 'default' | 'dark';
  /** X labels (added 25 Nov 2026): `auto` (as many as fit) or `ends` (only the first day, the middle day and today). */
  xLabels?: 'auto' | 'ends';
  /**
   * The right axis of `axis: 'right'` series (added 25 Nov 2026): `visible` (default) or `hidden` (the series keeps its own
   * scale, the axis numbers are not drawn; the tooltip still gives the values).
   */
  rightAxis?: 'visible' | 'hidden';
  formatValue?: (value: number) => string;
  /** "Now" for the axis; for tests and stories. */
  today?: Date;
  /**
   * A dot on the newest reading (up to today) of each line series, with a soft repeating ripple (added 27 Nov 2026). With
   * `lineStyle="markers"` the large today dot stays and the ripple takes the place of its halo. No ripple with reduced
   * motion. Default true. Bars get no dot.
   */
  liveDot?: boolean;
  className?: string;
}

/** How long the bars take to grow in, left to right (ms). */
export const BAR_CHART_GROW_MS = 900;
/** Up to this many day slots the bars have no width cap (so 5 days fill the chart). */
export const BAR_CHART_FEW_DAYS = 10;
const VALUE_FONT = '600 11px Poppins, -apple-system, sans-serif';
/** Values above the points of a `lineStyle="markers"` line. */
const POINT_VALUE_FONT = '500 9px Poppins, -apple-system, sans-serif';
/** `lineStyle="markers"`: the hollow dot on every value, and the large today dot with its halo (CSS px). */
export const MARKER_RADIUS = 3.5;
export const TODAY_DOT_RADIUS = 10;
export const TODAY_HALO_RADIUS = 17;
/**
 * `barStyle="soft"`: the standard (largest) bar width in CSS px. Bars take a share of their day's column and grow with the
 * room, up to this width; the top corners are fully rounded and the bottom corners have this radius, so a bar stands on the axis.
 */
export const SOFT_BAR_MAX_WIDTH = 12;
/**
 * `barStyle="soft"` on a short range (`BAR_CHART_FEW_DAYS` days or fewer): the largest bar width. A few days have wide
 * columns, so the bars grow with them (still half of the column) up to this width instead of staying slim.
 */
export const SOFT_BAR_FEW_DAYS_MAX_WIDTH = 32;
export const SOFT_BAR_BOTTOM_RADIUS = 5;

/**
 * Tooltip position for `lineStyle="markers"`: the point of the line series on the hovered or pinned day (not the average of
 * the bar top and the point, which puts the box over the line). With no line value that day, Chart.js's average is used.
 */
export function linePointPosition(this: any, items: any[], eventPosition: any) {
  const datasets = this?.chart?.data?.datasets ?? [];
  const onLine = items.find((it) => datasets[it.datasetIndex]?.type === 'line' && it.element);
  if (onLine) return { x: onLine.element.x, y: onLine.element.y };
  const average = (Tooltip as any).positioners?.average;
  return average ? average.call(this, items, eventPosition) : false;
}
const positioners = (Tooltip as any).positioners;
if (positioners && !positioners.vsLinePoint) positioners.vsLinePoint = linePointPosition;

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
  legendPosition = 'top',
  pinTooltip = false,
  todayMarker = 'default',
  barStyle = 'default',
  lineStyle = 'default',
  tooltipTone = 'default',
  xLabels = 'auto',
  rightAxis = 'visible',
  formatValue = (v) => v.toLocaleString(),
  today,
  liveDot = true,
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
  // Newest reading of each line series (up to today), where the live dot sits; -1 = none (and every bar series).
  const liveIdx = useMemo(
    () =>
      rows.map((row, i) =>
        liveDot && series[i]?.type === 'line' ? newestIndex(row, timeline.todayIndex >= 0 ? timeline.todayIndex : row.length - 1) : -1
      ),
    [rows, timeline, liveDot, seriesKey]
  );
  const markersMode = lineStyle === 'markers';
  // markers: today's large dot is drawn on the canvas, so its live dot is the ripple only.
  const dotSize = (i: number): LiveDotTarget['size'] => (markersMode && liveIdx[i] >= 0 && liveIdx[i] === timeline.todayIndex ? 'ring' : 'md');
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !wrap || !ctx) return;

    const token = (name: string, fallback: string) => resolveColor(wrap, ctx, `var(${name})`, fallback);
    const theme = {
      grid: token('--vs-chart-grid', '#ececec'),
      axis: token('--vs-chart-axis-text', '#8e9cba'),
      today: todayMarker === 'dark' ? token('--vs-chart-today-marker', '#222222') : token('--vs-chart-today', '#ff7a14'),
      tooltip: token('--vs-color-text-heading', '#010d4c'),
      surface: token('--vs-color-surface', '#ffffff'),
      text: token('--vs-color-text-body', '#2b2b2b'),
      dark: token('--vs-chart-today-marker', '#222222'),
      lightTitle: token('--vs-color-lavender-surface-strong', '#e8e5fc'),
    };
    const soft = barStyle === 'soft';
    const markers = lineStyle === 'markers';
    const lineIdx = series.map((s, i) => (s.type === 'line' ? i : -1)).filter((i) => i >= 0);
    const colors = series.map((s, i) => resolveColor(wrap, ctx, s.color || DEFAULT_SERIES_COLORS[i % DEFAULT_SERIES_COLORS.length], '#4caf50'));
    const { labels, todayIndex } = timeline;
    const count = labels.length;
    const reduce = prefersReducedMotion();
    const hasRight = series.some((s) => s.axis === 'right');
    const barIdx = series.map((s, i) => (s.type === 'line' ? -1 : i)).filter((i) => i >= 0);
    const dotTargets: LiveDotTarget[] = series.map((_, i) => {
      const size = dotSize(i);
      return { datasetIndex: i, index: liveIdx[i], color: size === 'ring' ? theme.dark : colors[i], size };
    });
    // The dot fades in once the line has drawn up to it (line points draw in over BAR_CHART_GROW_MS, left to right).
    const dotDelay = reduce ? 0 : ((Math.max(-1, ...liveIdx) + 1) * BAR_CHART_GROW_MS) / Math.max(1, count);
    const dots = liveDotPlugin(() => dotRefs.current, dotTargets, dotDelay);

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

    // lineStyle="markers": the value above every point while all of them fit their column, and the large today dot.
    const lineMarkers: Plugin<'bar'> = {
      id: 'vsLineMarkers',
      afterDatasetsDraw(chart) {
        const c = chart.ctx;
        const slot = chart.chartArea.width / Math.max(1, count);
        c.save();
        c.font = POINT_VALUE_FONT;
        c.textAlign = 'center';
        c.textBaseline = 'bottom';
        const labels: { x: number; y: number; text: string }[] = [];
        lineIdx.forEach((i) => {
          const meta = chart.getDatasetMeta(i);
          rows[i].forEach((v, d) => {
            const el: any = meta.data[d];
            if (v === null || !el) return;
            labels.push({ x: el.x, y: el.y - (d === todayIndex ? TODAY_DOT_RADIUS + 4 : MARKER_RADIUS + 5), text: formatRef.current(v) });
          });
        });
        if (!labels.some((l) => c.measureText(l.text).width + 2 > slot)) {
          c.fillStyle = theme.tooltip;
          labels.forEach((l) => c.fillText(l.text, l.x, l.y));
        }
        if (todayIndex >= 0) {
          lineIdx.forEach((i) => {
            const el: any = chart.getDatasetMeta(i).data[todayIndex];
            if (rows[i][todayIndex] === null || !el) return;
            // With a live dot, its ripple takes the place of the halo.
            if (dotTargets[i].size !== 'ring') {
              c.beginPath();
              c.arc(el.x, el.y, TODAY_HALO_RADIUS, 0, Math.PI * 2);
              c.fillStyle = withAlpha(theme.dark, 0.16);
              c.fill();
            }
            c.beginPath();
            c.arc(el.x, el.y, TODAY_DOT_RADIUS, 0, Math.PI * 2);
            c.fillStyle = theme.dark;
            c.fill();
            c.lineWidth = 3.5;
            c.strokeStyle = theme.surface;
            c.stroke();
          });
        }
        c.restore();
      },
    };

    // Pinned tooltip: the latest day (up to today) that has a value in any series.
    let pinIndex = -1;
    if (pinTooltip) {
      const lastDay = todayIndex >= 0 ? todayIndex : count - 1;
      for (let d = lastDay; d >= 0 && pinIndex < 0; d--) if (rows.some((row) => row[d] !== null)) pinIndex = d;
    }
    const pin = (chart: any) => {
      if (pinIndex < 0 || !chart.tooltip) return;
      const active = series
        .map((_, i) => ({ datasetIndex: i, index: pinIndex }))
        .filter((a) => rows[a.datasetIndex][pinIndex] !== null);
      hovered = null; // the pointer is away: no faded days, and the tooltip swatches get the full colours
      const el = chart.getDatasetMeta(active[0].datasetIndex).data[pinIndex];
      chart.setActiveElements(active);
      chart.tooltip.setActiveElements(active, { x: el.x, y: el.y });
      chart.update('none');
    };
    let pinnedFirst = false;
    const pinFirst = (chart: any) => {
      if (pinnedFirst) return;
      pinnedFirst = true;
      pin(chart);
    };
    const pinTooltipPlugin: Plugin<'bar'> = {
      id: 'vsPinTooltip',
      // Reduced motion has no animation to wait for: pin after the first draw.
      afterRender(chart) {
        if (reduce) pinFirst(chart);
      },
      // The pointer left the columns (or the chart): bring the pinned tooltip back once Chart.js has cleared it.
      afterEvent(chart) {
        Promise.resolve().then(() => {
          if (chart.tooltip && chart.tooltip.getActiveElements().length === 0) pin(chart);
        });
      },
    };

    const step = (reduce ? 0 : BAR_CHART_GROW_MS) / Math.max(1, count);
    /** Few days (a short range) get wide bars; FEW_DAYS or fewer slots counts as few. */
    const few = count <= BAR_CHART_FEW_DAYS;
    let hovered: number | null = null;
    const allIntegers = rows.every((row) => row.every((v) => v === null || Number.isInteger(v)));
    const yScale = (position: 'left' | 'right', grid: boolean, stack: boolean) => ({
      position,
      stacked: stack,
      beginAtZero: true,
      border: { display: false },
      grid: { display: grid, color: theme.grid },
      ...(position === 'right' && rightAxis === 'hidden' ? { display: false } : {}),
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
              borderWidth: markers ? 3 : 2.5,
              tension: markers ? 0 : 0.35,
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
              // markers: a hollow dot on every value; today's large dot is drawn by the vsLineMarkers plugin.
              // A point with a live dot (md) is drawn by that dot instead.
              pointRadius: (c: any) =>
                c.dataIndex === liveIdx[i] && dotTargets[i].size === 'md'
                  ? 0
                  : markers
                    ? c.dataIndex === todayIndex
                      ? 0
                      : MARKER_RADIUS
                    : c.dataIndex === todayIndex
                      ? 4
                      : 0,
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
            // Gradient from the full colour at the top; while one day is hovered, the other days fade.
            backgroundColor: (c: any) => {
              if (hovered !== null && c.dataIndex !== hovered) return withAlpha(colors[i], soft ? 0.08 : 0.18);
              const area = c.chart.chartArea;
              if (!area) return soft ? withAlpha(colors[i], 0.55) : colors[i];
              const g = c.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
              g.addColorStop(0, soft ? withAlpha(colors[i], 0.55) : colors[i]);
              g.addColorStop(1, withAlpha(colors[i], soft ? 0.18 : 0.55));
              return g;
            },
            // Rounded top only on the top part of a column.
            // soft (not stacked): fully rounded top, a small radius at the bottom so the bar stands on the axis.
            borderRadius:
              soft && !stacked
                ? { topLeft: 999, topRight: 999, bottomLeft: SOFT_BAR_BOTTOM_RADIUS, bottomRight: SOFT_BAR_BOTTOM_RADIUS }
                : (c: any) => (isTop(i, c.dataIndex) ? { topLeft: 6, topRight: 6 } : 0),
            borderSkipped: false,
            // Many days: slim bars with a cap. Few days: no cap and a thin gap, so the bars fill the chart.
            // soft: half of the day's column, never wider than the standard width (a wider one for a few days).
            maxBarThickness: soft ? (few ? SOFT_BAR_FEW_DAYS_MAX_WIDTH : SOFT_BAR_MAX_WIDTH) : few ? undefined : 28,
            barPercentage: soft ? 0.5 : few ? 0.94 : 0.82,
            categoryPercentage: few ? 0.94 : 0.9,
          } as any;
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        onHover: (_e: any, active: any[], chart: any) => {
          const next = active.length ? active[0].index : null;
          if (next === hovered) return;
          hovered = next;
          chart.update('none');
        },
        animation: reduce
          ? false
          : ({
              duration: 600,
              easing: 'easeOutQuart',
              delay: (c: any) => (c.type === 'data' && c.mode === 'default' ? c.dataIndex * step : 0),
              ...(pinTooltip ? { onComplete: (a: any) => pinFirst(a.chart) } : {}),
            } as any),
        // Room on the right for the longer "(Today)" label; on top for the value labels.
        layout: { padding: { top: showValues ? 20 : 8, right: hasRight && rightAxis !== 'hidden' ? 8 : 40 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tooltipTone === 'dark' ? withAlpha(theme.dark, 0.95) : theme.tooltip,
            titleColor: tooltipTone === 'dark' ? theme.lightTitle : '#ffffff',
            bodyColor: '#ffffff',
            footerColor: '#ffffff',
            padding: tooltipTone === 'dark' ? 12 : 10,
            cornerRadius: tooltipTone === 'dark' ? 8 : 6,
            // markers: the box sits beside the line point (left of it on the right half, right of it on the left half),
            // its arrow clear of the today halo.
            ...(markers ? { position: 'vsLinePoint', yAlign: 'center', caretSize: 8, caretPadding: TODAY_HALO_RADIUS + 4 } : {}),
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            filter: (item) => item.raw !== null,
            callbacks: {
              label: (item) => `${item.dataset.label}: ${formatRef.current(Number(item.raw))}`,
              // dark tooltip: solid swatches in the series colours (not the hollow point style of a markers line).
              ...(tooltipTone === 'dark'
                ? { labelColor: (item: any) => ({ borderColor: colors[item.datasetIndex], backgroundColor: colors[item.datasetIndex] }) }
                : {}),
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
                if (xLabels === 'ends') {
                  const end = todayIndex >= 0 ? todayIndex : count - 1;
                  return index === 0 || index === end || index === Math.round(end / 2) ? labels[index] : '';
                }
                const width = this.chart?.width || wrap.clientWidth || 600;
                return visibleTicks(count, todayIndex, width / 100)[index] ? labels[index] : '';
              },
            },
          },
          y: yScale('left', true, stacked) as any,
          ...(hasRight ? { y1: yScale('right', false, false) as any } : {}),
        },
      },
      plugins: [todayLine, valueLabels, ...(markers ? [lineMarkers] : []), ...(pinTooltip ? [pinTooltipPlugin] : []), ...(liveIdx.some((d) => d >= 0) ? [dots] : [])],
    };

    const chart = new Chart(canvas, config);
    return () => chart.destroy();
  }, [timeline, rows, seriesKey, stacked, showValues, pinTooltip, todayMarker, barStyle, lineStyle, tooltipTone, xLabels, rightAxis, liveIdx, liveDot]);

  const legendColors = series.map((s, i) => s.color || DEFAULT_SERIES_COLORS[i % DEFAULT_SERIES_COLORS.length]);

  const legend = (
    <div
      className={
        legendPosition === 'bottom'
          ? 'vs-line-chart-legend vs-line-chart-legend--bottom'
          : legendPosition === 'bottom-end'
          ? 'vs-line-chart-legend vs-line-chart-legend--bottom vs-line-chart-legend--end'
          : 'vs-line-chart-legend'
      }
    >
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
  );

  return (
    <div ref={wrapRef} className={className ? `vs-line-chart vs-bar-chart ${className}` : 'vs-line-chart vs-bar-chart'}>
      {showLegend && legendPosition === 'top' && legend}
      <div className="vs-line-chart-canvas" style={{ height }}>
        <canvas ref={canvasRef} role="img" aria-label={ariaLabel} />
        {liveIdx.map((d, i) =>
          d >= 0 ? (
            <span
              key={series[i].id}
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
              className={liveDotClass(dotSize(i))}
              aria-hidden="true"
              hidden
            />
          ) : null
        )}
      </div>
      {showLegend && legendPosition !== 'top' && legend}
    </div>
  );
}
