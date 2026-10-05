import React from 'react';
import { CircleCheck, TriangleAlert, OctagonAlert, Info, X as XIcon } from 'lucide-react';

export type AlertTone = 'success' | 'warning' | 'danger' | 'info';

export interface AlertProps {
  /** Default `info`. */
  tone?: AlertTone;
  /** Optional bold first line. */
  title?: React.ReactNode;
  children?: React.ReactNode;
  /** Replaces the tone icon; `false` hides it. Decorative (hidden from screen readers). */
  icon?: React.ReactNode | false;
  /** Shows a dismiss button when set. */
  onDismiss?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const TONE_ICON: Record<AlertTone, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  success: CircleCheck,
  warning: TriangleAlert,
  danger: OctagonAlert,
  info: Info,
};

/**
 * VectorSticker Alert — an inline message box. Fill and border come from the status tokens
 * (--vs-color-{tone}-bg / -border); the TEXT and ICON use the heading/body text colours, never the
 * border colour (the yellow border is 1.4:1 on its own fill). warning and danger are announced at once
 * (role="alert"); success and info politely (role="status").
 */
export function Alert({ tone = 'info', title, children, icon, onDismiss, className, style }: AlertProps) {
  const Icon = TONE_ICON[tone];
  const urgent = tone === 'warning' || tone === 'danger';
  return (
    <div
      role={urgent ? 'alert' : 'status'}
      className={className ? `vs-alert vs-alert--${tone} ${className}` : `vs-alert vs-alert--${tone}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 16px',
        boxSizing: 'border-box',
        background: `var(--vs-color-${tone}-bg)`,
        border: `1px solid var(--vs-color-${tone}-border)`,
        borderInlineStartWidth: '4px',
        borderRadius: 'var(--vs-radius-sm)',
        fontFamily: 'var(--vs-font-family)',
        color: 'var(--vs-color-text-body)',
        ...style,
      }}
    >
      {icon === false ? null : (
        <span aria-hidden="true" style={{ display: 'inline-flex', flexShrink: 0, marginTop: '2px', color: 'var(--vs-color-text-heading)' }}>
          {icon ?? <Icon size={20} strokeWidth={2} />}
        </span>
      )}
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        {title ? <p style={{ margin: '0 0 4px', font: 'var(--vs-type-body-02)', color: 'var(--vs-color-text-heading)' }}>{title}</p> : null}
        {children ? (
          <div style={{ font: 'var(--vs-type-body-01)', letterSpacing: 'var(--vs-letter-spacing-body)', overflowWrap: 'anywhere' }}>{children}</div>
        ) : null}
      </div>
      {onDismiss ? (
        <button type="button" className="vs-alert-dismiss" onClick={onDismiss} aria-label="Dismiss">
          <XIcon size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
