import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeHex,
  calculateContrastRatio,
  evaluateContrast,
  pickAccessibleForeground,
} from './contrast';

test('normalizeHex expands 3-digit hex and validates fallback', () => {
  assert.equal(normalizeHex('#fff'), '#FFFFFF');
  assert.equal(normalizeHex('090a0d'), '#090A0D');
  assert.equal(normalizeHex('invalid', '#D6B56D'), '#D6B56D');
});

test('calculateContrastRatio computes accurate WCAG ratios', () => {
  const maxContrast = calculateContrastRatio('#FFFFFF', '#000000');
  assert.ok(maxContrast > 20.9 && maxContrast <= 21);

  const goldOnObsidian = evaluateContrast('#D6B56D', '#090A0D');
  assert.equal(goldOnObsidian.passesAA, true);
  assert.equal(goldOnObsidian.passesAAA, true);

  const lowContrast = evaluateContrast('#777777', '#888888');
  assert.equal(lowContrast.passesAA, false);
  assert.equal(lowContrast.grade, 'Fail');
});

test('pickAccessibleForeground selects dark ink on gold and white ink on obsidian', () => {
  assert.equal(pickAccessibleForeground('#D6B56D'), '#090A0D');
  assert.equal(pickAccessibleForeground('#090A0D'), '#FFFFFF');
  assert.equal(pickAccessibleForeground('#4C8DFF'), '#090A0D');
});
