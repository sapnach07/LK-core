import React from 'react';
import { LkCard } from '../design/LkCard';
import { LkButton } from '../design/LkButton';
import { LkSegmentedControl } from '../design/LkSelect';
import { LkSlider, LkSwitch } from '../design/LkSwitch';
import { LK_ACCENT_SWATCHES } from '../tokens/designTokens';
import { useLkCore } from '../themes/LkThemeProvider';

export interface LkQuickSettingsPanelProps {
  title?: string;
  subtitle?: string;
  showResetButton?: boolean;
  className?: string;
}

/**
 * Reusable quick-settings panel ready to drop into any client application
 * wrapped in <LkProvider> (theme mode, accent swatches, glass blur, motion, contrast).
 */
export function LkQuickSettingsPanel({
  title,
  subtitle,
  showResetButton = true,
  className = '',
}: LkQuickSettingsPanelProps) {
  const { settings, dictionary, updateSettings, resetSettings } = useLkCore();
  const s = dictionary.settings;

  return (
    <LkCard
      title={title ?? dictionary.settingsHeaders.appearance}
      subtitle={subtitle ?? s.appearanceSub}
      className={className}
      action={
        showResetButton ? (
          <LkButton size="sm" variant="ghost" leftIcon="RefreshCw" onClick={resetSettings}>
            {dictionary.actions.resetDefaults}
          </LkButton>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <span className="text-sm font-medium" style={{ color: 'var(--lk-text)' }}>
            {s.colorMode}
          </span>
          <LkSegmentedControl
            ariaLabel={s.colorMode}
            value={settings.themeMode}
            onChange={(val) => updateSettings({ themeMode: val })}
            options={[
              { value: 'dark', label: dictionary.common.dark },
              { value: 'light', label: dictionary.common.light },
              { value: 'system', label: dictionary.common.system },
            ]}
          />
        </div>

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
                  aria-label={`${dictionary.settingsHeaders.accent}: ${swName}`}
                  aria-pressed={active}
                  onClick={() => updateSettings({ accentColor: sw.hex, themePreset: 'custom' })}
                  className="w-7 h-7 rounded-full border-2 cursor-pointer transition-transform hover:scale-105 lk-focus-ring"
                  style={{
                    backgroundColor: sw.hex,
                    borderColor: active ? 'var(--lk-text)' : 'transparent',
                  }}
                />
              );
            })}
          </div>
        </div>

        <LkSwitch
          label={s.enableGlass}
          description={s.enableGlassDesc}
          checked={settings.glassEnabled}
          onChange={(val) => updateSettings({ glassEnabled: val })}
        />

        <LkSlider
          label={s.blurIntensity}
          min={0}
          max={32}
          unit="px"
          value={settings.blurIntensity}
          onChange={(val) => updateSettings({ blurIntensity: val, glassEnabled: val > 0 })}
        />

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <span className="text-sm font-medium" style={{ color: 'var(--lk-text)' }}>
            {s.motionLevel}
          </span>
          <LkSegmentedControl
            ariaLabel={s.motionLevel}
            value={settings.motionLevel}
            onChange={(val) => updateSettings({ motionLevel: val })}
            options={[
              { value: 'full', label: s.motionFull },
              { value: 'subtle', label: s.motionSubtle },
              { value: 'reduced', label: s.motionReduced },
            ]}
          />
        </div>

        <LkSwitch
          label={s.highContrast}
          description={s.highContrastDesc}
          checked={settings.highContrast}
          onChange={(val) => updateSettings({ highContrast: val })}
        />
      </div>
    </LkCard>
  );
}
