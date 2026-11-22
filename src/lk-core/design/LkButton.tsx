import React from 'react';
import { LkIcon, type LkIconName } from '../icons/LkIcon';
import { LK_FOCUS_RING_CLASS } from '../accessibility/LkAccessibility';

export type LkButtonVariant = 'primary' | 'secondary' | 'glass' | 'ghost' | 'danger';
export type LkButtonSize = 'sm' | 'md' | 'lg';

export interface LkButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: LkButtonVariant;
  size?: LkButtonSize;
  leftIcon?: LkIconName;
  rightIcon?: LkIconName;
  loading?: boolean;
}

const SIZE_CLASSES: Record<LkButtonSize, string> = {
  sm: 'h-9 px-3.5 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
};

export function LkButton({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loading = false,
  disabled,
  className = '',
  children,
  style,
  type = 'button',
  ...rest
}: LkButtonProps) {
  const isDisabled = disabled || loading;

  const variantStyle: React.CSSProperties =
    variant === 'primary'
      ? {
          backgroundColor: 'var(--lk-accent)',
          color: 'var(--lk-accent-contrast)',
          borderColor: 'transparent',
        }
      : variant === 'secondary'
        ? {
            backgroundColor: 'var(--lk-surface-solid)',
            color: 'var(--lk-text)',
            borderColor: 'var(--lk-border-strong)',
          }
        : variant === 'glass'
          ? {
              backgroundColor: 'var(--lk-surface)',
              color: 'var(--lk-text)',
              borderColor: 'var(--lk-border)',
              backdropFilter: 'blur(var(--lk-blur))',
              WebkitBackdropFilter: 'blur(var(--lk-blur))',
            }
          : variant === 'danger'
            ? {
                backgroundColor: 'rgba(220, 38, 38, 0.14)',
                color: 'var(--lk-danger-text)',
                borderColor: 'rgba(220, 38, 38, 0.32)',
              }
            : {
                backgroundColor: 'transparent',
                color: 'var(--lk-text-secondary)',
                borderColor: 'transparent',
              };

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center font-medium border whitespace-nowrap shrink-0 select-none cursor-pointer transition-all active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none hover:brightness-105 ${SIZE_CLASSES[size]} ${LK_FOCUS_RING_CLASS} ${className}`}
      style={{
        ...variantStyle,
        transitionDuration: 'var(--lk-motion-duration)',
        transitionTimingFunction: 'var(--lk-motion-ease)',
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <span
          className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      ) : leftIcon ? (
        <LkIcon name={leftIcon} size={size === 'sm' ? 14 : 16} />
      ) : null}
      {children}
      {!loading && rightIcon ? (
        <LkIcon name={rightIcon} size={size === 'sm' ? 14 : 16} />
      ) : null}
    </button>
  );
}
