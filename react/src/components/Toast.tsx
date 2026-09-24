import React from 'react';
import { Check, X as XIcon, AlertTriangle, Info } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  tone: ToastTone;
  title?: React.ReactNode;
  message: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const TONE_ICON: Record<ToastTone, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  success: Check,
  error: XIcon,
  warning: AlertTriangle,
  info: Info,
};

/**
 * Wraps the real vironeer-toastr notification already used on the
 * main site (app/Traits/LivewireToastr.php) — solid tone-colored fill,
 * white text, circular icon badge. This component is presentational
 * only; it does not manage a toast queue/stack — pair it with your
 * own state (or the existing toastr JS on Blade pages).
 */
export function Toast({ tone, title, message, onClose, className }: ToastProps) {
  const Icon = TONE_ICON[tone];
  return (
    <div className={className ? `vs-toast vs-toast--${tone} ${className}` : `vs-toast vs-toast--${tone}`} role="alert">
      <span className="vs-toast-icon">
        <Icon size={17} strokeWidth={2.5} />
      </span>
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        {title && <p className="vs-toast-title">{title}</p>}
        <p className="vs-toast-text">{message}</p>
      </div>
      {onClose && (
        <button type="button" className="vs-toast-close" onClick={onClose} aria-label="Dismiss">
          <XIcon size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
