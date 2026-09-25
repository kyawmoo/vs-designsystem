import React from 'react';

export type ButtonEmphasis = 'primary' | 'secondary' | 'tertiary';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  emphasis?: ButtonEmphasis;
  size?: ButtonSize;
  /** Icon-only buttons omit visible text and become a square. */
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
  className?: string;
}

const SIZE_HEIGHT: Record<ButtonSize, string> = {
  sm: 'var(--vs-button-height-sm)',
  md: 'var(--vs-button-height-md)',
  lg: 'var(--vs-button-height-lg)',
};

const SIZE_PAD_X: Record<ButtonSize, string> = {
  sm: 'var(--vs-button-pad-x-sm)',
  md: 'var(--vs-button-pad-x-md)',
  lg: 'var(--vs-button-pad-x-lg)',
};

const SIZE_FONT: Record<ButtonSize, string> = {
  sm: 'var(--vs-button-font-size-sm)',
  md: 'var(--vs-button-font-size-md)',
  lg: 'var(--vs-button-font-size-lg)',
};

const ICON_ONLY_SIZE: Record<ButtonSize, string> = {
  sm: 'var(--vs-button-icon-only-sm)',
  md: 'var(--vs-button-icon-only-md)',
  lg: 'var(--vs-button-icon-only-lg)',
};

/* Text / icon+text buttons. Hover and pressed shades live in styles.css
   (.vs-btn--primary:hover etc.) because :hover can't be inline. */
const EMPHASIS_STYLE: Record<ButtonEmphasis, React.CSSProperties> = {
  primary: {
    background: 'var(--vs-button-primary)',
    borderColor: 'var(--vs-button-primary)',
    color: '#ffffff',
    borderRadius: 'var(--vs-button-radius)',
  },
  secondary: {
    background: 'var(--vs-button-secondary)',
    borderColor: 'var(--vs-button-secondary)',
    color: '#ffffff',
    borderRadius: 'var(--vs-button-radius)',
  },
  tertiary: {
    background: 'var(--vs-color-surface)',
    borderColor: 'var(--vs-button-tertiary-border)',
    color: 'var(--vs-button-tertiary-text)',
    borderRadius: 'var(--vs-button-radius-soft)',
  },
};

/* Icon-only buttons: outlined squares (spec v2). */
const ICON_ONLY_STYLE: Record<ButtonEmphasis, React.CSSProperties> = {
  primary: {
    background: 'transparent',
    border: '2px solid var(--vs-button-primary)',
    color: 'var(--vs-button-primary)',
  },
  secondary: {
    background: 'transparent',
    border: '1px solid var(--vs-button-secondary)',
    color: 'var(--vs-button-secondary)',
  },
  tertiary: {
    background: 'var(--vs-color-surface)',
    border: '1px solid var(--vs-color-border)',
    color: '#71717a',
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
  className,
  ...rest
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    fontFamily: 'var(--vs-font-family)',
    fontWeight: 500, /* --vs-button-font-weight */
    border: '1px solid',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, /* --vs-button-disabled-opacity */
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: icon && children ? '8px' : 0,
    boxShadow: 'var(--vs-shadow-none)',
    lineHeight: 1,
    boxSizing: 'border-box',
    transition: 'background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease',
    ...(iconOnly
      ? {
          ...ICON_ONLY_STYLE[emphasis],
          borderRadius: 'var(--vs-button-radius-icon)',
          width: ICON_ONLY_SIZE[size],
          height: ICON_ONLY_SIZE[size],
          padding: 0,
        }
      : {
          ...EMPHASIS_STYLE[emphasis],
          height: SIZE_HEIGHT[size],
          padding: `0 ${SIZE_PAD_X[size]}`,
          fontSize: SIZE_FONT[size],
        }),
    ...style,
  };

  const classes = [
    'vs-btn',
    `vs-btn--${emphasis}`,
    iconOnly ? 'vs-btn--icon-only' : '',
    className ?? '',
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      disabled={disabled}
      style={baseStyle}
      className={classes}
      {...rest}
    >
      {icon}
      {!iconOnly && children}
    </button>
  );
}
