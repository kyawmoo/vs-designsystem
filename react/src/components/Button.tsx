import React from 'react';

export type ButtonEmphasis = 'primary' | 'secondary' | 'tertiary';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  emphasis?: ButtonEmphasis;
  size?: ButtonSize;
  /** Icon-only buttons omit visible text and become a square, not a pill. */
  iconOnly?: boolean;
  icon?: React.ReactNode;
  /**
   * Re-declared explicitly (not just inherited from
   * ButtonHTMLAttributes) so this component still type-checks in a
   * consumer project that has no @types/react installed — there,
   * `React.ButtonHTMLAttributes<...>` silently resolves to `any` and
   * contributes no named members to the interface.
   */
  disabled?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

const SIZE_PADDING: Record<ButtonSize, string> = {
  sm: '8px 18px',
  md: '12px 28px',
  lg: '14px 35px',
};

const ICON_ONLY_SIZE: Record<ButtonSize, string> = {
  sm: '32px',
  md: '38px',
  lg: '44px',
};

const EMPHASIS_STYLE: Record<ButtonEmphasis, React.CSSProperties> = {
  primary: {
    background: 'var(--vs-color-brand-primary)',
    borderColor: 'var(--vs-color-brand-primary)',
    color: '#ffffff',
  },
  secondary: {
    background: 'var(--vs-color-brand-secondary)',
    borderColor: 'var(--vs-color-brand-secondary)',
    color: '#ffffff',
  },
  tertiary: {
    background: 'var(--vs-color-surface)',
    borderColor: 'var(--vs-color-border)',
    color: 'var(--vs-color-text-body)',
  },
};

/**
 * VectorSticker Button — Primary / Secondary / Tertiary emphasis,
 * text-only, icon+text, or icon-only. All spacing/color/radius comes
 * from the shared tokens (tokens.css) so it stays in sync across sites.
 */
export function Button({
  emphasis = 'primary',
  size = 'md',
  iconOnly = false,
  icon,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    fontFamily: 'var(--vs-font-family)',
    fontWeight: 600,
    borderRadius: iconOnly ? 'var(--vs-radius-sm)' : 'var(--vs-radius-full)',
    border: '1px solid',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: icon && children ? '8px' : 0,
    boxShadow: 'var(--vs-shadow-none)',
    transition: 'opacity 150ms ease',
    ...EMPHASIS_STYLE[emphasis],
    ...(iconOnly
      ? { width: ICON_ONLY_SIZE[size], height: ICON_ONLY_SIZE[size], padding: 0 }
      : { padding: SIZE_PADDING[size], fontSize: size === 'sm' ? '13px' : '14px' }),
    ...style,
  };

  return (
    <button type="button" disabled={disabled} style={baseStyle} {...rest}>
      {icon}
      {!iconOnly && children}
    </button>
  );
}
