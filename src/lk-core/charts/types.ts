import type React from 'react';

export interface LkChartSeries {
  key: string;
  label: string;
  color?: string;
  dashed?: boolean;
  strokeWidth?: number;
}

export interface LkPieDataItem {
  name: string;
  value: number;
  color?: string;
  [key: string]: unknown;
}

export interface LkProgressSegment {
  id: string;
  label: string;
  value: number;
  color?: string;
}

export interface LkBaseChartProps {
  height?: number;
  loading?: boolean;
  error?: string | Error | null;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  colors?: string[];
  animate?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  ariaLabel?: string;
  className?: string;
  valueFormatter?: (value: number, name?: string) => string;
  xAxisFormatter?: (value: string | number) => string;
}

export interface LkLineChartProps extends LkBaseChartProps {
  data: Array<Record<string, unknown>>;
  xKey: string;
  series: LkChartSeries[];
  curved?: boolean;
  showDots?: boolean;
}

export interface LkBarChartProps extends LkBaseChartProps {
  data: Array<Record<string, unknown>>;
  xKey: string;
  series: LkChartSeries[];
  stacked?: boolean;
  barRadius?: number;
}

export interface LkAreaChartProps extends LkBaseChartProps {
  data: Array<Record<string, unknown>>;
  xKey: string;
  series: LkChartSeries[];
  stacked?: boolean;
  curved?: boolean;
}

export interface LkPieChartProps extends Omit<LkBaseChartProps, 'showGrid' | 'xAxisFormatter'> {
  data: LkPieDataItem[] | Array<Record<string, unknown>>;
  nameKey?: string;
  valueKey?: string;
  outerRadius?: number | string;
}

export interface LkDonutChartProps extends LkPieChartProps {
  innerRadius?: number | string;
  centerLabel?: string;
  centerValue?: string | number;
}

export interface LkProgressChartProps {
  value: number;
  max?: number;
  label?: string;
  sublabel?: string;
  variant?: 'bar' | 'ring';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  segments?: LkProgressSegment[];
  showPercentage?: boolean;
  valueFormatter?: (value: number, max: number) => string;
  error?: string | Error | null;
  ariaLabel?: string;
  className?: string;
}

export interface LkSparklineProps {
  data: number[] | Array<Record<string, unknown>>;
  dataKey?: string;
  color?: string;
  height?: number;
  variant?: 'line' | 'area' | 'bar';
  showTooltip?: boolean;
  animate?: boolean;
  valueFormatter?: (value: number) => string;
  emptyText?: string;
  error?: string | Error | null;
  ariaLabel?: string;
  className?: string;
}

export interface LkChartTooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

export interface LkChartTooltipProps {
  active?: boolean;
  payload?: LkChartTooltipPayloadItem[];
  label?: string | number;
  valueFormatter?: (value: number, name?: string) => string;
  labelFormatter?: (label: string | number) => string;
}

export interface LkChartLegendItem {
  key: string;
  label: string;
  color: string;
  value?: string | number;
  hidden?: boolean;
}

export interface LkChartLegendProps {
  items?: LkChartLegendItem[];
  payload?: Array<{
    value?: string;
    color?: string;
    dataKey?: string | number;
    payload?: { fill?: string; stroke?: string; name?: string };
  }>;
  hiddenKeys?: string[];
  onToggleSeries?: (key: string) => void;
  align?: 'left' | 'center' | 'right';
  className?: string;
}
