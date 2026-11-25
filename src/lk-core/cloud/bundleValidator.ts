import { DEFAULT_LK_SETTINGS } from '../storage/lkStorage';
import type { LkSettings, LkThemePreset } from '../types';
import { canonicalJsonStringify } from './canonicalJson';
import { compareSemver, isSdkVersionCompatible, parseSemver } from './semver';
import { verifyCloudBundleSignature } from './signature';
import { sanitizeSvgIcon } from './xmlSvgSanitizer';
import type {
  LkCloudBundle,
  LkCloudBundleCheckResult,
  LkCloudClientConfig,
  LkCloudManifest,
  LkCloudPermission,
  LkValidatedCloudIcon,
} from './types';

const MAX_BUNDLE_BYTES = 512_000;
const MAX_THEME_PRESETS = 20;
const MAX_CSS_VARIABLES = 128;
const MAX_ICONS = 200;
const MAX_CHART_PALETTE = 16;

const ALLOWED_PERMISSIONS = new Set<LkCloudPermission>([
  'themes',
  'icons',
  'glass',
  'motion',
  'settings',
  'accessibility',
  'charts',
  'platform',
]);

const ALLOWED_PAYLOAD_SECTIONS = new Set([
  'settingsDefaults',
  'themePresets',
  'cssVariables',
  'icons',
  'charts',
  'platform',
]);

const ALLOWED_CHARTS_KEYS = new Set(['defaultPalette', 'strokeWidth', 'showGridByDefault']);
const ALLOWED_PLATFORM_KEYS = new Set([
  'breakpoints',
  'defaultLanguage',
  'defaultTimeFormat',
  'defaultNumberFormat',
]);
const ALLOWED_BREAKPOINT_KEYS = new Set(['sm', 'md', 'lg', 'xl']);

