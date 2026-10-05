import React from 'react';
import { Inbox } from 'lucide-react';

export type EmptyStateSize = 'sm' | 'md' | 'lg';

export interface EmptyStateProps {
  /** Short message, e.g. "No downloads yet". */
  title: string;
  /** Optional second line that says why it is empty or what to do next. */
  description?: React.ReactNode;
  /** Replaces the default icon. Treated as decorative (hidden from screen readers). */
  icon?: React.ReactNode;
  /** Optional call to action, e.g. a <Button>. */
  action?: React.ReactNode;
  /** Vertical padding: sm 24px, md 48px (default), lg 8rem (the site's .dashboard-card-empty.pd). */
  size?: EmptyStateSize;
  className?: string;
  style?: React.CSSProperties;
}

const PADDING: Record<EmptyStateSize, string> = {
  sm: 'var(--vs-empty-state-padding-sm)',
  md: 'var(--vs-empty-state-padding-md)',
  lg: 'var(--vs-empty-state-padding-lg)',
};

/**
 * VectorSticker Empty State — "nothing to show here". Text colours are the heading/body tokens
 * (not the muted token, which is only about 2.8:1 on white); only the decorative icon is muted.
 * The block is a polite live region (role="status") so a list that becomes empty is announced.
 */
export function EmptyState({ title, description, icon, action, size = 'md', className, style }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={className ? `vs-empty-state ${className}` : 'vs-empty-state'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '12px',
        padding: `${PADDING[size]} var(--vs-spacing-md)`,
        fontFamily: 'var(--vs-font-family)',
        ...style,
      }}
    >
      <span aria-hidden="true" style={{ display: 'inline-flex', color: 'var(--vs-color-text-muted)' }}>
        {icon ?? <Inbox size={48} strokeWidth={1.5} style={{ width: 'var(--vs-empty-state-icon-size)', height: 'var(--vs-empty-state-icon-size)' }} />}
      </span>
      <p style={{ margin: 0, font: 'var(--vs-type-body-02)', color: 'var(--vs-color-text-heading)' }}>{title}</p>
      {description ? (
        <p style={{ margin: 0, font: 'var(--vs-type-body-01)', color: 'var(--vs-color-text-body)', maxWidth: '36em' }}>
          {description}
        </p>
      ) : null}
      {action ? <div style={{ marginTop: '4px' }}>{action}</div> : null}
    </div>
  );
}
