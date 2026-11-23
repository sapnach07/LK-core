import React, { useRef, useState } from 'react';
import {
  LK_ACCENT_SWATCHES,
  LK_THEME_PRESETS,
  LkButton,
  LkCard,
  LkDialog,
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
      title: dictionary.notifications.prefsExportedTitle,
      description: dictionary.notifications.prefsExportedDesc,
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
  const s = dictionary.settings;
  const resolvedModeLabel =
    resolvedTheme === 'dark' ? dictionary.common.dark : dictionary.common.light;
  const settingModeLabel =
    settings.themeMode === 'dark'
      ? dictionary.common.dark
      : settings.themeMode === 'light'
        ? dictionary.common.light
        : dictionary.common.system;

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
            {dictionary.common.exportBtn}
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
        <LkCard title={h.appearance} subtitle={s.appearanceSub}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm font-medium" style={{ color: 'var(--lk-text)' }}>
                {s.colorMode}
              </span>
              <LkSegmentedControl
                ariaLabel={s.colorMode}
                value={settings.themeMode}
                onChange={(val) => updateSettings({ themeMode: val }, `${s.colorMode}: ${val}`)}
                options={[
                  { value: 'dark', label: dictionary.common.dark },
                  { value: 'light', label: dictionary.common.light },
                  { value: 'system', label: dictionary.common.system },
                ]}
              />
            </div>
            <LkSwitch
              label={s.highContrast}
              description={s.highContrastDesc}
              checked={settings.highContrast}
              onChange={(val) =>
                updateSettings({ highContrast: val }, `${s.highContrast}: ${val ? 'on' : 'off'}`)
              }
            />
            <LkSwitch
              label={s.enhancedFocus}
              description={s.enhancedFocusDesc}
              checked={settings.enhancedFocusRings}
              onChange={(val) => updateSettings({ enhancedFocusRings: val })}
            />
          </div>
        </LkCard>

        {/* 2. Theme Customization & 3. Accent Colors */}
        <LkCard title={`${h.themeCustom} & ${h.accent}`} subtitle={s.themeAccentSub}>
          <div className="flex flex-col gap-4">
            <LkSelect
              label={s.themePreset}
              value={settings.themePreset}
              onChange={(val) => {
                if (val === 'custom') {
                  updateSettings({ themePreset: 'custom' });
                } else {
                  applyThemePreset(val);
                }
              }}
              options={[
                ...LK_THEME_PRESETS.map((p) => ({
                  value: p.id,
                  label:
                    p.id !== 'custom'
                      ? (dictionary.presets[p.id]?.name ?? p.name)
                      : s.customThemeOption,
                })),
                { value: 'custom', label: s.customThemeOption },
              ]}
            />
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--lk-text-secondary)' }}>
                {s.quickSwatches}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {LK_ACCENT_SWATCHES.map((sw) => {
                  const active = settings.accentColor.toUpperCase() === sw.hex.toUpperCase();
                  const swName = dictionary.accentNames[sw.id] ?? sw.name;
                  return (
                    <button
                      key={sw.id}
                      type="button"
                      aria-label={`${h.accent}: ${swName}`}
                      aria-pressed={active}
                      onClick={() => {
                        setCustomHex(sw.hex);
                        updateSettings(
                          { accentColor: sw.hex, themePreset: 'custom' },
                          `${h.accent}: ${swName}`,
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
                    aria-label={s.accentPickerAria}
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
        <LkCard title={h.glass} subtitle={s.glassSub}>
          <div className="flex flex-col gap-4">
            <LkSwitch
              label={s.enableGlass}
              description={s.enableGlassDesc}
              checked={settings.glassEnabled}
              onChange={(val) =>
                updateSettings({ glassEnabled: val }, `${s.enableGlass}: ${val ? 'on' : 'off'}`)
              }
            />
            <LkSlider
              label={s.blurIntensity}
              min={0}
              max={32}
              unit="px"
              value={settings.blurIntensity}
              onChange={(val) => updateSettings({ blurIntensity: val })}
            />
            <LkSlider
              label={s.surfaceOpacity}
              min={0.35}
              max={0.95}
              step={0.05}
              value={settings.glassOpacity}
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={(val) => updateSettings({ glassOpacity: val })}
            />
            <LkSwitch
              label={s.specularRim}
              description={s.specularRimDesc}
              checked={settings.specularHighlight}
              onChange={(val) => updateSettings({ specularHighlight: val })}
            />
          </div>
        </LkCard>

        {/* 6. Animation Preferences */}
        <LkCard title={h.motion} subtitle={s.motionSub}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm font-medium" style={{ color: 'var(--lk-text)' }}>
                {s.motionLevel}
              </span>
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
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm font-medium" style={{ color: 'var(--lk-text)' }}>
                {s.transitionSpeed}
              </span>
              <LkSegmentedControl
                ariaLabel={s.transitionSpeed}
                value={String(settings.motionSpeed)}
                onChange={(val) => updateSettings({ motionSpeed: Number(val) as 0.5 | 1 | 1.5 })}
                options={[
                  { value: '0.5', label: s.speedSlow },
                  { value: '1', label: s.speedNormal },
                  { value: '1.5', label: s.speedFast },
                ]}
              />
            </div>
          </div>
        </LkCard>

        {/* 7. Typography & 8. Interface Density */}
        <LkCard title={`${h.typography} & ${h.density}`} subtitle={s.typoDensitySub}>
          <div className="flex flex-col gap-4">
            <LkSelect
              label={s.fontPairing}
              value={settings.fontFamily}
              onChange={(val) => updateSettings({ fontFamily: val }, `${s.fontPairing}: ${val}`)}
              options={[
                { value: 'jakarta', label: s.fontOptions.jakarta },
                { value: 'manrope', label: s.fontOptions.manrope },
                { value: 'system', label: s.fontOptions.system },
              ]}
            />
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm font-medium" style={{ color: 'var(--lk-text)' }}>
                {s.fontScale}
              </span>
              <LkSegmentedControl
                ariaLabel={s.fontScale}
                value={settings.fontScale}
                onChange={(val) => updateSettings({ fontScale: val }, `${s.fontScale}: ${val}`)}
                options={[
                  { value: 'compact', label: s.fontScaleOptions.compact },
                  { value: 'standard', label: s.fontScaleOptions.standard },
                  { value: 'large', label: s.fontScaleOptions.large },
                ]}
              />
            </div>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm font-medium" style={{ color: 'var(--lk-text)' }}>
                {s.interfaceDensity}
              </span>
              <LkSegmentedControl
                ariaLabel={s.interfaceDensity}
                value={settings.density}
                onChange={(val) => updateSettings({ density: val }, `${s.interfaceDensity}: ${val}`)}
                options={[
                  { value: 'compact', label: dictionary.common.compact },
                  { value: 'comfortable', label: dictionary.common.comfortable },
                  { value: 'spacious', label: dictionary.common.spacious },
                ]}
              />
            </div>
          </div>
        </LkCard>

        {/* 9. Notifications & 10. Language and Regional */}
        <LkCard title={`${h.notifications} & ${h.language}`} subtitle={s.notifLangSub}>
          <div className="flex flex-col gap-4">
            <LkSwitch
              label={s.inAppNotif}
              description={s.inAppNotifDesc}
              checked={settings.notificationsEnabled}
              onChange={(val) => updateSettings({ notificationsEnabled: val })}
            />
            <LkSwitch
              label={s.quietMode}
              description={s.quietModeDesc}
              checked={settings.quietMode}
              onChange={(val) => updateSettings({ quietMode: val })}
            />
            <LkSwitch
              label={s.visualCues}
              description={s.visualCuesDesc}
              checked={settings.visualCuesEnabled}
              onChange={(val) => updateSettings({ visualCuesEnabled: val })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <LkSelect
                label={s.languageLabel}
                value={settings.language}
                onChange={(val) => updateSettings({ language: val }, `${s.languageLabel}: ${val}`)}
                options={[
                  { value: 'fr', label: 'Français' },
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Español' },
                  { value: 'de', label: 'Deutsch' },
                ]}
              />
              <LkSelect
                label={s.timeFormatLabel}
                value={settings.timeFormat}
                onChange={(val) => updateSettings({ timeFormat: val })}
                options={[
                  { value: '24h', label: s.time24 },
                  { value: '12h', label: s.time12 },
                ]}
              />
              <LkSelect
                label={s.numberFormatLabel}
                value={settings.numberFormat}
                onChange={(val) => updateSettings({ numberFormat: val })}
                options={[
                  { value: 'US', label: s.numUs },
                  { value: 'EU', label: s.numEu },
                ]}
              />
            </div>
            <p className="text-xs font-mono tabular-nums" style={{ color: 'var(--lk-text-muted)' }}>
              {s.regionalPreview} :{' '}
              {formatLkDateTime(new Date(), settings.language, settings.timeFormat)} ·{' '}
              {formatLkNumber(12450.75, settings.numberFormat)}
            </p>
          </div>
        </LkCard>

        {/* 11. Privacy & 12. Storage Information */}
        <LkCard title={`${h.privacy} & ${h.storage}`} subtitle={s.privacyStorageSub}>
          <div className="flex flex-col gap-4">
            <LkSwitch
              label={s.localOnly}
              description={s.localOnlyDesc}
              checked={settings.localOnlyMode}
              onChange={(val) => updateSettings({ localOnlyMode: val })}
            />
            <LkSwitch
              label={s.recordHistory}
              description={s.recordHistoryDesc}
              checked={settings.storeUsageHistory}
              onChange={(val) => updateSettings({ storeUsageHistory: val })}
            />

            <div
              className="grid grid-cols-3 gap-3 py-3 border-y text-xs"
              style={{ borderColor: 'var(--lk-border)' }}
            >
              <div>
                <p style={{ color: 'var(--lk-text-muted)' }}>{s.totalUsed}</p>
                <p className="font-mono tabular-nums font-semibold mt-0.5" style={{ color: 'var(--lk-text)' }}>
                  {formatLkNumber(storageStats.totalBytes, settings.numberFormat)} o
                </p>
              </div>
              <div>
                <p style={{ color: 'var(--lk-text-muted)' }}>{s.settingsPayload}</p>
                <p className="font-mono tabular-nums font-semibold mt-0.5" style={{ color: 'var(--lk-text)' }}>
                  {formatLkNumber(storageStats.settingsBytes, settings.numberFormat)} o
                </p>
              </div>
              <div>
                <p style={{ color: 'var(--lk-text-muted)' }}>{s.storageKeys}</p>
                <p className="font-mono tabular-nums font-semibold mt-0.5" style={{ color: 'var(--lk-text)' }}>
                  {storageStats.keyCount} {s.activeKeysSuffix}
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
                aria-label={s.importJson}
              />
              <LkButton
                size="sm"
                variant="secondary"
                leftIcon="Upload"
                onClick={() => fileInputRef.current?.click()}
              >
                {s.importJson}
              </LkButton>
              <LkButton
                size="sm"
                variant="secondary"
                leftIcon="Download"
                onClick={handleExportSettings}
              >
                {s.downloadJson}
              </LkButton>
            </div>
          </div>
        </LkCard>

        {/* 13. Application Information */}
        <LkCard title={h.appInfo} subtitle={s.appInfoSub}>
          <div className="divide-y text-xs" style={{ borderColor: 'var(--lk-border)' }}>
            {[
              { label: s.infoRows.packageLabel, value: 'LK Core 1.0.0' },
              { label: s.infoRows.designLabel, value: s.infoRows.designValue },
              { label: s.infoRows.resolvedLabel, value: `${resolvedModeLabel} (${settingModeLabel})` },
              { label: s.infoRows.persistenceLabel, value: s.infoRows.persistenceValue },
              {
                label: s.infoRows.lastSavedLabel,
                value: storageStats.lastSavedAt
                  ? formatLkDateTime(
                      new Date(storageStats.lastSavedAt),
                      settings.language,
                      settings.timeFormat,
                    )
                  : s.infoRows.justInitialized,
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
                {s.recentEvents}
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
        title={s.resetDialogTitle}
        description={s.resetDialogDesc}
        closeLabel={dictionary.common.closeDialog}
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
              {s.resetConfirmBtn}
            </LkButton>
          </>
        }
      >
        <p>{s.resetDialogBody}</p>
      </LkDialog>
    </div>
  );
}
