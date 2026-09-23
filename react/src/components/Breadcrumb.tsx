import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Wraps the real .breadcrumb.custom pattern (audited: FontAwesome chevron
 * divider, active item colored brand primary, links use body text color).
 * lucide's ChevronRight substitutes for the FontAwesome \f054 glyph —
 * per the platform-per-library icon decision (see Iconography).
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb" className={className}>
      <ol style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', margin: 0, padding: 0, listStyle: 'none', fontFamily: 'var(--vs-font-family)', fontSize: 'var(--vs-font-size-body-sm)' }}>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {i > 0 && <ChevronRight size={10} strokeWidth={2.5} style={{ color: 'var(--vs-color-text-muted)' }} />}
              {isLast || !item.href ? (
                <span style={{ color: isLast ? 'var(--vs-color-brand-primary)' : 'var(--vs-color-text-body)', textTransform: 'capitalize' }}>
                  {item.label}
                </span>
              ) : (
                <a href={item.href} style={{ color: 'var(--vs-color-text-body)', textDecoration: 'none', textTransform: 'capitalize' }}>
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