const SAFE_CSS_VAR_NAME_RE = /^--lk-[a-z0-9-]+$/;
const UNSAFE_CSS_VALUE_RE = /(url\s*\(|expression\s*\(|javascript:|@import|<|>|;|{|})/i;
const SAFE_ICON_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const STRICT_HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

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

const SETTING_DOMAIN_PERMISSION: Record<keyof LkSettings, LkCloudPermission | null> = {
  themeMode: 'themes',
  themePreset: 'themes',
  accentColor: 'themes',
  customDarkBg: 'themes',
  customLightBg: 'themes',
  fontFamily: 'themes',
  density: 'themes',

  glassEnabled: 'glass',
  blurIntensity: 'glass',
  glassOpacity: 'glass',
  specularHighlight: 'glass',

  motionLevel: 'motion',
  motionSpeed: 'motion',

  fontScale: 'accessibility',
  highContrast: 'accessibility',
  enhancedFocusRings: 'accessibility',

  notificationsEnabled: null,
  quietMode: null,
  visualCuesEnabled: null,

  language: 'platform',
  timeFormat: 'platform',
  numberFormat: 'platform',

  localOnlyMode: null,
  storeUsageHistory: null,
  diagnosticsEnabled: null,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertStrictHexColor(raw: unknown, fieldName: string): string {
  if (typeof raw !== 'string') {
    throw new Error(`Expected hex color string for "${fieldName}".`);
  }
  const trimmed = raw.trim();
  if (!STRICT_HEX_COLOR_RE.test(trimmed)) {
    throw new Error(`Invalid hex color "${trimmed}" for "${fieldName}".`);
  }
  if (trimmed.length === 4) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return trimmed.toUpperCase();
}

function resolveCssVariablePermission(varName: string): LkCloudPermission {
  if (
    varName.startsWith('--lk-glass') ||
    varName.startsWith('--lk-blur') ||
    varName.startsWith('--lk-specular')
  ) {
    return 'glass';
  }
  if (varName.startsWith('--lk-motion')) {
    return 'motion';
  }
  if (varName.startsWith('--lk-focus')) {
    return 'accessibility';
  }
  return 'themes';
}

function validateThemePreset(raw: unknown): LkThemePreset {
  if (!isPlainObject(raw)) {
    throw new Error('Theme preset must be an object.');
  }
  const id = raw.id;
  if (typeof id !== 'string' || !VALID_PRESETS.has(id)) {
    throw new Error(`Invalid theme preset id "${String(id)}".`);
  }
  if (typeof raw.name !== 'string' || !raw.name.trim() || raw.name.trim().length > 64) {
    throw new Error('Theme preset must include a non-empty name (max 64 chars).');
  }
  if (raw.description !== undefined && (typeof raw.description !== 'string' || raw.description.length > 240)) {
    throw new Error('Theme preset description must be a string (max 240 chars).');
  }
  if (raw.recommendedMode !== 'dark' && raw.recommendedMode !== 'light') {
    throw new Error(`Invalid recommendedMode "${String(raw.recommendedMode)}" in theme preset.`);
  }
  return {
    id: id as LkThemePreset['id'],
    name: raw.name.trim(),
    description: typeof raw.description === 'string' ? raw.description.trim() : '',
    recommendedMode: raw.recommendedMode,
    accent: assertStrictHexColor(raw.accent, 'themePreset.accent'),
    darkBg: assertStrictHexColor(raw.darkBg, 'themePreset.darkBg'),
    darkSurface: assertStrictHexColor(raw.darkSurface, 'themePreset.darkSurface'),
    lightBg: assertStrictHexColor(raw.lightBg, 'themePreset.lightBg'),
    lightSurface: assertStrictHexColor(raw.lightSurface, 'themePreset.lightSurface'),
  };
}

function validateSettingsDefaults(
  raw: unknown,
  grantedSet: ReadonlySet<LkCloudPermission>,
): void {
  if (!grantedSet.has('settings')) {
    throw new Error('Missing "settings" permission for payload.settingsDefaults.');
  }
  if (!isPlainObject(raw)) {
    throw new Error('payload.settingsDefaults must be an object.');
  }

  const keys = Object.keys(raw);
  if (keys.length === 0) return;

  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_LK_SETTINGS, key)) {
      throw new Error(`Unknown setting key "${key}" in payload.settingsDefaults.`);
    }
    const settingKey = key as keyof LkSettings;
    const domainPerm = SETTING_DOMAIN_PERMISSION[settingKey];
    if (domainPerm && !grantedSet.has(domainPerm)) {
      throw new Error(
        `Missing "${domainPerm}" permission required by payload.settingsDefaults.${settingKey}.`,
      );
    }

    const val = raw[key];
    switch (settingKey) {
      case 'themeMode':
        if (typeof val !== 'string' || !VALID_THEME_MODES.has(val)) {
          throw new Error(`Invalid settingsDefaults.themeMode "${String(val)}".`);
        }
        break;
      case 'themePreset':
        if (typeof val !== 'string' || !VALID_PRESETS.has(val)) {
          throw new Error(`Invalid settingsDefaults.themePreset "${String(val)}".`);
        }
        break;
      case 'accentColor':
      case 'customDarkBg':
      case 'customLightBg':
        assertStrictHexColor(val, `settingsDefaults.${settingKey}`);
        break;
      case 'blurIntensity':
        if (typeof val !== 'number' || !Number.isFinite(val) || val < 0 || val > 32) {
          throw new Error(`Invalid settingsDefaults.blurIntensity "${String(val)}".`);
        }
        break;
      case 'glassOpacity':
        if (typeof val !== 'number' || !Number.isFinite(val) || val < 0.35 || val > 0.95) {
          throw new Error(`Invalid settingsDefaults.glassOpacity "${String(val)}".`);
        }
        break;
      case 'motionLevel':
        if (typeof val !== 'string' || !VALID_MOTION_LEVELS.has(val)) {
          throw new Error(`Invalid settingsDefaults.motionLevel "${String(val)}".`);
        }
        break;
      case 'motionSpeed':
        if (typeof val !== 'number' || !VALID_MOTION_SPEEDS.has(val)) {
          throw new Error(`Invalid settingsDefaults.motionSpeed "${String(val)}".`);
        }
        break;
      case 'fontScale':
        if (typeof val !== 'string' || !VALID_FONT_SCALES.has(val)) {
          throw new Error(`Invalid settingsDefaults.fontScale "${String(val)}".`);
        }
        break;
      case 'fontFamily':
        if (typeof val !== 'string' || !VALID_FONT_FAMILIES.has(val)) {
          throw new Error(`Invalid settingsDefaults.fontFamily "${String(val)}".`);
        }
        break;
      case 'density':
        if (typeof val !== 'string' || !VALID_DENSITIES.has(val)) {
          throw new Error(`Invalid settingsDefaults.density "${String(val)}".`);
        }
        break;
      case 'language':
        if (typeof val !== 'string' || !VALID_LANGUAGES.has(val)) {
          throw new Error(`Invalid settingsDefaults.language "${String(val)}".`);
        }
        break;
      case 'timeFormat':
        if (typeof val !== 'string' || !VALID_TIME_FORMATS.has(val)) {
          throw new Error(`Invalid settingsDefaults.timeFormat "${String(val)}".`);
        }
        break;
      case 'numberFormat':
        if (typeof val !== 'string' || !VALID_NUMBER_FORMATS.has(val)) {
          throw new Error(`Invalid settingsDefaults.numberFormat "${String(val)}".`);
        }
        break;
      default:
        if (typeof val !== 'boolean') {
          throw new Error(`Expected boolean for settingsDefaults.${settingKey}.`);
        }
        break;
    }
  }
}

