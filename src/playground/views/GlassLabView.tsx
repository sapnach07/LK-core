import React, { useState } from 'react';
import {
  LkButton,
  LkCard,
  LkGlassSurface,
  LkSegmentedControl,
  LkSlider,
  LkSwitch,
  useLkCore,
} from '../../lk-core';

const DARK_BACKDROP = '/src/assets/images/glass_backdrop_obsidian_gold_1795344428773.jpg';
const LIGHT_BACKDROP = '/src/assets/images/glass_backdrop_arctic_frost_1795344427778.jpg';

export function GlassLabView() {
  const { settings, dictionary, updateSettings, notify } = useLkCore();
  const g = dictionary.glassLab;
  const [scene, setScene] = useState<'obsidian' | 'arctic' | 'mesh'>('obsidian');
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--lk-text)' }}>
            {g.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--lk-text-secondary)' }}>
            {g.subtitle}
          </p>
        </div>

        <LkSegmentedControl
          ariaLabel={g.title}
          value={scene}
          onChange={(next) => {
            setScene(next);
            setImgError(false);
          }}
          options={[
            { value: 'obsidian', label: g.scenes.obsidian },
            { value: 'arctic', label: g.scenes.arctic },
            { value: 'mesh', label: g.scenes.mesh },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Live Glass Stage */}
        <div
          className="lg:col-span-8 relative rounded-2xl overflow-hidden border min-h-[380px] p-6 flex flex-col justify-between"
          style={{ borderColor: 'var(--lk-border)' }}
        >
          {scene === 'mesh' || imgError ? (
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 20% 25%, ${settings.accentColor}66 0%, transparent 48%), radial-gradient(circle at 80% 70%, #4C8DFF55 0%, transparent 45%), linear-gradient(135deg, #090A0D 0%, #17191F 100%)`,
              }}
            />
          ) : (
            <img
              src={scene === 'obsidian' ? DARK_BACKDROP : LIGHT_BACKDROP}
              alt={dictionary.overview.backdropAlt}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 my-auto">
            {(['subtle', 'standard', 'elevated'] as const).map((tier) => (
              <LkGlassSurface
                key={tier}
                intensity={tier}
                rounded="2xl"
                className="p-4 flex flex-col justify-between min-h-[170px]"
              >
                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--lk-accent-ink)' }}
                  >
                    {g.tierLabel(tier)}
                  </p>
                  <h3 className="text-base font-semibold mt-1" style={{ color: 'var(--lk-text)' }}>
                    {g.cardTitle}
                  </h3>
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--lk-text-secondary)' }}>
                    {g.cardDesc(settings.specularHighlight)}
                  </p>
                </div>
                <div
                  className="pt-3 mt-3 border-t flex items-center justify-between text-xs font-mono tabular-nums"
                  style={{ borderColor: 'var(--lk-border)', color: 'var(--lk-text-muted)' }}
                >
                  <span>{g.blurMetric}</span>
                  <span>
                    {settings.glassEnabled
                      ? `${
                          tier === 'subtle'
                            ? Math.max(4, Math.round(settings.blurIntensity * 0.6))
                            : tier === 'elevated'
                              ? Math.min(32, Math.round(settings.blurIntensity * 1.25))
                              : settings.blurIntensity
                        }px`
                      : '0px'}
                  </span>
                </div>
              </LkGlassSurface>
            ))}
          </div>
        </div>

        {/* Glass Calibration Controls */}
        <LkCard
          className="lg:col-span-4"
          title={g.calibrationTitle}
          subtitle={g.calibrationSub}
        >
          <div className="flex flex-col gap-5">
            <LkSwitch
              label={g.glassActive}
              description={g.glassActiveDesc}
              checked={settings.glassEnabled}
              onChange={(val) => updateSettings({ glassEnabled: val })}
            />
            <LkSlider
              label={g.blurRadius}
              min={0}
              max={32}
              unit="px"
              value={settings.blurIntensity}
              onChange={(val) => updateSettings({ blurIntensity: val })}
            />
            <LkSlider
              label={g.surfaceOpacity}
              min={0.35}
              max={0.95}
              step={0.05}
              value={settings.glassOpacity}
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={(val) => updateSettings({ glassOpacity: val })}
            />
            <LkSwitch
              label={g.specularTop}
              description={g.specularTopDesc}
              checked={settings.specularHighlight}
              onChange={(val) => updateSettings({ specularHighlight: val })}
            />
            <LkButton
              variant="secondary"
              leftIcon="RefreshCw"
              onClick={() => {
                updateSettings({
                  glassEnabled: true,
                  blurIntensity: 18,
                  glassOpacity: 0.76,
                  specularHighlight: true,
                });
                notify({
                  title: dictionary.notifications.opticalResetTitle,
                  description: dictionary.notifications.opticalResetDesc,
                  variant: 'info',
                });
              }}
            >
              {g.restoreBtn}
            </LkButton>
          </div>
        </LkCard>
      </div>
    </div>
  );
}
