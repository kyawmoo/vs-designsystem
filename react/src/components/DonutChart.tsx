import React from 'react';

export interface DonutSegment {
  key: string;
  /** A short name, e.g. "Direct". It is written in the legend and in the hover text of the segment. */
  label: string;
  /** The amount. A negative or non-finite value counts as 0 and is not drawn. */
  value: number;
  /** Any CSS colour or `var(--token)`. Default: `--vs-chart-donut-1` to `-6` in order, then repeated. */
  color?: string;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  /** Describes the chart for screen readers, e.g. "Traffic sources, 12,480 sessions". */
  ariaLabel: string;
  /** Shown in the middle. Default: the total of the segments. */
  centerValue?: React.ReactNode;
  /** The small caption under the middle value, e.g. "Sessions". */
  centerCaption?: string;
  /** Width and height of the ring in px. Default 176. */
  size?: number;
  /** Formats a value in the hover text and the default centre. Default: `toLocaleString('en-US')`. */
  formatValue?: (value: number) => string;
  /** Written in the middle when there is nothing to draw (no segments, or every value 0). */
  empty?: string;
  /** `bottom` (default), `right` (ring and legend side by side from 480px up) or `none`. */
  legend?: 'bottom' | 'right' | 'none';
  className?: string;
}

/** The colours used when a segment has none of its own. */
export const DONUT_PALETTE_SIZE = 6;

const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** The amount a segment draws: a finite number above 0, otherwise 0. */
export function donutAmount(value: number): number {
  return isNum(value) && value > 0 ? value : 0;
}

/** "38%" (rounded); anything above 0 and below 1% is written "<1%". */
export function donutPercentText(share: number): string {
  if (!isNum(share) || share <= 0) return '0%';
  if (share < 1) return '<1%';
  return `${Math.round(share)}%`;
}

const RADIUS = 44;
const STROKE = 18;
const VIEW = 120;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** The gap between two neighbouring segments, along the ring. */
const GAP = 1.5;
/** The whole ring draws in over this long (ms), one segment after the other. */
const DRAW_MS = 800;

/**
 * VectorSticker DonutChart (issue #72): a ring of segments with a total in the middle and a legend of swatch, name and percentage.
 * Plain SVG, no chart library. Every segment is named in the legend in text, so the colour is never the only signal.
 * The ring draws in once; under `prefers-reduced-motion` it does not move.
 */
export function DonutChart({
  segments,
  ariaLabel,
  centerValue,
  centerCaption,
  size = 176,
  formatValue = (v) => v.toLocaleString('en-US'),
  empty = 'No data',
  legend = 'bottom',
  className,
}: DonutChartProps) {
  const amounts = segments.map((s) => donutAmount(s.value));
  const total = amounts.reduce((a, b) => a + b, 0);
  const hasData = total > 0;
  const drawn = amounts.filter((a) => a > 0).length;
  const classes = ['vs-donut', legend === 'right' ? 'vs-donut--legend-right' : '', className ?? ''].filter(Boolean).join(' ');
  const colorOf = (s: DonutSegment, i: number) => s.color ?? `var(--vs-chart-donut-${(i % DONUT_PALETTE_SIZE) + 1})`;

  let start = 0;
  const arcs = hasData
    ? segments.map((s, i) => {
        const share = amounts[i] / total;
        const len = share * CIRCUMFERENCE;
        const at = start;
        start += len;
        if (amounts[i] === 0) return null;
        // A small gap between neighbours; a segment shorter than the gap, or the only one, is drawn whole.
        const dash = drawn > 1 && len > GAP ? len - GAP : len;
        const text = `${s.label}: ${formatValue(amounts[i])} (${donutPercentText(share * 100)})`;
        return (
          <circle
            key={s.key}
            className="vs-donut__seg"
            cx={VIEW / 2}
            cy={VIEW / 2}
            r={RADIUS}
            fill="none"
            stroke={colorOf(s, i)}
            strokeWidth={STROKE}
            strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
            strokeDashoffset={-at}
            style={{ animationDuration: `${Math.round(share * DRAW_MS)}ms`, animationDelay: `${Math.round((at / CIRCUMFERENCE) * DRAW_MS)}ms` }}
          >
            <title>{text}</title>
          </circle>
        );
      })
    : [];

  return (
    <div className={classes}>
      <div className="vs-donut__ring" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          width="100%"
          height="100%"
          role="img"
          aria-label={ariaLabel}
          focusable="false"
          style={{ ['--vs-donut-total' as string]: CIRCUMFERENCE }}
        >
          <g transform={`rotate(-90 ${VIEW / 2} ${VIEW / 2})`}>
            <circle cx={VIEW / 2} cy={VIEW / 2} r={RADIUS} fill="none" stroke="var(--vs-meter-track)" strokeWidth={STROKE} />
            {arcs}
          </g>
        </svg>
        <div className="vs-donut__center">
          {hasData ? (
            <>
              <strong className="vs-donut__center-value">{centerValue ?? formatValue(total)}</strong>
              {centerCaption ? <span className="vs-donut__center-caption">{centerCaption}</span> : null}
            </>
          ) : (
            <span className="vs-donut__center-caption">{empty}</span>
          )}
        </div>
      </div>
      {legend !== 'none' && hasData && (
        <ul className="vs-donut__legend">
          {segments.map((s, i) => (
            <li key={s.key} className="vs-donut__legend-item">
              <span className="vs-donut__swatch" style={{ background: colorOf(s, i) }} aria-hidden="true" />
              <span className="vs-donut__legend-label">{s.label}</span>
              <span className="vs-donut__legend-pct">{donutPercentText((amounts[i] / total) * 100)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
