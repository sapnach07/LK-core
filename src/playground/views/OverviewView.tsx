import React, { useState } from 'react';
import {
  LK_BRAND_COLORS,
  LkButton,
  LkCard,
  LkGlassSurface,
  LkIcon,
  LkMotionReveal,
  LkSegmentedControl,
  LkSlider,
  evaluateContrast,
  formatLkDateTime,
  formatLkNumber,
  useLkCore,
  type PlaygroundSectionId,
} from '../../lk-core';

const DARK_BACKDROP = '/src/assets/images/glass_backdrop_obsidian_gold_1795344428773.jpg';
const LIGHT_BACKDROP = '/src/assets/images/glass_backdrop_arctic_frost_1795344427778.jpg';

const CORE_MODULES: Array<{
  id: string;
  name: string;
  target: PlaygroundSectionId;
  icon: 'Layers' | 'Palette' | 'Settings' | 'Wand2' | 'Zap' | 'Compass' | 'HardDrive' | 'Shield';
  summary: string;
}> = [
  {
    id: 'lk-design',
    name: 'LK Design',
    target: 'components',
    icon: 'Layers',
    summary: 'Buttons, cards, inputs, dialogs, switches, selects, menus, and toast feedback.',
  },
  {
    id: 'lk-themes',
    name: 'LK Themes',
    target: 'themes',
    icon: 'Palette',
    summary: 'Dark, light, system-adaptive, preset themes, and custom accent hex support.',
  },
  {
    id: 'lk-settings',
    name: 'LK Settings',
    target: 'settings',
    icon: 'Settings',
    summary: '13 functional preference categories synced immediately to local storage.',
  },
  {
    id: 'lk-glass',
    name: 'LK Glass',
    target: 'glass',
    icon: 'Wand2',
    summary: 'Apple-inspired specular refraction paired with One UI structural clarity.',
  },
  {
    id: 'lk-motion',
    name: 'LK Motion',
    target: 'motion',
    icon: 'Zap',
    summary: 'Spring physics and reveal curves honoring reduced-motion and speed settings.',
  },
  {
    id: 'lk-icons',
    name: 'LK Icons',
    target: 'icons',
    icon: 'Compass',
    summary: 'Consistent geometric LK emblem and curated Lucide icon catalog.',
  },
  {
    id: 'lk-storage',
    name: 'LK Storage',
    target: 'settings',
    icon: 'HardDrive',
    summary: 'Schema-validated local persistence with byte diagnostics and JSON import/export.',
  },
  {
    id: 'lk-a11y',
    name: 'LK Accessibility',
    target: 'themes',
    icon: 'Shield',
    summary: 'WCAG AA/AAA contrast engine, readable type scaling, and focus rings.',
  },
];

