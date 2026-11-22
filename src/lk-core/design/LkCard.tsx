import React from 'react';
import { LkGlassSurface } from '../glass/LkGlass';

export interface LkCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  surface?: 'glass' | 'solid';
  padding?: 'normal' | 'none';
}

export function LkCard({
  title,
  subtitle,
  action,
  surface = 'glass',
  padding = 'normal',
  className = '',
  children,
  ...rest
}: LkCardProps) {
  const headerBlock =
    title || subtitle || action ? (
      <div
        className={`flex items-start justify-between gap-4 ${padding === 'none' ? 'px-5 pt-5 pb-3' : 'mb-4'}`}
      >
        <div className="min-w-0">
          {title && (
            <h3
              className="text-base font-semibold tracking-tight leading-snug"
              style={{ color: 'var(--lk-text)' }}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm mt-0.5 leading-relaxed" style={{ color: 'var(--lk-text-secondary)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    ) : null;

  if (surface === 'solid') {
    return (
      <div
        className={`rounded-2xl border ${padding === 'normal' ? 'p-[var(--lk-density-pad)]' : ''} ${className}`}
        style={{
          backgroundColor: 'var(--lk-surface-solid)',
          borderColor: 'var(--lk-border)',
        }}
        {...rest}
      >
        {headerBlock}
        {children}
      </div>
    );
  }

  return (
    <LkGlassSurface
      rounded="2xl"
      className={`${padding === 'normal' ? 'p-[var(--lk-density-pad)]' : ''} ${className}`}
      {...rest}
    >
      {headerBlock}
      {children}
    </LkGlassSurface>
  );
}
