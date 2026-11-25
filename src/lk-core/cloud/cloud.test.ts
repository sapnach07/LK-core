import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LkButton, LkCard } from '../design/index';
import { LkIcon } from '../icons/LkIcon';
import { LkRemoteIconProvider } from '../icons/LkIconContext';
import { DEFAULT_LK_SETTINGS } from '../storage/lkStorage';
import { LkProvider } from '../themes/LkThemeProvider';
import {
  buildSignatureEnvelopeBytes,
  bytesToBase64,
  canonicalJsonStringify,
  computeCloudSettingsPatch,
  computePayloadSha256Hex,
  createLkSyncEngine,
  exchangePairingCode,
  extractAndScrubPairingCodeFromUrl,
  isSdkVersionCompatible,
  LkCloudProvider,
  loadCachedCloudBundle,
  loadCloudCredentials,
  resolveLkCloudCacheKeys,
  sanitizeSvgIcon,
  useLkCloud,
  useLkCloudOptional,
  validateApprovedEndpointUrl,
  verifyAndValidateCloudBundle,
  type LkCloudBundle,
  type LkCloudPublicKey,
  type LkCloudPayload,
} from './index';

function createMockStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

function withMockBrowserGlobals(
  initialHref = 'https://lk-manage.example.app/dashboard',
): {
  storage: Storage;
  getHref: () => string;
  restore: () => void;
} {
  const storage = createMockStorage();
  const prevWindow = (globalThis as { window?: unknown }).window;
  let currentHref = initialHref;

  const mockWindow = {
    localStorage: storage,
    location: {
      get href() {
        return currentHref;
      },
    },
    history: {
      state: null,
      replaceState(_state: unknown, _title: string, nextUrl?: string | URL | null) {
        if (nextUrl) {
          currentHref = new URL(String(nextUrl), currentHref).toString();
        }
      },
    },
    matchMedia: () => ({
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  (globalThis as { window?: unknown }).window = mockWindow;

  return {
    storage,
    getHref: () => currentHref,
    restore: () => {
      if (prevWindow === undefined) {
        delete (globalThis as { window?: unknown }).window;
      } else {
        (globalThis as { window?: unknown }).window = prevWindow;
      }
    },
  };
}

async function generateSigningPair(
  keyId: string,
  algorithm: 'ECDSA-P256-SHA256' | 'Ed25519' = 'ECDSA-P256-SHA256',
): Promise<{
  publicKeyMeta: LkCloudPublicKey;
  privateKey: CryptoKey;
}> {
  const pair =
    algorithm === 'ECDSA-P256-SHA256'
      ? await crypto.subtle.generateKey(
          { name: 'ECDSA', namedCurve: 'P-256' },
          true,
          ['sign', 'verify'],
        )
      : await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);

  const cryptoPair = pair as CryptoKeyPair;
  const spki = await crypto.subtle.exportKey('spki', cryptoPair.publicKey);
  return {
    publicKeyMeta: {
      keyId,
      algorithm,
      spkiBase64: bytesToBase64(spki),
    },
    privateKey: cryptoPair.privateKey,
  };
}

async function createSignedBundle(
  options: {
    appId?: string;
    releaseId?: string;
    bundleVersion?: string;
    minSdkVersion?: string;
    maxSdkVersion?: string;
    publishedAt?: string;
    expiresAt?: string;
    permissions?: LkCloudBundle['manifest']['permissions'];
    rollback?: LkCloudBundle['manifest']['rollback'];
    payload?: LkCloudPayload;
    keyId: string;
    algorithm: 'ECDSA-P256-SHA256' | 'Ed25519';
    privateKey: CryptoKey;
  },
): Promise<LkCloudBundle> {
  const payload: LkCloudPayload = options.payload ?? {
    settingsDefaults: {
      accentColor: '#4C8DFF',
      themeMode: 'dark',
    },
    cssVariables: {
      '--lk-accent': '#4C8DFF',
    },
  };
  const payloadSha256 = await computePayloadSha256Hex(payload);
  const manifest: LkCloudBundle['manifest'] = {
    schemaVersion: '1.0',
    appId: options.appId ?? 'lk-manage',
    releaseId: options.releaseId ?? 'rel-100',
    bundleVersion: options.bundleVersion ?? '1.0.0',
    minSdkVersion: options.minSdkVersion ?? '1.0.0',
    ...(options.maxSdkVersion ? { maxSdkVersion: options.maxSdkVersion } : {}),
    publishedAt: options.publishedAt ?? '2026-11-23T12:00:00.000Z',
    ...(options.expiresAt ? { expiresAt: options.expiresAt } : {}),
    permissions: options.permissions ?? ['themes', 'icons', 'settings'],
    ...(options.rollback ? { rollback: options.rollback } : {}),
    payloadSha256,
    etag: `"${options.bundleVersion ?? '1.0.0'}"`,
  };

  const sigMeta = {
    signatureVersion: 'lk-sig-v1' as const,
    keyId: options.keyId,
    algorithm: options.algorithm,
  };
  const signingBytes = buildSignatureEnvelopeBytes(manifest, sigMeta);
  const signAlg =
    options.algorithm === 'ECDSA-P256-SHA256'
      ? { name: 'ECDSA', hash: 'SHA-256' }
      : { name: 'Ed25519' };

  const signatureBuffer = await crypto.subtle.sign(
    signAlg,
    options.privateKey,
    new Uint8Array(signingBytes),
  );

  return {
    manifest,
    payload,
    signature: {
      ...sigMeta,
      valueBase64: bytesToBase64(signatureBuffer),
    },
  };
}

test('canonicalJsonStringify sorts keys deterministically regardless of insertion order', () => {
  const a = canonicalJsonStringify({ b: 2, a: { z: 1, m: undefined, k: 'ok' } });
  const b = canonicalJsonStringify({ a: { k: 'ok', z: 1 }, b: 2 });
  assert.equal(a, b);
  assert.equal(a, '{"a":{"k":"ok","z":1},"b":2}');
  assert.throws(() => canonicalJsonStringify({ bad: Number.NaN }));
});

test('signature lk-sig-v1 validates ECDSA-P256, Ed25519, keyId rotation and rejects tampering', async () => {
  const keyV1 = await generateSigningPair('lk-key-v1', 'ECDSA-P256-SHA256');
  const keyV2 = await generateSigningPair('lk-key-v2', 'Ed25519');
  const trustedKeys: LkCloudPublicKey[] = [keyV1.publicKeyMeta, keyV2.publicKeyMeta];

  const bundleV1 = await createSignedBundle({
    keyId: 'lk-key-v1',
    algorithm: 'ECDSA-P256-SHA256',
    privateKey: keyV1.privateKey,
  });
  const resV1 = await verifyAndValidateCloudBundle(bundleV1, {
    appId: 'lk-manage',
    trustedPublicKeys: trustedKeys,
    sdkVersion: '1.0.0',
  });
  assert.equal(resV1.ok, true);

  // Key rotation to v2 (Ed25519)
  const bundleV2 = await createSignedBundle({
    bundleVersion: '1.1.0',
    keyId: 'lk-key-v2',
    algorithm: 'Ed25519',
    privateKey: keyV2.privateKey,
  });
  const resV2 = await verifyAndValidateCloudBundle(bundleV2, {
    appId: 'lk-manage',
    trustedPublicKeys: trustedKeys,
    sdkVersion: '1.0.0',
  });
  assert.equal(resV2.ok, true);

  // Tamper payload after signing -> must fail SHA-256 / authenticity
  const tamperedPayload = structuredClone(bundleV1);
  tamperedPayload.payload.cssVariables = { '--lk-accent': '#FF0000' };
  const tamperedCheck = await verifyAndValidateCloudBundle(tamperedPayload, {
    appId: 'lk-manage',
    trustedPublicKeys: trustedKeys,
  });
  assert.equal(tamperedCheck.ok, false);
  if (!tamperedCheck.ok) assert.equal(tamperedCheck.reason, 'invalid-signature');

  // Tamper manifest after signing -> signature verification fails
  const tamperedManifest = structuredClone(bundleV1);
  tamperedManifest.manifest.releaseId = 'rel-hijacked';
  const badSigCheck = await verifyAndValidateCloudBundle(tamperedManifest, {
    appId: 'lk-manage',
    trustedPublicKeys: trustedKeys,
  });
  assert.equal(badSigCheck.ok, false);
  if (!badSigCheck.ok) assert.equal(badSigCheck.code, 'SIGNATURE_VERIFICATION_FAILED');

  // Unknown keyId rejected
  const unknownKeyCheck = await verifyAndValidateCloudBundle(bundleV1, {
    appId: 'lk-manage',
    trustedPublicKeys: [keyV2.publicKeyMeta],
  });
  assert.equal(unknownKeyCheck.ok, false);
  if (!unknownKeyCheck.ok) assert.equal(unknownKeyCheck.code, 'UNKNOWN_SIGNING_KEY');

  // Revoked keyId rejected
  const revokedKeyCheck = await verifyAndValidateCloudBundle(bundleV1, {
    appId: 'lk-manage',
    trustedPublicKeys: [{ ...keyV1.publicKeyMeta, revoked: true }],
  });
  assert.equal(revokedKeyCheck.ok, false);
  if (!revokedKeyCheck.ok) assert.equal(revokedKeyCheck.code, 'REVOKED_SIGNING_KEY');
});

test('semver compatibility rejects incompatible minSdkVersion / maxSdkVersion', async () => {
  assert.equal(isSdkVersionCompatible('1.0.0', '1.0.0', '1.5.0').compatible, true);
  assert.equal(isSdkVersionCompatible('1.0.0', '2.0.0').compatible, false);
  assert.equal(isSdkVersionCompatible('1.0.0', '0.5.0', '0.9.9').compatible, false);

  const key = await generateSigningPair('lk-key-v1');
  const futureBundle = await createSignedBundle({
    minSdkVersion: '2.0.0',
    keyId: 'lk-key-v1',
    algorithm: 'ECDSA-P256-SHA256',
    privateKey: key.privateKey,
  });

  const check = await verifyAndValidateCloudBundle(futureBundle, {
    appId: 'lk-manage',
    trustedPublicKeys: [key.publicKeyMeta],
    sdkVersion: '1.0.0',
  });
  assert.equal(check.ok, false);
  if (!check.ok) assert.equal(check.reason, 'incompatible');
});

test('XML SVG sanitizer strictly rejects malicious payloads and accepts clean vector icons', () => {
  const safeSvg = sanitizeSvgIcon(
    '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" /><circle cx="12" cy="14" r="2" /></svg>',
    '0 0 24 24',
  );
  assert.equal(safeSvg.nodes.length, 2);
  assert.equal(safeSvg.nodes[0].tag, 'path');
  assert.equal(safeSvg.nodes[0].attributes.strokeWidth, '2');

  const maliciousCases = [
    '<svg viewBox="0 0 24 24"><script>alert(1)</script><path d="M0 0h24v24H0z"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M0 0h10" onload="fetch(\'https://evil.test\')"/></svg>',
    '<svg viewBox="0 0 24 24"><foreignObject width="20" height="20"><div/></foreignObject></svg>',
    '<svg viewBox="0 0 24 24"><use href="https://evil.test/sprite.svg#x"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M0 0" style="background:url(jav&#x61;script:alert(1))"/></svg>',
    '<!DOCTYPE svg [<!ENTITY xxe "boom">]><svg viewBox="0 0 24 24"><path d="M0 0h10"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M0 0h10"></circle></svg>',
  ];

  for (const badSvg of maliciousCases) {
    assert.throws(() => sanitizeSvgIcon(badSvg, '0 0 24 24'));
  }
});

test('pairing validates approved origin, scrubs URL immediately, ignores overrides, and blocks code replay', async () => {
  const env = withMockBrowserGlobals(
    'https://lk-manage.example.app/settings?lk_pair=PAIR_ONE_TIME_987654&lk_cloud=https://attacker.evil/api&tab=general',
  );
  try {
    assert.throws(() => validateApprovedEndpointUrl('http://cloud.lk.example/api'));
    assert.equal(
      validateApprovedEndpointUrl('http://localhost:8787/api/', true).approvedOrigin,
      'http://localhost:8787',
    );

    const extracted = extractAndScrubPairingCodeFromUrl('lk_pair');
    assert.equal(extracted, 'PAIR_ONE_TIME_987654');
    // Both lk_pair and untrusted lk_cloud override must be stripped immediately from URL
    assert.equal(env.getHref(), 'https://lk-manage.example.app/settings?tab=general');

    const requestedUrls: string[] = [];
    const consumed = new Set<string>();

    // First exchange fails because code expired on backend -> must NOT store credentials or code
    const expiredRes = await exchangePairingCode({
      appId: 'lk-manage',
      endpointUrl: 'https://cloud.lk.example/api',
      oneTimeCode: extracted!,
      consumedCodesRegistry: consumed,
      fetcher: async (url) => {
        requestedUrls.push(String(url));
        return new Response(JSON.stringify({ code: 'PAIRING_EXPIRED', message: 'Expired' }), {
          status: 410,
          headers: { 'content-type': 'application/json' },
        });
      },
    });
    assert.equal(expiredRes.ok, false);
    assert.deepEqual(requestedUrls, ['https://cloud.lk.example/api/sdk/pair']);

    // Reusing the same expired code locally is blocked immediately
    const replayRes = await exchangePairingCode({
      appId: 'lk-manage',
      endpointUrl: 'https://cloud.lk.example/api',
      oneTimeCode: extracted!,
      consumedCodesRegistry: consumed,
    });
    assert.equal(replayRes.ok, false);
    if (!replayRes.ok) assert.equal(replayRes.code, 'PAIRING_ALREADY_USED');
    assert.equal(env.storage.length, 0);
  } finally {
    env.restore();
  }
});

test('sync engine supports offline cache, error retention, 304 ETag, transient 403 preservation, and explicit APP_REVOKED', async () => {
  const env = withMockBrowserGlobals();
  try {
    const key = await generateSigningPair('lk-key-v1');
    const bundleV1 = await createSignedBundle({
      bundleVersion: '1.0.0',
      keyId: 'lk-key-v1',
      algorithm: 'ECDSA-P256-SHA256',
      privateKey: key.privateKey,
      payload: {
        settingsDefaults: { accentColor: '#2FB87D', themeMode: 'light' },
        cssVariables: { '--lk-accent': '#2FB87D' },
        icons: [
          {
            name: 'cloud-spark',
            viewBox: '0 0 24 24',
            svg: '<svg viewBox="0 0 24 24"><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z"/></svg>',
          },
        ],
      },
    });

    let mode: 'ok' | '304' | '503' | 'corrupt' | 'transient403' | 'revoked403' = 'ok';

    const mockFetcher: typeof fetch = async (input) => {
      const url = String(input);
      if (url.endsWith('/sdk/pair')) {
        return new Response(
          JSON.stringify({ appId: 'lk-manage', readToken: 'lk-read-token-001' }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      if (url.endsWith('/sdk/heartbeat')) {
        return new Response(null, { status: 204 });
      }
      if (url.endsWith('/sdk/manifest')) {
        if (mode === '304') return new Response(null, { status: 304 });
        if (mode === '503') return new Response('Down', { status: 503 });
        if (mode === 'transient403') {
          return new Response(JSON.stringify({ code: 'FORBIDDEN_TRANSIENT' }), {
            status: 403,
            headers: { 'content-type': 'application/json' },
          });
        }
        if (mode === 'revoked403') {
          return new Response(JSON.stringify({ code: 'APP_REVOKED', message: 'Revoked' }), {
            status: 403,
            headers: { 'content-type': 'application/json' },
          });
        }
        if (mode === 'corrupt') {
          const bad = structuredClone(bundleV1);
          bad.payload.cssVariables = { '--lk-accent': '#111111' }; // Invalidates signature
          return new Response(JSON.stringify(bad), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        return new Response(JSON.stringify(bundleV1), {
          status: 200,
          headers: { 'content-type': 'application/json', etag: '"1.0.0"' },
        });
      }
      return new Response('Not found', { status: 404 });
    };

    const engine = createLkSyncEngine({
      appId: 'lk-manage',
      endpointUrl: 'https://cloud.lk.example/api',
      trustedPublicKeys: [key.publicKeyMeta],
      storagePrefix: 'lk-manage',
      autoSync: false,
      minManualCooldownMs: 0,
      fetcher: mockFetcher,
    });

    const paired = await engine.pairWithCode('PAIR_CODE_ABC_12345');
    assert.equal(paired, true);
    assert.equal(engine.getSnapshot().state.status, 'synced');
    assert.equal(engine.getSnapshot().state.activeVersion, '1.0.0');
    assert.ok(engine.getSnapshot().validatedIcons['cloud-spark']);

    // Simulate offline restart using a second engine instance with failing network
    const offlineEngine = createLkSyncEngine({
      appId: 'lk-manage',
      endpointUrl: 'https://cloud.lk.example/api',
      trustedPublicKeys: [key.publicKeyMeta],
      storagePrefix: 'lk-manage',
      autoSync: false,
      fetcher: async () => {
        throw new Error('Offline');
      },
    });
    const offlineInit = await offlineEngine.initialize();
    assert.equal(offlineInit.state.status, 'offline-cache');
    assert.equal(offlineInit.state.activeVersion, '1.0.0');
    await offlineEngine.syncNow({ force: true });
    assert.equal(offlineEngine.getSnapshot().state.status, 'offline-cache');
    assert.equal(offlineEngine.getSnapshot().activeBundle?.manifest.bundleVersion, '1.0.0');

    // 304 Not Modified succeeds cleanly
    mode = '304';
    const state304 = await engine.syncNow({ force: true });
    assert.equal(state304.status, 'synced');

    // 503 preserves active bundle & credentials
    mode = '503';
    const state503 = await engine.syncNow({ force: true });
    assert.equal(state503.status, 'offline-cache');
    assert.equal(state503.activeVersion, '1.0.0');
    assert.equal(state503.isPaired, true);

    // Corrupt bundle rejected while keeping valid v1.0.0 cache
    mode = 'corrupt';
    const stateCorrupt = await engine.syncNow({ force: true });
    assert.equal(stateCorrupt.status, 'invalid-signature');
    assert.equal(stateCorrupt.activeVersion, '1.0.0');
    const cacheKeys = resolveLkCloudCacheKeys('lk-manage', 'lk-manage');
    assert.equal(loadCachedCloudBundle(cacheKeys)?.manifest.bundleVersion, '1.0.0');

    // Transient 403 must NOT wipe readToken
    mode = 'transient403';
    const stateTransient403 = await engine.syncNow({ force: true });
    assert.equal(stateTransient403.status, 'offline-cache');
    assert.equal(stateTransient403.isPaired, true);
    assert.equal(loadCloudCredentials(cacheKeys)?.readToken, 'lk-read-token-001');

    // Confirmed APP_REVOKED must delete readToken and stop access
    mode = 'revoked403';
    const stateRevoked = await engine.syncNow({ force: true });
    assert.equal(stateRevoked.status, 'revoked');
    assert.equal(stateRevoked.isPaired, false);
    assert.equal(loadCloudCredentials(cacheKeys), null);
  } finally {
    env.restore();
  }
});

test('user local preferences always take priority over Cloud defaults', () => {
  const userSettings = {
    ...DEFAULT_LK_SETTINGS,
    themeMode: 'light' as const,
    highContrast: true,
    accentColor: '#D6B56D',
  };

  // User already customized themeMode ('light') and highContrast (true),
  // but has not touched accentColor ('#D6B56D') or fontScale ('standard').
  const firstSync = computeCloudSettingsPatch(
    userSettings,
    {},
    {
      themeMode: 'dark',
      highContrast: false,
      accentColor: '#4C8DFF',
      fontScale: 'large',
    },
    DEFAULT_LK_SETTINGS,
  );

  assert.equal(firstSync.patch.themeMode, undefined);
  assert.equal(firstSync.patch.highContrast, undefined);
  assert.equal(firstSync.patch.accentColor, '#4C8DFF');
  assert.equal(firstSync.patch.fontScale, 'large');

  // Next Cloud release changes accentColor again — user still hasn't touched accentColor,
  // so it updates from '#4C8DFF' to '#2FB87D', while themeMode stays 'light'
  const afterFirst = { ...userSettings, ...firstSync.patch };
  const secondSync = computeCloudSettingsPatch(
    afterFirst,
    firstSync.nextBaseline,
    {
      themeMode: 'dark',
      accentColor: '#2FB87D',
    },
    DEFAULT_LK_SETTINGS,
  );
  assert.equal(secondSync.patch.themeMode, undefined);
  assert.equal(secondSync.patch.accentColor, '#2FB87D');
});

test('React rendering: remote SVG icon in LkIcon, Cloud theme tokens in LK components, and zero-fetch mode without Cloud', async () => {
  const env = withMockBrowserGlobals();
  const prevFetch = globalThis.fetch;
  let fetchCalled = 0;

  try {
    globalThis.fetch = (async () => {
      fetchCalled += 1;
      throw new Error('fetch should never be called when Cloud is not enabled');
    }) as typeof fetch;

    function NonCloudProbe() {
      const cloudCtx = useLkCloudOptional();
      assert.equal(cloudCtx, null);
      return React.createElement(
        LkCard,
        { title: 'Mode Local', subtitle: 'Sans Cloud' },
        React.createElement(LkButton, { variant: 'primary', leftIcon: 'Sparkles' }, 'Action locale'),
        React.createElement(LkIcon, { name: 'Check' }),
      );
    }

    const nonCloudHtml = renderToStaticMarkup(
      React.createElement(LkProvider, {
        persistSettings: false,
        children: React.createElement(NonCloudProbe),
      }),
    );
    assert.equal(fetchCalled, 0);
    assert.ok(nonCloudHtml.includes('Action locale'));
    assert.ok(nonCloudHtml.includes('Mode Local'));

    // Validate remote SVG icon + Cloud theme application
    const key = await generateSigningPair('lk-key-v1');
    const cloudBundle = await createSignedBundle({
      keyId: 'lk-key-v1',
      algorithm: 'ECDSA-P256-SHA256',
      privateKey: key.privateKey,
      payload: {
        settingsDefaults: {
          accentColor: '#2FB87D',
          themeMode: 'light',
        },
        icons: [
          {
            name: 'cloud-badge',
            viewBox: '0 0 24 24',
            svg: '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2"/></svg>',
          },
        ],
      },
    });
    const validated = await verifyAndValidateCloudBundle(cloudBundle, {
      appId: 'lk-manage',
      trustedPublicKeys: [key.publicKeyMeta],
    });
    assert.equal(validated.ok, true);
    if (!validated.ok) return;

    const cloudHtml = renderToStaticMarkup(
      React.createElement(LkProvider, {
        persistSettings: false,
        defaultSettings: validated.bundle.payload.settingsDefaults,
        children: React.createElement(LkRemoteIconProvider, {
          icons: validated.validatedIcons,
          children: React.createElement(
            LkCard,
            { title: 'Thème Cloud' },
            React.createElement(LkButton, { variant: 'primary' }, 'Synchronisé'),
            React.createElement(LkIcon, { name: 'cloud-badge', accent: true }),
          ),
        }),
      }),
    );

    assert.ok(cloudHtml.includes('data-lk-remote-icon="cloud-badge"'));
    assert.ok(cloudHtml.includes('d="M5 13l4 4L19 7"'));
    assert.ok(cloudHtml.includes('Synchronisé'));
  } finally {
    globalThis.fetch = prevFetch;
    env.restore();
  }
});

test('automatic sync runs on start, enforces manual cooldown, and stops cleanly', async () => {
  const env = withMockBrowserGlobals();
  try {
    const key = await generateSigningPair('lk-key-v1');
    const bundle = await createSignedBundle({
      bundleVersion: '1.0.2',
      keyId: 'lk-key-v1',
      algorithm: 'ECDSA-P256-SHA256',
      privateKey: key.privateKey,
    });

    let manifestFetches = 0;
    const statesSeen: string[] = [];

    const engine = createLkSyncEngine({
      appId: 'lk-manage',
      endpointUrl: 'https://cloud.lk.example/api',
      trustedPublicKeys: [key.publicKeyMeta],
      storagePrefix: 'lk-manage-auto',
      autoSync: true,
      syncIntervalMs: 60_000,
      minManualCooldownMs: 60_000,
      onSyncStateChange: (s) => statesSeen.push(s.status),
      fetcher: async (url) => {
        if (String(url).endsWith('/sdk/manifest')) {
          manifestFetches += 1;
          return new Response(JSON.stringify(bundle), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        return new Response(null, { status: 204 });
      },
    });

    engine.start();
    // Wait briefly for initial async startup sync
    await new Promise((r) => setTimeout(r, 40));
    engine.stop();

    assert.equal(manifestFetches, 1);
    assert.equal(engine.getSnapshot().state.status, 'synced');
    assert.equal(engine.getSnapshot().state.activeVersion, '1.0.2');
    assert.ok(statesSeen.includes('synced'));

    // Immediate non-forced syncNow() must respect minManualCooldownMs and NOT hit network
    await engine.syncNow();
    assert.equal(manifestFetches, 1);

    // Forced syncNow({ force: true }) bypasses cooldown cleanly
    await engine.syncNow({ force: true });
    assert.equal(manifestFetches, 2);
  } finally {
    env.restore();
  }
});

test('permissions enforce strict manifest-to-payload alignment, reject excessive permissions, and block partial application', async () => {
  const key = await generateSigningPair('lk-key-v1');

  // Missing permission for icons section -> atomic rejection
  const unauthorizedIconBundle = await createSignedBundle({
    keyId: 'lk-key-v1',
    algorithm: 'ECDSA-P256-SHA256',
    privateKey: key.privateKey,
    permissions: ['themes', 'settings'],
    payload: {
      cssVariables: { '--lk-accent': '#4C8DFF' },
      icons: [
        {
          name: 'blocked-icon',
          viewBox: '0 0 24 24',
          svg: '<svg viewBox="0 0 24 24"><path d="M0 0h10"/></svg>',
        },
      ],
    },
  });
  const missingIconPerm = await verifyAndValidateCloudBundle(unauthorizedIconBundle, {
    appId: 'lk-manage',
    trustedPublicKeys: [key.publicKeyMeta],
  });
  assert.equal(missingIconPerm.ok, false);
  if (!missingIconPerm.ok) assert.equal(missingIconPerm.code, 'PERMISSION_DENIED');

  // Missing domain permission inside settingsDefaults (glassEnabled without 'glass')
  const missingGlassPermBundle = await createSignedBundle({
    keyId: 'lk-key-v1',
    algorithm: 'ECDSA-P256-SHA256',
    privateKey: key.privateKey,
    permissions: ['themes', 'settings'],
    payload: {
      settingsDefaults: { accentColor: '#4C8DFF', glassEnabled: false },
    },
  });
  const missingGlassCheck = await verifyAndValidateCloudBundle(missingGlassPermBundle, {
    appId: 'lk-manage',
    trustedPublicKeys: [key.publicKeyMeta],
  });
  assert.equal(missingGlassCheck.ok, false);
  if (!missingGlassCheck.ok) assert.equal(missingGlassCheck.code, 'PERMISSION_DENIED');

  // Excessive manifest permission beyond client allowedPermissions
  const excessiveBundle = await createSignedBundle({
    keyId: 'lk-key-v1',
    algorithm: 'ECDSA-P256-SHA256',
    privateKey: key.privateKey,
    permissions: ['themes', 'icons', 'charts'],
    payload: { cssVariables: { '--lk-accent': '#4C8DFF' } },
  });
  const excessiveCheck = await verifyAndValidateCloudBundle(excessiveBundle, {
    appId: 'lk-manage',
    trustedPublicKeys: [key.publicKeyMeta],
    allowedPermissions: ['themes', 'icons'],
  });
  assert.equal(excessiveCheck.ok, false);
  if (!excessiveCheck.ok) assert.equal(excessiveCheck.code, 'EXCESSIVE_MANIFEST_PERMISSION');
});

test('charts and platform validators strictly reject invalid ranges, breakpoints, and formats', async () => {
  const key = await generateSigningPair('lk-key-v1');

  const badCharts = await createSignedBundle({
    keyId: 'lk-key-v1',
    algorithm: 'ECDSA-P256-SHA256',
    privateKey: key.privateKey,
    permissions: ['charts'],
    payload: {
      charts: {
        defaultPalette: ['#4C8DFF'],
        strokeWidth: -2,
      },
    },
  });
  const badChartsRes = await verifyAndValidateCloudBundle(badCharts, {
    appId: 'lk-manage',
    trustedPublicKeys: [key.publicKeyMeta],
  });
  assert.equal(badChartsRes.ok, false);
  if (!badChartsRes.ok) assert.equal(badChartsRes.code, 'PAYLOAD_VALIDATION_FAILED');

  const badPlatform = await createSignedBundle({
    keyId: 'lk-key-v1',
    algorithm: 'ECDSA-P256-SHA256',
    privateKey: key.privateKey,
    permissions: ['platform'],
    payload: {
      platform: {
        breakpoints: { sm: 640, md: 900, lg: 800, xl: 1280 },
        defaultLanguage: 'fr',
      },
    },
  });
  const badPlatformRes = await verifyAndValidateCloudBundle(badPlatform, {
    appId: 'lk-manage',
    trustedPublicKeys: [key.publicKeyMeta],
  });
  assert.equal(badPlatformRes.ok, false);
  if (!badPlatformRes.ok) assert.equal(badPlatformRes.code, 'PAYLOAD_VALIDATION_FAILED');

  const validChartsAndPlatform = await createSignedBundle({
    keyId: 'lk-key-v1',
    algorithm: 'ECDSA-P256-SHA256',
    privateKey: key.privateKey,
    permissions: ['charts', 'platform'],
    payload: {
      charts: { defaultPalette: ['#4C8DFF', '#2FB87D'], strokeWidth: 2.5, showGridByDefault: true },
      platform: {
        breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280 },
        defaultLanguage: 'fr',
        defaultTimeFormat: '24h',
        defaultNumberFormat: 'EU',
      },
    },
  });
  const validRes = await verifyAndValidateCloudBundle(validChartsAndPlatform, {
    appId: 'lk-manage',
    trustedPublicKeys: [key.publicKeyMeta],
  });
  assert.equal(validRes.ok, true);
});

test('download pipeline rejects untrusted bundleRes origin, malformed JSON, and descriptor mismatches while keeping active bundle', async () => {
  const env = withMockBrowserGlobals();
  try {
    const key = await generateSigningPair('lk-key-v1');
    const bundleV1 = await createSignedBundle({
      releaseId: 'rel-100',
      bundleVersion: '1.0.0',
      keyId: 'lk-key-v1',
      algorithm: 'ECDSA-P256-SHA256',
      privateKey: key.privateKey,
    });
    const bundleV2 = await createSignedBundle({
      releaseId: 'rel-200',
      bundleVersion: '1.1.0',
      keyId: 'lk-key-v1',
      algorithm: 'ECDSA-P256-SHA256',
      privateKey: key.privateKey,
    });

    let scenario: 'direct-v1' | 'evil-bundle-origin' | 'bad-json' | 'mismatched-descriptor' | 'valid-descriptor' =
      'direct-v1';

    const engine = createLkSyncEngine({
      appId: 'lk-manage',
      endpointUrl: 'https://cloud.lk.example/api',
      trustedPublicKeys: [key.publicKeyMeta],
      storagePrefix: 'lk-manage-dl',
      autoSync: false,
      minManualCooldownMs: 0,
      fetcher: async (input) => {
        const url = String(input);
        if (url.endsWith('/sdk/manifest')) {
          if (scenario === 'direct-v1') {
            return new Response(JSON.stringify(bundleV1), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            });
          }
          if (scenario === 'bad-json') {
            return new Response('{broken-json', {
              status: 200,
              headers: { 'content-type': 'application/json' },
            });
          }
          if (scenario === 'evil-bundle-origin') {
            return new Response(
              JSON.stringify({
                appId: 'lk-manage',
                releaseId: 'rel-200',
                bundleVersion: '1.1.0',
                minSdkVersion: '1.0.0',
                etag: '"1.1.0"',
                payloadSha256: bundleV2.manifest.payloadSha256,
                bundleUrl: 'https://attacker.evil/steal.json',
              }),
              { status: 200, headers: { 'content-type': 'application/json' } },
            );
          }
          return new Response(
            JSON.stringify({
              appId: 'lk-manage',
              releaseId: scenario === 'mismatched-descriptor' ? 'rel-999' : 'rel-200',
              bundleVersion: '1.1.0',
              minSdkVersion: '1.0.0',
              etag: '"1.1.0"',
              payloadSha256: bundleV2.manifest.payloadSha256,
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          );
        }
        if (url.endsWith('/sdk/bundle/1.1.0')) {
          return new Response(JSON.stringify(bundleV2), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        return new Response('Not found', { status: 404 });
      },
    });

    const s1 = await engine.syncNow({ force: true });
    assert.equal(s1.status, 'synced');
    assert.equal(s1.activeVersion, '1.0.0');

    // Cross-origin descriptor bundleUrl must be blocked before fetching, keeping 1.0.0 active
    scenario = 'evil-bundle-origin';
    const sEvil = await engine.syncNow({ force: true });
    assert.equal(sEvil.status, 'invalid-bundle');
    assert.equal(sEvil.errorCode, 'UNTRUSTED_ORIGIN');
    assert.equal(sEvil.activeVersion, '1.0.0');

    // Malformed JSON must be classified as invalid-bundle / INVALID_JSON_RESPONSE, not NETWORK_ERROR
    scenario = 'bad-json';
    const sBadJson = await engine.syncNow({ force: true });
    assert.equal(sBadJson.status, 'invalid-bundle');
    assert.equal(sBadJson.errorCode, 'INVALID_JSON_RESPONSE');
    assert.equal(sBadJson.activeVersion, '1.0.0');

    // Descriptor releaseId mismatch with downloaded bundle must reject
    scenario = 'mismatched-descriptor';
    const sMismatch = await engine.syncNow({ force: true });
    assert.equal(sMismatch.status, 'invalid-bundle');
    assert.equal(sMismatch.errorCode, 'DESCRIPTOR_BUNDLE_MISMATCH');
    assert.equal(sMismatch.activeVersion, '1.0.0');

    // Also test response.url spoofing via mocked Response.url getter on bundleRes
    scenario = 'valid-descriptor';
    const spoofEngine = createLkSyncEngine({
      appId: 'lk-manage',
      endpointUrl: 'https://cloud.lk.example/api',
      trustedPublicKeys: [key.publicKeyMeta],
      storagePrefix: 'lk-manage-spoof',
      autoSync: false,
      fetcher: async (input) => {
        if (String(input).endsWith('/sdk/manifest')) {
          return new Response(
            JSON.stringify({
              appId: 'lk-manage',
              releaseId: 'rel-200',
              bundleVersion: '1.1.0',
              minSdkVersion: '1.0.0',
              etag: '"1.1.0"',
              payloadSha256: bundleV2.manifest.payloadSha256,
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          );
        }
        const fakeResp = new Response(JSON.stringify(bundleV2), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
        Object.defineProperty(fakeResp, 'url', { value: 'https://rogue-cdn.example/bundle.json' });
        return fakeResp;
      },
    });
    const spoofRes = await spoofEngine.syncNow({ force: true });
    assert.equal(spoofRes.status, 'invalid-bundle');
    assert.equal(spoofRes.errorCode, 'UNTRUSTED_ORIGIN');
  } finally {
    env.restore();
  }
});

test('anti-rollback blocks silent downgrades and accepts explicitly signed rollback authorization', async () => {
  const env = withMockBrowserGlobals();
  try {
    const key = await generateSigningPair('lk-key-v1');
    const oldBundleV1 = await createSignedBundle({
      releaseId: 'rel-100',
      bundleVersion: '1.0.0',
      publishedAt: '2026-11-20T10:00:00.000Z',
      keyId: 'lk-key-v1',
      algorithm: 'ECDSA-P256-SHA256',
      privateKey: key.privateKey,
    });
    const activeBundleV2 = await createSignedBundle({
      releaseId: 'rel-120',
      bundleVersion: '1.2.0',
      publishedAt: '2026-11-22T10:00:00.000Z',
      keyId: 'lk-key-v1',
      algorithm: 'ECDSA-P256-SHA256',
      privateKey: key.privateKey,
    });
    const authorizedRollbackV1_1 = await createSignedBundle({
      releaseId: 'rel-110-rb',
      bundleVersion: '1.1.0',
      publishedAt: '2026-11-24T00:30:00.000Z',
      rollback: {
        replacesVersion: '1.2.0',
        replacesReleaseId: 'rel-120',
        reason: 'Regression fix for 1.2.0',
      },
      keyId: 'lk-key-v1',
      algorithm: 'ECDSA-P256-SHA256',
      privateKey: key.privateKey,
    });

    let served: LkCloudBundle = activeBundleV2;
    const engine = createLkSyncEngine({
      appId: 'lk-manage',
      endpointUrl: 'https://cloud.lk.example/api',
      trustedPublicKeys: [key.publicKeyMeta],
      storagePrefix: 'lk-manage-rb',
      autoSync: false,
      minManualCooldownMs: 0,
      fetcher: async (url) => {
        if (String(url).endsWith('/sdk/manifest')) {
          return new Response(JSON.stringify(served), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        return new Response(null, { status: 204 });
      },
    });

    const initial = await engine.syncNow({ force: true });
    assert.equal(initial.status, 'synced');
    assert.equal(initial.activeVersion, '1.2.0');

    // Silent downgrade to valid signed 1.0.0 must be blocked, keeping 1.2.0 active
    served = oldBundleV1;
    const blocked = await engine.syncNow({ force: true });
    assert.equal(blocked.status, 'invalid-bundle');
    assert.equal(blocked.errorCode, 'ROLLBACK_NOT_AUTHORIZED');
    assert.equal(blocked.activeVersion, '1.2.0');
    assert.equal(engine.getSnapshot().activeBundle?.manifest.releaseId, 'rel-120');

    // Explicitly signed rollback with expired authorizedUntil must be rejected
    const expiredRollback = await createSignedBundle({
      releaseId: 'rel-110-exp',
      bundleVersion: '1.1.0',
      publishedAt: '2026-11-24T00:30:00.000Z',
      rollback: {
        replacesVersion: '1.2.0',
        replacesReleaseId: 'rel-120',
        authorizedUntil: '2020-01-01T00:00:00.000Z',
        reason: 'Expired rollback auth',
      },
      keyId: 'lk-key-v1',
      algorithm: 'ECDSA-P256-SHA256',
      privateKey: key.privateKey,
    });
    served = expiredRollback;
    const expiredRbRes = await engine.syncNow({ force: true });
    assert.equal(expiredRbRes.status, 'invalid-bundle');
    assert.equal(expiredRbRes.errorCode, 'ROLLBACK_AUTHORIZATION_EXPIRED');
    assert.equal(expiredRbRes.activeVersion, '1.2.0');

    // Explicitly signed rollback from rel-120 -> 1.1.0 must succeed
    served = authorizedRollbackV1_1;
    const rolledBack = await engine.syncNow({ force: true });
    assert.equal(rolledBack.status, 'synced');
    assert.equal(rolledBack.activeVersion, '1.1.0');
    assert.equal(engine.getSnapshot().activeBundle?.manifest.releaseId, 'rel-110-rb');
  } finally {
    env.restore();
  }
});

test('React StrictMode stability, dynamic trustedPublicKeys revocation, appDefaultSettings, and themePresets exposure', async () => {
  const env = withMockBrowserGlobals();
  try {
    const keyA = await generateSigningPair('lk-key-A');
    const keyB = await generateSigningPair('lk-key-B');

    const bundleSignedByA = await createSignedBundle({
      releaseId: 'rel-theme-preset',
      bundleVersion: '1.0.0',
      keyId: 'lk-key-A',
      algorithm: 'ECDSA-P256-SHA256',
      privateKey: keyA.privateKey,
      payload: {
        themePresets: [
          {
            id: 'midnight-cobalt',
            name: 'Cobalt Cloud',
            description: 'Cloud preset',
            recommendedMode: 'dark',
            accent: '#4C8DFF',
            darkBg: '#090D16',
            darkSurface: '#131A29',
            lightBg: '#F4F7FC',
            lightSurface: '#FFFFFF',
          },
        ],
      },
    });

    let fetches = 0;
    const engine = createLkSyncEngine({
      appId: 'lk-manage',
      endpointUrl: 'https://cloud.lk.example/api',
      trustedPublicKeys: [keyA.publicKeyMeta, keyB.publicKeyMeta],
      storagePrefix: 'lk-manage-strict',
      autoSync: true,
      syncIntervalMs: 60_000,
      fetcher: async (url) => {
        if (String(url).endsWith('/sdk/manifest')) {
          fetches += 1;
          return new Response(JSON.stringify(bundleSignedByA), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        return new Response(null, { status: 204 });
      },
    });

    // Simulate React 19 StrictMode double mount (start -> immediate stop -> start)
    engine.start();
    engine.stop();
    engine.start();
    await new Promise((r) => setTimeout(r, 40));
    engine.stop();

    assert.equal(fetches, 1);
    assert.equal(engine.getSnapshot().state.status, 'synced');
    assert.equal(engine.getSnapshot().activeBundle?.payload.themePresets?.[0].id, 'midnight-cobalt');

    // Dynamically revoke keyA via updateConfig -> active bundle must be invalidated immediately
    await engine.updateConfig({
      appId: 'lk-manage',
      endpointUrl: 'https://cloud.lk.example/api',
      trustedPublicKeys: [{ ...keyA.publicKeyMeta, revoked: true }, keyB.publicKeyMeta],
      storagePrefix: 'lk-manage-strict',
      autoSync: false,
    });
    assert.equal(engine.getSnapshot().state.status, 'invalid-signature');
    assert.equal(engine.getSnapshot().state.errorCode, 'REVOKED_SIGNING_KEY');
    assert.equal(engine.getSnapshot().activeBundle, null);

    // appDefaultSettings prevents false "user customized" detection when app default differs from core default
    const patchWithAppDefaults = computeCloudSettingsPatch(
      { ...DEFAULT_LK_SETTINGS, themeMode: 'light' },
      {},
      { themeMode: 'dark', accentColor: '#2FB87D' },
      { ...DEFAULT_LK_SETTINGS, themeMode: 'light' },
    );
    assert.equal(patchWithAppDefaults.patch.themeMode, 'dark');
    assert.equal(patchWithAppDefaults.patch.accentColor, '#2FB87D');

    // React.StrictMode rendering of remote SVG rootAttributes (filled icon with fill="currentColor" stroke="none")
    const filledSanitized = sanitizeSvgIcon(
      '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="8"/></svg>',
      '0 0 24 24',
    );
    const strictHtml = renderToStaticMarkup(
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(LkProvider, {
          persistSettings: false,
          children: React.createElement(LkRemoteIconProvider, {
            icons: {
              'filled-dot': {
                name: 'filled-dot',
                viewBox: filledSanitized.viewBox,
                rootAttributes: filledSanitized.rootAttributes,
                nodes: filledSanitized.nodes,
              },
            },
            children: React.createElement(LkIcon, { name: 'filled-dot' }),
          }),
        }),
      ),
    );
    assert.ok(strictHtml.includes('fill="currentColor"'));
    assert.ok(strictHtml.includes('stroke="none"'));

    function CloudContextProbe() {
      const cloud = useLkCloud();
      assert.equal(Array.isArray(cloud.themePresets), true);
      assert.equal(typeof cloud.applyCloudThemePreset, 'function');
      return React.createElement('span', null, cloud.state.status);
    }

    const cloudStrictHtml = renderToStaticMarkup(
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(LkCloudProvider, {
          persistSettings: false,
          defaultSettings: { themeMode: 'light' },
          config: {
            appId: 'lk-manage',
            endpointUrl: 'https://cloud.lk.example/api',
            trustedPublicKeys: [keyA.publicKeyMeta],
            autoSync: false,
          },
          children: React.createElement(CloudContextProbe),
        }),
      ),
    );
    assert.ok(cloudStrictHtml.includes('idle'));
  } finally {
    env.restore();
  }
});

test('SVG sanitizer rejects invalid numeric/named entities and invalid geometric bounds', () => {
  const invalidSvgs = [
    // Surrogate code point entity
    '<svg viewBox="0 0 24 24"><path d="&#xD800;M0 0"/></svg>',
    // Control character entity
    '<svg viewBox="0 0 24 24"><path d="&#7;M0 0h10"/></svg>',
    // Unknown named entity
    '<svg viewBox="0 0 24 24"><path d="&evil;M0 0h10"/></svg>',
    // Negative radius
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="-4"/></svg>',
    // Negative stroke-width
    '<svg viewBox="0 0 24 24"><path d="M0 0h10" stroke-width="-1"/></svg>',
    // Out-of-bounds opacity > 1
    '<svg viewBox="0 0 24 24"><path d="M0 0h10" opacity="1.5"/></svg>',
    // Invalid rotate() arg count (2 args invalid in SVG)
    '<svg viewBox="0 0 24 24"><g transform="rotate(45, 10)"><path d="M0 0h10"/></g></svg>',
    // Odd number of point coordinates
    '<svg viewBox="0 0 24 24"><polygon points="0 0 10"/></svg>',
  ];

  for (const svg of invalidSvgs) {
    assert.throws(() => sanitizeSvgIcon(svg, '0 0 24 24'));
  }
});

