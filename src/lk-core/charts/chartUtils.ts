import { formatLkNumber } from '../i18n/translations';
import { normalizeHex } from '../tokens/contrast';
import type { LkNumberFormat } from '../types';

const HARMONIOUS_SERIES_FALLBACK = [
  '#4C8DFF',
  '#2FB87D',
  '#E59A3D',
  '#A5A8B0',
  '#E05252',
  '#8B5CF6',
];

export function resolveLkChartPalette(
  accentColor: string,
  customColors?: string[],
): string[] {
  if (customColors && customColors.length > 0) {
    return customColors.map((c) => normalizeHex(c, '#D6B56D'));
  }

  const primary = normalizeHex(accentColor, '#D6B56D');
  const seen = new Set<string>([primary.toUpperCase()]);
  const result = [primary];

  for (const hex of HARMONIOUS_SERIES_FALLBACK) {
    const upper = hex.toUpperCase();
    if (!seen.has(upper)) {
      seen.add(upper);
      result.push(hex);
    }
  }
  return result;
}

export type LkChartValidationResult =
  | { status: 'ready' }
  | { status: 'empty' }
  | { status: 'error'; errorMessage: string };

export function extractErrorMessage(error?: string | Error | null): string | null {
  if (!error) return null;
  if (typeof error === 'string') return error.trim() || null;
  if (error instanceof Error) return error.message || 'Erreur inconnue';
  return 'Erreur de chargement des données';
}

export function validateChartDataset(
  data: unknown,
  error?: string | Error | null,
): LkChartValidationResult {
  const errMsg = extractErrorMessage(error);
  if (errMsg) {
    return { status: 'error', errorMessage: errMsg };
  }
  if (!Array.isArray(data)) {
    return {
      status: 'error',
      errorMessage: 'Format de données invalide : un tableau est attendu.',
    };
  }
  if (data.length === 0) {
    return { status: 'empty' };
  }
  return { status: 'ready' };
}

export function validateCircularDataset(
  data: unknown,
  valueKey: string,
  error?: string | Error | null,
): LkChartValidationResult {
  const base = validateChartDataset(data, error);
  if (base.status !== 'ready') return base;

  const list = data as Array<Record<string, unknown>>;
  const hasPositiveValue = list.some((item) => {
    const val = Number(item?.[valueKey]);
    return Number.isFinite(val) && val > 0;
  });

  if (!hasPositiveValue) {
    return { status: 'empty' };
  }
  return { status: 'ready' };
}

export function normalizeSparklineData(
  data: unknown,
  dataKey = 'value',
): Array<{ index: number; value: number }> {
  if (!Array.isArray(data)) return [];
  const points: Array<{ index: number; value: number }> = [];

  data.forEach((entry, idx) => {
    const raw =
      typeof entry === 'number'
        ? entry
        : entry && typeof entry === 'object'
          ? Number((entry as Record<string, unknown>)[dataKey])
          : NaN;

    if (Number.isFinite(raw)) {
      points.push({ index: idx, value: raw });
    }
  });

  return points;
}

export function computeProgressMetrics(value: number, max = 100): {
  clampedValue: number;
  safeMax: number;
  percentage: number;
} {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeVal = Number.isFinite(value) ? value : 0;
  const clampedValue = Math.max(0, Math.min(safeMax, safeVal));
  const percentage = Math.round((clampedValue / safeMax) * 1000) / 10;
  return { clampedValue, safeMax, percentage };
}

export function formatChartValue(
  value: number | string | undefined,
  numberFormat: LkNumberFormat,
  customFormatter?: (value: number, name?: string) => string,
  name?: string,
): string {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return String(value ?? '—');
  if (customFormatter) return customFormatter(numeric, name);
  return formatLkNumber(numeric, numberFormat);
}
