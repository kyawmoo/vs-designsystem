import React from 'react';

export type MeterTone = 'default' | 'success' | 'warning' | 'danger' | 'neutral';

export interface MeterThreshold {
  /** Position on the same 0..max scale as the value. */
  value: number;
  /** Colour of the tick. */
  tone: Exclude<MeterTone, 'default'>;
}

export interface MeterProps {
  /** The reading. `null` / `undefined` / not a finite number = no reading: an empty track, never a 0% fill. */
  value: number | null | undefined;
  /** The value that fills the track. Default 100 (a share or progress in %). Invalid or not above 0 falls back to 100. */
  max?: number;
  /** Fill colour: `default` = brand green; `success` / `warning` / `danger` / `neutral` follow the `--vs-meter-fill-*` tokens. */
  tone?: MeterTone;
  /** Tick marks at positions on the 0..max scale (e.g. the Warning and Danger limits of a usage reading). */
  thresholds?: MeterThreshold[];
  /** What is measured, e.g. "Memory". Becomes the accessible name. */
  label: string;
  /** Accessible reading, e.g. "61.0% — Normal". Default: "39%", "8 of 16" or, with no reading, "No reading". */
  valueText?: string;
  className?: string;
}

const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** The scale maximum: `max` when it is a finite number above 0, otherwise 100. */
export function meterMax(max: number | undefined): number {
  return isNum(max) && max > 0 ? max : 100;
}

/** Fill / tick position in percent of the track, always within 0 to 100. A missing or invalid value gives null. */
export function meterPercent(value: number | null | undefined, max: number | undefined): number | null {
  if (!isNum(value)) return null;
  return Math.min(100, Math.max(0, (value / meterMax(max)) * 100));
}

const fmt = (n: number) => Number(n.toFixed(2)).toLocaleString('en-US');

interface MeterBarProps {
  value: number | null | undefined;
  max?: number;
  tone?: MeterTone;
  thresholds?: MeterThreshold[];
  className?: string;
  /** Fill colour (any CSS colour or `var(--token)`); replaces the tone's colour. */
  fillColor?: string;
  /** Extra attributes for the track: the ARIA attributes of Meter, or `aria-hidden` when the number is written next to it. */
  attrs: React.HTMLAttributes<HTMLDivElement>;
}

/** The track, the fill and the tick marks. Also used by BreakdownList, where the row's text already says the value. */
export function MeterBar({ value, max, tone = 'default', thresholds, className, fillColor, attrs }: MeterBarProps) {
  const pct = meterPercent(value, max);
  const classes = ['vs-meter', tone !== 'default' ? `vs-meter--${tone}` : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <div className={classes} {...attrs}>
      {pct !== null && <div className="vs-meter__fill" style={fillColor ? { width: `${pct}%`, background: fillColor } : { width: `${pct}%` }} />}
      {(thresholds ?? []).map((t, i) => {
        const at = meterPercent(t.value, max);
        if (at === null) return null;
        return <span key={`${i}-${t.value}-${t.tone}`} className={`vs-meter__tick vs-meter__tick--${t.tone}`} style={{ left: `min(${at}%, calc(100% - 2px))` }} aria-hidden="true" />;
      })}
    </div>
  );
}

/**
 * VectorSticker Meter (issue #25): a thin horizontal bar for a share, a progress or a usage value.
 * `role="meter"` with a label and a reading: `aria-valuenow` is the value kept inside 0..max, `aria-valuetext` keeps the real reading
 * (a value above max still says so). No reading draws an empty track and says "No reading".
 */
export function Meter({ value, max, tone = 'default', thresholds, label, valueText, className }: MeterProps) {
  const safeMax = meterMax(max);
  const has = isNum(value);
  const now = has ? Math.min(safeMax, Math.max(0, value)) : undefined;
  const text = valueText ?? (!has ? 'No reading' : safeMax === 100 ? `${fmt(value)}%` : `${fmt(value)} of ${fmt(safeMax)}`);
  return (
    <MeterBar
      value={value}
      max={safeMax}
      tone={tone}
      thresholds={thresholds}
      className={className}
      attrs={{
        role: 'meter',
        'aria-label': label,
        'aria-valuemin': 0,
        'aria-valuemax': Number(safeMax.toFixed(2)),
        'aria-valuenow': now === undefined ? undefined : Number(now.toFixed(2)),
        'aria-valuetext': text,
      }}
    />
  );
}
