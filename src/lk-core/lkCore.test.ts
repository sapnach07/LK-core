import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeProgressMetrics,
  normalizeSparklineData,
  resolveLkChartPalette,
  validateChartDataset,
  validateCircularDataset,
} from './charts/chartUtils';
import {
  createLkStore,
  DEFAULT_LK_SETTINGS,
  loadLkSettings,
  resolveLkStorageKeys,
  sanitizeLkSettings,
  saveLkSettings,
} from './storage/lkStorage';
import { evaluateContrast, normalizeHex, pickAccessibleForeground } from './tokens/contrast';
import { buildPlatformTokenPayload, exportTokensAsCss } from './tokens/exportTokens';

test('resolveLkChartPalette prioritizes normalized accent color without duplicates', () => {
  const goldPalette = resolveLkChartPalette('#d6b56d');
  assert.equal(goldPalette[0], '#D6B56D');
  assert.ok(goldPalette.length >= 5);

  const cobaltPalette = resolveLkChartPalette('#4c8dff');
  assert.equal(cobaltPalette[0], '#4C8DFF');
  assert.equal(
    cobaltPalette.filter((c) => c.toUpperCase() === '#4C8DFF').length,
    1,
    'Primary accent should not appear twice in palette',
  );
});

test('validateChartDataset handles populated, empty, invalid, and error states', () => {
  assert.deepEqual(validateChartDataset([{ x: 'A', y: 10 }]), { status: 'ready' });
  assert.deepEqual(validateChartDataset([]), { status: 'empty' });
  assert.equal(validateChartDataset(null).status, 'error');
  assert.deepEqual(validateChartDataset([{ x: 'A', y: 10 }], 'Erreur réseau 503'), {
    status: 'error',
    errorMessage: 'Erreur réseau 503',
  });
});

test('validateCircularDataset treats all-zero or negative totals as empty', () => {
  assert.equal(validateCircularDataset([{ name: 'A', value: 0 }], 'value').status, 'empty');
  assert.equal(validateCircularDataset([{ name: 'A', value: 12 }], 'value').status, 'ready');
});

test('normalizeSparklineData handles number arrays, objects, and filters NaN', () => {
  assert.deepEqual(normalizeSparklineData([10, NaN, 25]), [
    { index: 0, value: 10 },
    { index: 2, value: 25 },
  ]);
  assert.deepEqual(normalizeSparklineData([{ v: 4 }, { v: 9 }], 'v'), [
    { index: 0, value: 4 },
    { index: 1, value: 9 },
  ]);
});

test('computeProgressMetrics clamps values cleanly without NaN', () => {
  assert.deepEqual(computeProgressMetrics(150, 100), {
    clampedValue: 100,
    safeMax: 100,
    percentage: 100,
  });
  assert.deepEqual(computeProgressMetrics(-10, 50), {
    clampedValue: 0,
    safeMax: 50,
    percentage: 0,
  });
  assert.deepEqual(computeProgressMetrics(25, 0), {
    clampedValue: 25,
    safeMax: 100,
    percentage: 25,
  });
});

test('resolveLkStorageKeys isolates storage namespaces per client application', () => {
  const defaultKeys = resolveLkStorageKeys();
  assert.equal(defaultKeys.settings, 'lk_core_preferences_v1');

  const manageKeys = resolveLkStorageKeys('lk-manage');
  assert.equal(manageKeys.settings, 'lk-manage_preferences_v1');
  assert.equal(manageKeys.meta, 'lk-manage_meta_v1');
  assert.equal(manageKeys.history, 'lk-manage_activity_v1');
});

test('sanitizeLkSettings clamps out-of-range optical values and preserves defaults', () => {
  const sanitized = sanitizeLkSettings({
    blurIntensity: 999,
    glassOpacity: 0.1,
    accentColor: 'invalid-hex',
    language: 'fr',
  });
  assert.equal(sanitized.blurIntensity, 32);
  assert.equal(sanitized.glassOpacity, 0.35);
  assert.equal(sanitized.accentColor, DEFAULT_LK_SETTINGS.accentColor);
  assert.equal(sanitized.language, 'fr');
});

test('createLkStore and settings load/save isolate per-app localStorage when window is mocked', () => {
  const storeMap = new Map<string, string>();
  const prevWindow = (globalThis as Record<string, unknown>).window;
  (globalThis as Record<string, unknown>).window = {
    localStorage: {
      getItem: (k: string) => storeMap.get(k) ?? null,
      setItem: (k: string, v: string) => {
        storeMap.set(k, v);
      },
      removeItem: (k: string) => {
        storeMap.delete(k);
      },
    },
  };

  try {
    saveLkSettings({ ...DEFAULT_LK_SETTINGS, accentColor: '#4C8DFF' }, 'lk-manage');
    const loadedManage = loadLkSettings('lk-manage');
    const loadedCore = loadLkSettings();

    assert.equal(loadedManage.accentColor, '#4C8DFF');
    assert.equal(loadedCore.accentColor, DEFAULT_LK_SETTINGS.accentColor);

    const bizStore = createLkStore('lk_manage_tasks_v1', { count: 0 });
    bizStore.save({ count: 7 });
    assert.deepEqual(bizStore.load(), { count: 7 });
  } finally {
    (globalThis as Record<string, unknown>).window = prevWindow;
  }
});

test('contrast and token exporters produce valid accessible outputs', () => {
  assert.equal(normalizeHex('abc'), '#AABBCC');
  assert.equal(pickAccessibleForeground('#D6B56D'), '#090A0D');
  const audit = evaluateContrast('#FFFFFF', '#090A0D');
  assert.equal(audit.passesAAA, true);

  const payload = buildPlatformTokenPayload(DEFAULT_LK_SETTINGS, 'dark');
  assert.equal(payload.schema, 'lk.core.tokens/1.0');
  const css = exportTokensAsCss(DEFAULT_LK_SETTINGS, 'dark');
  assert.ok(css.includes('--lk-accent: #D6B56D;'));
});
