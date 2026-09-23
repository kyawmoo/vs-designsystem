import React from 'react';

export type BadgeSemanticTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeProductTone = 'trending' | 'sale' | 'free' | 'premium';
export type BadgeItemStatusTone =
  | 'pending'
  | 'soft-rejected'
  | 'resubmitted'
  | 'approved'
  | 'hard-rejected'
  | 'deleted';

export type BadgeTone = BadgeSemanticTone | BadgeProductTone | BadgeItemStatusTone;

export interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  /** Leading solid dot instead of a tinted background fill. */
  dot?: boolean;
  className?: string;
}

const SEMANTIC_VARS: Record<BadgeSemanticTone, { bg: string; fg: string }> = {
  success: { bg: 'var(--vs-color-success-bg)', fg: 'var(--vs-color-success-border)' },
  warning: { bg: 'var(--vs-color-warning-bg)', fg: 'var(--vs-color-warning-border)' },
  danger: { bg: 'var(--vs-color-danger-bg)', fg: 'var(--vs-color-danger-border)' },
  info: { bg: 'var(--vs-color-info-bg)', fg: 'var(--vs-color-info-border)' },
  neutral: { bg: 'var(--vs-color-disabled-bg)', fg: 'var(--vs-color-text-muted)' },
};

const PRODUCT_VAR: Record<BadgeProductTone, string> = {
  trending: 'var(--vs-color-badge-trending)',
  sale: 'var(--vs-color-badge-sale)',
  free: 'var(--vs-color-badge-free)',
  premium: 'var(--vs-color-badge-premium)',
};

const ITEM_STATUS_VAR: Record<BadgeItemStatusTone, string> = {
  pending: 'var(--vs-color-item-status-pending)',
  'soft-rejected': 'var(--vs-color-item-status-soft-rejected)',
  resubmitted: 'var(--vs-color-item-status-resubmitted)',
  approved: 'var(--vs-color-item-status-approved)',
  'hard-rejected': 'var(--vs-color-item-status-hard-rejected)',
  deleted: 'var(--vs-color-item-status-deleted)',
};

function isSemanticTone(tone: BadgeTone): tone is BadgeSemanticTone {
  return tone in SEMANTIC_VARS;
}

function isProductTone(tone: BadgeTone): tone is BadgeProductTone {
  return tone in PRODUCT_VAR;
}

/**
 * VectorSticker Badge — semantic (success/warning/danger/info/neutral),
 * product (trending/sale/free/premium), and item-status (moderation state)
 * tones. Product and item-status tones use a solid color on a tinted
 * `color-mix` background since tokens.json stores only the solid hex;
 * semantic tones use the pre-defined bg/border token pairs directly.
 */
export function Badge({ tone = 'neutral', children, dot = false, className = '' }: BadgeProps) {
  let bg: string;
  let fg: string;

  if (isSemanticTone(tone)) {
    bg = SEMANTIC_VARS[tone].bg;
    fg = SEMANTIC_VARS[tone].fg;
  } else if (isProductTone(tone)) {
    fg = PRODUCT_VAR[tone];
    bg = `color-mix(in srgb, ${fg} 12%, transparent)`;
  } else {
    fg = ITEM_STATUS_VAR[tone];
    bg = `color-mix(in srgb, ${fg} 12%, transparent)`;
  }

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: dot ? '6px' : 0,
    padding: dot ? '4px 10px 4px 8px' : '4px 10px',
    borderRadius: 'var(--vs-radius-full)',
    fontFamily: 'var(--vs-font-family)',
    fontSize: 'var(--vs-font-size-body-sm)',
    fontWeight: 600,
    lineHeight: 1.4,
    color: fg,
    background: dot ? 'transparent' : bg,
    whiteSpace: 'nowrap',
  };

  return (
    <span className={className} style={style}>
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: 'var(--vs-radius-full)',
            background: fg,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}
