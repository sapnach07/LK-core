import React from 'react';
import { formatLkNumber } from '../i18n/translations';
import { useLkCoreOptional } from '../themes/LkThemeProvider';
import { LkIcon } from '../icons/LkIcon';
import { computeProgressMetrics, extractErrorMessage, resolveLkChartPalette } from './chartUtils';
import type { LkProgressChartProps } from './types';

export function LkProgressChart({
  value,
  max = 100,
  label,
  sublabel,
  variant = 'bar',
  size = 'md',
  color,
  segments,
  showPercentage = true,
  valueFormatter,
  error = null,
  ariaLabel,
  className = '',
}: LkProgressChartProps) {
  const core = useLkCoreOptional();
  const accent = core?.settings.accentColor ?? '#D6B56D';
  const numberFormat = core?.settings.numberFormat ?? 'US';
  const palette = resolveLkChartPalette(accent);
  const activeColor = color ?? palette[0];

  const errMsg = extractErrorMessage(error);
  if (errMsg) {
    return (
      <div className={`lk-chart-error ${className}`} role="alert">
        <span style={{ color: 'var(--lk-danger-text)' }}>
          <LkIcon name="AlertCircle" size={18} />
        </span>
        <p className="text-xs font-medium" style={{ color: 'var(--lk-text)' }}>
          {errMsg}
        </p>
      </div>
    );
  }

  const { clampedValue, safeMax, percentage } = computeProgressMetrics(value, max);
  const formattedDisplay = valueFormatter
    ? valueFormatter(clampedValue, safeMax)
    : showPercentage
      ? `${formatLkNumber(percentage, numberFormat)}%`
      : `${formatLkNumber(clampedValue, numberFormat)} / ${formatLkNumber(safeMax, numberFormat)}`;

  if (variant === 'ring') {
    const dim = size === 'sm' ? 76 : size === 'lg' ? 124 : 96;
    const strokeWidth = size === 'sm' ? 7 : size === 'lg' ? 10 : 8;
    const radius = (dim - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div
        className={`inline-flex items-center gap-4 ${className}`}
        role="progressbar"
        aria-label={ariaLabel ?? label ?? 'Progression'}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={clampedValue}
      >
        <div className="relative shrink-0" style={{ width: dim, height: dim }}>
          <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} className="-rotate-90">
            <circle
              cx={dim / 2}
              cy={dim / 2}
              r={radius}
              fill="none"
              stroke="var(--lk-chart-track)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={dim / 2}
              cy={dim / 2}
              r={radius}
              fill="none"
              stroke={activeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: 'stroke-dashoffset var(--lk-motion-duration) var(--lk-motion-ease)',
              }}
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center font-mono tabular-nums font-bold text-xs"
            style={{ color: 'var(--lk-text)' }}
          >
            {formattedDisplay}
          </span>
        </div>
        {(label || sublabel) && (
          <div className="min-w-0">
            {label && (
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--lk-text)' }}>
                {label}
              </p>
            )}
            {sublabel && (
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--lk-text-secondary)' }}>
                {sublabel}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  const barHeight = size === 'sm' ? 6 : size === 'lg' ? 12 : 8;
  const hasSegments = Array.isArray(segments) && segments.length > 0;
  const totalSegmentValue = hasSegments
    ? segments.reduce((sum, seg) => sum + (Number.isFinite(seg.value) && seg.value > 0 ? seg.value : 0), 0)
    : 0;

  return (
    <div
      className={`flex flex-col gap-2 w-full ${className}`}
      role="progressbar"
      aria-label={ariaLabel ?? label ?? 'Progression'}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={clampedValue}
    >
      {(label || sublabel || showPercentage || valueFormatter) && (
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            {label && (
              <span className="text-sm font-medium block truncate" style={{ color: 'var(--lk-text)' }}>
                {label}
              </span>
            )}
            {sublabel && (
              <span className="text-xs block" style={{ color: 'var(--lk-text-muted)' }}>
                {sublabel}
              </span>
            )}
          </div>
          <span
            className="text-xs font-mono tabular-nums font-semibold shrink-0"
            style={{ color: 'var(--lk-accent-ink)' }}
          >
            {formattedDisplay}
          </span>
        </div>
      )}

      <div className="lk-progress-track flex" style={{ height: barHeight }}>
        {hasSegments && totalSegmentValue > 0 ? (
          segments.map((seg, idx) => {
            const segVal = Number.isFinite(seg.value) && seg.value > 0 ? seg.value : 0;
            const segWidth = (segVal / Math.max(safeMax, totalSegmentValue)) * 100;
            const segColor = seg.color ?? palette[idx % palette.length];
            return (
              <div
                key={seg.id}
                title={`${seg.label}: ${formatLkNumber(segVal, numberFormat)}`}
                className="h-full transition-[width]"
                style={{
                  width: `${segWidth}%`,
                  backgroundColor: segColor,
                  transitionDuration: 'var(--lk-motion-duration)',
                  transitionTimingFunction: 'var(--lk-motion-ease)',
                }}
              />
            );
          })
        ) : (
          <div
            className="lk-progress-fill"
            style={{
              width: `${percentage}%`,
              backgroundColor: activeColor,
            }}
          />
        )}
      </div>

      {hasSegments && (
        <div className="lk-chart-legend pt-0.5">
          {segments.map((seg, idx) => (
            <span key={seg.id} className="inline-flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: seg.color ?? palette[idx % palette.length] }}
                aria-hidden="true"
              />
              <span>{seg.label}</span>
              <span className="font-mono tabular-nums font-medium" style={{ color: 'var(--lk-text)' }}>
                {formatLkNumber(seg.value, numberFormat)}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
