import React, { useState } from 'react';
import {
  LK_ACCENT_SWATCHES,
  LK_THEME_PRESETS,
  LkButton,
  LkCard,
  LkInput,
  LkSegmentedControl,
  evaluateContrast,
  exportTokensAsCss,
  exportTokensAsJson,
  exportTokensAsKotlinCompose,
  normalizeHex,
  pickAccessibleForeground,
  useLkCore,
} from '../../lk-core';

export function ThemeEditorView() {
  const { settings, resolvedTheme, updateSettings, applyThemePreset, notify } = useLkCore();
  const [hexDraft, setHexDraft] = useState(settings.accentColor);
  const [exportFormat, setExportFormat] = useState<'json' | 'css' | 'kotlin'>('json');

  const activeBg = resolvedTheme === 'dark' ? settings.customDarkBg : settings.customLightBg;
  const activeText = resolvedTheme === 'dark' ? '#FFFFFF' : '#090A0D';
  const accentInk = pickAccessibleForeground(settings.accentColor);

  const primaryContrast = evaluateContrast(activeText, activeBg);
  const accentButtonContrast = evaluateContrast(accentInk, settings.accentColor);
  const accentOnBgContrast = evaluateContrast(settings.accentColor, activeBg);

  const exportOutput =
    exportFormat === 'json'
      ? exportTokensAsJson(settings, resolvedTheme)
      : exportFormat === 'css'
        ? exportTokensAsCss(settings, resolvedTheme)
        : exportTokensAsKotlinCompose(settings, resolvedTheme);

  const handleApplyHex = () => {
    const normalized = normalizeHex(hexDraft, settings.accentColor);
    setHexDraft(normalized);
    updateSettings(
      { accentColor: normalized, themePreset: 'custom' },
      `Set custom accent ${normalized}`,
    );
    notify({
      title: 'Accent color updated',
      description: `Applied ${normalized} across all LK Core tokens.`,
      variant: 'success',
    });
  };

  const handleCopyTokens = async () => {
    try {
      await navigator.clipboard.writeText(exportOutput);
      notify({
        title: 'Tokens copied',
        description: `Copied ${exportFormat.toUpperCase()} tokens to clipboard.`,
        variant: 'success',
      });
    } catch {
      notify({
        title: 'Clipboard unavailable',
        description: 'Select the code block directly to copy.',
        variant: 'warning',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--lk-text)' }}>
          Theme Editor & Token Exporter
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--lk-text-secondary)' }}>
          Customize light/dark modes, accent colors, inspect real-time WCAG contrast ratios, and export
          platform-neutral tokens for React or Android Kotlin.
        </p>
      </div>

      {/* Presets Grid */}
      <section aria-label="Theme Presets">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LK_THEME_PRESETS.map((preset) => {
            const isActive = settings.themePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  applyThemePreset(preset.id);
                  setHexDraft(preset.accent);
                }}
                aria-pressed={isActive}
                className="text-left rounded-2xl border p-4 transition-all cursor-pointer lk-focus-ring"
                style={{
                  backgroundColor: 'var(--lk-surface)',
                  borderColor: isActive ? 'var(--lk-accent)' : 'var(--lk-border)',
                  boxShadow: isActive ? '0 0 0 1px var(--lk-accent)' : undefined,
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: preset.darkBg, borderColor: 'var(--lk-border-strong)' }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: preset.accent, borderColor: 'var(--lk-border-strong)' }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: preset.lightBg, borderColor: 'var(--lk-border-strong)' }}
                    />
                  </div>
                  <span className="text-xs font-medium capitalize" style={{ color: 'var(--lk-text-muted)' }}>
                    {preset.recommendedMode}
                  </span>
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--lk-text)' }}>
                  {preset.name}
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--lk-text-secondary)' }}>
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Accent & Mode Customizer */}
        <LkCard
          className="lg:col-span-5"
          title="Mode & Accent Controls"
          subtitle="Changes persist locally and update CSS variables in real time."
        >
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--lk-text-secondary)' }}>
                Color Mode
              </p>
              <LkSegmentedControl
                ariaLabel="Theme mode selector"
                value={settings.themeMode}
                onChange={(mode) => updateSettings({ themeMode: mode }, `Theme mode: ${mode}`)}
                options={[
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' },
                  { value: 'system', label: 'System' },
                ]}
              />
            </div>

            <div>
              <p className="text-xs font-medium mb-2.5" style={{ color: 'var(--lk-text-secondary)' }}>
                Curated LK Accents
              </p>
              <div className="grid grid-cols-3 gap-2">
                {LK_ACCENT_SWATCHES.map((swatch) => {
                  const selected = settings.accentColor.toUpperCase() === swatch.hex.toUpperCase();
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      onClick={() => {
                        setHexDraft(swatch.hex);
                        updateSettings(
                          { accentColor: swatch.hex, themePreset: 'custom' },
                          `Accent: ${swatch.name}`,
                        );
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl border text-left cursor-pointer lk-focus-ring"
                      style={{
                        backgroundColor: 'var(--lk-surface-solid)',
                        borderColor: selected ? 'var(--lk-accent)' : 'var(--lk-border)',
                      }}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 border"
                        style={{ backgroundColor: swatch.hex, borderColor: 'rgba(0,0,0,0.2)' }}
                      />
                      <span className="text-xs font-medium truncate" style={{ color: 'var(--lk-text)' }}>
                        {swatch.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <LkInput
                  label="Custom Accent Hex"
                  value={hexDraft}
                  onChange={(e) => setHexDraft(e.target.value)}
                  placeholder="#D6B56D"
                />
              </div>
              <input
                type="color"
                aria-label="Pick custom accent color"
                value={normalizeHex(hexDraft)}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setHexDraft(val);
                  updateSettings({ accentColor: val, themePreset: 'custom' });
                }}
                className="h-10 w-11 rounded-xl border p-1 cursor-pointer bg-transparent"
                style={{ borderColor: 'var(--lk-border-strong)' }}
              />
              <LkButton variant="primary" onClick={handleApplyHex}>
                Apply
              </LkButton>
            </div>

            {/* Live WCAG Contrast Matrix */}
            <div className="pt-4 border-t" style={{ borderColor: 'var(--lk-border)' }}>
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--lk-text)' }}>
                Real-Time WCAG Accessibility Audit
              </p>
              <div className="divide-y text-xs" style={{ borderColor: 'var(--lk-border)' }}>
                {[
                  { label: 'Primary Text / Canvas', audit: primaryContrast },
                  { label: 'Button Ink / Accent', audit: accentButtonContrast },
                  { label: 'Accent Text / Canvas', audit: accentOnBgContrast },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="py-2 flex items-center justify-between gap-2"
                    style={{ borderColor: 'var(--lk-border)' }}
                  >
                    <span style={{ color: 'var(--lk-text-secondary)' }}>{row.label}</span>
                    <span
                      className="font-mono tabular-nums font-semibold"
                      style={{ color: row.audit.passesAA ? '#16A34A' : '#D97706' }}
                    >
                      {row.audit.ratioFormatted} · {row.audit.grade}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </LkCard>

        {/* Token Exporter */}
        <LkCard
          className="lg:col-span-7"
          title="Platform-Neutral Token Export"
          subtitle="Export live theme values for React CSS variables, JSON schemas, or Android Jetpack Compose."
          action={
            <LkButton size="sm" variant="primary" leftIcon="Copy" onClick={handleCopyTokens}>
              Copy
            </LkButton>
          }
        >
          <div className="mb-3">
            <LkSegmentedControl
              ariaLabel="Token export format"
              value={exportFormat}
              onChange={setExportFormat}
              options={[
                { value: 'json', label: 'Platform JSON' },
                { value: 'css', label: 'CSS Variables' },
                { value: 'kotlin', label: 'Kotlin Compose' },
              ]}
            />
          </div>
          <pre
            className="rounded-xl border p-4 text-xs font-mono overflow-x-auto max-h-[380px] leading-relaxed"
            style={{
              backgroundColor: 'var(--lk-bg)',
              borderColor: 'var(--lk-border)',
              color: 'var(--lk-text-secondary)',
            }}
          >
            <code>{exportOutput}</code>
          </pre>
        </LkCard>
      </div>
    </div>
  );
}
