import React, { useEffect, useRef } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, ScatterController, Tooltip, Filler } from 'chart.js';
import { prefersReducedMotion, resolveColor, withAlpha } from './chartShared';

Chart.register(LineController, LineElement, PointElement, LinearScale, ScatterController, Tooltip, Filler);

/** One reading: x = epoch ms, y = value; `null` = no data, drawn as a gap (never as 0). */
export type TimeSeriesPoint = { x: number; y: number | null };

export type TimeSeriesMarkerStatus = 'new' | 'investigating' | 'resolved' | 'ignored';

/** A spike marker. Shape = severity (Warning triangle, Danger ⚠ sign); colour or tick = status. */
export interface TimeSeriesMarker {
  id: string;
  x: number;
  y: number;
  severity: 'warning' | 'danger';
  /** Default 'new'. investigating = dulled colour, resolved = green tick, ignored = small grey dot. */
  status?: TimeSeriesMarkerStatus;
  /** Drawn larger (the event being looked at). */
  primary?: boolean;
}

/** Colours: any CSS colour or `var(--token)`, read at draw time so a token change needs no code change. */
export interface TimeSeriesColors {
  line: string;
  warning: string;
  danger: string;
  warningFill: string;
  dangerFill: string;
  /** Resolved markers. */
  normal: string;
  muted: string;
  /** The "Highest" ring and tag, today's tick. */
  ink: string;
  surface: string;
  grid: string;
}

export const DEFAULT_TIME_SERIES_COLORS: TimeSeriesColors = {
  line: 'var(--vs-color-brand-primary)',
  warning: 'var(--vs-color-warning-border)',
  danger: 'var(--vs-color-danger-border)',
  warningFill: '',
  dangerFill: '',
  normal: 'var(--vs-color-brand-primary)',
  muted: 'var(--vs-color-text-muted)',
  ink: 'var(--vs-color-brand-secondary)',
  surface: 'var(--vs-color-surface)',
  grid: 'var(--vs-color-border)',
};

export const DEFAULT_MARKER_STATUS_LABELS: Record<TimeSeriesMarkerStatus, string> = {
  new: 'Needs review',
  investigating: 'Investigating',
  resolved: 'Resolved',
  ignored: 'Ignored',
};

export interface TimeSeriesLineChartProps {
  /** Main line. */
  points: TimeSeriesPoint[];
  /** Optional per-interval max, drawn faintly so a short spike is never hidden by averaging. */
  maxPoints?: TimeSeriesPoint[];
  /** Dotted Warning and Danger lines; a stretch of the line that reaches one is drawn in its colour. */
  thresholds: { warning: number; danger: number };
  markers?: TimeSeriesMarker[];
  /** A ring and a "Highest …" tag at the highest reading. */
  highest?: { value: number; t: number } | null;
  from: number;
  to: number;
  /** Length of the period in days: picks the automatic tick format and count. */
  days: number;
  /** Empty space after `to`, with a dotted "Now" line at `to`. */
  futureMs?: number;
  /** Tidy x ticks: 'day' = one per local day (today bold, "(Today)"); '3h' = every 3rd clock hour. Default: automatic. */
  tickStep?: 'day' | '3h';
  /** 'sign' (default): the Danger marker is the ⚠ sign. 'pin': a dot at the peak, the ⚠ above it, a dotted drop to the line. */
  peakStyle?: 'sign' | 'pin';
  /** Top of the y axis. Default: 15% above the highest value, threshold or marker. */
  yMax?: number;
  seriesLabel: string;
  /** Value text in tooltips and the "Highest" tag. Default: 2 decimals. */
  formatValue?: (v: number) => string;
  /** y axis tick text. Default: the number. */
  formatYTick?: (v: number) => string;
  /** Tooltip title. Default: "2:05 PM, 26 Sep 2026". */
  formatTime?: (t: number) => string;
  /** x tick text; `days` < 1 = a clock time, up to 7 = day + time, more = day only. Default: "26 Sep 2:05 PM" style. */
  formatTick?: (t: number, days: number) => string;
  statusLabels?: Record<TimeSeriesMarkerStatus, string>;
  onSelectMarker?: (id: string) => void;
  /** Click-to-zoom: a click on empty plot area calls this with the clicked time; the cursor becomes a magnifier. */
  onZoomAt?: (t: number) => void;
  /** Tooltip line on a clickable marker. */
  clickHint?: string;
  /** A small dot with a soft ripple on the newest reading (DS `.vs-live-dot`; no ripple with reduced motion). */
  liveDot?: boolean;
  colors?: Partial<TimeSeriesColors>;
  height?: number;
  ariaLabel: string;
}