function validateChartsConfig(raw: unknown): void {
  if (!isPlainObject(raw)) {
    throw new Error('payload.charts must be an object.');
  }
  for (const key of Object.keys(raw)) {
    if (!ALLOWED_CHARTS_KEYS.has(key)) {
      throw new Error(`Unknown property "${key}" in payload.charts.`);
    }
  }
  if (raw.defaultPalette !== undefined) {
    if (
      !Array.isArray(raw.defaultPalette) ||
      raw.defaultPalette.length === 0 ||
      raw.defaultPalette.length > MAX_CHART_PALETTE
    ) {
      throw new Error(`payload.charts.defaultPalette must contain 1 to ${MAX_CHART_PALETTE} colors.`);
    }
    for (const color of raw.defaultPalette) {
      assertStrictHexColor(color, 'charts.defaultPalette');
    }
  }
  if (raw.strokeWidth !== undefined) {
    if (
      typeof raw.strokeWidth !== 'number' ||
      !Number.isFinite(raw.strokeWidth) ||
      raw.strokeWidth < 0.5 ||
      raw.strokeWidth > 12
    ) {
      throw new Error('payload.charts.strokeWidth must be a finite number between 0.5 and 12.');
    }
  }
  if (raw.showGridByDefault !== undefined && typeof raw.showGridByDefault !== 'boolean') {
    throw new Error('payload.charts.showGridByDefault must be a boolean.');
  }
}

function validatePlatformConfig(raw: unknown): void {
  if (!isPlainObject(raw)) {
    throw new Error('payload.platform must be an object.');
  }
  for (const key of Object.keys(raw)) {
    if (!ALLOWED_PLATFORM_KEYS.has(key)) {
      throw new Error(`Unknown property "${key}" in payload.platform.`);
    }
  }
  if (raw.breakpoints !== undefined) {
    if (!isPlainObject(raw.breakpoints)) {
      throw new Error('payload.platform.breakpoints must be an object.');
    }
    const bpKeys = Object.keys(raw.breakpoints);
    for (const key of bpKeys) {
      if (!ALLOWED_BREAKPOINT_KEYS.has(key)) {
        throw new Error(`Unknown breakpoint "${key}" in payload.platform.breakpoints.`);
      }
    }
    for (const reqKey of ['sm', 'md', 'lg', 'xl'] as const) {
      const val = raw.breakpoints[reqKey];
      if (typeof val !== 'number' || !Number.isFinite(val) || val < 200 || val > 7680) {
        throw new Error(`Breakpoint "${reqKey}" must be a finite number between 200 and 7680.`);
      }
    }
    const sm = raw.breakpoints.sm as number;
    const md = raw.breakpoints.md as number;
    const lg = raw.breakpoints.lg as number;
    const xl = raw.breakpoints.xl as number;
    if (!(sm < md && md < lg && lg < xl)) {
      throw new Error('Platform breakpoints must be strictly ascending (sm < md < lg < xl).');
    }
  }
  if (
    raw.defaultLanguage !== undefined &&
    (typeof raw.defaultLanguage !== 'string' || !VALID_LANGUAGES.has(raw.defaultLanguage))
  ) {
    throw new Error(`Invalid payload.platform.defaultLanguage "${String(raw.defaultLanguage)}".`);
  }
  if (
    raw.defaultTimeFormat !== undefined &&
    (typeof raw.defaultTimeFormat !== 'string' || !VALID_TIME_FORMATS.has(raw.defaultTimeFormat))
  ) {
    throw new Error(`Invalid payload.platform.defaultTimeFormat "${String(raw.defaultTimeFormat)}".`);
  }
  if (
    raw.defaultNumberFormat !== undefined &&
    (typeof raw.defaultNumberFormat !== 'string' || !VALID_NUMBER_FORMATS.has(raw.defaultNumberFormat))
  ) {
    throw new Error(`Invalid payload.platform.defaultNumberFormat "${String(raw.defaultNumberFormat)}".`);
  }
}

