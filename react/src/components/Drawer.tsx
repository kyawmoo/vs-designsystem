import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export type DrawerWidth = 'sm' | 'md';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Names the panel. Shown as the header heading unless `header` is given (then it only labels the dialog). */
  title: React.ReactNode;
  /** Custom header content (e.g. avatar + name + badges) shown instead of the plain title heading. */
  header?: React.ReactNode;
  /** Content of a footer that stays at the bottom while the body scrolls (e.g. pagination). */
  footer?: React.ReactNode;
  /** `sm` 400px, `md` 520px (default). Narrower screens get the full width. */
  width?: DrawerWidth;
  children?: React.ReactNode;
  className?: string;
}

export const DRAWER_WIDTH: Record<DrawerWidth, string> = { sm: '400px', md: '520px' };

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Full-height panel that slides in from the right edge over a dimmed overlay, for details of one
 * row (a user, an event) without leaving the page. Same overlay and close button as `Modal`.
 *
 * Behaviour: overlay click, Escape and the close button call `onClose`; focus moves into the
 * panel on open, stays inside it (Tab / Shift+Tab wrap) and returns to the element that opened it
 * on close; the page behind does not scroll while it is open. No slide animation when the user
 * asks for reduced motion.
 */
export function Drawer({ open, onClose, title, header, footer, width = 'md', children, className }: DrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Latest onClose without re-running the open/close effect (which would move focus) when the parent re-renders.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const inside = panelRef.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="vs-drawer-root" role="presentation">
      <div className="vs-drawer-overlay" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={className ? `vs-drawer-panel ${className}` : 'vs-drawer-panel'}
        style={{ width: DRAWER_WIDTH[width] ?? DRAWER_WIDTH.md }}
      >
        <div className="vs-drawer-header">
          {header ? (
            <>
              <span id={titleId} className="vs-drawer-sr-only">{title}</span>
              <div className="vs-drawer-header-content">{header}</div>
            </>
          ) : (
            <h2 id={titleId} className="vs-drawer-title">{title}</h2>
          )}
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="vs-modal-close vs-drawer-close">
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="vs-drawer-body">{children}</div>
        {footer && <div className="vs-drawer-footer">{footer}</div>}
      </div>
    </div>
  );
}
