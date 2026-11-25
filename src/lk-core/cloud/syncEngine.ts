import { checkRollbackAuthorization, verifyAndValidateCloudBundle } from './bundleValidator';
import {
  clearCachedCloudBundle,
  clearCloudCredentials,
  loadCachedCloudBundle,
  loadCloudCredentials,
  loadCloudMeta,
  resolveLkCloudCacheKeys,
  saveCachedCloudBundle,
  saveCloudCredentials,
  saveCloudMeta,
} from './cloudCache';
import {
  assertSameApprovedOrigin,
  exchangePairingCode,
  extractAndScrubPairingCodeFromUrl,
  validateApprovedEndpointUrl,
} from './pairing';
import { isSdkVersionCompatible, parseSemver } from './semver';
import {
  DEFINITIVE_REVOCATION_CODES,
  type LkCloudBundle,
  type LkCloudClientConfig,
  type LkCloudCredentialState,
  type LkCloudManifestResponse,
  type LkCloudSyncState,
  type LkValidatedCloudIcon,
} from './types';

const DEFAULT_SYNC_INTERVAL_MS = 300_000;
const MIN_SYNC_INTERVAL_MS = 10_000;
const DEFAULT_MANUAL_COOLDOWN_MS = 5_000;
const MAX_BACKOFF_MS = 300_000;

export interface LkSyncSnapshot {
  state: LkCloudSyncState;
  activeBundle: LkCloudBundle | null;
  validatedIcons: Record<string, LkValidatedCloudIcon>;
  sanitizedCssVariables: Record<string, string>;
}

export interface LkSyncEngine {
  initialize: () => Promise<LkSyncSnapshot>;
  getSnapshot: () => LkSyncSnapshot;
  subscribe: (listener: (snapshot: LkSyncSnapshot) => void) => () => void;
  updateConfig: (nextConfig: LkCloudClientConfig) => Promise<void>;
  pairWithCode: (oneTimeCode: string) => Promise<boolean>;
  syncNow: (options?: { force?: boolean }) => Promise<LkCloudSyncState>;
  disconnect: () => void;
  start: () => void;
  stop: () => void;
}

class UntrustedOriginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UntrustedOriginError';
  }
}

function assertApprovedResponseOrigin(url: string, approvedOrigin: string): string {
  try {
    return assertSameApprovedOrigin(url, approvedOrigin);
  } catch (err) {
    throw new UntrustedOriginError(
      err instanceof Error ? err.message : 'Blocked response from untrusted origin.',
    );
  }
}

function isBundleLike(value: unknown): value is LkCloudBundle {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'manifest' in (value as Record<string, unknown>) &&
    'payload' in (value as Record<string, unknown>) &&
    'signature' in (value as Record<string, unknown>)
  );
}

async function parseErrorJson(response: Response): Promise<{ code?: string; message?: string }> {
  try {
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return {};
    }
    const raw = await response.text();
    const data = JSON.parse(raw) as Record<string, unknown>;
    return {
      code: typeof data.code === 'string' ? data.code : undefined,
      message: typeof data.message === 'string' ? data.message : undefined,
    };
  } catch {
    return {};
  }
}

async function readJsonPayload(
  response: Response,
): Promise<{ ok: true; data: unknown } | { ok: false; code: string; message: string }> {
  const rawText = await response.text();
  try {
    return { ok: true, data: JSON.parse(rawText) as unknown };
  } catch {
    return {
      ok: false,
      code: 'INVALID_JSON_RESPONSE',
      message: 'Cloud endpoint returned malformed JSON.',
    };
  }
}

