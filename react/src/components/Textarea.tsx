import React from 'react';

export interface TextareaProps {
  name: string;
  id?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  className?: string;
}

/** Same visual spec as TextInput — the real site's CSS doesn't special-case <textarea>. */
export function Textarea({
  name,
  id,
  value,
  defaultValue,
  placeholder,
  label,
  rows = 4,
  required = false,
  disabled = false,
  error,
  onChange,
  className,
}: TextareaProps) {
  const fieldId = id ?? name;
  const style: React.CSSProperties = {
    width: '100%',
    fontFamily: 'var(--vs-font-family)',
    fontSize: '16px',
    padding: '12px 18px',
    borderRadius: 'var(--vs-radius-sm)',
    border: `1px solid ${error ? 'var(--vs-color-danger-border)' : 'var(--vs-color-border)'}`,
    background: disabled ? 'var(--vs-color-disabled-bg)' : 'var(--vs-color-surface)',
    color: 'var(--vs-color-text-body)',
    boxSizing: 'border-box',
    resize: 'vertical',
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
      <textarea
        name={name}
        id={fieldId}
        rows={rows}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        onChange={onChange}
        style={style}
        className="vs-field"
      />
      {error && (
        <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--vs-color-danger-border)' }}>{error}</p>
      )}
    </div>
  );
}
