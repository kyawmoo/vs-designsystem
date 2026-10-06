import React from 'react';
import { createPortal } from 'react-dom';
import { computeTooltipPosition } from './tooltipPosition';
import type { TooltipPlacement, TooltipPosition } from './tooltipPosition';

export type { TooltipPlacement };

/** Hover delay before the tooltip appears. Keyboard focus shows it at once. Fixed so every tooltip behaves alike. */
export const TOOLTIP_OPEN_DELAY = 150;
/** Grace period so the pointer can travel from the trigger onto the tooltip without it closing (WCAG 1.4.13 hoverable). */
export const TOOLTIP_CLOSE_DELAY = 100;

export interface TooltipProps {
  /** Short supplementary text. Plain text only: no links, buttons or other interactive content. */
  content: string;
  /** The trigger: exactly one element that is focusable or otherwise operable (button, link, ...). */
  children: React.ReactElement;
  /** Preferred side. Flips (then slides) automatically when the viewport has no room. Default `top`. */
  placement?: TooltipPlacement;
  /** Small pointer towards the trigger. Default `true`. */
  arrow?: boolean;
  /** Suppresses the tooltip entirely (no hover, no focus, no description). */
  disabled?: boolean;
  /** Extra class on the tooltip surface. */
  className?: string;
}

// Only one tooltip is visible at a time: when one opens, the one that was open closes (e.g. A has keyboard focus and
// the pointer then hovers B).
let closeOpenTooltip: (() => void) | null = null;

const isKeyboardFocus = (target: EventTarget) => {
  try {
    return (target as Element).matches(':focus-visible');
  } catch {
    return true; // very old engines without :focus-visible: show on every focus
  }
};

interface BubbleProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  content: string;
  placement: TooltipPlacement;
  arrow: boolean;
  className?: string;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}

function TooltipBubble({ anchorRef, content, placement, arrow, className, onPointerEnter, onPointerLeave }: BubbleProps) {
  const bubbleRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState<TooltipPosition | null>(null);

  const update = React.useCallback(() => {
    const anchor = anchorRef.current;
    const bubble = bubbleRef.current;
    if (!anchor || !bubble) return;
    const rect = anchor.getBoundingClientRect();
    setPosition(
      computeTooltipPosition({
        anchor: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        size: { width: bubble.offsetWidth, height: bubble.offsetHeight },
        placement,
        viewport: {
          width: document.documentElement.clientWidth || window.innerWidth,
          height: document.documentElement.clientHeight || window.innerHeight,
        },
      }),
    );
  }, [anchorRef, placement]);

  // Measure and place before the browser paints, so the tooltip never flashes in the wrong spot.
  React.useLayoutEffect(() => {
    update();
  }, [update, content]);

  React.useEffect(() => {
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true); // capture: any scrolling ancestor moves the trigger
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [update]);

  const side = position?.placement ?? placement;
  const arrowStyle: React.CSSProperties | undefined =
    position && (side === 'top' || side === 'bottom') ? { left: position.arrow - 4 } : position ? { top: position.arrow - 4 } : undefined;

  return createPortal(
    // The accessible description lives in a visually hidden element next to the trigger (see Tooltip), so this visible
    // copy is hidden from screen readers to avoid reading the text twice.
    <div
      ref={bubbleRef}
      aria-hidden="true"
      data-placement={side}
      className={className ? `vs-tooltip ${className}` : 'vs-tooltip'}
      style={{ top: position?.top ?? 0, left: position?.left ?? 0, visibility: position ? 'visible' : 'hidden' }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {content}
      {arrow ? <span className="vs-tooltip__arrow" style={arrowStyle} /> : null}
    </div>,
    document.body,
  );
}

/**
 * Tooltip: brief supplementary text for a control, shown on pointer hover (after 150ms) and on keyboard focus (at
 * once), dismissed by Escape, by pressing the control, or by moving away. It describes the trigger
 * (`aria-describedby`); it never names it, so an icon-only control still needs its own `aria-label`. On touch screens
 * it is not shown (a tap must perform the control's action), so nothing essential may live only in a tooltip.
 * Wraps the trigger in an inline-flex span; the tooltip itself renders in a portal on `document.body`, so no
 * `overflow` container can clip it.
 */
export function Tooltip({ content, children, placement = 'top', arrow = true, disabled = false, className }: TooltipProps) {
  const id = React.useId();
  const anchorRef = React.useRef<HTMLSpanElement>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [open, setOpen] = React.useState(false);
  const active = !disabled && content.trim().length > 0;

  const clearTimer = React.useCallback(() => {
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
  }, []);
  const hideNow = React.useCallback(() => {
    clearTimer();
    setOpen(false);
  }, [clearTimer]);
  const showSoon = () => {
    if (!active) return;
    clearTimer();
    timer.current = setTimeout(() => setOpen(true), TOOLTIP_OPEN_DELAY);
  };
  const showNow = () => {
    if (!active) return;
    clearTimer();
    setOpen(true);
  };
  const hideSoon = () => {
    clearTimer();
    timer.current = setTimeout(() => setOpen(false), TOOLTIP_CLOSE_DELAY);
  };

  React.useEffect(() => clearTimer, [clearTimer]);

  React.useEffect(() => {
    if (!active) hideNow();
  }, [active, hideNow]);

  React.useEffect(() => {
    if (!open) return;
    if (closeOpenTooltip && closeOpenTooltip !== hideNow) closeOpenTooltip();
    closeOpenTooltip = hideNow;
    return () => {
      if (closeOpenTooltip === hideNow) closeOpenTooltip = null;
    };
  }, [open, hideNow]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hideNow(); // dismissible without moving the pointer or focus
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, hideNow]);

  if (!React.isValidElement<{ 'aria-describedby'?: string }>(children)) return <>{children}</>;

  const describedBy = [children.props['aria-describedby'], active ? id : undefined].filter(Boolean).join(' ') || undefined;
  const trigger = React.cloneElement(children, { 'aria-describedby': describedBy });

  return (
    <>
      <span
        ref={anchorRef}
        className="vs-tooltip-trigger"
        onPointerEnter={(event) => event.pointerType !== 'touch' && showSoon()}
        onPointerLeave={(event) => event.pointerType !== 'touch' && hideSoon()}
        onPointerDown={hideNow}
        onFocus={(event) => isKeyboardFocus(event.target) && showNow()}
        onBlur={hideNow}
      >
        {trigger}
        {active ? (
          <span id={id} role="tooltip" className="vs-tooltip-sr">
            {content}
          </span>
        ) : null}
      </span>
      {open && active && typeof document !== 'undefined' ? (
        <TooltipBubble
          anchorRef={anchorRef}
          content={content}
          placement={placement}
          arrow={arrow}
          className={className}
          onPointerEnter={clearTimer}
          onPointerLeave={hideSoon}
        />
      ) : null}
    </>
  );
}
