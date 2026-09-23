import React from 'react';

export interface FileInputProps {
  name: string;
  id?: string;
  accept?: string;
  multiple?: boolean;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  className?: string;
}

export function FileInput({
  name,
  id,
  accept,
  multiple = false,
  label,
  required = false,
  disabled = false,
  error,
  onChange,
  className,
}: FileInputProps) {
  const fieldId = id ?? name;
  const style: React.CSSProperties = {
    width: '100%',
    fontFamily: 'var(--vs-font-family)',
    fontSize: '14px',
    padding: '6px 12px',
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
        type="file"
        name={multiple ? `${name}[]` : name}
        id={fieldId}
        accept={accept}
        multiple={multiple}
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
