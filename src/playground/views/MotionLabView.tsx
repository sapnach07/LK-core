import React, { useState } from 'react';
import {
  LK_FOCUS_RING_CLASS,
  LkButton,
  LkCard,
  LkSegmentedControl,
  useLkCore,
  useLkMotionConfig,
} from '../../lk-core';

export function MotionLabView() {
  const { settings, dictionary, updateSettings } = useLkCore();
  const m = dictionary.motionLab;
  const s = dictionary.settings;
  const { isReduced, durationMs, springEase, ease } = useLkMotionConfig();
  const [staggerKey, setStaggerKey] = useState(0);
  const [expandedCard, setExpandedCard] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--lk-text)' }}>
            {m.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--lk-text-secondary)' }}>
            {m.subtitle}
          </p>
        </div>

        <LkSegmentedControl
          ariaLabel={s.motionLevel}
          value={settings.motionLevel}
          onChange={(val) => updateSettings({ motionLevel: val }, `${s.motionLevel}: ${val}`)}
          options={[
            { value: 'full', label: s.motionFull },
            { value: 'subtle', label: s.motionSubtle },
            { value: 'reduced', label: s.motionReduced },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staggered Sequence */}
        <LkCard
          title={m.staggerTitle}
          subtitle={m.staggerSub(durationMs, settings.motionSpeed)}
          action={
            <LkButton
              size="sm"
              variant="primary"
              leftIcon="Play"
              onClick={() => setStaggerKey((k) => k + 1)}
            >
              {m.replayBtn}
            </LkButton>
          }
        >
          <div key={staggerKey} className="flex flex-col gap-2.5">
            {m.sequence.map((item, idx) => (
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
                    style={{ color: 'var(--lk-accent-ink)' }}
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
          title={m.springTitle}
          subtitle={m.springSub}
          action={
            <LkSegmentedControl
              ariaLabel={s.transitionSpeed}
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
                    {m.springSurfaceTitle}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--lk-text-secondary)' }}>
                    {expandedCard ? m.springExpanded : m.springCollapsed}
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
              {m.notePrefix}
              <span className="font-mono">transform</span> / <span className="font-mono">opacity</span>
              {m.noteMiddle}
              <span className="font-mono tabular-nums">0ms</span> ({m.noteReduced}).
            </div>
          </div>
        </LkCard>
      </div>
    </div>
  );
}
