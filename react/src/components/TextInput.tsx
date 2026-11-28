import React from 'react';

export type TextInputSize = 'md' | 'lg';

export interface TextInputProps {
  name: string;
  id?: string;
  type?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  size?: TextInputSize;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  className?: string;
  /** Passed to the input, e.g. `username`, `current-password`, `email`, so browsers and password managers can fill it. */
  autoComplete?: string;
  /** Passed to the input: the on-screen keyboard to show on phones. */
  inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
  /** A decorative icon drawn inside the field at the left (hidden from screen readers); the text starts after it. */
  icon?: React.ReactNode;
}

/** md/lg only — the real site's .form-control has no custom "sm" size. */
const PADDING: Record<TextInputSize, string> = {
  md: '12px 18px',
  lg: '14px 22px',
};

/** With an icon the text starts after it: the icon's left offset + about 18px icon + a gap. */
const ICON_LEFT: Record<TextInputSize, number> = { md: 14, lg: 18 };
const ICON_PADDING_LEFT: Record<TextInputSize, string> = { md: '42px', lg: '48px' };

/**
 * VectorSticker Text Input — wraps a native <input>, styled to match the
 * real site's .form-control (audited: border-radius 8px, border
 * var(--border_color), 1px). Covers any single-line type (text, email,
 * password, …) since they're visually identical in the real CSS.
 */
export function TextInput({
  name,
  id,
  type = 'text',
  value,
  defaultValue,
  placeholder,
  label,
  size = 'md',
  required = false,
  disabled = false,
  error,
  onChange,
  className,
  autoComplete,
  inputMode,
  icon,
}: TextInputProps) {
  const fieldId = id ?? name;
  const inputStyle: React.CSSProperties = {
    width: '100%',
    fontFamily: 'var(--vs-font-family)',
    fontSize: size === 'md' ? '16px' : '14px',
    padding: PADDING[size],
    ...(icon ? { paddingLeft: ICON_PADDING_LEFT[size] } : {}),
    borderRadius: 'var(--vs-radius-sm)',
    border: `1px solid ${error ? 'var(--vs-color-danger-border)' : 'var(--vs-color-border)'}`,
    background: disabled ? 'var(--vs-color-disabled-bg)' : 'var(--vs-color-surface)',
    color: 'var(--vs-color-text-body)',
    boxSizing: 'border-box',
  };

  const field = (
    <input
      type={type}
      name={name}
      id={fieldId}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      onChange={onChange}
      autoComplete={autoComplete}
      inputMode={inputMode}
      style={inputStyle}
      className="vs-field"
    />
  );

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={fieldId}
          style={{
            display: 'block',
            fontSize: 'var(--vs-font-size-body-sm)',
            fontWeight: 600,
            color: 'var(--vs-color-text-heading)',
            marginBottom: '6px',
          }}
        >
          {label}
        </label>
      )}
      {icon ? (
        <div style={{ position: 'relative' }}>
          <span
            aria-hidden="true"
            className="vs-field-icon"
            style={{
              position: 'absolute',
              left: ICON_LEFT[size],
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'inline-flex',
              color: 'var(--vs-color-text-muted)',
              pointerEvents: 'none',
            }}
          >
            {icon}
          </span>
          {field}
        </div>
      ) : (
        field
      )}
      {error && (
        <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--vs-color-danger-border)' }}>{error}</p>
      )}
    </div>
  );
}