/** How long the chart draws (ms). */
export const TIME_SERIES_DRAW_MS = 800;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MARKER_DRAW_ORDER: Record<TimeSeriesMarkerStatus, number> = { ignored: 0, resolved: 1, investigating: 2, new: 3 };

/** "2:05 PM" */
export function formatClock(d: Date): string {
  const h = d.getHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
function defaultFormatTime(t: number): string {
  if (!Number.isFinite(t)) return '—';
  const d = new Date(t);
  return `${formatClock(d)}, ${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
/** Stable default (a new [] on each render would rebuild the chart every time). */
const NO_MARKERS: TimeSeriesMarker[] = [];
const defaultFormatValue = (v: number) => v.toFixed(2);
const defaultFormatYTick = (v: number) => String(v);
function defaultFormatTick(t: number, days: number): string {
  const d = new Date(t);
  if (days < 1) return formatClock(d);
  const day = `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`;
  return days <= 7 ? `${day} ${formatClock(d)}` : day;
}

/** True when the value at `i` has no neighbour on either side (it cannot form a line segment, so it is drawn as a dot). */
export function isIsolatedPoint(values: (number | null)[], i: number): boolean {
  const v = values[i];
  if (v === null || v === undefined) return false;
  const prev = i > 0 ? values[i - 1] : null;
  const next = i < values.length - 1 ? values[i + 1] : null;
  return (prev === null || prev === undefined) && (next === null || next === undefined);
}
export function localDayKeyOf(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function localHoursBetween(from: number, to: number, stepHours: number): number[] {
  const out: number[] = [];
  const d = new Date(from);
  let cur = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0).getTime();
  for (let i = 0; cur <= to && i < 2000; i++) {
    if (cur >= from && new Date(cur).getHours() % stepHours === 0) out.push(cur);
    const c = new Date(cur);
    cur = new Date(c.getFullYear(), c.getMonth(), c.getDate(), c.getHours() + 1).getTime();
  }
  return out;
}
export function localMidnightsBetween(from: number, to: number): number[] {
  const out: number[] = [];
  const d = new Date(from);
  let cur = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  for (let i = 0; cur <= to && i < 400; i++) {
    if (cur >= from) out.push(cur);
    const c = new Date(cur);
    cur = new Date(c.getFullYear(), c.getMonth(), c.getDate() + 1).getTime();
  }
  return out;
}
/** Markers in draw order (last = on top): less urgent statuses first, then Warning before Danger. */
export function sortMarkersByUrgency<T extends Pick<TimeSeriesMarker, 'severity' | 'status'>>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => MARKER_DRAW_ORDER[a.status ?? 'new'] - MARKER_DRAW_ORDER[b.status ?? 'new'] || Number(a.severity === 'danger') - Number(b.severity === 'danger'),
  );
}
/** True when the drawing keys changed (compared with ===): the chart then draws with motion. */
export function isNewDrawing(previous: ReadonlyArray<unknown> | null, next: ReadonlyArray<unknown>): boolean {
  if (previous === null || previous.length !== next.length) return true;
  return next.some((key, i) => key !== previous[i]);
}
/** "Dull" version of a hex colour mixed with the surface (stays opaque). Non-hex input is returned unchanged. */
export function dullColor(color: string, surface: string, keep = 0.45): string {
  const rgb = (c: string): [number, number, number] | null => {
    let h = c.trim();
    if (!h.startsWith('#')) return null;
    h = h.slice(1);
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return null;
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const a = rgb(color);
  const b = rgb(surface);
  if (!a || !b) return color;
  const k = Math.min(1, Math.max(0, keep));
  const hex = (i: number) => Math.round(a[i] * k + b[i] * (1 - k)).toString(16).padStart(2, '0');
  return `#${hex(0)}${hex(1)}${hex(2)}`;
}

const signCache = new Map<string, HTMLImageElement>();
/** A "⚠" sign as an SVG image (sharp on Retina); `onReady` redraws once it has decoded. */
export function warningSign(size: number, color: string, ink: string, onReady?: () => void): HTMLImageElement | undefined {
  if (typeof Image === 'undefined') return undefined;
  const key = `${size}:${color}:${ink}`;
  const hit = signCache.get(key);
  if (hit) return hit;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">` +
    `<path d="M12 2.2 22.6 21H1.4Z" fill="${color}" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<rect x="10.9" y="8.4" width="2.2" height="6.8" rx="1" fill="${ink}"/>` +
    `<circle cx="12" cy="17.8" r="1.25" fill="${ink}"/></svg>`;
  const img = new Image(size, size);
  if (onReady) img.onload = onReady;
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  signCache.set(key, img);
  return img;
}
/** A "✓" badge for resolved markers, same approach as the ⚠ sign. */
export function checkSign(size: number, color: string, ink: string, onReady?: () => void): HTMLImageElement | undefined {
  if (typeof Image === 'undefined') return undefined;
  const key = `check:${size}:${color}:${ink}`;
  const hit = signCache.get(key);
  if (hit) return hit;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">` +
    `<circle cx="12" cy="12" r="10.4" fill="${color}" stroke="${ink}" stroke-width="1.6"/>` +
    `<path d="M7 12.4 10.4 15.8 17.2 8.6" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const img = new Image(size, size);
  if (onReady) img.onload = onReady;
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  signCache.set(key, img);
  return img;
}

/**
 * VectorSticker TimeSeriesLineChart (issue #13): a time-series line with Warning/Danger threshold lines, gaps for missing
 * readings, spike markers and an optional "Now" space. Moved from the reports site's Server Health chart (decision 2a,
 * 28 Nov 2026). Severity is shape as well as colour (triangle, ⚠ sign, ring), so it is readable without colour alone.
 */
export function TimeSeriesLineChart({
  points,
  maxPoints,
  thresholds,
  markers = NO_MARKERS,
  highest,
  from,
  to,
  days,
  futureMs = 0,
  tickStep,
  peakStyle = 'sign',
  yMax: yMaxProp,
  seriesLabel,
  formatValue = defaultFormatValue,
  formatYTick = defaultFormatYTick,
  formatTime = defaultFormatTime,
  formatTick = defaultFormatTick,
  statusLabels = DEFAULT_MARKER_STATUS_LABELS,
  onSelectMarker,
  onZoomAt,
  clickHint = 'Click to open event details',
  liveDot = false,
  colors,
  height = 280,
  ariaLabel,
}: TimeSeriesLineChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const onSelectRef = useRef(onSelectMarker);
  onSelectRef.current = onSelectMarker;
  const onZoomAtRef = useRef(onZoomAt);
  onZoomAtRef.current = onZoomAt;
  // Text formatters are read through a ref, so a new function on each render does not rebuild the chart.
  const fmtRef = useRef({ formatValue, formatYTick, formatTime, formatTick });
  fmtRef.current = { formatValue, formatYTick, formatTime, formatTick };
  // What was drawn last: the chart moves only when this changes (new readings / period), not on every rebuild.
  const drawnRef = useRef<ReadonlyArray<unknown> | null>(null);
  const liveDotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    const wrap = wrapRef.current;
    if (!ctx || !wrap) return;
    chartRef.current?.destroy();
    const pick = { ...DEFAULT_TIME_SERIES_COLORS, ...colors };
    const fv = (v: number) => fmtRef.current.formatValue(v);
    const col = (c: string, fallback: string) => (c ? resolveColor(wrap, ctx, c, fallback) : '');
    const line = col(pick.line, '#4caf50');
    const warning = col(pick.warning, '#e08a00');
    const danger = col(pick.danger, '#c13b3b');
    const surface = col(pick.surface, '#ffffff');
    const C = {
      line,
      lineMax: withAlpha(line, 0.3),
      lineFill: withAlpha(line, 0.08),
      warning,
      danger,
      warningFill: col(pick.warningFill, '') || withAlpha(warning, 0.12),
      dangerFill: col(pick.dangerFill, '') || withAlpha(danger, 0.12),
      warningDull: dullColor(warning, surface),
      dangerDull: dullColor(danger, surface),
      resolved: col(pick.normal, '#4caf50'),
      now: col(pick.muted, '#8e9cba'),
      peak: col(pick.ink, '#222222'),
      surface,
      muted: col(pick.muted, '#8e9cba'),
      grid: col(pick.grid, '#ececec'),
    };
    const levelColor = (v: number | null | undefined, normal: string, warn: string, dang: string) => {
      if (v === null || v === undefined) return normal;
      if (v >= thresholds.danger) return dang;
      if (v >= thresholds.warning) return warn;
      return normal;
    };
    const drawingKeys = [points, maxPoints, thresholds, days];
    const animate = isNewDrawing(drawnRef.current, drawingKeys) && !prefersReducedMotion();
    drawnRef.current = drawingKeys;

    const pin = peakStyle === 'pin';
    const status = (m: TimeSeriesMarker): TimeSeriesMarkerStatus => m.status ?? 'new';
    const list = sortMarkersByUrgency(markers);
    const dangerMarkers = list.filter((m) => m.severity === 'danger');
    const markerData = list.map((m) => ({ x: m.x, y: m.y, id: m.id, severity: m.severity, status: status(m) }));
    const markerRadius = (m: TimeSeriesMarker) => (m.primary ? 10 : 7);

    const values = [...points, ...(maxPoints || [])].map((p) => p.y).filter((v): v is number => v !== null);
    const dataMax = Math.max(thresholds.danger, ...values, ...markers.map((m) => m.y));
    const yMax = yMaxProp ?? Math.ceil(dataMax * 1.15 * 10) / 10;
    const xMax = to + futureMs;
    const todayKey = localDayKeyOf(to);
    const mainValues = points.map((p) => p.y);
    const lonelyDot = (c: any) => (isIsolatedPoint(mainValues, c.dataIndex) ? 3 : 0);
    const reached = (i: number) => {
      const m = maxPoints?.[i]?.y ?? null;
      const a = points[i]?.y ?? null;
      return m === null ? a : a === null ? m : Math.max(m, a);
    };
    const segmentLevel = (c: any) => {
      const a = reached(c.p0DataIndex);
      const b = reached(c.p1DataIndex);
      return a === null ? b : b === null ? a : Math.max(a, b);
    };
    const redraw = () => chartRef.current?.draw();
    const dangerSign = warningSign(18, C.danger, C.surface, redraw);
    const dangerSignBig = warningSign(22, C.danger, C.surface, redraw);
    const dangerSignDull = warningSign(18, C.dangerDull, C.surface, redraw);
    const dangerSignDullBig = warningSign(22, C.dangerDull, C.surface, redraw);
    const checkSmall = checkSign(pin ? 14 : 18, C.resolved, C.surface, redraw);
    const checkBig = checkSign(22, C.resolved, C.surface, redraw);
    const markerColor = (m: TimeSeriesMarker) => {
      const st = status(m);
      if (st === 'resolved') return C.resolved;
      if (st === 'ignored') return C.muted;
      const isDanger = m.severity === 'danger';
      return st === 'investigating' ? (isDanger ? C.dangerDull : C.warningDull) : isDanger ? C.danger : C.warning;
    };
    const checkFor = (m: TimeSeriesMarker) => (!pin && m.primary ? checkBig : checkSmall);

    const highestLabelPlugin = {
      id: 'highestLabel',
      afterDatasetsDraw(chart: Chart) {
        if (!highest) return;
        const xScale = (chart as any).scales.x;
        const yScale = (chart as any).scales.y;
        const area = chart.chartArea;
        if (!xScale || !yScale || !area) return;
        const x = xScale.getPixelForValue(highest.t);
        const y = yScale.getPixelForValue(highest.value);
        if (x < area.left || x > area.right) return;
        const text = `Highest ${fv(highest.value)}`;
        const c = chart.ctx;
        c.save();
        c.font = `600 11px ${Chart.defaults.font.family}`;
        const w = c.measureText(text).width + 10;
        const h = 18;
        const left = Math.min(Math.max(x - w / 2, area.left), area.right - w);
        const above = y - 18 - h >= area.top;
        const top = above ? y - 18 - h : y + 18;
        c.fillStyle = C.peak;
        c.beginPath();
        (c as any).roundRect ? (c as any).roundRect(left, top, w, h, 4) : c.rect(left, top, w, h);
        c.fill();
        c.fillStyle = C.surface;
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillText(text, left + 5, top + h / 2);
        c.restore();
      },
    };

    const avgAt = (t: number): number => {
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i];
        const b = points[i + 1];
        if (a.y === null || b.y === null || t < a.x || t > b.x) continue;
        return b.x === a.x ? a.y : a.y + ((b.y - a.y) * (t - a.x)) / (b.x - a.x);
      }
      const near = points.filter((p) => p.y !== null).sort((p, q) => Math.abs(p.x - t) - Math.abs(q.x - t))[0];
      return near ? (near.y as number) : 0;
    };
    const pinPlugin = {
      id: 'peakPins',
      beforeDatasetsDraw(chart: Chart) {
        if (!pin) return;
        const xs = (chart as any).scales.x;
        const ys = (chart as any).scales.y;
        if (!xs || !ys) return;
        const c = chart.ctx;
        c.save();
        c.lineWidth = 1.5;
        c.setLineDash([2, 3]);
        for (const m of markers) {
          const x = xs.getPixelForValue(m.x);
          const top = ys.getPixelForValue(m.y);
          const bottom = ys.getPixelForValue(Math.min(avgAt(m.x), m.y));
          c.strokeStyle = markerColor(m);
          c.beginPath();
          c.moveTo(x, top);
          c.lineTo(x, bottom);
          c.stroke();
        }
        c.restore();
      },
      afterDatasetsDraw(chart: Chart) {
        if (!pin) return;
        const xs = (chart as any).scales.x;
        const ys = (chart as any).scales.y;
        if (!xs || !ys) return;
        for (const m of dangerMarkers) {
          const st = status(m);
          if (st === 'resolved' || st === 'ignored') continue;
          const img = st === 'investigating' ? dangerSignDull : dangerSign;
          if (!img || !img.complete) continue;
          chart.ctx.drawImage(img, xs.getPixelForValue(m.x) - 9, ys.getPixelForValue(m.y) - 5 - 3 - 18, 18, 18);
        }
      },
    };

    const newest = liveDot ? [...points].reverse().find((p) => p.y !== null && p.x <= to) : undefined;
    const liveDotPlugin = {
      id: 'liveDot',
      afterDraw(chart: Chart) {
        const el = liveDotRef.current;
        if (!el) return;
        const xs = (chart as any).scales.x;
        const ys = (chart as any).scales.y;
        const area = chart.chartArea;
        if (!newest || newest.y === null || !xs || !ys || !area) {
          el.hidden = true;
          return;
        }
        const x = xs.getPixelForValue(newest.x);
        const y = ys.getPixelForValue(newest.y);
        if (!Number.isFinite(x) || !Number.isFinite(y) || x < area.left || x > area.right) {
          el.hidden = true;
          return;
        }
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.setProperty('--vs-live-dot-color', levelColor(newest.y, C.line, C.warning, C.danger));
        el.hidden = false;
      },
    };

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: seriesLabel,
            data: points as any,
            borderColor: C.line,
            backgroundColor: C.lineFill,
            borderWidth: 2,
            pointRadius: lonelyDot,
            pointBackgroundColor: C.line,
            fill: true,
            spanGaps: false,
            tension: 0,
            segment: {
              borderColor: (c: any) => levelColor(segmentLevel(c), C.line, C.warning, C.danger),
              backgroundColor: (c: any) => levelColor(segmentLevel(c), C.lineFill, C.warningFill, C.dangerFill),
            },
            order: 3,
          },
          ...(maxPoints
            ? [
                {
                  label: 'Interval max',
                  data: maxPoints as any,
                  borderColor: C.lineMax,
                  borderWidth: 1,
                  pointRadius: 0,
                  spanGaps: false,
                  fill: false,
                  tension: 0,
                  segment: {
                    borderColor: (c: any) => levelColor(Math.max(c.p0.parsed.y, c.p1.parsed.y), C.lineMax, C.warning, C.danger),
                  },
                  order: 4,
                },
              ]
            : []),
          {
            label: 'Warning threshold',
            data: [{ x: from, y: thresholds.warning }, { x: xMax, y: thresholds.warning }],
            borderColor: C.warning,
            borderDash: [2, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
            order: 5,
          },
          {
            label: 'Danger threshold',
            data: [{ x: from, y: thresholds.danger }, { x: xMax, y: thresholds.danger }],
            borderColor: C.danger,
            borderDash: [2, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
            order: 5,
          },
          ...(futureMs > 0
            ? [
                {
                  label: 'Now',
                  data: [{ x: to, y: 0 }, { x: to, y: yMax }] as any,
                  borderColor: C.now,
                  borderDash: [3, 3],
                  borderWidth: 1,
                  pointRadius: 0,
                  fill: false,
                  order: 6,
                },
              ]
            : []),
          {
            type: 'scatter',
            label: 'Spike event',
            data: markerData as any,
            pointStyle: list.map((m) => {
              const st = status(m);
              if (st === 'resolved' && checkFor(m)) return checkFor(m);
              if (pin || st === 'ignored') return 'circle';
              if (m.severity === 'warning') return 'triangle';
              const big = !!m.primary;
              return st === 'investigating' ? (big ? dangerSignDullBig : dangerSignDull) : big ? dangerSignBig : dangerSign;
            }) as any,
            clip: false as const,
            pointRadius: list.map((m) => {
              const st = status(m);
              if (st === 'ignored') return 4;
              return st === 'resolved' ? (pin ? 8 : markerRadius(m)) : pin ? (m.severity === 'danger' ? 5 : 4) : markerRadius(m);
            }),
            pointHoverRadius: 11,
            backgroundColor: list.map(markerColor),
            borderColor: C.surface,
            borderWidth: 1.5,
            order: 1,
          },
          ...(highest
            ? [
                {
                  type: 'scatter' as const,
                  label: 'Highest',
                  data: [{ x: highest.t, y: highest.value }] as any,
                  pointStyle: 'circle',
                  pointRadius: 14,
                  pointHoverRadius: 15,
                  borderColor: C.peak,
                  backgroundColor: 'rgba(0, 0, 0, 0)',
                  borderWidth: 2,
                  clip: false as const,
                  order: 0,
                },
              ]
            : []),
        ],
      },
      plugins: [highestLabelPlugin, pinPlugin, liveDotPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: animate ? { duration: TIME_SERIES_DRAW_MS, easing: 'easeOutQuart' as const } : false,
        layout: { padding: { right: 12, top: pin ? 28 : 14 } },
        parsing: false,
        normalized: true,
        interaction: { mode: 'nearest', intersect: true },
        scales: {
          x: {
            type: 'linear',
            min: from,
            max: xMax,
            grid: { display: false },
            afterBuildTicks: tickStep
              ? (scale: any) => {
                  const ticks = tickStep === 'day' ? localMidnightsBetween(from, xMax - 1) : localHoursBetween(from, xMax - 1, 3);
                  scale.ticks = ticks.map((value) => ({ value }));
                }
              : undefined,
            ticks: {
              maxTicksLimit: days <= 7 ? 7 : 8,
              maxRotation: 0,
              autoSkip: !tickStep,
              color: (c: any) => (tickStep === 'day' && localDayKeyOf(Number(c.tick?.value)) === todayKey ? C.peak : C.muted),
              font: (c: any) => ({ size: 11, weight: tickStep === 'day' && localDayKeyOf(Number(c.tick?.value)) === todayKey ? 'bold' : 'normal' }),
              callback(this: any, v: any) {
                if (!tickStep) return fmtRef.current.formatTick(Number(v), days);
                const d = new Date(Number(v));
                const narrow = this.chart.width < 560;
                if (tickStep === '3h') return narrow && d.getHours() % 6 !== 0 ? '' : fmtRef.current.formatTick(Number(v), 0);
                const isToday = localDayKeyOf(Number(v)) === todayKey;
                if (narrow) return isToday ? 'Today' : String(d.getDate());
                return `${fmtRef.current.formatTick(Number(v), 8)}${isToday ? ' (Today)' : ''}`;
              },
            },
          },
          y: {
            min: 0,
            max: yMax,
            grid: { color: C.grid },
            ticks: { color: C.muted, font: { size: 11 }, callback: (v) => fmtRef.current.formatYTick(Number(v)) },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            filter: (item) => !String(item.dataset.label).endsWith('threshold') && item.dataset.label !== 'Now',
            callbacks: {
              title: (items) => (items[0] ? fmtRef.current.formatTime((items[0].raw as any).x) : ''),
              label: (item) => {
                const raw = item.raw as any;
                const name = raw.severity ? `${raw.severity === 'danger' ? 'Danger' : 'Warning'} event` : item.dataset.label;
                const st = raw.status ? ` · ${statusLabels[raw.status as TimeSeriesMarkerStatus]}` : '';
                return `${name}${st}: ${fv(raw.y)}`;
              },
              afterLabel: (item) => ((item.raw as any).id ? clickHint : ''),
            },
          },
        },
        onHover: (evt, elements) => {
          const target = evt.native?.target as HTMLElement | undefined;
          if (!target) return;
          const area = chartRef.current?.chartArea;
          const inPlot = !!area && evt.x !== null && evt.y !== null && evt.x >= area.left && evt.x <= area.right && evt.y >= area.top && evt.y <= area.bottom;
          const onMarker = elements.some((el) => (chartRef.current?.data.datasets[el.datasetIndex].data[el.index] as any)?.id);
          target.style.cursor = onZoomAtRef.current && inPlot ? 'zoom-in' : onMarker ? 'pointer' : 'default';
        },
        onClick: (evt, elements) => {
          for (const el of elements) {
            const raw = chartRef.current?.data.datasets[el.datasetIndex].data[el.index] as any;
            if (raw?.id) {
              onSelectRef.current?.(raw.id);
              return;
            }
          }
          const chart = chartRef.current;
          const area = chart?.chartArea;
          const xScale = (chart as any)?.scales?.x;
          if (!onZoomAtRef.current || !area || !xScale || evt.x === null || evt.y === null) return;
          if (evt.x < area.left || evt.x > area.right || evt.y < area.top || evt.y > area.bottom) return;
          const t = xScale.getValueForPixel(evt.x);
          if (typeof t === 'number' && Number.isFinite(t)) onZoomAtRef.current(t);
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [points, maxPoints, thresholds, markers, highest, from, to, days, futureMs, tickStep, peakStyle, yMaxProp, seriesLabel, statusLabels, clickHint, liveDot, colors]);

  return (
    <div ref={wrapRef} style={{ height, position: 'relative', width: '100%' }}>
      <canvas ref={canvasRef} role="img" aria-label={ariaLabel} />
      {liveDot && <span ref={liveDotRef} className="vs-live-dot" aria-hidden="true" hidden />}
    </div>
  );
}
