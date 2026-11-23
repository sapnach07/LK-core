import React, { useId, useState } from 'react';
import { LkIcon, type LkIconName } from '../icons/LkIcon';
import { LK_FOCUS_RING_CLASS } from '../accessibility/LkAccessibility';

export interface LkInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: LkIconName;
  allowPasswordToggle?: boolean;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
}

export function LkInput({
  label,
  helperText,
  errorText,
  leftIcon,
  allowPasswordToggle = false,
  showPasswordLabel = 'Afficher le mot de passe',
  hidePasswordLabel = 'Masquer le mot de passe',
  type = 'text',
  id,
  className = '',
  ...rest
}: LkInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [showPassword, setShowPassword] = useState(false);

  const effectiveType = allowPasswordToggle && type === 'password' ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium tracking-wide"
          style={{ color: 'var(--lk-text-secondary)' }}
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span
            className="absolute left-3 pointer-events-none"
            style={{ color: 'var(--lk-text-muted)' }}
          >
            <LkIcon name={leftIcon} size={16} />
          </span>
        )}
        <input
          id={inputId}
          type={effectiveType}
          aria-invalid={Boolean(errorText) || undefined}
          className={`w-full rounded-xl border text-sm transition-colors ${leftIcon ? 'pl-9' : 'px-3.5'} ${allowPasswordToggle && type === 'password' ? 'pr-10' : 'pr-3.5'} ${LK_FOCUS_RING_CLASS}`}
          style={{
            height: 'var(--lk-control-height)',
            backgroundColor: 'var(--lk-surface-solid)',
            borderColor: errorText ? '#DC2626' : 'var(--lk-border-strong)',
            color: 'var(--lk-text)',
          }}
          {...rest}
        />
        {allowPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? hidePasswordLabel : showPasswordLabel}
            className={`absolute right-2 p-1.5 rounded-lg cursor-pointer ${LK_FOCUS_RING_CLASS}`}
            style={{ color: 'var(--lk-text-muted)' }}
          >
            <LkIcon name={showPassword ? 'EyeOff' : 'Eye'} size={15} />
          </button>
        )}
      </div>
      {errorText ? (
        <p className="text-xs text-red-500" role="alert">
          {errorText}
        </p>
      ) : helperText ? (
        <p className="text-xs" style={{ color: 'var(--lk-text-muted)' }}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
