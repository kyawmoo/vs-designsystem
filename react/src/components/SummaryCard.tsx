import React from 'react';

export interface SummaryCardProps {
  badge?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  unit?: string;
  description?: React.ReactNode;
  tone?: 'default' | 'accent' | 'warning' | 'yellow';
  loading?: boolean;
  className?: string;
}

export function SummaryCard({
  badge,
  label,
  value,
  unit,
  description,
  tone = 'default',
  loading = false,
  className = '',
}: SummaryCardProps) {
  const accent = tone === 'accent';
  const yellow = tone === 'yellow' || tone === 'warning';

  const toneCardClass = accent
    ? 'vs-summary-card--accent'
    : yellow
    ? 'vs-summary-card--yellow'
    : '';

  const toneBadgeClass = accent
    ? 'vs-summary-badge--accent'
    : yellow
    ? 'vs-summary-badge--yellow'
    : '';

  const toneLabelClass = accent
    ? 'vs-summary-label--accent'
    : yellow
    ? 'vs-summary-label--yellow'
    : '';

  const toneUnitClass = accent
    ? 'vs-summary-figure-unit--accent'
    : yellow
    ? 'vs-summary-figure-unit--yellow'
    : '';

  const toneDescClass = accent
    ? 'vs-summary-desc--accent'
    : yellow
    ? 'vs-summary-desc--yellow'
    : '';

  return (
    <div className={`vs-summary-card ${toneCardClass} ${className}`}>
      <div className="flex justify-between items-start min-h-[22px]">
        {badge ? (
          <span className={`vs-summary-badge ${toneBadgeClass}`}>
            {badge}
          </span>
        ) : <span />}
      </div>
      <div className="vs-summary-body">
        <p className={`vs-summary-label ${toneLabelClass}`}>{label}</p>
        <div className="vs-summary-figure">
          <p className="vs-summary-figure-value">{loading ? '…' : value}</p>
          {unit && (
            <span className={`vs-summary-figure-unit ${toneUnitClass}`}>
              {unit}
            </span>
          )}
        </div>
        {description && (
          <div className={`vs-summary-desc ${toneDescClass}`}>
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
