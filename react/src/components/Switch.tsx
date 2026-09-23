import React from 'react';

export interface SwitchProps {
  name: string;
  id?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  children?: React.ReactNode;
  className?: string;
}

/** Toggle track — .vs-switch class in styles.css (appearance:none +
 * ::before thumb can't be done inline). Track 32x16px (Bootstrap's real
 * 2em x 1em at a 16px base), pill radius, checked = brand primary. */
export function Switch({
  name,
  id,
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  children,
  className,
}: SwitchProps) {
  const fieldId = id ?? name;
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="checkbox"
        role="switch"
        name={name}
        id={fieldId}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={onChange}
        className="vs-switch"
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
