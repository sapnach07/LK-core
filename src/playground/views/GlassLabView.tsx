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
  const { settings, updateSettings, notify } = useLkCore();
  const [scene, setScene] = useState<'obsidian' | 'arctic' | 'mesh'>('obsidian');
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--lk-text)' }}>
            Glass Effects Laboratory
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--lk-text-secondary)' }}>
            Calibrate Apple-inspired Liquid Glass translucency, backdrop blur radius, and specular
            rim highlights against rich tonal backgrounds.
          </p>
        </div>

        <LkSegmentedControl
          ariaLabel="Laboratory background scene"
          value={scene}
          onChange={(next) => {
            setScene(next);
            setImgError(false);
          }}
          options={[
            { value: 'obsidian', label: 'Obsidian Gold' },
            { value: 'arctic', label: 'Arctic Frost' },
            { value: 'mesh', label: 'Geometric Mesh' },
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
              alt="Glass laboratory optical backdrop"
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
                    style={{ color: 'var(--lk-accent)' }}
                  >
                    {tier} tier
                  </p>
                  <h3 className="text-base font-semibold mt-1" style={{ color: 'var(--lk-text)' }}>
                    Hybrid Glass
                  </h3>
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--lk-text-secondary)' }}>
                    Dynamic backdrop filter paired with {settings.specularHighlight ? 'specular' : 'matte'}{' '}
                    edge illumination.
                  </p>
                </div>
                <div
                  className="pt-3 mt-3 border-t flex items-center justify-between text-xs font-mono tabular-nums"
                  style={{ borderColor: 'var(--lk-border)', color: 'var(--lk-text-muted)' }}
                >
                  <span>Blur</span>
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
          title="Optical Calibration"
          subtitle="Updates global LK Glass parameters immediately."
        >
          <div className="flex flex-col gap-5">
            <LkSwitch
              label="Glassmorphism Active"
              description="Turn off to test crisp solid fallback surfaces."
              checked={settings.glassEnabled}
              onChange={(val) => updateSettings({ glassEnabled: val })}
            />
            <LkSlider
              label="Blur Radius"
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
              description="Subtle 1px inner light reflection along the upper edge."
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
                  title: 'Optical defaults restored',
                  description: 'Reset blur to 18px and surface opacity to 76%.',
                  variant: 'info',
                });
              }}
            >
              Restore Optical Defaults
            </LkButton>
          </div>
        </LkCard>
      </div>
    </div>
  );
}
