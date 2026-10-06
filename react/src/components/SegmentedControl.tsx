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
export function SegmentedControl({ tabs, activeId, onChange, size = 'md', className, buttonClassName }: SegmentedControlProps) {
  return (
    <div className={className ? `vs-segment-control ${className}` : 'vs-segment-control'}>
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
