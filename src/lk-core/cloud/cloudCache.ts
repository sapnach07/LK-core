import { sanitizeLkSettings } from '../storage/lkStorage';
import type { LkSettings } from '../types';
import type { LkCloudBundle, LkCloudCredentialState } from './types';

export interface LkCloudCacheKeys {
  bundle: string;
  credentials: string;
  baseline: string;
  meta: string;
}

export interface LkCloudMetaRecord {
  etag: string | null;
  lastSyncedAt: string | null;
  lastCheckedAt: string | null;
  revokedAt: string | null;
}

export function resolveLkCloudCacheKeys(
  appId: string,
  storagePrefix?: string,
): LkCloudCacheKeys {
  const cleanPrefix = (storagePrefix ?? appId).trim().replace(/[^a-zA-Z0-9._-]/g, '-');
  const root = cleanPrefix ? `${cleanPrefix}.lk-cloud` : 'lk-cloud';
  return {
    bundle: `${root}.bundle.v1`,
    credentials: `${root}.credentials.v1`,
    baseline: `${root}.baseline.v1`,
    meta: `${root}.meta.v1`,
  };
}

function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeReadJson<T>(key: string): T | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeWriteJson(key: string, value: unknown): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function safeRemove(key: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage removal errors
  }
}

export function loadCachedCloudBundle(keys: LkCloudCacheKeys): LkCloudBundle | null {
  return safeReadJson<LkCloudBundle>(keys.bundle);
}

export function saveCachedCloudBundle(keys: LkCloudCacheKeys, bundle: LkCloudBundle): boolean {
  return safeWriteJson(keys.bundle, bundle);
}

export function clearCachedCloudBundle(keys: LkCloudCacheKeys): void {
  safeRemove(keys.bundle);
}

export function loadCloudCredentials(keys: LkCloudCacheKeys): LkCloudCredentialState | null {
  const creds = safeReadJson<LkCloudCredentialState>(keys.credentials);
  if (
    !creds ||
    typeof creds.appId !== 'string' ||
    typeof creds.readToken !== 'string' ||
    typeof creds.approvedOrigin !== 'string' ||
    !creds.readToken
  ) {
    return null;
  }
  return creds;
}

export function saveCloudCredentials(
  keys: LkCloudCacheKeys,
  credentials: LkCloudCredentialState,
): boolean {
  return safeWriteJson(keys.credentials, credentials);
}

export function clearCloudCredentials(keys: LkCloudCacheKeys): void {
  safeRemove(keys.credentials);
}

export function loadCloudBaseline(keys: LkCloudCacheKeys): Partial<LkSettings> {
  return safeReadJson<Partial<LkSettings>>(keys.baseline) ?? {};
}

export function saveCloudBaseline(keys: LkCloudCacheKeys, baseline: Partial<LkSettings>): boolean {
  return safeWriteJson(keys.baseline, baseline);
}

export function loadCloudMeta(keys: LkCloudCacheKeys): LkCloudMetaRecord {
  const raw = safeReadJson<Partial<LkCloudMetaRecord>>(keys.meta);
  return {
    etag: typeof raw?.etag === 'string' ? raw.etag : null,
    lastSyncedAt: typeof raw?.lastSyncedAt === 'string' ? raw.lastSyncedAt : null,
    lastCheckedAt: typeof raw?.lastCheckedAt === 'string' ? raw.lastCheckedAt : null,
    revokedAt: typeof raw?.revokedAt === 'string' ? raw.revokedAt : null,
  };
}

export function saveCloudMeta(keys: LkCloudCacheKeys, meta: LkCloudMetaRecord): boolean {
  return safeWriteJson(keys.meta, meta);
}

/**
 * Computes a non-destructive patch of Cloud setting defaults that strictly preserves
 * any setting key the end user has explicitly customized locally.
 */
export function computeCloudSettingsPatch(
  currentSettings: LkSettings,
  prevCloudBaseline: Partial<LkSettings>,
  nextCloudDefaults: Partial<LkSettings> | undefined,
  coreDefaults: LkSettings,
): { patch: Partial<LkSettings>; nextBaseline: Partial<LkSettings> } {
  if (!nextCloudDefaults || Object.keys(nextCloudDefaults).length === 0) {
    return { patch: {}, nextBaseline: { ...prevCloudBaseline } };
  }

  const sanitizedCandidate = sanitizeLkSettings(nextCloudDefaults, coreDefaults);
  const patch: Partial<LkSettings> = {};
  const nextBaseline: Partial<LkSettings> = { ...prevCloudBaseline };

  for (const key of Object.keys(nextCloudDefaults) as Array<keyof LkSettings>) {
    if (nextCloudDefaults[key] === undefined) continue;
    const desiredValue = sanitizedCandidate[key];
    const hasPrevCloudValue = Object.prototype.hasOwnProperty.call(prevCloudBaseline, key);
    const nonUserReference = hasPrevCloudValue ? prevCloudBaseline[key] : coreDefaults[key];

    const isUserCustomized = currentSettings[key] !== nonUserReference;
    if (!isUserCustomized) {
      if (currentSettings[key] !== desiredValue) {
        (patch as Record<string, unknown>)[key] = desiredValue;
      }
      (nextBaseline as Record<string, unknown>)[key] = desiredValue;
    }
  }

  return { patch, nextBaseline };
}
