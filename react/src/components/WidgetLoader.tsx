import React from 'react';

export function WidgetLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`vs-widget-loader ${className}`} role="status" aria-live="polite">
      <svg className="vs-widget-loader-svg" viewBox="0 0 48 48" aria-hidden="true">
        <defs>
          <linearGradient id="vsWidgetLoaderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--vs-color-brand-accent)" />
            <stop offset="100%" stopColor="var(--vs-color-brand-primary)" />
          </linearGradient>
        </defs>
        <circle
          className="vs-widget-loader-track"
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke="var(--vs-color-border)"
          strokeWidth="4"
        />
        <circle
          className="vs-widget-loader-ring"
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke="url(#vsWidgetLoaderGradient)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xs font-medium text-gray-400">Loading...</span>
    </div>
  );
}
