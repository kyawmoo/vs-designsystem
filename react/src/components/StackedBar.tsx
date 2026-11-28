import React from 'react';
import { DONUT_PALETTE_SIZE, donutAmount, donutPercentText } from './DonutChart';

export interface StackedBarPart {
  key: string;
  /** A short name, e.g. "File". Written in the legend. */
  label: string;
  /** The amount. A negative or non-finite value counts as 0: no segment, the legend says 0%. */
  value: number;
  /** Any CSS colour or `var(--token)`. Default: `--vs-chart-donut-1` to `-6` in order, then repeated. */
  color?: string;
}

export interface StackedBarProps {
  parts: StackedBarPart[];
  /** Describes the bar for screen readers, e.g. "Downloads by type: File 75%, External link 25%". */
  ariaLabel: string;
  /** Written instead of the bar when there is nothing to draw (no parts, or every value 0). */
  empty?: string;
  /** `bottom` (default) or `none`. */
  legend?: 'bottom' | 'none';
  className?: string;
}

/**
 * VectorSticker StackedBar (issue #151): one horizontal bar made of the parts of one whole, with a legend of swatch, name and percentage.
 * Each segment is as wide as its share of the total, so the parts always fill the track exactly. Parts with 0 are not drawn
 * but stay in the legend (0%). The bar is `role="img"`; the legend is real text, so the colour is never the only signal.
 */
export function StackedBar({ parts, ariaLabel, empty = 'No data', legend = 'bottom', className }: StackedBarProps) {
  const amounts = parts.map((p) => donutAmount(p.value));
  const total = amounts.reduce((a, b) => a + b, 0);
  const color = (p: StackedBarPart, i: number) => p.color ?? `var(--vs-chart-donut-${(i % DONUT_PALETTE_SIZE) + 1})`;
  const classes = className ? `vs-stacked-bar ${className}` : 'vs-stacked-bar';
  if (total <= 0) {
    return (
      <div className={classes}>
        <p className="vs-stacked-bar__empty">{empty}</p>
      </div>
    );
  }
  return (
    <div className={classes}>
      <div className="vs-stacked-bar__track" role="img" aria-label={ariaLabel}>
        {parts.map((p, i) =>
          amounts[i] > 0 ? (
            <span key={p.key} className="vs-stacked-bar__part" style={{ width: `${(amounts[i] / total) * 100}%`, background: color(p, i) }} />
          ) : null,
        )}
      </div>
      {legend !== 'none' && (
        <ul className="vs-stacked-bar__legend">
          {parts.map((p, i) => (
            <li key={p.key} className="vs-stacked-bar__legend-item">
              <span className="vs-stacked-bar__swatch" style={{ background: color(p, i) }} aria-hidden="true" />
              <span className="vs-stacked-bar__legend-label">{p.label}</span>
              <span className="vs-stacked-bar__legend-pct">{donutPercentText((amounts[i] / total) * 100)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
