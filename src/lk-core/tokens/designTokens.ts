import type { LkFontFamily, LkFontScale, LkDensity, LkThemePreset } from '../types';

export const LK_BRAND_COLORS = {
  obsidian: '#090A0D',
  graphite: '#17191F',
  gold: '#D6B56D',
  silver: '#A5A8B0',
  pureWhite: '#FFFFFF',
  slateMuted: '#4A4E59',
} as const;

export const LK_ACCENT_SWATCHES = [
  { id: 'lk-gold', name: 'LK Gold', hex: '#D6B56D' },
  { id: 'platinum', name: 'Platinum Silver', hex: '#A5A8B0' },
  { id: 'cobalt', name: 'Deep Cobalt', hex: '#4C8DFF' },
  { id: 'emerald', name: 'Mineral Emerald', hex: '#2FB87D' },
  { id: 'amber', name: 'Warm Amber', hex: '#E59A3D' },
  { id: 'crimson', name: 'Studio Crimson', hex: '#E05252' },
] as const;

export const LK_THEME_PRESETS: LkThemePreset[] = [
  {
    id: 'obsidian-gold',
    name: 'Obsidian Gold',
    description: 'Signature LK dark canvas paired with warm metallic gold accents.',
    recommendedMode: 'dark',
    accent: '#D6B56D',
    darkBg: '#090A0D',
    darkSurface: '#17191F',
    lightBg: '#F5F6F8',
    lightSurface: '#FFFFFF',
  },
  {
    id: 'graphite-silver',
    name: 'Graphite Silver',
    description: 'Precision neutral slate and brushed silver for developer consoles.',
    recommendedMode: 'dark',
    accent: '#A5A8B0',
    darkBg: '#0D0F13',
    darkSurface: '#181B22',
    lightBg: '#F3F4F7',
    lightSurface: '#FFFFFF',
  },
  {
    id: 'arctic-frost',
    name: 'Arctic Frost',
    description: 'Luminous daylight glass surfaces with crisp cobalt interaction points.',
    recommendedMode: 'light',
    accent: '#2B6CE8',
    darkBg: '#0A0D14',
    darkSurface: '#141923',
    lightBg: '#F4F6FA',
    lightSurface: '#FFFFFF',
  },
  {
    id: 'midnight-cobalt',
    name: 'Midnight Cobalt',
    description: 'Cool deep-night ink canvas balanced with vibrant cobalt highlights.',
    recommendedMode: 'dark',
    accent: '#4C8DFF',
    darkBg: '#080B12',
    darkSurface: '#121826',
    lightBg: '#F2F5FB',
    lightSurface: '#FFFFFF',
  },
];

export const LK_FONT_SCALE_PX: Record<LkFontScale, number> = {
  compact: 14,
  standard: 16,
  large: 18,
};

export const LK_FONT_FAMILY_STACK: Record<LkFontFamily, string> = {
  jakarta: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
  manrope: '"Manrope", -apple-system, BlinkMacSystemFont, sans-serif',
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

export const LK_DENSITY_TOKENS: Record<
  LkDensity,
  { pad: string; gap: string; controlHeight: string; rowHeight: string }
> = {
  compact: {
    pad: '0.875rem',
    gap: '0.625rem',
    controlHeight: '2.25rem',
    rowHeight: '2.25rem',
  },
  comfortable: {
    pad: '1.25rem',
    gap: '1rem',
    controlHeight: '2.5rem',
    rowHeight: '2.75rem',
  },
  spacious: {
    pad: '1.625rem',
    gap: '1.375rem',
    controlHeight: '2.875rem',
    rowHeight: '3.25rem',
  },
};

export const LK_SEMANTIC_COLORS = {
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',
} as const;
