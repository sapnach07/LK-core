import type { LkSafeSvgElement, LkSafeSvgTag } from './types';

const MAX_SVG_BYTES = 32_768;
const MAX_XML_DEPTH = 8;
const MAX_NODE_COUNT = 256;
const MAX_COORD_ABS = 100_000;
const MAX_VIEWBOX_DIM = 10_000;

const ALLOWED_SVG_TAGS = new Set<LkSafeSvgTag>([
  'path',
  'circle',
  'rect',
  'line',
  'polyline',
  'polygon',
  'g',
]);

const SHARED_PRESENTATION_ATTRS = new Set([
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'stroke-dashoffset',
  'opacity',
  'fill-opacity',
  'stroke-opacity',
  'fill-rule',
  'clip-rule',
  'transform',
]);

const TAG_ALLOWED_ATTRS: Record<LkSafeSvgTag, ReadonlySet<string>> = {
  path: new Set(['d', ...SHARED_PRESENTATION_ATTRS]),
  circle: new Set(['cx', 'cy', 'r', ...SHARED_PRESENTATION_ATTRS]),
  rect: new Set(['x', 'y', 'width', 'height', 'rx', 'ry', ...SHARED_PRESENTATION_ATTRS]),
  line: new Set(['x1', 'y1', 'x2', 'y2', ...SHARED_PRESENTATION_ATTRS]),
  polyline: new Set(['points', ...SHARED_PRESENTATION_ATTRS]),
  polygon: new Set(['points', ...SHARED_PRESENTATION_ATTRS]),
  g: new Set([...SHARED_PRESENTATION_ATTRS]),
};

const ROOT_SVG_ALLOWED_ATTRS = new Set([
  'xmlns',
  'viewBox',
  'width',
  'height',
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'aria-hidden',
]);

const NON_NEGATIVE_NUMERIC_ATTRS = new Set(['width', 'height', 'r', 'rx', 'ry', 'stroke-width']);
const UNIT_INTERVAL_ATTRS = new Set(['opacity', 'fill-opacity', 'stroke-opacity']);

