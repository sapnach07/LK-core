import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LK_SETTINGS,
  sanitizeLkSettings,
  parseLkSettingsJson,
  calculateUtf8Bytes,
} from './lkStorage';
import { formatLkNumber } from '../i18n/translations';

test('sanitizeLkSettings clamps invalid numeric bounds and falls back on bad enums', () => {
  const sanitized = sanitizeLkSettings({
    themeMode: 'neon-space',
    blurIntensity: 120,
    glassOpacity: 0.1,
    accentColor: 'not-a-hex',
    density: 'compact',
    language: 'es',
  });

  assert.equal(sanitized.themeMode, DEFAULT_LK_SETTINGS.themeMode);
  assert.equal(sanitized.blurIntensity, 32);
  assert.equal(sanitized.glassOpacity, 0.35);
  assert.equal(sanitized.accentColor, DEFAULT_LK_SETTINGS.accentColor);
  assert.equal(sanitized.density, 'compact');
  assert.equal(sanitized.language, 'es');
});

test('parseLkSettingsJson handles valid and malformed inputs safely', () => {
  const badJson = parseLkSettingsJson('{broken');
  assert.equal(badJson.ok, false);

  const arrayJson = parseLkSettingsJson('[1, 2, 3]');
  assert.equal(arrayJson.ok, false);

  const goodJson = parseLkSettingsJson(JSON.stringify({ themeMode: 'light', blurIntensity: 24 }));
  assert.equal(goodJson.ok, true);
  if (goodJson.ok) {
    assert.equal(goodJson.data.themeMode, 'light');
    assert.equal(goodJson.data.blurIntensity, 24);
  }
});

test('calculateUtf8Bytes and formatLkNumber compute accurate values', () => {
  assert.equal(calculateUtf8Bytes('LK Core'), 7);
  assert.equal(formatLkNumber(1234.5, 'US'), '1,234.5');
  assert.equal(formatLkNumber(1234.5, 'EU'), '1.234,5');
});
