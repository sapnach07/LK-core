export type LkThemeMode = 'dark' | 'light' | 'system';

export type LkThemePresetId =
  | 'obsidian-gold'
  | 'graphite-silver'
  | 'arctic-frost'
  | 'midnight-cobalt'
  | 'custom';

export type LkDensity = 'compact' | 'comfortable' | 'spacious';

export type LkMotionLevel = 'full' | 'subtle' | 'reduced';

export type LkMotionSpeed = 0.5 | 1 | 1.5;

export type LkFontScale = 'compact' | 'standard' | 'large';

export type LkFontFamily = 'jakarta' | 'manrope' | 'system';

export type LkLanguage = 'en' | 'es' | 'fr' | 'de';

export type LkTimeFormat = '12h' | '24h';

export type LkNumberFormat = 'US' | 'EU';

export interface LkThemePreset {
  id: LkThemePresetId;
  name: string;
  description: string;
  recommendedMode: 'dark' | 'light';
  accent: string;
  darkBg: string;
  darkSurface: string;
  lightBg: string;
  lightSurface: string;
}

export interface LkSettings {
  // Appearance & Theme
  themeMode: LkThemeMode;
  themePreset: LkThemePresetId;
  accentColor: string;
  customDarkBg: string;
  customLightBg: string;

  // Glass & Blur
  glassEnabled: boolean;
  blurIntensity: number; // 0 to 32 px
  glassOpacity: number; // 0.35 to 0.95
  specularHighlight: boolean;

  // Motion
  motionLevel: LkMotionLevel;
  motionSpeed: LkMotionSpeed;

  // Typography & Density & Accessibility
  fontScale: LkFontScale;
  fontFamily: LkFontFamily;
  density: LkDensity;
  highContrast: boolean;
  enhancedFocusRings: boolean;

  // Notifications
  notificationsEnabled: boolean;
  quietMode: boolean;
  visualCuesEnabled: boolean;

  // Language & Regional
  language: LkLanguage;
  timeFormat: LkTimeFormat;
  numberFormat: LkNumberFormat;

  // Privacy
  localOnlyMode: boolean;
  storeUsageHistory: boolean;
  diagnosticsEnabled: boolean;
}

export interface LkToastItem {
  id: string;
  title: string;
  description?: string;
  variant: 'info' | 'success' | 'warning' | 'error';
  createdAt: number;
}

export interface LkStorageStats {
  totalBytes: number;
  settingsBytes: number;
  historyBytes: number;
  keyCount: number;
  lastSavedAt: string | null;
}

export type PlaygroundSectionId =
  | 'overview'
  | 'components'
  | 'charts'
  | 'themes'
  | 'settings'
  | 'glass'
  | 'motion'
  | 'icons'
  | 'responsive'
  | 'docs';
