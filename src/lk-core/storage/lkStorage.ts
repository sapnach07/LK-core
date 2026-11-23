import type { LkSettings, LkStorageStats } from '../types';
import { normalizeHex } from '../tokens/contrast';

export const LK_STORAGE_KEY = 'lk_core_preferences_v1';
export const LK_STORAGE_META_KEY = 'lk_core_meta_v1';
export const LK_STORAGE_HISTORY_KEY = 'lk_core_activity_v1';

export interface LkStorageKeys {
  settings: string;
  meta: string;
  history: string;
}

export function resolveLkStorageKeys(storagePrefix?: string): LkStorageKeys {
  const cleanPrefix = storagePrefix?.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  if (!cleanPrefix || cleanPrefix === 'lk_core') {
    return {
      settings: LK_STORAGE_KEY,
      meta: LK_STORAGE_META_KEY,
      history: LK_STORAGE_HISTORY_KEY,
    };
  }
  return {
    settings: `${cleanPrefix}_preferences_v1`,
    meta: `${cleanPrefix}_meta_v1`,
    history: `${cleanPrefix}_activity_v1`,
  };
}

export const DEFAULT_LK_SETTINGS: LkSettings = {
  themeMode: 'dark',
  themePreset: 'obsidian-gold',
  accentColor: '#D6B56D',
  customDarkBg: '#090A0D',
  customLightBg: '#F5F6F8',

  glassEnabled: true,
  blurIntensity: 18,
  glassOpacity: 0.76,
  specularHighlight: true,

  motionLevel: 'full',
  motionSpeed: 1,

  fontScale: 'standard',
  fontFamily: 'jakarta',
  density: 'comfortable',
  highContrast: false,
  enhancedFocusRings: true,

  notificationsEnabled: true,
  quietMode: false,
  visualCuesEnabled: true,

  language: 'fr',
  timeFormat: '24h',
  numberFormat: 'US',

  localOnlyMode: true,
  storeUsageHistory: true,
  diagnosticsEnabled: false,
};

const VALID_THEME_MODES = new Set(['dark', 'light', 'system']);
const VALID_PRESETS = new Set([
  'obsidian-gold',
  'graphite-silver',
  'arctic-frost',
  'midnight-cobalt',
  'custom',
]);
const VALID_MOTION_LEVELS = new Set(['full', 'subtle', 'reduced']);
const VALID_MOTION_SPEEDS = new Set([0.5, 1, 1.5]);
const VALID_FONT_SCALES = new Set(['compact', 'standard', 'large']);
const VALID_FONT_FAMILIES = new Set(['jakarta', 'manrope', 'system']);
const VALID_DENSITIES = new Set(['compact', 'comfortable', 'spacious']);
const VALID_LANGUAGES = new Set(['en', 'es', 'fr', 'de']);
const VALID_TIME_FORMATS = new Set(['12h', '24h']);
const VALID_NUMBER_FORMATS = new Set(['US', 'EU']);

