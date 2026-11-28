import React from 'react';

export interface WeeklyColumn {
  key: string;
  /** Written under the column, e.g. "9 Nov". */
  label: string;
  /**
   * The stacked parts, bottom to top, one per series. `null` / not a finite number / negative = no part.
   * A column where no part has a value is a gap (no bar), never drawn as 0.
   */
  values: Array<number | null>;
  /** The week is still running: the column is hatched. */
  partial?: boolean;
  /** Hover text of the column, e.g. "Week of 9 to 15 Nov: 120 files, 40 links". */
  title?: string;
}

export interface WeeklySeries {
  /** Written in the legend, e.g. "File on our site". */
  label: string;
  /** Any CSS colour or `var(--token)`. Default: `--vs-chart-series-1` to `-3` in order, then repeated. */
  color?: string;
}

export interface WeeklyMarker {
  /** The short id in the dot, e.g. 1, 2 or "?". */
  id: number | string;
  /** Written in the marker legend, e.g. "New download page 12 Nov". */
  label: string;
  /**
   * Where the marker sits, in weeks from the start of the first column (0 = left edge of the first column, 2.5 = middle of the third).
   * `null`, not finite or outside the axis: no line on the chart, but still listed in the legend.
   */
  at: number | null;
  /** `unconfirmed`: a dashed, hollow dot (e.g. a date that is not set yet). */
  variant?: 'default' | 'unconfirmed';
}

export interface WeeklyColumnChartProps {
  columns: WeeklyColumn[];
  /** One entry per stacked part; also the series legend. */
  series: WeeklySeries[];
  /** Describes the chart for screen readers; include the main numbers. */
  ariaLabel: string;
  /** Where today is, in weeks from the start of the first column (see `WeeklyMarker.at`). `null` / outside the axis: no Today line. */
  todayAt?: number | null;
  markers?: WeeklyMarker[];
  /** Written instead of the chart when there are no columns. */
  empty?: string;
  /** `bottom` (default) or `none` (the series legend). */
  legend?: 'bottom' | 'none';
  className?: string;
}

const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const part = (v: unknown): number | null => (isNum(v) && v >= 0 ? v : null);

/** The colour of series `i`: its own colour, otherwise the chart series tokens in order. */
export function weeklySeriesColor(series: WeeklySeries[], i: number): string {
  return series[i]?.color ?? `var(--vs-chart-series-${(i % 3) + 1})`;
}

/** Left offset in percent of the plot for a position in weeks, or null when it is not on the axis (`slots` = columns + 1 empty week). */
export function weeklyAxisPercent(at: number | null | undefined, slots: number): number | null {
  if (!isNum(at) || slots <= 0 || at < 0 || at >= slots) return null;
  return Math.round((at / slots) * 1000) / 10;
}

/** Marker rows: a marker takes the highest of 3 rows whose last marker is at least `minGap` percent to its left (close markers never cover each other). */
export function weeklyMarkerRows(lefts: number[], minGap = 7): number[] {
  const last = [-Infinity, -Infinity, -Infinity];
  return lefts.map((l) => {
    let row = last.findIndex((x) => l - x >= minGap);
    if (row < 0) row = 2;
    last[row] = l;
    return row;
  });
}

/**
 * VectorSticker WeeklyColumnChart (issue #150): one stacked column per week, for weekly numbers that cannot be added up from days
 * (distinct visitors, a returning rate). Chart Rule: one empty week slot after the last week, a dotted Today line, a gap (not 0)
 * for a week without data. A running week is hatched. Numbered change markers sit on the axis and are listed below.
 * Plain HTML, no chart library, no animation. The plot is `role="img"` with `ariaLabel`; legends are real text.
 */
export function WeeklyColumnChart({ columns, series, ariaLabel, todayAt = null, markers = [], empty = 'No data', legend = 'bottom', className }: WeeklyColumnChartProps) {
  const classes = className ? `vs-weekly-chart ${className}` : 'vs-weekly-chart';
  if (columns.length === 0) {
    return (
      <div className={classes}>
        <p className="vs-weekly-chart__empty">{empty}</p>
      </div>
    );
  }
  const slots = columns.length + 1; // + one empty future week (Chart Rule)
  const totals = columns.map((c) => c.values.reduce<number>((s, v) => s + (part(v) ?? 0), 0));
  const max = Math.max(1, ...totals);
  const grid = { gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))` };
  const today = weeklyAxisPercent(todayAt, slots);
  const placed = markers
    .map((m) => ({ m, left: weeklyAxisPercent(m.at, slots) }))
    .filter((x): x is { m: WeeklyMarker; left: number } => x.left !== null)
    .sort((a, b) => a.left - b.left);
  const rows = weeklyMarkerRows(placed.map((p) => p.left));
  const dotClass = (m: WeeklyMarker) => (m.variant === 'unconfirmed' ? 'vs-weekly-chart__dot vs-weekly-chart__dot--unconfirmed' : 'vs-weekly-chart__dot');
  return (
    <div className={classes}>
      <div className="vs-weekly-chart__plot" style={grid} role="img" aria-label={ariaLabel}>
        {columns.map((c) => {
          const hasData = c.values.some((v) => part(v) !== null);
          return (
            <div key={c.key} className={hasData ? 'vs-weekly-chart__col' : 'vs-weekly-chart__col vs-weekly-chart__col--gap'} title={c.title}>
              {hasData &&
                c.values.map((v, i) => {
                  const n = part(v);
                  if (n === null || n === 0) return null;
                  return (
                    <span
                      key={i}
                      className={c.partial ? 'vs-weekly-chart__bar vs-weekly-chart__bar--partial' : 'vs-weekly-chart__bar'}
                      style={{ height: `${(n / max) * 100}%`, backgroundColor: weeklySeriesColor(series, i) }}
                    />
                  );
                })}
            </div>
          );
        })}
        <div className="vs-weekly-chart__col vs-weekly-chart__col--future" aria-hidden="true" />
        {today !== null && (
          <div className="vs-weekly-chart__today" style={{ left: `${today}%` }} aria-hidden="true">
            <span>Today</span>
          </div>
        )}
        {placed.map((p, i) => (
          <div key={`${p.m.id}-${i}`} className="vs-weekly-chart__marker" style={{ left: `${p.left}%` }} aria-hidden="true">
            <b className={dotClass(p.m)} style={{ top: `${rows[i] * 1.375}rem` }}>
              {p.m.id}
            </b>
          </div>
        ))}
      </div>
      <div className="vs-weekly-chart__axis" style={grid} aria-hidden="true">
        {columns.map((c) => (
          <span key={c.key}>{c.label}</span>
        ))}
        <span />
      </div>
      {legend !== 'none' && series.length > 0 && (
        <ul className="vs-weekly-chart__legend">
          {series.map((s, i) => (
            <li key={`${s.label}-${i}`} className="vs-weekly-chart__legend-item">
              <span className="vs-weekly-chart__swatch" style={{ background: weeklySeriesColor(series, i) }} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      {markers.length > 0 && (
        <ul className="vs-weekly-chart__markers">
          {markers.map((m, i) => (
            <li key={`${m.id}-${i}`}>
              <b className={dotClass(m)} aria-hidden="true">
                {m.id}
              </b>
              <span className="vs-weekly-chart__sr">{`${m.id}: `}</span>
              {m.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
