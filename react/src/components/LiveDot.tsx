import React from 'react';

export type LiveDotSize = 'sm' | 'md' | 'lg';

export interface LiveDotProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'> {
  /** Any CSS colour or `var(--token)`. Default: the brand green (`--vs-color-brand-primary`). */
  color?: string;
  /** `sm` 5px, `md` 8px (default), `lg` 12px. */
  size?: LiveDotSize;
  /** The ripple that grows and fades on repeat. Default true; never with reduced motion. */
  ripple?: boolean;
  /**
   * What the dot means, for screen readers (e.g. "Live", "Online"). Without it the dot is decoration (`aria-hidden`): put the
   * meaning in the text next to it.
   */
  label?: string;
}

/**
 * Live dot (Animation & Effects, 27 Nov 2026): a small dot with a soft ripple that grows and fades on repeat, for "live" /
 * "online" / "newest" marks next to a label or an avatar. The same look as the dot LineChart and BarChart put on the newest
 * reading of a line (CSS `.vs-live-dot`, shared with the Blade `<x-vs-live-dot>`).
 */
export function LiveDot({ color, size = 'md', ripple = true, label, className, style, ...rest }: LiveDotProps) {
  const classes = ['vs-live-dot', 'vs-live-dot--inline'];
  if (size === 'sm' || size === 'lg') classes.push(`vs-live-dot--${size}`); // anything else: md
  if (!ripple) classes.push('vs-live-dot--still');
  if (className) classes.push(className);
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const };
  return (
    <span
      {...rest}
      {...a11y}
      className={classes.join(' ')}
      style={color ? ({ ...style, '--vs-live-dot-color': color } as React.CSSProperties) : style}
    />
  );
}
