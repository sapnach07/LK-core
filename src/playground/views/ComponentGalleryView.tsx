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
  const { notify, settings, dictionary, updateSettings } = useLkCore();
  const c = dictionary.components;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const [projectName, setProjectName] = useState(c.appNameDefault);
  const [apiSecretInput, setApiSecretInput] = useState('lk_preview_token_example');
  const [environment, setEnvironment] = useState<'react' | 'kotlin' | 'hybrid'>('react');
  const [segmentTab, setSegmentTab] = useState<'all' | 'forms' | 'overlays'>('all');
  const [autoSync, setAutoSync] = useState(true);
  const [radiusSample, setRadiusSample] = useState(16);

  const nameError = projectName.trim().length < 3 ? c.appNameError : undefined;

  const triggerLoading = () => {
    setLoadingDemo(true);
    setTimeout(() => {
      setLoadingDemo(false);
      notify({
        title: c.btnPrimary,
        description: c.buttonsCardSubtitle,
        variant: 'success',
      });
    }, 900);
  };

  const densityLabel =
    settings.density === 'compact'
      ? dictionary.common.compact
      : settings.density === 'spacious'
        ? dictionary.common.spacious
        : dictionary.common.comfortable;

  const fontScaleLabel =
    settings.fontScale === 'compact'
      ? dictionary.common.compact
      : settings.fontScale === 'large'
        ? dictionary.common.large
        : dictionary.common.standard;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--lk-text)' }}>
            {c.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--lk-text-secondary)' }}>
            {c.subtitle}
          </p>
        </div>
        <LkSegmentedControl
          ariaLabel={c.filterAria}
          value={segmentTab}
          onChange={setSegmentTab}
          options={[
            { value: 'all', label: c.tabs.all },
            { value: 'forms', label: c.tabs.forms },
            { value: 'overlays', label: c.tabs.overlays },
          ]}
        />
      </div>

      {(segmentTab === 'all' || segmentTab === 'forms') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Buttons Showcase */}
          <LkCard title={c.buttonsCardTitle} subtitle={c.buttonsCardSubtitle}>
            <div className="flex flex-wrap gap-3">
              <LkButton
                variant="primary"
                leftIcon="Check"
                onClick={() =>
                  notify({
                    title: c.btnPrimary,
                    description: c.buttonsCardSubtitle,
                    variant: 'info',
                  })
                }
              >
                {c.btnPrimary}
              </LkButton>
              <LkButton
                variant="secondary"
                leftIcon="Copy"
                onClick={() =>
                  notify({
                    title: c.btnSecondary,
                    description: c.buttonsCardSubtitle,
                    variant: 'info',
                  })
                }
              >
                {c.btnSecondary}
              </LkButton>
              <LkButton
                variant="glass"
                leftIcon="Wand2"
                onClick={() =>
                  notify({
                    title: c.btnGlass,
                    description: c.buttonsCardSubtitle,
                    variant: 'success',
                  })
                }
              >
                {c.btnGlass}
              </LkButton>
              <LkButton
                variant="ghost"
                onClick={() =>
                  notify({
                    title: c.btnGhost,
                    description: c.buttonsCardSubtitle,
                    variant: 'info',
                  })
                }
              >
                {c.btnGhost}
              </LkButton>
              <LkButton
                variant="danger"
                leftIcon="Trash2"
                onClick={() =>
                  notify({
                    title: c.btnDanger,
                    description: c.buttonsCardSubtitle,
                    variant: 'warning',
                  })
                }
              >
                {c.btnDanger}
              </LkButton>
            </div>

            <div
              className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t"
              style={{ borderColor: 'var(--lk-border)' }}
            >
              <LkButton size="sm" variant="secondary" onClick={triggerLoading} loading={loadingDemo}>
                {loadingDemo ? dictionary.common.loading : c.btnTestLoading}
              </LkButton>
              <LkButton size="md" variant="primary" disabled>
                {c.btnDisabled}
              </LkButton>
            </div>
          </LkCard>

          {/* Form Inputs & Validation */}
          <LkCard title={c.inputsCardTitle} subtitle={c.inputsCardSubtitle}>
            <div className="flex flex-col gap-4">
              <LkInput
                label={c.appNameLabel}
                leftIcon="Folder"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                errorText={nameError}
                helperText={!nameError ? c.appNameHelper : undefined}
              />
              <LkInput
                label={c.signingKeyLabel}
                type="password"
                leftIcon="Lock"
                allowPasswordToggle
                showPasswordLabel={dictionary.common.showPassword}
                hidePasswordLabel={dictionary.common.hidePassword}
                value={apiSecretInput}
                onChange={(e) => setApiSecretInput(e.target.value)}
              />
              <LkSelect
                label={c.runtimeLabel}
                value={environment}
                onChange={setEnvironment}
                options={[
                  { value: 'react', label: c.runtimeOptions.react },
                  { value: 'kotlin', label: c.runtimeOptions.kotlin },
                  { value: 'hybrid', label: c.runtimeOptions.hybrid },
                ]}
              />
            </div>
          </LkCard>

          {/* Switches, Sliders & Segmented Controls */}
          <LkCard title={c.togglesCardTitle} subtitle={c.togglesCardSubtitle}>
            <div className="flex flex-col gap-4">
              <LkSwitch
                label={c.autoSyncLabel}
                description={c.autoSyncDesc}
                checked={autoSync}
                onChange={(next) => {
                  setAutoSync(next);
                  notify({
                    title: c.autoSyncLabel,
                    description: next ? dictionary.common.active : dictionary.common.disabled,
                    variant: 'info',
                  });
                }}
              />
              <LkSwitch
                label={c.specularLabel}
                description={c.specularDesc}
                checked={settings.specularHighlight}
                onChange={(next) =>
                  updateSettings(
                    { specularHighlight: next },
                    `${c.specularLabel}: ${next ? dictionary.common.active : dictionary.common.disabled}`,
                  )
                }
              />
              <div className="pt-2">
                <LkSlider
                  label={c.radiusSliderLabel}
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
                  <span>{c.radiusPreviewLabel}</span>
                  <span className="font-mono tabular-nums" style={{ color: 'var(--lk-accent-ink)' }}>
                    {radiusSample}px
                  </span>
                </div>
              </div>
            </div>
          </LkCard>

          {/* Cards & Tabular Tokens */}
          <LkCard title={c.surfacesCardTitle} subtitle={c.surfacesCardSubtitle}>
            <div className="divide-y" style={{ borderColor: 'var(--lk-border)' }}>
              {[
                { token: '--lk-accent', value: settings.accentColor, role: c.tokenRoles.accent },
                { token: '--lk-blur', value: `${settings.blurIntensity}px`, role: c.tokenRoles.blur },
                { token: '--lk-density-pad', value: densityLabel, role: c.tokenRoles.density },
                { token: '--lk-font-scale', value: fontScaleLabel, role: c.tokenRoles.fontScale },
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
                    style={{ color: 'var(--lk-accent-ink)' }}
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
        <LkCard title={c.overlaysCardTitle} subtitle={c.overlaysCardSubtitle}>
          <div className="flex flex-wrap items-center gap-3">
            <LkButton variant="primary" leftIcon="Layers" onClick={() => setDialogOpen(true)}>
              {c.openDialogBtn}
            </LkButton>

            <LkDropdown
              triggerLabel={c.dropdownLabel}
              triggerIcon="Menu"
              items={[
                {
                  id: 'toast-success',
                  label: c.menuSuccess,
                  icon: 'CheckCircle2',
                  onSelect: () =>
                    notify({
                      title: dictionary.toastVariants.success,
                      description: c.menuSuccess,
                      variant: 'success',
                    }),
                },
                {
                  id: 'toast-warning',
                  label: c.menuWarning,
                  icon: 'AlertTriangle',
                  onSelect: () =>
                    notify({
                      title: dictionary.toastVariants.warning,
                      description: c.menuWarning,
                      variant: 'warning',
                    }),
                },
                {
                  id: 'toast-error',
                  label: c.menuError,
                  icon: 'AlertCircle',
                  danger: true,
                  onSelect: () =>
                    notify({
                      title: dictionary.toastVariants.error,
                      description: c.menuError,
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
                  title: dictionary.actions.testToast,
                  description: settings.notificationsEnabled
                    ? dictionary.settings.inAppNotifDesc
                    : dictionary.common.disabled,
                  variant: 'info',
                })
              }
            >
              {c.triggerNotifBtn}
            </LkButton>
          </div>
        </LkCard>
      )}

      <LkDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={c.dialogTitle}
        description={c.dialogDesc}
        closeLabel={dictionary.common.closeDialog}
        footer={
          <>
            <LkButton variant="ghost" onClick={() => setDialogOpen(false)}>
              {dictionary.common.cancel}
            </LkButton>
            <LkButton
              variant="primary"
              onClick={() => {
                setDialogOpen(false);
                notify({
                  title: c.dialogConfirm,
                  description: `${c.runtimeLabel}: ${c.runtimeOptions[environment]}`,
                  variant: 'success',
                });
              }}
            >
              {c.dialogConfirm}
            </LkButton>
          </>
        }
      >
        <p className="leading-relaxed">
          {c.dialogBodyPrefix}
          <span className="font-mono" style={{ color: 'var(--lk-accent-ink)' }}>
            {settings.accentColor}
          </span>
          {c.dialogBodyMiddle}
          {settings.blurIntensity}px).
        </p>
      </LkDialog>
    </div>
  );
}
