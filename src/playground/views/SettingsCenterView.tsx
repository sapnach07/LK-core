import React, { useRef, useState } from 'react';
import {
  LK_ACCENT_SWATCHES,
  LK_THEME_PRESETS,
  LkButton,
  LkCard,
  LkDialog,
  LkInput,
  LkSegmentedControl,
  LkSelect,
  LkSlider,
  LkSwitch,
  formatLkDateTime,
  formatLkNumber,
  normalizeHex,
  useLkCore,
} from '../../lk-core';

export function SettingsCenterView() {
  const {
    settings,
    resolvedTheme,
    dictionary,
    storageStats,
    activityLog,
    updateSettings,
    applyThemePreset,
    resetSettings,
    importSettingsJson,
    notify,
  } = useLkCore();

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [customHex, setCustomHex] = useState(settings.accentColor);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportSettings = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lk-core-preferences.json';
    link.click();
    URL.revokeObjectURL(url);
    notify({
      title: 'Preferences exported',
      description: 'Saved lk-core-preferences.json locally.',
      variant: 'success',
    });
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    importSettingsJson(text);
    e.target.value = '';
  };

  const h = dictionary.settingsHeaders;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--lk-text)' }}>
            {h.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--lk-text-secondary)' }}>
            {h.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <LkButton size="sm" variant="secondary" leftIcon="Download" onClick={handleExportSettings}>
            Export
          </LkButton>
          <LkButton
            size="sm"
            variant="danger"
            leftIcon="RefreshCw"
            onClick={() => setResetConfirmOpen(true)}
          >
            {dictionary.actions.resetDefaults}
          </LkButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Appearance */}
        <LkCard title={h.appearance} subtitle="Control dark, light, or OS-synchronized themes.">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm font-medium" style={{ color: 'var(--lk-text)' }}>
                Color Mode
              </span>
              <LkSegmentedControl
                ariaLabel="Appearance color mode"
                value={settings.themeMode}
                onChange={(val) => updateSettings({ themeMode: val }, `Color mode set to ${val}`)}
                options={[
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' },
                  { value: 'system', label: 'System' },
                ]}
              />
            </div>
            <LkSwitch
              label="High Contrast Borders"
              description="Increase hairline border visibility and focus outline thickness."
              checked={settings.highContrast}
              onChange={(val) =>
                updateSettings({ highContrast: val }, `High contrast ${val ? 'on' : 'off'}`)
              }
            />
            <LkSwitch
              label="Enhanced Focus Rings"
              description="Keep strong keyboard focus indicators across interactive elements."
              checked={settings.enhancedFocusRings}
              onChange={(val) => updateSettings({ enhancedFocusRings: val })}
            />
          </div>
        </LkCard>

        {/* 2. Theme Customization & 3. Accent Colors */}
        <LkCard
          title={`${h.themeCustom} & ${h.accent}`}
          subtitle="Select a curated LK preset or bind any custom hex accent."
        >
          <div className="flex flex-col gap-4">
            <LkSelect
              label="Theme Preset"
              value={settings.themePreset}
              onChange={(val) => {
                if (val === 'custom') {
                  updateSettings({ themePreset: 'custom' });
                } else {
                  applyThemePreset(val);
                }
              }}
              options={[
                ...LK_THEME_PRESETS.map((p) => ({ value: p.id, label: p.name })),
                { value: 'custom', label: 'Custom User Theme' },
              ]}
            />
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--lk-text-secondary)' }}>
                Quick Accent Swatches
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {LK_ACCENT_SWATCHES.map((sw) => {
                  const active = settings.accentColor.toUpperCase() === sw.hex.toUpperCase();
                  return (
                    <button
                      key={sw.id}
                      type="button"
                      aria-label={`Select ${sw.name} accent`}
                      aria-pressed={active}
                      onClick={() => {
                        setCustomHex(sw.hex);
                        updateSettings(
                          { accentColor: sw.hex, themePreset: 'custom' },
                          `Accent changed to ${sw.name}`,
                        );
                      }}
                      className="w-8 h-8 rounded-full border-2 cursor-pointer transition-transform hover:scale-105 lk-focus-ring"
                      style={{
                        backgroundColor: sw.hex,
                        borderColor: active ? 'var(--lk-text)' : 'transparent',
                      }}
                    />
                  );
                })}
                <div className="flex items-center gap-2 ml-auto">
                  <input
                    type="color"
                    aria-label="Custom accent color picker"
                    value={normalizeHex(customHex)}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setCustomHex(val);
                      updateSettings({ accentColor: val, themePreset: 'custom' });
                    }}
                    className="w-8 h-8 rounded-lg border cursor-pointer bg-transparent"
                    style={{ borderColor: 'var(--lk-border-strong)' }}
                  />
                  <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--lk-text-secondary)' }}>
                    {settings.accentColor}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </LkCard>

        {/* 4. Glass Effects & 5. Blur Intensity */}
        <LkCard
          title={h.glass}
          subtitle="Tune Liquid Glass backdrop blur, surface translucency, and specular edges."
        >
          <div className="flex flex-col gap-4">
            <LkSwitch
              label="Enable LK Hybrid Glass"
              description="Disable for opaque low-power solid surfaces."
              checked={settings.glassEnabled}
              onChange={(val) =>
                updateSettings({ glassEnabled: val }, `Glass effects ${val ? 'enabled' : 'disabled'}`)
              }
            />
            <LkSlider
              label="Blur Intensity"
              min={0}
              max={32}
              unit="px"
              value={settings.blurIntensity}
              onChange={(val) => updateSettings({ blurIntensity: val })}
            />
            <LkSlider
              label="Surface Opacity"
              min={0.35}
              max={0.95}
              step={0.05}
              value={settings.glassOpacity}
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={(val) => updateSettings({ glassOpacity: val })}
            />
            <LkSwitch
              label="Specular Top Rim"
              description="Subtle top-edge refraction highlight inspired by physical glass."
              checked={settings.specularHighlight}
              onChange={(val) => updateSettings({ specularHighlight: val })}
            />
          </div>
        </LkCard>

        {/* 6. Animation Preferences */}
        <LkCard
          title={h.motion}
          subtitle="Control LK Motion fidelity, spring speed, and reduced-motion accessibility."
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm font-medium" style={{ color: 'var(--lk-text)' }}>
                Motion Level
              </span>
              <LkSegmentedControl
                ariaLabel="Animation motion level"
                value={settings.motionLevel}
                onChange={(val) => updateSettings({ motionLevel: val }, `Motion level: ${val}`)}
                options={[
                  { value: 'full', label: 'Full' },
                  { value: 'subtle', label: 'Subtle' },
                  { value: 'reduced', label: 'Reduced' },
                ]}
              />
            </div>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm font-medium" style={{ color: 'var(--lk-text)' }}>
                Transition Speed
              </span>
              <LkSegmentedControl
                ariaLabel="Animation speed multiplier"
                value={String(settings.motionSpeed)}
                onChange={(val) => updateSettings({ motionSpeed: Number(val) as 0.5 | 1 | 1.5 })}
                options={[
                  { value: '0.5', label: '0.5x Relaxed' },
                  { value: '1', label: '1.0x Standard' },
                  { value: '1.5', label: '1.5x Snappy' },
                ]}
              />
            </div>
          </div>
        </LkCard>

        {/* 7. Typography & 8. Interface Density */}
        <LkCard
          title={`${h.typography} & ${h.density}`}
          subtitle="Adjust root font sizing, font pairing, and spacing rhythm across the UI."
        >
          <div className="flex flex-col gap-4">
            <LkSelect
              label="Font Family Pairing"
              value={settings.fontFamily}
              onChange={(val) => updateSettings({ fontFamily: val }, `Font family: ${val}`)}
              options={[
                { value: 'jakarta', label: 'Plus Jakarta Sans + JetBrains Mono' },
                { value: 'manrope', label: 'Manrope + JetBrains Mono' },
                { value: 'system', label: 'Native System UI' },
              ]}
            />
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm font-medium" style={{ color: 'var(--lk-text)' }}>
                Font Scale
              </span>
              <LkSegmentedControl
                ariaLabel="Typography scale"
                value={settings.fontScale}
                onChange={(val) => updateSettings({ fontScale: val }, `Font scale: ${val}`)}
                options={[
                  { value: 'compact', label: '14px Compact' },
                  { value: 'standard', label: '16px Standard' },
                  { value: 'large', label: '18px Large' },
                ]}
              />
            </div>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm font-medium" style={{ color: 'var(--lk-text)' }}>
                Interface Density
              </span>
              <LkSegmentedControl
                ariaLabel="Interface density"
                value={settings.density}
                onChange={(val) => updateSettings({ density: val }, `Density: ${val}`)}
                options={[
                  { value: 'compact', label: 'Compact' },
                  { value: 'comfortable', label: 'Comfortable' },
                  { value: 'spacious', label: 'Spacious' },
                ]}
              />
            </div>
          </div>
        </LkCard>

        {/* 9. Notifications & 10. Language and Regional */}
        <LkCard
          title={`${h.notifications} & ${h.language}`}
          subtitle="Manage real-time toast delivery, interface language, and regional formatting."
        >
          <div className="flex flex-col gap-4">
            <LkSwitch
              label="In-App Notifications"
              description="Allow LK Core components to dispatch toast notifications."
              checked={settings.notificationsEnabled}
              onChange={(val) => updateSettings({ notificationsEnabled: val })}
            />
            <LkSwitch
              label="Quiet Mode (Suppress Info Alerts)"
              description="Only surface warnings, errors, and explicit confirmations."
              checked={settings.quietMode}
              onChange={(val) => updateSettings({ quietMode: val })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <LkSelect
                label="Language"
                value={settings.language}
                onChange={(val) => updateSettings({ language: val }, `Language set to ${val}`)}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Español' },
                  { value: 'fr', label: 'Français' },
                  { value: 'de', label: 'Deutsch' },
                ]}
              />
              <LkSelect
                label="Time Format"
                value={settings.timeFormat}
                onChange={(val) => updateSettings({ timeFormat: val })}
                options={[
                  { value: '24h', label: '24-Hour' },
                  { value: '12h', label: '12-Hour' },
                ]}
              />
              <LkSelect
                label="Number Format"
                value={settings.numberFormat}
                onChange={(val) => updateSettings({ numberFormat: val })}
                options={[
                  { value: 'US', label: '1,234.56 (US)' },
                  { value: 'EU', label: '1.234,56 (EU)' },
                ]}
              />
            </div>
            <p className="text-xs font-mono tabular-nums" style={{ color: 'var(--lk-text-muted)' }}>
              Preview: {formatLkDateTime(new Date(), settings.language, settings.timeFormat)} ·{' '}
              {formatLkNumber(12450.75, settings.numberFormat)}
            </p>
          </div>
        </LkCard>

        {/* 11. Privacy & 12. Storage Information */}
        <LkCard
          title={`${h.privacy} & ${h.storage}`}
          subtitle="All settings reside strictly in your browser localStorage."
        >
          <div className="flex flex-col gap-4">
            <LkSwitch
              label="Strict Local-Only Mode"
              description="Guarantee zero outbound telemetry or external network requests."
              checked={settings.localOnlyMode}
              onChange={(val) => updateSettings({ localOnlyMode: val })}
            />
            <LkSwitch
              label="Record Local Change Log"
              description="Keep the last 12 setting updates locally for diagnostics."
              checked={settings.storeUsageHistory}
              onChange={(val) => updateSettings({ storeUsageHistory: val })}
            />

            <div
              className="grid grid-cols-3 gap-3 py-3 border-y text-xs"
              style={{ borderColor: 'var(--lk-border)' }}
            >
              <div>
                <p style={{ color: 'var(--lk-text-muted)' }}>Total Used</p>
                <p className="font-mono tabular-nums font-semibold mt-0.5" style={{ color: 'var(--lk-text)' }}>
                  {formatLkNumber(storageStats.totalBytes, settings.numberFormat)} B
                </p>
              </div>
              <div>
                <p style={{ color: 'var(--lk-text-muted)' }}>Settings Payload</p>
                <p className="font-mono tabular-nums font-semibold mt-0.5" style={{ color: 'var(--lk-text)' }}>
                  {formatLkNumber(storageStats.settingsBytes, settings.numberFormat)} B
                </p>
              </div>
              <div>
                <p style={{ color: 'var(--lk-text-muted)' }}>Storage Keys</p>
                <p className="font-mono tabular-nums font-semibold mt-0.5" style={{ color: 'var(--lk-text)' }}>
                  {storageStats.keyCount} active
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleImportFile}
                className="hidden"
                aria-label="Import preferences JSON file"
              />
              <LkButton
                size="sm"
                variant="secondary"
                leftIcon="Upload"
                onClick={() => fileInputRef.current?.click()}
              >
                Import JSON
              </LkButton>
              <LkButton
                size="sm"
                variant="secondary"
                leftIcon="Download"
                onClick={handleExportSettings}
              >
                Download JSON
              </LkButton>
            </div>
          </div>
        </LkCard>

        {/* 13. Application Information */}
        <LkCard
          title={h.appInfo}
          subtitle="Runtime diagnostics, active token specification, and recent local events."
        >
          <div className="divide-y text-xs" style={{ borderColor: 'var(--lk-border)' }}>
            {[
              { label: 'Library Package', value: 'LK Core 1.0.0' },
              { label: 'Design Language', value: 'LK Hybrid Glass' },
              { label: 'Resolved Theme', value: `${resolvedTheme} (${settings.themeMode})` },
              { label: 'Persistence Engine', value: 'LocalStorage (lk_core_preferences_v1)' },
              {
                label: 'Last Saved',
                value: storageStats.lastSavedAt
                  ? formatLkDateTime(new Date(storageStats.lastSavedAt), settings.language, settings.timeFormat)
                  : 'Just initialized',
              },
            ].map((row) => (
              <div
                key={row.label}
                className="py-2 flex items-center justify-between gap-4"
                style={{ borderColor: 'var(--lk-border)' }}
              >
                <span style={{ color: 'var(--lk-text-muted)' }}>{row.label}</span>
                <span className="font-mono tabular-nums font-medium" style={{ color: 'var(--lk-text)' }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {activityLog.length > 0 && (
            <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--lk-border)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--lk-text-secondary)' }}>
                Recent Local Preference Events
              </p>
              <ul className="space-y-1 text-xs" style={{ color: 'var(--lk-text-muted)' }}>
                {activityLog.slice(0, 4).map((entry, idx) => (
                  <li key={`${entry.ts}-${idx}`} className="flex items-center justify-between gap-2">
                    <span className="truncate">{entry.label}</span>
                    <span className="font-mono tabular-nums shrink-0">
                      {formatLkDateTime(new Date(entry.ts), settings.language, settings.timeFormat)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </LkCard>
      </div>

      <LkDialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title="Reset all LK Core preferences?"
        description="This clears stored theme, glass, typography, and regional preferences and restores Obsidian Gold defaults."
        footer={
          <>
            <LkButton variant="ghost" onClick={() => setResetConfirmOpen(false)}>
              {dictionary.actions.cancel}
            </LkButton>
            <LkButton
              variant="danger"
              onClick={() => {
                resetSettings();
                setResetConfirmOpen(false);
              }}
            >
              Confirm Reset
            </LkButton>
          </>
        }
      >
        <p>Your local storage keys will be removed and re-initialized cleanly.</p>
      </LkDialog>
    </div>
  );
}