function validateManifestDescriptor(
  raw: unknown,
  expectedAppId: string,
): { ok: true; descriptor: LkCloudManifestResponse } | { ok: false; code: string; message: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      ok: false,
      code: 'INVALID_MANIFEST_DESCRIPTOR',
      message: 'Manifest response did not contain a valid descriptor object.',
    };
  }
  const d = raw as Partial<LkCloudManifestResponse>;
  if (
    typeof d.appId !== 'string' ||
    d.appId !== expectedAppId ||
    typeof d.releaseId !== 'string' ||
    !d.releaseId.trim() ||
    typeof d.bundleVersion !== 'string' ||
    !parseSemver(d.bundleVersion) ||
    typeof d.minSdkVersion !== 'string' ||
    !parseSemver(d.minSdkVersion) ||
    (d.maxSdkVersion !== undefined &&
      (typeof d.maxSdkVersion !== 'string' || !parseSemver(d.maxSdkVersion))) ||
    typeof d.payloadSha256 !== 'string' ||
    !/^[a-fA-F0-9]{64}$/.test(d.payloadSha256)
  ) {
    return {
      ok: false,
      code: 'INVALID_MANIFEST_DESCRIPTOR',
      message: 'Manifest descriptor is missing valid appId, releaseId, SemVer, or payloadSha256.',
    };
  }
  return { ok: true, descriptor: d as LkCloudManifestResponse };
}

function doesBundleMatchDescriptor(
  bundle: LkCloudBundle,
  descriptor: LkCloudManifestResponse,
): { match: true } | { match: false; message: string } {
  const m = bundle.manifest;
  if (m.appId !== descriptor.appId) {
    return { match: false, message: 'Bundle appId does not match manifest descriptor.' };
  }
  if (m.releaseId !== descriptor.releaseId) {
    return { match: false, message: 'Bundle releaseId does not match manifest descriptor.' };
  }
  if (m.bundleVersion !== descriptor.bundleVersion) {
    return { match: false, message: 'Bundle version does not match manifest descriptor.' };
  }
  if (m.payloadSha256.toLowerCase() !== descriptor.payloadSha256.toLowerCase()) {
    return { match: false, message: 'Bundle payloadSha256 does not match manifest descriptor.' };
  }
  if (m.minSdkVersion !== descriptor.minSdkVersion) {
    return { match: false, message: 'Bundle minSdkVersion does not match manifest descriptor.' };
  }
  if (descriptor.maxSdkVersion !== undefined && m.maxSdkVersion !== descriptor.maxSdkVersion) {
    return { match: false, message: 'Bundle maxSdkVersion does not match manifest descriptor.' };
  }
  if (descriptor.etag && m.etag && m.etag !== descriptor.etag) {
    return { match: false, message: 'Bundle ETag does not match manifest descriptor.' };
  }
  return { match: true };
}

