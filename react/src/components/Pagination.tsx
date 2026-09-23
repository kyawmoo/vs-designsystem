import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const ITEM_STYLE_BASE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '36px',
  height: '36px',
  padding: '6px 15px',
  borderRadius: 'var(--vs-radius-xs)',
  border: 'none',
  background: 'transparent',
  color: 'var(--vs-color-brand-primary)',
  fontFamily: 'var(--vs-font-family)',
  fontSize: 'var(--vs-font-size-body-sm)',
  cursor: 'pointer',
  boxSizing: 'border-box',
};

function pageRange(page: number, totalPages: number): (number | 'ellipsis')[] {
  const delta = 1;
  const range: (number | 'ellipsis')[] = [];
  const start = Math.max(2, page - delta);
  const end = Math.min(totalPages - 1, page + delta);

  range.push(1);
  if (start > 2) range.push('ellipsis');
  for (let i = start; i <= end; i++) range.push(i);
  if (end < totalPages - 1) range.push('ellipsis');
  if (totalPages > 1) range.push(totalPages);

  return range;
}

/**
 * Wraps the real .page-item/.page-link pattern (audited: no border,
 * transparent bg, brand-primary text, radius 5px !important, padding
 * 6px 15px — .375rem/.75rem Bootstrap defaults + the site's 15px
 * horizontal override; hover/active fill solid brand primary + white).
 */
export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="pagination" className={className}>
      <ul style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: 0, padding: 0, listStyle: 'none' }}>
        <li>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            style={{ ...ITEM_STYLE_BASE, minWidth: '36px', padding: 0, color: page <= 1 ? 'var(--vs-color-text-muted)' : 'var(--vs-color-brand-primary)', cursor: page <= 1 ? 'default' : 'pointer' }}
            className="vs-page-item"
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
        </li>
        {pageRange(page, totalPages).map((item, i) =>
          item === 'ellipsis' ? (
            <li key={`e${i}`} style={{ ...ITEM_STYLE_BASE, color: 'var(--vs-color-text-muted)', cursor: 'default' }}>
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === page ? 'page' : undefined}
                style={{
                  ...ITEM_STYLE_BASE,
                  background: item === page ? 'var(--vs-color-brand-primary)' : 'transparent',
                  color: item === page ? '#ffffff' : 'var(--vs-color-brand-primary)',
                }}
                className="vs-page-item"
              >
                {item}
              </button>
            </li>
          )
        )}
        <li>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
            style={{ ...ITEM_STYLE_BASE, minWidth: '36px', padding: 0, color: page >= totalPages ? 'var(--vs-color-text-muted)' : 'var(--vs-color-brand-primary)', cursor: page >= totalPages ? 'default' : 'pointer' }}
            className="vs-page-item"
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </li>
      </ul>
    </nav>
  );
}
