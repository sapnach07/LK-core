import React, { useEffect } from 'react';
import { LkGlassSurface } from '../glass/LkGlass';
import { LkIcon } from '../icons/LkIcon';
import { LK_FOCUS_RING_CLASS } from '../accessibility/LkAccessibility';

export interface LkDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
  closeLabel?: string;
}

export function LkDialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidthClass = 'max-w-lg',
  closeLabel = 'Fermer la fenêtre',
}: LkDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lk-dialog-title"
        className={`w-full ${maxWidthClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <LkGlassSurface intensity="elevated" rounded="2xl" className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2
                id="lk-dialog-title"
                className="text-lg font-semibold tracking-tight"
                style={{ color: 'var(--lk-text)' }}
              >
                {title}
              </h2>
              {description && (
                <p className="text-sm mt-1" style={{ color: 'var(--lk-text-secondary)' }}>
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className={`p-2 rounded-xl cursor-pointer transition-colors hover:bg-white/10 ${LK_FOCUS_RING_CLASS}`}
              style={{ color: 'var(--lk-text-muted)' }}
            >
              <LkIcon name="X" size={18} />
            </button>
          </div>
          <div className="text-sm" style={{ color: 'var(--lk-text-secondary)' }}>
            {children}
          </div>
          {footer && (
            <div
              className="mt-6 pt-4 border-t flex items-center justify-end gap-3"
              style={{ borderColor: 'var(--lk-border)' }}
            >
              {footer}
            </div>
          )}
        </LkGlassSurface>
      </div>
    </div>
  );
}
