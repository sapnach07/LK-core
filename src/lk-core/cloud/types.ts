import type { LkSettings, LkThemePreset, LkThemePresetId } from '../types';

export type LkCloudAlgorithm = 'ECDSA-P256-SHA256' | 'Ed25519';

export type LkCloudSignatureVersion = 'lk-sig-v1';

export type LkCloudPermission =
  | 'themes'
  | 'icons'
  | 'glass'
  | 'motion'
  | 'settings'
  | 'accessibility'
  | 'charts'
  | 'platform';

export type LkCloudBackendErrorCode =
  | 'APP_REVOKED'
  | 'TOKEN_REVOKED'
  | 'TOKEN_PERMANENTLY_INVALID'
  | 'APP_DELETED'
  | 'PAIRING_EXPIRED'
  | 'PAIRING_ALREADY_USED'
  | 'PAIRING_INVALID'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED_TRANSIENT'
  | 'FORBIDDEN_TRANSIENT';

export const DEFINITIVE_REVOCATION_CODES: ReadonlySet<string> = new Set<LkCloudBackendErrorCode>([
  'APP_REVOKED',
  'TOKEN_REVOKED',
  'TOKEN_PERMANENTLY_INVALID',
  'APP_DELETED',
]);

export type LkCloudSyncStatus =
  | 'idle'
  | 'pairing'
  | 'syncing'
  | 'synced'
  | 'offline-cache'
  | 'incompatible'
  | 'invalid-signature'
  | 'invalid-bundle'
  | 'revoked'
  | 'error';

export interface LkCloudPublicKey {
  keyId: string;
  algorithm: LkCloudAlgorithm;
  /** Base64-encoded SubjectPublicKeyInfo (SPKI) public key — never a private key */
  spkiBase64: string;
  notBefore?: string;
  notAfter?: string;
  revoked?: boolean;
}

export type LkSafeSvgTag = 'path' | 'circle' | 'rect' | 'line' | 'polyline' | 'polygon' | 'g';

export interface LkSafeSvgElement {
  tag: LkSafeSvgTag;
  attributes: Record<string, string>;
  children?: LkSafeSvgElement[];
}

export interface LkCloudIconInput {
  name: string;
  label?: string;
  category?: string;
  viewBox: string;
  /** Raw SVG XML received from Cloud, parsed and sanitized by xmlSvgSanitizer */
  svg: string;
}

export interface LkValidatedCloudIcon {
  name: string;
  label?: string;
  category?: string;
  viewBox: string;
  rootAttributes?: Record<string, string>;
  nodes: LkSafeSvgElement[];
}

export interface LkCloudChartsConfig {
  defaultPalette?: string[];
  strokeWidth?: number;
  showGridByDefault?: boolean;
}

export interface LkCloudPlatformConfig {
  breakpoints?: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  defaultLanguage?: LkSettings['language'];
  defaultTimeFormat?: LkSettings['timeFormat'];
  defaultNumberFormat?: LkSettings['numberFormat'];
}

export interface LkCloudPayload {
  /** Cloud defaults applied only to settings not locally customized by the end user */
  settingsDefaults?: Partial<LkSettings>;
  /** Cloud theme presets */
  themePresets?: LkThemePreset[];
  /** Validated CSS custom properties (--lk-* only) */
  cssVariables?: Record<string, string>;
  /** Remote SVG icons (parsed with strict XML allowlist) */
  icons?: LkCloudIconInput[];
  /** Shared LK Charts config */
  charts?: LkCloudChartsConfig;
  /** Shared responsive & regional config */
  platform?: LkCloudPlatformConfig;
}

export interface LkCloudRollbackAuthorization {
  /** Highest active bundle version this signed rollback is authorized to replace */
  replacesVersion: string;
  /** Non-empty audit reason for the rollback */
  reason: string;
  /** Optional specific releaseId being rolled back */
  replacesReleaseId?: string;
  /** Optional ISO-8601 expiry timestamp for the rollback authorization */
  authorizedUntil?: string;
}