export function sanitizeLkSettings(
  raw: unknown,
  defaults: LkSettings = DEFAULT_LK_SETTINGS,
): LkSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...defaults };
  }
  const input = raw as Record<string, unknown>;

  const blur =
    typeof input.blurIntensity === 'number' && Number.isFinite(input.blurIntensity)
      ? Math.max(0, Math.min(32, Math.round(input.blurIntensity)))
      : defaults.blurIntensity;

  const opacity =
    typeof input.glassOpacity === 'number' && Number.isFinite(input.glassOpacity)
      ? Math.max(0.35, Math.min(0.95, Math.round(input.glassOpacity * 100) / 100))
      : defaults.glassOpacity;

  return {
    themeMode: VALID_THEME_MODES.has(String(input.themeMode))
      ? (input.themeMode as LkSettings['themeMode'])
      : defaults.themeMode,
    themePreset: VALID_PRESETS.has(String(input.themePreset))
      ? (input.themePreset as LkSettings['themePreset'])
      : defaults.themePreset,
    accentColor:
      typeof input.accentColor === 'string'
        ? normalizeHex(input.accentColor, defaults.accentColor)
        : defaults.accentColor,
    customDarkBg:
      typeof input.customDarkBg === 'string'
        ? normalizeHex(input.customDarkBg, defaults.customDarkBg)
        : defaults.customDarkBg,
    customLightBg:
      typeof input.customLightBg === 'string'
        ? normalizeHex(input.customLightBg, defaults.customLightBg)
        : defaults.customLightBg,

    glassEnabled:
      typeof input.glassEnabled === 'boolean'
        ? input.glassEnabled
        : defaults.glassEnabled,
    blurIntensity: blur,
    glassOpacity: opacity,
    specularHighlight:
      typeof input.specularHighlight === 'boolean'
        ? input.specularHighlight
        : defaults.specularHighlight,

    motionLevel: VALID_MOTION_LEVELS.has(String(input.motionLevel))
      ? (input.motionLevel as LkSettings['motionLevel'])
      : defaults.motionLevel,
    motionSpeed: VALID_MOTION_SPEEDS.has(Number(input.motionSpeed))
      ? (Number(input.motionSpeed) as LkSettings['motionSpeed'])
      : defaults.motionSpeed,

    fontScale: VALID_FONT_SCALES.has(String(input.fontScale))
      ? (input.fontScale as LkSettings['fontScale'])
      : defaults.fontScale,
    fontFamily: VALID_FONT_FAMILIES.has(String(input.fontFamily))
      ? (input.fontFamily as LkSettings['fontFamily'])
      : defaults.fontFamily,
    density: VALID_DENSITIES.has(String(input.density))
      ? (input.density as LkSettings['density'])
      : defaults.density,
    highContrast:
      typeof input.highContrast === 'boolean'
        ? input.highContrast
        : defaults.highContrast,
    enhancedFocusRings:
      typeof input.enhancedFocusRings === 'boolean'
        ? input.enhancedFocusRings
        : defaults.enhancedFocusRings,

    notificationsEnabled:
      typeof input.notificationsEnabled === 'boolean'
        ? input.notificationsEnabled
        : defaults.notificationsEnabled,
    quietMode:
      typeof input.quietMode === 'boolean' ? input.quietMode : defaults.quietMode,
    visualCuesEnabled:
      typeof input.visualCuesEnabled === 'boolean'
        ? input.visualCuesEnabled
        : defaults.visualCuesEnabled,

    language: VALID_LANGUAGES.has(String(input.language))
      ? (input.language as LkSettings['language'])
      : defaults.language,
    timeFormat: VALID_TIME_FORMATS.has(String(input.timeFormat))
      ? (input.timeFormat as LkSettings['timeFormat'])
      : defaults.timeFormat,
    numberFormat: VALID_NUMBER_FORMATS.has(String(input.numberFormat))
      ? (input.numberFormat as LkSettings['numberFormat'])
      : defaults.numberFormat,

    localOnlyMode:
      typeof input.localOnlyMode === 'boolean'
        ? input.localOnlyMode
        : defaults.localOnlyMode,
    storeUsageHistory:
      typeof input.storeUsageHistory === 'boolean'
        ? input.storeUsageHistory
        : defaults.storeUsageHistory,
    diagnosticsEnabled:
      typeof input.diagnosticsEnabled === 'boolean'
        ? input.diagnosticsEnabled
        : defaults.diagnosticsEnabled,
  };
}

export function parseLkSettingsJson(jsonString: string): { ok: true; data: LkSettings } | { ok: false; error: string } {
  try {
    const parsed: unknown = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, error: 'Le fichier de configuration doit contenir un objet JSON valide.' };
    }
    return { ok: true, data: sanitizeLkSettings(parsed) };
  } catch {
    return { ok: false, error: 'Syntaxe JSON invalide dans le fichier de configuration.' };
  }
}

export function loadLkSettings(
  storagePrefix?: string,
  defaults: LkSettings = DEFAULT_LK_SETTINGS,
): LkSettings {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...defaults };
  }
  const keys = resolveLkStorageKeys(storagePrefix);
  try {
    const raw = window.localStorage.getItem(keys.settings);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeLkSettings(parsed, defaults);
  } catch {
    return { ...defaults };
  }
}

