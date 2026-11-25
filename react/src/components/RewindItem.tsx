import React from 'react';
import { REWIND_HARD_MAX_STEPS } from './rewindOrder';

export interface RewindItemProps extends React.HTMLAttributes<HTMLElement> {
  /** The element to render (default 'div'). The item IS this element, not a wrapper around it. */
  as?: React.ElementType;
  /**
   * Step number: 0 appears at once, each step later starts `--vs-motion-rewind-step` after the one before it. Get the numbers
   * from `rewindIndexes`. `null`, `undefined`, a negative or a non-number: no animation, the item is shown at once.
   */
  index?: number | null;
}

/**
 * One element that takes part in a Rewind Reveal (a calendar day, a card on a timeline). It only sets `data-vs-rewind` and the step
 * variable that the CSS animates, so it renders no wrapper and sticky or grid layouts keep working. To replay the effect (a new
 * month), mount the items again, for example by giving their parent a new `key`. Reduced motion switches the animation off in CSS.
 */
export function RewindItem({ as: Tag = 'div', index, style, ...rest }: RewindItemProps) {
  const step = typeof index === 'number' && Number.isFinite(index) && index >= 0 ? Math.min(Math.floor(index), REWIND_HARD_MAX_STEPS) : null;
  if (step === null) return <Tag {...rest} style={style} />;
  return <Tag {...rest} data-vs-rewind="" style={{ ...style, ['--vs-rewind-i' as string]: step } as React.CSSProperties} />;
}
