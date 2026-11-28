import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DisclosureProps {
  title: string;
  /** One line under the title. */
  description?: string;
  /** An icon, drawn in a 40px tinted tile (hidden from screen readers). */
  icon?: React.ReactNode;
  /** Open when first drawn. Default false. */
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * VectorSticker Disclosure (issue #70): a card whose header (icon tile, title, description, chevron) opens and closes its body.
 * A native <details>/<summary>, so click, Enter and Space work without a script and each card opens on its own; the header also
 * carries aria-expanded. The chevron turns when open (not with reduced motion). Moved from the reports site's approved stand-in
 * (Master KMO, 2026-11-07, J1a; spike #67 decision (b)).
 */
export function Disclosure({ title, description, icon, defaultOpen = false, children, className }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      className={className ? `vs-disclosure ${className}` : 'vs-disclosure'}
      open={defaultOpen}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="vs-disclosure__head" aria-expanded={open}>
        {icon ? (
          <span className="vs-disclosure__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="vs-disclosure__text">
          <span className="vs-disclosure__title">{title}</span>
          {description ? <span className="vs-disclosure__desc">{description}</span> : null}
        </span>
        <ChevronDown className="vs-disclosure__chev" width={18} height={18} aria-hidden="true" />
      </summary>
      <div className="vs-disclosure__body">{children}</div>
    </details>
  );
}
