import React, { useId } from 'react';
import { LK_FOCUS_RING_CLASS } from '../accessibility/LkAccessibility';

export interface LkSwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function LkSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: LkSwitchProps) {
  const id = useId();

  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className="text-sm font-medium cursor-pointer select-none block"
          style={{ color: 'var(--lk-text)' }}
        >
          {label}
        </label>
        {description && (
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--lk-text-muted)' }}>
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors cursor-pointer disabled:opacity-45 ${LK_FOCUS_RING_CLASS}`}
        style={{
          backgroundColor: checked ? 'var(--lk-accent)' : 'var(--lk-surface-muted)',
          borderColor: checked ? 'transparent' : 'var(--lk-border-strong)',
          transitionDuration: 'var(--lk-motion-duration)',
        }}
      >
        <span
          className="inline-block h-5 w-5 rounded-full shadow-sm transition-transform"
          style={{
            backgroundColor: checked ? 'var(--lk-accent-contrast)' : 'var(--lk-text)',
            transform: checked ? 'translateX(24px)' : 'translateX(3px)',
            transitionDuration: 'var(--lk-motion-duration)',
            transitionTimingFunction: 'var(--lk-motion-ease)',
          }}
        />
      </button>
    </div>
  );
}

export interface LkSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit?: string;
  onChange: (value: number) => void;
  formatValue?: (val: number) => string;
}

export function LkSlider({
  value,
  min,
  max,
  step = 1,
  label,
  unit = '',
  onChange,
  formatValue,
}: LkSliderProps) {
  const id = useId();
  const display = formatValue ? formatValue(value) : `${value}${unit}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={id}
          className="text-sm font-medium"
          style={{ color: 'var(--lk-text)' }}
        >
          {label}
        </label>
        <span
          className="text-xs font-mono tabular-nums font-medium"
          style={{ color: 'var(--lk-accent-ink)' }}
        >
          {display}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2 rounded-full appearance-none cursor-pointer ${LK_FOCUS_RING_CLASS}`}
        style={{
          background: `linear-gradient(to right, var(--lk-accent) ${((value - min) / (max - min)) * 100}%, var(--lk-surface-muted) ${((value - min) / (max - min)) * 100}%)`,
          accentColor: 'var(--lk-accent)',
        }}
      />
    </div>
  );
}