export function saveLkSettings(settings: LkSettings, storagePrefix?: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const keys = resolveLkStorageKeys(storagePrefix);
  try {
    const clean = sanitizeLkSettings(settings);
    window.localStorage.setItem(keys.settings, JSON.stringify(clean));
    window.localStorage.setItem(
      keys.meta,
      JSON.stringify({ lastSavedAt: new Date().toISOString(), version: '1.0.0' }),
    );
  } catch {
    // Ignore storage quota errors safely
  }
}

export function recordLkActivity(
  eventLabel: string,
  enabled: boolean,
  storagePrefix?: string,
): void {
  if (!enabled || typeof window === 'undefined' || !window.localStorage) return;
  const keys = resolveLkStorageKeys(storagePrefix);
  try {
    const existingRaw = window.localStorage.getItem(keys.history);
    const existing = existingRaw ? (JSON.parse(existingRaw) as Array<{ label: string; ts: string }>) : [];
    const next = [{ label: eventLabel, ts: new Date().toISOString() }, ...existing].slice(0, 12);
    window.localStorage.setItem(keys.history, JSON.stringify(next));
  } catch {
    // Ignore
  }
}

export function getLkActivityHistory(storagePrefix?: string): Array<{ label: string; ts: string }> {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  const keys = resolveLkStorageKeys(storagePrefix);
  try {
    const raw = window.localStorage.getItem(keys.history);
    return raw ? (JSON.parse(raw) as Array<{ label: string; ts: string }>) : [];
  } catch {
    return [];
  }
}

export function clearLkStorage(storagePrefix?: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const keys = resolveLkStorageKeys(storagePrefix);
  window.localStorage.removeItem(keys.settings);
  window.localStorage.removeItem(keys.meta);
  window.localStorage.removeItem(keys.history);
}

export function calculateUtf8Bytes(text: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text).length;
  }
  return text.length * 2;
}

export function getLkStorageStats(storagePrefix?: string): LkStorageStats {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      totalBytes: 0,
      settingsBytes: 0,
      historyBytes: 0,
      keyCount: 0,
      lastSavedAt: null,
    };
  }
  const keys = resolveLkStorageKeys(storagePrefix);
  const settingsRaw = window.localStorage.getItem(keys.settings) || '';
  const historyRaw = window.localStorage.getItem(keys.history) || '';
  const metaRaw = window.localStorage.getItem(keys.meta) || '';

  let lastSavedAt: string | null = null;
  if (metaRaw) {
    try {
      const parsed = JSON.parse(metaRaw) as { lastSavedAt?: string };
      lastSavedAt = parsed.lastSavedAt ?? null;
    } catch {
      lastSavedAt = null;
    }
  }

  const settingsBytes = settingsRaw ? calculateUtf8Bytes(settingsRaw) : 0;
  const historyBytes = historyRaw ? calculateUtf8Bytes(historyRaw) : 0;
  const metaBytes = metaRaw ? calculateUtf8Bytes(metaRaw) : 0;
  const keyCount = [settingsRaw, historyRaw, metaRaw].filter(Boolean).length;

  return {
    totalBytes: settingsBytes + historyBytes + metaBytes,
    settingsBytes,
    historyBytes,
    keyCount,
    lastSavedAt,
  };
}

/**
 * Isolated, typed local persistence helper for client applications (e.g. LK Manage)
 * so business state never collides with LK Core preferences or other apps.
 */
export function createLkStore<T>(
  storageKey: string,
  fallbackValue: T,
  validate?: (raw: unknown) => T,
) {
  const safeParse = (rawText: string): T => {
    try {
      const parsed: unknown = JSON.parse(rawText);
      return validate ? validate(parsed) : (parsed as T);
    } catch {
      return fallbackValue;
    }
  };

  return {
    key: storageKey,
    load(): T {
      if (typeof window === 'undefined' || !window.localStorage) return fallbackValue;
      const raw = window.localStorage.getItem(storageKey);
      return raw ? safeParse(raw) : fallbackValue;
    },
    save(value: T): void {
      if (typeof window === 'undefined' || !window.localStorage) return;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
      } catch {
        // Ignore quota exceeded errors safely
      }
    },
    clear(): void {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.removeItem(storageKey);
    },
  };
}
