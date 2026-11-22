import React from 'react';
import { useLkCore } from '../themes/LkThemeProvider';

export interface LkGlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: 'subtle' | 'standard' | 'elevated';
  blurOverride?: number;
  opacityOverride?: number;
  specular?: boolean;
  rounded?: 'md' | 'lg' | 'xl' | '2xl';
}

const RADIUS_CLASS: Record<NonNullable<LkGlassSurfaceProps['rounded']>, string> = {
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
  '2xl': 'rounded-3xl',
};

export function LkGlassSurface({
  intensity = 'standard',
  blurOverride,
  opacityOverride,
  specular,
  rounded = 'xl',
  className = '',
  style,
  children,
  ...rest
}: LkGlassSurfaceProps) {
  const { settings, resolvedTheme } = useLkCore();
  const isGlassActive = settings.glassEnabled;
  const blurPx =
    blurOverride !== undefined
      ? blurOverride
      : intensity === 'subtle'
        ? Math.max(4, Math.round(settings.blurIntensity * 0.6))
        : intensity === 'elevated'
          ? Math.min(32, Math.round(settings.blurIntensity * 1.25))
          : settings.blurIntensity;

  const baseAlpha =
    opacityOverride !== undefined
      ? opacityOverride
      : intensity === 'subtle'
        ? Math.max(0.35, settings.glassOpacity - 0.14)
        : intensity === 'elevated'
          ? Math.min(0.95, settings.glassOpacity + 0.08)
          : settings.glassOpacity;

  const showSpecular = specular ?? settings.specularHighlight;

  const computedBg = isGlassActive
    ? resolvedTheme === 'dark'
      ? `rgba(23, 25, 31, ${baseAlpha})`
      : `rgba(255, 255, 255, ${baseAlpha})`
    : 'var(--lk-surface-solid)';

  const specularShadow =
    showSpecular && isGlassActive
      ? resolvedTheme === 'dark'
        ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.16), 0 12px 32px -18px rgba(0, 0, 0, 0.5)'
        : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.8), 0 12px 28px -18px rgba(9, 10, 13, 0.16)'
      : '0 1px 3px rgba(0, 0, 0, 0.08)';

  return (
    <div
      className={`${RADIUS_CLASS[rounded]} border transition-[background-color,border-color,box-shadow] ${className}`}
      style={{
        backgroundColor: computedBg,
        borderColor: 'var(--lk-border)',
        backdropFilter: isGlassActive
          ? `blur(${blurPx}px) saturate(var(--lk-glass-saturation))`
          : 'none',
        WebkitBackdropFilter: isGlassActive
          ? `blur(${blurPx}px) saturate(var(--lk-glass-saturation))`
          : 'none',
        boxShadow: specularShadow,
        transitionDuration: 'var(--lk-motion-duration)',
        transitionTimingFunction: 'var(--lk-motion-ease)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function LkGlassPanel({
  className = '',
  children,
  ...rest
}: LkGlassSurfaceProps) {
  return (
    <LkGlassSurface
      intensity="standard"
      rounded="xl"
      className={`p-[var(--lk-density-pad)] ${className}`}
      {...rest}
    >
      {children}
    </LkGlassSurface>
  );
}

export function LkGlassHeader({
  className = '',
  children,
  ...rest
}: React.HTMLAttributes<HTMLElement>) {
  const { settings, resolvedTheme } = useLkCore();
  const isGlass = settings.glassEnabled;
  const bg = isGlass
    ? resolvedTheme === 'dark'
      ? 'rgba(9, 10, 13, 0.72)'
      : 'rgba(255, 255, 255, 0.78)'
    : 'var(--lk-bg-elevated)';

  return (
    <header
      className={`border-b ${className}`}
      style={{
        backgroundColor: bg,
        borderColor: 'var(--lk-border)',
        backdropFilter: isGlass ? `blur(${Math.min(24, settings.blurIntensity)}px)` : 'none',
        WebkitBackdropFilter: isGlass ? `blur(${Math.min(24, settings.blurIntensity)}px)` : 'none',
      }}
      {...rest}
    >
      {children}
    </header>
  );
}
