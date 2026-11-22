import React from 'react';
import { LkButton, LkCard, useLkCore } from '../../lk-core';

const REACT_USAGE_SNIPPET = `import {
  LkProvider,
  LkGlassSurface,
  LkButton,
  LkCard,
  LkToastRegion,
  useLkTheme,
  useLkSettings,
} from './lk-core';

export function MyLkApplication() {
  return (
    <LkProvider>
      <main className="min-h-screen p-6">
        <LkCard title="Workspace" subtitle="Powered by LK Core 1.0">
          <LkButton variant="primary">Save Changes</LkButton>
        </LkCard>
      </main>
      <LkToastRegion />
    </LkProvider>
  );
}`;

const KOTLIN_USAGE_SNIPPET = `// 1. Export LkCoreTokens.kt from the Theme Editor tab
// 2. Wire into Jetpack Compose MaterialTheme:
@Composable
fun LkHybridTheme(content: @Composable () -> Unit) {
    val colorScheme = darkColorScheme(
        primary = LkCoreTokens.Accent,
        onPrimary = LkCoreTokens.OnAccent,
        background = LkCoreTokens.Background,
        surface = LkCoreTokens.Surface,
        onSurface = LkCoreTokens.TextPrimary
    )
    MaterialTheme(colorScheme = colorScheme, content = content)
}`;

export function DocumentationView() {
  const { notify } = useLkCore();

  const copySnippet = async (label: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      notify({ title: `${label} copied`, variant: 'success' });
    } catch {
      notify({ title: 'Copy unavailable', variant: 'warning' });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--lk-text)' }}>
          LK Core Integration Guide
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--lk-text-secondary)' }}>
          Drop-in architecture for Google AI Studio React applications and Android Jetpack Compose
          token parity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LkCard
          title="1. Wrap Your React App in LkProvider"
          subtitle="Provides theme tokens, persistent local settings, i18n, and toast dispatching."
          action={
            <LkButton
              size="sm"
              variant="secondary"
              leftIcon="Copy"
              onClick={() => copySnippet('React snippet', REACT_USAGE_SNIPPET)}
            >
              Copy
            </LkButton>
          }
        >
          <pre
            className="rounded-xl border p-4 text-xs font-mono overflow-x-auto leading-relaxed"
            style={{
              backgroundColor: 'var(--lk-bg)',
              borderColor: 'var(--lk-border)',
              color: 'var(--lk-text-secondary)',
            }}
          >
            <code>{REACT_USAGE_SNIPPET}</code>
          </pre>
        </LkCard>

        <LkCard
          title="2. Platform-Neutral Android / Kotlin Integration"
          subtitle="Use the Theme Editor exporter to generate LkCoreTokens.kt for Compose apps."
          action={
            <LkButton
              size="sm"
              variant="secondary"
              leftIcon="Copy"
              onClick={() => copySnippet('Kotlin snippet', KOTLIN_USAGE_SNIPPET)}
            >
              Copy
            </LkButton>
          }
        >
          <pre
            className="rounded-xl border p-4 text-xs font-mono overflow-x-auto leading-relaxed"
            style={{
              backgroundColor: 'var(--lk-bg)',
              borderColor: 'var(--lk-border)',
              color: 'var(--lk-text-secondary)',
            }}
          >
            <code>{KOTLIN_USAGE_SNIPPET}</code>
          </pre>
        </LkCard>
      </div>

      <LkCard
        title="Module Map & Separation of Concerns"
        subtitle="Each module in src/lk-core/ encapsulates one responsibility with zero mandatory backend dependencies."
      >
        <div className="divide-y text-sm" style={{ borderColor: 'var(--lk-border)' }}>
          {[
            {
              path: 'lk-core/tokens',
              desc: 'Platform-neutral color palette, spacing, typography, WCAG contrast math, and JSON/CSS/Kotlin exporters.',
            },
            {
              path: 'lk-core/storage',
              desc: 'Schema-sanitized localStorage engine with UTF-8 byte calculation and JSON import/export.',
            },
            {
              path: 'lk-core/themes',
              desc: 'LkProvider context synchronizing CSS custom properties and light/dark/system resolution.',
            },
            {
              path: 'lk-core/glass',
              desc: 'LkGlassSurface, LkGlassPanel, and LkGlassHeader with specular edge highlights and blur control.',
            },
            {
              path: 'lk-core/motion',
              desc: 'Compositor-safe motion wrappers obeying user animation level and speed preferences.',
            },
            {
              path: 'lk-core/design',
              desc: 'Reusable UI primitives (Button, Card, Input, Select, Switch, Slider, Dialog, Dropdown, Toast).',
            },
          ].map((row) => (
            <div
              key={row.path}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              style={{ borderColor: 'var(--lk-border)' }}
            >
              <span className="font-mono text-xs font-semibold" style={{ color: 'var(--lk-accent)' }}>
                {row.path}
              </span>
              <span className="text-xs sm:text-right max-w-xl" style={{ color: 'var(--lk-text-secondary)' }}>
                {row.desc}
              </span>
            </div>
          ))}
        </div>
      </LkCard>
    </div>
  );
}
