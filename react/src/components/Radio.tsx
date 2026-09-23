import React from 'react';

export interface RadioProps {
  name: string;
  id?: string;
  value: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  children?: React.ReactNode;
  className?: string;
}

/** Render several with the same `name` and different `value`s for a group. */
export function Radio({
  name,
  id,
  value,
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  children,
  className,
}: RadioProps) {
  const fieldId = id ?? `${name}-${value}`;
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="radio"
        name={name}
        id={fieldId}
        value={value}
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
    </div>
  );
}
