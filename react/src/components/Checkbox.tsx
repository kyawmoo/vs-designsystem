import React from 'react';

export interface CheckboxProps {
  name: string;
  id?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  error?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Wraps a real <input type="checkbox"> — shape/appearance handled by the
 * .vs-check CSS class in styles.css (appearance:none can't be expressed
 * inline), audited from the real site's Bootstrap: 1em square,
 * border-radius .25em (~4px), checked = brand primary.
 */
export function Checkbox({
  name,
  id,
  checked,
  defaultChecked,
  disabled = false,
  error,
  onChange,
  children,
  className,
}: CheckboxProps) {
  const fieldId = id ?? name;
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="checkbox"
        name={name}
        id={fieldId}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={onChange}
        className="vs-check"
      />
      {children && (
        <label
          htmlFor={fieldId}
          style={{ fontFamily: 'var(--vs-font-family)', fontSize: 'var(--vs-font-size-body-sm)', color: 'var(--vs-color-text-body)', cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          {children}
        </label>
      )}
      {error && (
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--vs-color-danger-border)' }}>{error}</p>
      )}
    </div>
  );
}
