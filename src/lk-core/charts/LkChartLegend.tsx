import React from 'react';
import { LK_FOCUS_RING_CLASS } from '../accessibility/LkAccessibility';
import type { LkChartLegendItem, LkChartLegendProps } from './types';

export function LkChartLegend({
  items,
  payload,
  hiddenKeys = [],
  onToggleSeries,
  align = 'left',
  className = '',
}: LkChartLegendProps) {
  const normalizedItems: LkChartLegendItem[] =
    items && items.length > 0
      ? items
      : (payload ?? []).map((entry, idx) => {
          const key = String(entry.dataKey ?? entry.value ?? `series-${idx}`);
          const color = entry.color ?? entry.payload?.stroke ?? entry.payload?.fill ?? 'var(--lk-accent)';
          return {
            key,
            label: entry.value ?? entry.payload?.name ?? key,
            color,
            hidden: hiddenKeys.includes(key),
          };
        });

  if (normalizedItems.length === 0) return null;

  const justifyClass =
    align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';

  return (
    <div
      className={`lk-chart-legend ${justifyClass} ${className}`}
      role="list"
      aria-label="Légende du graphique"
    >
      {normalizedItems.map((item) => {
        const isHidden = item.hidden ?? hiddenKeys.includes(item.key);
        if (onToggleSeries) {
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onToggleSeries(item.key)}
              aria-pressed={!isHidden}
              className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg transition-opacity cursor-pointer ${LK_FOCUS_RING_CLASS}`}
              style={{
                opacity: isHidden ? 0.45 : 1,
                color: 'var(--lk-text-secondary)',
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span className={isHidden ? 'line-through' : ''}>{item.label}</span>
              {item.value !== undefined && (
                <span className="font-mono tabular-nums font-medium" style={{ color: 'var(--lk-text)' }}>
                  {item.value}
                </span>
              )}
            </button>
          );
        }

        return (
          <div
            key={item.key}
            role="listitem"
            className="inline-flex items-center gap-2"
            style={{ opacity: isHidden ? 0.45 : 1 }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            <span>{item.label}</span>
            {item.value !== undefined && (
              <span className="font-mono tabular-nums font-medium" style={{ color: 'var(--lk-text)' }}>
                {item.value}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