export function sanitizeCloudCssVariables(
  rawVars: Record<string, unknown> | undefined,
  grantedSet?: ReadonlySet<LkCloudPermission>,
): Record<string, string> {
  if (rawVars === undefined) return {};
  if (!isPlainObject(rawVars)) {
    throw new Error('payload.cssVariables must be a key-value object.');
  }
  const entries = Object.entries(rawVars);
  if (entries.length > MAX_CSS_VARIABLES) {
    throw new Error(`payload.cssVariables exceeds maximum of ${MAX_CSS_VARIABLES} variables.`);
  }
  const clean: Record<string, string> = {};
  for (const [key, val] of entries) {
    if (!SAFE_CSS_VAR_NAME_RE.test(key)) {
      throw new Error(`Disallowed CSS variable name "${key}". Only "--lk-*" is permitted.`);
    }
    if (grantedSet) {
      const requiredPerm = resolveCssVariablePermission(key);
      if (!grantedSet.has(requiredPerm)) {
        throw new Error(`Missing "${requiredPerm}" permission for CSS variable "${key}".`);
      }
    }
    if (typeof val !== 'string' || !val.trim() || val.length > 256) {
      throw new Error(`Invalid CSS value for "${key}".`);
    }
    if (UNSAFE_CSS_VALUE_RE.test(val)) {
      throw new Error(`Unsafe CSS value rejected for "${key}".`);
    }
    clean[key] = val.trim();
  }
  return clean;
}

export function checkRollbackAuthorization(
  nextManifest: LkCloudManifest,
  activeManifest: LkCloudManifest | null | undefined,
  nowMs: number = Date.now(),
): { allowed: true } | { allowed: false; code: string; message: string } {
  if (!activeManifest) {
    return { allowed: true };
  }

  const cmp = compareSemver(nextManifest.bundleVersion, activeManifest.bundleVersion);
  if (cmp === null) {
    return {
      allowed: false,
      code: 'INVALID_SEMVER_COMPARISON',
      message: 'Unable to compare bundleVersion against active version.',
    };
  }

  if (cmp > 0) {
    return { allowed: true };
  }

  const nextPubMs = Date.parse(nextManifest.publishedAt);
  const activePubMs = Date.parse(activeManifest.publishedAt);

  if (cmp === 0) {
    if (nextManifest.releaseId === activeManifest.releaseId) {
      return { allowed: true };
    }
    if (!Number.isNaN(nextPubMs) && !Number.isNaN(activePubMs) && nextPubMs > activePubMs) {
      return { allowed: true };
    }
    return {
      allowed: false,
      code: 'STALE_RELEASE_REJECTED',
      message: `Rejected older release "${nextManifest.releaseId}" at version ${nextManifest.bundleVersion}.`,
    };
  }

  // cmp < 0 : downgrade requires explicit signed rollback authorization inside manifest
  const rollback = nextManifest.rollback;
  if (!rollback) {
    return {
      allowed: false,
      code: 'ROLLBACK_NOT_AUTHORIZED',
      message: `Downgrade from ${activeManifest.bundleVersion} to ${nextManifest.bundleVersion} blocked without signed rollback authorization.`,
    };
  }

  const replacesCmp = compareSemver(activeManifest.bundleVersion, rollback.replacesVersion);
  if (replacesCmp === null || replacesCmp > 0) {
    return {
      allowed: false,
      code: 'ROLLBACK_SCOPE_MISMATCH',
      message: `Signed rollback replaces up to ${rollback.replacesVersion}, not active version ${activeManifest.bundleVersion}.`,
    };
  }

  if (
    rollback.replacesReleaseId !== undefined &&
    rollback.replacesReleaseId !== activeManifest.releaseId
  ) {
    return {
      allowed: false,
      code: 'ROLLBACK_RELEASE_MISMATCH',
      message: `Signed rollback targets release "${rollback.replacesReleaseId}", not "${activeManifest.releaseId}".`,
    };
  }

  if (rollback.authorizedUntil !== undefined) {
    const untilMs = Date.parse(rollback.authorizedUntil);
    if (Number.isNaN(untilMs) || untilMs <= nowMs) {
      return {
        allowed: false,
        code: 'ROLLBACK_AUTHORIZATION_EXPIRED',
        message: 'Signed rollback authorization has expired.',
      };
    }
  }

  if (Number.isNaN(nextPubMs) || Number.isNaN(activePubMs) || nextPubMs <= activePubMs) {
    return {
      allowed: false,
      code: 'ROLLBACK_STALE_TIMESTAMP',
      message: 'Authorized rollback bundle must be published after the active release.',
    };
  }

  return { allowed: true };
}

