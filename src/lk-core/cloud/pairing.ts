import type { LkCloudBackendErrorCode, LkCloudCredentialState } from './types';

const PAIRING_CODE_RE = /^[A-Za-z0-9._-]{12,128}$/;
const UNTRUSTED_OVERRIDE_PARAMS = ['lk_cloud', 'cloud_endpoint', 'endpoint', 'api_url'];

export interface ApprovedEndpointInfo {
  normalizedEndpoint: string;
  approvedOrigin: string;
}

export function validateApprovedEndpointUrl(
  endpointUrl: string,
  allowInsecureLocalhost = false,
): ApprovedEndpointInfo {
  if (typeof endpointUrl !== 'string' || !endpointUrl.trim()) {
    throw new Error('Cloud endpointUrl must be a non-empty URL.');
  }

  let parsed: URL;
  try {
    parsed = new URL(endpointUrl.trim());
  } catch {
    throw new Error(`Invalid Cloud endpointUrl "${endpointUrl}".`);
  }

  if (parsed.username || parsed.password) {
    throw new Error('Cloud endpointUrl must not embed credentials.');
  }

  const isLocalhost =
    parsed.hostname === 'localhost' ||
    parsed.hostname === '127.0.0.1' ||
    parsed.hostname === '[::1]';

  if (parsed.protocol === 'https:') {
    // Approved HTTPS origin
  } else if (parsed.protocol === 'http:' && allowInsecureLocalhost && isLocalhost) {
    // Explicit local development opt-in only
  } else {
    throw new Error(
      `Cloud endpointUrl must use HTTPS (received "${parsed.protocol}//${parsed.host}").`,
    );
  }

  const cleanPath = parsed.pathname.replace(/\/+$/, '');
  return {
    normalizedEndpoint: `${parsed.origin}${cleanPath}`,
    approvedOrigin: parsed.origin,
  };
}

export function assertSameApprovedOrigin(
  targetUrl: string,
  approvedOrigin: string,
): string {
  const parsed = new URL(targetUrl);
  if (parsed.origin !== approvedOrigin) {
    throw new Error(
      `Blocked request to unauthorized origin "${parsed.origin}" (expected "${approvedOrigin}").`,
    );
  }
  return parsed.toString();
}

export function isValidPairingCodeFormat(code: string): boolean {
  return typeof code === 'string' && PAIRING_CODE_RE.test(code.trim());
}

/**
 * Extracts a pairing code from the current browser URL and immediately scrubs
 * both the pairing query parameter and any untrusted endpoint override parameters.
 */
export function extractAndScrubPairingCodeFromUrl(
  pairingQueryParam = 'lk_pair',
): string | null {
  if (typeof window === 'undefined' || !window.location) {
    return null;
  }

  try {
    const url = new URL(window.location.href);
    const rawCode = url.searchParams.get(pairingQueryParam);
    const hasUntrustedOverride = UNTRUSTED_OVERRIDE_PARAMS.some((p) => url.searchParams.has(p));

    if (rawCode === null && !hasUntrustedOverride) {
      return null;
    }

    url.searchParams.delete(pairingQueryParam);
    for (const overrideParam of UNTRUSTED_OVERRIDE_PARAMS) {
      url.searchParams.delete(overrideParam);
    }

    if (window.history && typeof window.history.replaceState === 'function') {
      const nextRelative = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(window.history.state, '', nextRelative);
    }

    if (!rawCode) return null;
    const trimmed = rawCode.trim();
    return isValidPairingCodeFormat(trimmed) ? trimmed : null;
  } catch {
    return null;
  }
}

export interface ExchangePairingParams {
  appId: string;
  endpointUrl: string;
  allowInsecureLocalhost?: boolean;
  oneTimeCode: string;
  consumedCodesRegistry: Set<string>;
  fetcher?: typeof fetch;
}

export type ExchangePairingOutcome =
  | { ok: true; credentials: LkCloudCredentialState }
  | { ok: false; code: LkCloudBackendErrorCode | string; message: string };

export async function exchangePairingCode({
  appId,
  endpointUrl,
  allowInsecureLocalhost = false,
  oneTimeCode,
  consumedCodesRegistry,
  fetcher = globalThis.fetch,
}: ExchangePairingParams): Promise<ExchangePairingOutcome> {
  const trimmedCode = oneTimeCode.trim();
  if (!isValidPairingCodeFormat(trimmedCode)) {
    return {
      ok: false,
      code: 'PAIRING_INVALID',
      message: 'Invalid pairing code format.',
    };
  }

  if (consumedCodesRegistry.has(trimmedCode)) {
    return {
      ok: false,
      code: 'PAIRING_ALREADY_USED',
      message: 'This temporary pairing code has already been consumed or invalidated.',
    };
  }

  if (typeof fetcher !== 'function') {
    return {
      ok: false,
      code: 'FETCH_UNAVAILABLE',
      message: 'Fetch API is unavailable.',
    };
  }

  const { normalizedEndpoint, approvedOrigin } = validateApprovedEndpointUrl(
    endpointUrl,
    allowInsecureLocalhost,
  );
  const pairUrl = assertSameApprovedOrigin(`${normalizedEndpoint}/sdk/pair`, approvedOrigin);

  // Mark immediately in memory so a one-time code is never replayed even on retry
  consumedCodesRegistry.add(trimmedCode);

  try {
    const response = await fetcher(pairUrl, {
      method: 'POST',
      redirect: 'error',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ appId, code: trimmedCode }),
    });

    if (response.url) {
      assertSameApprovedOrigin(response.url, approvedOrigin);
    }

    let body: Record<string, unknown> | null = null;
    try {
      body = (await response.json()) as Record<string, unknown>;
    } catch {
      body = null;
    }

    if (!response.ok) {
      const errCode = typeof body?.code === 'string' ? body.code : 'PAIRING_FAILED';
      const errMsg =
        typeof body?.message === 'string'
          ? body.message
          : `Pairing failed with HTTP ${response.status}.`;
      return { ok: false, code: errCode, message: errMsg };
    }

    const returnedAppId = typeof body?.appId === 'string' ? body.appId : '';
    const readToken = typeof body?.readToken === 'string' ? body.readToken : '';
    const pairedAt =
      typeof body?.pairedAt === 'string' ? body.pairedAt : new Date().toISOString();

    if (returnedAppId !== appId || !readToken.trim()) {
      return {
        ok: false,
        code: 'PAIRING_INVALID_RESPONSE',
        message: 'Pairing response lacked matching appId or readToken.',
      };
    }

    return {
      ok: true,
      credentials: {
        appId: returnedAppId,
        readToken: readToken.trim(),
        pairedAt,
        approvedOrigin,
      },
    };
  } catch (err) {
    return {
      ok: false,
      code: 'PAIRING_NETWORK_ERROR',
      message: err instanceof Error ? err.message : 'Network error during pairing.',
    };
  }
}
