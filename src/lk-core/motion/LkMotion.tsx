import React from 'react';
import { useLkCore } from '../themes/LkThemeProvider';

export function useLkMotionConfig() {
  const { settings } = useLkCore();
  const isReduced = settings.motionLevel === 'reduced';
  const isSubtle = settings.motionLevel === 'subtle';
  const baseSeconds = isReduced ? 0.001 : (isSubtle ? 0.16 : 0.28) / settings.motionSpeed;

  return {
    isReduced,
    isSubtle,
    duration: baseSeconds,
    durationMs: isReduced ? 0 : Math.round(baseSeconds * 1000),
    ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
    springEase: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  };
}

export interface LkMotionRevealProps {
  children: React.ReactNode;
  delay?: number;
  yOffset?: number;
  className?: string;
}

export function LkMotionReveal({
  children,
  delay = 0,
  yOffset = 10,
  className = '',
}: LkMotionRevealProps) {
  const { isReduced, durationMs, ease } = useLkMotionConfig();

  if (isReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`lk-animate-reveal ${className}`}
      style={
        {
          '--lk-reveal-y': `${yOffset}px`,
          animationDuration: `${durationMs}ms`,
          animationDelay: `${Math.round(delay * 1000)}ms`,
          animationTimingFunction: ease,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

export function LkMotionInteractive({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isReduced, isSubtle, durationMs, springEase } = useLkMotionConfig();

  if (isReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`transition-transform ${isSubtle ? 'hover:-translate-y-0.5 active:scale-[0.99]' : 'hover:-translate-y-1 active:scale-[0.98]'} ${className}`}
      style={{
        transitionDuration: `${durationMs}ms`,
        transitionTimingFunction: springEase,
      }}
    >
      {children}
    </div>
  );
}
