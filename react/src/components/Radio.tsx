import React from 'react';

export type RadioVariant = 'row' | 'card';

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
  /**
   * `row` (default): the circle and a one-line label. `card`: the whole card is the label, with the circle, a bold title
   * (`children`) and a smaller `description`; the chosen card gets a dark border. Cards in a group sit in a grid you provide.
   */
  variant?: RadioVariant;
  /** Card variant only: the smaller line under the title. */
  description?: React.ReactNode;
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
  variant = 'row',
  description,
}: RadioProps) {
  const fieldId = id ?? `${name}-${value}`;
  if (variant === 'card') {
    return (
      <label htmlFor={fieldId} className={className ? `vs-radio-card ${className}` : 'vs-radio-card'}>
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
        <span className="vs-radio-card__title">{children}</span>
        {description ? <span className="vs-radio-card__hint">{description}</span> : null}
      </label>
    );
  }
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
