import { canonicalJsonStringify } from './canonicalJson';
import type {
  LkCloudAlgorithm,
  LkCloudBundle,
  LkCloudManifest,
  LkCloudPublicKey,
  LkCloudSignature,
} from './types';

export const LK_SIGNATURE_VERSION = 'lk-sig-v1' as const;
export const LK_SIGNATURE_DOMAIN_PREFIX = 'LK-CORE-CLOUD-SIG-V1\n';

function getSubtleCrypto(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto API (crypto.subtle) is unavailable in this environment.');
  }
  return subtle;
}

export function utf8Encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let out = '';
  for (let i = 0; i < view.length; i += 1) {
    out += view[i].toString(16).padStart(2, '0');
  }
  return out;
}

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function base64ToBytes(base64: string): Uint8Array {
  if (typeof base64 !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64.trim())) {
    throw new Error('Invalid Base64 string.');
  }
  const clean = base64.trim();
  if (typeof atob === 'function') {
    const bin = atob(clean);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) {
      out[i] = bin.charCodeAt(i);
    }
    return out;
  }

  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  const out = new Uint8Array((clean.length * 3) / 4 - padding);
  let outIdx = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const c1 = B64_ALPHABET.indexOf(clean[i]);
    const c2 = B64_ALPHABET.indexOf(clean[i + 1]);
    const c3 = clean[i + 2] === '=' ? 0 : B64_ALPHABET.indexOf(clean[i + 2]);
    const c4 = clean[i + 3] === '=' ? 0 : B64_ALPHABET.indexOf(clean[i + 3]);
    const triple = (c1 << 18) | (c2 << 12) | (c3 << 6) | c4;
    if (outIdx < out.length) out[outIdx++] = (triple >> 16) & 0xff;
    if (outIdx < out.length) out[outIdx++] = (triple >> 8) & 0xff;
    if (outIdx < out.length) out[outIdx++] = triple & 0xff;
  }
  return out;
}

export function bytesToBase64(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (typeof btoa === 'function') {
    let bin = '';
    for (let i = 0; i < view.length; i += 1) {
      bin += String.fromCharCode(view[i]);
    }
    return btoa(bin);
  }

  let out = '';
  for (let i = 0; i < view.length; i += 3) {
    const b0 = view[i];
    const b1 = i + 1 < view.length ? view[i + 1] : 0;
    const b2 = i + 2 < view.length ? view[i + 2] : 0;
    const triple = (b0 << 16) | (b1 << 8) | b2;
    out += B64_ALPHABET[(triple >> 18) & 0x3f];
    out += B64_ALPHABET[(triple >> 12) & 0x3f];
    out += i + 1 < view.length ? B64_ALPHABET[(triple >> 6) & 0x3f] : '=';
    out += i + 2 < view.length ? B64_ALPHABET[triple & 0x3f] : '=';
  }
  return out;
}

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  return copy.buffer;
}

export async function computePayloadSha256Hex(payload: unknown): Promise<string> {
  const subtle = getSubtleCrypto();
  const canonical = canonicalJsonStringify(payload);
  const digest = await subtle.digest('SHA-256', toArrayBuffer(utf8Encode(canonical)));
  return bytesToHex(digest);
}

export function buildSignatureEnvelopeBytes(
  manifest: LkCloudManifest,
  signatureMeta: Pick<LkCloudSignature, 'signatureVersion' | 'keyId' | 'algorithm'>,
): Uint8Array {
  const envelope = {
    signatureVersion: signatureMeta.signatureVersion,
    keyId: signatureMeta.keyId,
    algorithm: signatureMeta.algorithm,
    manifest,
  };
  return utf8Encode(`${LK_SIGNATURE_DOMAIN_PREFIX}${canonicalJsonStringify(envelope)}`);
}

