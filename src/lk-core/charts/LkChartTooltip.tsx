import React from 'react';
import { useLkCoreOptional } from '../themes/LkThemeProvider';
import { formatChartValue } from './chartUtils';
import type { LkChartTooltipProps } from './types';

export function LkChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  labelFormatter,
}: LkChartTooltipProps) {
  const core = useLkCoreOptional();
  const numberFormat = core?.settings.numberFormat ?? 'US';

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const formattedLabel =
    label !== undefined && label !== null && label !== ''
      ? labelFormatter
        ? labelFormatter(label)
        : String(label)
      : null;

  return (
    <div className="lk-chart-tooltip" role="status" aria-live="polite">
      {formattedLabel && (
        <p
          className="text-xs font-semibold mb-1.5 pb-1.5 border-b"
          style={{ color: 'var(--lk-text)', borderColor: 'var(--lk-border)' }}
        >
          {formattedLabel}
        </p>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((entry, idx) => {
          const itemName = entry.name ?? String(entry.dataKey ?? `Série ${idx + 1}`);
          const swatchColor = entry.color ?? 'var(--lk-accent)';
          const formattedValue = formatChartValue(
            entry.value,
            numberFormat,
            valueFormatter,
            itemName,
          );
          return (
            <div key={`${itemName}-${idx}`} className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: swatchColor }}
                  aria-hidden="true"
                />
                <span className="truncate" style={{ color: 'var(--lk-text-secondary)' }}>
                  {itemName}
                </span>
              </span>
              <span
                className="font-mono tabular-nums font-semibold shrink-0"
                style={{ color: 'var(--lk-text)' }}
              >
                {formattedValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
