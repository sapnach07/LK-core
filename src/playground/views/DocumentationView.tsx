import React from 'react';
import { LkButton, LkCard, useLkCore } from '../../lk-core';

const INSTALL_PROVIDER_SNIPPET = `// 1. main.tsx — Charger la feuille de style autonome une seule fois
import { createRoot } from 'react-dom/client';
import '@lk/core/styles.css';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);

// 2. App.tsx — Envelopper l'application avec stockage isolé
import { LkProvider, LkToastRegion } from '@lk/core';

export default function App() {
  return (
    <LkProvider
      storagePrefix="lk-manage"
      defaultSettings={{ language: 'fr', themeMode: 'dark' }}
    >
      <MonEspaceGestion />
      <LkToastRegion />
    </LkProvider>
  );
}`;

const UI_AND_CHARTS_SNIPPET = `import { LkButton, LkCard, LkInput, LkDialog } from '@lk/core/design';
import {
  LkLineChart,
  LkBarChart,
  LkDonutChart,
  LkProgressChart,
  LkSparkline,
} from '@lk/core/charts';

export function TableauDeBord({ ventes, repartition }) {
  return (
    <div className="grid gap-6">
      <LkCard title="Revenus mensuels" subtitle="Synchronisé avec LK Themes">
        <LkLineChart
          data={ventes}
          xKey="mois"
          series={[{ key: 'total', label: 'Chiffre d’affaires (€)' }]}
          height={260}
        />
      </LkCard>
      <LkDonutChart
        data={repartition}
        centerValue="98%"
        centerLabel="Objectif"
      />
    </div>
  );
}`;

const THEME_CUSTOM_SNIPPET = `import { useLkTheme, useLkSettings } from '@lk/core/themes';
import { LkQuickSettingsPanel } from '@lk/core/settings';
import { LkButton } from '@lk/core/design';

export function BarreTheme() {
  const { resolvedTheme, updateSettings, applyThemePreset } = useLkTheme();

  return (
    <div className="flex items-center gap-3">
      <LkButton
        variant="secondary"
        onClick={() =>
          updateSettings({ themeMode: resolvedTheme === 'dark' ? 'light' : 'dark' })
        }
      >
        Basculer clair/sombre
      </LkButton>
      <LkButton onClick={() => updateSettings({ accentColor: '#4C8DFF' })}>
        Accent Cobalt
      </LkButton>
      <LkButton variant="glass" onClick={() => applyThemePreset('obsidian-gold')}>
        Obsidian Gold
      </LkButton>
    </div>
  );
}`;

const KOTLIN_USAGE_SNIPPET = `// 1. Exportez LkCoreTokens.kt depuis l'éditeur de thème
// 2. Branchez-le dans MaterialTheme Jetpack Compose :
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

function renderInlineCode(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, idx) =>
    part.startsWith('`') && part.endsWith('`') ? (
      <code
        key={idx}
        className="px-1.5 py-0.5 rounded font-mono text-[11px]"
        style={{
          backgroundColor: 'var(--lk-surface-muted)',
          color: 'var(--lk-text)',
        }}
      >
        {part.slice(1, -1)}
      </code>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    ),
  );
}

export function DocumentationView() {
  const { notify, dictionary } = useLkCore();
  const d = dictionary.docs;

  const copySnippet = async (label: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      notify({ title: dictionary.notifications.copiedSnippetTitle(label), variant: 'success' });
    } catch {
      notify({
        title: dictionary.notifications.clipboardUnavailableTitle,
        description: dictionary.notifications.clipboardUnavailableDesc,
        variant: 'warning',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--lk-text)' }}>
          {d.title}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--lk-text-secondary)' }}>
          {d.subtitle}
        </p>
      </div>

      {/* 9-Step Checklist */}
      <LkCard title={d.checklistTitle} subtitle={d.checklistSub}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {d.steps.map((step) => (
            <div
              key={step.num}
              className="rounded-xl border p-4 flex flex-col gap-1.5"
              style={{
                backgroundColor: 'var(--lk-surface-solid)',
                borderColor: 'var(--lk-border)',
              }}
            >
              <span
                className="text-xs font-mono font-semibold"
                style={{ color: 'var(--lk-accent-ink)' }}
              >
                {step.num} · {step.title}
              </span>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--lk-text-secondary)' }}>
                {renderInlineCode(step.detail)}
              </p>
            </div>
          ))}
        </div>
      </LkCard>

      {/* Code Examples Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LkCard
          title={d.card1Title}
          subtitle={d.card1Sub}
          action={
            <LkButton
              size="sm"
              variant="secondary"
              leftIcon="Copy"
              onClick={() => copySnippet('LkProvider', INSTALL_PROVIDER_SNIPPET)}
            >
              {dictionary.common.copy}
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
            <code>{INSTALL_PROVIDER_SNIPPET}</code>
          </pre>
        </LkCard>

        <LkCard
          title={d.card2Title}
          subtitle={d.card2Sub}
          action={
            <LkButton
              size="sm"
              variant="secondary"
              leftIcon="Copy"
              onClick={() => copySnippet('LK Charts & UI', UI_AND_CHARTS_SNIPPET)}
            >
              {dictionary.common.copy}
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
            <code>{UI_AND_CHARTS_SNIPPET}</code>
          </pre>
        </LkCard>

        <LkCard
          title={d.card3Title}
          subtitle={d.card3Sub}
          action={
            <LkButton
              size="sm"
              variant="secondary"
              leftIcon="Copy"
              onClick={() => copySnippet('LK Themes', THEME_CUSTOM_SNIPPET)}
            >
              {dictionary.common.copy}
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
            <code>{THEME_CUSTOM_SNIPPET}</code>
          </pre>
        </LkCard>

        <LkCard
          title={d.card4Title}
          subtitle={d.card4Sub}
          action={
            <LkButton
              size="sm"
              variant="secondary"
              leftIcon="Copy"
              onClick={() => copySnippet('Kotlin', KOTLIN_USAGE_SNIPPET)}
            >
              {dictionary.common.copy}
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

      {/* 10 Public Modules */}
      <LkCard title={d.moduleMapTitle} subtitle={d.moduleMapSub.replace(/`/g, '')}>
        <div className="divide-y text-sm" style={{ borderColor: 'var(--lk-border)' }}>
          {d.modules.map((row) => (
            <div
              key={row.path}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              style={{ borderColor: 'var(--lk-border)' }}
            >
              <span className="font-mono text-xs font-semibold" style={{ color: 'var(--lk-accent-ink)' }}>
                {row.path}
              </span>
              <span className="text-xs sm:text-right max-w-xl" style={{ color: 'var(--lk-text-secondary)' }}>
                {row.desc}
              </span>
            </div>
          ))}
        </div>
      </LkCard>

      {/* Troubleshooting */}
      <LkCard title={d.troubleshootingTitle} subtitle={d.troubleshootingSub}>
        <div className="divide-y text-sm" style={{ borderColor: 'var(--lk-border)' }}>
          {d.troubleshooting.map((item) => (
            <div
              key={item.symptom}
              className="py-3 flex flex-col gap-1"
              style={{ borderColor: 'var(--lk-border)' }}
            >
              <span className="text-xs font-semibold" style={{ color: 'var(--lk-text)' }}>
                {item.symptom}
              </span>
              <span className="text-xs leading-relaxed" style={{ color: 'var(--lk-text-secondary)' }}>
                {renderInlineCode(item.solution)}
              </span>
            </div>
          ))}
        </div>
      </LkCard>
    </div>
  );
}
