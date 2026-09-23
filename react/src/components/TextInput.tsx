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
}

/** md/lg only — the real site's .form-control has no custom "sm" size. */
const PADDING: Record<TextInputSize, string> = {
  md: '12px 18px',
  lg: '14px 22px',
};

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
}: TextInputProps) {
  const fieldId = id ?? name;
  const inputStyle: React.CSSProperties = {
    width: '100%',
    fontFamily: 'var(--vs-font-family)',
    fontSize: size === 'md' ? '16px' : '14px',
    padding: PADDING[size],
    borderRadius: 'var(--vs-radius-sm)',
    border: `1px solid ${error ? 'var(--vs-color-danger-border)' : 'var(--vs-color-border)'}`,
    background: disabled ? 'var(--vs-color-disabled-bg)' : 'var(--vs-color-surface)',
    color: 'var(--vs-color-text-body)',
    boxSizing: 'border-box',
  };

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
        style={inputStyle}
        className="vs-field"
      />
      {error && (
        <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--vs-color-danger-border)' }}>{error}</p>
      )}
    </div>
  );
}