export interface LkCloudManifest {
  schemaVersion: '1.0';
  appId: string;
  releaseId: string;
  bundleVersion: string;
  minSdkVersion: string;
  maxSdkVersion?: string;
  publishedAt: string;
  expiresAt?: string;
  permissions: LkCloudPermission[];
  /** Explicit signed authorization required to downgrade an already-installed higher version */
  rollback?: LkCloudRollbackAuthorization;
  /** Lowercase hex SHA-256 of canonicalJson(payload) */
  payloadSha256: string;
  etag?: string;
}

export interface LkCloudSignature {
  signatureVersion: LkCloudSignatureVersion;
  keyId: string;
  algorithm: LkCloudAlgorithm;
  /** Base64 signature over LK-CORE-CLOUD-SIG-V1 canonical signing envelope */
  valueBase64: string;
}

export interface LkCloudBundle {
  manifest: LkCloudManifest;
  payload: LkCloudPayload;
  signature: LkCloudSignature;
}

export interface LkCloudManifestResponse {
  appId: string;
  releaseId: string;
  bundleVersion: string;
  minSdkVersion: string;
  maxSdkVersion?: string;
  etag: string;
  payloadSha256: string;
  bundleUrl?: string;
}

export interface LkCloudCredentialState {
  appId: string;
  readToken: string;
  pairedAt: string;
  /** Approved Cloud origin captured at pairing time; must match preconfigured endpoint */
  approvedOrigin: string;
}

export interface LkCloudClientConfig {
  /** Public client application identifier (e.g. "lk-manage") */
  appId: string;
  /** Preconfigured & approved Cloud API URL (HTTPS required unless allowInsecureLocalhost) */
  endpointUrl: string;
  /** Explicit opt-in for http://localhost / 127.0.0.1 in local development only */
  allowInsecureLocalhost?: boolean;
  /** Trusted public keys for signature verification & keyId rotation */
  trustedPublicKeys: LkCloudPublicKey[];
  /** Optional client-side upper bound of permitted manifest permissions (rejects excessive scopes) */
  allowedPermissions?: LkCloudPermission[];
  /** Installed SDK SemVer (defaults to "1.0.0") */
  sdkVersion?: string;
  /** Isolated localStorage prefix */
  storagePrefix?: string;
  /** Query parameter name containing temporary pairing code (defaults to "lk_pair") */
  pairingQueryParam?: string;
  /** Enable automatic sync on mount and periodic checks (defaults to true) */
  autoSync?: boolean;
  /** Minimum interval between automatic sync checks in ms (defaults to 300_000) */
  syncIntervalMs?: number;
  /** Cooldown between consecutive manual syncs in ms (defaults to 5_000) */
  minManualCooldownMs?: number;
  /** Optional custom fetch implementation (useful for tests or custom transports) */
  fetcher?: typeof fetch;
  /** Optional callback fired when sync state changes */
  onSyncStateChange?: (state: LkCloudSyncState) => void;
}

export interface LkCloudSyncState {
  status: LkCloudSyncStatus;
  activeVersion: string | null;
  lastSyncedAt: string | null;
  lastCheckedAt: string | null;
  source: 'none' | 'cache' | 'network';
  isPaired: boolean;
  errorCode?: LkCloudBackendErrorCode | string;
  errorMessage?: string;
}

export interface LkCloudValidatedBundleResult {
  ok: true;
  bundle: LkCloudBundle;
  validatedIcons: Record<string, LkValidatedCloudIcon>;
  sanitizedCssVariables: Record<string, string>;
}

export interface LkCloudValidationErrorResult {
  ok: false;
  reason: 'invalid-bundle' | 'incompatible' | 'invalid-signature';
  code: string;
  message: string;
}

export type LkCloudBundleCheckResult =
  | LkCloudValidatedBundleResult
  | LkCloudValidationErrorResult;

export interface LkCloudContextValue {
  state: LkCloudSyncState;
  activeBundle: LkCloudBundle | null;
  validatedIcons: Record<string, LkValidatedCloudIcon>;
  themePresets: LkThemePreset[];
  chartsConfig: LkCloudChartsConfig | null;
  platformConfig: LkCloudPlatformConfig | null;
  applyCloudThemePreset: (presetId: LkThemePresetId) => boolean;
  syncNow: (options?: { force?: boolean }) => Promise<LkCloudSyncState>;
  pairWithCode: (oneTimeCode: string) => Promise<boolean>;
  disconnectCloud: () => void;
}
