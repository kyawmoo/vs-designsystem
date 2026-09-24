import React from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Overlay + centered panel shell, formalized from the reports
 * dashboard's own ForgotPasswordModal (the only real modal already
 * live): backdrop-blurred dark overlay, white rounded panel with a
 * top-right close button. Content is passed as children — this
 * component owns only the shell, not any form/business logic.
 */
export function Modal({ open, onClose, title, children, size = 'sm', className }: ModalProps) {
  if (!open) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="vs-modal-overlay"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={className ? `vs-modal-panel ${className}` : 'vs-modal-panel'}
        style={{
          maxWidth: size === 'md' ? '32rem' : '28rem',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="vs-modal-close"
        >
          <X size={18} strokeWidth={2} />
        </button>

        {title && (
          <h2
            style={{
              margin: '0 1.75rem 1rem 0',
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--vs-color-text-heading)',
            }}
          >
            {title}
          </h2>
        )}

        {children}
      </div>
    </div>
  );
}
