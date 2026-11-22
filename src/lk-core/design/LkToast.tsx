import React from 'react';
import { useLkCore } from '../themes/LkThemeProvider';
import { LkGlassSurface } from '../glass/LkGlass';
import { LkIcon, type LkIconName } from '../icons/LkIcon';
import { useLkMotionConfig } from '../motion/LkMotion';
import { LK_FOCUS_RING_CLASS } from '../accessibility/LkAccessibility';

const VARIANT_META: Record<
  'info' | 'success' | 'warning' | 'error',
  { icon: LkIconName; color: string; label: string }
> = {
  info: { icon: 'Info', color: '#4C8DFF', label: 'Info' },
  success: { icon: 'CheckCircle2', color: '#16A34A', label: 'Success' },
  warning: { icon: 'AlertTriangle', color: '#D97706', label: 'Warning' },
  error: { icon: 'AlertCircle', color: '#DC2626', label: 'Error' },
};

export function LkToastRegion() {
  const { toasts, dismissToast, settings } = useLkCore();
  const { isReduced, durationMs } = useLkMotionConfig();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 w-full max-w-sm pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const meta = VARIANT_META[toast.variant];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto ${isReduced ? '' : 'lk-animate-reveal'}`}
            style={{ animationDuration: `${durationMs}ms` }}
          >
            <LkGlassSurface intensity="elevated" rounded="xl" className="p-3.5">
              <div className="flex items-start gap-3">
                {settings.visualCuesEnabled && (
                  <span className="mt-0.5 shrink-0" style={{ color: meta.color }}>
                    <LkIcon name={meta.icon} size={18} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className="text-sm font-semibold leading-tight"
                      style={{ color: 'var(--lk-text)' }}
                    >
                      {toast.title}
                    </p>
                    <span className="text-[11px] font-medium" style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                  </div>
                  {toast.description && (
                    <p
                      className="text-xs mt-1 leading-relaxed"
                      style={{ color: 'var(--lk-text-secondary)' }}
                    >
                      {toast.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  aria-label={`Dismiss ${toast.title}`}
                  className={`p-1 rounded-lg cursor-pointer shrink-0 ${LK_FOCUS_RING_CLASS}`}
                  style={{ color: 'var(--lk-text-muted)' }}
                >
                  <LkIcon name="X" size={14} />
                </button>
              </div>
            </LkGlassSurface>
          </div>
        );
      })}
    </div>
  );
}
