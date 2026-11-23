import React from 'react';

/** The change chip of the `metric` variant: the text already carries its sign ("+12.4%"); `direction` picks the colours and the hidden reading. */
export interface SummaryCardChange {
  text: string;
  direction: 'up' | 'down' | 'flat';
}

export interface SummaryCardProps {
  badge?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  unit?: string;
  description?: React.ReactNode;
  /** `dark` (added 23 Nov 2026): dark surface, lime value. Works in both variants. */
  tone?: 'default' | 'accent' | 'warning' | 'yellow' | 'dark';
  loading?: boolean;
  className?: string;
  /**
   * `classic` (default) is the original layout. `metric` (added 23 Nov 2026, opt-in) is the reports dashboard KPI card:
   * header row (icon, label, change chip), then the value with a small sparkline on the same row, 20px corners.
   */
  variant?: 'classic' | 'metric';
  /** `metric` only: the icon inside a 28px chip. */
  icon?: React.ReactNode;
  /** `metric` only: change chip (replaces `badge`). Colours meet WCAG AA; the direction is also read out, not only coloured. */
  change?: SummaryCardChange;
  /**
   * `metric` only: a small chart next to the value, e.g. `<LineChart variant="sparkline" height={24} … />`. This component does not
   * import the chart library. In the `dark` tone the first chart colour (`--vs-chart-series-1`) is the brand lime inside the card.
   */
  sparkline?: React.ReactNode;
}

const CHANGE_READING: Record<SummaryCardChange['direction'], string> = {
  up: 'Increase',
  down: 'Decrease',
  flat: 'No change',
};

export function SummaryCard({
  badge,
  label,
  value,
  unit,
  description,
  tone = 'default',
  loading = false,
  className = '',
  variant = 'classic',
  icon,
  change,
  sparkline,
}: SummaryCardProps) {
  const accent = tone === 'accent';
  const yellow = tone === 'yellow' || tone === 'warning';
  const dark = tone === 'dark';

  const toneCardClass = accent
    ? 'vs-summary-card--accent'
    : yellow
    ? 'vs-summary-card--yellow'
    : dark
    ? 'vs-summary-card--dark'
    : '';

  const toneBadgeClass = accent
    ? 'vs-summary-badge--accent'
    : yellow
    ? 'vs-summary-badge--yellow'
    : dark
    ? 'vs-summary-badge--dark'
    : '';

  const toneLabelClass = accent
    ? 'vs-summary-label--accent'
    : yellow
    ? 'vs-summary-label--yellow'
    : dark
    ? 'vs-summary-label--dark'
    : '';

  const toneUnitClass = accent
    ? 'vs-summary-figure-unit--accent'
    : yellow
    ? 'vs-summary-figure-unit--yellow'
    : dark
    ? 'vs-summary-figure-unit--dark'
    : '';

  const toneDescClass = accent
    ? 'vs-summary-desc--accent'
    : yellow
    ? 'vs-summary-desc--yellow'
    : dark
    ? 'vs-summary-desc--dark'
    : '';

  if (variant === 'metric') {
    return (
      <div className={`vs-summary-card vs-summary-card--metric ${toneCardClass} ${className}`}>
        <div className="vs-summary-head">
          {icon ? (
            <span className="vs-summary-icon" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <p className={`vs-summary-label ${toneLabelClass}`}>{label}</p>
          {change ? (
            <span className={`vs-summary-change vs-summary-change--${change.direction}`}>
              <span className="vs-summary-sr">{CHANGE_READING[change.direction]}: </span>
              {change.text}
            </span>
          ) : badge ? (
            <span className={`vs-summary-badge ${toneBadgeClass}`}>{badge}</span>
          ) : null}
        </div>
        <div className="vs-summary-metric-row">
          <div className="vs-summary-figure">
            <p className="vs-summary-figure-value">{loading ? '…' : value}</p>
            {unit && <span className={`vs-summary-figure-unit ${toneUnitClass}`}>{unit}</span>}
          </div>
          {sparkline ? <div className="vs-summary-spark">{sparkline}</div> : null}
        </div>
        {description && <div className={`vs-summary-desc ${toneDescClass}`}>{description}</div>}
      </div>
    );
  }

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
