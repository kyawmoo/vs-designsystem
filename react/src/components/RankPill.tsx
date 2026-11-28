import React from 'react';

export type RankPillTone = 'auto' | 'lime' | 'dark' | 'light';

export interface RankPillProps {
  /** The position, 1 or more, a whole number. Anything else (0, negative, a fraction, NaN) draws nothing. */
  rank: number;
  /** Words after the number, e.g. "Top asset". Pill only; the circle shows the number alone, a screen reader still hears the label. */
  label?: string;
  /** `auto` (default): rank 1 is lime with dark text, every other rank is dark with white text. */
  tone?: RankPillTone;
  /** `pill` (default, "#2" or "#1 · Top asset") or `circle` (the number alone, as in the vectorsticker.com podium). */
  shape?: 'pill' | 'circle';
  className?: string;
}

/** True for 1, 2, 3 ... */
export function isValidRank(rank: number): boolean {
  return typeof rank === 'number' && Number.isInteger(rank) && rank >= 1;
}

/**
 * VectorSticker RankPill: the position of an item in a ranking ("#2", "#1 · Top asset"). An inline element: the caller places it
 * (for example over the corner of a picture). The visible text is hidden from screen readers and replaced by "Rank 2, Top asset".
 */
export function RankPill({ rank, label, tone = 'auto', shape = 'pill', className }: RankPillProps) {
  if (!isValidRank(rank)) return null;
  const resolved = tone === 'auto' ? (rank === 1 ? 'lime' : 'dark') : tone;
  const classes = ['vs-rank', `vs-rank--${resolved}`, shape === 'circle' ? 'vs-rank--circle' : '', className ?? ''].filter(Boolean).join(' ');
  const text = shape === 'circle' ? String(rank) : label ? `#${rank} · ${label}` : `#${rank}`;
  const spoken = label ? `Rank ${rank}, ${label}` : `Rank ${rank}`;
  return (
    <span className={classes}>
      <span aria-hidden="true">{text}</span>
      <span className="vs-rank__sr">{spoken}</span>
    </span>
  );
}