const DANGEROUS_VALUE_RE = /(javascript:|vbscript:|data:|expression\s*\(|url\s*\(|<|>)/i;
const SAFE_COLOR_RE = /^(none|currentColor|transparent|#[0-9a-fA-F]{3,8}|var\(--lk-[a-z0-9-]+\))$/i;
const SAFE_NUMBER_RE = /^-?(?:\d+(?:\.\d+)?|\.\d+)$/;
const SAFE_PATH_D_RE = /^[MmZzLlHhVvCcSsQqTtAa0-9\s.,+-]+$/;
const SAFE_VIEWBOX_RE =
  /^\s*(-?(?:\d+(?:\.\d+)?|\.\d+))\s+(-?(?:\d+(?:\.\d+)?|\.\d+))\s+(\d+(?:\.\d+)?|\.\d+)\s+(\d+(?:\.\d+)?|\.\d+)\s*$/;

const TRANSFORM_ARG_RULES: Record<string, { min: number; max: number }> = {
  translate: { min: 1, max: 2 },
  scale: { min: 1, max: 2 },
  rotate: { min: 1, max: 3 },
  skewX: { min: 1, max: 1 },
  skewY: { min: 1, max: 1 },
  matrix: { min: 6, max: 6 },
};

const ATTR_TO_REACT_PROP: Record<string, string> = {
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'fill-opacity': 'fillOpacity',
  'stroke-opacity': 'strokeOpacity',
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
};

function isAllowedXmlCodePoint(codePoint: number): boolean {
  if (!Number.isInteger(codePoint) || codePoint <= 0 || codePoint > 0x10ffff) {
    return false;
  }
  // Reject UTF-16 surrogates
  if (codePoint >= 0xd800 && codePoint <= 0xdfff) {
    return false;
  }
  // Reject C0 control characters (except TAB, LF, CR)
  if (codePoint < 0x20 && codePoint !== 0x09 && codePoint !== 0x0a && codePoint !== 0x0d) {
    return false;
  }
  // Reject DEL and C1 control block
  if (codePoint === 0x7f || (codePoint >= 0x80 && codePoint <= 0x9f)) {
    return false;
  }
  // Reject Unicode non-characters
  if (codePoint === 0xfffe || codePoint === 0xffff) {
    return false;
  }
  return true;
}

function decodeXmlEntities(raw: string): string {
  let out = '';
  let idx = 0;
  while (idx < raw.length) {
    const amp = raw.indexOf('&', idx);
    if (amp === -1) {
      out += raw.slice(idx);
      break;
    }
    out += raw.slice(idx, amp);
    const semi = raw.indexOf(';', amp + 1);
    if (semi === -1 || semi - amp > 16) {
      throw new Error('Malformed or unterminated XML entity in SVG attribute.');
    }
    const entity = raw.slice(amp + 1, semi);
    switch (entity) {
      case 'lt':
        out += '<';
        break;
      case 'gt':
        out += '>';
        break;
      case 'amp':
        out += '&';
        break;
      case 'quot':
        out += '"';
        break;
      case 'apos':
        out += "'";
        break;
      default: {
        if (/^#x[0-9a-fA-F]+$/.test(entity)) {
          const codePoint = Number.parseInt(entity.slice(2), 16);
          if (!isAllowedXmlCodePoint(codePoint)) {
            throw new Error(`Invalid or unsafe XML numeric entity "&${entity};".`);
          }
          out += String.fromCodePoint(codePoint);
        } else if (/^#\d+$/.test(entity)) {
          const codePoint = Number.parseInt(entity.slice(1), 10);
          if (!isAllowedXmlCodePoint(codePoint)) {
            throw new Error(`Invalid or unsafe XML numeric entity "&${entity};".`);
          }
          out += String.fromCodePoint(codePoint);
        } else {
          throw new Error(`Unsupported XML entity "&${entity};" in SVG.`);
        }
      }
    }
    idx = semi + 1;
  }
  return out;
}

function parseFiniteSvgNumber(token: string, attrName: string): number {
  if (!SAFE_NUMBER_RE.test(token)) {
    throw new Error(`Expected numeric SVG value for "${attrName}", got "${token}".`);
  }
  const num = Number(token);
  if (!Number.isFinite(num) || Math.abs(num) > MAX_COORD_ABS) {
    throw new Error(`Out-of-range SVG numeric value "${token}" for "${attrName}".`);
  }
  return num;
}

function parseNumberList(raw: string, attrName: string, requireNonNegative = false): string {
  const parts = raw
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
  if (parts.length === 0 || parts.length > 512) {
    throw new Error(`Invalid number list in SVG attribute "${attrName}".`);
  }
  for (const part of parts) {
    const val = parseFiniteSvgNumber(part, attrName);
    if (requireNonNegative && val < 0) {
      throw new Error(`Negative value "${part}" not allowed in "${attrName}".`);
    }
  }
  return raw.trim();
}

function validateTransform(raw: string): string {
  let pos = 0;
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error('Empty SVG transform attribute.');
  }

  let ops = 0;
  while (pos < trimmed.length) {
    while (pos < trimmed.length && /[\s,]/.test(trimmed[pos])) pos += 1;
    if (pos >= trimmed.length) break;

    const rest = trimmed.slice(pos);
    const fnMatch = /^(translate|scale|rotate|skewX|skewY|matrix)\s*\(([^()]*)\)/.exec(rest);
    if (!fnMatch) {
      throw new Error(`Disallowed SVG transform "${trimmed}".`);
    }
    const fnName = fnMatch[1];
    const argsRaw = fnMatch[2].trim();
    const argTokens = argsRaw ? argsRaw.split(/[\s,]+/).filter(Boolean) : [];
    const rule = TRANSFORM_ARG_RULES[fnName];

    if (argTokens.length < rule.min || argTokens.length > rule.max) {
      throw new Error(`Invalid argument count for SVG transform "${fnName}".`);
    }
    if (fnName === 'rotate' && argTokens.length === 2) {
      throw new Error('SVG rotate() accepts 1 or 3 numeric arguments.');
    }
    for (const token of argTokens) {
      parseFiniteSvgNumber(token, `transform.${fnName}`);
    }

    ops += 1;
    if (ops > 16) {
      throw new Error('SVG transform chain exceeds maximum operations.');
    }
    pos += fnMatch[0].length;
  }

  if (ops === 0) {
    throw new Error(`Disallowed SVG transform "${trimmed}".`);
  }
  return trimmed;
}

function validateViewBox(viewBox: string): string {
  const match = SAFE_VIEWBOX_RE.exec(viewBox);
  if (!match) {
    throw new Error(`Invalid SVG viewBox "${viewBox}".`);
  }
  const minX = Number(match[1]);
  const minY = Number(match[2]);
  const width = Number(match[3]);
  const height = Number(match[4]);
  if (
    !Number.isFinite(minX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    Math.abs(minX) > MAX_VIEWBOX_DIM ||
    Math.abs(minY) > MAX_VIEWBOX_DIM ||
    width <= 0 ||
    height <= 0 ||
    width > MAX_VIEWBOX_DIM ||
    height > MAX_VIEWBOX_DIM
  ) {
    throw new Error(`SVG viewBox dimensions out of allowed positive bounds ("${viewBox}").`);
  }
  return `${minX} ${minY} ${width} ${height}`;
}

function validateAttributeValue(name: string, rawValue: string): string {
  const decoded = decodeXmlEntities(rawValue).trim();
  if (DANGEROUS_VALUE_RE.test(decoded)) {
    throw new Error(`Unsafe value detected in SVG attribute "${name}".`);
  }

  if (name === 'd') {
    if (!decoded || !SAFE_PATH_D_RE.test(decoded)) {
      throw new Error('Invalid SVG path "d" command sequence.');
    }
    return decoded;
  }

  if (name === 'points') {
    const cleaned = parseNumberList(decoded, 'points', false);
    const coords = cleaned.split(/[\s,]+/).filter(Boolean);
    if (coords.length < 2 || coords.length % 2 !== 0) {
      throw new Error('SVG "points" must contain pairs of coordinates.');
    }
    return cleaned;
  }

  if (name === 'fill' || name === 'stroke') {
    if (!SAFE_COLOR_RE.test(decoded)) {
      throw new Error(`Disallowed SVG color "${decoded}" in "${name}".`);
    }
    return decoded;
  }

  if (name === 'transform') {
    return validateTransform(decoded);
  }

  if (name === 'stroke-linecap') {
    if (decoded !== 'butt' && decoded !== 'round' && decoded !== 'square') {
      throw new Error(`Invalid stroke-linecap "${decoded}".`);
    }
    return decoded;
  }

  if (name === 'stroke-linejoin') {
    if (decoded !== 'miter' && decoded !== 'round' && decoded !== 'bevel') {
      throw new Error(`Invalid stroke-linejoin "${decoded}".`);
    }
    return decoded;
  }

  if (name === 'fill-rule' || name === 'clip-rule') {
    if (decoded !== 'nonzero' && decoded !== 'evenodd') {
      throw new Error(`Invalid ${name} "${decoded}".`);
    }
    return decoded;
  }

  if (name === 'stroke-dasharray') {
    if (decoded === 'none') return 'none';
    return parseNumberList(decoded, 'stroke-dasharray', true);
  }

  const num = parseFiniteSvgNumber(decoded, name);
  if (NON_NEGATIVE_NUMERIC_ATTRS.has(name) && num < 0) {
    throw new Error(`Attribute "${name}" must be non-negative, got "${decoded}".`);
  }
  if (UNIT_INTERVAL_ATTRS.has(name) && (num < 0 || num > 1)) {
    throw new Error(`Attribute "${name}" must be between 0 and 1, got "${decoded}".`);
  }

  return decoded;
}

interface ParsedXmlElement {
  tag: string;
  attributes: Record<string, string>;
  children: ParsedXmlElement[];
}

function isNameChar(ch: string): boolean {
  return /[A-Za-z0-9_:-]/.test(ch);
}

/**
 * Deterministic recursive-descent XML parser for SVG payloads.
 * Rejects DOCTYPE, ENTITY declarations, CDATA, processing instructions,
 * malformed comments, unclosed tags, and unknown markup.
 */
function parseXmlSvgRoot(xmlInput: string): ParsedXmlElement {
  if (typeof xmlInput !== 'string') {
    throw new Error('SVG payload must be a string.');
  }
  const xml = xmlInput.trim();
  if (!xml || xml.length > MAX_SVG_BYTES) {
    throw new Error('SVG payload is empty or exceeds maximum allowed size (32 KiB).');
  }

  let pos = 0;
  let totalNodes = 0;

  const skipWhitespace = () => {
    while (pos < xml.length && /\s/.test(xml[pos])) {
      pos += 1;
    }
  };

  const skipCommentsAndWhitespace = () => {
    while (pos < xml.length) {
      skipWhitespace();
      if (xml.startsWith('<!--', pos)) {
        const end = xml.indexOf('-->', pos + 4);
        if (end === -1) {
          throw new Error('Unterminated XML comment in SVG.');
        }
        const inner = xml.slice(pos + 4, end);
        if (inner.includes('--')) {
          throw new Error('Malformed XML comment containing "--".');
        }
        pos = end + 3;
        continue;
      }
      break;
    }
  };

  const parseTagName = (): string => {
    const start = pos;
    if (pos >= xml.length || !/[A-Za-z_]/.test(xml[pos])) {
      throw new Error(`Invalid XML tag name at position ${pos}.`);
    }
    while (pos < xml.length && isNameChar(xml[pos])) {
      pos += 1;
    }
    return xml.slice(start, pos);
  };

  const parseAttributes = (): Record<string, string> => {
    const attrs: Record<string, string> = {};
    while (pos < xml.length) {
      skipWhitespace();
      if (xml[pos] === '>' || xml.startsWith('/>', pos)) {
        break;
      }
      const attrName = parseTagName();
      if (Object.prototype.hasOwnProperty.call(attrs, attrName)) {
        throw new Error(`Duplicate XML attribute "${attrName}".`);
      }
      skipWhitespace();
      if (xml[pos] !== '=') {
        throw new Error(`Expected "=" after attribute "${attrName}".`);
      }
      pos += 1;
      skipWhitespace();
      const quote = xml[pos];
      if (quote !== '"' && quote !== "'") {
        throw new Error(`Expected quoted value for attribute "${attrName}".`);
      }
      pos += 1;
      const valStart = pos;
      const closeQuote = xml.indexOf(quote, valStart);
      if (closeQuote === -1) {
        throw new Error(`Unterminated attribute value for "${attrName}".`);
      }
      const rawVal = xml.slice(valStart, closeQuote);
      if (rawVal.includes('<')) {
        throw new Error(`Unescaped "<" inside attribute "${attrName}".`);
      }
      attrs[attrName] = rawVal;
      pos = closeQuote + 1;
    }
    return attrs;
  };

  const parseElement = (depth: number): ParsedXmlElement => {
    if (depth > MAX_XML_DEPTH) {
      throw new Error(`SVG XML exceeds maximum nesting depth (${MAX_XML_DEPTH}).`);
    }
    totalNodes += 1;
    if (totalNodes > MAX_NODE_COUNT) {
      throw new Error(`SVG XML exceeds maximum node count (${MAX_NODE_COUNT}).`);
    }

    if (xml[pos] !== '<') {
      throw new Error(`Expected "<" at position ${pos}.`);
    }
    if (xml.startsWith('<!', pos) || xml.startsWith('<?', pos)) {
      throw new Error('DOCTYPE, ENTITY, CDATA, and XML processing instructions are forbidden.');
    }
    pos += 1;

    const tag = parseTagName();
    const attributes = parseAttributes();

    skipWhitespace();
    if (xml.startsWith('/>', pos)) {
      pos += 2;
      return { tag, attributes, children: [] };
    }
    if (xml[pos] !== '>') {
      throw new Error(`Expected ">" for tag <${tag}> at position ${pos}.`);
    }
    pos += 1;

    const children: ParsedXmlElement[] = [];
    while (pos < xml.length) {
      skipCommentsAndWhitespace();
      if (pos >= xml.length) {
        throw new Error(`Unclosed XML tag <${tag}>.`);
      }
      if (xml.startsWith('</', pos)) {
        pos += 2;
        const closingTag = parseTagName();
        skipWhitespace();
        if (xml[pos] !== '>') {
          throw new Error(`Expected ">" in closing tag </${closingTag}>.`);
        }
        pos += 1;
        if (closingTag !== tag) {
          throw new Error(`Mismatched closing tag </${closingTag}> for <${tag}>.`);
        }
        return { tag, attributes, children };
      }
      if (xml[pos] !== '<') {
        throw new Error(`Unexpected text content inside <${tag}>.`);
      }
      children.push(parseElement(depth + 1));
    }

    throw new Error(`Unclosed XML tag <${tag}>.`);
  };

  skipCommentsAndWhitespace();
  if (xml.startsWith('<?', pos) || xml.startsWith('<!', pos)) {
    throw new Error('XML prolog, DOCTYPE, ENTITY, and processing instructions are forbidden.');
  }
  const root = parseElement(0);
  skipCommentsAndWhitespace();
  if (pos !== xml.length) {
    throw new Error('Unexpected trailing content after root <svg> element.');
  }
  return root;
}

function sanitizeParsedElement(node: ParsedXmlElement): LkSafeSvgElement {
  if (!ALLOWED_SVG_TAGS.has(node.tag as LkSafeSvgTag)) {
    throw new Error(`Disallowed SVG element <${node.tag}>.`);
  }
  const tag = node.tag as LkSafeSvgTag;
  const allowedAttrs = TAG_ALLOWED_ATTRS[tag];
  const cleanAttrs: Record<string, string> = {};

  for (const [attrName, rawVal] of Object.entries(node.attributes)) {
    const lower = attrName.toLowerCase();
    if (
      lower.startsWith('on') ||
      lower === 'style' ||
      lower === 'href' ||
      lower.startsWith('xlink') ||
      lower.startsWith('xmlns')
    ) {
      throw new Error(`Forbidden SVG attribute "${attrName}" on <${tag}>.`);
    }
    if (!allowedAttrs.has(attrName)) {
      throw new Error(`Attribute "${attrName}" is not allowlisted on <${tag}>.`);
    }
    const cleanVal = validateAttributeValue(attrName, rawVal);
    const reactProp = ATTR_TO_REACT_PROP[attrName] ?? attrName;
    cleanAttrs[reactProp] = cleanVal;
  }

  const children = node.children.map((child) => sanitizeParsedElement(child));
  return children.length > 0
    ? { tag, attributes: cleanAttrs, children }
    : { tag, attributes: cleanAttrs };
}

export function sanitizeSvgIcon(
  rawSvg: string,
  expectedViewBox: string,
): { viewBox: string; rootAttributes: Record<string, string>; nodes: LkSafeSvgElement[] } {
  const safeViewBox = validateViewBox(expectedViewBox);
  const root = parseXmlSvgRoot(rawSvg);

  if (root.tag !== 'svg') {
    throw new Error(`SVG icon root element must be <svg>, received <${root.tag}>.`);
  }

  const rootAttributes: Record<string, string> = {};
  for (const [attrName, rawVal] of Object.entries(root.attributes)) {
    const lower = attrName.toLowerCase();
    if (lower.startsWith('on') || lower === 'style' || lower === 'href' || lower.startsWith('xlink')) {
      throw new Error(`Forbidden attribute "${attrName}" on root <svg>.`);
    }
    if (!ROOT_SVG_ALLOWED_ATTRS.has(attrName)) {
      throw new Error(`Disallowed attribute "${attrName}" on root <svg>.`);
    }
    const decoded = decodeXmlEntities(rawVal).trim();
    if (DANGEROUS_VALUE_RE.test(decoded)) {
      throw new Error(`Unsafe value in root <svg> attribute "${attrName}".`);
    }
    if (attrName === 'xmlns') {
      if (decoded !== 'http://www.w3.org/2000/svg') {
        throw new Error(`Invalid SVG namespace "${decoded}".`);
      }
      continue;
    }
    if (attrName === 'viewBox') {
      validateViewBox(decoded);
      continue;
    }
    if (attrName === 'aria-hidden') {
      if (decoded !== 'true' && decoded !== 'false') {
        throw new Error(`Invalid aria-hidden value "${decoded}" on root <svg>.`);
      }
      continue;
    }
    if (attrName === 'width' || attrName === 'height') {
      const dim = parseFiniteSvgNumber(decoded, attrName);
      if (dim <= 0 || dim > MAX_VIEWBOX_DIM) {
        throw new Error(`Root <svg> ${attrName} must be positive and bounded.`);
      }
      continue;
    }
    // Presentation attributes forwarded cleanly to <svg> renderer in LkIcon
    const cleanVal = validateAttributeValue(attrName, rawVal);
    const reactProp = ATTR_TO_REACT_PROP[attrName] ?? attrName;
    rootAttributes[reactProp] = cleanVal;
  }

  if (root.children.length === 0) {
    throw new Error('SVG icon must contain at least one drawing primitive.');
  }

  const nodes = root.children.map((child) => sanitizeParsedElement(child));
  return { viewBox: safeViewBox, rootAttributes, nodes };
}
