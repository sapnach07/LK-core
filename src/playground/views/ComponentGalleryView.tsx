import React, { useState } from 'react';
import {
  LkButton,
  LkCard,
  LkDialog,
  LkDropdown,
  LkInput,
  LkSegmentedControl,
  LkSelect,
  LkSlider,
  LkSwitch,
  useLkCore,
} from '../../lk-core';

export function ComponentGalleryView() {
  const { notify, settings, updateSettings } = useLkCore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const [projectName, setProjectName] = useState('LK Notes App');
  const [apiSecretInput, setApiSecretInput] = useState('lk_preview_token_example');
  const [environment, setEnvironment] = useState<'react' | 'kotlin' | 'hybrid'>('react');
  const [segmentTab, setSegmentTab] = useState<'all' | 'forms' | 'overlays'>('all');
  const [autoSync, setAutoSync] = useState(true);
  const [radiusSample, setRadiusSample] = useState(16);

  const nameError =
    projectName.trim().length < 3 ? 'Project name must be at least 3 characters.' : undefined;

  const triggerLoading = () => {
    setLoadingDemo(true);
    setTimeout(() => {
      setLoadingDemo(false);
      notify({
        title: 'Action completed',
        description: 'Simulated async button cycle finished cleanly.',
        variant: 'success',
      });
    }, 900);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--lk-text)' }}>
            LK Design Component Gallery
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--lk-text-secondary)' }}>
            Interactive test bench for buttons, form controls, menus, dialogs, and toast notifications.
          </p>
        </div>
        <LkSegmentedControl
          ariaLabel="Filter component sections"
          value={segmentTab}
          onChange={setSegmentTab}
          options={[
            { value: 'all', label: 'All Components' },
            { value: 'forms', label: 'Inputs & Toggles' },
            { value: 'overlays', label: 'Dialogs & Menus' },
          ]}
        />
      </div>

      {(segmentTab === 'all' || segmentTab === 'forms') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Buttons Showcase */}
          <LkCard
            title="Action Buttons"
            subtitle="Single-line controls with accessible focus rings and semantic variants."
          >
            <div className="flex flex-wrap gap-3">
              <LkButton
                variant="primary"
                leftIcon="Check"
                onClick={() =>
                  notify({
                    title: 'Primary action',
                    description: 'Primary LK accent button clicked.',
                    variant: 'info',
                  })
                }
              >
                Primary Action
              </LkButton>
              <LkButton
                variant="secondary"
                leftIcon="Copy"
                onClick={() =>
                  notify({
                    title: 'Secondary action',
                    description: 'Secondary structural button clicked.',
                    variant: 'info',
                  })
                }
              >
                Secondary
              </LkButton>
              <LkButton
                variant="glass"
                leftIcon="Wand2"
                onClick={() =>
                  notify({
                    title: 'Glass surface action',
                    description: 'Translucent glass button pressed.',
                    variant: 'success',
                  })
                }
              >
                Glass Surface
              </LkButton>
              <LkButton
                variant="ghost"
                onClick={() =>
                  notify({
                    title: 'Ghost action',
                    description: 'Low-emphasis ghost control triggered.',
                    variant: 'info',
                  })
                }
              >
                Ghost
              </LkButton>
              <LkButton
                variant="danger"
                leftIcon="Trash2"
                onClick={() =>
                  notify({
                    title: 'Destructive confirmation',
                    description: 'Danger variant demonstrates semantic alert color.',
                    variant: 'warning',
                  })
                }
              >
                Danger
              </LkButton>
            </div>

            <div
              className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t"
              style={{ borderColor: 'var(--lk-border)' }}
            >
              <LkButton size="sm" variant="secondary" onClick={triggerLoading} loading={loadingDemo}>
                {loadingDemo ? 'Processing...' : 'Test Loading State'}
              </LkButton>
              <LkButton size="md" variant="primary" disabled>
                Disabled State
              </LkButton>
            </div>
          </LkCard>

          {/* Form Inputs & Validation */}
          <LkCard
            title="Inputs & Validation"
            subtitle="Accessible labels, live validation errors, password reveal, and native select."
          >
            <div className="flex flex-col gap-4">
              <LkInput
                label="Target Application Name"
                leftIcon="Folder"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                errorText={nameError}
                helperText={!nameError ? 'Clear the input below 3 chars to inspect error state.' : undefined}
              />
              <LkInput
                label="Local Signing Key"
                type="password"
                leftIcon="Lock"
                allowPasswordToggle
                value={apiSecretInput}
                onChange={(e) => setApiSecretInput(e.target.value)}
              />
              <LkSelect
                label="Target Runtime"
                value={environment}
                onChange={setEnvironment}
                options={[
                  { value: 'react', label: 'React 19 + TypeScript (AI Studio)' },
                  { value: 'kotlin', label: 'Android Jetpack Compose (Kotlin)' },
                  { value: 'hybrid', label: 'Shared Token Pipeline (Web + Mobile)' },
                ]}
              />
            </div>
          </LkCard>

          {/* Switches, Sliders & Segmented Controls */}
          <LkCard
            title="Toggles & Sliders"
            subtitle="One UI inspired tactile switches and precision range controls."
          >
            <div className="flex flex-col gap-4">
              <LkSwitch
                label="Auto-sync Local Preferences"
                description="Immediately write configuration updates to browser storage."
                checked={autoSync}
                onChange={(next) => {
                  setAutoSync(next);
                  notify({
                    title: next ? 'Auto-sync enabled' : 'Auto-sync paused',
                    variant: 'info',
                  });
                }}
              />
              <LkSwitch
                label="Specular Glass Rim"
                description="Toggle top-edge light refraction across all LK Cards."
                checked={settings.specularHighlight}
                onChange={(next) =>
                  updateSettings(
                    { specularHighlight: next },
                    `Specular highlight ${next ? 'enabled' : 'disabled'}`,
                  )
                }
              />
              <div className="pt-2">
                <LkSlider
                  label="Preview Corner Radius"
                  min={4}
                  max={28}
                  unit="px"
                  value={radiusSample}
                  onChange={setRadiusSample}
                />
                <div
                  className="mt-3 p-3 border text-xs flex items-center justify-between"
                  style={{
                    borderRadius: `${radiusSample}px`,
                    borderColor: 'var(--lk-border-strong)',
                    backgroundColor: 'var(--lk-surface-muted)',
                    color: 'var(--lk-text-secondary)',
                  }}
                >
                  <span>Live radius container</span>
                  <span className="font-mono tabular-nums" style={{ color: 'var(--lk-accent)' }}>
                    {radiusSample}px
                  </span>
                </div>
              </div>
            </div>
          </LkCard>

          {/* Cards & Navigation Tabs */}
          <LkCard
            title="Surface Modes & Tabular Data"
            subtitle="Single-elevation surfaces using clean hairline dividers rather than nested boxes."
          >
            <div className="divide-y" style={{ borderColor: 'var(--lk-border)' }}>
              {[
                { token: '--lk-accent', value: settings.accentColor, role: 'Primary Action Ink' },
                { token: '--lk-blur', value: `${settings.blurIntensity}px`, role: 'Backdrop Filter' },
                { token: '--lk-density-pad', value: settings.density, role: 'Layout Spacing' },
                { token: '--lk-font-scale', value: settings.fontScale, role: 'Typography Scale' },
              ].map((row) => (
                <div
                  key={row.token}
                  className="py-2.5 flex items-center justify-between gap-4 text-sm"
                  style={{ borderColor: 'var(--lk-border)' }}
                >
                  <div>
                    <p className="font-mono text-xs font-medium" style={{ color: 'var(--lk-text)' }}>
                      {row.token}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--lk-text-muted)' }}>
                      {row.role}
                    </p>
                  </div>
                  <span
                    className="font-mono text-xs tabular-nums font-medium"
                    style={{ color: 'var(--lk-accent)' }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </LkCard>
        </div>
      )}

      {(segmentTab === 'all' || segmentTab === 'overlays') && (
        <LkCard
          title="Dialogs, Menus & Notification Feedback"
          subtitle="Keyboard-accessible overlays (Escape to dismiss) and live toast dispatching."
        >
          <div className="flex flex-wrap items-center gap-3">
            <LkButton variant="primary" leftIcon="Layers" onClick={() => setDialogOpen(true)}>
              Open Modal Dialog
            </LkButton>

            <LkDropdown
              triggerLabel="Component Actions"
              triggerIcon="Menu"
              items={[
                {
                  id: 'toast-success',
                  label: 'Dispatch Success Toast',
                  icon: 'CheckCircle2',
                  onSelect: () =>
                    notify({
                      title: 'Token bundle verified',
                      description: 'All semantic tokens meet WCAG AA contrast.',
                      variant: 'success',
                    }),
                },
                {
                  id: 'toast-warning',
                  label: 'Dispatch Warning Toast',
                  icon: 'AlertTriangle',
                  onSelect: () =>
                    notify({
                      title: 'Blur intensity elevated',
                      description: 'High backdrop blur can increase GPU fill cost on mobile.',
                      variant: 'warning',
                    }),
                },
                {
                  id: 'toast-error',
                  label: 'Dispatch Error Toast',
                  icon: 'AlertCircle',
                  danger: true,
                  onSelect: () =>
                    notify({
                      title: 'Simulated validation error',
                      description: 'Example error feedback channel for LK forms.',
                      variant: 'error',
                    }),
                },
              ]}
            />

            <LkButton
              variant="secondary"
              leftIcon="Bell"
              onClick={() =>
                notify({
                  title: 'Test Notification',
                  description: `Notifications are ${settings.notificationsEnabled ? 'active' : 'muted in Settings'}.`,
                  variant: 'info',
                })
              }
            >
              Trigger Notification
            </LkButton>
          </div>
        </LkCard>
      )}

      <LkDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="LK Hybrid Glass Dialog"
        description="Accessible modal container with dynamic backdrop blur, Escape dismissal, and focus containment."
        footer={
          <>
            <LkButton variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </LkButton>
            <LkButton
              variant="primary"
              onClick={() => {
                setDialogOpen(false);
                notify({
                  title: 'Dialog confirmed',
                  description: `Target runtime set to ${environment}.`,
                  variant: 'success',
                });
              }}
            >
              Confirm Selection
            </LkButton>
          </>
        }
      >
        <p className="leading-relaxed">
          This dialog automatically inherits the active LK Theme Mode, custom accent color (
          <span className="font-mono" style={{ color: 'var(--lk-accent)' }}>
            {settings.accentColor}
          </span>
          ), and glass blur radius ({settings.blurIntensity}px).
        </p>
      </LkDialog>
    </div>
  );
}
