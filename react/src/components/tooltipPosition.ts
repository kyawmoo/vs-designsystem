export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface AnchorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface TooltipPositionInput {
  /** The trigger's rectangle in viewport coordinates (getBoundingClientRect). */
  anchor: AnchorRect;
  /** The measured tooltip surface. */
  size: { width: number; height: number };
  /** Preferred side. */
  placement: TooltipPlacement;
  viewport: { width: number; height: number };
  /** Distance between trigger and tooltip. */
  gap?: number;
  /** Minimum distance kept to the viewport edge. */
  margin?: number;
  /** Minimum distance of the arrow from the corners of the tooltip. */
  arrowInset?: number;
}

export interface TooltipPosition {
  /** The side actually used (differs from the preferred one after a flip). */
  placement: TooltipPlacement;
  top: number;
  left: number;
  /** Arrow centre along the tooltip's cross axis, in px from the tooltip's top (left/right) or left (top/bottom) edge. */
  arrow: number;
}

const OPPOSITE: Record<TooltipPlacement, TooltipPlacement> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
const PERPENDICULAR: Record<TooltipPlacement, [TooltipPlacement, TooltipPlacement]> = {
  top: ['left', 'right'],
  bottom: ['left', 'right'],
  left: ['top', 'bottom'],
  right: ['top', 'bottom'],
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

/**
 * Where to put a tooltip. Prefers `placement`; if that side lacks room it tries the opposite side, then the two
 * perpendicular ones, and if nothing fits it takes the roomiest side. The tooltip is then slid along the cross axis
 * so it never leaves the viewport, and the arrow keeps pointing at the trigger's centre.
 */
export function computeTooltipPosition({
  anchor,
  size,
  placement,
  viewport,
  gap = 8,
  margin = 8,
  arrowInset = 12,
}: TooltipPositionInput): TooltipPosition {
  const space: Record<TooltipPlacement, number> = {
    top: anchor.top - margin,
    bottom: viewport.height - (anchor.top + anchor.height) - margin,
    left: anchor.left - margin,
    right: viewport.width - (anchor.left + anchor.width) - margin,
  };
  const needs = (side: TooltipPlacement) => (side === 'top' || side === 'bottom' ? size.height : size.width) + gap;

  const candidates = [placement, OPPOSITE[placement], ...PERPENDICULAR[placement]];
  const fitting = candidates.find((side) => space[side] >= needs(side));
  const side = fitting ?? candidates.reduce((best, current) => (space[current] > space[best] ? current : best));

  const centreX = anchor.left + anchor.width / 2;
  const centreY = anchor.top + anchor.height / 2;
  let top: number;
  let left: number;
  if (side === 'top' || side === 'bottom') {
    top = side === 'top' ? anchor.top - size.height - gap : anchor.top + anchor.height + gap;
    left = centreX - size.width / 2;
  } else {
    left = side === 'left' ? anchor.left - size.width - gap : anchor.left + anchor.width + gap;
    top = centreY - size.height / 2;
  }

  top = clamp(top, margin, Math.max(margin, viewport.height - size.height - margin));
  left = clamp(left, margin, Math.max(margin, viewport.width - size.width - margin));

  const arrow =
    side === 'top' || side === 'bottom'
      ? clamp(centreX - left, arrowInset, Math.max(arrowInset, size.width - arrowInset))
      : clamp(centreY - top, arrowInset, Math.max(arrowInset, size.height - arrowInset));

  return { placement: side, top, left, arrow };
}
