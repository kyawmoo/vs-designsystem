import React from 'react';

export type SelectSize = 'md' | 'lg';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  name: string;
  id?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  size?: SelectSize;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  className?: string;
}

/** Real .form-select: same radius/border as text inputs, extra-wide
 * right padding for the caret (40px, audited). */
const PADDING: Record<SelectSize, string> = {
  md: '12px 40px 12px 18px',
  lg: '14px 40px 14px 22px',
};

export function Select({
  name,
  id,
  options,
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
}: SelectProps) {
  const fieldId = id ?? name;
  const style: React.CSSProperties = {
    width: '100%',
    fontFamily: 'var(--vs-font-family)',
    fontSize: size === 'md' ? '16px' : '14px',
    fontWeight: 500,
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
      <select
        name={name}
        id={fieldId}
        value={value}
        defaultValue={defaultValue}
        required={required}
        disabled={disabled}
        onChange={onChange}
        style={style}
        className="vs-field"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--vs-color-danger-border)' }}>{error}</p>
      )}
    </div>
  );
}
