import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  LkSettings,
  LkStorageStats,
  LkThemePresetId,
  LkToastItem,
} from '../types';
import {
  LK_DENSITY_TOKENS,
  LK_FONT_FAMILY_STACK,
  LK_FONT_SCALE_PX,
  LK_THEME_PRESETS,
} from '../tokens/designTokens';
import { hexToRgba, normalizeHex, pickAccessibleForeground } from '../tokens/contrast';
import {
  clearLkStorage,
  DEFAULT_LK_SETTINGS,
  getLkActivityHistory,
  getLkStorageStats,
  loadLkSettings,
  parseLkSettingsJson,
  recordLkActivity,
  saveLkSettings,
} from '../storage/lkStorage';
import { getLkDictionary, type LkDictionary } from '../i18n/translations';

export interface LkProviderProps {
  children: React.ReactNode;
  /** Optional namespace prefix for localStorage keys so independent LK apps keep isolated preferences */
  storagePrefix?: string;
  /** Optional default settings merged over LK Core defaults when no saved settings exist */
  defaultSettings?: Partial<LkSettings>;
  /** Whether LkProvider should update document.title automatically (default: false for client apps) */
  manageDocumentTitle?: boolean;
  /** Whether settings should persist to browser localStorage (default: true) */
  persistSettings?: boolean;
}

interface LkContextValue {
  settings: LkSettings;
  resolvedTheme: 'dark' | 'light';
  dictionary: LkDictionary;
  toasts: LkToastItem[];
  storageStats: LkStorageStats;
  activityLog: Array<{ label: string; ts: string }>;
  storagePrefix?: string;
  updateSettings: (patch: Partial<LkSettings>, activityLabel?: string) => void;
  applyThemePreset: (presetId: LkThemePresetId) => void;
  resetSettings: () => void;
  importSettingsJson: (jsonText: string) => { ok: boolean; error?: string };
  notify: (toast: Omit<LkToastItem, 'id' | 'createdAt'>) => void;
  dismissToast: (id: string) => void;
  refreshStorageStats: () => void;
}

const LkCoreContext = createContext<LkContextValue | null>(null);

function detectSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function LkProvider({
  children,
  storagePrefix,
  defaultSettings,
  manageDocumentTitle = false,
  persistSettings = true,
}: LkProviderProps) {
  const mergedDefaults = useMemo<LkSettings>(
    () => ({ ...DEFAULT_LK_SETTINGS, ...(defaultSettings ?? {}) }),
    [defaultSettings],
  );

  const [settings, setSettings] = useState<LkSettings>(() =>
    persistSettings ? loadLkSettings(storagePrefix, mergedDefaults) : mergedDefaults,
  );
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(() => detectSystemTheme());
  const [toasts, setToasts] = useState<LkToastItem[]>([]);
  const [storageStats, setStorageStats] = useState<LkStorageStats>(() =>
    persistSettings
      ? getLkStorageStats(storagePrefix)
      : { totalBytes: 0, settingsBytes: 0, historyBytes: 0, keyCount: 0, lastSavedAt: null },
  );
  const [activityLog, setActivityLog] = useState<Array<{ label: string; ts: string }>>(() =>
    persistSettings ? getLkActivityHistory(storagePrefix) : [],
  );

  // Listen to OS theme preference when themeMode is 'system'
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setSystemTheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme: 'dark' | 'light' =
    settings.themeMode === 'system' ? systemTheme : settings.themeMode;

  const dictionary = useMemo(() => getLkDictionary(settings.language), [settings.language]);

  // Apply live CSS custom properties and root classes whenever settings or resolvedTheme change
  useEffect(() => {
    const root = document.documentElement;

    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    root.classList.toggle('lk-no-glass', !settings.glassEnabled);
    root.classList.toggle('lk-high-contrast', settings.highContrast);
    root.classList.toggle('lk-reduced-motion', settings.motionLevel === 'reduced');

    const accent = normalizeHex(settings.accentColor);
    const accentContrast = pickAccessibleForeground(accent);
    const preset = LK_THEME_PRESETS.find((p) => p.id === settings.themePreset);

    const activeBg =
      resolvedTheme === 'dark'
        ? settings.themePreset !== 'custom' && preset
          ? preset.darkBg
          : settings.customDarkBg
        : settings.themePreset !== 'custom' && preset
          ? preset.lightBg
          : settings.customLightBg;

    const activeSurfaceSolid =
      resolvedTheme === 'dark'
        ? preset?.darkSurface ?? '#17191F'
        : preset?.lightSurface ?? '#FFFFFF';

    const surfaceAlpha = settings.glassEnabled ? settings.glassOpacity : 1;
    const surfaceRgba = hexToRgba(activeSurfaceSolid, surfaceAlpha);

    const density = LK_DENSITY_TOKENS[settings.density];
    const baseDurationMs =
      settings.motionLevel === 'reduced'
        ? 0
        : Math.round((settings.motionLevel === 'subtle' ? 140 : 210) / settings.motionSpeed);

    const accentInk =
      resolvedTheme === 'light'
        ? accent === '#D6B56D'
          ? '#8A691E'
          : accent
        : accent;

    root.style.setProperty('--lk-accent', accent);
    root.style.setProperty('--lk-accent-ink', accentInk);
    root.style.setProperty('--lk-accent-contrast', accentContrast);
    root.style.setProperty('--lk-accent-soft', hexToRgba(accent, 0.16));
    root.style.setProperty('--lk-bg', activeBg);
    root.style.setProperty('--lk-surface-solid', activeSurfaceSolid);
    root.style.setProperty('--lk-surface', surfaceRgba);
    root.style.setProperty('--lk-blur', settings.glassEnabled ? `${settings.blurIntensity}px` : '0px');
    root.style.setProperty('--lk-glass-opacity', String(settings.glassOpacity));
    root.style.setProperty(
      '--lk-specular-opacity',
      settings.specularHighlight ? (resolvedTheme === 'dark' ? '0.18' : '0.62') : '0',
    );
    root.style.setProperty('--lk-font-size-base', `${LK_FONT_SCALE_PX[settings.fontScale]}px`);
    root.style.setProperty('--lk-font-sans', LK_FONT_FAMILY_STACK[settings.fontFamily]);
    root.style.setProperty('--lk-density-pad', density.pad);
    root.style.setProperty('--lk-density-gap', density.gap);
    root.style.setProperty('--lk-control-height', density.controlHeight);
    root.style.setProperty('--lk-motion-duration', `${baseDurationMs}ms`);
    root.style.setProperty('--lk-focus-ring-width', settings.enhancedFocusRings ? '2.5px' : '1.5px');
    root.lang = settings.language;

    if (manageDocumentTitle) {
      document.title = dictionary.meta.pageTitle;
    }

    if (persistSettings) {
      saveLkSettings(settings, storagePrefix);
      setStorageStats(getLkStorageStats(storagePrefix));
    }
  }, [settings, resolvedTheme, dictionary, manageDocumentTitle, persistSettings, storagePrefix]);

  const refreshStorageStats = useCallback(() => {
    if (!persistSettings) return;
    setStorageStats(getLkStorageStats(storagePrefix));
    setActivityLog(getLkActivityHistory(storagePrefix));
  }, [persistSettings, storagePrefix]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (toast: Omit<LkToastItem, 'id' | 'createdAt'>) => {
      if (!settings.notificationsEnabled) return;
      if (settings.quietMode && toast.variant === 'info') return;
      const id = `lk-toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const entry: LkToastItem = { ...toast, id, createdAt: Date.now() };
      setToasts((prev) => [entry, ...prev].slice(0, 4));
      setTimeout(() => {
        dismissToast(id);
      }, 4200);
    },
    [settings.notificationsEnabled, settings.quietMode, dismissToast],
  );

  const updateSettings = useCallback(
    (patch: Partial<LkSettings>, activityLabel?: string) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        if (activityLabel && persistSettings) {
          recordLkActivity(activityLabel, next.storeUsageHistory, storagePrefix);
        }
        return next;
      });
      if (persistSettings) {
        setTimeout(() => {
          setActivityLog(getLkActivityHistory(storagePrefix));
          setStorageStats(getLkStorageStats(storagePrefix));
        }, 0);
      }
    },
    [persistSettings, storagePrefix],
  );

  const applyThemePreset = useCallback(
    (presetId: LkThemePresetId) => {
      const preset = LK_THEME_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      const presetMeta = presetId !== 'custom' ? dictionary.presets[presetId] : undefined;
      const presetName = presetMeta?.name ?? preset.name;
      const modeLabel =
        preset.recommendedMode === 'dark' ? dictionary.common.dark : dictionary.common.light;
      updateSettings(
        {
          themePreset: preset.id,
          themeMode: preset.recommendedMode,
          accentColor: preset.accent,
          customDarkBg: preset.darkBg,
          customLightBg: preset.lightBg,
        },
        `${presetName} (${modeLabel.toLowerCase()})`,
      );
      notify({
        title: dictionary.notifications.presetAppliedTitle(presetName),
        description: dictionary.notifications.presetAppliedDesc(modeLabel.toLowerCase(), preset.accent),
        variant: 'success',
      });
    },
    [updateSettings, notify, dictionary],
  );

  const resetSettings = useCallback(() => {
    if (persistSettings) {
      clearLkStorage(storagePrefix);
    }
    setSettings({ ...mergedDefaults });
    setActivityLog([]);
    setStorageStats(
      persistSettings
        ? getLkStorageStats(storagePrefix)
        : { totalBytes: 0, settingsBytes: 0, historyBytes: 0, keyCount: 0, lastSavedAt: null },
    );
    const nextDict = getLkDictionary(mergedDefaults.language);
    notify({
      title: nextDict.notifications.resetTitle,
      description: nextDict.notifications.resetDesc,
      variant: 'info',
    });
  }, [notify, persistSettings, storagePrefix, mergedDefaults]);

  const importSettingsJson = useCallback(
    (jsonText: string) => {
      const parsed = parseLkSettingsJson(jsonText);
      if (!parsed.ok) {
        notify({
          title: dictionary.notifications.importFailedTitle,
          description: parsed.error,
          variant: 'error',
        });
        return { ok: false, error: parsed.error };
      }
      const targetDict = getLkDictionary(parsed.data.language);
      setSettings(parsed.data);
      if (persistSettings) {
        recordLkActivity(
          targetDict.notifications.importSuccessTitle,
          parsed.data.storeUsageHistory,
          storagePrefix,
        );
        setActivityLog(getLkActivityHistory(storagePrefix));
      }
      notify({
        title: targetDict.notifications.importSuccessTitle,
        description: targetDict.notifications.importSuccessDesc,
        variant: 'success',
      });
      return { ok: true };
    },
    [notify, dictionary, persistSettings, storagePrefix],
  );

  const value = useMemo<LkContextValue>(
    () => ({
      settings,
      resolvedTheme,
      dictionary,
      toasts,
      storageStats,
      activityLog,
      storagePrefix,
      updateSettings,
      applyThemePreset,
      resetSettings,
      importSettingsJson,
      notify,
      dismissToast,
      refreshStorageStats,
    }),
    [
      settings,
      resolvedTheme,
      dictionary,
      toasts,
      storageStats,
      activityLog,
      storagePrefix,
      updateSettings,
      applyThemePreset,
      resetSettings,
      importSettingsJson,
      notify,
      dismissToast,
      refreshStorageStats,
    ],
  );

  return <LkCoreContext.Provider value={value}>{children}</LkCoreContext.Provider>;
}

export function useLkCoreOptional(): LkContextValue | null {
  return useContext(LkCoreContext);
}

export function useLkCore(): LkContextValue {
  const ctx = useContext(LkCoreContext);
  if (!ctx) {
    throw new Error('useLkCore must be used within <LkProvider>');
  }
  return ctx;
}

export function useLkTheme() {
  const { settings, resolvedTheme, updateSettings, applyThemePreset } = useLkCore();
  return {
    themeMode: settings.themeMode,
    resolvedTheme,
    themePreset: settings.themePreset,
    accentColor: settings.accentColor,
    updateSettings,
    applyThemePreset,
  };
}

export function useLkSettings() {
  const {
    settings,
    updateSettings,
    resetSettings,
    importSettingsJson,
    storageStats,
    activityLog,
    storagePrefix,
  } = useLkCore();
  return {
    settings,
    updateSettings,
    resetSettings,
    importSettingsJson,
    storageStats,
    activityLog,
    storagePrefix,
  };
}

export function useLkToast() {
  const { toasts, notify, dismissToast } = useLkCore();
  return { toasts, notify, dismissToast };
}
