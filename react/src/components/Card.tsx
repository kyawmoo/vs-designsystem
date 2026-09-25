import React from 'react';

export interface CardProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /**
   * Explicitly re-declared (not just inherited from
   * HTMLAttributes<HTMLDivElement>) so this component still type-checks
   * in a consumer project with no @types/react installed — see the same
   * fix on Button.tsx for why.
   */
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

/**
 * VectorSticker Card — generic content container for the reports
 * dashboard. Card spec v2: 1px #E5E7EB border, 3px radius, flat. Keeps
 * the bordered, white-surface convention
 * already used by SummaryCard/TableWidget (not the public site's
 * borderless .card-v — that sits on a white page background and relies
 * on padding alone; the dashboard's gray canvas needs a visible edge).
 */
export function Card({ children, className, style, onClick }: CardProps) {
  const baseStyle: React.CSSProperties = {
    background: 'var(--vs-color-surface)',
    border: '1px solid var(--vs-card-border)',
    borderRadius: 'var(--vs-card-radius)',
    boxShadow: 'var(--vs-shadow-none)',
    padding: '20px',
    fontFamily: 'var(--vs-font-family)',
    ...style,
  };

  return (
    <div className={className ? `vs-card ${className}` : 'vs-card'} style={baseStyle} onClick={onClick}>
      {children}
    </div>
  );
}