export async function verifyAndValidateCloudBundle(
  rawBundle: unknown,
  config: Pick<LkCloudClientConfig, 'appId' | 'trustedPublicKeys' | 'sdkVersion' | 'allowedPermissions'>,
  nowMs: number = Date.now(),
  options?: { activeManifest?: LkCloudManifest | null },
): Promise<LkCloudBundleCheckResult> {
  if (!isPlainObject(rawBundle)) {
    return {
      ok: false,
      reason: 'invalid-bundle',
      code: 'MALFORMED_BUNDLE',
      message: 'Cloud bundle must be a JSON object.',
    };
  }

  let serializedSize = 0;
  try {
    serializedSize = canonicalJsonStringify(rawBundle).length;
  } catch (err) {
    return {
      ok: false,
      reason: 'invalid-bundle',
      code: 'NON_CANONICAL_BUNDLE',
      message: err instanceof Error ? err.message : 'Bundle contains unserializable data.',
    };
  }

  if (serializedSize > MAX_BUNDLE_BYTES) {
    return {
      ok: false,
      reason: 'invalid-bundle',
      code: 'BUNDLE_TOO_LARGE',
      message: `Bundle size (${serializedSize} B) exceeds ${MAX_BUNDLE_BYTES} B limit.`,
    };
  }

  const manifest = rawBundle.manifest;
  const payload = rawBundle.payload;
  const signature = rawBundle.signature;

  if (!isPlainObject(manifest) || !isPlainObject(payload) || !isPlainObject(signature)) {
    return {
      ok: false,
      reason: 'invalid-bundle',
      code: 'MISSING_BUNDLE_SECTIONS',
      message: 'Bundle must include manifest, payload, and signature objects.',
    };
  }

  if (manifest.schemaVersion !== '1.0') {
    return {
      ok: false,
      reason: 'incompatible',
      code: 'UNSUPPORTED_SCHEMA_VERSION',
      message: `Unsupported bundle schemaVersion "${String(manifest.schemaVersion)}".`,
    };
  }

  if (typeof manifest.appId !== 'string' || manifest.appId !== config.appId) {
    return {
      ok: false,
      reason: 'invalid-bundle',
      code: 'APP_ID_MISMATCH',
      message: `Bundle appId "${String(manifest.appId)}" does not match "${config.appId}".`,
    };
  }

  const publishedMs =
    typeof manifest.publishedAt === 'string' ? Date.parse(manifest.publishedAt) : Number.NaN;

  if (
    typeof manifest.releaseId !== 'string' ||
    !manifest.releaseId.trim() ||
    typeof manifest.bundleVersion !== 'string' ||
    !parseSemver(manifest.bundleVersion) ||
    typeof manifest.minSdkVersion !== 'string' ||
    !parseSemver(manifest.minSdkVersion) ||
    (manifest.maxSdkVersion !== undefined &&
      (typeof manifest.maxSdkVersion !== 'string' || !parseSemver(manifest.maxSdkVersion))) ||
    typeof manifest.publishedAt !== 'string' ||
    Number.isNaN(publishedMs) ||
    typeof manifest.payloadSha256 !== 'string' ||
    !/^[a-fA-F0-9]{64}$/.test(manifest.payloadSha256)
  ) {
    return {
      ok: false,
      reason: 'invalid-bundle',
      code: 'INVALID_MANIFEST_FIELDS',
      message: 'Manifest is missing valid releaseId, SemVer versions, ISO publishedAt, or SHA-256 hash.',
    };
  }

  if (manifest.maxSdkVersion !== undefined) {
    const sdkRangeCmp = compareSemver(manifest.minSdkVersion, manifest.maxSdkVersion);
    if (sdkRangeCmp !== null && sdkRangeCmp > 0) {
      return {
        ok: false,
        reason: 'incompatible',
        code: 'INVALID_SDK_RANGE',
        message: 'Manifest minSdkVersion exceeds maxSdkVersion.',
      };
    }
  }

  if (!Array.isArray(manifest.permissions)) {
    return {
      ok: false,
      reason: 'invalid-bundle',
      code: 'INVALID_PERMISSIONS',
      message: 'Manifest permissions must be an array.',
    };
  }

  const grantedSet = new Set<LkCloudPermission>();
  const clientAllowedSet = config.allowedPermissions
    ? new Set<LkCloudPermission>(config.allowedPermissions)
    : null;

  for (const perm of manifest.permissions) {
    if (typeof perm !== 'string' || !ALLOWED_PERMISSIONS.has(perm as LkCloudPermission)) {
      return {
        ok: false,
        reason: 'invalid-bundle',
        code: 'UNKNOWN_PERMISSION',
        message: `Unknown permission "${String(perm)}" in manifest.`,
      };
    }
    const typedPerm = perm as LkCloudPermission;
    if (grantedSet.has(typedPerm)) {
      return {
        ok: false,
        reason: 'invalid-bundle',
        code: 'DUPLICATE_PERMISSION',
        message: `Duplicate permission "${typedPerm}" in manifest.`,
      };
    }
    if (clientAllowedSet && !clientAllowedSet.has(typedPerm)) {
      return {
        ok: false,
        reason: 'invalid-bundle',
        code: 'EXCESSIVE_MANIFEST_PERMISSION',
        message: `Manifest permission "${typedPerm}" exceeds client allowedPermissions.`,
      };
    }
    grantedSet.add(typedPerm);
  }

  if (manifest.expiresAt !== undefined) {
    if (typeof manifest.expiresAt !== 'string') {
      return {
        ok: false,
        reason: 'invalid-bundle',
        code: 'INVALID_EXPIRY',
        message: 'Manifest expiresAt must be an ISO-8601 date string.',
      };
    }
    const expMs = Date.parse(manifest.expiresAt);
    if (Number.isNaN(expMs) || expMs <= nowMs) {
      return {
        ok: false,
        reason: 'invalid-bundle',
        code: 'BUNDLE_EXPIRED',
        message: 'Cloud bundle has expired.',
      };
    }
    if (expMs <= publishedMs) {
      return {
        ok: false,
        reason: 'invalid-bundle',
        code: 'INVALID_EXPIRY',
        message: 'Manifest expiresAt must be later than publishedAt.',
      };
    }
  }

  if (manifest.rollback !== undefined) {
    if (!isPlainObject(manifest.rollback)) {
      return {
        ok: false,
        reason: 'invalid-bundle',
        code: 'INVALID_ROLLBACK_METADATA',
        message: 'Manifest rollback authorization must be an object.',
      };
    }
    const rb = manifest.rollback;
    if (
      typeof rb.replacesVersion !== 'string' ||
      !parseSemver(rb.replacesVersion) ||
      typeof rb.reason !== 'string' ||
      !rb.reason.trim() ||
      rb.reason.length > 256 ||
      (rb.replacesReleaseId !== undefined &&
        (typeof rb.replacesReleaseId !== 'string' || !rb.replacesReleaseId.trim())) ||
      (rb.authorizedUntil !== undefined &&
        (typeof rb.authorizedUntil !== 'string' || Number.isNaN(Date.parse(rb.authorizedUntil))))
    ) {
      return {
        ok: false,
        reason: 'invalid-bundle',
        code: 'INVALID_ROLLBACK_METADATA',
        message: 'Manifest rollback authorization fields are malformed.',
      };
    }
  }

  const sdkVersion = config.sdkVersion ?? '1.0.0';
  const compat = isSdkVersionCompatible(
    sdkVersion,
    manifest.minSdkVersion,
    typeof manifest.maxSdkVersion === 'string' ? manifest.maxSdkVersion : undefined,
  );
  if (!compat.compatible) {
    return {
      ok: false,
      reason: 'incompatible',
      code: 'SDK_VERSION_INCOMPATIBLE',
      message: compat.reason ?? 'SDK version incompatible with bundle.',
    };
  }

  const bundle = rawBundle as unknown as LkCloudBundle;
  const sigResult = await verifyCloudBundleSignature(bundle, config.trustedPublicKeys);
  if (!sigResult.valid) {
    return {
      ok: false,
      reason: 'invalid-signature',
      code: sigResult.code,
      message: sigResult.message,
    };
  }

  const rollbackCheck = checkRollbackAuthorization(
    bundle.manifest,
    options?.activeManifest,
    nowMs,
  );
  if (!rollbackCheck.allowed) {
    return {
      ok: false,
      reason: 'invalid-bundle',
      code: rollbackCheck.code,
      message: rollbackCheck.message,
    };
  }

  // Atomic permission + payload validation: any violation rejects the whole bundle
  try {
    for (const payloadKey of Object.keys(payload)) {
      if (!ALLOWED_PAYLOAD_SECTIONS.has(payloadKey)) {
        throw new Error(`Unknown payload section "${payloadKey}".`);
      }
    }

    if (payload.settingsDefaults !== undefined) {
      validateSettingsDefaults(payload.settingsDefaults, grantedSet);
    }

    if (payload.themePresets !== undefined) {
      if (!grantedSet.has('themes')) {
        throw new Error('Missing "themes" permission for payload.themePresets.');
      }
      if (!Array.isArray(payload.themePresets) || payload.themePresets.length > MAX_THEME_PRESETS) {
        throw new Error(`payload.themePresets must be an array of at most ${MAX_THEME_PRESETS} presets.`);
      }
      payload.themePresets.forEach((preset) => validateThemePreset(preset));
    }

    const sanitizedCssVariables = sanitizeCloudCssVariables(
      payload.cssVariables as Record<string, unknown> | undefined,
      grantedSet,
    );

    const validatedIcons: Record<string, LkValidatedCloudIcon> = {};
    if (payload.icons !== undefined) {
      if (!grantedSet.has('icons')) {
        throw new Error('Missing "icons" permission for payload.icons.');
      }
      if (!Array.isArray(payload.icons) || payload.icons.length > MAX_ICONS) {
        throw new Error(`payload.icons must be an array of at most ${MAX_ICONS} icons.`);
      }
      for (const rawIcon of payload.icons) {
        if (!isPlainObject(rawIcon)) {
          throw new Error('Each remote icon definition must be an object.');
        }
        const name = typeof rawIcon.name === 'string' ? rawIcon.name.trim() : '';
        if (!SAFE_ICON_NAME_RE.test(name)) {
          throw new Error(`Invalid remote icon name "${String(rawIcon.name)}".`);
        }
        if (Object.prototype.hasOwnProperty.call(validatedIcons, name)) {
          throw new Error(`Duplicate remote icon name "${name}".`);
        }
        if (
          rawIcon.label !== undefined &&
          (typeof rawIcon.label !== 'string' || rawIcon.label.length > 64 || /[<>]/.test(rawIcon.label))
        ) {
          throw new Error(`Invalid icon label for "${name}".`);
        }
        if (
          rawIcon.category !== undefined &&
          (typeof rawIcon.category !== 'string' ||
            rawIcon.category.length > 64 ||
            /[<>]/.test(rawIcon.category))
        ) {
          throw new Error(`Invalid icon category for "${name}".`);
        }
        const viewBox = typeof rawIcon.viewBox === 'string' ? rawIcon.viewBox : '';
        const svg = typeof rawIcon.svg === 'string' ? rawIcon.svg : '';
        const parsedSvg = sanitizeSvgIcon(svg, viewBox);
        validatedIcons[name] = {
          name,
          label: typeof rawIcon.label === 'string' ? rawIcon.label.trim() : undefined,
          category: typeof rawIcon.category === 'string' ? rawIcon.category.trim() : undefined,
          viewBox: parsedSvg.viewBox,
          rootAttributes: parsedSvg.rootAttributes,
          nodes: parsedSvg.nodes,
        };
      }
    }

    if (payload.charts !== undefined) {
      if (!grantedSet.has('charts')) {
        throw new Error('Missing "charts" permission for payload.charts.');
      }
      validateChartsConfig(payload.charts);
    }

    if (payload.platform !== undefined) {
      if (!grantedSet.has('platform')) {
        throw new Error('Missing "platform" permission for payload.platform.');
      }
      validatePlatformConfig(payload.platform);
    }

    return {
      ok: true,
      bundle,
      validatedIcons,
      sanitizedCssVariables,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cloud payload validation failed.';
    const isPermErr = /permission/i.test(message);
    return {
      ok: false,
      reason: 'invalid-bundle',
      code: isPermErr ? 'PERMISSION_DENIED' : 'PAYLOAD_VALIDATION_FAILED',
      message,
    };
  }
}
