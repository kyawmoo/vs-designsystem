import React from 'react';

/** `sm` is the compact size for filter rows (12px text). */
export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string;
  label: string;
  /** Options with the same group are shown under one heading (`<optgroup>`). Ungrouped options come first. */
  group?: string;
}

export interface SelectProps {
  /** Optional: a drop-down that only drives the page (a filter) needs no form field name. */
  name?: string;
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
  sm: '6px 30px 6px 10px',
  md: '12px 40px 12px 18px',
  lg: '14px 40px 14px 22px',
};

const FONT_SIZE: Record<SelectSize, string> = { sm: '12px', md: '16px', lg: '14px' };

/** Ungrouped options first, then one `<optgroup>` per group in the order the groups first appear. */
function renderOptions(options: SelectOption[]) {
  const ungrouped = options.filter((o) => !o.group);
  const groups = new Map<string, SelectOption[]>();
  for (const o of options) {
    if (!o.group) continue;
    const list = groups.get(o.group);
    if (list) list.push(o);
    else groups.set(o.group, [o]);
  }
  const option = (o: SelectOption) => (
    <option key={o.value} value={o.value}>
      {o.label}
    </option>
  );
  return (
    <>
      {ungrouped.map(option)}
      {[...groups].map(([group, list]) => (
        <optgroup key={group} label={group}>
          {list.map(option)}
        </optgroup>
      ))}
    </>
  );
}

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
    fontSize: FONT_SIZE[size],
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
        {renderOptions(options)}
      </select>
      {error && (
        <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--vs-color-danger-border)' }}>{error}</p>
      )}
    </div>
  );
}
