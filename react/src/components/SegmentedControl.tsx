import React from 'react';

export interface SegmentedControlItem {
  id: string;
  label: React.ReactNode;
}

export interface SegmentedControlProps {
  tabs: SegmentedControlItem[];
  activeId: string;
  onChange: (id: string) => void;
  size?: 'sm' | 'md';
  /** `dark` = pill track with a dark selected option (opt-in, Task 2, 23 Nov 2026). Default keeps the existing green look. */
  variant?: 'default' | 'dark';
  className?: string;
  buttonClassName?: string;
}

/**
 * Segmented control: a compact group of buttons that selects one option or filter
 * (`.vs-segment-control` / `.vs-segment-button`, live in the reports dashboard).
 * It does not switch content panels — that is what tabs are for (issue #27).
 *
 * Until 2026-10-06 this component was exported as `Tabs`; that name still works as a deprecated
 * alias (components/Tabs.tsx) and will be reused for real underline tabs. Same classes, same
 * visual output as before the rename.
 */
export function SegmentedControl({ tabs, activeId, onChange, size = 'md', variant = 'default', className, buttonClassName }: SegmentedControlProps) {
  const rootClass = ['vs-segment-control', variant === 'dark' ? 'vs-segment-control--dark' : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <div className={rootClass}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`vs-segment-button ${size === 'sm' ? 'vs-segment-button--sm' : ''} ${
            activeId === tab.id ? 'is-active' : ''
          } ${buttonClassName ?? ''}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
