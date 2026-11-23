import React from 'react';
import { LkIcon } from '../icons/LkIcon';
import { useLkCoreOptional } from '../themes/LkThemeProvider';
import type { LkChartValidationResult } from './chartUtils';

interface LkChartFrameProps {
  height: number;
  loading?: boolean;
  validation: LkChartValidationResult;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  ariaLabel?: string;
  className?: string;
  children: React.ReactNode;
}

export function LkChartFrame({
  height,
  loading = false,
  validation,
  emptyTitle,
  emptyDescription,
  emptyAction,
  ariaLabel,
  className = '',
  children,
}: LkChartFrameProps) {
  const core = useLkCoreOptional();
  const isFrench = (core?.settings.language ?? 'fr') === 'fr';

  const resolvedEmptyTitle =
    emptyTitle ?? (isFrench ? 'Aucune donnée disponible' : 'No data available');
  const resolvedEmptyDesc =
    emptyDescription ??
    (isFrench
      ? 'Les séries apparaîtront ici dès que des mesures seront fournies.'
      : 'Series will render here once measurements are supplied.');
  const errorHeading = isFrench ? 'Impossible d’afficher le graphique' : 'Unable to render chart';

  if (loading) {
    return (
      <div
        className={`lk-chart-frame ${className}`}
        role="status"
        aria-busy="true"
        aria-label={ariaLabel ?? (isFrench ? 'Chargement du graphique' : 'Loading chart')}
      >
        <div
          className="w-full rounded-xl animate-pulse border"
          style={{
            height,
            backgroundColor: 'var(--lk-surface-muted)',
            borderColor: 'var(--lk-border)',
          }}
        />
      </div>
    );
  }

  if (validation.status === 'error') {
    return (
      <div className={`lk-chart-frame ${className}`}>
        <div
          className="lk-chart-error"
          role="alert"
          style={{ minHeight: Math.max(140, height) }}
        >
          <span style={{ color: 'var(--lk-danger-text)' }}>
            <LkIcon name="AlertCircle" size={22} />
          </span>
          <p className="text-sm font-semibold" style={{ color: 'var(--lk-text)' }}>
            {errorHeading}
          </p>
          <p className="text-xs max-w-md" style={{ color: 'var(--lk-text-secondary)' }}>
            {validation.errorMessage}
          </p>
        </div>
      </div>
    );
  }

  if (validation.status === 'empty') {
    return (
      <div className={`lk-chart-frame ${className}`}>
        <div
          className="lk-chart-empty"
          role="region"
          aria-label={ariaLabel ?? resolvedEmptyTitle}
          style={{ minHeight: Math.max(140, height) }}
        >
          <span style={{ color: 'var(--lk-text-muted)' }}>
            <LkIcon name="Inbox" size={22} />
          </span>
          <p className="text-sm font-semibold" style={{ color: 'var(--lk-text)' }}>
            {resolvedEmptyTitle}
          </p>
          <p className="text-xs max-w-md" style={{ color: 'var(--lk-text-muted)' }}>
            {resolvedEmptyDesc}
          </p>
          {emptyAction && <div className="mt-1">{emptyAction}</div>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`lk-chart-frame ${className}`}
      role="region"
      aria-label={ariaLabel ?? (isFrench ? 'Graphique de données LK' : 'LK data chart')}
    >
      {children}
    </div>
  );
}
