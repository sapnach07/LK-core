/**
 * Deterministic canonical JSON serializer shared between server signing
 * and browser SDK verification.
 * - Sorts object keys recursively by UTF-16 code units.
 * - Omits object properties whose value is `undefined`.
 * - Rejects non-finite numbers (NaN, Infinity) and unsupported runtime values.
 */
function serializeCanonicalValue(value: unknown, seen: Set<object>): string {
  if (value === null) return 'null';

  const type = typeof value;
  if (type === 'boolean') return value ? 'true' : 'false';
  if (type === 'string') return JSON.stringify(value);
  if (type === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Canonical JSON does not permit non-finite numbers.');
    }
    return JSON.stringify(Object.is(value, -0) ? 0 : value);
  }
  if (type === 'bigint' || type === 'function' || type === 'symbol' || type === 'undefined') {
    throw new Error(`Canonical JSON cannot serialize value of type "${type}".`);
  }

  const obj = value as object;
  if (seen.has(obj)) {
    throw new Error('Canonical JSON cannot serialize circular structures.');
  }
  seen.add(obj);

  try {
    if (Array.isArray(obj)) {
      const items = obj.map((item) =>
        item === undefined ? 'null' : serializeCanonicalValue(item, seen),
      );
      return `[${items.join(',')}]`;
    }

    const record = obj as Record<string, unknown>;
    const toJson = (record as { toJSON?: () => unknown }).toJSON;
    if (typeof toJson === 'function') {
      return serializeCanonicalValue(toJson.call(record), seen);
    }

    const keys = Object.keys(record).sort();
    const parts: string[] = [];
    for (const key of keys) {
      const prop = record[key];
      if (prop === undefined || typeof prop === 'function' || typeof prop === 'symbol') {
        continue;
      }
      parts.push(`${JSON.stringify(key)}:${serializeCanonicalValue(prop, seen)}`);
    }
    return `{${parts.join(',')}}`;
  } finally {
    seen.delete(obj);
  }
}

export function canonicalJsonStringify(value: unknown): string {
  return serializeCanonicalValue(value, new Set<object>());
}
