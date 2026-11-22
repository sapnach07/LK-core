import type { LkSettings, LkStorageStats } from '../types';
import { normalizeHex } from '../tokens/contrast';

export const LK_STORAGE_KEY = 'lk_core_preferences_v1';
export const LK_STORAGE_META_KEY = 'lk_core_meta_v1';
export const LK_STORAGE_HISTORY_KEY = 'lk_core_activity_v1';

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

  language: 'en',
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

export function sanitizeLkSettings(raw: unknown): LkSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_LK_SETTINGS };
  }
  const input = raw as Record<string, unknown>;

  const blur =
    typeof input.blurIntensity === 'number' && Number.isFinite(input.blurIntensity)
      ? Math.max(0, Math.min(32, Math.round(input.blurIntensity)))
      : DEFAULT_LK_SETTINGS.blurIntensity;

  const opacity =
    typeof input.glassOpacity === 'number' && Number.isFinite(input.glassOpacity)
      ? Math.max(0.35, Math.min(0.95, Math.round(input.glassOpacity * 100) / 100))
      : DEFAULT_LK_SETTINGS.glassOpacity;

  return {
    themeMode: VALID_THEME_MODES.has(String(input.themeMode))
      ? (input.themeMode as LkSettings['themeMode'])
      : DEFAULT_LK_SETTINGS.themeMode,
    themePreset: VALID_PRESETS.has(String(input.themePreset))
      ? (input.themePreset as LkSettings['themePreset'])
      : DEFAULT_LK_SETTINGS.themePreset,
    accentColor:
      typeof input.accentColor === 'string'
        ? normalizeHex(input.accentColor, DEFAULT_LK_SETTINGS.accentColor)
        : DEFAULT_LK_SETTINGS.accentColor,
    customDarkBg:
      typeof input.customDarkBg === 'string'
        ? normalizeHex(input.customDarkBg, DEFAULT_LK_SETTINGS.customDarkBg)
        : DEFAULT_LK_SETTINGS.customDarkBg,
    customLightBg:
      typeof input.customLightBg === 'string'
        ? normalizeHex(input.customLightBg, DEFAULT_LK_SETTINGS.customLightBg)
        : DEFAULT_LK_SETTINGS.customLightBg,

    glassEnabled:
      typeof input.glassEnabled === 'boolean'
        ? input.glassEnabled
        : DEFAULT_LK_SETTINGS.glassEnabled,
    blurIntensity: blur,
    glassOpacity: opacity,
    specularHighlight:
      typeof input.specularHighlight === 'boolean'
        ? input.specularHighlight
        : DEFAULT_LK_SETTINGS.specularHighlight,

    motionLevel: VALID_MOTION_LEVELS.has(String(input.motionLevel))
      ? (input.motionLevel as LkSettings['motionLevel'])
      : DEFAULT_LK_SETTINGS.motionLevel,
    motionSpeed: VALID_MOTION_SPEEDS.has(Number(input.motionSpeed))
      ? (Number(input.motionSpeed) as LkSettings['motionSpeed'])
      : DEFAULT_LK_SETTINGS.motionSpeed,

    fontScale: VALID_FONT_SCALES.has(String(input.fontScale))
      ? (input.fontScale as LkSettings['fontScale'])
      : DEFAULT_LK_SETTINGS.fontScale,
    fontFamily: VALID_FONT_FAMILIES.has(String(input.fontFamily))
      ? (input.fontFamily as LkSettings['fontFamily'])
      : DEFAULT_LK_SETTINGS.fontFamily,
    density: VALID_DENSITIES.has(String(input.density))
      ? (input.density as LkSettings['density'])
      : DEFAULT_LK_SETTINGS.density,
    highContrast:
      typeof input.highContrast === 'boolean'
        ? input.highContrast
        : DEFAULT_LK_SETTINGS.highContrast,
    enhancedFocusRings:
      typeof input.enhancedFocusRings === 'boolean'
        ? input.enhancedFocusRings
        : DEFAULT_LK_SETTINGS.enhancedFocusRings,

    notificationsEnabled:
      typeof input.notificationsEnabled === 'boolean'
        ? input.notificationsEnabled
        : DEFAULT_LK_SETTINGS.notificationsEnabled,
    quietMode:
      typeof input.quietMode === 'boolean' ? input.quietMode : DEFAULT_LK_SETTINGS.quietMode,
    visualCuesEnabled:
      typeof input.visualCuesEnabled === 'boolean'
        ? input.visualCuesEnabled
        : DEFAULT_LK_SETTINGS.visualCuesEnabled,

    language: VALID_LANGUAGES.has(String(input.language))
      ? (input.language as LkSettings['language'])
      : DEFAULT_LK_SETTINGS.language,
    timeFormat: VALID_TIME_FORMATS.has(String(input.timeFormat))
      ? (input.timeFormat as LkSettings['timeFormat'])
      : DEFAULT_LK_SETTINGS.timeFormat,
    numberFormat: VALID_NUMBER_FORMATS.has(String(input.numberFormat))
      ? (input.numberFormat as LkSettings['numberFormat'])
      : DEFAULT_LK_SETTINGS.numberFormat,

    localOnlyMode:
      typeof input.localOnlyMode === 'boolean'
        ? input.localOnlyMode
        : DEFAULT_LK_SETTINGS.localOnlyMode,
    storeUsageHistory:
      typeof input.storeUsageHistory === 'boolean'
        ? input.storeUsageHistory
        : DEFAULT_LK_SETTINGS.storeUsageHistory,
    diagnosticsEnabled:
      typeof input.diagnosticsEnabled === 'boolean'
        ? input.diagnosticsEnabled
        : DEFAULT_LK_SETTINGS.diagnosticsEnabled,
  };
}

