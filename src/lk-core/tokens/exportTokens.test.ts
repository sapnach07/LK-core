import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LK_SETTINGS } from '../storage/lkStorage';
import {
  exportTokensAsJson,
  exportTokensAsCss,
  exportTokensAsKotlinCompose,
} from './exportTokens';

test('exportTokensAsJson produces valid JSON with LK Core schema', () => {
  const json = exportTokensAsJson(DEFAULT_LK_SETTINGS, 'dark');
  const parsed = JSON.parse(json) as { schema: string; colors: { semantic: { accent: string } } };
  assert.equal(parsed.schema, 'lk.core.tokens/1.0');
  assert.equal(parsed.colors.semantic.accent, '#D6B56D');
});

test('exportTokensAsCss reflects blur disabled when glassEnabled is false', () => {
  const css = exportTokensAsCss({ ...DEFAULT_LK_SETTINGS, glassEnabled: false }, 'light');
  assert.match(css, /--lk-blur:\s*0px;/);
  assert.match(css, /--lk-bg:\s*#F5F6F8;/);
});

test('exportTokensAsKotlinCompose generates Jetpack Compose Color object', () => {
  const kt = exportTokensAsKotlinCompose(DEFAULT_LK_SETTINGS, 'dark');
  assert.match(kt, /object LkCoreTokens/);
  assert.match(kt, /val LkGold = Color\(0xFFD6B56D\)/);
  assert.match(kt, /val GlassBlurRadius = 18\.dp/);
});