export function OverviewView({
  onNavigate,
}: {
  onNavigate: (section: PlaygroundSectionId) => void;
}) {
  const { settings, resolvedTheme, updateSettings, storageStats, notify } = useLkCore();
  const [imgError, setImgError] = useState(false);

  const activeBackdrop = resolvedTheme === 'dark' ? DARK_BACKDROP : LIGHT_BACKDROP;
  const activeBg = resolvedTheme === 'dark' ? settings.customDarkBg : settings.customLightBg;
  const contrastAudit = evaluateContrast(
    resolvedTheme === 'dark' ? '#FFFFFF' : '#090A0D',
    activeBg,
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Hero Showcase Split */}
      <LkMotionReveal>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            <div>
              <p className="text-xs font-medium tracking-wide" style={{ color: 'var(--lk-accent)' }}>
                LK Hybrid Glass · Cross-Platform Design Foundation
              </p>
              <h1
                className="text-3xl sm:text-4xl font-bold tracking-tight mt-2 leading-tight"
                style={{ color: 'var(--lk-text)', textWrap: 'balance' }}
              >
                Unified interface architecture for the LK ecosystem.
              </h1>
              <p
                className="text-base mt-3 leading-relaxed max-w-2xl"
                style={{ color: 'var(--lk-text-secondary)' }}
              >
                Built for zero-dependency reuse across Google AI Studio web applications and
                platform-neutral Android Kotlin exports. Every surface, token, and preference in this
                playground is live and locally persisted.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <LkButton
                variant="primary"
                rightIcon="ArrowRight"
                onClick={() => onNavigate('components')}
              >
                Explore Component Gallery
              </LkButton>
              <LkButton
                variant="secondary"
                leftIcon="Settings"
                onClick={() => onNavigate('settings')}
              >
                Open Settings Engine
              </LkButton>
              <LkButton
                variant="ghost"
                leftIcon="FileCode2"
                onClick={() => onNavigate('docs')}
              >
                Integration Guide
              </LkButton>
            </div>

            {/* Clean unboxed key-value summary row */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 border-t"
              style={{ borderColor: 'var(--lk-border)' }}
            >
              <div>
                <p className="text-xs" style={{ color: 'var(--lk-text-muted)' }}>
                  Active Profile
                </p>
                <p className="text-sm font-semibold mt-1 capitalize" style={{ color: 'var(--lk-text)' }}>
                  {resolvedTheme} · {settings.themePreset}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--lk-text-muted)' }}>
                  Glass Blur
                </p>
                <p className="text-sm font-semibold font-mono tabular-nums mt-1" style={{ color: 'var(--lk-text)' }}>
                  {settings.glassEnabled ? `${settings.blurIntensity}px` : 'Disabled'}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--lk-text-muted)' }}>
                  Text Contrast
                </p>
                <p className="text-sm font-semibold font-mono tabular-nums mt-1" style={{ color: 'var(--lk-text)' }}>
                  {contrastAudit.ratioFormatted} ({contrastAudit.grade})
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--lk-text-muted)' }}>
                  Local Footprint
                </p>
                <p className="text-sm font-semibold font-mono tabular-nums mt-1" style={{ color: 'var(--lk-text)' }}>
                  {formatLkNumber(storageStats.totalBytes, settings.numberFormat)} B
                </p>
              </div>
            </div>
          </div>

          {/* Right Live Glass Refraction Frame */}
          <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border min-h-[280px] flex items-end p-5" style={{ borderColor: 'var(--lk-border)' }}>
            {!imgError ? (
              <img
                src={activeBackdrop}
                alt="Architectural studio surface demonstrating LK Hybrid Glass refraction"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${settings.accentColor}44, ${LK_BRAND_COLORS.obsidian})`,
                }}
              />
            )}
            <div
              className="absolute inset-0"
              style={{
                background:
                  resolvedTheme === 'dark'
                    ? 'linear-gradient(to top, rgba(9,10,13,0.72), rgba(9,10,13,0.12))'
                    : 'linear-gradient(to top, rgba(245,246,248,0.65), rgba(255,255,255,0.08))',
              }}
            />

            <LkGlassSurface intensity="elevated" rounded="xl" className="relative z-10 w-full p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-xs font-semibold" style={{ color: 'var(--lk-text)' }}>
                  Live Hybrid Glass Controls
                </span>
                <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--lk-accent)' }}>
                  {formatLkDateTime(new Date(), settings.language, settings.timeFormat)}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <LkSlider
                  label="Backdrop Blur"
                  min={0}
                  max={32}
                  unit="px"
                  value={settings.blurIntensity}
                  onChange={(val) => updateSettings({ blurIntensity: val, glassEnabled: val > 0 })}
                />
                <div className="flex items-center justify-between gap-2 pt-1">
                  <LkSegmentedControl
                    ariaLabel="Quick theme switcher"
                    value={settings.themeMode}
                    onChange={(mode) => updateSettings({ themeMode: mode }, `Switched mode to ${mode}`)}
                    options={[
                      { value: 'dark', label: 'Dark' },
                      { value: 'light', label: 'Light' },
                      { value: 'system', label: 'System' },
                    ]}
                  />
                  <LkButton
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      notify({
                        title: 'LK Core Ready',
                        description: 'Theme & glass parameters are synced to local storage.',
                        variant: 'success',
                      })
                    }
                  >
                    Ping Toast
                  </LkButton>
                </div>
              </div>
            </LkGlassSurface>
          </div>
        </div>
      </LkMotionReveal>

      {/* Brand Palette Strip */}
      <section aria-labelledby="lk-palette-heading">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2
              id="lk-palette-heading"
              className="text-lg font-semibold tracking-tight"
              style={{ color: 'var(--lk-text)' }}
            >
              LK Hybrid Glass Core Palette
            </h2>
            <p className="text-sm" style={{ color: 'var(--lk-text-secondary)' }}>
              Default foundation swatches engineered for 60-30-10 tonal hierarchy.
            </p>
          </div>
          <LkButton size="sm" variant="secondary" onClick={() => onNavigate('themes')}>
            Customize Palette
          </LkButton>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { name: 'Obsidian', hex: LK_BRAND_COLORS.obsidian, role: 'Primary Dark Canvas' },
            { name: 'Graphite', hex: LK_BRAND_COLORS.graphite, role: 'Elevated Dark Surface' },
            { name: 'LK Gold', hex: LK_BRAND_COLORS.gold, role: 'Signature Accent' },
            { name: 'Silver', hex: LK_BRAND_COLORS.silver, role: 'Secondary Metadata' },
            { name: 'Pure White', hex: LK_BRAND_COLORS.pureWhite, role: 'Light Surface & Ink' },
          ].map((swatch) => (
            <LkCard key={swatch.name} surface="solid" className="!p-3.5">
              <div
                className="h-12 w-full rounded-lg border mb-3"
                style={{
                  backgroundColor: swatch.hex,
                  borderColor: 'var(--lk-border)',
                }}
              />
              <p className="text-sm font-semibold" style={{ color: 'var(--lk-text)' }}>
                {swatch.name}
              </p>
              <p className="text-xs font-mono tabular-nums mt-0.5" style={{ color: 'var(--lk-accent)' }}>
                {swatch.hex}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--lk-text-muted)' }}>
                {swatch.role}
              </p>
            </LkCard>
          ))}
        </div>
      </section>

      {/* 8 Modular Systems Matrix */}
      <section aria-labelledby="lk-modules-heading">
        <div className="mb-4">
          <h2
            id="lk-modules-heading"
            className="text-lg font-semibold tracking-tight"
            style={{ color: 'var(--lk-text)' }}
          >
            Modular Architecture
          </h2>
          <p className="text-sm" style={{ color: 'var(--lk-text-secondary)' }}>
            Eight decoupled subsystems exported from a single TypeScript entry point.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CORE_MODULES.map((mod) => (
            <button
              key={mod.id}
              type="button"
              onClick={() => onNavigate(mod.target)}
              className="text-left rounded-2xl border p-4 transition-all hover:brightness-105 cursor-pointer lk-focus-ring"
              style={{
                backgroundColor: 'var(--lk-surface)',
                borderColor: 'var(--lk-border)',
                backdropFilter: settings.glassEnabled ? `blur(${settings.blurIntensity}px)` : 'none',
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg"
                  style={{
                    backgroundColor: 'var(--lk-accent-soft)',
                    color: 'var(--lk-accent)',
                  }}
                >
                  <LkIcon name={mod.icon} size={17} />
                </span>
                <LkIcon name="ChevronRight" size={15} className="opacity-50" />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--lk-text)' }}>
                {mod.name}
              </h3>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--lk-text-secondary)' }}>
                {mod.summary}
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
