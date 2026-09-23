import React from 'react';

export interface InputGroupProps {
  name?: string;
  value?: string;
  placeholder?: string;
  readOnly?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onButtonClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

/** Real .input-group.custom: input with a button docked inside its right
 * edge (audited padding-inline-end: 140px to clear the button). */
export function InputGroup({
  name,
  value,
  placeholder,
  readOnly = false,
  onChange,
  onButtonClick,
  children,
  className,
}: InputGroupProps) {
  return (
    <div className={className} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input
        type="text"
        name={name}
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={onChange}
        className="vs-field"
        style={{
          width: '100%',
          fontFamily: 'var(--vs-font-family)',
          fontSize: '16px',
          padding: '12px 140px 12px 16px',
          borderRadius: 'var(--vs-radius-sm)',
          border: '1px solid var(--vs-color-border)',
          background: 'var(--vs-color-surface)',
          color: 'var(--vs-color-text-body)',
          boxSizing: 'border-box',
        }}
      />
      <button
        type="button"
        onClick={onButtonClick}
        style={{
          position: 'absolute',
          right: '6px',
          padding: '8px 16px',
          fontFamily: 'var(--vs-font-family)',
          fontSize: '13px',
          fontWeight: 600,
          borderRadius: 'var(--vs-radius-sm)',
          border: '1px solid var(--vs-color-brand-primary)',
          background: 'var(--vs-color-brand-primary)',
          color: '#ffffff',
          cursor: 'pointer',
        }}
      >
        {children}
      </button>
    </div>
  );
}
