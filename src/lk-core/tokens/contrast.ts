export interface ContrastEvaluation {
  ratio: number;
  ratioFormatted: string;
  passesAA: boolean;
  passesAALarge: boolean;
  passesAAA: boolean;
  grade: 'AAA' | 'AA' | 'AA Large' | 'Fail';
}

export function normalizeHex(hex: string, fallback = '#D6B56D'): string {
  const cleaned = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const expanded = cleaned
      .split('')
      .map((ch) => ch + ch)
      .join('');
    return `#${expanded.toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned.toUpperCase()}`;
  }
  return fallback;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHex(hex);
  const intVal = parseInt(normalized.slice(1), 16);
  return {
    r: (intVal >> 16) & 255,
    g: (intVal >> 8) & 255,
    b: intVal & 255,
  };
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  const clamped = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${Number(clamped.toFixed(3))})`;
}

export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function calculateContrastRatio(hexA: string, hexB: string): number {
  const lumA = getRelativeLuminance(hexA);
  const lumB = getRelativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export function evaluateContrast(foregroundHex: string, backgroundHex: string): ContrastEvaluation {
  const ratio = calculateContrastRatio(foregroundHex, backgroundHex);
  const rounded = Math.round(ratio * 100) / 100;
  const passesAAA = ratio >= 7;
  const passesAA = ratio >= 4.5;
  const passesAALarge = ratio >= 3;
  const grade: ContrastEvaluation['grade'] = passesAAA
    ? 'AAA'
    : passesAA
      ? 'AA'
      : passesAALarge
        ? 'AA Large'
        : 'Fail';

  return {
    ratio: rounded,
    ratioFormatted: `${rounded.toFixed(2)}:1`,
    passesAA,
    passesAALarge,
    passesAAA,
    grade,
  };
}

export function pickAccessibleForeground(backgroundHex: string): '#090A0D' | '#FFFFFF' {
  const darkContrast = calculateContrastRatio('#090A0D', backgroundHex);
  const lightContrast = calculateContrastRatio('#FFFFFF', backgroundHex);
  return darkContrast >= lightContrast ? '#090A0D' : '#FFFFFF';
}
