import { evaluateContrast, pickAccessibleForeground } from '../tokens/contrast';

export function getAccessibleButtonInk(accentHex: string): '#090A0D' | '#FFFFFF' {
  return pickAccessibleForeground(accentHex);
}

export function auditPairContrast(foregroundHex: string, backgroundHex: string) {
  return evaluateContrast(foregroundHex, backgroundHex);
}

export const LK_FOCUS_RING_CLASS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lk-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lk-bg)]';