export function parseLkSettingsJson(jsonString: string): { ok: true; data: LkSettings } | { ok: false; error: string } {
  try {
    const parsed: unknown = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, error: 'Configuration payload must be a JSON object.' };
    }
    return { ok: true, data: sanitizeLkSettings(parsed) };
  } catch {
    return { ok: false, error: 'Invalid JSON syntax in configuration file.' };
  }
}

export function loadLkSettings(): LkSettings {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_LK_SETTINGS };
  }
  try {
    const raw = window.localStorage.getItem(LK_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LK_SETTINGS };
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeLkSettings(parsed);
  } catch {
    return { ...DEFAULT_LK_SETTINGS };
  }
}

export function saveLkSettings(settings: LkSettings): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const clean = sanitizeLkSettings(settings);
    window.localStorage.setItem(LK_STORAGE_KEY, JSON.stringify(clean));
    window.localStorage.setItem(
      LK_STORAGE_META_KEY,
      JSON.stringify({ lastSavedAt: new Date().toISOString(), version: '1.0.0' }),
    );
  } catch {
    // Ignore storage quota errors safely
  }
}

export function recordLkActivity(eventLabel: string, enabled: boolean): void {
  if (!enabled || typeof window === 'undefined' || !window.localStorage) return;
  try {
    const existingRaw = window.localStorage.getItem(LK_STORAGE_HISTORY_KEY);
    const existing = existingRaw ? (JSON.parse(existingRaw) as Array<{ label: string; ts: string }>) : [];
    const next = [{ label: eventLabel, ts: new Date().toISOString() }, ...existing].slice(0, 12);
    window.localStorage.setItem(LK_STORAGE_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Ignore
  }
}

export function getLkActivityHistory(): Array<{ label: string; ts: string }> {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(LK_STORAGE_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as Array<{ label: string; ts: string }>) : [];
  } catch {
    return [];
  }
}

export function clearLkStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.removeItem(LK_STORAGE_KEY);
  window.localStorage.removeItem(LK_STORAGE_META_KEY);
  window.localStorage.removeItem(LK_STORAGE_HISTORY_KEY);
}

export function calculateUtf8Bytes(text: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text).length;
  }
  return text.length * 2;
}

export function getLkStorageStats(): LkStorageStats {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      totalBytes: 0,
      settingsBytes: 0,
      historyBytes: 0,
      keyCount: 0,
      lastSavedAt: null,
    };
  }
  const settingsRaw = window.localStorage.getItem(LK_STORAGE_KEY) || '';
  const historyRaw = window.localStorage.getItem(LK_STORAGE_HISTORY_KEY) || '';
  const metaRaw = window.localStorage.getItem(LK_STORAGE_META_KEY) || '';

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
