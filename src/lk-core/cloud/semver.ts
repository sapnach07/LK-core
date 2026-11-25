export interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
}

const SEMVER_RE = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

export function parseSemver(version: string): ParsedSemver | null {
  if (typeof version !== 'string') return null;
  const match = SEMVER_RE.exec(version.trim());
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split('.') : [],
  };
}

export function compareSemver(a: string, b: string): -1 | 0 | 1 | null {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return null;

  if (pa.major !== pb.major) return pa.major < pb.major ? -1 : 1;
  if (pa.minor !== pb.minor) return pa.minor < pb.minor ? -1 : 1;
  if (pa.patch !== pb.patch) return pa.patch < pb.patch ? -1 : 1;

  if (pa.prerelease.length === 0 && pb.prerelease.length === 0) return 0;
  if (pa.prerelease.length === 0) return 1;
  if (pb.prerelease.length === 0) return -1;

  const maxLen = Math.max(pa.prerelease.length, pb.prerelease.length);
  for (let i = 0; i < maxLen; i += 1) {
    const idA = pa.prerelease[i];
    const idB = pb.prerelease[i];
    if (idA === undefined) return -1;
    if (idB === undefined) return 1;
    if (idA === idB) continue;

    const numA = /^\d+$/.test(idA);
    const numB = /^\d+$/.test(idB);
    if (numA && numB) {
      return Number(idA) < Number(idB) ? -1 : 1;
    }
    if (numA) return -1;
    if (numB) return 1;
    return idA < idB ? -1 : 1;
  }

  return 0;
}

export function isSdkVersionCompatible(
  sdkVersion: string,
  minSdkVersion: string,
  maxSdkVersion?: string,
): { compatible: boolean; reason?: string } {
  if (!parseSemver(sdkVersion)) {
    return { compatible: false, reason: `Invalid SDK version "${sdkVersion}".` };
  }
  const cmpMin = compareSemver(sdkVersion, minSdkVersion);
  if (cmpMin === null) {
    return { compatible: false, reason: `Invalid minSdkVersion "${minSdkVersion}".` };
  }
  if (cmpMin < 0) {
    return {
      compatible: false,
      reason: `SDK ${sdkVersion} is older than required minSdkVersion ${minSdkVersion}.`,
    };
  }
  if (maxSdkVersion !== undefined) {
    const cmpMax = compareSemver(sdkVersion, maxSdkVersion);
    if (cmpMax === null) {
      return { compatible: false, reason: `Invalid maxSdkVersion "${maxSdkVersion}".` };
    }
    if (cmpMax > 0) {
      return {
        compatible: false,
        reason: `SDK ${sdkVersion} exceeds supported maxSdkVersion ${maxSdkVersion}.`,
      };
    }
  }
  return { compatible: true };
}
