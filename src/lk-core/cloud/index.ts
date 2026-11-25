// @lk/core/cloud — Optional Offline-First LK Core Cloud SDK & Sync Engine
export {
  LkCloudBridge,
  LkCloudProvider,
  useLkCloud,
  useLkCloudOptional,
} from './LkCloudBridge';
export type { LkCloudBridgeProps, LkCloudProviderProps } from './LkCloudBridge';

export { createLkSyncEngine } from './syncEngine';
export type { LkSyncEngine, LkSyncSnapshot } from './syncEngine';

export { canonicalJsonStringify } from './canonicalJson';
export { parseSemver, compareSemver, isSdkVersionCompatible } from './semver';
export type { ParsedSemver } from './semver';

export {
  LK_SIGNATURE_VERSION,
  LK_SIGNATURE_DOMAIN_PREFIX,
  computePayloadSha256Hex,
  buildSignatureEnvelopeBytes,
  verifyCloudBundleSignature,
  bytesToBase64,
  base64ToBytes,
} from './signature';

export { sanitizeSvgIcon } from './xmlSvgSanitizer';
export {
  verifyAndValidateCloudBundle,
  sanitizeCloudCssVariables,
  checkRollbackAuthorization,
} from './bundleValidator';

export {
  resolveLkCloudCacheKeys,
  loadCachedCloudBundle,
  saveCachedCloudBundle,
  clearCachedCloudBundle,
  loadCloudCredentials,
  saveCloudCredentials,
  clearCloudCredentials,
  loadCloudBaseline,
  saveCloudBaseline,
  loadCloudMeta,
  saveCloudMeta,
  computeCloudSettingsPatch,
} from './cloudCache';
export type { LkCloudCacheKeys, LkCloudMetaRecord } from './cloudCache';

export {
  validateApprovedEndpointUrl,
  assertSameApprovedOrigin,
  isValidPairingCodeFormat,
  extractAndScrubPairingCodeFromUrl,
  exchangePairingCode,
} from './pairing';

export { DEFINITIVE_REVOCATION_CODES } from './types';
export type {
  LkCloudAlgorithm,
  LkCloudSignatureVersion,
  LkCloudPermission,
  LkCloudBackendErrorCode,
  LkCloudSyncStatus,
  LkCloudPublicKey,
  LkSafeSvgTag,
  LkSafeSvgElement,
  LkCloudIconInput,
  LkValidatedCloudIcon,
  LkCloudChartsConfig,
  LkCloudPlatformConfig,
  LkCloudPayload,
  LkCloudRollbackAuthorization,
  LkCloudManifest,
  LkCloudSignature,
  LkCloudBundle,
  LkCloudManifestResponse,
  LkCloudCredentialState,
  LkCloudClientConfig,
  LkCloudSyncState,
  LkCloudValidatedBundleResult,
  LkCloudValidationErrorResult,
  LkCloudBundleCheckResult,
  LkCloudContextValue,
} from './types';
