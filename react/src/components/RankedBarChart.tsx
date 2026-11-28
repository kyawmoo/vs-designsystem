import React, { useEffect, useRef } from 'react';
import { BarController, BarElement, CategoryScale, Chart, LinearScale, Tooltip } from 'chart.js';
import { prefersReducedMotion, resolveColor } from './chartShared';

Chart.register(BarController, BarElement, LinearScale, CategoryScale, Tooltip);

export interface RankedBarRow {
  /** The name written at the left of the bar (a country, a category, ...). */
  label: string;
  value: number;
}

export interface RankedBarChartProps {
  /** One horizontal bar per row, in the order given (sort them yourself). */
  rows: RankedBarRow[];
  /** Describes the chart for screen readers, e.g. "Downloads by country". */
  ariaLabel: string;
  /** Any CSS colour or `var(--token)`. Default: `--vs-chart-series-1`. */
  color?: string;
  /** What the value means, written in the hover text ("Downloads: 1,200"). Default "Value". */
  valueLabel?: string;
  /** Number format for the value at the end of each bar and in the hover text. Default `toLocaleString`. */
  formatValue?: (value: number) => string;
  /** Height of one bar row in px. Default 34. */
  rowHeight?: number;
  /** The chart is never shorter than this, in px. Default 240. */
  minHeight?: number;
  /** Written instead of the chart when there are no rows. Default "No data". */
  empty?: string;
  className?: string;
}

const VALUE_FONT = '600 11px sans-serif';

/** A non-negative finite number; anything else counts as 0 (and draws no bar). */
function safeValue(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Names longer than half the chart are shortened so they never run into the bars: first drop a trailing "(...)" part
 * (a country code), then cut letters and add "…". The hover text always has the full name.
 */
export function fitLabel(full: string, fits: (text: string) => boolean): string {
  const withoutParens = full.replace(/\s*\([^)]*\)$/, '');
  const found = [full, withoutParens].find(fits);
  if (found !== undefined) return found;
  let chars = Array.from(withoutParens);
  let text = withoutParens;
  while (chars.length > 3 && !fits(text)) {
    chars = chars.slice(0, -1);
    text = `${chars.join('').trimEnd()}…`;
  }
  return text;
}

/**
 * Ranked bar chart: one horizontal bar per label (not per date), the value written just past each bar's end, the chart
 * growing taller with the number of rows. For "downloads by country", "views by category". For values over time use BarChart.
 */
export function RankedBarChart({
  rows,
  ariaLabel,
  color = 'var(--vs-chart-series-1)',
  valueLabel = 'Value',
  formatValue = (v) => v.toLocaleString(),
  rowHeight = 34,
  minHeight = 240,
  empty = 'No data',
  className,
}: RankedBarChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const height = Math.max(minHeight, rows.length * rowHeight);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !wrap || !ctx || rows.length === 0) return;

    const barColor = resolveColor(wrap, ctx, color, '#4caf50');
    const gridColor = resolveColor(wrap, ctx, 'var(--vs-chart-grid)', '#ececec');
    const axisColor = resolveColor(wrap, ctx, 'var(--vs-chart-axis-text)', '#8e9cba');
    const textColor = resolveColor(wrap, ctx, 'var(--vs-color-text-body)', '#374151');
    const values = rows.map((r) => safeValue(r.value));

    // Room at the right for the longest value text.
    ctx.save();
    ctx.font = VALUE_FONT;
    const widest = Math.max(0, ...values.map((v) => ctx.measureText(formatValue(v)).width));
    ctx.restore();
    const padRight = Math.ceil(widest) + 10;

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: rows.map((r) => r.label),
        datasets: [{ label: valueLabel, data: values, backgroundColor: barColor, borderRadius: 6, barThickness: 16, maxBarThickness: 20 }],
      },
      plugins: [
        {
          id: 'vsRankedValues',
          afterDatasetsDraw(c) {
            const { ctx: g } = c;
            g.save();
            g.fillStyle = textColor;
            g.font = VALUE_FONT;
            g.textAlign = 'left';
            g.textBaseline = 'middle';
            c.getDatasetMeta(0).data.forEach((bar: any, i: number) => g.fillText(formatValue(values[i]), bar.x + 6, bar.y));
            g.restore();
          },
        },
      ],
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: prefersReducedMotion() ? false : undefined,
        layout: { padding: { right: padRight } },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => rows[items[0]?.dataIndex ?? 0]?.label ?? '',
              label: (item) => ` ${valueLabel}: ${formatValue(Number(item.parsed.x || 0))}`,
            },
          },
        },
        scales: {
          x: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: axisColor, font: { size: 11 } }, border: { display: false } },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: textColor,
              font: { size: 12 },
              crossAlign: 'far',
              padding: 12,
              callback(this: any, _value, index) {
                const full = String(rows[index]?.label ?? '');
                const c = this.chart as Chart;
                const maxWidth = (c.width - padRight) / 2 - 14;
                const g = c.ctx;
                g.save();
                g.font = `12px ${Chart.defaults.font.family}`;
                const text = fitLabel(full, (s) => g.measureText(s).width <= maxWidth);
                g.restore();
                return text;
              },
            },
          },
        },
      },
    });
    return () => chart.destroy();
  }, [rows, color, valueLabel, formatValue]);

  const classes = className ? `vs-ranked-bar-chart ${className}` : 'vs-ranked-bar-chart';
  if (rows.length === 0) {
    return (
      <div className={classes} role="img" aria-label={ariaLabel}>
        <p className="vs-ranked-bar-chart__empty">{empty}</p>
      </div>
    );
  }
  return (
    <div ref={wrapRef} className={classes}>
      <div className="vs-line-chart-canvas" style={{ height }}>
        <canvas ref={canvasRef} role="img" aria-label={ariaLabel} />
      </div>
    </div>
  );
}
