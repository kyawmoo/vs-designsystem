import React from 'react';
import { createPortal } from 'react-dom';

export type PopoverAlign = 'start' | 'end';

export interface PopoverProps {
  /** Controlled: the page owns this. */
  open: boolean;
  /** Called on Escape and on a click outside the panel (not on the anchor: the anchor's own click should toggle `open`). */
  onClose: () => void;
  /** The button (or group) the panel opens from. Gets the focus back when the panel closes. */
  anchorRef: React.RefObject<HTMLElement | null>;
  /** Accessible name of the panel (required). */
  label: string;
  /** Which edge of the anchor the panel lines up with: `end` = right edge (default), `start` = left edge. */
  align?: PopoverAlign;
  /** Viewport width (px) under which the panel becomes a bottom sheet with a backdrop. Default 768 (Tailwind `md`, like `FilterSheet`). */
  sheetBelow?: number;
  className?: string;
  children: React.ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const GAP = 8;
const MARGIN = 8;

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/** True while the viewport is narrower than `below` px. Both mode and listener are safe without `matchMedia` (tests, old browsers). */
function useIsNarrow(below: number): boolean {
  const query = `(max-width: ${below - 1}px)`;
  const read = () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false);
  const [narrow, setNarrow] = React.useState(read);
  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(query);
    const onChange = () => setNarrow(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return narrow;
}

/**
 * Popover: a panel that opens under a button (`anchorRef`), for content that is too big for a tooltip and too small for a
 * Modal (for example a calendar). On a phone it becomes a bottom sheet with a backdrop.
 *
 * Behaviour: Escape and a click outside call `onClose`; focus moves into the panel on open and Tab stays inside it;
 * focus returns to the anchor on close (unless the viewer clicked another control); it is drawn in a portal so a card's
 * `overflow: hidden` cannot clip it, placed under the anchor (above it when there is no room), kept inside the viewport and
 * re-placed on scroll and resize. In sheet mode the page behind does not scroll. No animation with reduced motion.
 */
export function Popover({ open, onClose, anchorRef, label, align = 'end', sheetBelow = 768, className, children }: PopoverProps) {
  const sheet = useIsNarrow(sheetBelow);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ left: number; top: number } | null>(null);
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  // Place the panel (desktop mode). Runs before paint, so it never flashes in the wrong place.
  const place = React.useCallback(() => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;
    const a = anchor.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = align === 'end' ? a.right - p.width : a.left;
    left = Math.max(MARGIN, Math.min(left, vw - p.width - MARGIN));
    let top = a.bottom + GAP;
    if (top + p.height > vh - MARGIN && a.top - GAP - p.height >= MARGIN) top = a.top - GAP - p.height;
    setPos((prev) => (prev && prev.left === left && prev.top === top ? prev : { left, top }));
  }, [anchorRef, align]);

  React.useLayoutEffect(() => {
    if (!open || sheet) return;
    place();
  }, [open, sheet, place, children]);

  React.useEffect(() => {
    if (!open || sheet) return;
    const onMove = () => place();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    const panel = panelRef.current;
    const ro = typeof ResizeObserver === 'function' && panel ? new ResizeObserver(onMove) : null;
    if (ro && panel) ro.observe(panel);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
      ro?.disconnect();
    };
  }, [open, sheet, place]);

  // Reset the placement when it closes, so the next open measures again.
  React.useEffect(() => {
    if (!open) setPos(null);
  }, [open]);

  // Escape, outside click.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer, true);
    };
  }, [open, anchorRef]);

  // Focus in on open, back to the anchor on close.
  React.useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();
    return () => {
      const active = document.activeElement;
      if (!active || active === document.body || panelRef.current?.contains(active)) {
        anchorRef.current?.focus();
        // A tap on empty page space moves the focus to <body> right after the pointer event: put it back once that is done.
        setTimeout(() => {
          if (document.activeElement === document.body) anchorRef.current?.focus();
        }, 0);
      }
    };
  }, [open, anchorRef]);

  // Sheet mode: the page behind does not scroll.
  React.useEffect(() => {
    if (!open || !sheet) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, sheet]);

  const onPanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!open || typeof document === 'undefined') return null;

  const panelStyle: React.CSSProperties | undefined = sheet
    ? undefined
    : pos
      ? { left: pos.left, top: pos.top }
      : { left: 0, top: 0, opacity: 0 }; // measured first; opacity (not visibility) so the focus effect can still focus inside

  return createPortal(
    <>
      {sheet && <div className="vs-popover-backdrop" aria-hidden="true" />}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={sheet}
        aria-label={label}
        tabIndex={-1}
        className={cx('vs-popover', sheet && 'vs-popover--sheet', className)}
        style={panelStyle}
        onKeyDown={onPanelKeyDown}
      >
        {sheet && <span className="vs-popover-grab" aria-hidden="true" />}
        {children}
      </div>
    </>,
    document.body
  );
}
