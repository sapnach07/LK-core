import React, { useState } from 'react';
import {
  LkButton,
  LkCard,
  LkGlassSurface,
  LkIcon,
  LkLogoMark,
  LkSegmentedControl,
  LkSwitch,
  useLkCore,
} from '../../lk-core';

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const VIEWPORT_WIDTH: Record<ViewportSize, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
};

export function ResponsivePreviewView() {
  const { settings, notify } = useLkCore();
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [sampleFilter, setSampleFilter] = useState<'active' | 'archived'>('active');
  const [focusMode, setFocusMode] = useState(true);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--lk-text)' }}>
            Responsive Viewport Preview
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--lk-text-secondary)' }}>
            Inspect how an LK-powered application adapts across Apple-grade desktop layouts and
            One UI thumb-reachable mobile frames.
          </p>
        </div>

        <LkSegmentedControl
          ariaLabel="Simulated viewport size"
          value={viewport}
          onChange={setViewport}
          options={[
            { value: 'desktop', label: 'Desktop' },
            { value: 'tablet', label: '768px Tablet' },
            { value: 'mobile', label: '390px Mobile' },
          ]}
        />
      </div>

      {/* Simulated Device Container */}
      <div className="flex justify-center">
        <div
          className="w-full transition-all rounded-2xl border overflow-hidden"
          style={{
            maxWidth: VIEWPORT_WIDTH[viewport],
            borderColor: 'var(--lk-border-strong)',
            backgroundColor: 'var(--lk-bg)',
            transitionDuration: 'var(--lk-motion-duration)',
          }}
        >
          {/* Mini App Header */}
          <div
            className="flex items-center justify-between gap-4 px-5 py-3.5 border-b"
            style={{
              backgroundColor: 'var(--lk-surface)',
              borderColor: 'var(--lk-border)',
              backdropFilter: settings.glassEnabled ? `blur(${settings.blurIntensity}px)` : 'none',
            }}
          >
            <div className="flex items-center gap-2.5">
              <LkLogoMark size={24} />
              <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--lk-text)' }}>
                LK Studio Notes
              </span>
            </div>
            <LkButton
              size="sm"
              variant="primary"
              leftIcon="Plus"
              onClick={() =>
                notify({
                  title: 'Mini-app action',
                  description: `Created item in ${viewport} preview.`,
                  variant: 'success',
                })
              }
            >
              New Entry
            </LkButton>
          </div>

          {/* Mini App Body */}
          <div className="p-5 flex flex-col gap-5">
            <div
              className={`grid gap-4 ${
                viewport === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'
              }`}
            >
              <LkCard surface="solid" className="!p-4">
                <p className="text-xs" style={{ color: 'var(--lk-text-muted)' }}>
                  Synced Workspaces
                </p>
                <p className="text-xl font-bold font-mono tabular-nums mt-1" style={{ color: 'var(--lk-text)' }}>
                  14
                </p>
              </LkCard>
              <LkCard surface="solid" className="!p-4">
                <p className="text-xs" style={{ color: 'var(--lk-text-muted)' }}>
                  Shared Components
                </p>
                <p className="text-xl font-bold font-mono tabular-nums mt-1" style={{ color: 'var(--lk-accent)' }}>
                  28
                </p>
              </LkCard>
              <LkCard surface="solid" className="!p-4">
                <p className="text-xs" style={{ color: 'var(--lk-text-muted)' }}>
                  Active Profile
                </p>
                <p className="text-xl font-bold capitalize mt-1" style={{ color: 'var(--lk-text)' }}>
                  {settings.density}
                </p>
              </LkCard>
            </div>

            <LkGlassSurface rounded="xl" className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <LkSegmentedControl
                  ariaLabel="Preview item filter"
                  value={sampleFilter}
                  onChange={setSampleFilter}
                  options={[
                    { value: 'active', label: 'Active (3)' },
                    { value: 'archived', label: 'Archived (1)' },
                  ]}
                />
                <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--lk-text-muted)' }}>
                  {viewport === 'mobile' ? '390px' : viewport === 'tablet' ? '768px' : 'Fluid'}
                </span>
              </div>

              <LkSwitch
                label="One UI Bottom Reach Mode"
                description="Keep primary interactive toggles accessible within thumb range."
                checked={focusMode}
                onChange={setFocusMode}
              />

              <div className="divide-y mt-3" style={{ borderColor: 'var(--lk-border)' }}>
                {(sampleFilter === 'active'
                  ? [
                      'LK Hybrid Glass Token Spec',
                      'Android Compose Color Mapper',
                      'LocalStorage Preference Sync',
                    ]
                  : ['Legacy Draft v0.9']
                ).map((item) => (
                  <div
                    key={item}
                    className="py-2.5 flex items-center justify-between gap-2 text-sm"
                    style={{ borderColor: 'var(--lk-border)' }}
                  >
                    <span style={{ color: 'var(--lk-text)' }}>{item}</span>
                    <LkIcon name="ChevronRight" size={15} className="opacity-60" />
                  </div>
                ))}
              </div>
            </LkGlassSurface>
          </div>
        </div>
      </div>
    </div>
  );
}
