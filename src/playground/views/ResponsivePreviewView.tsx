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
  const { settings, dictionary, notify } = useLkCore();
  const r = dictionary.responsive;

  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [sampleFilter, setSampleFilter] = useState<'active' | 'archived'>('active');
  const [focusMode, setFocusMode] = useState(true);

  const densityLabel =
    settings.density === 'compact'
      ? dictionary.common.compact
      : settings.density === 'spacious'
        ? dictionary.common.spacious
        : dictionary.common.comfortable;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--lk-text)' }}>
            {r.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--lk-text-secondary)' }}>
            {r.subtitle}
          </p>
        </div>

        <LkSegmentedControl
          ariaLabel={r.title}
          value={viewport}
          onChange={setViewport}
          options={[
            { value: 'desktop', label: r.viewports.desktop },
            { value: 'tablet', label: r.viewports.tablet },
            { value: 'mobile', label: r.viewports.mobile },
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
                {r.miniAppTitle}
              </span>
            </div>
            <LkButton
              size="sm"
              variant="primary"
              leftIcon="Plus"
              onClick={() =>
                notify({
                  title: r.newEntryBtn,
                  description: `${r.miniAppTitle} (${r.viewports[viewport]})`,
                  variant: 'success',
                })
              }
            >
              {r.newEntryBtn}
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
                  {r.statWorkspaces}
                </p>
                <p className="text-xl font-bold font-mono tabular-nums mt-1" style={{ color: 'var(--lk-text)' }}>
                  14
                </p>
              </LkCard>
              <LkCard surface="solid" className="!p-4">
                <p className="text-xs" style={{ color: 'var(--lk-text-muted)' }}>
                  {r.statComponents}
                </p>
                <p className="text-xl font-bold font-mono tabular-nums mt-1" style={{ color: 'var(--lk-accent-ink)' }}>
                  28
                </p>
              </LkCard>
              <LkCard surface="solid" className="!p-4">
                <p className="text-xs" style={{ color: 'var(--lk-text-muted)' }}>
                  {r.statProfile}
                </p>
                <p className="text-xl font-bold mt-1" style={{ color: 'var(--lk-text)' }}>
                  {densityLabel}
                </p>
              </LkCard>
            </div>

            <LkGlassSurface rounded="xl" className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <LkSegmentedControl
                  ariaLabel={r.miniAppTitle}
                  value={sampleFilter}
                  onChange={setSampleFilter}
                  options={[
                    { value: 'active', label: r.filterActive },
                    { value: 'archived', label: r.filterArchived },
                  ]}
                />
                <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--lk-text-muted)' }}>
                  {viewport === 'mobile' ? '390px' : viewport === 'tablet' ? '768px' : r.fluidLabel}
                </span>
              </div>

              <LkSwitch
                label={r.oneUiLabel}
                description={r.oneUiDesc}
                checked={focusMode}
                onChange={setFocusMode}
              />

              <div className="divide-y mt-3" style={{ borderColor: 'var(--lk-border)' }}>
                {(sampleFilter === 'active' ? r.sampleItems : r.archivedItems).map((item) => (
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
