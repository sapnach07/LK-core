import React, { useId } from 'react';
import { LkIcon } from '../icons/LkIcon';
import { LK_FOCUS_RING_CLASS } from '../accessibility/LkAccessibility';

export interface LkSelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface LkSelectProps<T extends string = string> {
  label?: string;
  value: T;
  options: LkSelectOption<T>[];
  onChange: (value: T) => void;
  id?: string;
  className?: string;
  ariaLabel?: string;
}

export function LkSelect<T extends string = string>({
  label,
  value,
  options,
  onChange,
  id,
  className = '',
  ariaLabel,
}: LkSelectProps<T>) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-medium"
          style={{ color: 'var(--lk-text-secondary)' }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          aria-label={ariaLabel ?? label}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={`w-full appearance-none rounded-xl border pl-3.5 pr-9 text-sm cursor-pointer ${LK_FOCUS_RING_CLASS}`}
          style={{
            height: 'var(--lk-control-height)',
            backgroundColor: 'var(--lk-surface-solid)',
            borderColor: 'var(--lk-border-strong)',
            color: 'var(--lk-text)',
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--lk-text-muted)' }}
        >
          <LkIcon name="ChevronDown" size={15} />
        </span>
      </div>
    </div>
  );
}

export interface LkSegmentedControlProps<T extends string = string> {
  value: T;
  options: LkSelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

export function LkSegmentedControl<T extends string = string>({
  value,
  options,
  onChange,
  ariaLabel,
  className = '',
}: LkSegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex items-center p-1 rounded-xl border gap-1 ${className}`}
      style={{
        backgroundColor: 'var(--lk-surface-muted)',
        borderColor: 'var(--lk-border)',
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 cursor-pointer transition-all ${LK_FOCUS_RING_CLASS}`}
            style={{
              backgroundColor: active ? 'var(--lk-accent)' : 'transparent',
              color: active ? 'var(--lk-accent-contrast)' : 'var(--lk-text-secondary)',
              transitionDuration: 'var(--lk-motion-duration)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
