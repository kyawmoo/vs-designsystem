import React from 'react';

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Formalizes the `.vs-segment-control` / `.vs-segment-button` pattern
 * already live in production inside TableWidget.tsx (and duplicated
 * inline across several report views) as its own standalone,
 * reusable component — same classes, same visual output.
 */
export function Tabs({ tabs, activeId, onChange, size = 'md', className }: TabsProps) {
  return (
    <div className={className ? `vs-segment-control ${className}` : 'vs-segment-control'}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`vs-segment-button ${size === 'sm' ? 'vs-segment-button--sm' : ''} ${
            activeId === tab.id ? 'is-active' : ''
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
