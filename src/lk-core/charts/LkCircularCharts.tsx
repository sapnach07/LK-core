import React, { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useLkCoreOptional } from '../themes/LkThemeProvider';
import { formatLkNumber } from '../i18n/translations';
import { LkChartFrame } from './LkChartFrame';
import { LkChartLegend } from './LkChartLegend';
import { LkChartTooltip } from './LkChartTooltip';
import { resolveLkChartPalette, validateCircularDataset } from './chartUtils';
import type { LkDonutChartProps, LkPieChartProps } from './types';

function CircularChartBase({
  data,
  nameKey = 'name',
  valueKey = 'value',
  height = 250,
  innerRadius = 0,
  outerRadius = '82%',
  centerLabel,
  centerValue,
  loading = false,
  error = null,
  emptyTitle,
  emptyDescription,
  emptyAction,
  colors,
  animate = true,
  showLegend = true,
  showTooltip = true,
  valueFormatter,
  ariaLabel,
  className = '',
}: LkDonutChartProps) {
  const core = useLkCoreOptional();
  const accent = core?.settings.accentColor ?? '#D6B56D';
  const motionLevel = core?.settings.motionLevel ?? 'full';
  const motionSpeed = core?.settings.motionSpeed ?? 1;
  const numberFormat = core?.settings.numberFormat ?? 'US';
  const isReduced = motionLevel === 'reduced' || !animate;
  const durationMs = isReduced
    ? 0
    : Math.round((motionLevel === 'subtle' ? 280 : 480) / motionSpeed);

  const palette = useMemo(() => resolveLkChartPalette(accent, colors), [accent, colors]);
  const validation = validateCircularDataset(data, valueKey, error);

  const safeData = useMemo(
    () =>
      Array.isArray(data)
        ? data.map((item, idx) => {
            const record = item as Record<string, unknown>;
            const rawColor = typeof record.color === 'string' ? record.color : undefined;
            return {
              ...record,
              _lkColor: rawColor ?? palette[idx % palette.length],
            };
          })
        : [],
    [data, palette],
  );

  const legendItems = safeData.map((item, idx) => {
    const label = String((item as Record<string, unknown>)[nameKey] ?? `Part ${idx + 1}`);
    const num = Number((item as Record<string, unknown>)[valueKey]);
    return {
      key: `${label}-${idx}`,
      label,
      color: item._lkColor,
      value: Number.isFinite(num)
        ? valueFormatter
          ? valueFormatter(num, label)
          : formatLkNumber(num, numberFormat)
        : undefined,
    };
  });

  return (
    <LkChartFrame
      height={height}
      loading={loading}
      validation={validation}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyAction={emptyAction}
      ariaLabel={ariaLabel}
      className={className}
    >
      <div className="lk-chart-viewport" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={safeData}
              dataKey={valueKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={innerRadius ? 3 : 1.5}
              stroke="var(--lk-surface-solid)"
              strokeWidth={2}
              isAnimationActive={false}
              animationDuration={durationMs}
            >
              {safeData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry._lkColor} />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={<LkChartTooltip valueFormatter={valueFormatter} />} />}
          </PieChart>
        </ResponsiveContainer>

        {(centerLabel || centerValue !== undefined) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            {centerValue !== undefined && (
              <span
                className="text-xl font-bold font-mono tabular-nums tracking-tight"
                style={{ color: 'var(--lk-text)' }}
              >
                {typeof centerValue === 'number'
                  ? formatLkNumber(centerValue, numberFormat)
                  : centerValue}
              </span>
            )}
            {centerLabel && (
              <span className="text-xs mt-0.5 truncate max-w-[110px]" style={{ color: 'var(--lk-text-muted)' }}>
                {centerLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {showLegend && legendItems.length > 0 && <LkChartLegend items={legendItems} align="center" />}
    </LkChartFrame>
  );
}

export function LkPieChart(props: LkPieChartProps) {
  return <CircularChartBase {...props} innerRadius={0} />;
}

export function LkDonutChart({ innerRadius = '62%', ...props }: LkDonutChartProps) {
  return <CircularChartBase {...props} innerRadius={innerRadius} />;
}
