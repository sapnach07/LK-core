// LK Core 1.0 — Public Reusable Module Exports

// Types
export * from './types';

// Tokens & Contrast
export * from './tokens/designTokens';
export * from './tokens/contrast';
export * from './tokens/exportTokens';

// Storage & i18n
export * from './storage/lkStorage';
export * from './i18n/translations';

// Theme & Settings Provider
export {
  LkProvider,
  useLkCore,
  useLkTheme,
  useLkSettings,
  useLkToast,
} from './themes/LkThemeProvider';

// Glass Surfaces
export { LkGlassSurface, LkGlassPanel, LkGlassHeader } from './glass/LkGlass';

// Motion
export {
  useLkMotionConfig,
  LkMotionReveal,
  LkMotionInteractive,
} from './motion/LkMotion';

// Icons
export {
  LkLogoMark,
  LkIcon,
  LK_ICON_CATALOG,
  LK_ICON_REGISTRY,
} from './icons/LkIcon';
export type { LkIconName, LkIconMeta } from './icons/LkIcon';

// Accessibility
export * from './accessibility/LkAccessibility';

// UI Components (LK Design)
export { LkButton } from './design/LkButton';
export { LkCard } from './design/LkCard';
export { LkInput } from './design/LkInput';
export { LkSelect, LkSegmentedControl } from './design/LkSelect';
export { LkSwitch, LkSlider } from './design/LkSwitch';
export { LkDialog } from './design/LkDialog';
export { LkDropdown } from './design/LkDropdown';
export { LkToastRegion } from './design/LkToast';
