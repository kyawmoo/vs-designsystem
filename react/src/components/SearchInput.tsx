import React from 'react';
import { Search } from 'lucide-react';

export interface SearchInputProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onSubmit?: () => void;
  className?: string;
}

/** Real .form-search: leading icon button, input padding-left 45px
 * (audited) to clear it. */
export function SearchInput({
  name = 'search',
  value,
  defaultValue,
  placeholder = 'Search...',
  onChange,
  onSubmit,
  className,
}: SearchInputProps) {
  return (
    <div className={className} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={onSubmit}
        aria-label="Search"
        style={{
          position: 'absolute',
          left: 0,
          width: '45px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 0,
          background: 'transparent',
          color: 'var(--vs-color-text-muted)',
          cursor: 'pointer',
        }}
      >
        <Search size={16} strokeWidth={2} />
      </button>
      <input
        type="text"
        name={name}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        onChange={onChange}
        className="vs-field"
        style={{
          width: '100%',
          fontFamily: 'var(--vs-font-family)',
          fontSize: '16px',
          padding: '12px 18px 12px 45px',
          borderRadius: 'var(--vs-radius-sm)',
          border: '1px solid var(--vs-color-border)',
          background: 'var(--vs-color-surface)',
          color: 'var(--vs-color-text-body)',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}
