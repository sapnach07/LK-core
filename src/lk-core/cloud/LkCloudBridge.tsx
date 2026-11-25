import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { LkRemoteIconProvider } from '../icons/LkIconContext';
import { DEFAULT_LK_SETTINGS } from '../storage/lkStorage';
import { LkProvider, useLkCore, type LkProviderProps } from '../themes/LkThemeProvider';
import type { LkSettings, LkThemePresetId } from '../types';
import {
  computeCloudSettingsPatch,
  loadCloudBaseline,
  resolveLkCloudCacheKeys,
  saveCloudBaseline,
} from './cloudCache';
import { createLkSyncEngine, type LkSyncEngine, type LkSyncSnapshot } from './syncEngine';
import type { LkCloudClientConfig, LkCloudContextValue } from './types';

const LkCloudContext = createContext<LkCloudContextValue | null>(null);

export interface LkCloudBridgeProps {
  config: LkCloudClientConfig;
  /** Optional app-level defaultSettings passed to <LkProvider> so Cloud diffing avoids false overrides */
  appDefaultSettings?: Partial<LkSettings>;
  children: React.ReactNode;
}

/**
 * Independent Cloud integration bridge.
 * Must be rendered inside <LkProvider>; never alters <LkProvider> when unused.
 */
export function LkCloudBridge({ config, appDefaultSettings, children }: LkCloudBridgeProps) {
  const { settings, updateSettings, storagePrefix } = useLkCore();
  const effectiveStoragePrefix = config.storagePrefix ?? storagePrefix;

  const normalizedConfig = useMemo<LkCloudClientConfig>(
    () => ({
      ...config,
      storagePrefix: effectiveStoragePrefix,
    }),
    [config, effectiveStoragePrefix],
  );

  const coreDefaults = useMemo<LkSettings>(
    () => ({ ...DEFAULT_LK_SETTINGS, ...(appDefaultSettings ?? {}) }),
    [appDefaultSettings],
  );

  const identityKey = `${normalizedConfig.appId}|${normalizedConfig.endpointUrl}|${Boolean(normalizedConfig.allowInsecureLocalhost)}|${normalizedConfig.storagePrefix ?? ''}`;

  const engineEntryRef = useRef<{ identityKey: string; engine: LkSyncEngine } | null>(null);
  if (!engineEntryRef.current) {
    engineEntryRef.current = {
      identityKey,
      engine: createLkSyncEngine(normalizedConfig),
    };
  }

  const [engine, setEngine] = useState<LkSyncEngine>(() => engineEntryRef.current!.engine);
  const [snapshot, setSnapshot] = useState<LkSyncSnapshot>(() => engineEntryRef.current!.engine.getSnapshot());
  const appliedCssKeysRef = useRef<string[]>([]);
  const lastAppliedReleaseRef = useRef<string | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const latestConfigRef = useRef(normalizedConfig);
  latestConfigRef.current = normalizedConfig;

  // Recreate engine only in effect when identity fields change (StrictMode-safe; zero render side-effects)
  useEffect(() => {
    if (engineEntryRef.current && engineEntryRef.current.identityKey === identityKey) {
      setEngine(engineEntryRef.current.engine);
      return;
    }
    const nextEngine = createLkSyncEngine(latestConfigRef.current);
    engineEntryRef.current = { identityKey, engine: nextEngine };
    lastAppliedReleaseRef.current = null;
    setEngine(nextEngine);
    setSnapshot(nextEngine.getSnapshot());
  }, [identityKey]);

  // Manage subscription & lifecycle cleanly under React StrictMode double-effects
  useEffect(() => {
    const unsubscribe = engine.subscribe((nextSnap) => {
      setSnapshot(nextSnap);
    });
    setSnapshot(engine.getSnapshot());
    engine.start();
    return () => {
      unsubscribe();
      engine.stop();
    };
  }, [engine]);

  // Propagate dynamic changes (trustedPublicKeys, autoSync, allowedPermissions, sdkVersion, etc.)
  useEffect(() => {
    void engine.updateConfig(normalizedConfig);
  }, [engine, normalizedConfig]);

  // Apply Cloud CSS custom properties and user-safe settings defaults when activeBundle updates
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const rootStyle = document.documentElement.style;
      for (const prevVar of appliedCssKeysRef.current) {
        rootStyle.removeProperty(prevVar);
      }
      const nextEntries = Object.entries(snapshot.sanitizedCssVariables);
      for (const [varName, varVal] of nextEntries) {
        rootStyle.setProperty(varName, varVal);
      }
      appliedCssKeysRef.current = nextEntries.map(([name]) => name);
    }

    const bundle = snapshot.activeBundle;
    if (!bundle) {
      lastAppliedReleaseRef.current = null;
      return;
    }

    const releaseKey = `${bundle.manifest.releaseId}:${bundle.manifest.bundleVersion}`;
    if (lastAppliedReleaseRef.current === releaseKey) {
      return;
    }
    lastAppliedReleaseRef.current = releaseKey;

    const cacheKeys = resolveLkCloudCacheKeys(config.appId, effectiveStoragePrefix);
    const prevBaseline = loadCloudBaseline(cacheKeys);
    const { patch, nextBaseline } = computeCloudSettingsPatch(
      settingsRef.current,
      prevBaseline,
      bundle.payload.settingsDefaults,
      coreDefaults,
    );
    saveCloudBaseline(cacheKeys, nextBaseline);

    if (Object.keys(patch).length > 0) {
      updateSettings(patch);
    }
  }, [
    snapshot.activeBundle,
    snapshot.sanitizedCssVariables,
    config.appId,
    effectiveStoragePrefix,
    coreDefaults,
    updateSettings,
  ]);

  // Clean up injected CSS vars if LkCloudBridge unmounts
  useEffect(() => {
    return () => {
      if (typeof document === 'undefined') return;
      const rootStyle = document.documentElement.style;
      for (const varName of appliedCssKeysRef.current) {
        rootStyle.removeProperty(varName);
      }
      appliedCssKeysRef.current = [];
    };
  }, []);

  const themePresets = useMemo(
    () => snapshot.activeBundle?.payload.themePresets ?? [],
    [snapshot.activeBundle],
  );

  const applyCloudThemePreset = useCallback(
    (presetId: LkThemePresetId): boolean => {
      const target = themePresets.find((preset) => preset.id === presetId);
      if (!target) return false;
      updateSettings({
        themePreset: target.id,
        themeMode: target.recommendedMode,
        accentColor: target.accent,
        customDarkBg: target.darkBg,
        customLightBg: target.lightBg,
      });
      return true;
    },
    [themePresets, updateSettings],
  );

  const value = useMemo<LkCloudContextValue>(
    () => ({
      state: snapshot.state,
      activeBundle: snapshot.activeBundle,
      validatedIcons: snapshot.validatedIcons,
      themePresets,
      chartsConfig: snapshot.activeBundle?.payload.charts ?? null,
      platformConfig: snapshot.activeBundle?.payload.platform ?? null,
      applyCloudThemePreset,
      syncNow: (options) => engine.syncNow(options),
      pairWithCode: (code) => engine.pairWithCode(code),
      disconnectCloud: () => engine.disconnect(),
    }),
    [snapshot, engine, themePresets, applyCloudThemePreset],
  );

  return (
    <LkCloudContext.Provider value={value}>
      <LkRemoteIconProvider icons={snapshot.validatedIcons}>{children}</LkRemoteIconProvider>
    </LkCloudContext.Provider>
  );
}

export interface LkCloudProviderProps extends Omit<LkProviderProps, 'children'> {
  config: LkCloudClientConfig;
  children: React.ReactNode;
}

/**
 * Convenience wrapper combining <LkProvider> and <LkCloudBridge> without altering LkThemeProvider.
 */
export function LkCloudProvider({
  config,
  children,
  storagePrefix,
  defaultSettings,
  manageDocumentTitle,
  persistSettings,
}: LkCloudProviderProps) {
  return (
    <LkProvider
      storagePrefix={storagePrefix ?? config.storagePrefix}
      defaultSettings={defaultSettings}
      manageDocumentTitle={manageDocumentTitle}
      persistSettings={persistSettings}
    >
      <LkCloudBridge config={config} appDefaultSettings={defaultSettings}>
        {children}
      </LkCloudBridge>
    </LkProvider>
  );
}

export function useLkCloudOptional(): LkCloudContextValue | null {
  return useContext(LkCloudContext);
}

export function useLkCloud(): LkCloudContextValue {
  const ctx = useContext(LkCloudContext);
  if (!ctx) {
    throw new Error('useLkCloud must be used within <LkCloudBridge> or <LkCloudProvider>');
  }
  return ctx;
}
