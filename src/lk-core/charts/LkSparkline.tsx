import React, { useId, useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useLkCoreOptional } from '../themes/LkThemeProvider';
import { LkChartTooltip } from './LkChartTooltip';
import { extractErrorMessage, normalizeSparklineData } from './chartUtils';
import type { LkSparklineProps } from './types';

export function LkSparkline({
  data,
  dataKey = 'value',
  color,
  height = 48,
  variant = 'area',
  showTooltip = true,
  animate = true,
  valueFormatter,
  emptyText = '—',
  error = null,
  ariaLabel = 'Tendance rapide',
  className = '',
}: LkSparklineProps) {
  const uid = useId().replace(/:/g, '');
  const core = useLkCoreOptional();
  const strokeColor = color ?? core?.settings.accentColor ?? '#D6B56D';
  const isReduced = core?.settings.motionLevel === 'reduced' || !animate;
  const durationMs = isReduced ? 0 : 320;

  const errMsg = extractErrorMessage(error);
  const points = useMemo(() => normalizeSparklineData(data, dataKey), [data, dataKey]);

  if (errMsg) {
    return (
      <div
        role="alert"
        className={`flex items-center text-xs px-2 rounded-lg border ${className}`}
        style={{
          height,
          borderColor: 'rgba(220, 38, 38, 0.35)',
          color: 'var(--lk-danger-text)',
        }}
      >
        {errMsg}
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div
        role="img"
        aria-label={ariaLabel}
        className={`flex items-center justify-center text-xs rounded-lg border border-dashed ${className}`}
        style={{
          height,
          borderColor: 'var(--lk-border)',
          color: 'var(--lk-text-muted)',
        }}
      >
        {emptyText}
      </div>
    );
  }

  const gradId = `lk-spark-${uid}`;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={`w-full min-w-0 ${className}`}
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        {variant === 'line' ? (
          <LineChart data={points} margin={{ top: 4, right: 2, left: 2, bottom: 4 }}>
            {showTooltip && (
              <Tooltip
                content={<LkChartTooltip valueFormatter={valueFormatter} labelFormatter={() => ''} />}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              animationDuration={durationMs}
            />
          </LineChart>
        ) : variant === 'bar' ? (
          <BarChart data={points} margin={{ top: 4, right: 2, left: 2, bottom: 2 }}>
            {showTooltip && (
              <Tooltip
                cursor={{ fill: 'var(--lk-accent-soft)', opacity: 0.45 }}
                content={<LkChartTooltip valueFormatter={valueFormatter} labelFormatter={() => ''} />}
              />
            )}
            <Bar
              dataKey="value"
              fill={strokeColor}
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
              animationDuration={durationMs}
            />
          </BarChart>
        ) : (
          <AreaChart data={points} margin={{ top: 4, right: 2, left: 2, bottom: 4 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.35} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            {showTooltip && (
              <Tooltip
                content={<LkChartTooltip valueFormatter={valueFormatter} labelFormatter={() => ''} />}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              isAnimationActive={false}
              animationDuration={durationMs}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