export function createLkSyncEngine(initialConfig: LkCloudClientConfig): LkSyncEngine {
  let currentConfig: LkCloudClientConfig = { ...initialConfig };
  const initialEndpoint = validateApprovedEndpointUrl(
    currentConfig.endpointUrl,
    currentConfig.allowInsecureLocalhost ?? false,
  );
  const normalizedEndpoint = initialEndpoint.normalizedEndpoint;
  const approvedOrigin = initialEndpoint.approvedOrigin;
  const keys = resolveLkCloudCacheKeys(currentConfig.appId, currentConfig.storagePrefix);

  const consumedPairingCodes = new Set<string>();
  const listeners = new Set<(snapshot: LkSyncSnapshot) => void>();

  let activeBundle: LkCloudBundle | null = null;
  let validatedIcons: Record<string, LkValidatedCloudIcon> = {};
  let sanitizedCssVariables: Record<string, string> = {};
  let credentials: LkCloudCredentialState | null = null;
  let etag: string | null = null;
  let inFlightSync: Promise<LkCloudSyncState> | null = null;
  let inFlightInit: Promise<LkSyncSnapshot> | null = null;
  let lastSyncAttemptMs = 0;
  let backoffFailures = 0;
  let nextAllowedSyncMs = 0;
  let timerId: ReturnType<typeof setInterval> | null = null;
  let onlineListener: (() => void) | null = null;
  let initialized = false;
  let isRunning = false;
  let startupSyncTriggered = false;

  let state: LkCloudSyncState = {
    status: 'idle',
    activeVersion: null,
    lastSyncedAt: null,
    lastCheckedAt: null,
    source: 'none',
    isPaired: false,
  };

  const getSyncIntervalMs = () =>
    Math.max(MIN_SYNC_INTERVAL_MS, currentConfig.syncIntervalMs ?? DEFAULT_SYNC_INTERVAL_MS);

  const getMinManualCooldownMs = () =>
    Math.max(0, currentConfig.minManualCooldownMs ?? DEFAULT_MANUAL_COOLDOWN_MS);

  const getFetcher = () => currentConfig.fetcher ?? globalThis.fetch;

  const getSnapshot = (): LkSyncSnapshot => ({
    state: { ...state },
    activeBundle,
    validatedIcons: { ...validatedIcons },
    sanitizedCssVariables: { ...sanitizedCssVariables },
  });

  const emit = () => {
    const snap = getSnapshot();
    currentConfig.onSyncStateChange?.(snap.state);
    for (const listener of listeners) {
      listener(snap);
    }
  };

  const setState = (patch: Partial<LkCloudSyncState>) => {
    state = { ...state, ...patch };
    emit();
  };

  const detachTimers = () => {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
    if (onlineListener && typeof window !== 'undefined') {
      window.removeEventListener('online', onlineListener);
      onlineListener = null;
    }
  };

  const attachTimers = () => {
    if (!isRunning || currentConfig.autoSync === false || state.status === 'revoked') {
      return;
    }
    if (timerId === null) {
      timerId = setInterval(() => {
        if (state.status !== 'revoked') {
          void syncNow();
        }
      }, getSyncIntervalMs());
    }
    if (!onlineListener && typeof window !== 'undefined') {
      onlineListener = () => {
        if (state.status !== 'revoked') {
          void syncNow({ force: true });
        }
      };
      window.addEventListener('online', onlineListener);
    }
  };

  const stop = () => {
    isRunning = false;
    detachTimers();
  };

  const loadCredentialsSafely = (): LkCloudCredentialState | null => {
    const stored = loadCloudCredentials(keys);
    if (!stored) return null;
    if (stored.appId !== currentConfig.appId || stored.approvedOrigin !== approvedOrigin) {
      clearCloudCredentials(keys);
      return null;
    }
    return stored;
  };

  const initialize = async (): Promise<LkSyncSnapshot> => {
    if (initialized) return getSnapshot();
    if (inFlightInit) return inFlightInit;

    inFlightInit = (async () => {
      const meta = loadCloudMeta(keys);
      etag = meta.etag;
      credentials = loadCredentialsSafely();

      const cached = loadCachedCloudBundle(keys);
      if (cached) {
        const check = await verifyAndValidateCloudBundle(cached, currentConfig);
        if (check.ok) {
          activeBundle = check.bundle;
          validatedIcons = check.validatedIcons;
          sanitizedCssVariables = check.sanitizedCssVariables;
          state = {
            status: meta.revokedAt ? 'revoked' : 'offline-cache',
            activeVersion: check.bundle.manifest.bundleVersion,
            lastSyncedAt: meta.lastSyncedAt,
            lastCheckedAt: meta.lastCheckedAt,
            source: 'cache',
            isPaired: Boolean(credentials),
          };
        } else {
          // Cached bundle failed cryptographic/schema/permission verification — purge corrupt cache
          clearCachedCloudBundle(keys);
          state = {
            status: meta.revokedAt ? 'revoked' : check.reason,
            activeVersion: null,
            lastSyncedAt: null,
            lastCheckedAt: meta.lastCheckedAt,
            source: 'none',
            isPaired: Boolean(credentials),
            errorCode: check.code,
            errorMessage: check.message,
          };
        }
      } else {
        state = {
          ...state,
          status: meta.revokedAt ? 'revoked' : 'idle',
          lastSyncedAt: meta.lastSyncedAt,
          lastCheckedAt: meta.lastCheckedAt,
          isPaired: Boolean(credentials),
        };
      }

      initialized = true;
      emit();
      return getSnapshot();
    })().finally(() => {
      inFlightInit = null;
    });

    return inFlightInit;
  };

  const applyValidatedBundle = (
    bundle: LkCloudBundle,
    icons: Record<string, LkValidatedCloudIcon>,
    cssVars: Record<string, string>,
    nextEtag: string | null,
  ) => {
    const nowIso = new Date().toISOString();
    activeBundle = bundle;
    validatedIcons = icons;
    sanitizedCssVariables = cssVars;
    etag = nextEtag ?? bundle.manifest.etag ?? etag;
    backoffFailures = 0;
    nextAllowedSyncMs = 0;

    saveCachedCloudBundle(keys, bundle);
    saveCloudMeta(keys, {
      etag,
      lastSyncedAt: nowIso,
      lastCheckedAt: nowIso,
      revokedAt: null,
    });

    setState({
      status: 'synced',
      activeVersion: bundle.manifest.bundleVersion,
      lastSyncedAt: nowIso,
      lastCheckedAt: nowIso,
      source: 'network',
      isPaired: Boolean(credentials),
      errorCode: undefined,
      errorMessage: undefined,
    });
  };

  const handleRevocationConfirmed = (code: string, message?: string) => {
    stop();
    clearCloudCredentials(keys);
    credentials = null;
    const nowIso = new Date().toISOString();
    saveCloudMeta(keys, {
      etag,
      lastSyncedAt: state.lastSyncedAt,
      lastCheckedAt: nowIso,
      revokedAt: nowIso,
    });
    setState({
      status: 'revoked',
      isPaired: false,
      lastCheckedAt: nowIso,
      errorCode: code,
      errorMessage: message ?? 'Application access has been definitively revoked.',
    });
  };

  const applyTransientNetworkError = (
    code: string,
    message: string,
    retryAfterHeader?: string | null,
  ) => {
    backoffFailures = Math.min(backoffFailures + 1, 6);
    const retrySec = retryAfterHeader ? Number(retryAfterHeader) : NaN;
    const delayMs =
      Number.isFinite(retrySec) && retrySec > 0
        ? Math.min(retrySec * 1000, MAX_BACKOFF_MS)
        : Math.min(2_000 * Math.pow(2, backoffFailures - 1), MAX_BACKOFF_MS);
    nextAllowedSyncMs = Date.now() + delayMs;

    const nowIso = new Date().toISOString();
    saveCloudMeta(keys, {
      etag,
      lastSyncedAt: state.lastSyncedAt,
      lastCheckedAt: nowIso,
      revokedAt: null,
    });

    setState({
      status: activeBundle ? 'offline-cache' : 'error',
      activeVersion: activeBundle?.manifest.bundleVersion ?? null,
      lastCheckedAt: nowIso,
      source: activeBundle ? 'cache' : 'none',
      isPaired: Boolean(credentials),
      errorCode: code,
      errorMessage: message,
    });
  };

  const rejectInvalidNetworkPayload = (
    status: 'invalid-bundle' | 'invalid-signature' | 'incompatible',
    code: string,
    message: string,
  ) => {
    // Keep last valid activeBundle intact in memory and cache
    setState({
      status,
      activeVersion: activeBundle?.manifest.bundleVersion ?? null,
      source: activeBundle ? 'cache' : 'none',
      lastCheckedAt: new Date().toISOString(),
      isPaired: Boolean(credentials),
      errorCode: code,
      errorMessage: message,
    });
  };

  const sendHeartbeatBestEffort = async (bundleVersion: string) => {
    const fetcher = getFetcher();
    if (typeof fetcher !== 'function' || !credentials) return;
    try {
      const hbUrl = assertApprovedResponseOrigin(`${normalizedEndpoint}/sdk/heartbeat`, approvedOrigin);
      await fetcher(hbUrl, {
        method: 'POST',
        redirect: 'error',
        headers: {
          'Content-Type': 'application/json',
          'X-LK-App-Id': currentConfig.appId,
          Authorization: `Bearer ${credentials.readToken}`,
        },
        body: JSON.stringify({
          appId: currentConfig.appId,
          installedBundleVersion: bundleVersion,
          sdkVersion: currentConfig.sdkVersion ?? '1.0.0',
          syncedAt: new Date().toISOString(),
        }),
      });
    } catch {
      // Telemetry heartbeat must never degrade sync state
    }
  };

  const handleHttpFailureResponse = async (
    response: Response,
    contextLabel: 'Manifest' | 'Bundle',
  ): Promise<LkCloudSyncState> => {
    const errInfo = await parseErrorJson(response);
    if (response.status === 401 || response.status === 403) {
      if (errInfo.code && DEFINITIVE_REVOCATION_CODES.has(errInfo.code)) {
        handleRevocationConfirmed(errInfo.code, errInfo.message);
        return { ...state };
      }
      // Transient 401/403 without definitive revocation code preserves readToken & cache
      applyTransientNetworkError(
        errInfo.code ?? (response.status === 401 ? 'UNAUTHORIZED_TRANSIENT' : 'FORBIDDEN_TRANSIENT'),
        errInfo.message ??
          `Transient auth response HTTP ${response.status} on ${contextLabel}; credentials preserved.`,
      );
      return { ...state };
    }

    if (response.status === 429 || response.status >= 500) {
      applyTransientNetworkError(
        errInfo.code ?? (response.status === 429 ? 'RATE_LIMITED' : 'SERVER_ERROR'),
        errInfo.message ?? `${contextLabel} endpoint returned HTTP ${response.status}.`,
        response.headers.get('retry-after'),
      );
      return { ...state };
    }

    applyTransientNetworkError(
      errInfo.code ?? `HTTP_${response.status}`,
      errInfo.message ?? `Unexpected HTTP ${response.status} from ${contextLabel} endpoint.`,
      response.headers.get('retry-after'),
    );
    return { ...state };
  };

  const runSyncInternal = async (force: boolean): Promise<LkCloudSyncState> => {
    if (!initialized) {
      await initialize();
    }

    const fetcher = getFetcher();
    if (typeof fetcher !== 'function') {
      setState({
        status: activeBundle ? 'offline-cache' : 'error',
        errorCode: 'FETCH_UNAVAILABLE',
        errorMessage: 'Fetch API is unavailable in this runtime.',
      });
      return { ...state };
    }

    const now = Date.now();
    if (!force) {
      if (now < nextAllowedSyncMs) {
        return { ...state };
      }
      if (lastSyncAttemptMs > 0 && now - lastSyncAttemptMs < getMinManualCooldownMs()) {
        return { ...state };
      }
    }

    lastSyncAttemptMs = now;
    setState({ status: 'syncing', errorCode: undefined, errorMessage: undefined });

    const sdkVersion = currentConfig.sdkVersion ?? '1.0.0';
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-LK-App-Id': currentConfig.appId,
      'X-LK-SDK-Version': sdkVersion,
    };
    if (credentials?.readToken) {
      headers.Authorization = `Bearer ${credentials.readToken}`;
    }
    if (etag) {
      headers['If-None-Match'] = etag;
    }

    try {
      const manifestUrl = assertApprovedResponseOrigin(
        `${normalizedEndpoint}/sdk/manifest`,
        approvedOrigin,
      );
      const manifestRes = await fetcher(manifestUrl, {
        method: 'GET',
        redirect: 'error',
        headers,
      });

      if (manifestRes.url) {
        assertApprovedResponseOrigin(manifestRes.url, approvedOrigin);
      }

      if (manifestRes.status === 304) {
        const nowIso = new Date().toISOString();
        const headerEtag = manifestRes.headers.get('etag');
        if (headerEtag) etag = headerEtag;
        backoffFailures = 0;
        nextAllowedSyncMs = 0;
        saveCloudMeta(keys, {
          etag,
          lastSyncedAt: state.lastSyncedAt ?? nowIso,
          lastCheckedAt: nowIso,
          revokedAt: null,
        });
        setState({
          status: 'synced',
          lastCheckedAt: nowIso,
          errorCode: undefined,
          errorMessage: undefined,
        });
        return { ...state };
      }

      if (!manifestRes.ok) {
        return await handleHttpFailureResponse(manifestRes, 'Manifest');
      }

      const parsedManifest = await readJsonPayload(manifestRes);
      if (!parsedManifest.ok) {
        rejectInvalidNetworkPayload('invalid-bundle', parsedManifest.code, parsedManifest.message);
        return { ...state };
      }

      const rawManifestJson = parsedManifest.data;
      const responseEtag = manifestRes.headers.get('etag');

      let candidateBundle: unknown = rawManifestJson;
      let expectedDescriptor: LkCloudManifestResponse | null = null;

      // Support lightweight manifest descriptor pointing to /sdk/bundle/:version
      if (!isBundleLike(rawManifestJson)) {
        const descCheck = validateManifestDescriptor(rawManifestJson, currentConfig.appId);
        if (!descCheck.ok) {
          rejectInvalidNetworkPayload('invalid-bundle', descCheck.code, descCheck.message);
          return { ...state };
        }
        expectedDescriptor = descCheck.descriptor;

        // Pre-check SDK version compatibility on descriptor before downloading payload
        const descCompat = isSdkVersionCompatible(
          sdkVersion,
          expectedDescriptor.minSdkVersion,
          expectedDescriptor.maxSdkVersion,
        );
        if (!descCompat.compatible) {
          rejectInvalidNetworkPayload(
            'incompatible',
            'SDK_VERSION_INCOMPATIBLE',
            descCompat.reason ?? 'SDK version incompatible with manifest descriptor.',
          );
          return { ...state };
        }

        const targetBundleUrl = expectedDescriptor.bundleUrl
          ? assertApprovedResponseOrigin(expectedDescriptor.bundleUrl, approvedOrigin)
          : assertApprovedResponseOrigin(
              `${normalizedEndpoint}/sdk/bundle/${encodeURIComponent(expectedDescriptor.bundleVersion)}`,
              approvedOrigin,
            );

        const bundleRes = await fetcher(targetBundleUrl, {
          method: 'GET',
          redirect: 'error',
          headers: {
            Accept: 'application/json',
            'X-LK-App-Id': currentConfig.appId,
            'X-LK-SDK-Version': sdkVersion,
            ...(credentials?.readToken ? { Authorization: `Bearer ${credentials.readToken}` } : {}),
          },
        });

        if (bundleRes.url) {
          assertApprovedResponseOrigin(bundleRes.url, approvedOrigin);
        }

        if (!bundleRes.ok) {
          return await handleHttpFailureResponse(bundleRes, 'Bundle');
        }

        const parsedBundle = await readJsonPayload(bundleRes);
        if (!parsedBundle.ok) {
          rejectInvalidNetworkPayload('invalid-bundle', parsedBundle.code, parsedBundle.message);
          return { ...state };
        }

        candidateBundle = parsedBundle.data;
      }

      const check = await verifyAndValidateCloudBundle(candidateBundle, currentConfig, Date.now(), {
        activeManifest: activeBundle?.manifest ?? null,
      });
      if (!check.ok) {
        rejectInvalidNetworkPayload(check.reason, check.code, check.message);
        return { ...state };
      }

      if (expectedDescriptor) {
        const consistency = doesBundleMatchDescriptor(check.bundle, expectedDescriptor);
        if (!consistency.match) {
          rejectInvalidNetworkPayload(
            'invalid-bundle',
            'DESCRIPTOR_BUNDLE_MISMATCH',
            consistency.message,
          );
          return { ...state };
        }
      }

      applyValidatedBundle(
        check.bundle,
        check.validatedIcons,
        check.sanitizedCssVariables,
        responseEtag ?? expectedDescriptor?.etag ?? check.bundle.manifest.etag ?? null,
      );
      void sendHeartbeatBestEffort(check.bundle.manifest.bundleVersion);
      return { ...state };
    } catch (err) {
      if (err instanceof UntrustedOriginError) {
        rejectInvalidNetworkPayload('invalid-bundle', 'UNTRUSTED_ORIGIN', err.message);
        return { ...state };
      }
      applyTransientNetworkError(
        'NETWORK_ERROR',
        err instanceof Error ? err.message : 'Network error during Cloud synchronization.',
      );
      return { ...state };
    }
  };

  const syncNow = async (options?: { force?: boolean }): Promise<LkCloudSyncState> => {
    if (inFlightSync) return inFlightSync;
    inFlightSync = runSyncInternal(Boolean(options?.force)).finally(() => {
      inFlightSync = null;
    });
    return inFlightSync;
  };

  const pairWithCode = async (oneTimeCode: string): Promise<boolean> => {
    if (!initialized) {
      await initialize();
    }
    setState({ status: 'pairing', errorCode: undefined, errorMessage: undefined });

    const outcome = await exchangePairingCode({
      appId: currentConfig.appId,
      endpointUrl: currentConfig.endpointUrl,
      allowInsecureLocalhost: currentConfig.allowInsecureLocalhost,
      oneTimeCode,
      consumedCodesRegistry: consumedPairingCodes,
      fetcher: getFetcher(),
    });

    if (!outcome.ok) {
      setState({
        status: activeBundle ? 'offline-cache' : 'error',
        errorCode: outcome.code,
        errorMessage: outcome.message,
      });
      return false;
    }

    credentials = outcome.credentials;
    saveCloudCredentials(keys, outcome.credentials);
    saveCloudMeta(keys, {
      etag,
      lastSyncedAt: state.lastSyncedAt,
      lastCheckedAt: state.lastCheckedAt,
      revokedAt: null,
    });
    setState({ isPaired: true });

    await syncNow({ force: true });
    return true;
  };

  const disconnect = () => {
    stop();
    clearCloudCredentials(keys);
    clearCachedCloudBundle(keys);
    credentials = null;
    activeBundle = null;
    validatedIcons = {};
    sanitizedCssVariables = {};
    etag = null;
    startupSyncTriggered = false;
    saveCloudMeta(keys, { etag: null, lastSyncedAt: null, lastCheckedAt: null, revokedAt: null });
    setState({
      status: 'idle',
      activeVersion: null,
      lastSyncedAt: null,
      lastCheckedAt: null,
      source: 'none',
      isPaired: false,
      errorCode: undefined,
      errorMessage: undefined,
    });
  };

  const updateConfig = async (nextConfig: LkCloudClientConfig): Promise<void> => {
    const prevAutoSync = currentConfig.autoSync !== false;
    const prevInterval = getSyncIntervalMs();
    const prevKeysJson = JSON.stringify(currentConfig.trustedPublicKeys);
    const prevAllowedJson = JSON.stringify(currentConfig.allowedPermissions ?? null);
    const prevSdk = currentConfig.sdkVersion ?? '1.0.0';

    currentConfig = { ...nextConfig };

    const nextAutoSync = currentConfig.autoSync !== false;
    const nextInterval = getSyncIntervalMs();
    if (isRunning && (prevAutoSync !== nextAutoSync || prevInterval !== nextInterval)) {
      detachTimers();
      attachTimers();
    }

    const keysChanged = prevKeysJson !== JSON.stringify(currentConfig.trustedPublicKeys);
    const allowedChanged = prevAllowedJson !== JSON.stringify(currentConfig.allowedPermissions ?? null);
    const sdkChanged = prevSdk !== (currentConfig.sdkVersion ?? '1.0.0');

    if (activeBundle && (keysChanged || allowedChanged || sdkChanged)) {
      const recheck = await verifyAndValidateCloudBundle(activeBundle, currentConfig);
      if (!recheck.ok) {
        // Active bundle no longer passes updated key trust/permissions/SDK bounds
        clearCachedCloudBundle(keys);
        activeBundle = null;
        validatedIcons = {};
        sanitizedCssVariables = {};
        etag = null;
        setState({
          status: recheck.reason,
          activeVersion: null,
          source: 'none',
          errorCode: recheck.code,
          errorMessage: recheck.message,
        });
      } else {
        // Ensure rollback still respects updated state cleanly
        const rb = checkRollbackAuthorization(recheck.bundle.manifest, null);
        if (rb.allowed) {
          validatedIcons = recheck.validatedIcons;
          sanitizedCssVariables = recheck.sanitizedCssVariables;
          emit();
        }
      }
    }
  };

  const start = () => {
    if (isRunning) return;
    isRunning = true;
    attachTimers();

    if (!startupSyncTriggered) {
      startupSyncTriggered = true;
      void (async () => {
        await initialize();
        if (!isRunning) return;
        const urlCode = extractAndScrubPairingCodeFromUrl(
          currentConfig.pairingQueryParam ?? 'lk_pair',
        );
        if (urlCode) {
          await pairWithCode(urlCode);
        } else if (currentConfig.autoSync !== false && state.status !== 'revoked') {
          await syncNow({ force: true });
        }
      })();
    }
  };

  const subscribe = (listener: (snapshot: LkSyncSnapshot) => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return {
    initialize,
    getSnapshot,
    subscribe,
    updateConfig,
    pairWithCode,
    syncNow,
    disconnect,
    start,
    stop,
  };
}
