// LK Storage — Local Persistence Engine & Isolated Client Store Helper
export {
  LK_STORAGE_KEY,
  LK_STORAGE_META_KEY,
  LK_STORAGE_HISTORY_KEY,
  DEFAULT_LK_SETTINGS,
  resolveLkStorageKeys,
  sanitizeLkSettings,
  parseLkSettingsJson,
  loadLkSettings,
  saveLkSettings,
  recordLkActivity,
  getLkActivityHistory,
  clearLkStorage,
  calculateUtf8Bytes,
  getLkStorageStats,
  createLkStore,
} from './lkStorage';

export type { LkStorageKeys } from './lkStorage';
export type { LkStorageStats } from '../types';
