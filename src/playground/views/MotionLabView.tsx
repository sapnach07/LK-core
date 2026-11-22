import React, { useState } from 'react';
import {
  LK_FOCUS_RING_CLASS,
  LkButton,
  LkCard,
  LkSegmentedControl,
  useLkCore,
  useLkMotionConfig,
} from '../../lk-core';

const SEQUENCE_ITEMS = [
  { id: '01', title: 'Token Resolution', detail: 'CSS custom properties & Kotlin exports' },
  { id: '02', title: 'Glass Compositing', detail: 'GPU-friendly transform & opacity transitions' },
  { id: '03', title: 'Focus Choreography', detail: 'Deterministic keyboard & pointer settling' },
  { id: '04', title: 'Reduced Motion Safe', detail: 'Instant zero-delay fallback when requested' },
];

export function MotionLabView() {
  const { settings, updateSettings } = useLkCore();
  const { isReduced, durationMs, springEase, ease } = useLkMotionConfig();
  const [staggerKey, setStaggerKey] = useState(0);
  const [expandedCard, setExpandedCard] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--lk-text)' }}>
            LK Motion Demonstrations
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--lk-text-secondary)' }}>
            Physics-driven transitions that strictly honor your global Motion Level and Speed settings.
          </p>
        </div>

        <LkSegmentedControl
          ariaLabel="Motion level override"
          value={settings.motionLevel}
          onChange={(val) => updateSettings({ motionLevel: val }, `Motion level: ${val}`)}
          options={[
            { value: 'full', label: 'Full' },
            { value: 'subtle', label: 'Subtle' },
            { value: 'reduced', label: 'Reduced' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staggered Sequence */}
        <LkCard
          title="Staggered List Choreography"
          subtitle={`Current duration: ${durationMs}ms · Speed ${settings.motionSpeed}x`}
          action={
            <LkButton
              size="sm"
              variant="primary"
              leftIcon="Play"
              onClick={() => setStaggerKey((k) => k + 1)}
            >
              Replay
            </LkButton>
          }
        >
          <div key={staggerKey} className="flex flex-col gap-2.5">
            {SEQUENCE_ITEMS.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-4 p-3 rounded-xl border ${
                  isReduced ? '' : 'lk-animate-stagger'
                }`}
                style={{
                  backgroundColor: 'var(--lk-surface-solid)',
                  borderColor: 'var(--lk-border)',
                  animationDuration: `${durationMs}ms`,
                  animationDelay: isReduced
                    ? '0ms'
                    : `${Math.round((idx * 65) / settings.motionSpeed)}ms`,
                  animationTimingFunction: ease,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-mono tabular-nums font-semibold"
                    style={{ color: 'var(--lk-accent)' }}
                  >
                    {item.id}
                  </span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--lk-text)' }}>
                      {item.title}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--lk-text-muted)' }}>
                      {item.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </LkCard>

        {/* Interactive Spring Surface */}
        <LkCard
          title="Tactile Spring & State Morph"
          subtitle="Click or press the interactive surface to test spring settling curves."
          action={
            <LkSegmentedControl
              ariaLabel="Motion speed"
              value={String(settings.motionSpeed)}
              onChange={(val) => updateSettings({ motionSpeed: Number(val) as 0.5 | 1 | 1.5 })}
              options={[
                { value: '0.5', label: '0.5x' },
                { value: '1', label: '1.0x' },
                { value: '1.5', label: '1.5x' },
              ]}
            />
          }
        >
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setExpandedCard((prev) => !prev)}
              className={`w-full text-left p-5 rounded-2xl border cursor-pointer transition-all ${
                isReduced ? '' : 'hover:scale-[1.015] active:scale-[0.985]'
              } ${LK_FOCUS_RING_CLASS}`}
              style={{
                backgroundColor: expandedCard ? 'var(--lk-accent-soft)' : 'var(--lk-surface-solid)',
                borderColor: expandedCard ? 'var(--lk-accent)' : 'var(--lk-border-strong)',
                transitionDuration: `${durationMs}ms`,
                transitionTimingFunction: springEase,
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--lk-text)' }}>
                    Interactive Spring Surface
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--lk-text-secondary)' }}>
                    {expandedCard
                      ? 'Active state engaged — tap again to settle back.'
                      : 'Tap to toggle active spring elevation state.'}
                  </p>
                </div>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm font-bold shrink-0 transition-transform"
                  style={{
                    backgroundColor: 'var(--lk-accent)',
                    color: 'var(--lk-accent-contrast)',
                    transform: expandedCard ? 'rotate(45deg)' : 'rotate(0deg)',
                    transitionDuration: `${durationMs}ms`,
                    transitionTimingFunction: springEase,
                  }}
                >
                  +
                </div>
              </div>
            </button>

            <div
              className="p-3.5 rounded-xl border text-xs leading-relaxed"
              style={{ borderColor: 'var(--lk-border)', color: 'var(--lk-text-secondary)' }}
            >
              LK Motion animates only compositor properties (<span className="font-mono">transform</span>{' '}
              and <span className="font-mono">opacity</span>) and automatically collapses durations to{' '}
              <span className="font-mono tabular-nums">0ms</span> when Motion Level is set to{' '}
              <span className="font-semibold">Reduced</span>.
            </div>
          </div>
        </LkCard>
      </div>
    </div>
  );
}
