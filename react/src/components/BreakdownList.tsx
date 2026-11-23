import React from 'react';
import { MeterBar } from './Meter';
import type { MeterTone } from './Meter';

export interface BreakdownRow {
  key: string;
  /** The name, e.g. "Canada (CA)". May hold a flag or an icon. */
  label: React.ReactNode;
  /** The count shown in bold, e.g. 1 download. */
  value: number;
  /** The share of the total in percent (0 to 100). Written as "50%" and, with `barScale="share"`, the length of the bar. */
  share: number;
  /** Replaces the formatted `value`, e.g. "1.2k". */
  valueText?: string;
  /** Bar colour; default = brand green. */
  tone?: MeterTone;
}

export interface BreakdownListProps {
  rows: BreakdownRow[];
  /** Shown when there are no rows. */
  empty: string;
  /**
   * `share` (default): a bar is as long as the share (50% = half). `relative`: the row with the largest share fills the track and the
   * others are scaled to it (a short list where every share is small).
   */
  barScale?: 'share' | 'relative';
  /** Formats `value` when a row has no `valueText`. Default: `toLocaleString`. */
  formatValue?: (value: number) => string;
  className?: string;
}

const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/**
 * VectorSticker BreakdownList: rows of a name, its count and share, each with a thin bar for the share (traffic source, country, device).
 * The bar repeats what the text says, so it is hidden from screen readers; the row text is the information.
 */
export function BreakdownList({ rows, empty, barScale = 'share', formatValue = (v) => v.toLocaleString('en-US'), className }: BreakdownListProps) {
  if (rows.length === 0) {
    return <p className="vs-breakdown__empty">{empty}</p>;
  }
  const maxShare = Math.max(0, ...rows.map((r) => (isNum(r.share) ? r.share : 0)));
  return (
    <ul className={className ? `vs-breakdown ${className}` : 'vs-breakdown'}>
      {rows.map((row) => {
        const share = isNum(row.share) ? row.share : null;
        const bar = share === null ? null : barScale === 'relative' ? (maxShare > 0 ? (share / maxShare) * 100 : 0) : share;
        return (
          <li key={row.key} className="vs-breakdown__row">
            <div className="vs-breakdown__head">
              <span className="vs-breakdown__label">{row.label}</span>
              <span className="vs-breakdown__figures">
                <span className="vs-breakdown__value">{row.valueText ?? (isNum(row.value) ? formatValue(row.value) : '—')}</span>
                {share !== null && <span className="vs-breakdown__share">{`${share}%`}</span>}
              </span>
            </div>
            <MeterBar value={bar} max={100} tone={row.tone} attrs={{ 'aria-hidden': true }} />
          </li>
        );
      })}
    </ul>
  );
}
