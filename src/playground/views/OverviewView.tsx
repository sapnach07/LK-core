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

const MODULE_META: Array<{
  id: string;
  target: PlaygroundSectionId;
  icon:
    | 'Layers'
    | 'BarChart3'
    | 'Palette'
    | 'Settings'
    | 'Wand2'
    | 'Zap'
    | 'Compass'
    | 'HardDrive'
    | 'Shield'
    | 'FileCode2';
}> = [
  { id: 'lk-design', target: 'components', icon: 'Layers' },
  { id: 'lk-charts', target: 'charts', icon: 'BarChart3' },
  { id: 'lk-themes', target: 'themes', icon: 'Palette' },
  { id: 'lk-settings', target: 'settings', icon: 'Settings' },
  { id: 'lk-glass', target: 'glass', icon: 'Wand2' },
  { id: 'lk-motion', target: 'motion', icon: 'Zap' },
  { id: 'lk-icons', target: 'icons', icon: 'Compass' },
  { id: 'lk-storage', target: 'settings', icon: 'HardDrive' },
  { id: 'lk-a11y', target: 'themes', icon: 'Shield' },
  { id: 'lk-platform', target: 'docs', icon: 'FileCode2' },
];

export function OverviewView({
  onNavigate,
}: {
  onNavigate: (section: PlaygroundSectionId) => void;
}) {
  const { settings, resolvedTheme, dictionary, updateSettings, storageStats, notify } = useLkCore();
  const [imgError, setImgError] = useState(false);

  const t = dictionary.overview;
  const activeBackdrop = resolvedTheme === 'dark' ? DARK_BACKDROP : LIGHT_BACKDROP;
  const activeBg = resolvedTheme === 'dark' ? settings.customDarkBg : settings.customLightBg;
  const contrastAudit = evaluateContrast(
    resolvedTheme === 'dark' ? '#FFFFFF' : '#090A0D',
    activeBg,
  );

  const presetLabel =
    settings.themePreset !== 'custom'
      ? dictionary.presets[settings.themePreset].name
      : dictionary.settings.customThemeOption;

  const modeLabel = resolvedTheme === 'dark' ? dictionary.common.dark : dictionary.common.light;

  return (
    <div className="flex flex-col gap-8">
      {/* Hero Showcase Split */}
      <LkMotionReveal>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            <div>
              <p className="text-xs font-medium tracking-wide" style={{ color: 'var(--lk-accent-ink)' }}>
                {t.kicker}
              </p>
              <h1
                className="text-3xl sm:text-4xl font-bold tracking-tight mt-2 leading-tight"
                style={{ color: 'var(--lk-text)', textWrap: 'balance' }}
              >
                {t.heroTitle}
              </h1>
              <p
                className="text-base mt-3 leading-relaxed max-w-2xl"
                style={{ color: 'var(--lk-text-secondary)' }}
              >
                {t.heroSubtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <LkButton
                variant="primary"
                rightIcon="ArrowRight"
                onClick={() => onNavigate('components')}
              >
                {t.ctaComponents}
              </LkButton>
              <LkButton
                variant="secondary"
                leftIcon="Settings"
                onClick={() => onNavigate('settings')}
              >
                {t.ctaSettings}
              </LkButton>
              <LkButton
                variant="ghost"
                leftIcon="FileCode2"
                onClick={() => onNavigate('docs')}
              >
                {t.ctaDocs}
              </LkButton>
            </div>

            {/* Clean unboxed key-value summary row */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 border-t"
              style={{ borderColor: 'var(--lk-border)' }}
            >
              <div>
                <p className="text-xs" style={{ color: 'var(--lk-text-muted)' }}>
                  {t.kpiProfile}
                </p>
                <p className="text-sm font-semibold mt-1" style={{ color: 'var(--lk-text)' }}>
                  {modeLabel} · {presetLabel}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--lk-text-muted)' }}>
                  {t.kpiBlur}
                </p>
                <p className="text-sm font-semibold font-mono tabular-nums mt-1" style={{ color: 'var(--lk-text)' }}>
                  {settings.glassEnabled ? `${settings.blurIntensity}px` : dictionary.common.disabled}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--lk-text-muted)' }}>
                  {t.kpiContrast}
                </p>
                <p className="text-sm font-semibold font-mono tabular-nums mt-1" style={{ color: 'var(--lk-text)' }}>
                  {contrastAudit.ratioFormatted} ({contrastAudit.grade})
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--lk-text-muted)' }}>
                  {t.kpiFootprint}
                </p>
                <p className="text-sm font-semibold font-mono tabular-nums mt-1" style={{ color: 'var(--lk-text)' }}>
                  {formatLkNumber(storageStats.totalBytes, settings.numberFormat)} o
                </p>
              </div>
            </div>
          </div>

          {/* Right Live Glass Refraction Frame */}
          <div
            className="lg:col-span-5 relative rounded-2xl overflow-hidden border min-h-[280px] flex items-end p-5"
            style={{ borderColor: 'var(--lk-border)' }}
          >
            {!imgError ? (
              <img
                src={activeBackdrop}
                alt={t.backdropAlt}
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
                  {t.glassCardTitle}
                </span>
                <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--lk-accent-ink)' }}>
                  {formatLkDateTime(new Date(), settings.language, settings.timeFormat)}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <LkSlider
                  label={t.blurLabel}
                  min={0}
                  max={32}
                  unit="px"
                  value={settings.blurIntensity}
                  onChange={(val) => updateSettings({ blurIntensity: val, glassEnabled: val > 0 })}
                />
                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <LkSegmentedControl
                    ariaLabel={dictionary.settings.colorMode}
                    value={settings.themeMode}
                    onChange={(mode) =>
                      updateSettings({ themeMode: mode }, `${dictionary.settings.colorMode}: ${mode}`)
                    }
                    options={[
                      { value: 'dark', label: dictionary.common.dark },
                      { value: 'light', label: dictionary.common.light },
                      { value: 'system', label: dictionary.common.system },
                    ]}
                  />
                  <LkButton
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      notify({
                        title: t.pingToastTitle,
                        description: t.pingToastDesc,
                        variant: 'success',
                      })
                    }
                  >
                    {t.pingToast}
                  </LkButton>
                </div>
              </div>
            </LkGlassSurface>
          </div>
        </div>
      </LkMotionReveal>

      {/* Brand Palette Strip */}
      <section aria-labelledby="lk-palette-heading">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h2
              id="lk-palette-heading"
              className="text-lg font-semibold tracking-tight"
              style={{ color: 'var(--lk-text)' }}
            >
              {t.paletteTitle}
            </h2>
            <p className="text-sm" style={{ color: 'var(--lk-text-secondary)' }}>
              {t.paletteSubtitle}
            </p>
          </div>
          <LkButton size="sm" variant="secondary" onClick={() => onNavigate('themes')}>
            {t.customizePalette}
          </LkButton>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { name: 'Obsidian', hex: LK_BRAND_COLORS.obsidian, role: t.swatchRoles.obsidian },
            { name: 'Graphite', hex: LK_BRAND_COLORS.graphite, role: t.swatchRoles.graphite },
            { name: 'LK Gold', hex: LK_BRAND_COLORS.gold, role: t.swatchRoles.gold },
            { name: 'Silver', hex: LK_BRAND_COLORS.silver, role: t.swatchRoles.silver },
            { name: 'Pure White', hex: LK_BRAND_COLORS.pureWhite, role: t.swatchRoles.pureWhite },
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
              <p className="text-xs font-mono tabular-nums mt-0.5" style={{ color: 'var(--lk-accent-ink)' }}>
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
            {t.modulesTitle}
          </h2>
          <p className="text-sm" style={{ color: 'var(--lk-text-secondary)' }}>
            {t.modulesSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODULE_META.map((mod) => {
            const copy = t.modules[mod.id];
            return (
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
                      color: 'var(--lk-accent-ink)',
                    }}
                  >
                    <LkIcon name={mod.icon} size={17} />
                  </span>
                  <LkIcon name="ChevronRight" size={15} className="opacity-50" />
                </div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--lk-text)' }}>
                  {copy.name}
                </h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--lk-text-secondary)' }}>
                  {copy.summary}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