function isKeyWithinValidityWindow(
  key: LkCloudPublicKey,
  publishedAtIso: string,
): { valid: boolean; reason?: string } {
  if (key.revoked) {
    return { valid: false, reason: `Public key "${key.keyId}" has been revoked.` };
  }
  const publishedMs = Date.parse(publishedAtIso);
  if (Number.isNaN(publishedMs)) {
    return { valid: false, reason: 'Manifest publishedAt is not a valid ISO-8601 date.' };
  }
  if (key.notBefore) {
    const nbMs = Date.parse(key.notBefore);
    if (Number.isNaN(nbMs) || publishedMs < nbMs) {
      return { valid: false, reason: `Public key "${key.keyId}" is not yet valid for publishedAt.` };
    }
  }
  if (key.notAfter) {
    const naMs = Date.parse(key.notAfter);
    if (Number.isNaN(naMs) || publishedMs > naMs) {
      return { valid: false, reason: `Public key "${key.keyId}" expired before publishedAt.` };
    }
  }
  return { valid: true };
}

async function importSpkiPublicKey(
  spkiBase64: string,
  algorithm: LkCloudAlgorithm,
): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const spkiBytes = toArrayBuffer(base64ToBytes(spkiBase64));

  if (algorithm === 'ECDSA-P256-SHA256') {
    return subtle.importKey(
      'spki',
      spkiBytes,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    );
  }
  return subtle.importKey('spki', spkiBytes, { name: 'Ed25519' }, false, ['verify']);
}

export async function verifyCloudBundleSignature(
  bundle: LkCloudBundle,
  trustedPublicKeys: LkCloudPublicKey[],
): Promise<{ valid: true } | { valid: false; code: string; message: string }> {
  const { manifest, payload, signature } = bundle;

  if (!signature || signature.signatureVersion !== LK_SIGNATURE_VERSION) {
    return {
      valid: false,
      code: 'UNSUPPORTED_SIGNATURE_VERSION',
      message: `Unsupported signature format "${String(signature?.signatureVersion)}".`,
    };
  }

  if (signature.algorithm !== 'ECDSA-P256-SHA256' && signature.algorithm !== 'Ed25519') {
    return {
      valid: false,
      code: 'UNSUPPORTED_SIGNATURE_ALGORITHM',
      message: `Unsupported signature algorithm "${String(signature.algorithm)}".`,
    };
  }

  const key = trustedPublicKeys.find((candidate) => candidate.keyId === signature.keyId);
  if (!key) {
    return {
      valid: false,
      code: 'UNKNOWN_SIGNING_KEY',
      message: `Signing key "${signature.keyId}" is not in trustedPublicKeys.`,
    };
  }

  if (key.algorithm !== signature.algorithm) {
    return {
      valid: false,
      code: 'ALGORITHM_MISMATCH',
      message: `Key "${key.keyId}" requires ${key.algorithm}, got ${signature.algorithm}.`,
    };
  }

  const keyWindow = isKeyWithinValidityWindow(key, manifest.publishedAt);
  if (!keyWindow.valid) {
    return {
      valid: false,
      code: key.revoked ? 'REVOKED_SIGNING_KEY' : 'EXPIRED_SIGNING_KEY',
      message: keyWindow.reason ?? 'Public key outside validity window.',
    };
  }

  try {
    const computedSha256 = await computePayloadSha256Hex(payload);
    if (computedSha256 !== manifest.payloadSha256.toLowerCase()) {
      return {
        valid: false,
        code: 'PAYLOAD_HASH_MISMATCH',
        message: 'Bundle payload SHA-256 does not match manifest.payloadSha256.',
      };
    }

    const subtle = getSubtleCrypto();
    const cryptoKey = await importSpkiPublicKey(key.spkiBase64, key.algorithm);
    const sigBytes = toArrayBuffer(base64ToBytes(signature.valueBase64));
    const envelopeBytes = toArrayBuffer(buildSignatureEnvelopeBytes(manifest, signature));

    const verifyAlg =
      key.algorithm === 'ECDSA-P256-SHA256'
        ? { name: 'ECDSA', hash: 'SHA-256' }
        : { name: 'Ed25519' };

    const isAuthentic = await subtle.verify(verifyAlg, cryptoKey, sigBytes, envelopeBytes);
    if (!isAuthentic) {
      return {
        valid: false,
        code: 'SIGNATURE_VERIFICATION_FAILED',
        message: 'Cryptographic signature verification failed.',
      };
    }

    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      code: 'SIGNATURE_VERIFICATION_ERROR',
      message: err instanceof Error ? err.message : 'Unable to verify bundle signature.',
    };
  }
}
