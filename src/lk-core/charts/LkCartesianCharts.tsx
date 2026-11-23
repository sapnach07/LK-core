import React, { useId, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLkCoreOptional } from '../themes/LkThemeProvider';
import { formatLkNumber } from '../i18n/translations';
import { LkChartFrame } from './LkChartFrame';
import { LkChartLegend } from './LkChartLegend';
import { LkChartTooltip } from './LkChartTooltip';
import { resolveLkChartPalette, validateChartDataset } from './chartUtils';
import type { LkAreaChartProps, LkBarChartProps, LkLineChartProps } from './types';

function useLkChartRuntime(colors?: string[], animate = true) {
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

  return {
    palette,
    isReduced,
    durationMs,
    numberFormat,
  };
}

export function LkLineChart({
  data,
  xKey,
  series,
  height = 260,
  loading = false,
  error = null,
  emptyTitle,
  emptyDescription,
  emptyAction,
  colors,
  animate = true,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  curved = true,
  showDots = false,
  valueFormatter,
  xAxisFormatter,
  ariaLabel,
  className = '',
}: LkLineChartProps) {
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);
  const { palette, isReduced, durationMs, numberFormat } = useLkChartRuntime(colors, animate);
  const validation = validateChartDataset(data, error);

  const legendItems = series.map((s, idx) => ({
    key: s.key,
    label: s.label,
    color: s.color ?? palette[idx % palette.length],
    hidden: hiddenKeys.includes(s.key),
  }));

  const toggleSeries = (key: string) => {
    setHiddenKeys((prev) =>
      prev.includes(key)
        ? prev.filter((item) => item !== key)
        : prev.length + 1 < series.length
          ? [...prev, key]
          : prev,
    );
  };

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
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            {showGrid && (
              <CartesianGrid stroke="var(--lk-chart-grid)" strokeDasharray="3 3" vertical={false} />
            )}
            <XAxis
              dataKey={xKey}
              tickFormatter={xAxisFormatter}
              tick={{ fill: 'var(--lk-chart-axis)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--lk-border)' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) =>
                valueFormatter ? valueFormatter(Number(v)) : formatLkNumber(Number(v), numberFormat)
              }
              tick={{ fill: 'var(--lk-chart-axis)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            {showTooltip && (
              <Tooltip
                cursor={{ stroke: 'var(--lk-border-strong)', strokeWidth: 1 }}
                content={<LkChartTooltip valueFormatter={valueFormatter} />}
              />
            )}
            {series.map((s, idx) => {
              const strokeColor = s.color ?? palette[idx % palette.length];
              const isHidden = hiddenKeys.includes(s.key);
              return (
                <Line
                  key={s.key}
                  type={curved ? 'monotone' : 'linear'}
                  dataKey={s.key}
                  name={s.label}
                  hide={isHidden}
                  stroke={strokeColor}
                  strokeWidth={s.strokeWidth ?? 2.25}
                  strokeDasharray={s.dashed ? '5 4' : undefined}
                  dot={showDots ? { r: 3, fill: strokeColor, strokeWidth: 0 } : false}
                  activeDot={{ r: 5, fill: strokeColor, stroke: 'var(--lk-surface-solid)', strokeWidth: 2 }}
                  isAnimationActive={false}
                  animationDuration={durationMs}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {showLegend && series.length > 0 && (
        <LkChartLegend items={legendItems} hiddenKeys={hiddenKeys} onToggleSeries={toggleSeries} />
      )}
    </LkChartFrame>
  );
}

export function LkBarChart({
  data,
  xKey,
  series,
  height = 260,
  loading = false,
  error = null,
  emptyTitle,
  emptyDescription,
  emptyAction,
  colors,
  animate = true,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  stacked = false,
  barRadius = 6,
  valueFormatter,
  xAxisFormatter,
  ariaLabel,
  className = '',
}: LkBarChartProps) {
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);
  const { palette, isReduced, durationMs, numberFormat } = useLkChartRuntime(colors, animate);
  const validation = validateChartDataset(data, error);

  const legendItems = series.map((s, idx) => ({
    key: s.key,
    label: s.label,
    color: s.color ?? palette[idx % palette.length],
    hidden: hiddenKeys.includes(s.key),
  }));

  const toggleSeries = (key: string) => {
    setHiddenKeys((prev) =>
      prev.includes(key)
        ? prev.filter((item) => item !== key)
        : prev.length + 1 < series.length
          ? [...prev, key]
          : prev,
    );
  };

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
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            {showGrid && (
              <CartesianGrid stroke="var(--lk-chart-grid)" strokeDasharray="3 3" vertical={false} />
            )}
            <XAxis
              dataKey={xKey}
              tickFormatter={xAxisFormatter}
              tick={{ fill: 'var(--lk-chart-axis)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--lk-border)' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) =>
                valueFormatter ? valueFormatter(Number(v)) : formatLkNumber(Number(v), numberFormat)
              }
              tick={{ fill: 'var(--lk-chart-axis)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            {showTooltip && (
              <Tooltip
                cursor={{ fill: 'var(--lk-accent-soft)', opacity: 0.45 }}
                content={<LkChartTooltip valueFormatter={valueFormatter} />}
              />
            )}
            {series.map((s, idx) => {
              const fillColor = s.color ?? palette[idx % palette.length];
              const isHidden = hiddenKeys.includes(s.key);
              return (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  hide={isHidden}
                  fill={fillColor}
                  stackId={stacked ? 'lk-stack' : undefined}
                  radius={stacked ? [0, 0, 0, 0] : [barRadius, barRadius, 2, 2]}
                  maxBarSize={44}
                  isAnimationActive={false}
                  animationDuration={durationMs}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {showLegend && series.length > 0 && (
        <LkChartLegend items={legendItems} hiddenKeys={hiddenKeys} onToggleSeries={toggleSeries} />
      )}
    </LkChartFrame>
  );
}

export function LkAreaChart({
  data,
  xKey,
  series,
  height = 260,
  loading = false,
  error = null,
  emptyTitle,
  emptyDescription,
  emptyAction,
  colors,
  animate = true,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  stacked = false,
  curved = true,
  valueFormatter,
  xAxisFormatter,
  ariaLabel,
  className = '',
}: LkAreaChartProps) {
  const uid = useId().replace(/:/g, '');
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);
  const { palette, isReduced, durationMs, numberFormat } = useLkChartRuntime(colors, animate);
  const validation = validateChartDataset(data, error);

  const legendItems = series.map((s, idx) => ({
    key: s.key,
    label: s.label,
    color: s.color ?? palette[idx % palette.length],
    hidden: hiddenKeys.includes(s.key),
  }));

  const toggleSeries = (key: string) => {
    setHiddenKeys((prev) =>
      prev.includes(key)
        ? prev.filter((item) => item !== key)
        : prev.length + 1 < series.length
          ? [...prev, key]
          : prev,
    );
  };

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
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <defs>
              {series.map((s, idx) => {
                const color = s.color ?? palette[idx % palette.length];
                const gradId = `lk-area-${uid}-${idx}`;
                return (
                  <linearGradient key={gradId} id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.34} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                );
              })}
            </defs>
            {showGrid && (
              <CartesianGrid stroke="var(--lk-chart-grid)" strokeDasharray="3 3" vertical={false} />
            )}
            <XAxis
              dataKey={xKey}
              tickFormatter={xAxisFormatter}
              tick={{ fill: 'var(--lk-chart-axis)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--lk-border)' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) =>
                valueFormatter ? valueFormatter(Number(v)) : formatLkNumber(Number(v), numberFormat)
              }
              tick={{ fill: 'var(--lk-chart-axis)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            {showTooltip && (
              <Tooltip
                cursor={{ stroke: 'var(--lk-border-strong)', strokeWidth: 1 }}
                content={<LkChartTooltip valueFormatter={valueFormatter} />}
              />
            )}
            {series.map((s, idx) => {
              const strokeColor = s.color ?? palette[idx % palette.length];
              const gradId = `lk-area-${uid}-${idx}`;
              const isHidden = hiddenKeys.includes(s.key);
              return (
                <Area
                  key={s.key}
                  type={curved ? 'monotone' : 'linear'}
                  dataKey={s.key}
                  name={s.label}
                  hide={isHidden}
                  stackId={stacked ? 'lk-area-stack' : undefined}
                  stroke={strokeColor}
                  strokeWidth={s.strokeWidth ?? 2}
                  fill={`url(#${gradId})`}
                  isAnimationActive={false}
                  animationDuration={durationMs}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {showLegend && series.length > 0 && (
        <LkChartLegend items={legendItems} hiddenKeys={hiddenKeys} onToggleSeries={toggleSeries} />
      )}
    </LkChartFrame>
  );
}
